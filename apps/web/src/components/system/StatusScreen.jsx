import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import HugoDrop from "./HugoDrop";
import { reportClientEvent } from "../../utils/clientMonitoring";

/*
 * MỘT màn cho mọi trạng thái hệ thống, để chờ, cập nhật hay gặp lỗi đều cùng
 * một giọng và một hình — giọt nước Hugo Studio.
 *
 *   loading · reloading · updating      giọt đầy dần, không có nút
 *   offline · server                    tự thử lại (đếm ngược), có nút thử ngay
 *   notFound                            về trang chủ / quay lại
 *   crash                               mã sự cố + nút báo admin + quay lại (KHÔNG lộ chi tiết lỗi)
 *
 * Chữ có defaultValue tiếng Việt: màn chờ có thể hiện TRƯỚC khi gói dịch tải xong.
 */
const DEFAULTS = {
  loading: { title: "", body: "" },
  reloading: { title: "Đang tải lại", body: "" },
  updating: { title: "Đang cập nhật phiên bản mới", body: "Chỉ mất vài giây, dữ liệu vẫn được giữ nguyên." },
  offline: { title: "Mất kết nối mạng", body: "Kiểm tra Wi-Fi hoặc dữ liệu di động. Trang sẽ tự kết nối lại khi có mạng." },
  server: { title: "Máy chủ đang khởi động", body: "Máy chủ miễn phí tạm nghỉ khi vắng người và thường sẵn sàng sau 30–60 giây. Trang sẽ tự thử lại." },
  notFound: { title: "Không tìm thấy trang này", body: "Đường dẫn có thể đã đổi hoặc gõ chưa đúng." },
  crash: { title: "Đã xảy ra sự cố", body: "Trang này tạm thời chưa dùng được. Bạn có thể báo cho quản trị viên rồi quay lại." },
};

const BUSY = new Set(["loading", "reloading", "updating"]);
const RETRY_SECONDS = 15;

export default function StatusScreen({ kind = "loading", status, code, detail, inline = false, onRetry }) {
  const { t } = useTranslation();
  const tx = (key) => t(`system.status.${kind}.${key}`, { defaultValue: DEFAULTS[kind]?.[key] ?? "" });
  const busy = BUSY.has(kind);
  const retry = onRetry || (() => window.location.reload());

  return (
    <div className={`hs-screen ${inline ? "hs-screen--inline" : ""}`} role={busy ? "status" : "alert"} aria-live="polite" aria-busy={busy || undefined}>
      <div className="hs-panel">
        <HugoDrop mode={busy ? "fill" : "rest"} className={busy ? "h-20 w-20" : "h-24 w-24"} />
        {(status || kind === "notFound") && <p className="hs-eyebrow">{status || 404}</p>}
        {tx("title") && <h1 className="hs-title">{tx("title")}</h1>}
        {tx("body") && <p className="hs-body">{tx("body")}</p>}

        {(kind === "offline" || kind === "server") && <AutoRetry kind={kind} onRetry={retry} />}
        {kind === "notFound" && <NotFoundActions />}
        {kind === "crash" && <CrashBlock code={code} detail={detail} />}
      </div>
    </div>
  );
}

function AutoRetry({ kind, onRetry }) {
  const { t } = useTranslation();
  const [left, setLeft] = useState(RETRY_SECONDS);

  useEffect(() => {
    // Mất mạng: thử lại ĐÚNG lúc có mạng, khỏi chờ đếm ngược.
    const online = () => kind === "offline" && onRetry();
    window.addEventListener("online", online);
    const timer = window.setInterval(() => setLeft((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => { window.removeEventListener("online", online); window.clearInterval(timer); };
  }, [kind, onRetry]);

  useEffect(() => { if (left === 0) onRetry(); }, [left, onRetry]);

  return (
    <>
      <div className="hs-progress" aria-hidden="true"><span style={{ width: `${((RETRY_SECONDS - left) / RETRY_SECONDS) * 100}%` }} /></div>
      <p className="hs-caption">{t("system.status.retryIn", { seconds: left, defaultValue: "Tự thử lại sau {{seconds}} giây" })}</p>
      <div className="hs-actions">
        <button type="button" className="hs-btn hs-btn--primary" onClick={onRetry}>
          {t("system.status.retryNow", { defaultValue: "Thử lại ngay" })}
        </button>
      </div>
    </>
  );
}

function NotFoundActions() {
  const { t } = useTranslation();
  return (
    <>
      <p className="hs-code" translate="no">{window.location.pathname}</p>
      <div className="hs-actions">
        <a className="hs-btn hs-btn--primary" href="/">{t("system.status.home", { defaultValue: "Về trang chủ" })}</a>
        {window.history.length > 1 && (
          <button type="button" className="hs-btn" onClick={() => window.history.back()}>
            {t("system.status.back", { defaultValue: "Quay lại" })}
          </button>
        )}
      </div>
    </>
  );
}

// Người dùng KHÔNG thấy lỗi gì, ở đâu (đừng chỉ đường cho kẻ phá): chỉ mã sự cố,
// nút báo admin và quay lại. Chi tiết đã nằm trong ErrorLog + Telegram theo mã;
// `detail` chỉ hiện ở môi trường dev.
function CrashBlock({ code, detail }) {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const report = () => {
    reportClientEvent({ type: "user-report", name: "UserReport", message: `Người dùng bấm báo lỗi ${code || ""}`.trim(), code });
    setSent(true);
  };
  const back = () => (window.history.length > 1 ? window.history.back() : window.location.assign("/"));

  return (
    <>
      {code && <p className="hs-code" translate="no">{code}</p>}
      <div className="hs-actions">
        <button type="button" className="hs-btn hs-btn--primary" onClick={report} disabled={sent}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{sent ? "check" : "flag"}</span>
          {sent
            ? t("system.status.reportSent", { defaultValue: "Đã báo cho quản trị viên" })
            : t("system.status.reportAdmin", { defaultValue: "Báo lỗi cho admin" })}
        </button>
        <button type="button" className="hs-btn" onClick={back}>
          {t("system.status.back", { defaultValue: "Quay lại" })}
        </button>
      </div>
      {import.meta.env.DEV && detail && (
        <details className="hs-details" open>
          <summary>dev</summary>
          <dl><dt>what</dt><dd>{detail.what}</dd><dt>where</dt><dd>{detail.where}</dd><dt>when</dt><dd>{detail.when}</dd></dl>
        </details>
      )}
    </>
  );
}
