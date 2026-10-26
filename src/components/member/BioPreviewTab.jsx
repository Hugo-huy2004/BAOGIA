import { lazy, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AppFrame from "./os/AppFrame";
import LazyBoundary from "./os/LazyBoundary";
import { localeForLanguage } from "../../i18n/languages";
import { getMemberSession } from "../../services/api/core/authSession";
import "../../styles/bioStudio.css";
import { BioRow, BioSection } from "./bioEditorKit";

// Hồ sơ năng lực: từng là app "Hồ Sơ" riêng, gộp vào đây 25/10/2026.
const ProfileProofPanel = lazy(() => import("./ProfileProofPanel"));

function getBasePackageDetails(serviceLabel, t) {
  const label = serviceLabel || "Student Bio";
  if (label.toLowerCase().includes("signature")) {
    return {
      name: t("memberPortal.packages.signature.name", "Signature Portfolio"),
      color: "#6366f1",
      benefits: [
        t("memberPortal.packages.signature.benefit1"),
        t("memberPortal.packages.signature.benefit2"),
        t("memberPortal.packages.signature.benefit3"),
        t("memberPortal.packages.signature.benefit4"),
      ],
    };
  }
  if (label.toLowerCase().includes("ultimate")) {
    return {
      name: t("memberPortal.packages.ultimate.name", "Ultimate Web App"),
      color: "#ec4899",
      benefits: [
        t("memberPortal.packages.ultimate.benefit1"),
        t("memberPortal.packages.ultimate.benefit2"),
        t("memberPortal.packages.ultimate.benefit3"),
        t("memberPortal.packages.ultimate.benefit4"),
      ],
    };
  }
  if (label.toLowerCase().includes("student")) {
    return {
      name: t("memberPortal.packages.student.name", "Student Bio"),
      color: "#0071e3",
      benefits: [
        t("memberPortal.packages.student.benefit1"),
        t("memberPortal.packages.student.benefit2"),
        t("memberPortal.packages.student.benefit3"),
        t("memberPortal.packages.student.benefit4"),
      ],
    };
  }
  return {
    name: t("memberPortal.packages.free.name", "Free Bio"),
    color: "#64748b",
    benefits: [
      t("memberPortal.packages.free.benefit1"),
      t("memberPortal.packages.free.benefit2"),
      t("memberPortal.packages.free.benefit3"),
    ],
  };
}

function PackageDetailsSheet({ pkg, onClose, t }) {
  if (!pkg) return null;
  const benefits = pkg.benefits || [];
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 pb-[calc(env(safe-area-inset-bottom,0px)+5rem)] sm:pb-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm bg-white dark:bg-[#1a1924] rounded-t-[28px] sm:rounded-[28px] p-6 space-y-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: pkg.color }}>
              <span className="material-symbols-outlined text-lg">workspace_premium</span>
            </span>
            <div>
              <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{pkg.name}</h3>
              <p className="text-[13px] text-muted-foreground/70">{t("memberTabs.manage.benefitsTitle")}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-zinc-500">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
        {benefits.length > 0 ? (
          <div className="space-y-2">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex gap-2.5 items-start p-3 rounded-xl bg-muted/50 border border-border/60">
                <span className="material-symbols-outlined text-sm mt-0.5 shrink-0" style={{ color: pkg.color }}>check_circle</span>
                <p className="text-[13px] font-bold text-foreground/80 leading-relaxed">{benefit}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground italic py-2">{t("memberPortal.package.noDetails")}</p>
        )}
      </div>
    </div>
  );
}

const EDITOR_SECTIONS = Object.freeze([
  { id: "design", labelKey: "designLabel", icon: "palette" },
  { id: "links", labelKey: "linkCardsLabel", icon: "link" },
  { id: "achievements", labelKey: "achievementsLabel", icon: "workspace_premium" },
  { id: "proof", labelKey: "proofLabel", icon: "verified_user" },
]);

export default function BioPreviewTab({
  bio,
  publicLink,
  showToast,
  onBack,
  renderAccountForm,
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
  const [activePkg, setActivePkg] = useState(null);
  const basePkg = useMemo(() => getBasePackageDetails(bio?.serviceLabel, t), [bio?.serviceLabel, t]);
  const expiresLabel = bio?.expiresAt ? formatDate(new Date(bio.expiresAt)) : t("memberTabs.manage.lifetime");

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
        // Một nút: hai nút đè lên tiêu đề thu gọn khi cuộn. Mở trang đã có ở
        // dòng đường dẫn (tab Giao diện) và khung xem trước.
        <button type="button" onClick={copyLink} className="bio-studio-icon-button" aria-label={t("memberPortal.bioPreview.copyLinkAria")}>
          <span className="material-symbols-outlined" aria-hidden="true">{copied ? "check" : "content_copy"}</span>
        </button>
      ) : null}
      scrollKey={activeSection}
      wide
    >
    <div className="bio-studio">
      <div className="bio-studio-workspace">
        <main className="bio-studio-editor">
          <section className="bio-studio-editor-content" role="tabpanel">
            {activeSection === "proof" ? (
              <LazyBoundary><Suspense fallback={null}><ProfileProofPanel publicLink={publicLink} /></Suspense></LazyBoundary>
            ) : renderAccountForm?.(activeSection)}
          </section>

          {/* Gói & hạn dùng là thông tin của cả trang Bio, nhưng chỉ cần thấy một
              chỗ: tab đầu. Bản cũ lặp thẻ gói (gradient) dưới MỌI tab. */}
          {activeSection === "design" ? (
            <BioSection
              className="mt-7"
              title={t("bioStudio.design.packagesTitle", "Gói đang dùng")}
              hint={ready && session?.email ? t("memberPortal.bioPreview.daysLeft", { count: membership.remaining }) : null}
            >
              {[{ ...basePkg, _id: "base", sub: expiresLabel }, ...(bio?.packages || []).map((pkg) => ({ ...pkg, sub: formatDate(new Date(pkg.addedAt)) }))].map((pkg) => (
                <BioRow
                  key={pkg._id}
                  icon={<span className="material-symbols-outlined text-[20px]" style={{ color: pkg.color }} aria-hidden="true">workspace_premium</span>}
                  title={pkg.name}
                  detail={pkg.sub}
                  onClick={() => setActivePkg(pkg)}
                  trailing={<span className="material-symbols-outlined text-[20px] text-muted-foreground/60" aria-hidden="true">chevron_right</span>}
                />
              ))}
              {ready && session?.email ? (
                <div className="border-t border-border/50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
                    <span>{t("memberPortal.bioPreview.bioExpiry")}</span>
                    <strong className="font-semibold text-foreground">{formatDate(membership.end)}</strong>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${membership.progress}%` }} />
                  </div>
                </div>
              ) : null}
            </BioSection>
          ) : null}
          {activePkg ? <PackageDetailsSheet pkg={activePkg} onClose={() => setActivePkg(null)} t={t} /> : null}
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
