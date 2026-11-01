import { Component, useEffect, useState } from "react";
import { useEduText } from "./eduText";
import { playEduSound } from "./eduSound";

/**
 * Màn trạng thái của Education Hugo theo kiểu Duolingo: một nhân vật đứng trên vệt bóng,
 * tiêu đề đậm, một câu dặn xám, nút to. Đang tải thì một nhân vật cast nhún nhảy
 * kèm nốt nhạc; lỗi thì nhân vật buồn rơi nước mắt.
 *   kind: loading · error · notFound · offline
 */
const MASCOT = { error: "/edu/buddy-wrong.svg", notFound: "/edu/buddy-exam.svg", offline: "/edu/buddy-practice.svg" };
const TIPS = 4;

export default function EduStatus({ kind = "loading", code, onRetry, compact = false }) {
  const { t } = useEduText();
  // Nhân vật + mẹo chọn một lần lúc hiện, để mỗi lần tải là một bạn khác.
  const [pick] = useState(() => ({ cast: 1 + Math.floor(Math.random() * 8), tip: Math.floor(Math.random() * TIPS) }));
  useEffect(() => { if (kind !== "loading") playEduSound("thud"); }, [kind]);

  if (kind === "loading") {
    return (
      <div className={`edu-status is-loading${compact ? " is-compact" : ""}`} role="status" aria-live="polite">
        <figure className="edu-status-art">
          <span className="edu-status-notes" aria-hidden="true"><i /><i /></span>
          <img src={`/edu/cast-${pick.cast}.svg`} alt="" width="120" height="120" />
        </figure>
        <h2>{t("status.loading")}</h2>
        {!compact && <p>{t(`status.tip${pick.tip}`)}</p>}
      </div>
    );
  }

  return (
    <div className={`edu-status is-${kind}`} role="alert">
      <figure className="edu-status-art">
        <img src={MASCOT[kind]} alt="" width="150" height="150" />
        {kind === "error" && <span className="edu-status-tears" aria-hidden="true"><i /><i /></span>}
      </figure>
      <div className="edu-status-copy">
        <h2>{t(`status.${kind}Title`)}</h2>
        <p>{t(`status.${kind}Body`)}</p>
        {code && <p className="edu-status-code">{t("status.code", { code })}</p>}
        <div className="edu-status-actions">
          {onRetry && <button type="button" className="edu-status-btn" onClick={onRetry}>{t("status.retry")}</button>}
          <a href="/learn" className={`edu-status-btn${onRetry ? " is-ghost" : ""}`}>{t("status.home")}</a>
        </div>
        <p className="edu-status-brand">Education Hugo</p>
      </div>
    </div>
  );
}

/** Bắt lỗi dựng giao diện (kể cả tải mảnh code hỏng sau khi deploy) → màn lỗi có nhân vật. */
export class EduErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error("[edu]", error); }
  render() {
    if (!this.state.error) return this.props.children;
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    // Mã ngắn để người học báo lại cho hỗ trợ.
    const code = offline ? null : `ED-${Date.now().toString(36).slice(-6).toUpperCase()}`;
    return <EduStatus kind={offline ? "offline" : "error"} code={code} onRetry={() => window.location.reload()} />;
  }
}
