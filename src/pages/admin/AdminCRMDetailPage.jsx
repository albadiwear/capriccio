import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, MessageCircle, Send, Phone, Camera,
  ShoppingBag, Heart, ChevronRight, Plus, User,
} from 'lucide-react'

const STATUS_OPTIONS = [
  'Новый',
  'Написали',
  'Подбор образа',
  'Думает',
  'Купил',
  'Передан в доставку',
  'Доставлено',
]

const ORDER_STATUS_STYLE = {
  new:       { label: 'Новый',     cls: 'bg-gray-100 text-gray-600' },
  pending:   { label: 'Ожидает',   cls: 'bg-yellow-50 text-yellow-700' },
  paid:      { label: 'Оплачено',  cls: 'bg-green-50 text-green-700' },
  delivered: { label: 'Доставлен', cls: 'bg-blue-50 text-blue-700' },
  cancelled: { label: 'Отменён',   cls: 'bg-red-50 text-red-600' },
}

const SOURCE_ICON = {
  telegram:  <Send size={14} className="text-[#229ED9]" />,
  whatsapp:  <Phone size={14} className="text-[#25D366]" />,
  instagram: <Camera size={14} className="text-[#E1306C]" />,
  web:       <MessageCircle size={14} className="text-gray-400" />,
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function AdminCRMDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [notes, setNotes] = useState([])
  const [orders, setOrders] = useState([])
  const [chats, setChats] = useState([])
  const [wishlist, setWishlist] = useState([])

  const [tab, setTab] = useState('chats')
  const [mobileSection, setMobileSection] = useState('info')

  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    try {
      const [userRes, notesRes, ordersRes, chatsRes, wishlistRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', id).single(),
        supabase.from('lead_notes').select('*').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('orders').select('id, created_at, total_amount, status').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('stylist_chats').select('id, source, last_message, updated_at, avatar_url').eq('user_id', id),
        supabase.from('wishlist').select('id, product_id, products(id, name, price, images)').eq('user_id', id),
      ])
      setUser(userRes.data || null)
      setNotes(notesRes.data || [])
      setOrders(ordersRes.data || [])
      setChats(chatsRes.data || [])
      setWishlist(wishlistRes.data || [])
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(e) {
    const val = e.target.value
    setUser(prev => ({ ...prev, lead_status: val }))
    setSavingStatus(true)
    await supabase.from('users').update({ lead_status: val }).eq('id', id)
    setSavingStatus(false)
  }

  async function handleAddNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    try {
      const { data } = await supabase
        .from('lead_notes')
        .insert({ user_id: id, content: newNote.trim() })
        .select()
        .single()
      if (data) setNotes(prev => [data, ...prev])
      setNewNote('')
    } finally {
      setSavingNote(false)
    }
  }

  const totalSpent = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0)

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-[#888780]">
        Загрузка...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-[#888780]">Клиент не найден</p>
        <button type="button" onClick={() => navigate('/admin/crm')} className="text-xs text-[#D4537E] underline">
          Вернуться в CRM
        </button>
      </div>
    )
  }

  // ── Profile block (shared) ─────────────────────────────────────────────────
  const ProfileBlock = (
    <div className="space-y-4">
      {/* Аватар + контакты */}
      <div className="bg-white rounded-2xl p-5 border border-[#f0ede8]">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-[#1a1a18] flex items-center justify-center text-white font-bold text-base flex-shrink-0 overflow-hidden">
            {user.avatar_url
              ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              : <User size={22} className="text-white/70" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1a1a18] truncate">{user.full_name || 'Без имени'}</p>
            {user.email && <p className="text-xs text-[#888780] truncate mt-0.5">{user.email}</p>}
            {user.phone && <p className="text-xs text-[#888780] mt-0.5">{user.phone}</p>}
            {user.city && <span className="text-sm text-[#888780]">{user.city}</span>}
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#888780]">Статус</span>
            <div className="relative">
              <select
                value={user.lead_status || 'Новый'}
                onChange={handleStatusChange}
                disabled={savingStatus}
                className="text-xs font-semibold text-[#1a1a18] bg-[#f0ede8] border-0 rounded-lg px-2.5 py-1 pr-6 outline-none cursor-pointer appearance-none"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronRight size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#888780] rotate-90 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#888780]">Регистрация</span>
            <span className="text-xs text-[#1a1a18]">{formatDate(user.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Итоги */}
      <div className="bg-white rounded-2xl p-5 border border-[#f0ede8]">
        <p className="text-[10px] font-bold text-[#888780] uppercase tracking-wider mb-3">Итоги</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#f9f8f6] rounded-xl p-3 text-center border border-[#f0ede8]">
            <p className="text-xl font-bold text-[#1a1a18]">{orders.length}</p>
            <p className="text-[10px] text-[#888780] mt-0.5">заказов</p>
          </div>
          <div className="bg-[#f9f8f6] rounded-xl p-3 text-center border border-[#f0ede8]">
            <p className="text-sm font-bold text-[#1a1a18] leading-snug">{Number(totalSpent).toLocaleString('ru-RU')}</p>
            <p className="text-[10px] text-[#888780] mt-0.5">₸ потрачено</p>
          </div>
        </div>
      </div>

      {/* Заметки */}
      <div className="bg-white rounded-2xl p-5 border border-[#f0ede8]">
        <p className="text-[10px] font-bold text-[#888780] uppercase tracking-wider mb-3">Заметки</p>

        <div className="space-y-2 mb-3 max-h-52 overflow-y-auto">
          {notes.length === 0 && <p className="text-xs text-[#888780]">Нет заметок</p>}
          {notes.map(note => (
            <div key={note.id} className="bg-[#f9f8f6] rounded-xl p-3 border border-[#f0ede8]">
              <p className="text-xs text-[#1a1a18] leading-relaxed whitespace-pre-wrap">{note.content || note.text}</p>
              <p className="text-[10px] text-[#888780] mt-1.5">{formatDateTime(note.created_at)}</p>
            </div>
          ))}
        </div>

        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Добавить заметку..."
          rows={2}
          className="w-full border border-[#f0ede8] rounded-xl px-3 py-2 text-xs text-[#1a1a18] outline-none focus:border-[#D4537E] resize-none mb-2 placeholder:text-[#888780] bg-[#f9f8f6]"
        />
        <button
          type="button"
          onClick={handleAddNote}
          disabled={savingNote || !newNote.trim()}
          className={`w-full py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
            newNote.trim()
              ? 'bg-[#D4537E] text-white hover:bg-[#c44370]'
              : 'bg-[#f0ede8] text-[#888780] cursor-not-allowed'
          }`}
        >
          <Plus size={12} />
          Сохранить заметку
        </button>
      </div>
    </div>
  )

  // ── Tabs content ───────────────────────────────────────────────────────────
  const TABS = [
    { id: 'chats',    label: 'Чаты',      count: chats.length },
    { id: 'orders',   label: 'Заказы',    count: orders.length },
    { id: 'wishlist', label: 'Избранное', count: wishlist.length },
  ]

  const TabsBlock = (
    <div className="bg-white rounded-2xl border border-[#f0ede8] flex flex-col min-h-0 h-full">
      <div className="flex border-b border-[#f0ede8] px-4 pt-1 flex-shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-[#D4537E] text-[#D4537E]'
                : 'border-transparent text-[#888780] hover:text-[#1a1a18]'
            }`}
          >
            {t.label}
            <span className="ml-1 text-xs bg-[#f0ede8] text-[#888780] rounded-full px-2 py-0.5">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Чаты */}
        {tab === 'chats' && (
          <div className="space-y-2">
            {chats.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-[#888780]">
                <MessageCircle size={40} className="mb-3 opacity-30" />
                <p className="text-sm">Нет чатов</p>
              </div>
            )}
            {chats.map(chat => (
              <button
                key={chat.id}
                type="button"
                onClick={() => navigate(`/admin/chats?chat_id=${chat.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#f0ede8] hover:border-[#D4537E]/40 hover:bg-[#fdf9f8] transition-all text-left"
              >
                <div className="w-9 h-9 rounded-full bg-[#f0ede8] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {chat.avatar_url
                    ? <img src={chat.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                    : (SOURCE_ICON[chat.source] || SOURCE_ICON.web)
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {SOURCE_ICON[chat.source] || SOURCE_ICON.web}
                    <span className="text-xs font-semibold text-[#1a1a18] capitalize">{chat.source || 'web'}</span>
                  </div>
                  {chat.last_message && (
                    <p className="text-[11px] text-[#888780] truncate">{chat.last_message}</p>
                  )}
                </div>
                <span className="text-[10px] text-[#888780] flex-shrink-0">{formatDate(chat.updated_at)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Заказы */}
        {tab === 'orders' && (
          <div className="space-y-2">
            {orders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-[#888780]">
                <ShoppingBag size={40} className="mb-3 opacity-30" />
                <p className="text-sm">Заказов пока нет</p>
              </div>
            )}
            {orders.map(order => {
              const style = ORDER_STATUS_STYLE[order.status] || { label: order.status || '—', cls: 'bg-gray-100 text-gray-600' }
              return (
                <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#f0ede8]">
                  <ShoppingBag size={15} className="text-[#888780] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#1a1a18]">
                      № {String(order.id).slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-[10px] text-[#888780]">{formatDate(order.created_at)}</p>
                  </div>
                  <span className="text-xs font-bold text-[#1a1a18] flex-shrink-0">
                    {Number(order.total_amount || 0).toLocaleString('ru-RU')} ₸
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${style.cls}`}>
                    {style.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Избранное */}
        {tab === 'wishlist' && (
          <div className="grid grid-cols-2 gap-3">
            {wishlist.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-16 text-[#888780]">
                <Heart size={40} className="mb-3 opacity-30" />
                <p className="text-sm">Список избранного пуст</p>
              </div>
            )}
            {wishlist.map(item => {
              const product = item.products
              if (!product) return null
              return (
                <div key={item.id} className="rounded-xl border border-[#f0ede8] overflow-hidden">
                  <div className="aspect-square bg-[#f0ede8]">
                    {product.images?.[0]
                      ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Heart size={20} className="text-[#888780]" /></div>
                    }
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-[#1a1a18] line-clamp-2 leading-snug">{product.name}</p>
                    <p className="text-xs font-bold text-[#1a1a18] mt-1">{Number(product.price || 0).toLocaleString('ru-RU')} ₸</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#f9f8f6] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-[#f0ede8] px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/crm')}
          className="flex items-center gap-1.5 text-xs text-[#888780] hover:text-[#1a1a18] transition-colors"
        >
          <ArrowLeft size={15} />
          Назад
        </button>
        <div className="w-px h-4 bg-[#f0ede8]" />
        <p className="text-sm font-bold text-[#1a1a18] truncate">{user.full_name || user.email || 'Клиент'}</p>
        <span className="ml-auto text-xs text-[#888780]">{user.lead_status || 'Новый'}</span>
      </div>

      {/* Desktop: две колонки */}
      <div className="hidden md:flex flex-1 gap-5 p-5 overflow-hidden">
        <div className="w-72 flex-shrink-0 overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-thin">
          {ProfileBlock}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
          {TabsBlock}
        </div>
      </div>

      {/* Mobile: вкладки */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        <div className="flex border-b border-[#f0ede8] bg-white flex-shrink-0">
          {[
            { id: 'info',     label: 'Профиль' },
            { id: 'chats',    label: 'Чаты', count: chats.length },
            { id: 'orders',   label: 'Заказы', count: orders.length },
            { id: 'wishlist', label: 'Избранное', count: wishlist.length },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setMobileSection(t.id)
                if (t.id !== 'info') setTab(t.id)
              }}
              className={`flex-1 py-3 text-[11px] font-semibold border-b-2 -mb-px transition-colors ${
                mobileSection === t.id
                  ? 'border-[#D4537E] text-[#D4537E]'
                  : 'border-transparent text-[#888780]'
              }`}
            >
              {t.label}
              {t.id !== 'info' && (
                <span className="ml-1 text-xs bg-[#f0ede8] text-[#888780] rounded-full px-2 py-0.5">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {mobileSection === 'info' ? ProfileBlock : TabsBlock}
        </div>
      </div>
    </div>
  )
}
