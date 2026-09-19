import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { joyText } from "../../lib/joyDisplay";
import { API_BASE } from "../../config/apiBase";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Hạn mức nghe HugoRadio, đo bằng TOKEN — 1 token = 10 phút.
 */

// ── Heartbeat API ────────────────────────────────────────────────────────────

export async function sendRadioHeartbeat(minutes        , { keepalive = false } = {}) {
  if (!(minutes > 0)) return null;
  try {
    const res = await fetch(`${API_BASE}/radio/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive,
      body: JSON.stringify({ listeningMinutes: Number(minutes.toFixed(2)) }),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

// ── Hook: nguồn sự thật duy nhất về token ────────────────────────────────────

export function useRadioHeartbeat(bio     , isPlaying         ) {
  const [tokenStatus, setTokenStatus] = useState     (null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef     (null);
  const startedRef = useRef(0);

  const refetch = useCallback(async () => {
    if (!bio?.email) {
      setLoading(false);
      return null;
    }
    try {
      const res = await fetch(`${API_BASE}/radio/token-status`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTokenStatus(data);
        return data;
      }
    } catch { /* mạng hỏng: giữ nguyên số đang hiện, đừng xoá trắng */ }
    finally { setLoading(false); }
    return null;
  }, [bio?.email]);

  const flush = useCallback(async ({ final = false } = {}) => {
    if (!startedRef.current) return null;
    const minutes = (Date.now() - startedRef.current) / 60000;
    startedRef.current = final ? 0 : Date.now();
    const data = await sendRadioHeartbeat(minutes, { keepalive: final });
    if (data) setTokenStatus(data);
    return data;
  }, []);

  useEffect(() => {
    if (!isPlaying) return undefined;
    startedRef.current = Date.now();
    intervalRef.current = setInterval(() => flush(), 5 * 60 * 1000);

    const onHide = () => flush({ final: true });
    const onVisibility = () => {
      if (document.hidden) flush({ final: true });
      else startedRef.current = Date.now();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
      flush({ final: true });
    };
  }, [isPlaying, flush]);

  useEffect(() => { refetch(); }, [refetch]);

  return { tokenStatus, loading, refetch, flush };
}

// ── Thanh hiển thị ───────────────────────────────────────────────────────────

function useResetIn(nextResetAt               ) {
  const { i18n } = useTranslation();
  if (!nextResetAt) return null;
  const days = Math.ceil((new Date(nextResetAt).getTime() - Date.now()) / 86400000);
  if (!Number.isFinite(days)) return null;
  try {
    return new Intl.RelativeTimeFormat(i18n.language, { numeric: "auto" })
      .format(Math.max(0, days), "day");
  } catch {
    return null;
  }
}

;                                
              
                    
                         
 

export default function RadioTokenStatus({ status, loading = false, onBuyMore }                       ) {
  const { t } = useTranslation();
  const resetIn = useResetIn(status?.nextResetAt);

  if (loading && !status) {
    return <div className="h-[92px] rounded-2xl bg-muted border border-border animate-pulse" />;
  }
  if (!status) return null;

  const {
    tokensLeft = 0, freeTokens = 0, freeTokensLeft = 0, purchasedTokens = 0,
    partialMinutes = 0, minutesPerToken = 10, canListen, peak,
  } = status;

  const empty = !canListen;
  const low = !empty && tokensLeft <= 3;
  const freePercent = freeTokens > 0 ? Math.round((freeTokensLeft / freeTokens) * 100) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border bg-card/80 backdrop-blur-md p-4 flex flex-col gap-3 shadow-lg ${empty ? "border-red-500/50 shadow-red-500/10" : "border-white/10"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${empty ? "bg-red-500/20 text-red-400" : "bg-indigo-500/20 text-indigo-400"}`}>
            <span className="material-symbols-outlined text-xl">confirmation_number</span>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-foreground leading-tight">
              {t("utilities.radio.token.title")}
            </p>
            <p className="text-[13px] text-muted-foreground leading-tight mt-0.5">
              {t("utilities.radio.token.perToken", { minutes: minutesPerToken })}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className={`text-3xl font-black tabular-nums leading-none bg-clip-text text-transparent ${empty ? "bg-gradient-to-r from-red-400 to-orange-400" : low ? "bg-gradient-to-r from-yellow-400 to-orange-400" : "bg-gradient-to-r from-indigo-400 to-purple-400"}`}>
            {tokensLeft}
          </span>
          <span className="text-[13px] font-bold text-muted-foreground ml-1">
            {t("utilities.radio.token.unit")}
          </span>
        </div>
      </div>

      <div>
        <div className="h-1.5 rounded-full bg-black/20 overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${freePercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`absolute top-0 bottom-0 left-0 rounded-full ${empty ? "bg-red-500" : low ? "bg-yellow-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"}`}
          />
        </div>
        <div className="flex items-center justify-between gap-2 mt-2 text-[13px] text-muted-foreground">
          <span className="truncate">
            {t("utilities.radio.token.freeLeft", { n: freeTokensLeft, total: freeTokens })}
            {purchasedTokens > 0 && ` · ${t("utilities.radio.token.purchasedLeft", { n: purchasedTokens })}`}
          </span>
          {resetIn && <span className="shrink-0">{t("utilities.radio.token.resetIn", { when: resetIn })}</span>}
        </div>
      </div>

      {peak && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 text-[13px] text-orange-400 bg-orange-400/10 p-2 rounded-xl">
          <span className="material-symbols-outlined text-base shrink-0">schedule</span>
          <span>{t("utilities.radio.token.peakNotice", { minutes: minutesPerToken / 2 })}</span>
        </motion.p>
      )}

      {empty && (
        <p className="text-[13px] text-red-400">{t("utilities.radio.token.emptyDesc")}</p>
      )}
      {!empty && partialMinutes > 0 && tokensLeft === 0 && (
        <p className="text-[13px] text-orange-400">
          {t("utilities.radio.token.lastMinutes", { minutes: Math.ceil(partialMinutes) })}
        </p>
      )}

      {onBuyMore && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onBuyMore}
          className="h-11 mt-1 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 text-[15px] font-bold flex items-center justify-center gap-2 hover:bg-indigo-500/30 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>{t("utilities.radio.token.buyMore")}</span>
        </motion.button>
      )}
    </motion.div>
  );
}

// ── Mua thêm token ───────────────────────────────────────────────────────────

const PRICE_FALLBACK = { minutesPerToken: 10, joyPerToken: 200, feeRate: 0.1, maxTokens: 1008 };

                                
           
                                                  
                      
                           
 

export function RadioStoreModal({ bio, showToast, onClose, onPurchased }                      ) {
  const { t, i18n } = useTranslation();
  const [price, setPrice] = useState(PRICE_FALLBACK);
  const [tokens, setTokens] = useState(6);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/utility-store/radio-price`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.joyPerToken) setPrice(data); })
      .catch(() => {});
  }, []);

  const nf = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);
  const base = tokens * price.joyPerToken;
  const fee = Math.floor(base * price.feeRate);
  const total = base + fee;
  const minutes = tokens * price.minutesPerToken;
  const balance = bio?.joyBalance ?? 0;
  const short = total - balance;

  const clamp = (value        ) => Math.min(Math.max(Math.round(value) || 1, 1), price.maxTokens);

  async function handleBuy() {
    if (buying) return;
    setBuying(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/utility-store/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productType: "radio_time", tokens }),
      });
      const raw = await res.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch { /* ignore */ }
      if (!res.ok || !data) throw new Error(data?.error || t("utilities.radio.store.genericError"));
      showToast?.(t("utilities.radio.store.success", { n: tokens }), "success");
      await onPurchased?.();
      onClose();
    } catch (err     ) {
      setError(err.message);
    } finally {
      setBuying(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          role="dialog"
          aria-label={t("utilities.radio.store.title")}
          className="relative bg-card/90 backdrop-blur-xl border border-white/10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto p-5 flex flex-col gap-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-foreground bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {t("utilities.radio.store.title")}
              </h3>
              <p className="text-[13px] text-muted-foreground mt-1">
                {t("utilities.radio.store.desc", { minutes: price.minutesPerToken })}
              </p>
            </div>
            <button onClick={onClose} aria-label={t("utilities.radio.store.close")}
              className="w-11 h-11 shrink-0 rounded-full bg-white/5 text-muted-foreground flex items-center justify-center hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-black/20 border border-white/5 px-4 py-3">
            <span className="text-[13px] text-muted-foreground">{t("utilities.radio.store.balance")}</span>
            <span className="text-[15px] font-bold tabular-nums text-foreground">{joyText(balance)}</span>
          </div>

          <div className="flex flex-col gap-3">
            <label htmlFor="radio-token-amount" className="text-[13px] font-bold text-muted-foreground">
              {t("utilities.radio.store.amount")}
            </label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setTokens((n) => clamp(n - 1))}
                className="w-11 h-11 shrink-0 rounded-full border border-white/10 bg-black/20 text-foreground flex items-center justify-center active:scale-95 transition-transform hover:bg-white/5">
                <span className="material-symbols-outlined">remove</span>
              </button>
              <input
                id="radio-token-amount"
                type="number"
                inputMode="numeric"
                min="1"
                max={price.maxTokens}
                value={tokens}
                onChange={(e) => setTokens(clamp(Number(e.target.value)))}
                className="flex-1 h-11 text-center rounded-xl border border-white/10 bg-black/20 text-foreground text-lg font-black tabular-nums outline-none focus:border-indigo-500 transition-colors"
              />
              <button type="button" onClick={() => setTokens((n) => clamp(n + 1))}
                className="w-11 h-11 shrink-0 rounded-full border border-white/10 bg-black/20 text-foreground flex items-center justify-center active:scale-95 transition-transform hover:bg-white/5">
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
            <p className="text-[13px] text-muted-foreground">
              {t("utilities.radio.store.equals", { n: tokens, minutes })}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[6, 18, 36, 72].map((n) => (
              <button key={n} type="button" onClick={() => setTokens(n)}
                className={`h-11 rounded-xl border text-[13px] font-bold transition-all ${
                  tokens === n ? "border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "border-white/10 bg-black/20 text-foreground hover:bg-white/5"
                }`}>
                {t("utilities.radio.store.preset", { n: n, hours: (n * price.minutesPerToken) / 60 })}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 flex flex-col gap-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("utilities.radio.store.unitPrice")}</span>
              <span className="tabular-nums font-bold text-foreground">{joyText(price.joyPerToken)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("utilities.radio.store.fee", { percent: Math.round(price.feeRate * 100) })}</span>
              <span className="tabular-nums font-bold text-foreground">{joyText(fee)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 text-[15px]">
              <span className="font-bold text-foreground">{t("utilities.radio.store.total")}</span>
              <span className="tabular-nums font-black text-indigo-400">{joyText(total)}</span>
            </div>
          </div>

          <p className="text-[13px] text-muted-foreground">{t("utilities.radio.store.peakNotice")}</p>

          {error && <p className="text-[13px] text-red-400">{error}</p>}
          {!error && short > 0 && (
            <p className="text-[13px] text-orange-400">{t("utilities.radio.store.short", { amount: nf.format(short) })}</p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBuy}
            disabled={buying || short > 0}
            className="h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buying && <span className="material-symbols-outlined animate-spin text-lg">refresh</span>}
            {buying
              ? t("utilities.radio.store.buying")
              : t("utilities.radio.store.buy", { n: tokens, total: nf.format(total) })}
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
