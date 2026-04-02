import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'

const BLOG_CATEGORIES = ['Мода', 'Стиль', 'Тренды', 'Уход за одеждой', 'Lookbook']

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[а-яё]/g, c => 'abcdefghijklmnopqrstuvwxyz'['абвгдеёжзийклмнопрстуфхцчшщъыьэюя'.indexOf(c)] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const EMPTY_FORM = { title: '', slug: '', category: 'Мода', content: '', is_published: false }

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)
  const [coverUrl, setCoverUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setCoverUrl('')
    setModalOpen(true)
  }

  function openEdit(post) {
    setEditing(post.id)
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      category: post.category || 'Мода',
      content: post.content || '',
      is_published: post.is_published || false,
    })
    setCoverUrl(post.cover_image || '')
    setModalOpen(true)
  }

  async function handleUploadCover(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `blog/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('product-images').upload(path, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
      setCoverUrl(publicUrl)
    }
    setUploading(false)
  }

  async function handleSave() {
    if (!form.title) return alert('Введите заголовок')
    setSaving(true)
    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      category: form.category,
      content: form.content,
      is_published: form.is_published,
      cover_image: coverUrl || null,
    }
    if (editing) {
      await supabase.from('blog_posts').update(payload).eq('id', editing)
    } else {
      await supabase.from('blog_posts').insert(payload)
    }
    setSaving(false)
    setModalOpen(false)
    alert(editing ? 'Статья обновлена' : 'Статья создана')
    load()
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Удалить статью "${title}"?`)) return
    await supabase.from('blog_posts').delete().eq('id', id)
    load()
  }

  const inputCls = 'border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-900'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Блог</h1>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors">
          <Plus className="w-4 h-4" /> Новая статья
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <FileText className="w-10 h-10 mb-3 text-gray-200" />
            <p className="text-sm">Статей пока нет</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium">Заголовок</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Категория</th>
                <th className="text-center px-4 py-3 font-medium">Статус</th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Дата</th>
                <th className="text-right px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 line-clamp-1">{post.title}</p>
                    <p className="text-xs text-gray-400">/{post.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{post.category}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${post.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {post.is_published ? 'Опубликована' : 'Черновик'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">
                    {new Date(post.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(post)} className="p-1.5 text-gray-400 hover:text-gray-900">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(post.id, post.title)} className="p-1.5 text-gray-400 hover:text-red-500">
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
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-xl w-full max-w-2xl my-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">{editing ? 'Редактировать статью' : 'Новая статья'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Заголовок *</label>
                <input className={inputCls} value={form.title}
                  onChange={e => {
                    const title = e.target.value
                    setForm(f => ({ ...f, title, slug: editing ? f.slug : slugify(title) }))
                  }} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Slug</label>
                <input className={inputCls} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Категория</label>
                <select className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {BLOG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Превью изображение</label>
                <input type="file" accept="image/*" onChange={handleUploadCover} className="text-sm text-gray-600" />
                {uploading && <p className="text-xs text-gray-400">Загрузка...</p>}
                {coverUrl && <img src={coverUrl} alt="cover" className="w-full max-h-40 object-cover rounded mt-2" />}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Контент</label>
                <textarea rows={10} className={`${inputCls} resize-none`} value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_published}
                  onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                  className="accent-gray-900" />
                <span className="text-sm text-gray-700">Опубликовать</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded hover:border-gray-900 text-gray-600 transition-colors">
                  Отмена
                </button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-60 transition-colors">
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
