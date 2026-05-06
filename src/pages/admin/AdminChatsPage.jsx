import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import ChatDialog from '../../components/admin/ChatDialog'
import { Search, MessageCircle, ExternalLink } from 'lucide-react'

const TELEGRAM_ICON = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#229ED9]">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
  </svg>
)

export default function AdminChatsPage() {
  const navigate = useNavigate()
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [unread, setUnread] = useState({})

  async function loadChats() {
    try {
      const { data } = await supabase
        .from('stylist_chats')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(200)

      if (!data) return

      const seen = new Set()
      const unique = data.filter(chat => {
        const key = chat.user_id || chat.id
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      const userIds = [...new Set(unique.map(chat => chat.user_id).filter(Boolean))]
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, email, phone, avatar_url')
        .in('id', userIds)

      const usersMap = {}
      usersData?.forEach(user => {
        usersMap[user.id] = user
      })

      const mappedChats = unique.map(chat => ({
        ...chat,
        users: usersMap[chat.user_id] || null,
        avatar_url: chat.avatar_url || usersMap[chat.user_id]?.avatar_url || null,
      }))

      setChats(mappedChats)
      setSelectedChat(prev => prev ? mappedChats.find(chat => chat.id === prev.id) || prev : prev)

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
    } catch (error) {
      void error
    }
  }

  async function openChat(chat) {
    setSelectedChat(chat)
    setProfile(null)
    setUnread(prev => ({ ...prev, [chat.id]: 0 }))

    try {
      await supabase
        .from('stylist_chats')
        .update({ last_read_at: new Date().toISOString() })
        .eq('id', chat.id)

      const { data: profileData } = await supabase
        .from('stylist_profiles')
        .select('*')
        .eq('user_id', chat.user_id)
        .maybeSingle()

      setProfile(profileData || null)
    } catch (error) {
      void error
      setProfile(null)
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadChats()
    })

    const channel = supabase
      .channel('admin-chats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stylist_chats' }, () => {
        void loadChats()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stylist_messages' }, () => {
        void loadChats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredChats = chats.filter(chat => {
    const name = chat.users?.full_name || chat.users?.email || ''
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || chat.title?.toLowerCase().includes(search.toLowerCase())
    if (tab === 'waiting') return matchSearch && chat.handoff_requested
    if (tab === 'live') return matchSearch && chat.mode === 'human'
    return matchSearch
  })

  const waitingCount = chats.filter(chat => chat.handoff_requested).length
  const liveCount = chats.filter(chat => chat.mode === 'human').length

  return (
    <div className="flex h-[calc(100vh-60px)]">
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
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  tab === item.key ? 'bg-[#1a1a18] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.label} {item.count > 0 && <span className="opacity-70">({item.count})</span>}
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
                  <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-sm font-medium text-pink-700 overflow-hidden flex-shrink-0">
                    {chat.avatar_url
                      ? <img src={chat.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span>{(chat.users?.full_name || chat.title || '?').charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  {chat.source === 'telegram' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                      <TELEGRAM_ICON />
                    </span>
                  )}
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
                      {chat.users?.full_name || chat.users?.email || chat.title || 'Аноним'}
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

      <ChatDialog selectedChat={selectedChat} />

      {selectedChat && (
        <div className="w-64 border-l border-gray-100 flex flex-col flex-shrink-0 bg-white overflow-y-auto">
          <div className="px-4 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Профиль клиента</p>
            {selectedChat.user_id && (
              <button
                type="button"
                onClick={() => navigate('/admin/leads?user=' + selectedChat.user_id)}
                className="w-full border border-[#f0ede8] text-[#1a1a18] rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-[#f0ede8] transition-colors mt-3"
              >
                <ExternalLink size={14} />
                Открыть профиль лида
              </button>
            )}
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
                      {profile.style_preferences.map(item => (
                        <span key={item} className="px-2 py-0.5 bg-pink-50 text-pink-700 rounded-full text-xs">{item}</span>
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
    </div>
  )
}
