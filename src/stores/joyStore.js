import { create } from 'zustand'
import { getMemberToken } from '../services/authSession';

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
  try { localStorage.setItem(LS_KEY(email), JSON.stringify({ balance: state.balance, referralCode: state.referralCode, referralCount: state.referralCount })); } catch { /* ignore quota */ }
};

export const useJoyStore = create((set, get) => ({
  balance: 0,
  referralCode: '',
  referralCount: 0,
  loaded: false,

  setBalance: (balance) => set({ balance: Math.round(Number(balance)) || 0 }),
  setReferralCount: (referralCount) => set({ referralCount: Math.max(0, Number(referralCount) || 0) }),

  hydrateWallet: (email, wallet = {}) => {
    if (!email) return;
    const normalizedEmail = email.trim().toLowerCase();
    const nextState = {
      balance: Math.round(Number(wallet.balance)) || 0,
      referralCode: wallet.referralCode || '',
      referralCount: Math.max(0, Number(wallet.referralCount) || 0),
      loaded: true,
    };
    set(nextState);
    balanceCache.set(normalizedEmail, {
      ...nextState,
      expiresAt: Date.now() + BALANCE_CACHE_TTL_MS,
    });
    writePersisted(normalizedEmail, nextState);
  },

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
      if (persisted) set({
        balance: Math.round(Number(persisted.balance)) || 0,
        referralCode: persisted.referralCode || '',
        referralCount: Math.max(0, Number(persisted.referralCount) || 0),
        loaded: true,
      });
    }

    if (inflightBalanceRequests.has(normalizedEmail)) {
      return inflightBalanceRequests.get(normalizedEmail);
    }

    const request = (async () => {
    try {
      const token = getMemberToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const r = await fetch(`${apiBase}/joy/balance?email=${encodeURIComponent(normalizedEmail)}`, {
        headers,
        credentials: 'include',
        ...(signal ? { signal } : {}),
      });
      if (!r.ok) {
        if (r.status === 401) {
          balanceCache.set(normalizedEmail, {
            balance: 0, referralCode: '', referralCount: 0, loaded: true,
            expiresAt: Date.now() + 60000,
          });
        }
        return;
      }
      const data = await r.json();
      const nextState = {
        balance: Math.round(Number(data.balance)) || 0,
        referralCode: data.referralCode || '',
        referralCount: get().referralCount,
        loaded: true,
      };
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
