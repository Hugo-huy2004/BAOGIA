import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import HugoDrop from "./HugoDrop";

/*
 * MỘT màn cho mọi trạng thái hệ thống, để chờ, cập nhật hay gặp lỗi đều cùng
 * một giọng và một hình — giọt nước Hugo Studio.
 *
 *   loading · reloading · updating      giọt đầy dần, không có nút
 *   offline · server                    tự thử lại (đếm ngược), có nút thử ngay
 *   notFound                            về trang chủ / quay lại
 *   crash                               mã sự cố + đã tự gửi cho kỹ thuật + chi tiết
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
  crash: { title: "Đã xảy ra sự cố", body: "Chi tiết lỗi đã được tự động gửi cho đội kỹ thuật. Tải lại thường sẽ khắc phục được." },
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
        {kind === "crash" && <CrashBlock code={code} detail={detail} onRetry={retry} />}
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

function CrashBlock({ code, detail, onRetry }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code).then(() => setCopied(true)).catch(() => {});
  };

  return (
    <>
      {code && (
        <button type="button" className="hs-code" onClick={copy} aria-label={t("system.status.copyCode", { defaultValue: "Chép mã sự cố" })}>
          <span translate="no">{code}</span>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{copied ? "check" : "content_copy"}</span>
        </button>
      )}
      <p className="hs-note">
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">send</span>
        {t("system.status.reported", { defaultValue: "Đã gửi báo cáo cho đội kỹ thuật. Khi cần hỗ trợ, chỉ cần đọc mã này." })}
      </p>
      <div className="hs-actions">
        <button type="button" className="hs-btn hs-btn--primary" onClick={onRetry}>
          {t("system.status.reload", { defaultValue: "Tải lại" })}
        </button>
        <a className="hs-btn" href="/">{t("system.status.home", { defaultValue: "Về trang chủ" })}</a>
      </div>
      {detail && (
        <details className="hs-details">
          <summary>{t("system.status.details", { defaultValue: "Chi tiết kỹ thuật" })}</summary>
          <dl>
            <dt>{t("system.status.what", { defaultValue: "Lỗi" })}</dt><dd>{detail.what}</dd>
            <dt>{t("system.status.where", { defaultValue: "Vị trí" })}</dt><dd>{detail.where}</dd>
            <dt>{t("system.status.when", { defaultValue: "Thời điểm" })}</dt><dd>{detail.when}</dd>
          </dl>
        </details>
      )}
    </>
  );
}
