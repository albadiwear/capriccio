import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Image as ImageIcon, Video } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  button_text: '',
  button_url: '',
  image_url: '',
  video_url: '',
  type: 'image',
  position: 1,
  is_active: true,
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative my-4 w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">{children}</div>
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

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroBanner, setHeroBanner] = useState(null)
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroFile, setHeroFile] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('banners')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })
    setBanners(data || [])
    setLoading(false)
  }

  async function loadHeroBanner() {
    const { data } = await supabase
      .from('banners')
      .select('id, image_url, title')
      .eq('title', 'Hero главной страницы')
      .limit(1)
      .maybeSingle()

    setHeroBanner(data || null)
  }

  useEffect(() => {
    load()
    loadHeroBanner()
  }, [])

  function handleHeroSelect(event) {
    const file = event.target.files?.[0] || null
    setHeroFile(file)
  }

  async function handleHeroUpload() {
    if (!heroFile) return

    setHeroUploading(true)
    try {
      const fileExt = heroFile.name.split('.').pop()
      const filePath = `hero-main.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, heroFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      const payload = {
        title: 'Hero главной страницы',
        image_url: publicUrl,
        is_active: true,
        type: 'image',
        position: 0,
      }

      if (heroBanner?.id) {
        const { error } = await supabase.from('banners').update(payload).eq('id', heroBanner.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('banners').insert(payload)
        if (error) throw error
      }

      setHeroFile(null)
      loadHeroBanner()
      load()
    } catch (e) {
      console.error('AdminBannersPage.handleHeroUpload error:', e)
    } finally {
      setHeroUploading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSelectedImageFile(null)
    setModalOpen(true)
  }

  function openEdit(banner) {
    setEditing(banner.id)
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      button_text: banner.button_text || '',
      button_url: banner.button_url || '',
      image_url: banner.image_url || '',
      video_url: banner.video_url || '',
      type: banner.type || 'image',
      position: banner.position ?? 1,
      is_active: banner.is_active ?? true,
    })
    setSelectedImageFile(null)
    setModalOpen(true)
  }

  function handleImageSelect(event) {
    const file = event.target.files?.[0] || null
    setSelectedImageFile(file)
  }

  async function handleSave() {
    if (!form.title.trim()) {
      alert('Заполните заголовок баннера')
      return
    }

    if (form.type === 'image' && !form.image_url.trim() && !selectedImageFile) {
      alert('Выберите изображение баннера')
      return
    }

    if (form.type === 'video' && !form.video_url.trim()) {
      alert('Укажите URL видео')
      return
    }

    setSaving(true)

    try {
      let imageUrl = form.image_url || null

      if (selectedImageFile) {
        setUploadingImage(true)
        const fileExt = selectedImageFile.name.split('.').pop()
        const filePath = `banners/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, selectedImageFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        imageUrl = urlData.publicUrl
      }

      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        button_text: form.button_text,
        button_url: form.button_url,
        image_url: imageUrl,
        video_url: form.video_url || null,
        type: form.type,
        position: Number(form.position) || 1,
        is_active: form.is_active,
      }

      if (editing) {
        const { error } = await supabase.from('banners').update(payload).eq('id', editing)
        if (error) throw error
      } else {
        const { error } = await supabase.from('banners').insert(payload)
        if (error) throw error
      }

      setModalOpen(false)
      setSelectedImageFile(null)
      load()
    } catch (e) {
      console.error('AdminBannersPage.handleSave error:', e)
    } finally {
      setUploadingImage(false)
      setSaving(false)
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Удалить баннер "${title}"?`)) return
    await supabase.from('banners').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Баннеры</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded bg-gray-900 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          Добавить баннер
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Главный баннер (Hero)</h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr] lg:items-start">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            {heroFile ? (
              <img
                src={URL.createObjectURL(heroFile)}
                alt="Hero preview"
                className="h-44 w-full object-cover"
              />
            ) : heroBanner?.image_url ? (
              <img
                src={heroBanner.image_url}
                alt="Hero banner"
                className="h-44 w-full object-cover"
              />
            ) : (
              <div className="flex h-44 items-center justify-center text-sm text-gray-400">
                Нет изображения
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center justify-center rounded bg-gray-900 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-700">
                Загрузить новое фото
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeroSelect}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={handleHeroUpload}
                disabled={!heroFile || heroUploading}
                className="inline-flex items-center justify-center rounded border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:border-gray-900 disabled:opacity-60"
              >
                {heroUploading ? 'Загрузка...' : 'Сохранить'}
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500 whitespace-pre-line">
              Рекомендуемый размер: 1920×1080px
              {'\n'}
              Форматы: JPG, PNG, WebP
              {'\n'}
              После загрузки фото обновится на сайте автоматически
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : banners.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <ImageIcon className="mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm">Баннеры пока не добавлены</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="px-4 py-3 text-left font-medium">Превью</th>
                <th className="px-4 py-3 text-left font-medium">Заголовок</th>
                <th className="px-4 py-3 text-left font-medium">Подзаголовок</th>
                <th className="px-4 py-3 text-center font-medium">Позиция</th>
                <th className="px-4 py-3 text-center font-medium">Статус</th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex h-12 w-16 items-center justify-center overflow-hidden rounded bg-gray-100">
                      {banner.type === 'video' ? (
                        banner.video_url ? (
                          <video
                            src={banner.video_url}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <Video className="h-5 w-5 text-gray-300" />
                        )
                      ) : banner.image_url ? (
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-gray-300" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="line-clamp-1 font-medium text-gray-900">{banner.title}</p>
                    <p className="mt-1 text-xs uppercase text-gray-400">{banner.type}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <p className="line-clamp-2">{banner.subtitle || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-700">
                    {banner.position ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        banner.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {banner.is_active ? 'Активен' : 'Скрыт'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(banner)}
                        className="p-1.5 text-gray-400 transition-colors hover:text-gray-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id, banner.title)}
                        className="p-1.5 text-gray-400 transition-colors hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
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
        <Modal title={editing ? 'Редактировать баннер' : 'Новый баннер'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Заголовок">
                  <input
                    className={inputCls}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Подзаголовок">
                  <input
                    className={inputCls}
                    value={form.subtitle}
                    onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  />
                </Field>
              </div>

              <Field label="Текст кнопки">
                <input
                  className={inputCls}
                  value={form.button_text}
                  onChange={(e) => setForm((f) => ({ ...f, button_text: e.target.value }))}
                />
              </Field>

              <Field label="Ссылка кнопки">
                <input
                  className={inputCls}
                  value={form.button_url}
                  onChange={(e) => setForm((f) => ({ ...f, button_url: e.target.value }))}
                  placeholder="/catalog"
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Изображение баннера">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded bg-gray-900 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-700">
                        Выбрать фото
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                      <span className="text-sm text-gray-500">
                        {selectedImageFile ? selectedImageFile.name : form.image_url ? 'Текущее изображение' : 'Файл не выбран'}
                      </span>
                    </div>

                    {(selectedImageFile || form.image_url) && (
                      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        <img
                          src={selectedImageFile ? URL.createObjectURL(selectedImageFile) : form.image_url}
                          alt="Превью баннера"
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    )}

                    {uploadingImage && (
                      <p className="text-sm text-gray-500">Загрузка изображения...</p>
                    )}
                  </div>
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="URL видео">
                  <input
                    className={inputCls}
                    value={form.video_url}
                    onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <p className="mb-2 text-xs font-medium text-gray-500">Тип баннера</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      checked={form.type === 'image'}
                      onChange={() => setForm((f) => ({ ...f, type: 'image' }))}
                      className="accent-gray-900"
                    />
                    Изображение
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      checked={form.type === 'video'}
                      onChange={() => setForm((f) => ({ ...f, type: 'video' }))}
                      className="accent-gray-900"
                    />
                    Видео
                  </label>
                </div>
              </div>

              <Field label="Позиция">
                <input
                  type="number"
                  className={inputCls}
                  value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                />
              </Field>

              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    className="accent-gray-900"
                  />
                  Активен
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:border-gray-900"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploadingImage}
                className="rounded bg-gray-900 px-5 py-2 text-sm text-white transition-colors hover:bg-gray-700 disabled:opacity-60"
              >
                {saving || uploadingImage ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
