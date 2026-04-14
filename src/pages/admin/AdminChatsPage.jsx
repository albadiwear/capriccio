import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Send, Bot, User, Search, MessageCircle, PanelRightClose, PanelRightOpen, Paperclip, X, Zap, ShoppingBag } from 'lucide-react'

export default function AdminChatsPage() {
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [profile, setProfile] = useState(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const bottomRef = useRef(null)
  const [showProfile, setShowProfile] = useState(true)
  const [unread, setUnread] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])

  const TEMPLATES = [
    'Добрый день! 👋 Меня зовут Амина, я ваш персональный стилист Capriccio',
    'Сейчас уточню и вернусь к вам в течение нескольких минут 🌸',
    'Отличный выбор! Эта вещь очень популярна у наших клиентов ✨',
    'Для оформления заказа напишите мне в WhatsApp или нажмите кнопку выше',
    'Есть вопросы по размеру? Я помогу подобрать идеальный вариант 👗',
    'Доставка по всему Казахстану, обычно 2-3 дня 📦',
  ]

  useEffect(() => {
    loadChats()
    const channel = supabase
      .channel('admin-chats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stylist_chats' }, () => loadChats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stylist_messages' }, (payload) => {
        setMessages(prev => {
          if (prev.length > 0 && prev[0]?.chat_id === payload.new.chat_id) {
            return [...prev, payload.new]
          }
          return prev
        })
        setChats(prev => prev.map(c => c.id === payload.new.chat_id ? { ...c, last_message: payload.new.content } : c))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadChats() {
    const { data } = await supabase
      .from('stylist_chats')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200)
    if (!data) return

    const seen = new Set()
    const unique = data.filter(c => {
      const key = c.user_id || c.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const userIds = [...new Set(unique.map(c => c.user_id).filter(Boolean))]
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, email, phone')
      .in('id', userIds)
    const usersMap = {}
    usersData?.forEach(u => { usersMap[u.id] = u })
    setChats(unique.map(c => ({ ...c, users: usersMap[c.user_id] || null })))

    const counts = {}
    for (const chat of unique) {
      const { count } = await supabase
        .from('stylist_messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chat.id)
        .eq('role', 'user')
        .gt('created_at', chat.last_read_at || '2000-01-01')
      counts[chat.id] = count || 0
    }
    setUnread(counts)
  }

  async function openChat(chat) {
    setSelectedChat(chat)
    setInput('')
    const [{ data: msgs }, { data: profileData }] = await Promise.all([
      supabase.from('stylist_messages').select('*').eq('chat_id', chat.id).order('created_at', { ascending: true }),
      supabase.from('stylist_profiles').select('*').eq('user_id', chat.user_id).single()
    ])
    setMessages(msgs || [])
    setUnread(prev => ({ ...prev, [chat.id]: 0 }))
    await supabase
      .from('stylist_chats')
      .update({ last_read_at: new Date().toISOString() })
      .eq('id', chat.id)
    setProfile(profileData || null)
  }

  async function handleTakeover() {
    await supabase.from('stylist_chats').update({ mode: 'human', handoff_requested: false }).eq('id', selectedChat.id)
    setSelectedChat(prev => ({ ...prev, mode: 'human', handoff_requested: false }))
    setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, mode: 'human', handoff_requested: false } : c))
  }

  async function handleRelease() {
    await supabase.from('stylist_chats').update({ mode: 'ai' }).eq('id', selectedChat.id)
    setSelectedChat(prev => ({ ...prev, mode: 'ai' }))
    setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, mode: 'ai' } : c))
  }

  async function sendMessage() {
    if ((!input.trim() && !imageFile) || !selectedChat) return
    setSending(true)
    
    let image_url = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${selectedChat.id}/${Date.now()}.${ext}`
      const { data: uploadData } = await supabase.storage
        .from('chat-images')
        .upload(path, imageFile, { upsert: true })
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(path)
        image_url = urlData.publicUrl
      }
      clearImage()
    }
  
    await supabase.from('stylist_messages').insert({
      chat_id: selectedChat.id,
      role: 'manager',
      content: input.trim() || '',
      image_url,
    })
    await supabase.from('stylist_chats').update({ updated_at: new Date().toISOString() }).eq('id', selectedChat.id)
    setInput('')
    setSending(false)
  }

  function handleImageSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function searchProducts(query) {
    setProductSearch(query)
    if (!query.trim()) { setProductResults([]); return }
    const { data } = await supabase
      .from('products')
      .select('id, name, price, images')
      .ilike('name', `%${query}%`)
      .eq('is_active', true)
      .limit(10)
    setProductResults(data || [])
  }

  async function sendProduct(product) {
    if (!selectedChat) return
    const imageUrl = Array.isArray(product.images) ? product.images[0] : product.images
    await supabase.from('stylist_messages').insert({
      chat_id: selectedChat.id,
      role: 'manager',
      content: '',
      product_id: product.id,
      product_data: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: imageUrl,
      }
    })
    await supabase.from('stylist_chats').update({ updated_at: new Date().toISOString() }).eq('id', selectedChat.id)
    setShowProductPicker(false)
    setProductSearch('')
    setProductResults([])
  }

  const filteredChats = chats.filter(c => {
    const name = c.users?.full_name || c.users?.email || ''
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || c.title?.toLowerCase().includes(search.toLowerCase())
    if (tab === 'waiting') return matchSearch && c.handoff_requested
    if (tab === 'live') return matchSearch && c.mode === 'human'
    return matchSearch
  })

  const waitingCount = chats.filter(c => c.handoff_requested).length
  const liveCount = chats.filter(c => c.mode === 'human').length

  return (
    <div className="flex h-[calc(100vh-60px)]">

      {/* Левая колонка — список чатов */}
      <div className="w-72 border-r border-gray-100 flex flex-col flex-shrink-0 bg-white">
        <div className="px-4 pt-4 pb-2">
          <h1 className="font-bold text-gray-900 mb-3">Чаты</h1>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 outline-none focus:border-gray-400"
            />
          </div>
          <div className="flex gap-1">
            {[
              { key: 'all', label: 'Все', count: chats.length },
              { key: 'waiting', label: '🔴 Ждут', count: waitingCount },
              { key: 'live', label: '🟢 Live', count: liveCount },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  tab === t.key ? 'bg-[#1a1a18] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.label} {t.count > 0 && <span className="opacity-70">({t.count})</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">Нет чатов</p>
          )}
          {filteredChats.map(chat => (
            <div
              key={chat.id}
              onClick={() => openChat(chat)}
              className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${selectedChat?.id === chat.id ? 'bg-[#f5f2ed]' : ''}`}
            >
              <div className="flex items-center gap-2.5">
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-sm font-medium text-pink-700">
                    {(chat.users?.full_name || chat.users?.email || '?').charAt(0).toUpperCase()}
                  </div>
                  {chat.handoff_requested && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white animate-pulse" />
                  )}
                  {chat.mode === 'human' && !chat.handoff_requested && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {chat.users?.full_name || chat.users?.email || 'Аноним'}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                      {new Date(chat.updated_at || chat.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {unread[chat.id] > 0 && (
                      <span className="ml-1 min-w-[18px] h-[18px] rounded-full bg-[#D4537E] text-white text-[10px] font-bold flex items-center justify-center px-1">
                        {unread[chat.id]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{chat.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Центр — переписка */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-sm font-medium text-pink-700">
                {(selectedChat.users?.full_name || selectedChat.users?.email || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {selectedChat.users?.full_name || selectedChat.users?.email || 'Аноним'}
                </p>
                <p className="text-xs text-gray-500">{selectedChat.users?.phone || selectedChat.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedChat.users?.phone && (
                <a
                  href={`https://wa.me/${selectedChat.users.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-green-600 text-sm hover:border-green-400"
                >
                  <MessageCircle size={14} />
                  WhatsApp
                </a>
              )}
              {selectedChat.mode === 'ai' ? (
                <button onClick={handleTakeover} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#D4537E] text-white text-sm font-medium hover:bg-[#c44370]">
                  <User size={14} />
                  Подключиться
                </button>
              ) : (
                <button onClick={handleRelease} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200">
                  <Bot size={14} />
                  Отпустить ИИ
                </button>
              )}
              <button
                onClick={() => setShowProfile(p => !p)}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                title={showProfile ? 'Скрыть профиль' : 'Показать профиль'}
              >
                {showProfile ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-[#f9f8f6]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[65%] rounded-2xl px-4 py-2.5 text-sm ${
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
                  <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/50' : msg.role === 'manager' ? 'text-white/60' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {selectedChat.mode === 'human' ? (
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              {showTemplates && (
                <div className="mb-2 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  {TEMPLATES.map((t, i) => (
                    <button
                      key={i}
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
                  <img src={imagePreview} className="h-20 rounded-xl border border-gray-200" />
                  <button onClick={clearImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center">
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
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 flex-shrink-0"
                >
                  <Paperclip size={16} />
                </button>
                <button
                  onClick={() => setShowTemplates(p => !p)}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors ${showTemplates ? 'bg-[#1a1a18] border-[#1a1a18] text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                  <Zap size={16} />
                </button>
                <button
                  onClick={() => setShowProductPicker(true)}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 flex-shrink-0"
                >
                  <ShoppingBag size={16} />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Написать от имени Амины..."
                  className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none border border-gray-200 focus:border-gray-900"
                />
                <button onClick={sendMessage} disabled={sending || (!input.trim() && !imageFile)} className="w-10 h-10 rounded-xl bg-[#1a1a18] flex items-center justify-center disabled:opacity-40 flex-shrink-0">
                  <Send size={16} className="text-white" />
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 border-t border-gray-100 bg-white text-center">
              <p className="text-sm text-gray-400">Сейчас отвечает ИИ Амина ·{' '}
                <button onClick={handleTakeover} className="text-[#D4537E] hover:underline">Подключиться</button>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#f9f8f6]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <MessageCircle size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-400">Выберите чат слева</p>
          </div>
        </div>
      )}

      {/* Правая колонка — профиль */}
      {selectedChat && showProfile && (
        <div className="w-64 border-l border-gray-100 flex flex-col flex-shrink-0 bg-white overflow-y-auto">
          <div className="px-4 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Профиль клиента</p>
            {profile ? (
              <div className="space-y-3">
                {profile.city && (
                  <div>
                    <p className="text-xs text-gray-400">Город</p>
                    <p className="text-sm font-medium text-gray-900">{profile.city}</p>
                  </div>
                )}
                {profile.age && (
                  <div>
                    <p className="text-xs text-gray-400">Возраст</p>
                    <p className="text-sm font-medium text-gray-900">{profile.age} лет</p>
                  </div>
                )}
                {profile.clothing_size && (
                  <div>
                    <p className="text-xs text-gray-400">Размер</p>
                    <p className="text-sm font-medium text-gray-900">{profile.clothing_size}</p>
                  </div>
                )}
                {(profile.budget_min || profile.budget_max) && (
                  <div>
                    <p className="text-xs text-gray-400">Бюджет</p>
                    <p className="text-sm font-medium text-gray-900">
                      {(profile.budget_min || 0).toLocaleString('ru-RU')} — {(profile.budget_max || 0).toLocaleString('ru-RU')} ₸
                    </p>
                  </div>
                )}
                {profile.body_type && (
                  <div>
                    <p className="text-xs text-gray-400">Тип фигуры</p>
                    <p className="text-sm font-medium text-gray-900">{profile.body_type}</p>
                  </div>
                )}
                {profile.lifestyle && (
                  <div>
                    <p className="text-xs text-gray-400">Образ жизни</p>
                    <p className="text-sm font-medium text-gray-900">{profile.lifestyle}</p>
                  </div>
                )}
                {profile.style_preferences?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Стиль</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.style_preferences.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-pink-50 text-pink-700 rounded-full text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Анкета не заполнена</p>
            )}
          </div>
        </div>
      )}

      {showProductPicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowProductPicker(false)}>
          <div className="bg-white rounded-2xl w-[480px] max-h-[560px] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
              <p className="font-semibold text-gray-900 mb-3">Выбрать товар</p>
              <input
                autoFocus
                type="text"
                value={productSearch}
                onChange={e => searchProducts(e.target.value)}
                placeholder="Поиск по названию..."
                className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none border border-gray-200 focus:border-gray-900"
              />
            </div>
            <div className="overflow-y-auto flex-1 p-3">
              {productResults.length === 0 && productSearch && (
                <p className="text-sm text-gray-400 text-center py-6">Ничего не найдено</p>
              )}
              {productResults.length === 0 && !productSearch && (
                <p className="text-sm text-gray-400 text-center py-6">Начните вводить название товара</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {productResults.map(product => {
                  const img = Array.isArray(product.images) ? product.images[0] : product.images
                  return (
                    <div
                      key={product.id}
                      onClick={() => sendProduct(product)}
                      className="cursor-pointer rounded-xl border border-gray-100 overflow-hidden hover:border-[#D4537E] transition-colors"
                    >
                      {img && <img src={img} className="w-full h-28 object-cover" />}
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-900 leading-tight line-clamp-2">{product.name}</p>
                        <p className="text-xs text-[#D4537E] font-semibold mt-1">{Number(product.price).toLocaleString('ru-RU')} ₸</p>
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
