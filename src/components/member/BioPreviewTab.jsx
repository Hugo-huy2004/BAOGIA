import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMemberSession } from "../../services/authSession";
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
}) {
  const { t, i18n } = useTranslation();
  const ready = Boolean(publicLink);
  const session = getMemberSession();
  const [activeSection, setActiveSection] = useState("design");

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
    const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";
    const formatter = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return (date) => formatter.format(date);
  }, [i18n.resolvedLanguage]);

  const copyLink = async () => {
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(publicLink);
      showToast?.(t("memberPortal.bioPreview.copySuccess"), "success");
    } catch {
      showToast?.(t("memberPortal.bioPreview.copyError"), "error");
    }
  };

  return (
    <div className="bio-studio animate-fadeIn">
      <header className="bio-studio-navbar">
        <button type="button" onClick={onBack} className="bio-studio-icon-button" aria-label={t("memberPortal.bioPreview.backAria")}>
          <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
        </button>

        {/* Tên trang + đường dẫn + trạng thái gộp vào một dòng. Trước đây phần
            này là một thẻ riêng ngay dưới thanh điều hướng, lặp lại y hệt. */}
        <div className="bio-studio-navbar-copy">
          <span>
            <strong>{bio?.displayName || session?.displayName || t("memberPortal.bioPreview.studioTitle")}</strong>
            <small>
              <span className={`bio-studio-dot ${ready ? "is-live" : ""}`} aria-hidden="true" />
              {ready ? publicLink.replace(/^https?:\/\//, "") : t("memberPortal.bioPreview.notReadyTitle")}
            </small>
          </span>
        </div>

        <div className="bio-studio-navbar-actions">
          {ready ? (
            <>
              <button type="button" onClick={copyLink} className="bio-studio-icon-button" aria-label={t("memberPortal.bioPreview.copyLinkAria")}>
                <span className="material-symbols-outlined" aria-hidden="true">content_copy</span>
              </button>
              <a href={publicLink} target="_blank" rel="noreferrer" className="bio-studio-open-button" aria-label={t("memberPortal.bioPreview.openAria")}>
                <span>{t("memberPortal.bioPreview.open")}</span>
                <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span>
              </a>
            </>
          ) : null}
        </div>
      </header>

      <div className="bio-studio-workspace">
        <main className="bio-studio-editor">
          <div className="bio-studio-segmented" role="tablist" aria-label={t("memberPortal.bioPreview.customizeTitle")}>
            {EDITOR_SECTIONS.map((section) => {
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={active ? "is-active" : ""}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">{section.icon}</span>
                  <span>{t(`memberPortal.bioPreview.${section.labelKey}`)}</span>
                </button>
              );
            })}
          </div>

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
  );
}
