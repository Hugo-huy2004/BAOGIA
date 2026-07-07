import React, { createContext, useContext, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

const JoyContext = createContext(null);

export function useJoy() {
  return useContext(JoyContext);
}

export function JoyProvider({ children, email = "user@example.com" }) {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchBalance() {
    try {
      const res = await fetch(`${API_BASE}/joy/balance?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error("Failed to load balance");
      const d = await res.json();
      setBalance(d.balance ?? d?.data?.balance ?? 0);
    } catch {
      // fallback
      setBalance((b) => (b == null ? 1250 : b));
    }
  }

  async function fetchTransactions() {
    try {
      const res = await fetch(`${API_BASE}/joy/transactions?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error("Failed to load transactions");
      const d = await res.json();
      setTransactions(d.transactions ?? d ?? []);
    } catch {
      setTransactions((txs) => (txs.length ? txs : [
        { id: "TX1", label: "Mua theme", amount: -120, when: "2026-06-01" },
        { id: "TX2", label: "Thưởng cộng tác", amount: 400, when: "2026-06-03" },
      ]));
    }
  }

  async function refreshAll() {
    setLoading(true);
    await Promise.all([fetchBalance(), fetchTransactions()]);
    setLoading(false);
  }

  useEffect(() => { refreshAll(); }, [email]);

  async function executeExchange(item) {
    try {
      const res = await fetch(`${API_BASE}/joy/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, item }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || d?.message || "Exchange failed");
      // refresh data after success
      await refreshAll();
      return d;
    } catch (e) {
      throw e;
    }
  }

  // Optimistic execute: apply local state changes immediately, attempt API call, rollback on failure
  async function optimisticExecuteExchange(item, { amount = 0, label = "Trao đổi JOY" } = {}) {
    const prevBalance = (typeof balance === 'number') ? balance : null;
    const tempId = `temp-${Date.now()}`;
    const when = new Date().toISOString().slice(0, 10);
    const tempTx = { id: tempId, label, amount: -(amount || 0), when, pending: true };

    // apply optimistic
    setTransactions((t) => [tempTx, ...t]);
    setBalance((b) => (typeof b === 'number' ? Math.max(0, b - (amount || 0)) : b));

    try {
      const res = await fetch(`${API_BASE}/joy/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, item }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || d?.message || "Exchange failed");

      // replace temp tx with real transaction if returned, otherwise refresh
      if (d && (d.transaction || d.tx || d.data)) {
        const real = d.transaction || d.tx || d.data;
        setTransactions((t) => t.map((x) => (x.id === tempId ? { ...x, id: real.id || `${real.id || Math.random()}`, amount: real.amount ?? x.amount, label: real.label ?? x.label, pending: false, when: real.when ?? x.when } : x)));
      }

      // refresh balance/transactions to ensure canonical state
      await refreshAll();
      return d;
    } catch (e) {
      // rollback optimistic change
      setTransactions((t) => t.filter((x) => x.id !== tempId));
      if (prevBalance != null) setBalance(prevBalance);
      throw e;
    }
  }

  return (
    <JoyContext.Provider value={{ balance, transactions, loading, refreshAll, executeExchange }}>
      {children}
    </JoyContext.Provider>
  );
}

export default JoyProvider;
