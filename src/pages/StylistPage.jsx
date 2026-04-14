import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { History, Plus, Send, Sparkles, X, Paperclip, Image } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const buildSystemPrompt = (profile) => {
  const profileInfo = profile ? `
Профиль клиента:
- Имя: ${profile.name || 'не указано'}
- Возраст: ${profile.age || 'не указан'}
- Рост: ${profile.height ? profile.height + ' см' : 'не указан'}
- Вес: ${profile.weight ? profile.weight + ' кг' : 'не указан'}
- Размер одежды: ${profile.clothing_size || 'не указан'}
- Тип фигуры: ${profile.body_type || 'не определён'}
- Цветотип: ${profile.color_type || 'не определён'}
- Город: ${profile.city || 'не указан'}
- Образ жизни: ${profile.lifestyle || 'не указан'}
- Параметры: грудь ${profile.chest || '?'} / талия ${profile.waist || '?'} / бёдра ${profile.hips || '?'}
- Бюджет: ${profile.budget_min && profile.budget_max ? profile.budget_min + '–' + profile.budget_max + ' ₸' : 'не указан'}
- Предпочтения: ${profile.style_preferences?.join(', ') || 'не указаны'}

${profile.managerNotes?.length > 0 ? `
Заметки менеджера о клиенте (важно учитывать):
${profile.managerNotes.map(n => `- ${n.text}`).join('\n')}
` : ''}
- Заметки: ${profile.notes || ''}
` : 'Профиль клиента ещё не заполнен — нужно познакомиться.'

  return `
Ты — Амина, персональный стилист магазина Capriccio.
Capriccio — премиум интернет-магазин женской одежды для женщин 35+ в Казахстане и СНГ.
Ты одновременно подруга, стилист и продавец-консультант в одном лице.

${profileInfo}

ПРАВИЛА ОБЩЕНИЯ:
- Пиши коротко — 2-4 предложения максимум, как в переписке с подругой
- Задавай только ОДИН вопрос за раз, не засыпай вопросами
- Будь тёплой, живой, с юмором — не как робот
- Отвечай на том языке на котором пишет клиент (русский или казахский)
- Никогда не пиши длинные списки — лучше короткий конкретный совет

СБОР ПРОФИЛЯ:
Если профиль не заполнен или заполнен частично — в процессе разговора естественно узнавай:
имя, возраст, рост, размер, тип фигуры, цветотип, бюджет, предпочтения.
Делай это органично, не анкетой. Например: "Кстати, какой у тебя размер? Хочу точнее подобрать"

Когда узнала новые данные о клиенте — в конце ответа добавь блок:
<profile>{"field": "название_поля", "value": "значение"}</profile>

Поля для обновления: name, age, height, clothing_size, body_type, color_type, 
chest, waist, hips, budget_min, budget_max, notes, style_preferences (массив строк)

РАБОТА С КАТАЛОГОМ:
Когда рекомендуешь товары — добавь в конце:
<products>{"search": "ключевые слова", "category": "категория"}</products>

Категории: Пуховики, Костюмы, Платья, Трикотаж, Обувь, Шапки, Сумки, Аксессуары

РАБОТА С ФОТО:
Если клиент прислал фото себя — оцени образ, скажи что работает и что можно улучшить.
Если фото гардероба — скажи что оставить, что убрать и чего не хватает.
Будь честной но тактичной — как настоящая подруга.

СЦЕНАРИИ:
- Клиент идёт на событие → спроси детали (куда, с кем, дресс-код) → предложи конкретный образ → покажи товары
- Клиент хочет обновить гардероб → спроси бюджет и что уже есть → составь капсулу
- Клиент не знает что хочет → задай 1-2 вопроса чтобы понять → предложи направление

Магазин Capriccio предлагает: пуховики, костюмы, платья, трикотаж, обувь, шапки, сумки, аксессуары.
Цены от 8 000 до 150 000 ₸.
`
}

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
  const [profile, setProfile] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const bottomRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (user) {
      loadChats()
      loadProfile()
    }
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const loadProfile = async () => {
    const [{ data: profileData }, { data: notesData }] = await Promise.all([
      supabase.from('stylist_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('lead_notes').select('text, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
    ])
    setProfile(profileData ? { ...profileData, managerNotes: notesData || [] } : null)
  }

  const updateProfile = async (field, value) => {
    const { data: existing } = await supabase
      .from('stylist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      await supabase
        .from('stylist_profiles')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('stylist_profiles')
        .insert({ user_id: user.id, [field]: value })
    }

    setProfile((prev) => ({ ...(prev || { user_id: user.id }), [field]: value }))
  }

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

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const sendMessage = async (text) => {
    const userMessage = (text || input).trim()
    if ((!userMessage && !selectedImage) || loading) return

    setInput('')
    setLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    let chatId = activeChatId
    if (!chatId) {
      const title = userMessage.slice(0, 50) || 'Фото от клиента'
      const { data } = await supabase
        .from('stylist_chats')
        .insert({ user_id: user.id, title })
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
      content: userMessage || '📷 Фото',
    })

    const optimisticUser = {
      role: 'user',
      content: userMessage || '📷 Фото',
      imagePreview: imagePreview,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticUser])

    // Подготовить сообщение для API
    const history = messages.map((m) => ({ role: m.role, content: m.content }))

    let userContent
    if (selectedImage && imagePreview) {
      const base64 = imagePreview.split(',')[1]
      const mediaType = selectedImage.type || 'image/jpeg'
      userContent = [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        },
        ...(userMessage ? [{ type: 'text', text: userMessage }] : [{ type: 'text', text: 'Посмотри на фото и дай совет по стилю' }]),
      ]
    } else {
      userContent = userMessage
    }

    clearImage()

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const { data, error } = await supabase.functions.invoke('stylist', {
        body: {
          system: buildSystemPrompt(profile),
          messages: [...history, { role: 'user', content: userContent }],
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      })

      if (error) throw error

      const rawText = data?.content?.[0]?.text
      if (!rawText) throw new Error('Empty response')

      // Парсим профиль
      const profileMatches = [...rawText.matchAll(/<profile>(.*?)<\/profile>/gs)]
      for (const match of profileMatches) {
        try {
          const { field, value } = JSON.parse(match[1])
          if (field && value !== undefined) {
            await updateProfile(field, value)
          }
        } catch { /* skip */ }
      }

      // Парсим товары
      const productMatch = rawText.match(/<products>(.*?)<\/products>/s)
      const cleanText = rawText
        .replace(/<profile>.*?<\/profile>/gs, '')
        .replace(/<products>.*?<\/products>/gs, '')
        .trim()

      let products = []
      let productIds = []

      if (productMatch) {
        try {
          const { search, category } = JSON.parse(productMatch[1])
          let query = supabase
            .from('products')
            .select('id, name, price, sale_price, images, category')
            .eq('is_active', true)
            .limit(3)

          if (category) {
            query = query.ilike('category', `%${category}%`)
          } else {
            query = query.ilike('name', `%${search}%`)
          }

          const { data: found } = await query
          if (!found || found.length === 0) {
            const { data: fallback } = await supabase
              .from('products')
              .select('id, name, price, sale_price, images, category')
              .eq('is_active', true)
              .ilike('name', `%${search}%`)
              .limit(3)
            products = fallback || []
          } else {
            products = found
          }
          productIds = products.map((p) => p.id)
        } catch { /* skip */ }
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

      if (messages.length === 0) {
        await supabase
          .from('stylist_chats')
          .update({ title: (userMessage || 'Фото').slice(0, 50) })
          .eq('id', chatId)
        await loadChats()
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Что-то пошло не так, попробуй ещё раз 🙈',
          created_at: new Date().toISOString(),
        },
      ])
    }

    setLoading(false)
  }

  // --- UI ---

  const ChatHeader = (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0ede8] flex-shrink-0 bg-white">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#1a1a18] flex items-center justify-center">
          <Sparkles size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-medium">Амина · Стилист Capriccio</p>
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
      <h3 className="font-medium text-[#1a1a18] mb-1">Привет! Я Амина, твой стилист</h3>
      <p className="text-sm text-[#888780] max-w-xs mb-6">
        Помогу собрать образ, разобраться с гардеробом или найти идеальную вещь в каталоге
      </p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => sendMessage(q)}
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
            {msg.imagePreview && (
              <img
                src={msg.imagePreview}
                alt="Фото"
                className="rounded-xl max-w-[200px] max-h-[200px] object-cover"
              />
            )}
            {msg.content && msg.content !== '📷 Фото' && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#1a1a18] text-white rounded-tr-sm'
                    : 'bg-[#f5f2ed] text-[#1a1a18] rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            )}

            {msg.products && msg.products.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {msg.products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="flex-shrink-0 w-24 border border-[#f0ede8] rounded-xl overflow-hidden"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-[#f0ede8]">
                      <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-1.5">
                      <p className="text-[10px] text-[#1a1a18] leading-tight line-clamp-2 mb-0.5">{product.name}</p>
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
      {imagePreview && (
        <div className="relative inline-block mb-2">
          <img src={imagePreview} alt="Preview" className="h-16 w-16 rounded-xl object-cover border border-[#f0ede8]" />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1a1a18] flex items-center justify-center"
          >
            <X size={10} className="text-white" />
          </button>
        </div>
      )}
      <div className="flex gap-2 items-end">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-11 h-11 rounded-2xl bg-[#f5f2ed] flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
        >
          <Paperclip size={16} className="text-[#888780]" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
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
          placeholder="Напиши или прикрепи фото..."
          rows={1}
          className="flex-1 bg-[#f5f2ed] rounded-2xl px-4 py-3 text-sm outline-none resize-none text-[#1a1a18] placeholder:text-[#aaa] overflow-hidden"
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <button
          type="button"
          onClick={() => sendMessage()}
          disabled={loading || (!input.trim() && !selectedImage)}
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
          className="w-full bg-[#1a1a18] text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
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
            className={`px-4 py-3 cursor-pointer border-b border-[#f0ede8] hover:bg-[#f5f2ed] transition-colors ${activeChatId === chat.id ? 'bg-[#f5f2ed]' : ''}`}
          >
            <p className="text-sm font-medium text-[#1a1a18] truncate">{chat.title}</p>
            <p className="text-xs text-[#888780] mt-0.5">{new Date(chat.created_at).toLocaleDateString('ru')}</p>
          </div>
        ))}
      </div>
    </>
  )

  return (
    <div className="flex bg-white h-[calc(100dvh-120px)] md:h-[calc(100vh-52px)]">
      <div className="hidden md:flex w-72 border-r border-[#f0ede8] flex-col flex-shrink-0">
        {ChatListContent}
      </div>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {ChatHeader}
        {MessageList}
        {InputArea}
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setShowHistory(false)}>
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
              onClick={() => { createChat(); setShowHistory(false) }}
              className="w-full bg-[#1a1a18] text-white py-3 rounded-xl text-sm font-medium mb-3 flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Новый диалог
            </button>
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => { selectChat(chat.id); setShowHistory(false) }}
                className={`px-4 py-3 rounded-xl cursor-pointer mb-1 ${activeChatId === chat.id ? 'bg-[#f5f2ed]' : 'hover:bg-[#f5f2ed]'}`}
              >
                <p className="text-sm font-medium truncate">{chat.title}</p>
                <p className="text-xs text-[#888780]">{new Date(chat.created_at).toLocaleDateString('ru')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
