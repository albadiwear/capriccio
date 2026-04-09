import { useAuthStore } from '../store/authStore'

export const useAuth = () => {
  const { user, session, loading, signOut } = useAuthStore()

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
  const isAdmin =
    user?.user_metadata?.role === 'admin' ||
    (adminEmail && user?.email === adminEmail)

  return {
    user,
    session,
    loading,
    signOut,
    isAdmin
  }
}
