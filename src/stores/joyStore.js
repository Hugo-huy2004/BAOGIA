import { create } from 'zustand'

const apiBase = import.meta.env.VITE_API_URL || '/api';
const inflightBalanceRequests = new Map();
const balanceCache = new Map();
const BALANCE_CACHE_TTL_MS = 10_000;

// Persist last-known balance per-email so the UI shows a number instantly on
// reload / server cold-start instead of blank, then revalidates in background.
const LS_KEY = (email) => `joy_bal_${email}`;
const readPersisted = (email) => {
  try { return JSON.parse(localStorage.getItem(LS_KEY(email)) || 'null'); } catch { return null; }
};
const writePersisted = (email, state) => {
  try { localStorage.setItem(LS_KEY(email), JSON.stringify({ balance: state.balance, referralCode: state.referralCode })); } catch { /* ignore quota */ }
};

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

    // Show last-known balance instantly (before the network round-trip / cold start).
    if (!get().loaded) {
      const persisted = readPersisted(normalizedEmail);
      if (persisted) set({ balance: Math.round(Number(persisted.balance)) || 0, referralCode: persisted.referralCode || '', loaded: true });
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
      writePersisted(normalizedEmail, nextState);
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
