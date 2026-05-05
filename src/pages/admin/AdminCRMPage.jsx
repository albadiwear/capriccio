import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Search, List, ShoppingBag, Plus, X, Pencil, Trash2, Tag } from 'lucide-react'

const STAGES = [
  { id: 'new',       label: 'Новый лид',     color: '#9ca3af' },
  { id: 'contacted', label: 'Написали',       color: '#3b82f6' },
  { id: 'selection', label: 'Подбор образа',  color: '#8b5cf6' },
  { id: 'decision',  label: 'Думает',         color: '#f59e0b' },
  { id: 'paid',      label: 'Оплачено',       color: '#10b981' },
  { id: 'delivery',  label: 'Доставка',       color: '#06b6d4' },
  { id: 'delivered', label: 'Получено',       color: '#6366f1' },
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

const CUSTOM_STAGE_COLORS = ['#ec4899', '#f97316', '#84cc16', '#14b8a6', '#a855f7']
const TAG_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899']

const SOURCE_FILTER_OPTIONS = [
  { id: 'all',       label: 'Все' },
  { id: 'telegram',  label: '✈ Telegram' },
  { id: 'whatsapp',  label: '◉ WhatsApp' },
  { id: 'instagram', label: '◈ Instagram' },
  { id: 'web',       label: '⊕ Сайт' },
]

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

const SOURCE_BADGE = {
  telegram:  { label: 'Telegram',  bg: '#e8f4fd', text: '#1a7bbf', dot: '#229ED9' },
  whatsapp:  { label: 'WhatsApp',  bg: '#e8fdf0', text: '#16a34a', dot: '#25D366' },
  instagram: { label: 'Instagram', bg: '#fde8f0', text: '#be185d', dot: '#E1306C' },
  web:       { label: 'Сайт',      bg: '#f3f4f6', text: '#4b5563', dot: '#9ca3af' },
}

function LeadCard({ lead, onClick, tags, leadTags, onAltClick }) {
  const source = lead.chat?.source || 'web'
  const badge = SOURCE_BADGE[source] || SOURCE_BADGE.web
  const ordersCount = (lead.orders || []).length
  const totalSpent = (lead.orders || []).reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const lastMsg = lead.chat?.last_message
  const createdDate = new Date(lead.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
  const myTags = (leadTags[lead.id] || []).map(id => tags.find(t => t.id === id)).filter(Boolean)

  function handleClick(e) {
    if (e.altKey) {
      e.preventDefault()
      onAltClick(lead)
    } else {
      onClick(lead)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full text-left bg-white rounded-xl p-3.5 shadow-sm border border-gray-100/80 hover:shadow-md hover:border-gray-200 transition-all"
    >
      <div className="flex items-start gap-3 mb-2.5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${badge.dot}, ${badge.dot}99)` }}
        >
          {lead.avatar_url || lead.chat?.avatar_url ? (
            <img src={lead.avatar_url || lead.chat?.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            getInitials(lead.full_name || lead.email)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate leading-tight">
            {lead.full_name || lead.email || 'Аноним'}
          </p>
          {lead.phone && (
            <p className="text-xs text-gray-500 font-medium mt-0.5">{lead.phone}</p>
          )}
        </div>
        <span className="text-[11px] text-gray-400 flex-shrink-0 mt-0.5">{createdDate}</span>
      </div>

      {myTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {myTags.map(tag => (
            <span
              key={tag.id}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: tag.color }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}

      {lastMsg && (
        <p className="text-[11px] text-gray-400 line-clamp-1 mb-2.5 leading-relaxed">
          "{lastMsg}"
        </p>
      )}

      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md"
          style={{ background: badge.bg, color: badge.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: badge.dot }} />
          {badge.label}
        </span>
        {ordersCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
            <ShoppingBag size={9} />
            {ordersCount} · {Number(totalSpent).toLocaleString('ru-RU')} ₸
          </span>
        )}
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
  const [showManageStages, setShowManageStages] = useState(false)
  const [editingStageId, setEditingStageId] = useState(null)
  const [newStageName, setNewStageName] = useState('')
  const [customStages, setCustomStages] = useState([])
  const [tags, setTags] = useState([
    { id: 'hot',  label: 'Горячий',  color: '#ef4444' },
    { id: 'cold', label: 'Холодный', color: '#3b82f6' },
    { id: 'vip',  label: 'VIP',      color: '#f59e0b' },
    { id: 'new',  label: 'Новый',    color: '#10b981' },
  ])
  const [showTagManager, setShowTagManager] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [leadTags, setLeadTags] = useState({})
  const [tagTargetLead, setTagTargetLead] = useState(null)

  const allStages = useMemo(() => [...STAGES, ...customStages], [customStages])

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [{ data: users }, { data: chats }, { data: orders }] = await Promise.all([
        supabase.from('users').select('id, full_name, email, phone, avatar_url, lead_status, created_at').order('created_at', { ascending: false }),
        supabase.from('stylist_chats').select('id, user_id, source, last_message, updated_at, avatar_url').not('user_id', 'is', null),
        supabase.from('orders').select('id, user_id, total_amount, status'),
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
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, lead_status: newLabel } : l))
    await supabase.from('users').update({ lead_status: newLabel }).eq('id', leadId)
  }

  function handleAddStage() {
    if (!newStageName.trim()) return
    const id = `custom_${Date.now()}`
    const color = CUSTOM_STAGE_COLORS[customStages.length % CUSTOM_STAGE_COLORS.length]
    setCustomStages(prev => [...prev, { id, label: newStageName.trim(), color }])
    setStageLabels(prev => ({ ...prev, [id]: newStageName.trim() }))
    setNewStageName('')
  }

  function handleAddTag() {
    if (!newTagName.trim()) return
    setTags(prev => [...prev, {
      id: 'tag_' + Date.now(),
      label: newTagName.trim(),
      color: TAG_COLORS[prev.length % TAG_COLORS.length],
    }])
    setNewTagName('')
  }

  function toggleLeadTag(leadId, tagId) {
    setLeadTags(prev => {
      const current = prev[leadId] || []
      const has = current.includes(tagId)
      return { ...prev, [leadId]: has ? current.filter(t => t !== tagId) : [...current, tagId] }
    })
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
        orderFilter === 'with_orders' ? ordersCount > 0 :
        orderFilter === 'no_orders'   ? ordersCount === 0 :
        orderFilter === 'has_chat'    ? !!l.chat :
        true
      return matchesSearch && matchesSource && matchesOrder
    })
  }, [leads, search, sourceFilter, orderFilter])

  const stageLeads = useMemo(() => {
    const groups = {}
    allStages.forEach(s => { groups[s.id] = [] })
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

  function handleAltClick(lead) {
    setTagTargetLead(lead)
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

  function handleDragLeave() { setOverStage(null) }

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
    <div className="flex flex-col h-screen" style={{ background: '#f8f7f5' }}>
      {/* Шапка */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4">
        <h1 className="text-base font-bold text-gray-900 tracking-tight">CRM</h1>
        <span className="text-xs text-gray-400">{filtered.length} клиентов</span>

        <div className="relative ml-2">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="pl-8 pr-8 py-2 text-xs border border-gray-200 rounded-lg w-64 bg-gray-50 focus:outline-none focus:border-gray-400 focus:bg-white"
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 ml-1">
          {SOURCE_FILTER_OPTIONS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSourceFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                sourceFilter === f.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => setShowTagManager(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700"
          >
            <Tag size={12} /> Теги
          </button>
          <button
            type="button"
            onClick={() => setShowManageStages(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700"
          >
            <Plus size={12} /> Этап
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/leads')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100"
          >
            <List size={13} /> Список
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Загрузка...</div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-5 h-full px-6 py-5" style={{ minWidth: `${allStages.length * 280}px` }}>
            {allStages.map(stage => {
              const cards = stageLeads[stage.id] || []
              const stageTotal = cards.reduce(
                (s, l) => s + (l.orders || []).reduce((ss, o) => ss + Number(o.total_amount || 0), 0), 0
              )
              const isOver = overStage === stage.id

              return (
                <div
                  key={stage.id}
                  className="flex flex-col flex-shrink-0 w-[260px]"
                  onDragOver={e => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, stage.id)}
                >
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                    {editingStage === stage.id ? (
                      <input
                        autoFocus
                        value={stageLabels[stage.id] ?? stage.label}
                        onChange={e => setStageLabels(prev => ({ ...prev, [stage.id]: e.target.value }))}
                        onBlur={() => setEditingStage(null)}
                        onKeyDown={e => e.key === 'Enter' && setEditingStage(null)}
                        className="text-sm font-semibold bg-transparent outline-none border-b border-gray-400 flex-1"
                      />
                    ) : (
                      <span
                        className="text-sm font-semibold text-gray-800 flex-1 cursor-pointer hover:text-gray-600"
                        onDoubleClick={() => setEditingStage(stage.id)}
                      >
                        {stageLabels[stage.id] ?? stage.label}
                      </span>
                    )}
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: stage.color }}>
                      {cards.length}
                    </span>
                    {stageTotal > 0 && (
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {Number(stageTotal).toLocaleString('ru-RU')} ₸
                      </span>
                    )}
                  </div>

                  <div className={`flex-1 overflow-y-auto space-y-2 min-h-0 rounded-xl p-2 transition-colors ${isOver ? 'bg-gray-100' : 'bg-transparent'}`}>
                    {cards.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={e => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        className={`cursor-grab active:cursor-grabbing transition-opacity ${draggingId === lead.id ? 'opacity-40' : 'opacity-100'}`}
                      >
                        <LeadCard
                          lead={lead}
                          onClick={handleCardClick}
                          tags={tags}
                          leadTags={leadTags}
                          onAltClick={handleAltClick}
                        />
                      </div>
                    ))}
                    {cards.length === 0 && (
                      <div className="h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-[11px] text-gray-300">
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

      {/* Модалка управления этапами */}
      {showManageStages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowManageStages(false)}>
          <div className="bg-white rounded-2xl w-[480px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Управление этапами воронки</h3>
              <button type="button" onClick={() => setShowManageStages(false)}>
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-4 max-h-[400px] overflow-y-auto space-y-2">
              {allStages.map(stage => (
                <div key={stage.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                  {editingStageId === stage.id ? (
                    <input
                      autoFocus
                      value={stageLabels[stage.id] ?? stage.label}
                      onChange={e => setStageLabels(prev => ({ ...prev, [stage.id]: e.target.value }))}
                      onBlur={() => setEditingStageId(null)}
                      onKeyDown={e => e.key === 'Enter' && setEditingStageId(null)}
                      className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-gray-900"
                    />
                  ) : (
                    <span className="flex-1 text-sm font-medium text-gray-800">{stageLabels[stage.id] ?? stage.label}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingStageId(stage.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  {stage.id.startsWith('custom_') && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomStages(prev => prev.filter(s => s.id !== stage.id))
                        setStageLabels(prev => { const n = { ...prev }; delete n[stage.id]; return n })
                      }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Добавить этап</p>
              <div className="flex gap-2">
                <input
                  value={newStageName}
                  onChange={e => setNewStageName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddStage()}
                  placeholder="Название нового этапа..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
                <button
                  type="button"
                  onClick={handleAddStage}
                  disabled={!newStageName.trim()}
                  className="px-4 py-2 bg-[#1a1a18] text-white text-sm rounded-lg disabled:opacity-40 font-medium"
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модалка управления тегами */}
      {showTagManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowTagManager(false)}>
          <div className="bg-white rounded-2xl w-[400px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Управление тегами</h3>
              <button type="button" onClick={() => setShowTagManager(false)}>
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-2 max-h-[300px] overflow-y-auto">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: tag.color }} />
                  <span className="flex-1 text-sm font-medium text-gray-800">{tag.label}</span>
                  <button
                    type="button"
                    onClick={() => setTags(prev => prev.filter(t => t.id !== tag.id))}
                    className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                  placeholder="Название тега... (Enter)"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!newTagName.trim()}
                  className="px-4 py-2 bg-[#1a1a18] text-white text-sm rounded-lg disabled:opacity-40 font-medium"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модалка назначения тегов лиду (Alt+клик) */}
      {tagTargetLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setTagTargetLead(null)}>
          <div className="bg-white rounded-2xl w-[360px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">
                Теги: {tagTargetLead.full_name || tagTargetLead.email || 'Аноним'}
              </h3>
              <button type="button" onClick={() => setTagTargetLead(null)}>
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-2">
              {tags.map(tag => {
                const active = (leadTags[tagTargetLead.id] || []).includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleLeadTag(tagTargetLead.id, tag.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                      active ? 'border-transparent' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                    }`}
                    style={active ? { background: tag.color + '22', borderColor: tag.color + '55' } : {}}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: tag.color }} />
                    <span className="flex-1 text-left text-sm font-medium text-gray-800">{tag.label}</span>
                    {active && <span className="text-[10px] font-bold" style={{ color: tag.color }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
