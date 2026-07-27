import { create } from 'zustand';

const API = import.meta.env.VITE_API_URL || '/api';

export const useCartStore = create((set, get) => ({
  items: [],
  promoCode: null,
  promoDiscount: 0,
  loading: false,

  // Derived
  get subtotal() { return get().items.reduce((s, i) => s + i.priceJoy * i.quantity, 0); },
  get tax() { return Math.floor(get().subtotal * 0.09); },
  get total() { return Math.max(1, get().subtotal + get().tax - get().promoDiscount); },
  get itemCount() { return get().items.reduce((s, i) => s + i.quantity, 0); },

  sync: async (email) => {
    if (!email) return;
    set({ loading: true });
    try {
      const r = await fetch(`${API}/store/cart`, { credentials: 'include' });
      if (r.ok) {
        const cart = await r.json();
        set({ items: cart.items || [], promoCode: cart.promoCode, promoDiscount: cart.promoDiscount || 0 });
      }
    } catch {} finally { set({ loading: false }); }
  },

  addItem: async (email, product) => {
    if (!email || !product?._id) return false;
    const r = await fetch(`${API}/store/cart/add`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ email, productId: product._id })
    });
    if (r.ok) {
      const cart = await r.json();
      set({ items: cart.items || [] });
      return true;
    }
    const err = await r.json();
    throw new Error(err.error);
  },

  updateQuantity: async (email, productId, quantity) => {
    try {
      const r = await fetch(`${API}/store/cart/update`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ email, productId, quantity })
      });
      if (r.ok) { const cart = await r.json(); set({ items: cart.items || [] }); }
    } catch {}
  },

  removeItem: async (email, productId) => {
    try {
      const r = await fetch(`${API}/store/cart/remove`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ email, productId })
      });
      if (r.ok) { const cart = await r.json(); set({ items: cart.items || [] }); }
    } catch {}
  },

  clearCart: async (email) => {
    try {
      await fetch(`${API}/store/cart/clear`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ email })
      });
      set({ items: [], promoCode: null, promoDiscount: 0 });
    } catch {}
  },

  applyPromo: async (email, promoCode) => {
    const r = await fetch(`${API}/store/cart/apply-promo`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ email, promoCode })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    set({ promoCode: data.promo.code, promoDiscount: data.discount });
    return data.promo;
  },

  removePromo: async (email) => {
    await fetch(`${API}/store/cart/remove-promo`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ email })
    });
    set({ promoCode: null, promoDiscount: 0 });
  },

  checkout: async (email) => {
    set({ loading: true });
    try {
      const r = await fetch(`${API}/store/cart/checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ email })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      set({ items: [], promoCode: null, promoDiscount: 0 });
      return data;
    } finally { set({ loading: false }); }
  }
}));
