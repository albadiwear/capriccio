import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import ChatDialog from '../../components/admin/ChatDialog'
import {
  ArrowLeft, MessageCircle, Send, Phone, Camera,
  ShoppingBag, Heart, ChevronRight, Plus, User, X,
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

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function EditableField({ label, value, onSave, type = 'text', options = null }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(() => value || '')
  const compact = !label

  async function handleSave() {
    setEditing(false)
    if (val === (value || '')) return
    await onSave(val)
  }

  return (
    <div className={compact ? 'group' : 'flex justify-between items-center py-1.5 border-b border-[#f0ede8] last:border-0 group'}>
      {!compact && <span className="text-xs text-[#888780] flex-shrink-0">{label}</span>}
      {editing ? (
        options ? (
          <select
            autoFocus
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={handleSave}
            className={`text-xs text-[#1a1a18] border border-[#D4537E] rounded-lg px-2 py-0.5 outline-none ${compact ? 'w-[140px]' : 'max-w-[55%]'}`}
          >
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            autoFocus
            type={type}
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') {
                setVal(value || '')
                setEditing(false)
              }
            }}
            className={`text-xs text-[#1a1a18] border border-[#D4537E] rounded-lg px-2 py-0.5 outline-none ${compact ? 'w-[140px]' : 'text-right max-w-[55%]'}`}
          />
        )
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`text-xs font-medium text-[#1a1a18] cursor-pointer hover:text-[#D4537E] transition-colors group-hover:underline decoration-dotted ${compact ? '' : 'text-right max-w-[55%]'}`}
        >
          {value || <span className="text-[#888780]">—</span>}
        </span>
      )}
    </div>
  )
}

export default function AdminCRMDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [notes, setNotes] = useState([])
  const [orders, setOrders] = useState([])
  const [chats, setChats] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [customFields, setCustomFields] = useState([])

  const [tab, setTab] = useState('chats')
  const [mobileSection, setMobileSection] = useState('info')
  const [openChatId, setOpenChatId] = useState(null)

  const [noteText, setNoteText] = useState('')
  const [addingField, setAddingField] = useState(false)
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    try {
      const [userRes, notesRes, ordersRes, chatsRes, wishlistRes, profileRes, customFieldsRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', id).maybeSingle(),
        supabase.from('lead_notes').select('*').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('orders').select('id, created_at, total_amount, status').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('stylist_chats').select('id, source, title, last_message, updated_at, avatar_url').eq('user_id', id).order('updated_at', { ascending: false }),
        supabase.from('wishlist').select('id, product_id').eq('user_id', id),
        supabase.from('stylist_profiles').select('*').eq('user_id', id).maybeSingle(),
        supabase.from('crm_custom_fields').select('*').eq('user_id', id).order('created_at', { ascending: true }),
      ])
      const userData = userRes.data || null
      if (!userData) {
        navigate('/admin/crm')
        return
      }
      const productIds = wishlistRes.data?.map(w => w.product_id) || []
      const productsRes = productIds.length > 0
        ? await supabase.from('products').select('id, name, price, images').in('id', productIds)
        : { data: [] }
      const wishlistWithProducts = wishlistRes.data?.map(w => ({
        ...w,
        product: productsRes.data?.find(p => p.id === w.product_id),
      })) || []

      setUser(userData)
      setProfile(profileRes.data || null)
      setNotes(notesRes.data || [])
      setOrders(ordersRes.data || [])
      setChats(chatsRes.data || [])
      setWishlist(wishlistWithProducts)
      setCustomFields(customFieldsRes.data || [])
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

  async function saveUserField(field, value) {
    setUser(prev => ({ ...prev, [field]: value }))
    await supabase.from('users').update({ [field]: value }).eq('id', id)
  }

  async function saveProfileField(field, value) {
    const nextValue = Number.isNaN(value) ? null : value
    const nextProfile = profile ? { ...profile, [field]: nextValue } : { user_id: id, [field]: nextValue }
    setProfile(nextProfile)

    if (profile?.id) {
      await supabase.from('stylist_profiles').update({ [field]: nextValue }).eq('id', profile.id)
    } else {
      const { data } = await supabase
        .from('stylist_profiles')
        .insert({ user_id: id, [field]: nextValue })
        .select()
        .single()
      if (data) setProfile(data)
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return
    try {
      const { data } = await supabase
        .from('lead_notes')
        .insert({ user_id: id, content: noteText.trim() })
        .select()
        .single()
      if (data) setNotes(prev => [data, ...prev])
      setNoteText('')
    } catch (error) {
      void error
    }
  }

  async function handleAddCustomField() {
    if (!newFieldLabel.trim()) return
    try {
      const { data } = await supabase
        .from('crm_custom_fields')
        .insert({ user_id: id, label: newFieldLabel.trim(), value: newFieldValue.trim() })
        .select()
        .single()
      if (data) setCustomFields(prev => [...prev, data])
      setNewFieldLabel('')
      setNewFieldValue('')
      setAddingField(false)
    } catch (error) {
      void error
    }
  }

  async function handleDeleteCustomField(fieldId) {
    await supabase.from('crm_custom_fields').delete().eq('id', fieldId)
    setCustomFields(prev => prev.filter(f => f.id !== fieldId))
  }

  async function handleSaveCustomField(fieldId, newValue) {
    await supabase.from('crm_custom_fields').update({ value: newValue }).eq('id', fieldId)
    setCustomFields(prev => prev.map(f => (f.id === fieldId ? { ...f, value: newValue } : f)))
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

  // ── Helpers ────────────────────────────────────────────────────────────────
  const firstChatSource = chats[0]?.source || null

  const SOURCE_BADGE_CFG = {
    telegram:  { label: 'Telegram',  bg: '#e8f4fd', text: '#1a7bbf' },
    whatsapp:  { label: 'WhatsApp',  bg: '#e8fdf0', text: '#16a34a' },
    instagram: { label: 'Instagram', bg: '#fde8f0', text: '#be185d' },
    web:       { label: 'Сайт',      bg: '#f3f4f6', text: '#4b5563' },
  }

  // ── Profile block (shared) ─────────────────────────────────────────────────
  const ProfileBlock = (
    <div className="space-y-3">

      {/* Секция 1: Шапка */}
      <div className="bg-white rounded-2xl p-4 border border-[#f0ede8]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-[#1a1a18] flex items-center justify-center text-white font-bold text-base flex-shrink-0 overflow-hidden">
            {user.avatar_url
              ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              : <User size={22} className="text-white/70" />
            }
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#1a1a18] truncate">{user.full_name || 'Без имени'}</p>
            {user.email && <p className="text-xs text-[#888780] truncate mt-0.5">{user.email}</p>}
            {user.phone && <p className="text-xs text-[#888780] mt-0.5">{user.phone}</p>}
            {firstChatSource && (() => {
              const cfg = SOURCE_BADGE_CFG[firstChatSource] || SOURCE_BADGE_CFG.web
              return (
                <span
                  className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: cfg.bg, color: cfg.text }}
                >
                  {cfg.label}
                </span>
              )
            })()}
          </div>
        </div>

        <div>
          <EditableField key={`full_name-${user.full_name || ''}`} label="Имя" value={user.full_name} onSave={v => saveUserField('full_name', v)} />
          <EditableField key={`phone-${user.phone || ''}`} label="Телефон" value={user.phone} onSave={v => saveUserField('phone', v)} />
          <EditableField key={`email-${user.email || ''}`} label="Email" value={user.email} onSave={v => saveUserField('email', v)} />
          <EditableField key={`city-${user.city || ''}`} label="Город" value={user.city} onSave={v => saveUserField('city', v)} />
          <div className="flex items-center justify-between py-1.5 border-b border-[#f0ede8]">
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
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-[#888780]">Регистрация</span>
            <span className="text-xs font-medium text-[#1a1a18]">{formatDate(user.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Секция 2: Параметры */}
      <div className="bg-white rounded-2xl p-4 border border-[#f0ede8]">
        <p className="text-[10px] font-bold text-[#888780] uppercase tracking-wider mb-2">Параметры</p>
        <div>
          <EditableField key={`age-${profile?.age || ''}`} label="Возраст" value={profile?.age ? profile.age + ' лет' : ''} onSave={v => saveProfileField('age', parseInt(v))} type="number" />
          <EditableField key={`clothing_size-${profile?.clothing_size || ''}`} label="Размер одежды" value={profile?.clothing_size} onSave={v => saveProfileField('clothing_size', v)} options={['XS', 'S', 'M', 'L', 'XL', 'XXL', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60']} />
          <EditableField key={`shoe_size-${profile?.shoe_size || ''}`} label="Размер обуви" value={profile?.shoe_size} onSave={v => saveProfileField('shoe_size', parseInt(v))} type="number" />
          <EditableField key={`height-${profile?.height || ''}`} label="Рост" value={profile?.height ? profile.height + ' см' : ''} onSave={v => saveProfileField('height', parseInt(v))} type="number" />
          <EditableField key={`budget_min-${profile?.budget_min || ''}`} label="Бюджет мин" value={profile?.budget_min ? profile.budget_min.toLocaleString('ru-RU') + ' ₸' : ''} onSave={v => saveProfileField('budget_min', parseInt(v.replace(/\D/g, '')))} />
          <EditableField key={`budget_max-${profile?.budget_max || ''}`} label="Бюджет макс" value={profile?.budget_max ? profile.budget_max.toLocaleString('ru-RU') + ' ₸' : ''} onSave={v => saveProfileField('budget_max', parseInt(v.replace(/\D/g, '')))} />
          <EditableField key={`style_preferences-${Array.isArray(profile?.style_preferences) ? profile.style_preferences.join(',') : profile?.style_preferences || ''}`} label="Стиль" value={Array.isArray(profile?.style_preferences) ? profile.style_preferences.join(', ') : profile?.style_preferences} onSave={v => saveProfileField('style_preferences', v)} />
          <EditableField key={`color_type-${profile?.color_type || ''}`} label="Цветотип" value={profile?.color_type} onSave={v => saveProfileField('color_type', v)} options={['spring', 'summer', 'autumn', 'winter']} />
          <EditableField key={`body_type-${profile?.body_type || ''}`} label="Телосложение" value={profile?.body_type} onSave={v => saveProfileField('body_type', v)} options={['hourglass', 'pear', 'apple', 'rectangle', 'inverted_triangle']} />
          <EditableField key={`favorite_colors-${Array.isArray(profile?.favorite_colors) ? profile.favorite_colors.join(',') : profile?.favorite_colors || ''}`} label="Любимые цвета" value={Array.isArray(profile?.favorite_colors) ? profile.favorite_colors.join(', ') : profile?.favorite_colors} onSave={v => saveProfileField('favorite_colors', v)} />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#f0ede8] mb-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-[#888780] uppercase tracking-wider">Доп. поля</p>
          <button
            type="button"
            onClick={() => setAddingField(true)}
            className="flex items-center gap-1 text-[10px] text-[#D4537E] hover:opacity-70 transition-opacity"
          >
            <Plus size={10} /> Добавить
          </button>
        </div>

        {customFields.length === 0 && !addingField && (
          <p className="text-xs text-[#888780]">Нет дополнительных полей</p>
        )}

        {customFields.map(field => (
          <div key={field.id} className="flex justify-between items-center py-1.5 border-b border-[#f0ede8] last:border-0 group">
            <span className="text-xs text-[#888780]">{field.label}</span>
            <div className="flex items-center gap-2">
              <EditableField
                key={`${field.id}-${field.value || ''}`}
                label=""
                value={field.value}
                onSave={v => handleSaveCustomField(field.id, v)}
              />
              <button
                type="button"
                onClick={() => handleDeleteCustomField(field.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} className="text-[#888780] hover:text-[#e8453c]" />
              </button>
            </div>
          </div>
        ))}

        {addingField && (
          <div className="mt-2 space-y-2">
            <input
              autoFocus
              placeholder="Название поля"
              value={newFieldLabel}
              onChange={e => setNewFieldLabel(e.target.value)}
              className="w-full border border-[#f0ede8] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#D4537E]"
            />
            <input
              placeholder="Значение"
              value={newFieldValue}
              onChange={e => setNewFieldValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddCustomField() }}
              className="w-full border border-[#f0ede8] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#D4537E]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddCustomField}
                disabled={!newFieldLabel.trim()}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  newFieldLabel.trim() ? 'bg-[#D4537E] text-white' : 'bg-[#f0ede8] text-[#888780] cursor-not-allowed'
                }`}
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => { setAddingField(false); setNewFieldLabel(''); setNewFieldValue('') }}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-[#f0ede8] text-[#888780]"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Секция 3: Итоги */}
      <div className="bg-white rounded-2xl p-4 border border-[#f0ede8]">
        <p className="text-[10px] font-bold text-[#888780] uppercase tracking-wider mb-2">Итоги</p>
        <div>
          {[
            { label: 'Заказов',       val: orders.length },
            { label: 'Потрачено',     val: `${Number(totalSpent).toLocaleString('ru-RU')} ₸` },
            { label: 'В избранном',   val: `${wishlist.length} товаров` },
          ].map(({ label, val }) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#f0ede8] last:border-0">
              <span className="text-xs text-[#888780]">{label}</span>
              <span className="text-xs font-bold text-[#1a1a18]">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Секция 4: Заметки */}
      <div className="bg-white rounded-2xl p-4 border border-[#f0ede8]">
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
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Добавить заметку..."
          rows={2}
          className="w-full border border-[#f0ede8] rounded-xl px-3 py-2 text-xs text-[#1a1a18] outline-none focus:border-[#D4537E] resize-none mb-2 placeholder:text-[#888780] bg-[#f9f8f6]"
        />
        <button
          type="button"
          onClick={handleAddNote}
          disabled={!noteText.trim()}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            noteText.trim()
              ? 'bg-[#D4537E] text-white hover:bg-[#c44370] cursor-pointer'
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
              <div key={chat.id}>
                <button
                  type="button"
                  onClick={() => setOpenChatId(openChatId === chat.id ? null : chat.id)}
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
                    {(chat.last_message || chat.title) && (
                      <p className="text-[11px] text-[#888780] truncate">{chat.last_message || chat.title || '—'}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-[#888780] flex-shrink-0">{formatDate(chat.updated_at)}</span>
                </button>
                {openChatId === chat.id && (
                  <div className="mt-2 rounded-2xl border border-[#f0ede8] overflow-hidden h-[500px]">
                    <ChatDialog selectedChat={chat} compact={true} onClose={() => setOpenChatId(null)} />
                  </div>
                )}
              </div>
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
              const product = item.product
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
