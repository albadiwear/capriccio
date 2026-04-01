import { useAuthStore } from '../store/authStore'

export const useAuth = () => {
  const { user, session, loading, signOut } = useAuthStore()

  const isAdmin = user?.user_metadata?.role === 'admin'

  return {
    user,
    session,
    loading,
    signOut,
    isAdmin
  }
}