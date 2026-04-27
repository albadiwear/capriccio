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
              set({
                session: refreshed.session ?? session,
                user: refreshed.session?.user ?? session.user ?? null,
                loading: false,
              })
            } catch {
              set({ session, user: session.user ?? null, loading: false })
            }
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
      set((state) => ({
        session,
        user: session?.user ?? null,
        // Don't hide splash early during initial bootstrap.
        loading: state.loading ? true : false,
      }))
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
