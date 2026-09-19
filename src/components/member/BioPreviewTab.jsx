import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { localeForLanguage } from "../../i18n/languages";
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

  return (
    <div className="bio-studio md:animate-fadeIn h-full flex flex-col md:block md:h-auto overflow-hidden md:overflow-visible">
      {/* ── 1. HEADER CHỈ CHO DESKTOP (md:flex, giữ nguyên 100% desktop) ── */}
      <header className="bio-studio-navbar hidden md:flex">
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

        <div className="bio-studio-navbar-actions mr-10">
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



      <div className="bio-studio-workspace flex-1 min-h-0 overflow-y-auto md:overflow-visible md:h-auto pb-28 md:pb-0 px-3 md:px-0">
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

      {/* ── 3. MOBILE INTEGRATED BOTTOM BAR (CHỈ HIỂN THỊ TRÊN MOBILE) ── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-2xl border-t border-border/60 shadow-2xl transition-all"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}
      >
        <div className="px-4 pt-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${ready ? "bg-emerald-500 shadow-xs shadow-emerald-500/50" : "bg-zinc-400"}`} />
              <strong className="text-[13px] font-bold text-foreground truncate block leading-tight">
                {bio?.displayName || session?.displayName || t("memberPortal.bioPreview.studioTitle")}
              </strong>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5 leading-none">
              {ready ? publicLink.replace(/^https?:\/\//, "") : t("memberPortal.bioPreview.notReadyTitle")}
            </p>
          </div>

          {ready && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={copyLink}
                className="h-9 w-9 rounded-xl border border-border/80 bg-background/80 hover:bg-muted active:scale-90 flex items-center justify-center text-foreground transition-all shadow-xs"
                aria-label={t("memberPortal.bioPreview.copyLinkAria")}
                title={t("memberPortal.bioPreview.copyLinkAria")}
              >
                {copied ? (
                  <span className="material-symbols-outlined text-[18px] text-emerald-500 font-bold">check</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                )}
              </button>

              <a
                href={publicLink}
                target="_blank"
                rel="noreferrer"
                className="h-9 px-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-primary/25 hover:opacity-95 active:scale-95 transition-all"
                aria-label={t("memberPortal.bioPreview.openAria")}
              >
                <span>{t("memberPortal.bioPreview.open", "Mở trang")}</span>
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
