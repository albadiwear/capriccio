import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useWishlistStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,

  clear: () => set({ items: [], loading: false, error: null }),

  load: async (userId) => {
    if (!userId) {
      set({ items: [], loading: false, error: null })
      return
    }

    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('wishlist')
      .select('id, product_id')
      .eq('user_id', userId)

    if (error) {
      set({ loading: false, error: error.message || 'Не удалось загрузить избранное' })
      return
    }

    set({ items: data || [], loading: false, error: null })
  },

  toggle: async ({ userId, productId }) => {
    if (!userId || !productId) return

    const existing = get().items.find((i) => i.product_id === productId)
    if (existing) {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', existing.id)

      if (!error) {
        set((state) => ({ items: state.items.filter((i) => i.id !== existing.id) }))
      }
      return
    }

    const { data, error } = await supabase
      .from('wishlist')
      .insert({ user_id: userId, product_id: productId })
      .select('id, product_id')
      .single()

    if (!error && data) {
      set((state) => ({ items: [data, ...state.items] }))
    }
  },

  get count() {
    return get().items.length
  },
}))

