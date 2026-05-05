import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Search, LayoutGrid, List, MessageCircle, ShoppingBag, Plus, X } from 'lucide-react'

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

const SOURCE_CONFIG = {
  telegram:  { color: '#229ED9', label: 'Telegram',  bg: '#e8f4fd', text: '#229ED9' },
  whatsapp:  { color: '#25D366', label: 'WhatsApp',  bg: '#e8fdf0', text: '#25D366' },
  instagram: { color: '#E1306C', label: 'Instagram', bg: '#fde8f0', text: '#E1306C' },
  web:       { color: '#6b7280', label: 'Сайт',      bg: '#f3f4f6', text: '#6b7280' },
}

const SOURCE_FILTER_OPTIONS = [
  { id: 'all',       label: 'Все',       color: '#6b7280' },
  { id: 'telegram',  label: 'Telegram',  color: '#229ED9' },
  { id: 'whatsapp',  label: 'WhatsApp',  color: '#25D366' },
  { id: 'instagram', label: 'Instagram', color: '#E1306C' },
  { id: 'web',       label: 'Сайт',      color: '#9ca3af' },
]

const ORDER_FILTER_OPTIONS = [
  { id: 'all_orders',   label: 'Все' },
  { id: 'with_orders',  label: 'Есть заказы' },
  { id: 'no_orders',    label: 'Нет заказов' },
  { id: 'has_chat',     label: 'Есть чат' },
]

const CUSTOM_STAGE_COLORS = ['#ec4899', '#f97316', '#84cc16', '#14b8a6', '#a855f7']

function getStage(lead) {
  const hasOrders = (lead.orders || []).length > 0
  if (hasOrders) return 'paid'

  const status = lead.lead_status
  if (!status) return 'new'

  const MAP = {
    'new': 'new', 'Новый': 'new',
    'contacted': 'contacted', 'Написали': 'contacted',
    'selection': 'selection', 'Подбор': 'selection', 'Подбор образа': 'selection',
    'decision': 'decision', 'Думает': 'decision', 'Принято решение': 'decision',
    'paid': 'paid', 'Оплачено': 'paid', 'Купил': 'paid',
    'delivery': 'delivery', 'Доставка': 'delivery', 'Передан в доставку': 'delivery',
    'delivered': 'delivered', 'Получено': 'delivered', 'Доставлено': 'delivered',
  }

  return MAP[status] || 'new'
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
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
            <span className="block text-xs font-semibold text-gray-900 truncate">
              {lead.full_name || lead.email || 'Аноним'}
            </span>
            {lead.phone && (
              <span className="block text-[10px] text-gray-400 truncate">{lead.phone}</span>
            )}
            <span className="block text-[9px] text-gray-300 mt-0.5">{createdDate}</span>
          </div>
        </div>

        {lastMsg && (
          <p className="text-[10px] text-gray-400 italic line-clamp-1 mb-2">{lastMsg}</p>
        )}

        <div className="flex items-center gap-1 flex-wrap">
          <span
            className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: cfg.bg, color: cfg.text }}
          >
            {cfg.label}
          </span>
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
    </button>
  )
}

export default function AdminCRMPage() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [orderFilter, setOrderFilter] = useState('all_orders')
  const [draggingId, setDraggingId] = useState(null)
  const [overStage, setOverStage] = useState(null)
  const [editingStage, setEditingStage] = useState(null)
  const [stageLabels, setStageLabels] = useState(
    Object.fromEntries(STAGES.map(s => [s.id, s.label]))
  )
  const [showAddStage, setShowAddStage] = useState(false)
  const [newStageName, setNewStageName] = useState('')
  const [customStages, setCustomStages] = useState([])

  const allStages = useMemo(() => [...STAGES, ...customStages], [customStages])

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

  function handleAddStage() {
    if (!newStageName.trim()) return
    const id = 'custom_' + Date.now()
    const color = CUSTOM_STAGE_COLORS[customStages.length % CUSTOM_STAGE_COLORS.length]
    setCustomStages(prev => [...prev, { id, label: newStageName.trim(), color, bg: '#fafafa' }])
    setStageLabels(prev => ({ ...prev, [id]: newStageName.trim() }))
    setNewStageName('')
    setShowAddStage(false)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter(l => {
      const matchesSearch = !q ||
        l.full_name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.phone?.includes(q)
      const matchesSource = sourceFilter === 'all' || (l.chat?.source || 'web') === sourceFilter
      const ordersCount = (l.orders || []).length
      const matchesOrder =
        orderFilter === 'all_orders' ? true :
        orderFilter === 'with_orders' ? ordersCount > 0 :
        orderFilter === 'no_orders' ? ordersCount === 0 :
        orderFilter === 'has_chat' ? !!l.chat :
        true
      return matchesSearch && matchesSource && matchesOrder
    })
  }, [leads, search, sourceFilter, orderFilter])

  const stageLeads = useMemo(() => {
    const groups = {}
    allStages.forEach(stage => { groups[stage.id] = [] })
    filtered.forEach(lead => {
      const stage = getStage(lead)
      if (groups[stage]) groups[stage].push(lead)
      else groups.new.push(lead)
    })
    return groups
  }, [filtered, allStages])

  function handleCardClick(lead) {
    navigate(`/admin/crm/${lead.id}`)
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
      {/* Шапка */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100">
        {/* Верхняя строка */}
        <div className="flex items-center gap-3 px-4 py-3">
          <LayoutGrid size={17} className="text-[#1a1a18]" />
          <h1 className="text-sm font-bold text-[#1a1a18]">CRM</h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span>

          <div className="relative ml-2 flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-[#1a1a18] focus:bg-white transition-colors"
              placeholder="Поиск по имени, телефону, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddStage(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a1a18] text-white text-xs font-medium hover:bg-gray-800"
          >
            <Plus size={13} />
            Этап
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/leads')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1a1a18] border border-gray-200 rounded-lg px-3 py-2"
          >
            <List size={13} />
            Список
          </button>
        </div>

        {/* Фильтры */}
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] text-gray-400 flex-shrink-0">Источник:</span>
          {SOURCE_FILTER_OPTIONS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSourceFilter(f.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors border ${
                sourceFilter === f.id
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
              style={sourceFilter === f.id ? { backgroundColor: f.color, borderColor: f.color } : {}}
            >
              {f.label}
            </button>
          ))}

          <div className="w-px h-4 bg-gray-200 mx-1 flex-shrink-0" />

          <span className="text-[10px] text-gray-400 flex-shrink-0">Статус:</span>
          {ORDER_FILTER_OPTIONS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setOrderFilter(f.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors border ${
                orderFilter === f.id
                  ? 'bg-[#1a1a18] text-white border-[#1a1a18]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          Загрузка...
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div
            className="flex gap-3 h-full px-4 py-3"
            style={{ minWidth: `${allStages.length * 256 + 32}px` }}
          >
            {allStages.map(stage => {
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
                      {editingStage === stage.id ? (
                        <input
                          autoFocus
                          value={stageLabels[stage.id] ?? stage.label}
                          onChange={e => setStageLabels(prev => ({ ...prev, [stage.id]: e.target.value }))}
                          onBlur={() => setEditingStage(null)}
                          onKeyDown={e => e.key === 'Enter' && setEditingStage(null)}
                          className="text-xs font-bold bg-transparent outline-none border-b border-gray-400 w-full mr-2"
                        />
                      ) : (
                        <span
                          className="text-xs font-bold text-gray-800 cursor-pointer"
                          onDoubleClick={() => setEditingStage(stage.id)}
                          title="Двойной клик для редактирования"
                        >
                          {stageLabels[stage.id] ?? stage.label}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {stageTotal > 0 && (
                          <span className="text-[9px] font-medium text-gray-500 mr-1">
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

      {/* Модалка создания этапа */}
      {showAddStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Новый этап воронки</h3>
            <input
              autoFocus
              type="text"
              value={newStageName}
              onChange={e => setNewStageName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddStage()}
              placeholder="Название этапа..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a1a18] mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowAddStage(false); setNewStageName('') }}
                className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:border-gray-400"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleAddStage}
                disabled={!newStageName.trim()}
                className="flex-1 py-2 text-sm bg-[#1a1a18] text-white rounded-lg disabled:opacity-40"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
