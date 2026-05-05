import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Search, LayoutGrid, List, MessageCircle, ShoppingBag } from 'lucide-react'

const STAGES = [
  { id: 'new',       label: 'Новый',     color: '#9ca3af' },
  { id: 'contacted', label: 'Написали',  color: '#3b82f6' },
  { id: 'selection', label: 'Подбор',    color: '#8b5cf6' },
  { id: 'decision',  label: 'Думает',    color: '#f59e0b' },
  { id: 'paid',      label: 'Оплачено',  color: '#10b981' },
  { id: 'delivery',  label: 'Доставка',  color: '#06b6d4' },
  { id: 'delivered', label: 'Получено',  color: '#1a1a18' },
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

const TELEGRAM_ICON = () => (
  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#229ED9] flex-shrink-0">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
  </svg>
)

const GOOGLE_ICON = () => (
  <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

function LeadCard({ lead, onClick }) {
  const initials = getInitials(lead.full_name)
  const source = lead.chat?.source
  const ordersCount = (lead.orders || []).length
  const totalSpent = (lead.orders || []).reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const lastMsg = lead.chat?.last_message || ''

  return (
    <button
      type="button"
      onClick={() => onClick(lead)}
      className="w-full text-left bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all"
    >
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1a1a18] text-white text-[10px] font-bold flex items-center justify-center">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-xs font-semibold text-[#1a1a18] truncate">
              {lead.full_name || lead.email || 'Аноним'}
            </span>
            {source === 'telegram' && <TELEGRAM_ICON />}
            {lead.user_metadata?.provider === 'google' && <GOOGLE_ICON />}
          </div>

          {lead.phone && (
            <p className="text-[10px] text-gray-400 truncate">{lead.phone}</p>
          )}

          {lastMsg && (
            <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-tight">{lastMsg}</p>
          )}

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {ordersCount > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                <ShoppingBag size={9} />
                {ordersCount}
              </span>
            )}
            {ordersCount > 0 && (
              <span className="text-[9px] text-gray-400">
                {Number(totalSpent).toLocaleString('ru-RU')} ₸
              </span>
            )}
            {lead.chat && ordersCount === 0 && (
              <span className="flex items-center gap-0.5 text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                <MessageCircle size={9} />
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
    const [{ data: users }, { data: chats }] = await Promise.all([
      supabase
        .from('users')
        .select('id, full_name, email, phone, lead_status, user_metadata, created_at, orders(id, total_amount, status)')
        .order('created_at', { ascending: false }),
      supabase
        .from('stylist_chats')
        .select('id, user_id, source, last_message, updated_at'),
    ])

    const chatByUser = {}
    for (const chat of chats || []) {
      if (chat.user_id) chatByUser[chat.user_id] = chat
    }

    setLeads(
      (users || []).map(u => ({ ...u, chat: chatByUser[u.id] || null }))
    )
    setLoading(false)
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
    STAGES.forEach(stage => {
      groups[stage.id] = []
    })

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
            style={{ minWidth: `${STAGES.length * 232 + 32}px` }}
          >
            {STAGES.map(stage => {
              const cards = stageLeads[stage.id] || []
              const isOver = overStage === stage.id

              return (
                <div
                  key={stage.id}
                  className={`flex flex-col flex-shrink-0 w-[220px] rounded-xl transition-colors ${isOver ? 'bg-gray-200' : 'bg-gray-100'}`}
                  onDragOver={e => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, stage.id)}
                >
                  <div className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                    <span className="text-xs font-semibold text-[#1a1a18]">{stage.label}</span>
                    <span className="ml-auto text-[10px] font-medium text-gray-500 bg-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {cards.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-0">
                    {cards.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={e => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        className={`cursor-grab active:cursor-grabbing transition-opacity ${draggingId === lead.id ? 'opacity-40' : 'opacity-100'}`}
                      >
                        <LeadCard lead={lead} onClick={handleCardClick} />
                      </div>
                    ))}
                    {cards.length === 0 && (
                      <div className="flex items-center justify-center h-12 text-[10px] text-gray-400 select-none">
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
