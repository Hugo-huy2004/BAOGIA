import React, { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function formatMinutes(totalMinutes) {
  // Giờ nghe giờ được tính theo phút lẻ, nên phải làm tròn trước khi chia —
  // không thì ra "4:59.60000000001".
  const total = Math.max(0, Math.round(totalMinutes || 0));
  if (total <= 0) return "0:00";
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}:${m < 10 ? "0" : ""}${m}`;
}

/**
 * Báo với máy chủ số phút vừa nghe để trừ vào hạn mức 5 giờ/tuần.
 *
 * `keepalive` cho lượt cuối lúc đóng app/tắt đài: trình duyệt vẫn gửi nốt
 * request sau khi trang đã bị huỷ, nếu không thì quãng nghe cuối cùng mất trắng.
 */
export async function sendRadioHeartbeat(email, minutes, { keepalive = false } = {}) {
  if (!email || !(minutes > 0)) return null;
  try {
    const res = await fetch(`${API_BASE}/radio/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive,
      body: JSON.stringify({ email, listeningMinutes: Number(minutes.toFixed(2)) }),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export default function RadioTokenStatus({ bio, onBuyMore }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!bio?.email) return;
    try {
      const res = await fetch(`${API_BASE}/radio/token-status?email=${encodeURIComponent(bio.email)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {}
    setLoading(false);
  }, [bio?.email]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading || !status) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-[#0e0f17]/90 border border-zinc-200/80 dark:border-white/10 animate-pulse">
        <div className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <div className="h-2.5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  const { freeRemaining, freeUsed, freeMinutes, purchasedMinutes, canListen } = status;
  const freePercent = freeMinutes > 0 ? Math.round((freeRemaining / freeMinutes) * 100) : 0;
  const isLow = freeRemaining <= 30 && freeRemaining > 0;
  const isEmpty = !canListen;

  return (
    <div className={`flex flex-col gap-2.5 px-4 py-3 rounded-2xl border backdrop-blur-xl transition-all ${
      isEmpty
        ? "bg-rose-500/10 dark:bg-rose-500/15 border-rose-400/40 text-rose-600 dark:text-rose-400"
        : isLow
          ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-400/40 text-amber-700 dark:text-amber-400"
          : "bg-zinc-100 dark:bg-[#0e0f17]/90 border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white"
    }`}>
      {/* Free pool */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isEmpty ? "bg-rose-500" : isLow ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
          <span className="text-[11px] font-black tracking-wide uppercase">
            {isEmpty ? "Hết thời gian" : "Tuần này"}
          </span>
        </div>
        <span className="font-mono text-sm font-black">
          {formatMinutes(freeRemaining)}
          <span className="text-[10px] font-bold opacity-50"> / {formatMinutes(freeMinutes)}</span>
        </span>
      </div>

      {/* Free pool progress bar */}
      <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isEmpty ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${freePercent}%` }}
        />
      </div>

      {/* Purchased pool */}
      {purchasedMinutes > 0 && (
        <div className="flex items-center justify-between pt-1 border-t border-zinc-200/50 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px] opacity-60">shopping_bag</span>
            <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Mua thêm</span>
          </div>
          <span className="font-mono text-xs font-bold">
            {formatMinutes(purchasedMinutes)}
          </span>
        </div>
      )}

      {/* Buy more button */}
      {onBuyMore && (
        <button
          onClick={onBuyMore}
          className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#06b6d4]/10 dark:bg-[#06b6d4]/20 text-[#06b6d4] text-[10px] font-black uppercase tracking-wider hover:bg-[#06b6d4]/20 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[14px]">add_shopping_cart</span>
          <span>Mua thêm thời gian</span>
        </button>
      )}
    </div>
  );
}

// Heartbeat hook — sends periodic time deductions while radio is playing.
export function useRadioHeartbeat(bio, isPlaying) {
  const [tokenStatus, setTokenStatus] = useState(null);
  const intervalRef = React.useRef(null);

  const fetchStatus = useCallback(async () => {
    if (!bio?.email) return null;
    try {
      const res = await fetch(`${API_BASE}/radio/token-status?email=${encodeURIComponent(bio.email)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTokenStatus(data);
        return data;
      }
    } catch {}
    return null;
  }, [bio?.email]);

  // Trừ ĐÚNG số phút đã nghe.
  //
  // Trước đây cứ bấm phát là trừ ngay 5 phút rồi mỗi 5 phút trừ thêm 5: nghe 30
  // giây mất 5 phút, mà nghe 6 phút rồi tắt thì phút lẻ cuối lại không bị trừ.
  // Giờ đo bằng đồng hồ: cứ 5 phút gửi phần đã trôi qua, và gửi nốt phần dở khi
  // dừng, rời trang hoặc đóng app.
  const startedRef = React.useRef(0);

  const flush = useCallback(async ({ final = false } = {}) => {
    if (!startedRef.current) return null;
    const minutes = (Date.now() - startedRef.current) / 60000;
    startedRef.current = final ? 0 : Date.now();
    const data = await sendRadioHeartbeat(bio?.email, minutes, { keepalive: final });
    if (data) setTokenStatus(data);
    return data;
  }, [bio?.email]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    startedRef.current = Date.now();
    intervalRef.current = setInterval(() => flush(), 5 * 60 * 1000);

    // Ẩn app hoặc đóng hẳn: chốt sổ quãng vừa nghe ngay, vì lúc đó timer có thể
    // bị hệ điều hành treo. Mở lại thì tính tiếp từ thời điểm đó.
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

  // Initial fetch on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { tokenStatus, refetch: fetchStatus, flush };
}
