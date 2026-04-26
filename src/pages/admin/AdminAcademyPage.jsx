import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const STATUS_BADGE = {
  pending: <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">Ожидает</span>,
  active: <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Активен</span>,
  cancelled: <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Отклонён</span>,
}

const TYPE_LABEL = { video: '🎥 Видео', article: '📖 Статья', guide: '📄 Гайд', telegram: '✈️ Telegram', link: '🔗 Ссылка' }
const TARIFF_LABEL = { start: 'Старт (все)', basic: 'Базовый и выше', premium: 'Только Премиум' }

const EMPTY_CONTENT = {
  title: '',
  description: '',
  type: 'video',
  content_url: '',
  tariff_level: 'basic',
  sort_order: 0,
  is_published: true,
  topic: '',
  thumbnail_url: '',
  duration_minutes: 0,
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AdminAcademyPage() {
  const [tab, setTab] = useState('pending')

  // Orders state
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  // Content state
  const [contentList, setContentList] = useState([])
  const [contentLoading, setContentLoading] = useState(false)
  const [newContent, setNewContent] = useState(EMPTY_CONTENT)
  const [addLoading, setAddLoading] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)

  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (tab === 'pending' || tab === 'active') {
      loadOrders()
    } else if (tab === 'content') {
      setContentLoading(true)
      loadContent()
    }
  }, [tab])

  // --- Orders ---

  const loadOrders = async () => {
    setOrdersLoading(true)
    setError('')
    try {
      const { data, error: loadError } = await supabase
        .from('academy_orders')
        .select('*')
        .eq('status', tab)
        .order('created_at', { ascending: false })
      if (loadError) throw loadError
      setOrders(data || [])
    } catch (e) {
      console.error('AdminAcademyPage.loadOrders error:', e)
      setError('Не удалось загрузить заявки')
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleActivate = async (orderId, userEmail) => {
    setError('')
    setStatusMessage('')
    try {
      const { error: updateError } = await supabase
        .from('academy_orders')
        .update({ status: 'active', activated_at: new Date().toISOString() })
        .eq('id', orderId)
      if (updateError) throw updateError
      setStatusMessage(`Доступ активирован для ${userEmail}`)
      loadOrders()
    } catch (e) {
      console.error('AdminAcademyPage.handleActivate error:', e)
      setError('Не удалось активировать доступ')
    }
  }

  const handleCancel = async (orderId) => {
    setError('')
    try {
      const { error: updateError } = await supabase
        .from('academy_orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
      if (updateError) throw updateError
      loadOrders()
    } catch (e) {
      console.error('AdminAcademyPage.handleCancel error:', e)
      setError('Не удалось отклонить заявку')
    }
  }

  const handleRevoke = async (orderId) => {
    setError('')
    try {
      const { error: updateError } = await supabase
        .from('academy_orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
      if (updateError) throw updateError
      loadOrders()
    } catch (e) {
      console.error('AdminAcademyPage.handleRevoke error:', e)
      setError('Не удалось отозвать доступ')
    }
  }

  // --- Content ---

  const loadContent = async () => {
    setContentLoading(true)
    setError('')
    try {
      const { data, error: loadError } = await supabase
        .from('academy_content')
        .select('*')
        .order('sort_order')
      if (loadError) throw loadError
      setContentList(data || [])
      if (!data || data.length === 0) setError('Материалы не найдены в базе данных')
    } catch (e) {
      console.error('AdminAcademyPage.loadContent error:', e)
      setError('Не удалось загрузить материалы')
      setContentList([])
    } finally {
      setContentLoading(false)
    }
  }

  const handleAddContent = async () => {
    if (!newContent.title || !newContent.content_url) return
    setAddLoading(true)
    setError('')
    try {
      const { error: insertError } = await supabase.from('academy_content').insert(newContent)
      if (insertError) throw insertError
      setNewContent(EMPTY_CONTENT)
      loadContent()
    } catch (e) {
      console.error('AdminAcademyPage.handleAddContent error:', e)
      setError('Не удалось добавить материал')
    } finally {
      setAddLoading(false)
    }
  }

  const handleTogglePublish = async (id, current) => {
    setError('')
    try {
      const { error: updateError } = await supabase
        .from('academy_content')
        .update({ is_published: !current })
        .eq('id', id)
      if (updateError) throw updateError
      loadContent()
    } catch (e) {
      console.error('AdminAcademyPage.handleTogglePublish error:', e)
      setError('Не удалось изменить публикацию')
    }
  }

  const handleDeleteContent = async (id) => {
    if (!confirm('Удалить материал?')) return
    setError('')
    try {
      const { error: deleteError } = await supabase.from('academy_content').delete().eq('id', id)
      if (deleteError) throw deleteError
      loadContent()
    } catch (e) {
      console.error('AdminAcademyPage.handleDeleteContent error:', e)
      setError('Не удалось удалить материал')
    }
  }

  const setField = (key, value) => setNewContent((prev) => ({ ...prev, [key]: value }))

  async function handleThumbUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingThumb(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `academy/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: true })
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(path)
        setField('thumbnail_url', publicUrl)
      }
    } finally {
      setUploadingThumb(false)
    }
  }

  // --- Render ---

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Академия</h1>
        <p className="mt-1 text-sm text-gray-500">Заявки, участники и материалы</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {statusMessage && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {statusMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {[
          { key: 'pending', label: 'Заявки' },
          { key: 'active', label: 'Участники' },
          { key: 'content', label: 'Материалы' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Orders / Members table */}
      {(tab === 'pending' || tab === 'active') && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {ordersLoading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">Загрузка...</div>
          ) : orders.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              {tab === 'pending' ? 'Новых заявок нет' : 'Активных участников нет'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Телефон</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тариф</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена</th>
                    {tab === 'active' && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Активирован</th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.user_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.user_email || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{order.user_phone || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.tariff_name || order.tariff}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {order.tariff_price > 0 ? `${Number(order.tariff_price).toLocaleString('ru-RU')} ₸` : 'Бесплатно'}
                      </td>
                      {tab === 'active' && (
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(order.activated_at)}</td>
                      )}
                      <td className="px-4 py-3">{STATUS_BADGE[order.status] || order.status}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {tab === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleActivate(order.id, order.user_email)}
                              className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
                            >
                              Активировать
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancel(order.id)}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 transition-colors"
                            >
                              Отклонить
                            </button>
                          </div>
                        )}
                        {tab === 'active' && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(order.id)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Отозвать доступ
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Content tab */}
      {tab === 'content' && (
	          <div>
	            {/* Add form */}
	            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Добавить материал</h3>
              <span className="text-xs text-gray-400">Загружено: {contentList.length} материалов</span>
            </div>

	            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
	              <div>
	                <label className="text-sm text-gray-500 mb-1 block">Название</label>
	                <input
	                  value={newContent.title}
	                  onChange={(e) => setField('title', e.target.value)}
	                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
	                  placeholder="Капсульный гардероб за 7 дней"
	                />
	              </div>
	              <div>
	                <label className="text-sm text-gray-500 mb-1 block">Тип</label>
	                <select
	                  value={newContent.type}
	                  onChange={(e) =>
	                    setNewContent((prev) => ({
	                      ...prev,
	                      type: e.target.value,
	                      content_url: '',
	                      thumbnail_url: '',
	                      duration_minutes: 0,
	                    }))
	                  }
	                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
	                >
	                  <option value="video">🎥 Видео</option>
	                  <option value="article">📖 Статья</option>
	                  <option value="guide">📄 Гайд</option>
	                  <option value="telegram">✈️ Telegram</option>
	                  <option value="link">🔗 Ссылка</option>
	                </select>
	              </div>
	            </div>

            <div className="mb-4">
              <label className="text-sm text-gray-500 mb-1 block">Описание</label>
              <textarea
                value={newContent.description}
                onChange={(e) => setField('description', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
                rows={2}
                placeholder="Краткое описание материала"
              />
            </div>

	            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
	              <div>
	                <label className="text-sm text-gray-500 mb-1 block">
	                  {newContent.type === 'video'
	                    ? 'Ссылка на YouTube / Vimeo'
	                    : newContent.type === 'article'
	                      ? 'Ссылка на статью'
	                      : newContent.type === 'guide'
	                        ? 'Ссылка на PDF файл'
	                        : 'Ссылка (URL)'}
	                </label>
	                <input
	                  value={newContent.content_url}
	                  onChange={(e) => setField('content_url', e.target.value)}
	                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
	                  placeholder="https://..."
	                />
	              </div>
	              <div>
	                <label className="text-sm text-gray-500 mb-1 block">Доступен для тарифа</label>
	                <select
	                  value={newContent.tariff_level}
	                  onChange={(e) => setField('tariff_level', e.target.value)}
	                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
	                >
	                  <option value="start">Старт (все)</option>
	                  <option value="basic">Базовый и выше</option>
	                  <option value="premium">Только Премиум</option>
	                </select>
	              </div>
	            </div>

	            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
	              <div>
	                <label className="text-sm text-gray-500 mb-1 block">Тема</label>
	                <input
	                  value={newContent.topic}
	                  onChange={(e) => setField('topic', e.target.value)}
	                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
	                  placeholder="Капсула / Цвет / Фигура / Шопинг"
	                />
	              </div>
	              <div>
	                <label className="text-sm text-gray-500 mb-1 block">Превью (обложка)</label>

	                {uploadingThumb ? (
	                  <div className="border border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 w-full text-center">
	                    Загружаем...
	                  </div>
	                ) : newContent.thumbnail_url ? (
	                  <div className="space-y-2">
	                    <img
	                      src={newContent.thumbnail_url}
	                      className="h-20 rounded-lg object-cover"
	                    />
	                    <label className="border border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 w-full text-center cursor-pointer hover:border-gray-400">
	                      Изменить
	                      <input type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} />
	                    </label>
	                  </div>
	                ) : (
	                  <label className="border border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 w-full text-center cursor-pointer hover:border-gray-400">
	                    Загрузить
	                    <input type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} />
	                  </label>
	                )}
	              </div>
	              {(newContent.type === 'video' || newContent.type === 'article') && (
	                <div>
	                  <label className="text-sm text-gray-500 mb-1 block">
	                    {newContent.type === 'article' ? 'Время чтения (мин)' : 'Длительность (мин)'}
	                  </label>
	                  <input
	                    type="number"
	                    value={newContent.duration_minutes}
	                    onChange={(e) => setField('duration_minutes', Number(e.target.value))}
	                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
	                    placeholder="15"
	                    min="0"
	                  />
	                </div>
	              )}
	            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-700">
                <input
                  type="checkbox"
                  checked={newContent.is_published}
                  onChange={(e) => setField('is_published', e.target.checked)}
                  className="rounded"
                />
                Опубликовать сразу
              </label>
              <button
                type="button"
                onClick={handleAddContent}
                disabled={!newContent.title || !newContent.content_url || addLoading}
                className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors"
              >
                {addLoading ? 'Добавляем...' : 'Добавить материал'}
              </button>
            </div>
          </div>

          {/* Content list */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {contentLoading ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">Загрузка...</div>
            ) : contentList.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">Материалов пока нет</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тема</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тариф</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {contentList.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {TYPE_LABEL[item.type] || item.type}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {item.topic || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {TARIFF_LABEL[item.tariff_level] || item.tariff_level}
                        </td>
                        <td className="px-4 py-3">
                          {item.is_published ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Опубликован</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Скрыт</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(item.id, item.is_published)}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 transition-colors"
                            >
                              {item.is_published ? 'Скрыть' : 'Показать'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteContent(item.id)}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
