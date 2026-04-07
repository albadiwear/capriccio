import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSEO } from '../hooks/useSEO'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.7 12 2.7A9.3 9.3 0 0 0 2.7 12 9.3 9.3 0 0 0 12 21.3c5.4 0 9-3.8 9-9.1 0-.6-.1-1.1-.2-1.6H12Z"
      />
      <path
        fill="#34A853"
        d="M2.7 12c0 1.8.6 3.5 1.7 4.8l3-2.3c-.4-.7-.7-1.6-.7-2.5s.2-1.7.7-2.5l-3-2.3A9.2 9.2 0 0 0 2.7 12Z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.3c2.5 0 4.6-.8 6.1-2.3l-3-2.4c-.8.6-1.8 1-3.1 1-2.5 0-4.7-1.7-5.5-4l-3 2.3c1.6 3.1 4.8 5.4 8.5 5.4Z"
      />
      <path
        fill="#4285F4"
        d="M18.1 19c1.7-1.6 2.9-4 2.9-7 0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.3 1.2-1 2.2-1.9 3l2.6 1.7Z"
      />
    </svg>
  )
}

export default function RegisterPage() {
  useSEO({ title: 'Регистрация', url: '/register' })
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

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/account`,
      },
    })

    if (error) console.error(error)
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

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-sm text-gray-400">или</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <GoogleIcon />
            Войти через Google
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
