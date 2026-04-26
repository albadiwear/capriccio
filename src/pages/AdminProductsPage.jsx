import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, X, Package } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
  { value: 'Пуховики', label: 'Пуховики' },
  { value: 'Костюмы', label: 'Костюмы' },
  { value: 'Трикотаж', label: 'Трикотаж' },
  { value: 'Обувь', label: 'Обувь' },
  { value: 'Повседневное', label: 'Повседневное' },
]

const BADGE_OPTIONS = ['hit', 'new', 'sale']

const EMPTY_FORM = {
  name: '',
  billz_id: '',
  description: '',
  category: 'Пуховики',
  brand: '',
  price: '',
  sale_price: '',
  youtube_url: '',
  composition: '',
  care: '',
  badges: [],
  is_active: true,
}

const EMPTY_VARIANT = { size: '', color: '', color_hex: '#000000', stock: 0 }

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-2xl my-4 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
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

export default function AdminProductsPage() {
  const fileInputRef = useRef(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [importingExcel, setImportingExcel] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [deletingBulk, setDeletingBulk] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [variants, setVariants] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState([])
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [sortField, setSortField] = useState('created_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const PAGE_SIZE = 50

  async function load(currentPage = 0) {
    setLoading(true)
    const from = currentPage * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from('products')
      .select('id, name, brand, billz_id, category, price, sale_price, is_active, images, product_variants(stock)', { count: 'exact' })
      .order(sortField, { ascending: sortAsc })
      .range(from, to)

    if (search) query = query.ilike('name', `%${search}%`)
    if (filterCat) query = query.ilike('category', filterCat)
    if (statusFilter === 'active') query = query.eq('is_active', true)
    if (statusFilter === 'hidden') query = query.eq('is_active', false)

    const { data, count } = await query
    setProducts(data || [])
    setTotalCount(count || 0)
    setLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => load(page), 300)
    return () => window.clearTimeout(timer)
  }, [page, search, filterCat, sortField, sortAsc, statusFilter])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setVariants([])
    setUploadedImages([])
    setModalOpen(true)
  }

  async function openEdit(id) {
    const { data } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('id', id)
      .single()
    if (!data) return
    const { product_variants, ...rest } = data
    setForm({
      name: rest.name || '',
      billz_id: rest.billz_id || '',
      description: rest.description || '',
      category: rest.category || 'Пуховики',
      brand: rest.brand || '',
      price: rest.price || '',
      sale_price: rest.sale_price || '',
      youtube_url: rest.youtube_url || '',
      composition: rest.composition || '',
      care: rest.care || '',
      badges: rest.badges || [],
      is_active: rest.is_active ?? true,
    })
    setVariants(product_variants || [])
    setUploadedImages(rest.images || [])
    setEditing(id)
    setModalOpen(true)
  }

  async function handleUploadImages(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    const urls = []
    for (const file of files) {
      const path = `${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('product-images').upload(path, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
        urls.push(publicUrl)
      }
    }
    setUploadedImages((prev) => [...prev, ...urls])
    setUploading(false)
  }

  async function handleSave() {
    if (!form.name || !form.billz_id || !form.price) return alert('Заполните название, артикул и цену')
    setSaving(true)

    const payload = {
      name: form.name,
      billz_id: form.billz_id,
      description: form.description,
      category: form.category,
      brand: form.brand,
      price: Number(form.price),
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      youtube_url: form.youtube_url || null,
      composition: form.composition,
      care: form.care,
      badges: form.badges,
      is_active: form.is_active,
      images: uploadedImages,
    }

    let productId = editing
    if (editing) {
      const { error: updateError } = await supabase.from('products').update(payload).eq('id', editing)
      if (updateError) {
        setSaving(false)
        alert('Ошибка обновления товара: ' + updateError.message)
        return
      }
    } else {
      const { data, error: insertError } = await supabase.from('products').insert(payload).select().single()
      if (insertError) {
        setSaving(false)
        alert('Ошибка добавления товара: ' + insertError.message)
        return
      }
      productId = data?.id
    }

    if (productId) {
      const variantsToSave = variants.filter((v) => v.size)
      for (const v of variantsToSave) {
        if (v.id) {
          await supabase.from('product_variants').update({
            size: v.size,
            color: v.color,
            color_hex: v.color_hex || '#000000',
            stock: Number(v.stock) || 0,
          }).eq('id', v.id)
        }
      }

      const newVariants = variantsToSave.filter((v) => !v.id)
      if (newVariants.length > 0) {
        const variantsToInsert = newVariants.map((v) => ({
          product_id: productId,
          size: v.size || '',
          color: v.color || '',
          color_hex: v.color_hex || '#000000',
          stock: parseInt(v.stock, 10) || 0,
        }))

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert)

        if (variantsError) console.error('Ошибка:', JSON.stringify(variantsError, null, 2))
      }
    }

    setSaving(false)
    setModalOpen(false)
    alert(editing ? '✅ Товар обновлён' : '✅ Товар добавлен')
    load()
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Удалить товар "${name}"?`)) return
    await supabase.from('product_variants').delete().eq('product_id', id)
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  async function deleteVariant(v) {
    if (v.id) await supabase.from('product_variants').delete().eq('id', v.id)
    setVariants((prev) => prev.filter((x) => x !== v))
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(p => p.id)))
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return
    if (!window.confirm(`Удалить ${selected.size} товаров? Это действие нельзя отменить.`)) return
    
    setDeletingBulk(true)
    const ids = Array.from(selected)
    
    await supabase.from('product_variants').delete().in('product_id', ids)
    await supabase.from('products').delete().in('id', ids)
    
    setSelected(new Set())
    setDeletingBulk(false)
    load()
  }

  function handleDownloadTemplate() {
    const templateRows = [
      {
        'Название': 'Пуховик Milano',
        'Артикул': 'CAP-1001',
        'Категория': 'Пуховики',
        'Бренд': 'Capriccio',
        'Цена': 89900,
        'Цена со скидкой': 79900,
        'Описание': 'Тёплый пуховик на каждый день',
        'Состав': 'Полиэстер',
        'Уход': 'Химчистка',
        'Размер': 'M',
        'Цвет': 'Чёрный',
        'Количество': 5,
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Товары')
    XLSX.writeFile(workbook, 'capriccio_template.xlsx')
  }

  async function handleImportExcel(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setImportingExcel(true)

    try {
      const REQUIRED_COLUMNS = [
        'Название',
        'Артикул',
        'Категория',
        'Бренд',
        'Цена',
        'Цена со скидкой',
        'Описание',
        'Состав',
        'Уход',
        'Размер',
        'Цвет',
        'Количество',
      ]

      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const headerRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })
      const header = Array.isArray(headerRows?.[0]) ? headerRows[0] : []
      const headerNames = header.map((h) => String(h || '').trim()).filter(Boolean)
      const missing = REQUIRED_COLUMNS.filter((col) => !headerNames.includes(col))
      if (missing.length > 0) {
        throw new Error(`В Excel не хватает колонок: ${missing.join(', ')}`)
      }

      const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })

      const normalizeHeader = (key) =>
        String(key || '')
          .trim()
          .replace(/\s+/g, ' ')

      const getCell = (row, label) => {
        const normalizedLabel = normalizeHeader(label)
        for (const key of Object.keys(row || {})) {
          if (normalizeHeader(key) === normalizedLabel) return row[key]
        }
        return ''
      }

      const parseNumber = (value) => {
        if (value === null || value === undefined) return null
        if (typeof value === 'number') return Number.isFinite(value) ? value : null
        const cleaned = String(value)
          .replace(/\s+/g, '')
          .replace(/[₸]/g, '')
          .replace(',', '.')
          .replace(/[^\d.-]/g, '')
        if (!cleaned) return null
        const n = Number(cleaned)
        return Number.isFinite(n) ? n : null
      }

      const groupedProducts = rows.reduce((acc, row) => {
        const billzId = String(getCell(row, 'Артикул') || '').trim()
        if (!billzId) return acc

        if (!acc[billzId]) {
          const rawCategory = String(getCell(row, 'Категория') || '').trim()
          acc[billzId] = {
            product: {
              name: String(getCell(row, 'Название') || '').trim(),
              billz_id: billzId,
              category: (() => {
                if (!rawCategory) return 'Пуховики'
                return rawCategory
              })(),
              brand: String(getCell(row, 'Бренд') || '').trim(),
              price: parseNumber(getCell(row, 'Цена')) || 0,
              sale_price: parseNumber(getCell(row, 'Цена со скидкой')),
              description: String(getCell(row, 'Описание') || '').trim(),
              composition: String(getCell(row, 'Состав') || '').trim(),
              care: String(getCell(row, 'Уход') || '').trim(),
              is_active: true,
            },
            variants: new Map(),
          }
        }

        const size = String(getCell(row, 'Размер') || '').trim()
        const color = String(getCell(row, 'Цвет') || '').trim()
        const stock = parseNumber(getCell(row, 'Количество')) || 0
        const variantKey = `${size}||${color}`
        const prev = acc[billzId].variants.get(variantKey)
        acc[billzId].variants.set(variantKey, {
          size,
          color,
          color_hex: '#000000',
          stock: Number(prev?.stock || 0) + Number(stock || 0),
        })

        return acc
      }, {})

      let importedCount = 0

      for (const item of Object.values(groupedProducts)) {
        if (!item.product?.billz_id || !item.product?.name) continue

        let productId = null

        const { data: existingProduct, error: existingError } = await supabase
          .from('products')
          .select('id')
          .eq('billz_id', item.product.billz_id)
          .maybeSingle()

        if (existingError) {
          console.error('Excel import existing product lookup error:', existingError)
          continue
        }

        if (existingProduct?.id) {
          const { error: updateError } = await supabase
            .from('products')
            .update(item.product)
            .eq('id', existingProduct.id)

          if (updateError) {
            console.error('Excel import product update error:', updateError)
            continue
          }

          productId = existingProduct.id
        } else {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .insert(item.product)
            .select('id')
            .maybeSingle()

          if (productError || !productData?.id) {
            console.error('Excel import product insert error:', productError)
            continue
          }

          productId = productData.id
        }

        const variantsToInsert = Array.from(item.variants.values())
          .filter((variant) => variant.size || variant.color)
          .map((variant) => ({
            product_id: productId,
            size: variant.size || '',
            color: variant.color || '',
            color_hex: variant.color_hex || '#000000',
            stock: parseInt(variant.stock, 10) || 0,
          }))

        if (variantsToInsert.length > 0) {
          const { error: variantsError } = await supabase
            .from('product_variants')
            .insert(variantsToInsert)

          if (variantsError) {
            console.error('Excel import variants insert error:', variantsError)
          }
        }

        importedCount += 1
      }

      await load()
      alert(`Импортировано ${importedCount} товаров`)
    } catch (error) {
      console.error('Ошибка импорта Excel:', error)
      alert('Не удалось импортировать Excel файл')
    } finally {
      event.target.value = ''
      setImportingExcel(false)
    }
  }

  const filtered = products

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Товары</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            className="hidden"
            disabled={importingExcel}
          />
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deletingBulk}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
              {deletingBulk ? 'Удаление...' : `Удалить (${selected.size})`}
            </button>
          )}
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded hover:border-gray-900 hover:text-gray-900 transition-colors"
          >
            Скачать шаблон
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importingExcel}
            className="px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded hover:border-gray-900 hover:text-gray-900 transition-colors disabled:opacity-60"
          >
            Импорт из Excel
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить товар
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelected(new Set()); setPage(0) }}
          className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
        />
        <select
          value={filterCat}
          onChange={(e) => { setFilterCat(e.target.value); setSelected(new Set()); setPage(0) }}
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
        >
          <option value="">Все категории</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
        >
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="hidden">Скрытые</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <Package className="w-10 h-10 mb-3 text-gray-200" />
            <p className="text-sm">Товары не найдены</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="accent-gray-900 w-4 h-4"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium">Фото</th>
                <th
                  className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => { setSortField('name'); setSortAsc(sortField === 'name' ? !sortAsc : true); setPage(0) }}
                >
                  Название {sortField === 'name' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th className="text-left px-4 py-3 font-medium">Категория</th>
                <th
                  className="text-right px-4 py-3 font-medium cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => { setSortField('price'); setSortAsc(sortField === 'price' ? !sortAsc : false); setPage(0) }}
                >
                  Цена {sortField === 'price' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th className="text-center px-4 py-3 font-medium">Остаток</th>
                <th className="text-center px-4 py-3 font-medium">Статус</th>
                <th className="text-right px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const totalStock = (p.product_variants || []).reduce((sum, v) => sum + (v.stock || 0), 0)

                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="accent-gray-900 w-4 h-4"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        : <Package className="w-full h-full p-2 text-gray-300" />
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                    {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {CATEGORIES.find(c => c.value === p.category)?.label || p.category}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.sale_price
                      ? (
                        <>
                          <span className="font-medium text-red-600">{p.sale_price.toLocaleString('ru-RU')} ₸</span>
                          <br />
                          <span className="text-xs text-gray-400 line-through">{p.price?.toLocaleString('ru-RU')} ₸</span>
                        </>
                      )
                      : <span className="font-medium">{p.price?.toLocaleString('ru-RU')} ₸</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-center">
                    {totalStock === 0 ? (
                      <span className="text-xs font-medium text-red-600">Нет в наличии</span>
                    ) : totalStock < 3 ? (
                      <span className="text-xs font-medium text-yellow-600">Мало ({totalStock})</span>
                    ) : (
                      <span className="text-xs font-medium text-green-600">{totalStock}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={async () => {
                        await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id)
                        load(page)
                      }}
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${p.is_active ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'}`}
                    >
                      {p.is_active ? 'Активен' : 'Скрыт'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p.id)} className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Всего: <span className="font-medium text-gray-900">{totalCount}</span> товаров
              {' · '}Страница <span className="font-medium text-gray-900">{page + 1}</span> из{' '}
              <span className="font-medium text-gray-900">{Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded hover:border-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Назад
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page + 1 >= Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded hover:border-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Вперёд →
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Редактировать товар' : 'Новый товар'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Название *">
                  <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </Field>
              </div>
              <Field label="Категория">
                <select className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Бренд">
                <input className={inputCls} value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
              </Field>
              <Field label="Артикул *">
                <input className={inputCls} value={form.billz_id} onChange={e => setForm(f => ({ ...f, billz_id: e.target.value }))} />
              </Field>
              <Field label="Цена *">
                <input type="number" className={inputCls} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </Field>
              <Field label="Цена со скидкой">
                <input type="number" className={inputCls} value={form.sale_price} onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Описание">
                  <textarea rows={3} className={`${inputCls} resize-none`} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </Field>
              </div>
              <Field label="Состав ткани">
                <input className={inputCls} value={form.composition} onChange={e => setForm(f => ({ ...f, composition: e.target.value }))} />
              </Field>
              <Field label="Уход за тканью">
                <input className={inputCls} value={form.care} onChange={e => setForm(f => ({ ...f, care: e.target.value }))} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="YouTube ссылка">
                  <input className={inputCls} value={form.youtube_url} onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))} placeholder="https://youtu.be/..." />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Фотографии">
                  <input type="file" multiple accept="image/*" onChange={handleUploadImages} className="text-sm text-gray-600" />
                  {uploading && <p className="text-xs text-gray-400 mt-1">Загрузка...</p>}
                  {uploadedImages.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {uploadedImages.map((url, i) => (
                        <div key={i} className="relative">
                          <img src={url} alt="" className="w-16 h-20 object-cover rounded" />
                          <button
                            onClick={() => setUploadedImages(p => p.filter((_, j) => j !== i))}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Field>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Бейджи</p>
              <div className="flex gap-3">
                {BADGE_OPTIONS.map(b => (
                  <label key={b} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.badges.includes(b)}
                      onChange={() => setForm(f => ({ ...f, badges: f.badges.includes(b) ? f.badges.filter(x => x !== b) : [...f.badges, b] }))}
                      className="accent-gray-900"
                    />
                    {b.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-gray-900" />
              <span className="text-sm text-gray-700">Товар активен</span>
            </label>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-900">Варианты товара</p>
                <button
                  onClick={() => setVariants(v => [...v, { ...EMPTY_VARIANT }])}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded px-2 py-1"
                >
                  <Plus className="w-3 h-3" /> Добавить
                </button>
              </div>
              {variants.length === 0
                ? <p className="text-xs text-gray-400">Нет вариантов</p>
                : (
                  <div className="space-y-2">
                    {variants.map((v, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          placeholder="Размер"
                          className={`${inputCls} w-20`}
                          value={v.size}
                          onChange={e => setVariants(prev => prev.map((x, j) => j === i ? { ...x, size: e.target.value } : x))}
                        />
                        <input
                          placeholder="Цвет"
                          className={`${inputCls} flex-1`}
                          value={v.color}
                          onChange={e => setVariants(prev => prev.map((x, j) => j === i ? { ...x, color: e.target.value } : x))}
                        />
                        <input
                          type="color"
                          className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                          value={v.color_hex || '#000000'}
                          onChange={e => setVariants(prev => prev.map((x, j) => j === i ? { ...x, color_hex: e.target.value } : x))}
                        />
                        <input
                          type="number"
                          placeholder="Остаток"
                          className={`${inputCls} w-20`}
                          value={v.stock}
                          onChange={e => setVariants(prev => prev.map((x, j) => j === i ? { ...x, stock: e.target.value } : x))}
                        />
                        <button onClick={() => deleteVariant(v)} className="text-gray-300 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded hover:border-gray-900 text-gray-600 transition-colors">
                Отмена
              </button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-60">
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
