import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

// Invoice-style confirmation shown before every "Trao đổi JOY" charge —
// HugoCoder/Aura/Radio/Arcade subscriptions, bio theme rental, file
// compression. Fetches an authoritative quote (price/tax/total/balance) from
// GET /api/joy/exchange-quote so the UI never duplicates the server's pricing
// math, then calls `onConfirm` (the actual charge request) only once the
// member explicitly confirms.
export default function JoyExchangeModal({ open, bio, item, onClose, onConfirm, onSuccess }) {
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !bio?.email || !item) return;
    setError("");
    setQuote(null);
    setLoadingQuote(true);
    fetch(`${API_BASE}/joy/exchange-quote?email=${encodeURIComponent(bio.email)}&item=${encodeURIComponent(item)}`)
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Không tải được hóa đơn.");
        setQuote(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingQuote(false));
  }, [open, bio?.email, item]);

  if (!open) return null;

  const insufficientBalance = quote && quote.balance < quote.total;

  const handleConfirm = async () => {
    setConfirming(true);
    setError("");
    try {
      const result = await onConfirm();
      onSuccess?.(result);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-background w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">receipt_long</span>
            Hóa đơn trao đổi JOY
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loadingQuote ? (
            <div className="flex justify-center py-8">
              <span className="material-symbols-outlined animate-spin text-2xl text-primary">progress_activity</span>
            </div>
          ) : quote ? (
            <>
              {/* Người trao đổi */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                {quote.trader?.avatarUrl ? (
                  <img src={quote.trader.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-base">person</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Người trao đổi</p>
                  <p className="text-xs font-bold text-foreground truncate">{quote.trader?.displayName || quote.trader?.email}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{quote.trader?.email}</p>
                </div>
              </div>

              {/* Invoice lines */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{quote.label}</span>
                  <span className="font-bold text-foreground">{quote.priceJoy} JOY</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí giao dịch (9%)</span>
                  <span className="font-bold text-foreground">{quote.tax} JOY</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border/60">
                  <span className="font-black text-foreground">Tổng cộng</span>
                  <span className="font-black text-primary">{quote.total} JOY</span>
                </div>
              </div>

              {/* Current balance */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Số dư JOY hiện tại</span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">{quote.balance} JOY</span>
              </div>

              {insufficientBalance && (
                <p className="text-xs text-destructive font-bold text-center">Số dư JOY chưa đủ để trao đổi. Hãy tích thêm JOY và thử lại.</p>
              )}
            </>
          ) : null}

          {error && <p className="text-xs text-destructive font-bold text-center">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={confirming}
              className="flex-1 py-3 rounded-xl font-bold text-xs text-muted-foreground bg-muted hover:bg-muted/70 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={loadingQuote || confirming || !quote || insufficientBalance}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-xs text-white bg-primary hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">{confirming ? "progress_activity" : "check_circle"}</span>
              {confirming ? "Đang xử lý..." : "Xác nhận"}
            </button>
          </div>
          <p className="text-[9px] text-muted-foreground text-center">JOY là đồng tích góp phi lợi nhuận — không thể nạp bằng tiền.</p>
        </div>
      </div>
    </div>
  );
}
