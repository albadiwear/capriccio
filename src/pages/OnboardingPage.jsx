import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const STEPS = ['О вас', 'Размеры', 'Стиль']

const LIFESTYLE_OPTIONS = [
  { value: 'active', label: 'Активный — спорт, прогулки, движение' },
  { value: 'office', label: 'Офисный — деловой стиль каждый день' },
  { value: 'homebody', label: 'Домашний — комфорт прежде всего' },
  { value: 'social', label: 'Светский — мероприятия, рестораны, встречи' },
]

const BODY_TYPES = [
  { value: 'hourglass', label: 'Песочные часы' },
  { value: 'pear', label: 'Груша' },
  { value: 'apple', label: 'Яблоко' },
  { value: 'rectangle', label: 'Прямоугольник' },
  { value: 'inverted_triangle', label: 'Перевёрнутый треугольник' },
]

const COLOR_TYPES = [
  { value: 'spring', label: 'Весна — тёплые, светлые тона' },
  { value: 'summer', label: 'Лето — прохладные, мягкие тона' },
  { value: 'autumn', label: 'Осень — тёплые, насыщенные тона' },
  { value: 'winter', label: 'Зима — контрастные, холодные тона' },
]

const STYLE_OPTIONS = [
  { value: 'casual', label: 'Casual' },
  { value: 'classic', label: 'Классика' },
  { value: 'romantic', label: 'Романтика' },
  { value: 'sporty', label: 'Спорт' },
  { value: 'bohemian', label: 'Бохо' },
  { value: 'minimalist', label: 'Минимализм' },
]

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const authLoading = useAuthStore((state) => state.loading)
  const [checking, setChecking] = useState(true)
  const [showIntro, setShowIntro] = useState(true)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    age: '',
    city: '',
    lifestyle: '',
    clothing_size: '',
    shoe_size: '',
    chest: '',
    waist: '',
    hips: '',
    height: '',
    weight: '',
    body_type: '',
    color_type: '',
    budget_min: '',
    budget_max: '',
    style_preferences: [],
  })

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      navigate('/', { replace: true })
      return
    }

    async function checkProfile() {
      const { data, error } = await supabase
        .from('stylist_profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!error && data?.onboarding_completed === true) {
        navigate('/catalog', { replace: true })
        return
      }
      setChecking(false)
    }

    checkProfile()
  }, [user, authLoading, navigate])

  if (checking) return null

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const toggleStyle = (value) => {
    setForm((prev) => {
      const list = prev.style_preferences
      return {
        ...prev,
        style_preferences: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      }
    })
  }

  const handleNext = () => setStep((s) => s + 1)
  const handleBack = () => setStep((s) => s - 1)
  const handleSkip = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else handleFinish()
  }

  const handleFinish = async () => {
    if (!user) return
    setSaving(true)

    const payload = {
      user_id: user.id,
      age: form.age ? parseInt(form.age) : null,
      city: form.city || null,
      lifestyle: form.lifestyle || null,
      clothing_size: form.clothing_size || null,
      shoe_size: form.shoe_size || null,
      chest: form.chest ? parseFloat(form.chest) : null,
      waist: form.waist ? parseFloat(form.waist) : null,
      hips: form.hips ? parseFloat(form.hips) : null,
      height: form.height ? parseFloat(form.height) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      body_type: form.body_type || null,
      color_type: form.color_type || null,
      budget_min: form.budget_min ? parseInt(form.budget_min) : null,
      budget_max: form.budget_max ? parseInt(form.budget_max) : null,
      style_preferences: form.style_preferences.length > 0 ? form.style_preferences : null,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    }

    const { error: upsertError } = await supabase.from('stylist_profiles').upsert(payload, { onConflict: 'user_id' })
    if (upsertError) {
      console.error('Ошибка сохранения профиля:', JSON.stringify(upsertError, null, 2))
      alert('Ошибка: ' + upsertError.message)
    }

    setSaving(false)
    navigate('/catalog')
  }

  if (showIntro) {
    return (
      <div className="min-h-screen bg-white flex flex-col px-4">
        <div className="pt-10 text-center">
          <span className="text-lg font-bold tracking-[0.2em] text-[#1a1a18]">CAPRICCIO</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto pb-12">
          <div className="text-6xl leading-none select-none">👗✨</div>

          <h1 className="mt-6 text-3xl font-semibold text-[#1a1a18]">Познакомимся поближе</h1>
          <p className="mt-3 text-xl font-semibold text-[#D4537E]">Твой личный ИИ-стилист уже ждёт</p>

          <p className="mt-4 text-sm text-[#1a1a18]/70 leading-6">
            Заполни короткую анкету — и Амина будет знать твои параметры, размеры и стиль. Никаких лишних
            вопросов — только точные подборки для тебя
          </p>

          <div className="mt-7 w-full text-left space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none select-none">👗</span>
              <p className="text-sm text-[#1a1a18]">Подборки по твоим размерам</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none select-none">✨</span>
              <p className="text-sm text-[#1a1a18]">Образы под твой стиль жизни</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none select-none">⚡</span>
              <p className="text-sm text-[#1a1a18]">Быстрые рекомендации без лишних вопросов</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowIntro(false)}
            className="mt-8 w-full h-12 rounded-xl bg-[#D4537E] text-white text-sm font-semibold hover:opacity-95 active:opacity-90"
          >
            Заполнить анкету →
          </button>

          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="mt-4 text-xs text-gray-500 underline underline-offset-4 hover:text-gray-700"
          >
            Пропустить
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 text-center">
        <span className="text-lg font-bold tracking-[0.2em] text-[#1a1a18]">CAPRICCIO</span>
        <p className="mt-2 text-sm text-gray-500">Расскажите о себе, чтобы стилист подбирал лучшее для вас</p>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-6">
        <div className="flex gap-2 mb-1">
          {STEPS.map((label, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-[#1a1a18]' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 text-right">Шаг {step + 1} из {STEPS.length} — {STEPS[step]}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-32 max-w-lg mx-auto w-full">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Возраст</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
                placeholder="25"
                min="14"
                max="99"
                className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a18]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Город</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder="Алматы"
                className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a18]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Образ жизни</label>
              <div className="space-y-2">
                {LIFESTYLE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${
                      form.lifestyle === opt.value
                        ? 'border-[#1a1a18] bg-[#1a1a18]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="lifestyle"
                      value={opt.value}
                      checked={form.lifestyle === opt.value}
                      onChange={() => set('lifestyle', opt.value)}
                      className="sr-only"
                    />
                    <span
                      className={`h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        form.lifestyle === opt.value ? 'border-[#1a1a18]' : 'border-gray-300'
                      }`}
                    >
                      {form.lifestyle === opt.value && (
                        <span className="h-2 w-2 rounded-full bg-[#1a1a18]" />
                      )}
                    </span>
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Размер одежды</label>
              <div className="flex flex-wrap gap-2">
                {CLOTHING_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => set('clothing_size', size)}
                    className={`h-10 px-4 rounded-lg border text-sm font-medium transition-colors ${
                      form.clothing_size === size
                        ? 'border-[#1a1a18] bg-[#1a1a18] text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Размер обуви</label>
              <input
                type="text"
                value={form.shoe_size}
                onChange={(e) => set('shoe_size', e.target.value)}
                placeholder="37"
                className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a18]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'height', label: 'Рост (см)', placeholder: '165' },
                { key: 'weight', label: 'Вес (кг)', placeholder: '58' },
                { key: 'chest', label: 'Грудь (см)', placeholder: '88' },
                { key: 'waist', label: 'Талия (см)', placeholder: '68' },
                { key: 'hips', label: 'Бёдра (см)', placeholder: '92' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input
                    type="number"
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder}
                    className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a18]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Тип фигуры</label>
              <div className="space-y-2">
                {BODY_TYPES.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${
                      form.body_type === opt.value
                        ? 'border-[#1a1a18] bg-[#1a1a18]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="body_type"
                      value={opt.value}
                      checked={form.body_type === opt.value}
                      onChange={() => set('body_type', opt.value)}
                      className="sr-only"
                    />
                    <span
                      className={`h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        form.body_type === opt.value ? 'border-[#1a1a18]' : 'border-gray-300'
                      }`}
                    >
                      {form.body_type === opt.value && (
                        <span className="h-2 w-2 rounded-full bg-[#1a1a18]" />
                      )}
                    </span>
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Цветотип</label>
              <div className="space-y-2">
                {COLOR_TYPES.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${
                      form.color_type === opt.value
                        ? 'border-[#1a1a18] bg-[#1a1a18]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="color_type"
                      value={opt.value}
                      checked={form.color_type === opt.value}
                      onChange={() => set('color_type', opt.value)}
                      className="sr-only"
                    />
                    <span
                      className={`h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        form.color_type === opt.value ? 'border-[#1a1a18]' : 'border-gray-300'
                      }`}
                    >
                      {form.color_type === opt.value && (
                        <span className="h-2 w-2 rounded-full bg-[#1a1a18]" />
                      )}
                    </span>
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Бюджет (₸)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={form.budget_min}
                  onChange={(e) => set('budget_min', e.target.value)}
                  placeholder="От 5 000"
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a18]"
                />
                <input
                  type="number"
                  value={form.budget_max}
                  onChange={(e) => set('budget_max', e.target.value)}
                  placeholder="До 50 000"
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a18]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Стиль (можно несколько)</label>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleStyle(opt.value)}
                    className={`h-9 px-4 rounded-full border text-sm transition-colors ${
                      form.style_preferences.includes(opt.value)
                        ? 'border-[#D4537E] bg-[#D4537E] text-white'
                        : 'border-gray-200 text-gray-700 hover:border-[#D4537E]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 flex gap-3 max-w-lg mx-auto">
        {step > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="h-12 px-5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Назад
          </button>
        )}
        <button
          type="button"
          onClick={handleSkip}
          className="h-12 px-5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 ml-auto"
        >
          Пропустить
        </button>
        <button
          type="button"
          onClick={step < STEPS.length - 1 ? handleNext : handleFinish}
          disabled={saving}
          className="h-12 px-6 rounded-xl bg-[#1a1a18] text-sm font-medium text-white hover:bg-black disabled:opacity-60"
        >
          {saving ? 'Сохраняем...' : step < STEPS.length - 1 ? 'Далее' : 'Готово'}
        </button>
      </div>
    </div>
  )
}
