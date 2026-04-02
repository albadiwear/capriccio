import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agree: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        navigate('/account', { replace: true })
      }
    }

    checkSession()
  }, [navigate])

  const validateForm = () => {
    const errors = {}

    if (!formData.full_name.trim()) {
      errors.full_name = 'Введите имя'
    }

    if (!formData.email.trim()) {
      errors.email = 'Введите email'
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Введите корректный email'
    }

    if (formData.phone && !/^[\d+\s()-]{6,}$/.test(formData.phone)) {
      errors.phone = 'Введите корректный номер телефона'
    }

    if (!formData.password) {
      errors.password = 'Введите пароль'
    } else if (formData.password.length < 6) {
      errors.password = 'Пароль должен содержать минимум 6 символов'
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Подтвердите пароль'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают'
    }

    if (!formData.agree) {
      errors.agree = 'Необходимо согласиться с условиями использования'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    setFieldErrors((prev) => ({
      ...prev,
      [name]: '',
    }))
    setFormError('')
    setSuccessMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setFormError('')
    setSuccessMessage('')

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
        },
      },
    })

    if (error) {
      setFormError(error.message)
      setLoading(false)
      return
    }

    setSuccessMessage('Проверьте email для подтверждения')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 md:py-10">
      <div className="mx-auto mt-8 max-w-md rounded-2xl bg-white p-6 shadow-sm sm:mt-16 sm:p-8">
        <div className="text-center">
          <Link to="/" className="text-lg font-bold tracking-[0.2em] text-gray-900">
            CAPRICCIO
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Регистрация</h1>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <div>
            <label htmlFor="full_name" className="mb-2 block text-sm font-medium text-gray-700">
              Имя
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Ваше имя"
            />
            {fieldErrors.full_name && (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.full_name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="you@example.com"
            />
            {fieldErrors.email && (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
              Телефон
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="h-12 w-full rounded-lg border border-gray-300 px-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="+7 777 123 45 67"
            />
            {fieldErrors.phone && (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.phone}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
              Пароль
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                className="h-12 w-full rounded-lg border border-gray-300 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Введите пароль"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-900"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
              Подтверждение пароля
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                className="h-12 w-full rounded-lg border border-gray-300 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Повторите пароль"
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-900"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <div>
            <label className="flex items-start gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span>Согласен с условиями использования</span>
            </label>
            {fieldErrors.agree && (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.agree}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-lg bg-gray-900 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-gray-900 transition-colors hover:text-gray-700">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
