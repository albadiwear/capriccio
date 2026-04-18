import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

export default function ProtectedRoute({ children, adminOnly = false, managerOnly = false }) {
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const [userRole, setUserRole] = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setRoleLoading(false)
      return
    }
    supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setUserRole(data?.role ?? null)
        setRoleLoading(false)
      })
  }, [user])

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
  const isAdmin = userRole === 'admin' || (adminEmail && user?.email === adminEmail)
  const isManager = userRole === 'manager' || userRole === 'admin' || (adminEmail && user?.email === adminEmail)

  if (loading || (user && roleLoading)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #f0ede8', borderTop: '2px solid #1a1a18', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/catalog" replace />
  }

  if (managerOnly && !isManager) {
    return <Navigate to="/catalog" replace />
  }

  return children
}
