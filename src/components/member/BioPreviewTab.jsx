import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AppFrame from "./os/AppFrame";
import { localeForLanguage } from "../../i18n/languages";
import { getMemberSession } from "../../services/api/core/authSession";
import "../../styles/bioStudio.css";

const EDITOR_SECTIONS = Object.freeze([
  { id: "design", labelKey: "designLabel", icon: "palette" },
  { id: "links", labelKey: "linkCardsLabel", icon: "link" },
  { id: "achievements", labelKey: "achievementsLabel", icon: "workspace_premium" },
]);

export default function BioPreviewTab({
  bio,
  publicLink,
  showToast,
  onBack,
  renderAccountForm,
  handleSave,
  route,
  onRouteChange,
}) {
  const { t, i18n } = useTranslation();
  const ready = Boolean(publicLink);
  const session = getMemberSession();
  // Mục đang mở đọc từ URL (/member/utilities/bio/<mục>) chứ không giữ trong
  // state: tải lại trang hay dán link đều về đúng mục. Mục lạ rơi về "design".
  const routed = typeof onRouteChange === "function";
  const [localSection, setLocalSection] = useState("design");
  const rawSection = routed ? route : localSection;
  const activeSection = EDITOR_SECTIONS.some((x) => x.id === rawSection) ? rawSection : "design";
  const setActiveSection = (id) => (routed ? onRouteChange(id) : setLocalSection(id));

  const membership = useMemo(() => {
    const now = new Date();
    const start = bio?.createdAt ? new Date(bio.createdAt) : now;
    const serverExpiry = bio?.bioExpiresAt || bio?.membershipEndDate;
    const end = serverExpiry
      ? new Date(serverExpiry)
      : new Date(start.getTime() + 3 * 365 * 24 * 60 * 60 * 1000);
    const total = Math.max(1, Math.ceil((end - start) / 86_400_000));
    const elapsed = Math.max(0, Math.ceil((now - start) / 86_400_000));
    return {
      start,
      end,
      total,
      elapsed: Math.min(total, elapsed),
      remaining: Math.max(0, Math.ceil((end - now) / 86_400_000)),
      progress: Math.min(100, (elapsed / total) * 100),
    };
  }, [bio?.bioExpiresAt, bio?.createdAt, bio?.membershipEndDate]);

  const formatDate = useMemo(() => {
    const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
    const formatter = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return (date) => formatter.format(date);
  }, [i18n.language, i18n.resolvedLanguage]);

  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast?.(t("memberPortal.bioPreview.copySuccess"), "success");
    } catch {
      showToast?.(t("memberPortal.bioPreview.copyError"), "error");
    }
  };

  const linkLabel = ready ? publicLink.replace(/^https?:\/\//, "") : t("memberPortal.bioPreview.notReadyTitle");

  return (
    /*
     * Chuyển sang khung chung `AppFrame` (20/09/2026).
     *
     * Trước đây app này có HAI chrome hiện cùng một thông tin: header
     * `hidden md:flex` cho desktop và thanh cố định dưới đáy cho điện thoại —
     * cả hai đều là tên trang + đường dẫn + nút chép/mở. Cộng thêm một dải
     * segmented tự dựng cho 3 mục. Nay: tên và đường dẫn vào tiêu đề/phụ đề,
     * nút chép/mở vào khe `actions`, 3 mục thành `tabs` của khung (desktop ra
     * dải phân đoạn, điện thoại ra thanh tab dưới).
     *
     * Header cũ còn dùng `mr-10` đoán tay để né nút X — nay khung tự chừa theo
     * CLOSE_BUTTON_RESERVE nên không còn con số rời rạc nào.
     */
    <AppFrame
      appId="bio"
      subtitle={linkLabel}
      largeTitle
      onBack={onBack}
      tabs={EDITOR_SECTIONS.map((section) => ({
        id: section.id,
        icon: section.icon,
        label: t(`memberPortal.bioPreview.${section.labelKey}`),
      }))}
      tab={activeSection}
      onTabChange={setActiveSection}
      actions={ready ? (
        <span className="flex items-center gap-1">
          <button type="button" onClick={copyLink} className="bio-studio-icon-button" aria-label={t("memberPortal.bioPreview.copyLinkAria")}>
            <span className="material-symbols-outlined" aria-hidden="true">{copied ? "check" : "content_copy"}</span>
          </button>
          <a href={publicLink} target="_blank" rel="noreferrer" className="bio-studio-icon-button" aria-label={t("memberPortal.bioPreview.openAria")}>
            <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span>
          </a>
        </span>
      ) : null}
      scrollKey={activeSection}
      wide
    >
    <div className="bio-studio">
      <div className="bio-studio-workspace">
        <main className="bio-studio-editor">
          <section className="bio-studio-editor-content" role="tabpanel">
            {renderAccountForm?.(activeSection)}
          </section>

          {handleSave ? (
            <button type="button" onClick={handleSave} className="bio-studio-save-button">
              <span className="material-symbols-outlined" aria-hidden="true">check</span>
              {t("memberPortal.bio.saveChanges")}
            </button>
          ) : null}

          {ready && session?.email ? (
            <section className="bio-studio-lifeline" aria-label={t("memberPortal.bioPreview.membershipHeader")}>
              <div className="bio-studio-lifeline-row">
                <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
                <span className="bio-studio-lifeline-text">
                  {t("memberPortal.bioPreview.bioExpiry")}: <strong>{formatDate(membership.end)}</strong>
                </span>
                <span className="bio-studio-lifeline-left">
                  {t("memberPortal.bioPreview.daysLeft", { count: membership.remaining })}
                </span>
              </div>
              <div className="bio-studio-progress">
                <span style={{ width: `${membership.progress}%` }} />
              </div>
            </section>
          ) : null}
        </main>

        {/* Trên điện thoại, khung xem trước là mục gập lại: mở trang thật chỉ
            một chạm, không cần thẻ iframe cao gần hết màn hình lúc nào cũng bày. */}
        <details className="bio-studio-preview" open={typeof window !== "undefined" && window.innerWidth >= 980}>
          <summary className="bio-studio-preview-heading">
            <span>{t("memberPortal.bioPreview.previewTitle")}</span>
            {ready ? <span className="bio-studio-live-dot">{t("memberPortal.bioPreview.live")}</span> : null}
            <span className="material-symbols-outlined bio-studio-preview-caret" aria-hidden="true">expand_more</span>
          </summary>

          {ready ? (
            <div className="bio-studio-device">
              <div className="bio-studio-device-toolbar">
                <span className="material-symbols-outlined" aria-hidden="true">lock</span>
                <span>{publicLink.replace(/^https?:\/\//, "")}</span>
                <button type="button" onClick={copyLink} aria-label={t("memberPortal.bioPreview.copyLinkAria")}>
                  <span className="material-symbols-outlined" aria-hidden="true">ios_share</span>
                </button>
              </div>
              <iframe
                key={bio?.updatedAt || publicLink}
                src={publicLink}
                title={t("memberPortal.bioPreview.previewAria")}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="bio-studio-empty">
              <span className="material-symbols-outlined" aria-hidden="true">person_add</span>
              <strong>{t("memberPortal.bioPreview.notReadyTitle")}</strong>
              <p>{t("memberPortal.bioPreview.notReadyDesc")}</p>
            </div>
          )}
        </details>
      </div>

    </div>
    </AppFrame>
  );
}
