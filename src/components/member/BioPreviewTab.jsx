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

        <div className="bio-studio-navbar-copy">
          <span className="bio-studio-app-icon" aria-hidden="true">
            <span className="material-symbols-outlined">badge</span>
          </span>
          <span>
            <strong>{t("memberPortal.bioPreview.studioTitle")}</strong>
            <small>{t("memberPortal.bioPreview.subtitle")}</small>
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

      <section className="bio-studio-overview">
        <div className="bio-studio-overview-main">
          <span className="bio-studio-page-mark" aria-hidden="true">
            <span className="material-symbols-outlined">person</span>
          </span>
          <div className="min-w-0">
            <p>{t("memberPortal.bioPreview.pageEyebrow")}</p>
            <h1>{bio?.displayName || session?.displayName || t("memberPortal.navigation.memberFallback")}</h1>
            <span>{ready ? publicLink : t("memberPortal.bioPreview.notReadyTitle")}</span>
          </div>
        </div>

        <div className={`bio-studio-status ${ready ? "is-live" : ""}`}>
          <span aria-hidden="true" />
          {ready ? t("memberPortal.bioPreview.live") : t("memberPortal.bioPreview.draft")}
        </div>
      </section>

      <div className="bio-studio-workspace">
        <main className="bio-studio-editor">
          <div className="bio-studio-section-heading">
            <div>
              <p>{t("memberPortal.bioPreview.customizeTitle")}</p>
              <h2>{t("memberPortal.bioPreview.editorTitle")}</h2>
            </div>
            {handleSave ? (
              <button type="button" onClick={handleSave} className="bio-studio-save-button">
                <span className="material-symbols-outlined" aria-hidden="true">check</span>
                {t("memberPortal.bio.saveChanges")}
              </button>
            ) : null}
          </div>

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

          {ready && session?.email ? (
            <section className="bio-studio-membership">
              <div className="bio-studio-membership-heading">
                <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
                <span>
                  <strong>{t("memberPortal.bioPreview.membershipHeader")}</strong>
                  <small>{t("memberPortal.bioPreview.packageName")}</small>
                </span>
              </div>
              <dl>
                <div>
                  <dt>{t("memberPortal.bioPreview.startDate")}</dt>
                  <dd>{formatDate(membership.start)}</dd>
                </div>
                <div>
                  <dt>{t("memberPortal.bioPreview.bioExpiry")}</dt>
                  <dd>{formatDate(membership.end)}</dd>
                </div>
              </dl>
              <div className="bio-studio-progress" aria-label={t("memberPortal.bioPreview.daysElapsed", {
                elapsed: membership.elapsed,
                total: membership.total,
              })}>
                <span style={{ width: `${membership.progress}%` }} />
              </div>
              <p>
                <span>{t("memberPortal.bioPreview.daysElapsed", { elapsed: membership.elapsed, total: membership.total })}</span>
                <span>{t("memberPortal.bioPreview.daysLeft", { count: membership.remaining })}</span>
              </p>
            </section>
          ) : null}
        </main>

        <aside className="bio-studio-preview">
          <div className="bio-studio-preview-heading">
            <div>
              <p>{t("memberPortal.bioPreview.previewLabel")}</p>
              <h2>{t("memberPortal.bioPreview.previewTitle")}</h2>
            </div>
            {ready ? <span className="bio-studio-live-dot">{t("memberPortal.bioPreview.live")}</span> : null}
          </div>

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
        </aside>
      </div>
    </div>
  );
}
