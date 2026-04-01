import { create } from 'zustand';

export const useStore = create((set) => ({
  cart: [],
  user: null,
  products: [],

  addToCart: (product) =>
    set((state) => ({
      cart: [...state.cart, product],
    })),

  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== productId),
    })),

  clearCart: () => set({ cart: [] }),

  setUser: (user) => set({ user }),

  setProducts: (products) => set({ products }),
}));
