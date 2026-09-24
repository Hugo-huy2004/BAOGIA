import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AppFrame from "./os/AppFrame";
import { localeForLanguage } from "../../i18n/languages";
import { getMemberSession } from "../../services/api/core/authSession";
import "../../styles/bioStudio.css";

// Darkens a #rrggbb color by a percentage — used to build a two-tone gradient
// for the membership-card look from a single package accent color.
// Chuyển từ MemberManageTab.jsx (2026-09-24): gói đang sở hữu là thông tin của
// TRANG BIO, nên nó thuộc về màn cài đặt Bio này, không phải một hộp thoại
// riêng mở từ Cài đặt tài khoản chung.
function shadeColor(hex, percent) {
  if (!hex) return "#000000";
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

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

// Thẻ hội viên — mô phỏng một thẻ vật lý (chip, hàng thương hiệu, tên nổi,
// ngày hiệu lực) thay vì một dòng cài đặt phẳng.
function PackageCard({ name, duration, durationUnit, color, startLabel, expiresLabel, isBasePackage = false, t, onOpenDetails }) {
  const durationLabel = expiresLabel || `+${duration} ${durationUnit === "days" ? t("memberPortal.package.days", "Ngày") : durationUnit === "years" ? t("memberPortal.package.years", "Năm") : t("memberPortal.package.months", "Tháng")}`;
  const dark = shadeColor(color, -40);

  return (
    <button
      type="button"
      onClick={onOpenDetails}
      className="relative w-full h-[140px] sm:h-[150px] rounded-[24px] p-5 text-left overflow-hidden shadow-sm border border-black/5 transition-transform duration-300 hover:-translate-y-1 active:scale-[0.98]"
      style={{ background: `linear-gradient(135deg, ${color} 0%, ${dark} 100%)` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      <span className="material-symbols-outlined absolute -right-3 -bottom-5 text-white/10 pointer-events-none" style={{ fontSize: 110 }}>style</span>
      <div className="relative z-10 h-full flex flex-col justify-between text-white">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-80 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {isBasePackage ? t("memberPortal.package.base", "GÓI CƠ BẢN") : t("memberPortal.package.promo", "GÓI ƯU ĐÃI")}
            </span>
            <h3 className="text-lg font-black tracking-tight uppercase leading-none drop-shadow-sm mt-1">{name}</h3>
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/20 shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[15px]">workspace_premium</span>
          </div>
        </div>
        <div className="flex items-end justify-between mt-2">
          <div>
            <span className="block text-[8px] font-bold uppercase tracking-widest opacity-75">{t("memberPortal.package.startDate", "Ngày bắt đầu")}</span>
            <span className="text-[12px] font-mono font-bold tracking-wide">{startLabel}</span>
          </div>
          <div className="text-right">
            <span className="block text-[8px] font-bold uppercase tracking-widest opacity-75">{expiresLabel ? t("memberPortal.package.bioDuration", "Hạn dùng") : t("memberPortal.package.addedDuration", "Thời hạn")}</span>
            <span className="text-[12px] font-mono font-bold tracking-wide">{durationLabel}</span>
          </div>
        </div>
      </div>
    </button>
  );
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
              <p className="text-[9px] text-muted-foreground/70">{t("memberTabs.manage.benefitsTitle")}</p>
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
                <span className="material-symbols-outlined text-xs mt-0.5 shrink-0" style={{ color: pkg.color }}>check_circle</span>
                <p className="text-[11px] font-bold text-foreground/80 leading-relaxed">{benefit}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground italic py-2">{t("memberPortal.package.noDetails")}</p>
        )}
      </div>
    </div>
  );
}

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
  const [activePkg, setActivePkg] = useState(null);
  const basePkg = useMemo(() => getBasePackageDetails(bio?.serviceLabel, t), [bio?.serviceLabel, t]);
  const startLabel = formatDate(bio?.createdAt ? new Date(bio.createdAt) : new Date(2026, 4, 15));
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

          {/* Gói đang sở hữu — chuyển từ hộp thoại "Quản lý hồ sơ" trong Cài đặt
              tài khoản (2026-09-24): đây là thông tin của trang Bio, nên nó
              thuộc về màn cài đặt Bio, khách không phải mở một hộp thoại khác
              để xem gói mình đang dùng cho chính trang này. */}
          <section aria-label={t("memberTabs.manage.ownedPackagesTitle")} className="space-y-3">
            <div className="space-y-1 text-left">
              <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary" aria-hidden="true">wallet</span>
                {t("memberTabs.manage.ownedPackagesTitle")}
              </h2>
              <p className="text-[10px] text-muted-foreground/70">{t("memberTabs.manage.ownedPackagesDesc")}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PackageCard
                t={t}
                name={basePkg.name}
                duration={12}
                durationUnit="months"
                benefits={basePkg.benefits}
                color={basePkg.color}
                startLabel={startLabel}
                expiresLabel={expiresLabel}
                isBasePackage
                onOpenDetails={() => setActivePkg({ name: basePkg.name, color: basePkg.color, benefits: basePkg.benefits })}
              />
              {bio?.packages?.map((pkg) => (
                <PackageCard
                  t={t}
                  key={pkg._id}
                  name={pkg.name}
                  duration={pkg.duration}
                  durationUnit={pkg.durationUnit}
                  benefits={pkg.benefits}
                  color={pkg.color}
                  startLabel={formatDate(new Date(pkg.addedAt))}
                  onOpenDetails={() => setActivePkg(pkg)}
                />
              ))}
            </div>
          </section>
          {activePkg ? <PackageDetailsSheet pkg={activePkg} onClose={() => setActivePkg(null)} t={t} /> : null}

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
