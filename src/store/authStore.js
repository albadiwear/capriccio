import { create } from 'zustand'
import { supabase } from '../lib/supabase'

let authSubscription = null

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
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        try {
          if (session) {
            const { data: refreshed } = await supabase.auth.refreshSession()
            set({ session: refreshed.session, user: refreshed.session?.user ?? null, loading: false })
          } else {
            set({ session: null, user: null, loading: false })
          }
        } catch {
          set({ session: null, user: null, loading: false })
        }
      })
      .catch(() => {
        set({ session: null, user: null, loading: false })
      })

    if (authSubscription) {
      authSubscription.unsubscribe()
      authSubscription = null
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false })
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
