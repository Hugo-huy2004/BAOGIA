import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";

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
