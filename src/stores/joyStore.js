import { create } from 'zustand'

const apiBase = import.meta.env.VITE_API_URL || '/api';

export const useJoyStore = create((set, get) => ({
  balance: 0,
  referralCode: '',
  loaded: false,

  setBalance: (balance) => set({ balance }),

  fetchBalance: async (email) => {
    if (!email) return;
    try {
      const r = await fetch(`${apiBase}/joy/balance?email=${encodeURIComponent(email)}`, { credentials: 'include' });
      if (!r.ok) return;
      const data = await r.json();
      set({ balance: data.balance || 0, referralCode: data.referralCode || '', loaded: true });
    } catch (_) {}
  },
}))
