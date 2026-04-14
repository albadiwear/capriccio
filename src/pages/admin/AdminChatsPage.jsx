import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Send, Bot, User } from 'lucide-react'

export default function AdminChatsPage() {
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadChats()

    const channel = supabase
      .channel('admin-chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stylist_chats' }, () => loadChats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stylist_messages' }, (payload) => {
        if (selectedChat && payload.new.chat_id === selectedChat.id) {
          setMessages(prev => [...prev, payload.new])
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [selectedChat])

  async function loadChats() {
    const { data } = await supabase
      .from('stylist_chats')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50)

    if (!data) return

    const userIds = [...new Set(data.map(c => c.user_id).filter(Boolean))]
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, email, phone')
      .in('id', userIds)

    const usersMap = {}
    usersData?.forEach(u => { usersMap[u.id] = u })

    setChats(data.map(c => ({ ...c, users: usersMap[c.user_id] || null })))
  }

  async function openChat(chat) {
    setSelectedChat(chat)
    const { data } = await supabase
      .from('stylist_messages')
      .select('*')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function handleTakeover() {
    await supabase.from('stylist_chats').update({
      mode: 'human',
      handoff_requested: false
    }).eq('id', selectedChat.id)
    setSelectedChat(prev => ({ ...prev, mode: 'human' }))
    setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, mode: 'human', handoff_requested: false } : c))
  }

  async function handleRelease() {
    await supabase.from('stylist_chats').update({ mode: 'ai' }).eq('id', selectedChat.id)
    setSelectedChat(prev => ({ ...prev, mode: 'ai' }))
    setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, mode: 'ai' } : c))
  }

  async function sendMessage() {
    if (!input.trim() || !selectedChat) return
    setSending(true)
    const { data } = await supabase.from('stylist_messages').insert({
      chat_id: selectedChat.id,
      role: 'assistant',
      content: input.trim(),
    }).select().single()
    await supabase.from('stylist_chats').update({ updated_at: new Date().toISOString() }).eq('id', selectedChat.id)
    setMessages(prev => [...prev, data])
    setInput('')
    setSending(false)
  }

  return (
    <div className="flex h-[calc(100vh-60px)] gap-0">

      {/* Список чатов */}
      <div className="w-80 border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-gray-100">
          <h1 className="font-bold text-gray-900">Чаты со стилистом</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {chats.filter(c => c.handoff_requested).length} ожидают помощи
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => openChat(chat)}
              className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${selectedChat?.id === chat.id ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {chat.users?.full_name || chat.users?.email || 'Аноним'}
                </p>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {chat.handoff_requested && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Запросил помощь" />
                  )}
                  {chat.mode === 'human' && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Live</span>
                  )}
                  {chat.mode === 'ai' && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">ИИ</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">{chat.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(chat.updated_at || chat.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Чат */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col min-w-0">

          {/* Хедер чата */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {selectedChat.users?.full_name || selectedChat.users?.email || 'Аноним'}
              </p>
              <p className="text-xs text-gray-500">{selectedChat.users?.phone || selectedChat.title}</p>
            </div>
            <div className="flex gap-2">
              {selectedChat.mode === 'ai' ? (
                <button
                  onClick={handleTakeover}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4537E] text-white text-sm font-medium hover:bg-[#c44370]"
                >
                  <User size={14} />
                  Подключиться
                </button>
              ) : (
                <button
                  onClick={handleRelease}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                >
                  <Bot size={14} />
                  Отпустить ИИ
                </button>
              )}
            </div>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-[#1a1a18] text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/50' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Поле ввода — только если mode === human */}
          {selectedChat.mode === 'human' && (
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Написать от имени Амины..."
                className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none border border-gray-200 focus:border-gray-900"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="w-10 h-10 rounded-xl bg-[#1a1a18] flex items-center justify-center disabled:opacity-40"
              >
                <Send size={16} className="text-white" />
              </button>
            </div>
          )}

          {selectedChat.mode === 'ai' && (
            <div className="px-4 py-3 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-400">Сейчас отвечает ИИ Амина · <button onClick={handleTakeover} className="text-[#D4537E] hover:underline">Подключиться</button></p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p className="text-sm">Выберите чат слева</p>
        </div>
      )}
    </div>
  )
}
