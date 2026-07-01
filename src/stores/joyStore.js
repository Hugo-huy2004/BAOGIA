import { create } from 'zustand'

const apiBase = import.meta.env.VITE_API_URL || '/api';
const inflightBalanceRequests = new Map();
const balanceCache = new Map();
const BALANCE_CACHE_TTL_MS = 10_000;

export const useJoyStore = create((set, get) => ({
  balance: 0,
  referralCode: '',
  loaded: false,

  setBalance: (balance) => set({ balance: Math.round(Number(balance)) || 0 }),

  fetchBalance: async (email, signal) => {
    if (!email) return;
    const normalizedEmail = email.trim().toLowerCase();
    const cached = balanceCache.get(normalizedEmail);
    if (cached && cached.expiresAt > Date.now()) {
      set({ balance: cached.balance, referralCode: cached.referralCode, loaded: true });
      return;
    }

    if (inflightBalanceRequests.has(normalizedEmail)) {
      return inflightBalanceRequests.get(normalizedEmail);
    }

    const request = (async () => {
    try {
      const r = await fetch(`${apiBase}/joy/balance?email=${encodeURIComponent(normalizedEmail)}`, {
        credentials: 'include',
        ...(signal ? { signal } : {}),
      });
      if (!r.ok) return;
      const data = await r.json();
      const nextState = { balance: Math.round(Number(data.balance)) || 0, referralCode: data.referralCode || '', loaded: true };
      set(nextState);
      balanceCache.set(normalizedEmail, {
        ...nextState,
        expiresAt: Date.now() + BALANCE_CACHE_TTL_MS,
      });
    } catch (e) {
      // AbortError is expected when a newer sync() call cancels this one — silence it.
      if (e?.name !== 'AbortError') {
        // Swallow other network/CORS errors silently — balance will sync via WebSocket.
      }
    } finally {
      inflightBalanceRequests.delete(normalizedEmail);
    }
    })();

    inflightBalanceRequests.set(normalizedEmail, request);
    return request;
  },
}))
