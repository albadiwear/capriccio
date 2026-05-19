import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Send, Bot, User, MessageCircle, Paperclip, X, Zap, ShoppingBag, Link } from 'lucide-react'

const TELEGRAM_ICON = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#229ED9]">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
  </svg>
)

const WHATSAPP_ICON = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#25D366]">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.42 5.83c0 4.54-3.7 8.23-8.25 8.23-1.52 0-3-.41-4.3-1.19l-.31-.18-3.12.82.83-3.04-.2-.32a8.17 8.17 0 0 1-1.25-4.35c0-4.54 3.7-8.23 8.24-8.23zm-4.53 4.43c-.21 0-.56.08-.85.39-.29.32-1.12 1.1-1.12 2.67 0 1.57 1.15 3.09 1.31 3.31.16.21 2.23 3.55 5.5 4.83 2.72 1.07 3.27.86 3.86.8.59-.05 1.9-.77 2.17-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37-.32-.16-1.9-.94-2.19-1.04-.29-.11-.51-.16-.72.16-.21.32-.82 1.04-1.01 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.89-1.78-2.21-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.99-2.38-.26-.62-.52-.54-.72-.55-.18-.01-.4-.01-.61-.01z" />
  </svg>
)

export default function ChatDialog({ selectedChat, onClose, compact = false }) {
  const [chatData, setChatData] = useState(selectedChat || null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [showLinkPicker, setShowLinkPicker] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const fileInputRef = useRef(null)
  const bottomRef = useRef(null)

  const TEMPLATES = [
    'Добрый день! 👋 Меня зовут Амина, я ваш персональный стилист Capriccio',
    'Сейчас уточню и вернусь к вам в течение нескольких минут 🌸',
    'Отличный выбор! Эта вещь очень популярна у наших клиентов ✨',
    'Для оформления заказа напишите мне в WhatsApp или нажмите кнопку выше',
    'Есть вопросы по размеру? Я помогу подобрать идеальный вариант 👗',
    'Доставка по всему Казахстану, обычно 2-3 дня 📦',
  ]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setChatData(selectedChat || null)
    setInput('')
    setMessages([])
    clearImage()
  }, [selectedChat?.id])

  useEffect(() => {
    if (!selectedChat?.id) return

    let active = true

    async function loadConversation() {
      setLoadingMessages(true)
      try {
        const [messagesRes, chatRes] = await Promise.all([
          supabase.from('stylist_messages').select('*').eq('chat_id', selectedChat.id).order('created_at', { ascending: true }),
          supabase.from('stylist_chats').select('*').eq('id', selectedChat.id).maybeSingle(),
        ])

        const nextChat = { ...selectedChat, ...(chatRes.data || {}) }
        let userData = nextChat.users || null

        if (nextChat.user_id) {
          const { data: userRes } = await supabase
            .from('users')
            .select('id, full_name, email, phone, avatar_url')
            .eq('id', nextChat.user_id)
            .maybeSingle()
          userData = userRes || userData
        }

        if (!active) return

        setChatData({
          ...nextChat,
          users: userData,
          avatar_url: nextChat.avatar_url || userData?.avatar_url || null,
        })
        setMessages(messagesRes.data || [])

        await supabase
          .from('stylist_chats')
          .update({ last_read_at: new Date().toISOString() })
          .eq('id', selectedChat.id)
      } catch (error) {
        void error
      } finally {
        if (active) setLoadingMessages(false)
      }
    }

    loadConversation()

    const channel = supabase
      .channel(`chat-dialog-${selectedChat.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'stylist_messages',
        filter: `chat_id=eq.${selectedChat.id}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [selectedChat?.id])

  async function handleTakeover() {
    if (!chatData?.id) return
    try {
      await supabase
        .from('stylist_chats')
        .update({ mode: 'human', handoff_requested: false })
        .eq('id', chatData.id)
      setChatData(prev => prev ? { ...prev, mode: 'human', handoff_requested: false } : prev)
    } catch (error) {
      void error
    }
  }

  async function handleRelease() {
    if (!chatData?.id) return
    try {
      await supabase.from('stylist_chats').update({ mode: 'ai' }).eq('id', chatData.id)
      setChatData(prev => prev ? { ...prev, mode: 'ai' } : prev)
    } catch (error) {
      void error
    }
  }

  async function sendMessage(customText = null) {
    const messageText = customText || input.trim()
    if ((!messageText && !imageFile) || !chatData?.id) return

    if (!customText) setSending(true)

    try {
      let imageUrl = null

      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${chatData.id}/${Date.now()}.${ext}`
        const { data: uploadData } = await supabase.storage
          .from('chat-images')
          .upload(path, imageFile, { upsert: true })

        if (uploadData) {
          const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(path)
          imageUrl = urlData.publicUrl
        }

        clearImage()
      }

      await supabase.from('stylist_messages').insert({
        chat_id: chatData.id,
        role: 'manager',
        content: messageText || '',
        image_url: imageUrl,
      })

      if (messageText && (chatData.source === 'telegram' || chatData.source === 'whatsapp')) {
        const endpoint =
          chatData.source === 'whatsapp' ? '/api/whatsapp-send' : '/api/telegram-send'
        const { data: { session } } = await supabase.auth.getSession()
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ chat_id: chatData.id, text: messageText }),
        })
      }

      await supabase
        .from('stylist_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatData.id)

      setChatData(prev => prev ? { ...prev, updated_at: new Date().toISOString(), last_message: messageText || prev.last_message } : prev)

      if (!customText) setInput('')
    } catch (error) {
      void error
    } finally {
      if (!customText) setSending(false)
    }
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (imagePreview) URL.revokeObjectURL(imagePreview)

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function searchProducts(query, category = '') {
    setProductSearch(query)

    let q = supabase
      .from('products')
      .select('id, name, price, images, category')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (category && category !== 'Все') {
      q = q.ilike('category', `%${category}%`)
    } else if (query.trim()) {
      q = q.ilike('name', `%${query}%`)
    } else {
      setProductResults([])
      return
    }

    try {
      const { data } = await q
      setProductResults(data || [])
    } catch (error) {
      void error
      setProductResults([])
    }
  }

  async function sendProduct(product) {
    if (!chatData?.id) return

    const imageUrl = Array.isArray(product.images) ? product.images[0] : product.images
    const productUrl = `https://www.capriccio.kz/product/${product.id}`

    try {
      await supabase.from('stylist_messages').insert({
        chat_id: chatData.id,
        role: 'manager',
        content: '',
        product_data: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: imageUrl,
        },
      })

      await supabase
        .from('stylist_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatData.id)

      if (chatData.source === 'telegram' || chatData.source === 'whatsapp') {
        const caption = `${product.name}\n💰 ${Number(product.price).toLocaleString('ru-RU')} ₸\n🔗 ${productUrl}`
        const endpoint =
          chatData.source === 'whatsapp'
            ? '/api/whatsapp-send-photo'
            : '/api/telegram-send-photo'
        const { data: { session } } = await supabase.auth.getSession()
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            chat_id: chatData.id,
            photo: imageUrl,
            caption,
          }),
        })
      }

      setShowProductPicker(false)
      setShowLinkPicker(false)
      setProductSearch('')
      setProductResults([])
    } catch (error) {
      void error
    }
  }

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f9f8f6]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <MessageCircle size={20} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-400">Выберите чат слева</p>
        </div>
      </div>
    )
  }

  const userName = chatData?.users?.full_name || chatData?.users?.email || chatData?.title || 'Аноним'
  const userPhone = chatData?.users?.phone || chatData?.title || ''

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-white relative">
      <div className={`border-b border-gray-100 flex items-center justify-between bg-white ${compact ? 'px-3 py-2.5' : 'px-4 py-3'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`${compact ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm'} rounded-full bg-pink-100 flex items-center justify-center font-medium text-pink-700 overflow-hidden flex-shrink-0`}>
            {chatData?.avatar_url
              ? <img src={chatData.avatar_url} alt="" className="w-full h-full object-cover" />
              : <span>{userName.charAt(0).toUpperCase()}</span>
            }
          </div>
          <div className="min-w-0">
            <p className={`font-medium text-gray-900 truncate ${compact ? 'text-xs' : 'text-sm'}`}>{userName}</p>
            <p className={`${compact ? 'text-[11px]' : 'text-xs'} text-gray-500 truncate`}>{userPhone}</p>
            {chatData?.source === 'telegram' && (
              <span className="flex items-center gap-1 text-xs text-[#229ED9]">
                <TELEGRAM_ICON /> Telegram
              </span>
            )}
            {chatData?.source === 'whatsapp' && (
              <span className="flex items-center gap-1 text-xs text-[#25D366]">
                <WHATSAPP_ICON /> WhatsApp
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {chatData?.mode === 'ai' ? (
            <button
              type="button"
              onClick={handleTakeover}
              className={`flex items-center gap-1.5 rounded-lg bg-[#D4537E] text-white font-medium hover:bg-[#c44370] ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-1.5 text-sm'}`}
            >
              <User size={compact ? 12 : 14} />
              Подключиться
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRelease}
              className={`flex items-center gap-1.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-1.5 text-sm'}`}
            >
              <Bot size={compact ? 12 : 14} />
              Отпустить ИИ
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto space-y-2 bg-[#f9f8f6] ${compact ? 'px-3 py-3' : 'px-4 py-4'}`}>
        {loadingMessages && messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">Загрузка переписки...</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${compact ? 'text-xs' : 'text-sm'} ${
              msg.role === 'user'
                ? 'bg-[#1a1a18] text-white rounded-tr-sm'
                : msg.role === 'manager'
                ? 'bg-[#D4537E] text-white rounded-tl-sm'
                : 'bg-white text-gray-900 rounded-tl-sm border border-gray-100'
            }`}>
              {msg.role === 'assistant' && (
                <p className="text-xs text-gray-400 mb-1 font-medium">Амина ИИ</p>
              )}
              {msg.role === 'manager' && (
                <p className="text-xs text-white/70 mb-1 font-medium">Стилист</p>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              {msg.image_url && (
                <img
                  src={msg.image_url}
                  alt="фото"
                  className="mt-2 rounded-xl max-w-[240px] cursor-pointer"
                  onClick={() => window.open(msg.image_url, '_blank')}
                />
              )}
              {msg.product_data && (
                <div className="mt-2 bg-white/20 rounded-xl overflow-hidden max-w-[200px]">
                  {msg.product_data.image && (
                    <img src={msg.product_data.image} alt={msg.product_data.name} className="w-full h-32 object-cover" />
                  )}
                  <div className="p-2">
                    <p className="text-xs font-medium leading-tight">{msg.product_data.name}</p>
                    <p className="text-xs font-semibold mt-1">
                      {Number(msg.product_data.price).toLocaleString('ru-RU')} ₸
                    </p>
                  </div>
                </div>
              )}
              <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/50' : msg.role === 'manager' ? 'text-white/60' : 'text-gray-400'}`}>
                {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {chatData?.mode === 'human' ? (
        <div className={`border-t border-gray-100 bg-white ${compact ? 'px-3 py-2.5' : 'px-4 py-3'}`}>
          {showTemplates && (
            <div className="mb-2 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              {TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setInput(t); setShowTemplates(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          {imagePreview && (
            <div className="relative inline-block mb-2">
              <img src={imagePreview} alt="preview" className="h-20 rounded-xl border border-gray-200" />
              <button type="button" onClick={clearImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center">
                <X size={10} className="text-white" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 flex-shrink-0"
            >
              <Paperclip size={16} />
            </button>
            <button
              type="button"
              onClick={() => setShowTemplates(p => !p)}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors ${showTemplates ? 'bg-[#1a1a18] border-[#1a1a18] text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              <Zap size={16} />
            </button>
            <button
              type="button"
              onClick={() => { setShowLinkPicker(false); setShowProductPicker(true) }}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 flex-shrink-0"
            >
              <ShoppingBag size={16} />
            </button>
            <button
              type="button"
              onClick={() => { setShowLinkPicker(true); setShowProductPicker(true) }}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 flex-shrink-0"
            >
              <Link size={16} />
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Написать от имени Амины..."
              className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none border border-gray-200 focus:border-gray-900"
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={sending || (!input.trim() && !imageFile)}
              className="w-10 h-10 rounded-xl bg-[#1a1a18] flex items-center justify-center disabled:opacity-40 flex-shrink-0"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div className={`border-t border-gray-100 bg-white text-center ${compact ? 'px-3 py-2.5' : 'px-4 py-3'}`}>
          <p className="text-sm text-gray-400">
            Сейчас отвечает ИИ Амина ·{' '}
            <button type="button" onClick={handleTakeover} className="text-[#D4537E] hover:underline">
              Подключиться
            </button>
          </p>
        </div>
      )}

      {showProductPicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setShowProductPicker(false); setShowLinkPicker(false) }}>
          <div className="bg-white rounded-2xl w-[680px] max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-gray-900 text-base">
                  {showLinkPicker ? 'Вставить ссылку на товар' : 'Выбрать товар'}
                </p>
                <button type="button" onClick={() => { setShowProductPicker(false); setShowLinkPicker(false) }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <input
                autoFocus
                type="text"
                value={productSearch}
                onChange={e => searchProducts(e.target.value, '')}
                placeholder="Поиск по названию или артикулу..."
                className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none border border-gray-200 focus:border-gray-900 mb-3"
              />
              <div className="flex gap-2 flex-wrap">
                {['Все', 'Пуховики', 'Костюмы', 'Платья', 'Трикотаж', 'Обувь', 'Шапки', 'Сумки', 'Аксессуары'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      const q = cat === 'Все' ? '' : cat
                      setProductSearch(q)
                      searchProducts(q, cat)
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                      (cat === 'Все' && !productSearch) || productSearch === cat
                        ? 'bg-[#1a1a18] text-white border-[#1a1a18]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {productResults.length === 0 && productSearch && (
                <p className="text-sm text-gray-400 text-center py-8">Ничего не найдено</p>
              )}
              {productResults.length === 0 && !productSearch && (
                <p className="text-sm text-gray-400 text-center py-8">Введите название или выберите категорию</p>
              )}
              <div className="grid grid-cols-3 gap-3">
                {productResults.map(product => {
                  const img = Array.isArray(product.images) ? product.images[0] : product.images
                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        if (showLinkPicker) {
                          const productUrl = `https://www.capriccio.kz/product/${product.id}`
                          const linkText = `${product.name} — ${Number(product.price).toLocaleString('ru-RU')} ₸\n${productUrl}`
                          setInput(linkText)
                          setShowLinkPicker(false)
                          setShowProductPicker(false)
                          setProductSearch('')
                          setProductResults([])
                        } else {
                          sendProduct(product)
                        }
                      }}
                      className="cursor-pointer rounded-xl border border-gray-100 overflow-hidden hover:border-[#D4537E] hover:shadow-sm transition-all group"
                    >
                      <div className="relative">
                        {img
                          ? <img src={img} alt={product.name} className="w-full h-36 object-cover" />
                          : <div className="w-full h-36 bg-gray-100 flex items-center justify-center"><ShoppingBag size={24} className="text-gray-300" /></div>
                        }
                        <div className="absolute inset-0 bg-[#D4537E]/0 group-hover:bg-[#D4537E]/10 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 bg-[#D4537E] text-white text-xs px-3 py-1.5 rounded-full font-medium transition-opacity">
                            {showLinkPicker ? 'Вставить ссылку' : 'Отправить'}
                          </span>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-medium text-gray-900 leading-tight line-clamp-2 mb-1">{product.name}</p>
                        <p className="text-xs text-[#D4537E] font-semibold">{Number(product.price).toLocaleString('ru-RU')} ₸</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
