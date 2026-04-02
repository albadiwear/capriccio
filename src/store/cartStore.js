import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  items: [],
  isOpen: false,

  setIsOpen: (val) => set({ isOpen: val }),

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find(
        (i) => i.id === item.id && i.color === item.color && i.size === item.size
      )
      if (existing) {
        return {
          items: state.items.map((i) =>
            i === existing ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
          ),
        }
      }
      return { items: [...state.items, { ...item, quantity: item.quantity || 1 }] }
    }),

  removeItem: (id, color, size) =>
    set((state) => ({
      items: state.items.filter(
        (i) => !(i.id === id && i.color === color && i.size === size)
      ),
    })),

  updateQuantity: (id, color, size, qty) =>
    set((state) => ({
      items: state.items
        .map((i) =>
          i.id === id && i.color === color && i.size === size
            ? { ...i, quantity: qty }
            : i
        )
        .filter((i) => i.quantity > 0),
    })),

  clearCart: () => set({ items: [] }),

  get total() {
    return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  },
}))
