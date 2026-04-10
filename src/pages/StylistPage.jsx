import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { History, Plus, Send, Sparkles, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const STYLIST_PROMPT = `
Ты — персональный стилист Capriccio.
Помогаешь женщинам 35+ из Казахстана и СНГ
находить свой стиль и выглядеть лучше.

Отвечай на том языке на котором пишет пользователь
(русский или казахский).

Твои задачи:
- Давать советы по стилю, образам, гардеробу
- Помогать подобрать образ под случай, тип фигуры, цветотип
- Рекомендовать товары из каталога Capriccio

Когда рекомендуешь товары — в конце ответа добавь JSON блок:
<products>{"search": "ключевые слова для поиска товара"}</products>

Например если советуешь пуховик — добавь:
<products>{"search": "пуховик"}</products>

Если советуешь костюм и платье:
<products>{"search": "костюм"}</products>

Тон: тёплый, дружеский, как подруга которая разбирается в моде.
Не используй сложные термины. Будь конкретной и практичной.
Максимум 3-4 абзаца в ответе.
`

const QUICK_QUESTIONS = [
  'Хочу образ для деловой встречи',
  'Помоги с капсульным гардеробом',
  'Что носить женщине 40+?',
  'Хочу выглядеть моложе',
]

export default function StylistPage() {
  const { user } = useAuthStore()

  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (user) loadChats()
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const loadChats = async () => {
    const { data } = await supabase
      .from('stylist_chats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setChats(data || [])
  }

  const loadMessages = async (chatId) => {
    const { data } = await supabase
      .from('stylist_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const createChat = async () => {
    const { data } = await supabase
      .from('stylist_chats')
      .insert({ user_id: user.id, title: 'Новый диалог' })
      .select()
      .single()
    setActiveChatId(data.id)
    setMessages([])
    setShowHistory(false)
    await loadChats()
  }

  const selectChat = async (chatId) => {
    setActiveChatId(chatId)
    await loadMessages(chatId)
    setShowHistory(false)
  }

  const sendMessage = async (text) => {
    const userMessage = (text || input).trim()
    if (!userMessage || loading) return

    setInput('')
    setLoading(true)

    // Авто-ресайз textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Создать чат если нет активного
    let chatId = activeChatId
    if (!chatId) {
      const { data } = await supabase
        .from('stylist_chats')
        .insert({ user_id: user.id, title: userMessage.slice(0, 50) })
        .select()
        .single()
      chatId = data.id
      setActiveChatId(chatId)
      await loadChats()
    }

    // Сохранить сообщение пользователя
    await supabase.from('stylist_messages').insert({
      chat_id: chatId,
      role: 'user',
      content: userMessage,
    })

    const optimisticUser = {
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticUser])

    // История для API
    const history = messages.map((m) => ({ role: m.role, content: m.content }))

    try {
      // Edge Functions require the user's access token for auth-protected endpoints
      const { data: { session } } = await supabase.auth.getSession()

      const { data, error } = await supabase.functions.invoke('stylist', {
        body: {
          system: STYLIST_PROMPT,
          messages: [...history, { role: 'user', content: userMessage }],
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      })

      if (error) {
        console.error('Stylist error:', error)
        throw error
      }

      console.log('Stylist response:', data)
      const rawText = data?.content?.[0]?.text

      if (!rawText) {
        throw new Error('Empty response from stylist')
      }

      const productMatch = rawText.match(/<products>(.*?)<\/products>/s)
      const cleanText = rawText.replace(/<products>.*?<\/products>/s, '').trim()

      let products = []
      let productIds = []

      if (productMatch) {
        try {
          const { search } = JSON.parse(productMatch[1])
          const { data: found } = await supabase
            .from('products')
            .select('id, name, price, sale_price, images, category')
            .ilike('name', `%${search}%`)
            .eq('is_active', true)
            .limit(3)
          products = found || []
          productIds = products.map((p) => p.id)
        } catch {
          // продолжить без товаров
        }
      }

      await supabase.from('stylist_messages').insert({
        chat_id: chatId,
        role: 'assistant',
        content: cleanText,
        product_ids: productIds.length > 0 ? productIds : null,
      })

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: cleanText,
          products: products.length > 0 ? products : undefined,
          created_at: new Date().toISOString(),
        },
      ])

      // Обновить заголовок чата первым сообщением
      if (messages.length === 0) {
        await supabase
          .from('stylist_chats')
          .update({ title: userMessage.slice(0, 50) })
          .eq('id', chatId)
        await loadChats()
      }
    } catch (e) {
      console.error('Full error:', e)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Произошла ошибка: ' + e.message,
          created_at: new Date().toISOString(),
        },
      ])
    }

    setLoading(false)
  }

  // --- Shared UI blocks ---

  const ChatHeader = (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0ede8] flex-shrink-0 bg-white">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#1a1a18] flex items-center justify-center">
          <Sparkles size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-medium">Стилист Capriccio</p>
          <p className="text-xs text-[#1D9E75] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] inline-block" />
            онлайн
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setShowHistory(true)}
        className="flex items-center gap-1.5 text-xs text-[#888780] border border-[#e0ddd8] rounded-full px-3 py-1.5"
      >
        <History size={13} />
        История
      </button>
    </div>
  )

  const EmptyState = (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-16 h-16 rounded-full bg-[#FBEAF0] flex items-center justify-center mb-4">
        <Sparkles size={28} className="text-[#D4537E]" />
      </div>
      <h3 className="font-medium text-[#1a1a18] mb-2">Привет! Я твой стилист</h3>
      <p className="text-sm text-[#888780] max-w-xs mb-6">
        Помогу подобрать образ, разобраться с гардеробом или найти идеальный лук для любого случая
      </p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setInput(q)}
            className="border border-[#e0ddd8] rounded-2xl px-4 py-3 text-sm text-[#1a1a18] text-left hover:border-[#1a1a18] active:bg-[#f5f2ed]"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )

  const MessageList = (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3">
      {messages.length === 0 && !loading ? EmptyState : null}

      {messages.map((msg, i) => (
        <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          {msg.role === 'assistant' && (
            <div className="w-7 h-7 rounded-full bg-[#1a1a18] flex items-center justify-center flex-shrink-0 mt-1">
              <Sparkles size={12} className="text-white" />
            </div>
          )}
          <div className="flex flex-col gap-2 max-w-[80%]">
            <div
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#1a1a18] text-white rounded-tr-sm'
                  : 'bg-[#f5f2ed] text-[#1a1a18] rounded-tl-sm'
              }`}
            >
              {msg.content}
            </div>

            {msg.products && msg.products.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {msg.products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="flex-shrink-0 w-24 border border-[#f0ede8] rounded-xl overflow-hidden"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-[#f0ede8]">
                      <img
                        src={product.images?.[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-1.5">
                      <p className="text-[10px] text-[#1a1a18] leading-tight line-clamp-2 mb-0.5">
                        {product.name}
                      </p>
                      <p className="text-[10px] font-medium">
                        {Number(product.sale_price || product.price || 0).toLocaleString('ru-RU')} ₸
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex gap-2">
          <div className="w-7 h-7 rounded-full bg-[#1a1a18] flex items-center justify-center flex-shrink-0">
            <Sparkles size={12} className="text-white" />
          </div>
          <div className="bg-[#f5f2ed] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#888780] animate-bounce [animation-delay:0ms]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#888780] animate-bounce [animation-delay:150ms]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#888780] animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )

  const InputArea = (
    <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-[#f0ede8]">
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder="Напиши что хочешь найти..."
          rows={1}
          className="flex-1 bg-[#f5f2ed] rounded-2xl px-4 py-3 text-sm outline-none resize-none text-[#1a1a18] placeholder:text-[#aaa] overflow-hidden"
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <button
          type="button"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="w-11 h-11 rounded-2xl bg-[#1a1a18] flex items-center justify-center flex-shrink-0 disabled:opacity-30 active:scale-95 transition-transform"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  )

  const ChatListContent = (
    <>
      <div className="p-4 border-b border-[#f0ede8]">
        <button
          type="button"
          onClick={createChat}
          className="w-full bg-[#1a1a18] text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#333] transition-colors"
        >
          <Plus size={16} />
          Новый диалог
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 && (
          <p className="px-4 py-6 text-xs text-[#888780] text-center">Диалогов пока нет</p>
        )}
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => selectChat(chat.id)}
            className={`px-4 py-3 cursor-pointer border-b border-[#f0ede8] hover:bg-[#f5f2ed] transition-colors
              ${activeChatId === chat.id ? 'bg-[#f5f2ed]' : ''}`}
          >
            <p className="text-sm font-medium text-[#1a1a18] truncate">{chat.title}</p>
            <p className="text-xs text-[#888780] mt-0.5">
              {new Date(chat.created_at).toLocaleDateString('ru')}
            </p>
          </div>
        ))}
      </div>
    </>
  )

  return (
    <div className="flex bg-white h-[calc(100dvh-120px)] md:h-[calc(100vh-52px)]">
      {/* Десктоп: левая панель */}
      <div className="hidden md:flex w-72 border-r border-[#f0ede8] flex-col flex-shrink-0">
        {ChatListContent}
      </div>

      {/* Основная колонка */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {ChatHeader}

        {/* Сообщения */}
        {MessageList}

        {/* Поле ввода */}
        {InputArea}
      </div>

      {/* Мобиль: drawer с историей чатов */}
      {showHistory && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setShowHistory(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium">История диалогов</p>
              <button type="button" onClick={() => setShowHistory(false)}>
                <X size={20} className="text-[#888780]" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                createChat()
                setShowHistory(false)
              }}
              className="w-full bg-[#1a1a18] text-white py-3 rounded-xl text-sm font-medium mb-3 flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Новый диалог
            </button>
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  selectChat(chat.id)
                  setShowHistory(false)
                }}
                className={`px-4 py-3 rounded-xl cursor-pointer mb-1 ${
                  activeChatId === chat.id ? 'bg-[#f5f2ed]' : 'hover:bg-[#f5f2ed]'
                }`}
              >
                <p className="text-sm font-medium truncate">{chat.title}</p>
                <p className="text-xs text-[#888780]">
                  {new Date(chat.created_at).toLocaleDateString('ru')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
