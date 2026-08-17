import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { joyText } from "../../lib/joyDisplay";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

/**
 * Hạn mức nghe HugoRadio, đo bằng TOKEN — 1 token = 10 phút.
 *
 * Bản trước bày một đồng hồ đếm ngược HH:MM:SS nhảy từng giây, tự chạy ở client
 * rồi thỉnh thoảng kéo lại cho khớp máy chủ. Nó vừa khó đọc vừa không bao giờ
 * khớp: hai nơi cùng giữ một con số (thanh trạng thái tự gọi API, hook heartbeat
 * gọi lần nữa) và bắc cầu cho nhau bằng một biến toàn cục `window`. Mua thêm
 * thời gian xong, thanh trạng thái vẫn hiện số cũ vì nó không hề biết chuyện đó.
 *
 * Giờ chỉ còn MỘT nguồn: hook `useRadioHeartbeat` giữ trạng thái, thanh hiển thị
 * là component thuần nhận `status` qua prop. Token là số nguyên, đổi mỗi 10 phút,
 * nên không cần đồng hồ chạy nền nào cả.
 */

// ── Heartbeat API ────────────────────────────────────────────────────────────

// Danh tính lấy từ cookie/JWT ở máy chủ, không truyền email lên nữa.
export async function sendRadioHeartbeat(minutes, { keepalive = false } = {}) {
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

export function useRadioHeartbeat(bio, isPlaying) {
  const [tokenStatus, setTokenStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const startedRef = useRef(0);

  const refetch = useCallback(async () => {
    // Trang công khai (UtilityPublicPage) dựng tab này không kèm hồ sơ. Không có
    // ai để hỏi hạn mức, nên phải TẮT khung chờ — bản trước để nó đập mãi mãi.
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

/** "còn 3 ngày" theo đúng ngôn ngữ đang bật — Intl lo phần số nhiều/ngữ pháp. */
function useResetIn(nextResetAt) {
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

export default function RadioTokenStatus({ status, loading = false, onBuyMore }) {
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
  // Vạch: phần token miễn phí còn lại so với hạn mức tuần. Token đã mua không
  // nằm trong vạch — nó không reset theo tuần nên gộp vào sẽ nói dối về nhịp nạp.
  const freePercent = freeTokens > 0 ? Math.round((freeTokensLeft / freeTokens) * 100) : 0;

  return (
    <div className={`rounded-2xl border bg-card p-4 flex flex-col gap-3 ${empty ? "border-destructive" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-xl text-muted-foreground">confirmation_number</span>
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
          <span className={`text-3xl font-black tabular-nums leading-none ${empty ? "text-destructive" : low ? "text-warning" : "text-foreground"}`}>
            {tokensLeft}
          </span>
          <span className="text-[13px] font-bold text-muted-foreground ml-1">
            {t("utilities.radio.token.unit")}
          </span>
        </div>
      </div>

      {/* Vạch hạn mức tuần + token đang dùng dở */}
      <div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${empty ? "bg-destructive" : low ? "bg-warning" : "bg-info"}`}
            style={{ width: `${freePercent}%` }}
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

      {/* Giờ cao điểm: một token chỉ còn nghe được 5 phút. Nói thẳng bằng phút,
          vì "x2" không cho biết người dùng mất gì. */}
      {peak && (
        <p className="flex items-start gap-2 text-[13px] text-warning">
          <span className="material-symbols-outlined text-base shrink-0">schedule</span>
          <span>{t("utilities.radio.token.peakNotice", { minutes: minutesPerToken / 2 })}</span>
        </p>
      )}

      {empty && (
        <p className="text-[13px] text-destructive">{t("utilities.radio.token.emptyDesc")}</p>
      )}
      {!empty && partialMinutes > 0 && tokensLeft === 0 && (
        <p className="text-[13px] text-warning">
          {t("utilities.radio.token.lastMinutes", { minutes: Math.ceil(partialMinutes) })}
        </p>
      )}

      {onBuyMore && (
        <button
          type="button"
          onClick={onBuyMore}
          className="h-11 rounded-xl bg-info text-info-foreground text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>{t("utilities.radio.token.buyMore")}</span>
        </button>
      )}
    </div>
  );
}

// ── Mua thêm token ───────────────────────────────────────────────────────────

/** Giá và trần đều do máy chủ công bố (`/utility-store/radio-price`) — chép hằng
    số sang client là cách chắc chắn để nút mua hiện một số còn ví bị trừ số khác. */
const PRICE_FALLBACK = { minutesPerToken: 10, joyPerToken: 200, feeRate: 0.1, maxTokens: 1008 };

export function RadioStoreModal({ bio, showToast, onClose, onPurchased }) {
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
  // Cùng công thức với calcExchangeTotal ở máy chủ: phí làm tròn XUỐNG.
  const fee = Math.floor(base * price.feeRate);
  const total = base + fee;
  const minutes = tokens * price.minutesPerToken;
  const balance = bio?.joyBalance ?? 0;
  const short = total - balance;

  const clamp = (value) => Math.min(Math.max(Math.round(value) || 1, 1), price.maxTokens);

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
      // Một lỗi 500 hay một proxy trả về HTML sẽ làm res.json() ném
      // "Unexpected token <" — người mua đọc câu đó thì chịu. Đọc text trước rồi
      // mới thử phân tích, để mọi trường hợp đều ra một câu nói được thành lời.
      const raw = await res.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch { /* không phải JSON */ }
      if (!res.ok || !data) throw new Error(data?.error || t("utilities.radio.store.genericError"));
      showToast?.(t("utilities.radio.store.success", { n: tokens }), "success");
      await onPurchased?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-label={t("utilities.radio.store.title")}
        className="bg-card border border-border w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-bold text-foreground">{t("utilities.radio.store.title")}</h3>
            <p className="text-[13px] text-muted-foreground mt-1">
              {t("utilities.radio.store.desc", { minutes: price.minutesPerToken })}
            </p>
          </div>
          <button onClick={onClose} aria-label={t("utilities.radio.store.close")}
            className="w-11 h-11 shrink-0 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Số dư hiện ngay từ đầu: trước đây người dùng chỉ biết mình thiếu tiền
            SAU khi bấm mua và máy chủ trả về lỗi. */}
        <div className="flex items-center justify-between rounded-xl bg-muted border border-border px-4 py-3">
          <span className="text-[13px] text-muted-foreground">{t("utilities.radio.store.balance")}</span>
          <span className="text-[15px] font-bold tabular-nums text-foreground">{joyText(balance)}</span>
        </div>

        {/* Chọn số token */}
        <div className="flex flex-col gap-3">
          <label htmlFor="radio-token-amount" className="text-[13px] font-bold text-muted-foreground">
            {t("utilities.radio.store.amount")}
          </label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setTokens((n) => clamp(n - 1))} aria-label={t("utilities.radio.store.decrease")}
              className="w-11 h-11 shrink-0 rounded-full border border-border bg-card text-foreground flex items-center justify-center active:scale-95 transition-transform">
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
              className="flex-1 h-11 text-center rounded-xl border border-border bg-card text-foreground text-lg font-black tabular-nums outline-none focus:border-info"
            />
            <button type="button" onClick={() => setTokens((n) => clamp(n + 1))} aria-label={t("utilities.radio.store.increase")}
              className="w-11 h-11 shrink-0 rounded-full border border-border bg-card text-foreground flex items-center justify-center active:scale-95 transition-transform">
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
          <p className="text-[13px] text-muted-foreground">
            {t("utilities.radio.store.equals", { n: tokens, minutes })}
          </p>
        </div>

        {/* Gói nhanh, ghi rõ ra giờ để khỏi phải nhẩm */}
        <div className="grid grid-cols-4 gap-2">
          {[6, 18, 36, 72].map((n) => (
            <button key={n} type="button" onClick={() => setTokens(n)}
              className={`h-11 rounded-xl border text-[13px] font-bold transition-colors ${
                tokens === n ? "border-info bg-info text-info-foreground" : "border-border bg-card text-foreground"
              }`}>
              {t("utilities.radio.store.preset", { n: n, hours: (n * price.minutesPerToken) / 60 })}
            </button>
          ))}
        </div>

        {/* Bảng giá */}
        <div className="rounded-xl border border-border bg-muted px-4 py-3 flex flex-col gap-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("utilities.radio.store.unitPrice")}</span>
            <span className="tabular-nums font-bold text-foreground">{joyText(price.joyPerToken)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("utilities.radio.store.fee", { percent: Math.round(price.feeRate * 100) })}</span>
            <span className="tabular-nums font-bold text-foreground">{joyText(fee)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-[15px]">
            <span className="font-bold text-foreground">{t("utilities.radio.store.total")}</span>
            <span className="tabular-nums font-black text-info">{joyText(total)}</span>
          </div>
        </div>

        <p className="text-[13px] text-muted-foreground">{t("utilities.radio.store.peakNotice")}</p>

        {error && <p className="text-[13px] text-destructive">{error}</p>}
        {!error && short > 0 && (
          <p className="text-[13px] text-warning">{t("utilities.radio.store.short", { amount: nf.format(short) })}</p>
        )}

        <button
          onClick={handleBuy}
          disabled={buying || short > 0}
          className="h-12 rounded-xl bg-info text-info-foreground font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition-transform"
        >
          {buying && <span className="material-symbols-outlined animate-spin text-lg">refresh</span>}
          {buying
            ? t("utilities.radio.store.buying")
            : t("utilities.radio.store.buy", { n: tokens, total: nf.format(total) })}
        </button>
      </div>
    </div>
  );
}
