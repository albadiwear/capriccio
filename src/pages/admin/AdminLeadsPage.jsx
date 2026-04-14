import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STATUS_OPTIONS = ['Новый', 'Связались', 'Купил']

function getLeadSource(lead) {
  if (lead.user_metadata?.provider === 'google') return 'Google'
  if (lead.from_promo || lead.user_metadata?.from_promo) return 'Promo'
  return 'Сайт'
}

function formatPhoneForWhatsApp(phone) {
  return String(phone || '').replace(/\D/g, '')
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('Все')
  const [statusFilter, setStatusFilter] = useState('Все')
  const [selectedLead, setSelectedLead] = useState(null)
  const [profile, setProfile] = useState(null)
  const [leadOrders, setLeadOrders] = useState([])
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadLeads() {
      setLoading(true)

      const { data } = await supabase
        .from('users')
        .select('*, orders(id, total_amount, status)')
        .order('created_at', { ascending: false })

      setLeads(data || [])
      setLoading(false)
    }

    loadLeads()

    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload) => {
        setLeads((prev) => [payload.new, ...prev])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const query = search.trim().toLowerCase()
      const source = getLeadSource(lead)
      const hasOrders = (lead.orders || []).length > 0
      const status = hasOrders ? 'Купил' : (lead.lead_status || 'Новый')

      const matchesSearch = !query
        || lead.full_name?.toLowerCase().includes(query)
        || lead.email?.toLowerCase().includes(query)

      const matchesSource = sourceFilter === 'Все' || source === sourceFilter
      const matchesStatus = statusFilter === 'Все' || status === statusFilter

      return matchesSearch && matchesSource && matchesStatus
    })
  }, [leads, search, sourceFilter, statusFilter])

  async function handleStatusChange(userId, nextStatus) {
    setLeads((prev) => prev.map((l) => l.id === userId ? { ...l, lead_status: nextStatus } : l))
    await supabase.from('users').update({ lead_status: nextStatus }).eq('id', userId)
  }

  async function openCard(lead) {
    setSelectedLead(lead)
    setLoadingProfile(true)
    setProfile(null)
    setLeadOrders([])

    const [{ data: profileData }, { data: ordersData }] = await Promise.all([
      supabase.from('stylist_profiles').select('*').eq('user_id', lead.id).single(),
      supabase.from('orders').select('id, created_at, total_amount, status').eq('user_id', lead.id).order('created_at', { ascending: false }).limit(5)
    ])

    setProfile(profileData || null)
    setEditForm({
      full_name: lead.full_name || '',
      phone: lead.phone || '',
      age: profileData?.age || '',
      city: profileData?.city || '',
      height: profileData?.height || '',
      weight: profileData?.weight || '',
      chest: profileData?.chest || '',
      waist: profileData?.waist || '',
      hips: profileData?.hips || '',
      clothing_size: profileData?.clothing_size || '',
      shoe_size: profileData?.shoe_size || '',
      body_type: profileData?.body_type || '',
      color_type: profileData?.color_type || '',
      lifestyle: profileData?.lifestyle || '',
      budget_min: profileData?.budget_min || '',
      budget_max: profileData?.budget_max || '',
      notes: profileData?.notes || '',
    })
    setEditing(false)
    setSaving(false)
    setLeadOrders(ordersData || [])
    setLoadingProfile(false)
  }

  async function handleSave() {
    if (!selectedLead) return
    setSaving(true)
    try {
      await supabase.from('users').update({
        full_name: editForm.full_name,
        phone: editForm.phone,
      }).eq('id', selectedLead.id)

      const profilePayload = {
        user_id: selectedLead.id,
        age: editForm.age ? parseInt(editForm.age) : null,
        city: editForm.city || null,
        height: editForm.height ? parseFloat(editForm.height) : null,
        weight: editForm.weight ? parseFloat(editForm.weight) : null,
        chest: editForm.chest ? parseFloat(editForm.chest) : null,
        waist: editForm.waist ? parseFloat(editForm.waist) : null,
        hips: editForm.hips ? parseFloat(editForm.hips) : null,
        clothing_size: editForm.clothing_size || null,
        shoe_size: editForm.shoe_size || null,
        body_type: editForm.body_type || null,
        color_type: editForm.color_type || null,
        lifestyle: editForm.lifestyle || null,
        budget_min: editForm.budget_min ? parseInt(editForm.budget_min) : null,
        budget_max: editForm.budget_max ? parseInt(editForm.budget_max) : null,
        notes: editForm.notes || null,
        updated_at: new Date().toISOString(),
      }
      await supabase.from('stylist_profiles').upsert(profilePayload, { onConflict: 'user_id' })

      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, full_name: editForm.full_name, phone: editForm.phone } : l))
      setSelectedLead(prev => ({ ...prev, full_name: editForm.full_name, phone: editForm.phone }))
      setProfile(prev => ({ ...(prev || {}), ...profilePayload }))
      setEditing(false)
    } catch (e) {
      console.error('Ошибка сохранения лида:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Лиды</h1>
          <p className="mt-1 text-sm text-gray-500">Всего лидов: {filteredLeads.length}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по имени или email"
            className="h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
          />

          <select
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            className="h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
          >
            {['Все', 'Promo', 'Google', 'Сайт'].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
          >
            {['Все', ...STATUS_OPTIONS].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-11 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-gray-400">
            <Users className="mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm">Лиды не найдены</p>
          </div>
        ) : (
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="px-4 py-4 text-left font-medium">№</th>
                <th className="px-4 py-4 text-left font-medium">Имя</th>
                <th className="px-4 py-4 text-left font-medium">Телефон</th>
                <th className="px-4 py-4 text-left font-medium">Email</th>
                <th className="px-4 py-4 text-left font-medium">Источник</th>
                <th className="px-4 py-4 text-left font-medium">Дата регистрации</th>
                <th className="px-4 py-4 text-left font-medium">Заказы</th>
                <th className="px-4 py-4 text-left font-medium">Статус</th>
                <th className="px-4 py-4 text-center font-medium">Действие</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, index) => {
                const source = getLeadSource(lead)
                const orders = lead.orders || []
                const hasOrders = orders.length > 0
                const ordersTotal = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
                const status = hasOrders ? 'Купил' : (lead.lead_status || 'Новый')
                const whatsappPhone = formatPhoneForWhatsApp(lead.phone)

                return (
                  <tr key={lead.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50 cursor-pointer" onClick={() => openCard(lead)}>
                    <td className="px-4 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-4 py-4 font-medium text-gray-900">{lead.full_name || '—'}</td>
                    <td className="px-4 py-4 text-gray-600">{lead.phone || '—'}</td>
                    <td className="px-4 py-4 text-gray-600">{lead.email || '—'}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                        {source}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td className="px-4 py-4">
                      {hasOrders ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-700">
                          {orders.length} {orders.length === 1 ? 'заказ' : orders.length < 5 ? 'заказа' : 'заказов'} · {ordersTotal.toLocaleString('ru-RU')} ₸
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={status}
                        onChange={(event) => handleStatusChange(lead.id, event.target.value)}
                        disabled={hasOrders}
                        onClick={e => e.stopPropagation()}
                        className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {whatsappPhone ? (
                        <a
                          href={`https://wa.me/${whatsappPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-green-600 transition-colors hover:border-green-500 hover:text-green-700"
                          aria-label="Связаться в WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setSelectedLead(null)
              setEditing(false)
              setSaving(false)
            }}
          />
          <div className="relative bg-white rounded-xl w-full max-w-2xl my-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-sm font-medium text-pink-700">
                  {selectedLead.full_name?.charAt(0) || selectedLead.email?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedLead.full_name || '—'}</p>
                  <p className="text-xs text-gray-500">{selectedLead.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                {!editing ? (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 mr-2"
                  >
                    Редактировать
                  </button>
                ) : (
                  <div className="flex gap-2 mr-2">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="text-sm text-white bg-[#1a1a18] rounded-lg px-3 py-1.5 disabled:opacity-60"
                    >
                      {saving ? 'Сохраняем...' : 'Сохранить'}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedLead(null)
                    setEditing(false)
                    setSaving(false)
                  }}
                  className="text-gray-400 hover:text-gray-900"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
              {loadingProfile ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Контакты</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Имя', key: 'full_name' },
                        { label: 'Телефон', key: 'phone' },
                        { label: 'Город', key: 'city' },
                        { label: 'Возраст', key: 'age', type: 'number' },
                      ].map(({ label, key, type }) => (
                        <div key={key} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">{label}</p>
                          {editing ? (
                            <input
                              type={type || 'text'}
                              value={editForm[key] ?? ''}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                              className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-900 outline-none focus:border-gray-900"
                            />
                          ) : (
                            <p className="text-sm font-medium text-gray-900">
                              {key === 'full_name'
                                ? (selectedLead.full_name || '—')
                                : key === 'phone'
                                  ? (selectedLead.phone || '—')
                                  : key === 'city'
                                    ? (profile?.city || selectedLead.city || '—')
                                    : (profile?.age ? `${profile.age} лет` : '—')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Дата регистрации</p>
                        <p className="text-sm font-medium text-gray-900">{new Date(selectedLead.created_at).toLocaleDateString('ru-RU')}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Источник</p>
                        <p className="text-sm font-medium text-gray-900">{getLeadSource(selectedLead)}</p>
                      </div>
                    </div>
                  </div>

                  {(editing || profile) && (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Параметры</p>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: 'Рост', key: 'height', type: 'number', suffix: ' см' },
                            { label: 'Вес', key: 'weight', type: 'number', suffix: ' кг' },
                            { label: 'Размер', key: 'clothing_size', type: 'text' },
                            { label: 'Грудь', key: 'chest', type: 'number', suffix: ' см' },
                            { label: 'Талия', key: 'waist', type: 'number', suffix: ' см' },
                            { label: 'Бёдра', key: 'hips', type: 'number', suffix: ' см' },
                            { label: 'Обувь', key: 'shoe_size', type: 'number' },
                          ].map(({ label, key, type, suffix }) => (
                            <div key={key} className="bg-gray-50 rounded-lg p-2 text-center">
                              <p className="text-xs text-gray-400 mb-1">{label}</p>
                              {editing ? (
                                <input
                                  type={type || 'text'}
                                  value={editForm[key] ?? ''}
                                  onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-900 outline-none focus:border-gray-900 text-center"
                                />
                              ) : (
                                <p className="text-sm font-medium text-gray-900">
                                  {profile?.[key] || profile?.[key] === 0
                                    ? `${profile[key]}${suffix || ''}`
                                    : '—'}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Стиль</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Тип фигуры', key: 'body_type', type: 'text' },
                            { label: 'Цветотип', key: 'color_type', type: 'text' },
                            { label: 'Образ жизни', key: 'lifestyle', type: 'text' },
                            { label: 'Бюджет от', key: 'budget_min', type: 'number', suffix: ' ₸' },
                            { label: 'Бюджет до', key: 'budget_max', type: 'number', suffix: ' ₸' },
                          ].map(({ label, key, type, suffix }) => (
                            <div key={key} className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1">{label}</p>
                              {editing ? (
                                <input
                                  type={type || 'text'}
                                  value={editForm[key] ?? ''}
                                  onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-900 outline-none focus:border-gray-900"
                                />
                              ) : (
                                <p className="text-sm font-medium text-gray-900">
                                  {profile?.[key] || profile?.[key] === 0
                                    ? `${profile[key]}${suffix || ''}`
                                    : '—'}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        {profile.style_preferences?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {profile.style_preferences.map(s => (
                              <span key={s} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Заметки</p>
                    {editing ? (
                      <textarea
                        value={editForm.notes ?? ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        placeholder="Заметки о клиенте..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 resize-none"
                      />
                    ) : (
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 min-h-[60px]">
                        {profile?.notes || <span className="text-gray-400">Нет заметок</span>}
                      </p>
                    )}
                  </div>

                  {leadOrders.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Последние заказы</p>
                      <div className="space-y-2">
                        {leadOrders.map(o => (
                          <div key={o.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <div>
                              <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('ru-RU')}</p>
                              <p className="text-xs text-gray-500">#{o.id.slice(0, 8)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">{o.total_amount?.toLocaleString('ru-RU')} ₸</p>
                              <p className="text-xs text-gray-400">{o.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!profile && leadOrders.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Анкета не заполнена, заказов нет</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
