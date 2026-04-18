import { useEffect, useState } from 'react'
import { Users2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminTeamPage() {
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignEmail, setAssignEmail] = useState('')
  const [assignRole, setAssignRole] = useState('manager')
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState('')

  async function loadTeam() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, role, created_at')
      .in('role', ['manager', 'admin'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('load team error:', error)
      setError('Не удалось загрузить команду')
    }

    setTeam(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadTeam()
  }, [])

  async function updateRole(userId, role) {
    setTeam((prev) =>
      prev.map((item) => (item.id === userId ? { ...item, role } : item))
    )

    const { error } = await supabase.from('users').update({ role }).eq('id', userId)
    if (error) {
      console.error('update role error:', error)
      await loadTeam()
      return
    }

    if (role === 'user') {
      setTeam((prev) => prev.filter((item) => item.id !== userId))
    }
  }

  async function handleAssign() {
    const email = assignEmail.trim()
    if (!email) return

    setAssigning(true)
    setError('')

    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, full_name, phone, role, created_at')
      .ilike('email', email)
      .maybeSingle()

    if (findError) {
      console.error('find user by email error:', findError)
      setError('Не удалось найти пользователя')
      setAssigning(false)
      return
    }

    if (!user?.id) {
      setError('Пользователь с таким email не найден')
      setAssigning(false)
      return
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ role: assignRole })
      .eq('id', user.id)

    if (updateError) {
      console.error('assign role error:', updateError)
      setError('Не удалось назначить роль')
      setAssigning(false)
      return
    }

    setTeam((prev) => {
      const next = prev.filter((item) => item.id !== user.id)
      if (assignRole === 'manager' || assignRole === 'admin') {
        return [{ ...user, role: assignRole }, ...next]
      }
      return next
    })

    setAssignEmail('')
    setAssignRole('manager')
    setAssigning(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Команда</h1>
        <p className="mt-1 text-sm text-gray-500">Управление доступом менеджеров и администраторов</p>
      </div>

      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Назначить сотрудника</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900">
            <Users2 className="h-4 w-4 text-white" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_200px_160px]">
          <input
            type="email"
            value={assignEmail}
            onChange={(event) => setAssignEmail(event.target.value)}
            placeholder="Email пользователя"
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
          />

          <select
            value={assignRole}
            onChange={(event) => setAssignRole(event.target.value)}
            className="h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
          >
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>

          <button
            type="button"
            onClick={handleAssign}
            disabled={assigning || !assignEmail.trim()}
            className="h-11 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
          >
            Назначить
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-10 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : team.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <Users2 className="mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm">Сотрудников не найдено</p>
          </div>
        ) : (
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="px-4 py-3 text-left font-medium">Имя</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Телефон</th>
                <th className="px-4 py-3 text-left font-medium">Роль</th>
                <th className="px-4 py-3 text-left font-medium">Дата добавления</th>
                <th className="px-4 py-3 text-center font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{member.full_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{member.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{member.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={member.role || 'user'}
                      onChange={(event) => updateRole(member.id, event.target.value)}
                      className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 outline-none transition-colors focus:border-gray-900"
                    >
                      <option value="user">user</option>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(member.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => updateRole(member.id, 'user')}
                        className="inline-flex h-9 items-center rounded-lg border border-gray-200 px-3 text-xs font-medium text-red-600 transition-colors hover:border-red-500 hover:text-red-700"
                      >
                        Удалить доступ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

