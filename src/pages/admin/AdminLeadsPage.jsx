import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STATUS_OPTIONS = ['Новый', 'Связались', 'Купил']
const STATUS_STORAGE_KEY = 'admin_leads_statuses'

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
  const [statuses, setStatuses] = useState({})

  useEffect(() => {
    const savedStatuses = JSON.parse(localStorage.getItem(STATUS_STORAGE_KEY) || '{}')
    setStatuses(savedStatuses)
  }, [])

  useEffect(() => {
    async function loadLeads() {
      setLoading(true)

      const { data } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      setLeads(data || [])
      setLoading(false)
    }

    loadLeads()
  }, [])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const query = search.trim().toLowerCase()
      const source = getLeadSource(lead)
      const status = statuses[lead.id] || 'Новый'

      const matchesSearch = !query
        || lead.full_name?.toLowerCase().includes(query)
        || lead.email?.toLowerCase().includes(query)

      const matchesSource = sourceFilter === 'Все' || source === sourceFilter
      const matchesStatus = statusFilter === 'Все' || status === statusFilter

      return matchesSearch && matchesSource && matchesStatus
    })
  }, [leads, search, sourceFilter, statusFilter, statuses])

  function handleStatusChange(userId, nextStatus) {
    const updatedStatuses = { ...statuses, [userId]: nextStatus }
    setStatuses(updatedStatuses)
    localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(updatedStatuses))
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
                <th className="px-4 py-4 text-left font-medium">Статус</th>
                <th className="px-4 py-4 text-center font-medium">Действие</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, index) => {
                const source = getLeadSource(lead)
                const status = statuses[lead.id] || 'Новый'
                const whatsappPhone = formatPhoneForWhatsApp(lead.phone)

                return (
                  <tr key={lead.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50">
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
                      <select
                        value={status}
                        onChange={(event) => handleStatusChange(lead.id, event.target.value)}
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
    </div>
  )
}
