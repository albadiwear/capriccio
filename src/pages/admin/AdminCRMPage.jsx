import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Search, LayoutGrid, List, MessageCircle, ShoppingBag } from 'lucide-react'

const STAGES = [
  { id: 'new',       label: 'Новый лид',     color: '#9ca3af', bg: '#f9fafb' },
  { id: 'contacted', label: 'Написали',       color: '#3b82f6', bg: '#eff6ff' },
  { id: 'selection', label: 'Подбор образа',  color: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'decision',  label: 'Думает',         color: '#f59e0b', bg: '#fffbeb' },
  { id: 'paid',      label: 'Оплачено',       color: '#10b981', bg: '#f0fdf4' },
  { id: 'delivery',  label: 'Доставка',       color: '#06b6d4', bg: '#ecfeff' },
  { id: 'delivered', label: 'Получено',       color: '#6366f1', bg: '#eef2ff' },
]

const STAGE_LABEL_TO_KEY = {
  'Новый':    'new',
  'Написали': 'contacted',
  'Подбор':   'selection',
  'Думает':   'decision',
  'Оплачено': 'paid',
  'Доставка': 'delivery',
  'Получено': 'delivered',
}

const STAGE_KEY_TO_LABEL = Object.fromEntries(
  Object.entries(STAGE_LABEL_TO_KEY).map(([k, v]) => [v, k])
)

function getStage(lead) {
  const hasOrders = (lead.orders || []).length > 0
  if (hasOrders) return 'paid'

  const status = lead.lead_status
  if (!status) return 'new'

  const MAP = {
    'new': 'new',
    'Новый': 'new',
    'contacted': 'contacted',
    'Написали': 'contacted',
    'selection': 'selection',
    'Подбор': 'selection',
    'Подбор образа': 'selection',
    'Думает': 'decision',
    'decision': 'decision',
    'Принято решение': 'decision',
    'paid': 'paid',
    'Оплачено': 'paid',
    'Купил': 'paid',
    'delivery': 'delivery',
    'Доставка': 'delivery',
    'Передан в доставку': 'delivery',
    'delivered': 'delivered',
    'Получено': 'delivered',
    'Доставлено': 'delivered',
  }

  return MAP[status] || 'new'
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const SOURCE_CONFIG = {
  telegram: {
    color: '#229ED9',
    label: 'Telegram',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#229ED9]">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
      </svg>
    ),
  },
  whatsapp: {
    color: '#25D366',
    label: 'WhatsApp',
    icon: <MessageCircle size={11} className="text-[#25D366]" />,
  },
  instagram: {
    color: '#E1306C',
    label: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#E1306C]">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  web: {
    color: '#6b7280',
    label: 'Сайт',
    icon: <span className="text-[10px] text-gray-400">🌐</span>,
  },
}

function LeadCard({ lead, onClick }) {
  const source = lead.chat?.source || 'web'
  const cfg = SOURCE_CONFIG[source] || SOURCE_CONFIG.web
  const ordersCount = (lead.orders || []).length
  const totalSpent = (lead.orders || []).reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const lastMsg = lead.chat?.last_message
  const createdDate = new Date(lead.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
  const avatarUrl = lead.avatar_url || lead.chat?.avatar_url

  return (
    <button
      type="button"
      onClick={() => onClick(lead)}
      className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all overflow-hidden"
    >
      <div className="h-0.5 w-full" style={{ backgroundColor: cfg.color }} />

      <div className="p-3">
        <div className="flex items-start gap-2.5 mb-2">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden"
            style={{ backgroundColor: cfg.color }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : getInitials(lead.full_name || lead.email)
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-xs font-semibold text-gray-900 truncate">
                {lead.full_name || lead.email || 'Аноним'}
              </span>
              {cfg.icon}
            </div>
            {lead.phone && (
              <p className="text-[10px] text-gray-400">{lead.phone}</p>
            )}
          </div>
        </div>

        {lastMsg && (
          <p className="text-[10px] text-gray-500 line-clamp-1 mb-2 bg-gray-50 rounded px-2 py-1">{lastMsg}</p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[9px] text-gray-400">{createdDate}</span>
          <div className="flex items-center gap-1">
            {ordersCount > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-100">
                <ShoppingBag size={8} />
                {ordersCount} · {Number(totalSpent).toLocaleString('ru-RU')} ₸
              </span>
            )}
            {lead.chat && ordersCount === 0 && (
              <span className="flex items-center gap-0.5 text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
                <MessageCircle size={8} />
                Чат
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

export default function AdminCRMPage() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [draggingId, setDraggingId] = useState(null)
  const [overStage, setOverStage] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const [{ data: users }, { data: chats }, { data: orders }] = await Promise.all([
        supabase
          .from('users')
          .select('id, full_name, email, phone, avatar_url, lead_status, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('stylist_chats')
          .select('id, user_id, source, last_message, updated_at, avatar_url')
          .not('user_id', 'is', null),
        supabase
          .from('orders')
          .select('id, user_id, total_amount, status'),
      ])

      const chatByUser = {}
      for (const chat of chats || []) {
        if (chat.user_id) chatByUser[chat.user_id] = chat
      }

      const ordersByUser = {}
      for (const order of orders || []) {
        if (!ordersByUser[order.user_id]) ordersByUser[order.user_id] = []
        ordersByUser[order.user_id].push(order)
      }

      setLeads(
        (users || []).map(u => ({
          ...u,
          chat: chatByUser[u.id] || null,
          orders: ordersByUser[u.id] || [],
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  async function moveCard(leadId, stageKey) {
    const newLabel = STAGE_KEY_TO_LABEL[stageKey]
    if (!newLabel) return
    setLeads(prev =>
      prev.map(l => l.id === leadId ? { ...l, lead_status: newLabel } : l)
    )
    await supabase.from('users').update({ lead_status: newLabel }).eq('id', leadId)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return leads
    return leads.filter(l =>
      l.full_name?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.phone?.includes(q)
    )
  }, [leads, search])

  const stageLeads = useMemo(() => {
    const groups = {}
    STAGES.forEach(stage => { groups[stage.id] = [] })
    filtered.forEach(lead => {
      const stage = getStage(lead)
      if (groups[stage]) groups[stage].push(lead)
      else groups.new.push(lead)
    })
    return groups
  }, [filtered])

  function handleCardClick(lead) {
    navigate('/admin/leads')
  }

  function handleDragStart(e, leadId) {
    setDraggingId(leadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e, stageKey) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverStage(stageKey)
  }

  function handleDragLeave() {
    setOverStage(null)
  }

  function handleDrop(e, stageKey) {
    e.preventDefault()
    if (draggingId) moveCard(draggingId, stageKey)
    setDraggingId(null)
    setOverStage(null)
  }

  function handleDragEnd() {
    setDraggingId(null)
    setOverStage(null)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200 flex items-center gap-3">
        <LayoutGrid size={17} className="text-[#1a1a18]" />
        <h1 className="text-sm font-bold text-[#1a1a18]">CRM</h1>
        <span className="text-xs text-gray-400">{filtered.length} лидов</span>

        <div className="relative ml-3">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#1a1a18] w-56"
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/leads')}
          className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1a1a18] transition-colors"
        >
          <List size={14} />
          Список
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          Загрузка...
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div
            className="flex gap-3 h-full px-4 py-3"
            style={{ minWidth: `${STAGES.length * 256 + 32}px` }}
          >
            {STAGES.map(stage => {
              const cards = stageLeads[stage.id] || []
              const stageTotal = cards.reduce(
                (s, l) => s + (l.orders || []).reduce((ss, o) => ss + Number(o.total_amount || 0), 0),
                0
              )
              const isOver = overStage === stage.id

              return (
                <div
                  key={stage.id}
                  className={`flex flex-col flex-shrink-0 w-[240px] rounded-xl transition-all ${isOver ? 'ring-2 ring-offset-1' : ''}`}
                  style={isOver ? { '--tw-ring-color': stage.color } : {}}
                  onDragOver={e => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, stage.id)}
                >
                  <div className="rounded-xl overflow-hidden mb-2" style={{ backgroundColor: stage.bg }}>
                    <div className="h-1 w-full" style={{ backgroundColor: stage.color }} />
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <span className="text-xs font-bold text-gray-800">{stage.label}</span>
                      <div className="flex items-center gap-1.5">
                        {stageTotal > 0 && (
                          <span className="text-[9px] font-medium text-gray-500">
                            {Number(stageTotal).toLocaleString('ru-RU')} ₸
                          </span>
                        )}
                        <span
                          className="text-[10px] font-bold text-white rounded-full w-5 h-5 flex items-center justify-center"
                          style={{ backgroundColor: stage.color }}
                        >
                          {cards.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pb-2">
                    {cards.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={e => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        className={`transition-opacity ${draggingId === lead.id ? 'opacity-40' : 'opacity-100'}`}
                      >
                        <LeadCard lead={lead} onClick={handleCardClick} />
                      </div>
                    ))}
                    {cards.length === 0 && (
                      <div className="flex items-center justify-center h-16 text-[10px] text-gray-300 select-none border-2 border-dashed border-gray-200 rounded-xl">
                        Пусто
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
