import { create } from 'zustand'
import { supabase } from '../lib/supabase'

let authSubscription = null
const isTelegramMiniApp = () => typeof window !== 'undefined' && window.Telegram?.WebApp?.initData !== ''

// Google OAuth users without a saved phone must finish onboarding first.
async function redirectGoogleUserWithoutPhone(user) {
  if (!user || user.app_metadata?.provider !== 'google') return
  if (typeof window === 'undefined' || window.location.pathname === '/onboarding') return

  const { data } = await supabase
    .from('users')
    .select('phone')
    .eq('id', user.id)
    .maybeSingle()

  const hasPhone = !!data?.phone && String(data.phone).trim() !== ''
  if (!hasPhone) {
    window.location.assign('/onboarding')
  }
}

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  initialize: () => {
    set({ loading: true })

    Promise.all([
      supabase.auth.getSession(),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ])
      .then(async ([sessionRes]) => {
        try {
          const session = sessionRes?.data?.session ?? null
          if (session) {
            try {
              const { data: refreshed } = await supabase.auth.refreshSession()
              const activeUser = refreshed.session?.user ?? session.user ?? null
              set({
                session: refreshed.session ?? session,
                user: activeUser,
                loading: false,
              })
              redirectGoogleUserWithoutPhone(activeUser)
            } catch {
              set({ session, user: session.user ?? null, loading: false })
              redirectGoogleUserWithoutPhone(session.user ?? null)
            }
          } else {
            set((state) => ({
              session: null,
              user: isTelegramMiniApp() ? state.user : null,
              loading: false,
            }))
          }
        } catch {
          set((state) => ({
            session: null,
            user: isTelegramMiniApp() ? state.user : null,
            loading: false,
          }))
        }
      })
      .catch(() => {
        set((state) => ({
          session: null,
          user: isTelegramMiniApp() ? state.user : null,
          loading: false,
        }))
      })

    if (authSubscription) {
      authSubscription.unsubscribe()
      authSubscription = null
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      set((state) => ({
        session,
        user: session?.user ?? (isTelegramMiniApp() ? state.user : null),
        // Don't hide splash early during initial bootstrap.
        loading: state.loading ? true : false,
      }))

      // After a Google OAuth sign-in, send users without a phone to onboarding.
      if (event === 'SIGNED_IN') {
        redirectGoogleUserWithoutPhone(session?.user ?? null)
      }
    })

    authSubscription = subscription

    return () => {
      subscription.unsubscribe()
      if (authSubscription === subscription) {
        authSubscription = null
      }
    }
  }
}))
