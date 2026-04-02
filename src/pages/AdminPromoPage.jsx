import { useState, useEffect } from 'react'
import { Plus, Trash2, Tag } from 'lucide-react'
import { supabase } from '../lib/supabase'

const EMPTY_FORM = {
  code: '',
  discount_type: 'percent',
  discount_value: '',
  min_order_amount: '',
  max_uses: '',
  expires_at: '',
  is_active: true,
}

export default function AdminPromoPage() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
    setPromos(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.code || !form.discount_value) return alert('Заполните код и размер скидки')
    setSaving(true)
    await supabase.from('promo_codes').insert({
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
      is_active: form.is_active,
      used_count: 0,
    })
    setSaving(false)
    setForm(EMPTY_FORM)
    setShowForm(false)
    load()
  }

  async function handleDelete(id, code) {
    if (!window.confirm(`Удалить промокод "${code}"?`)) return
    await supabase.from('promo_codes').delete().eq('id', id)
    load()
  }

  async function toggleActive(id, val) {
    await supabase.from('promo_codes').update({ is_active: val }).eq('id', id)
    setPromos(prev => prev.map(p => p.id === id ? { ...p, is_active: val } : p))
  }

  const inputCls = 'border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-900'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Промокоды</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors">
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Новый промокод</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Код *</label>
              <input className={`${inputCls} uppercase`} placeholder="SALE20"
                value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Тип скидки</label>
              <select className={inputCls} value={form.discount_type}
                onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                <option value="percent">Процент (%)</option>
                <option value="fixed">Фиксированная (₸)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Размер скидки *</label>
              <input type="number" className={inputCls} placeholder={form.discount_type === 'percent' ? '20' : '5000'}
                value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Мин. сумма заказа</label>
              <input type="number" className={inputCls} placeholder="50000"
                value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Макс. использований</label>
              <input type="number" className={inputCls} placeholder="100"
                value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Дата окончания</label>
              <input type="date" className={inputCls}
                value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="accent-gray-900" />
              <span className="text-sm text-gray-700">Активен</span>
            </label>
            <div className="flex gap-3">
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                className="px-4 py-2 text-sm border border-gray-200 rounded hover:border-gray-900 text-gray-600 transition-colors">
                Отмена
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-60 transition-colors">
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : promos.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <Tag className="w-10 h-10 mb-3 text-gray-200" />
            <p className="text-sm">Промокодов пока нет</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium">Код</th>
                <th className="text-left px-4 py-3 font-medium">Тип</th>
                <th className="text-right px-4 py-3 font-medium">Скидка</th>
                <th className="text-center px-4 py-3 font-medium hidden sm:table-cell">Использовано</th>
                <th className="text-center px-4 py-3 font-medium hidden md:table-cell">Срок</th>
                <th className="text-center px-4 py-3 font-medium">Статус</th>
                <th className="text-right px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {promos.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{p.code}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.discount_type === 'percent' ? 'Процент' : 'Фиксированная'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {p.discount_type === 'percent' ? `${p.discount_value}%` : `${p.discount_value?.toLocaleString('ru-RU')} ₸`}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell">
                    {p.used_count || 0}{p.max_uses ? ` / ${p.max_uses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 hidden md:table-cell">
                    {p.expires_at ? new Date(p.expires_at).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(p.id, !p.is_active)}
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${p.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {p.is_active ? 'Активен' : 'Отключён'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(p.id, p.code)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
