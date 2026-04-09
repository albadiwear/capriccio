import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  items: [],
  isOpen: false,

  setIsOpen: (val) => set({ isOpen: val }),

  addItem: (item) =>
    set((state) => {
      const productId = item.product_id ?? item.id
      const nextItem = {
        ...item,
        // Normalize identifiers so remove/update always work.
        product_id: productId,
        id: item.id ?? productId,
        quantity: item.quantity || 1,
      }

      const existing = state.items.find((i) => {
        const existingProductId = i.product_id ?? i.id
        return (
          existingProductId === productId &&
          (i.color ?? null) === (nextItem.color ?? null) &&
          (i.size ?? null) === (nextItem.size ?? null)
        )
      })
      if (existing) {
        return {
          items: state.items.map((i) =>
            i === existing ? { ...i, quantity: i.quantity + (nextItem.quantity || 1) } : i
          ),
        }
      }
      return { items: [...state.items, nextItem] }
    }),

  // Supports both signatures:
  // 1) removeItem(product_id, size)
  // 2) removeItem(id, color, size) (legacy)
  removeItem: (...args) =>
    set((state) => {
      let productId
      let size
      let color

      if (args.length === 3) {
        ;[productId, color, size] = args
      } else {
        ;[productId, size] = args
      }

      return {
        items: state.items.filter((item) => {
          const sameProduct = (item.product_id ?? item.id) === productId
          const sameSize = (item.size ?? null) === (size ?? null)
          const sameColor = args.length === 3 ? (item.color ?? null) === (color ?? null) : true
          return !(sameProduct && sameSize && sameColor)
        }),
      }
    }),

  // Supports both signatures:
  // 1) updateQuantity(product_id, size, quantity)
  // 2) updateQuantity(id, color, size, quantity) (legacy)
  updateQuantity: (...args) => {
    let productId
    let size
    let color
    let quantity

    if (args.length === 4) {
      ;[productId, color, size, quantity] = args
    } else {
      ;[productId, size, quantity] = args
    }

    if (quantity <= 0) {
      if (args.length === 4) {
        get().removeItem(productId, color, size)
      } else {
        get().removeItem(productId, size)
      }
      return
    }

    set((state) => ({
      items: state.items.map((item) => {
        const sameProduct = (item.product_id ?? item.id) === productId
        const sameSize = (item.size ?? null) === (size ?? null)
        const sameColor = args.length === 4 ? (item.color ?? null) === (color ?? null) : true
        return sameProduct && sameSize && sameColor ? { ...item, quantity } : item
      }),
    }))
  },

  clearCart: () => set({ items: [] }),

  get total() {
    return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  },
}))
