import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const EMPTY_FORM = {
  title: '',
  link_url: '',
  link_label: '',
  sort_order: 0,
  is_active: true,
  image_url: '',
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-md my-4 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-900'

export default function AdminStoriesPage() {
  const fileInputRef = useRef(null)
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('stories')
      .select('*')
      .order('sort_order', { ascending: true })
    setStories(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(story) {
    setEditing(story.id)
    setForm({
      title: story.title || '',
      link_url: story.link_url || '',
      link_label: story.link_label || '',
      sort_order: story.sort_order ?? 0,
      is_active: story.is_active ?? true,
      image_url: story.image_url || '',
    })
    setModalOpen(true)
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('stories').upload(path, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('stories').getPublicUrl(path)
      setForm((f) => ({ ...f, image_url: publicUrl }))
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleSave() {
    if (!form.image_url) return alert('Загрузите фото')
    setSaving(true)
    const payload = {
      title: form.title,
      link_url: form.link_url || null,
      link_label: form.link_label || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
      image_url: form.image_url,
    }
    if (editing) {
      await supabase.from('stories').update(payload).eq('id', editing)
    } else {
      await supabase.from('stories').insert(payload)
    }
    setSaving(false)
    setModalOpen(false)
    load()
  }

  async function handleDelete(id) {
    if (!window.confirm('Удалить сторис?')) return
    await supabase.from('stories').delete().eq('id', id)
    load()
  }

  async function toggleActive(story) {
    await supabase.from('stories').update({ is_active: !story.is_active }).eq('id', story.id)
    load()
  }

  async function updateSortOrder(id, value) {
    await supabase.from('stories').update({ sort_order: Number(value) }).eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Сторис</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить сторис
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <p className="text-sm">Сторис нет. Добавьте первую.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-center px-4 py-3 font-medium w-20">Порядок</th>
                <th className="text-left px-4 py-3 font-medium">Превью</th>
                <th className="text-left px-4 py-3 font-medium">Название</th>
                <th className="text-left px-4 py-3 font-medium">Ссылка</th>
                <th className="text-center px-4 py-3 font-medium">Статус</th>
                <th className="text-right px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {stories.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      defaultValue={s.sort_order}
                      onBlur={(e) => updateSortOrder(s.id, e.target.value)}
                      className="w-14 text-center border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-gray-900"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      {s.image_url && (
                        <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {s.title || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {s.link_url || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(s)}
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        s.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                          : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
                      }`}
                    >
                      {s.is_active ? 'Активна' : 'Скрыта'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal
          title={editing ? 'Редактировать сторис' : 'Новая сторис'}
          onClose={() => setModalOpen(false)}
        >
          <div className="space-y-4">
            <Field label="Фото *">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-10 border border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors disabled:opacity-60"
              >
                {uploading ? 'Загрузка...' : 'Выбрать фото'}
              </button>
              {form.image_url && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={form.image_url}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, image_url: '' }))}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Удалить
                  </button>
                </div>
              )}
            </Field>

            <Field label="Название">
              <input
                className={inputCls}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Новинки весны"
              />
            </Field>

            <Field label="Ссылка (link_url)">
              <input
                className={inputCls}
                value={form.link_url}
                onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                placeholder="/catalog или /product/123"
              />
            </Field>

            <Field label="Текст кнопки">
              <input
                className={inputCls}
                value={form.link_label}
                onChange={(e) => setForm((f) => ({ ...f, link_label: e.target.value }))}
                placeholder="Смотреть →"
              />
            </Field>

            <Field label="Порядок">
              <input
                type="number"
                className={inputCls}
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
              />
            </Field>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="accent-gray-900"
              />
              <span className="text-sm text-gray-700">Активна</span>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded hover:border-gray-900 text-gray-600 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="px-5 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-60"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
