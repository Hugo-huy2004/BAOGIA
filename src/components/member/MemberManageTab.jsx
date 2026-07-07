import { withTranslation } from "react-i18next";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Darkens a #rrggbb color by a percentage — used to build a two-tone gradient
// for the membership-card look from a single package accent color.
function shadeColor(hex, percent) {
  if (!hex) return "#000000";
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

const getBasePackageDetails = (serviceLabel, t) => {
  const label = serviceLabel || "Student Bio";
  if (label.toLowerCase().includes("signature")) {
    return {
      name: t("memberPortal.packages.signature.name", "Signature Portfolio"),
      color: "#6366f1",
      benefits: [
        t("memberPortal.packages.signature.benefit1"),
        t("memberPortal.packages.signature.benefit2"),
        t("memberPortal.packages.signature.benefit3"),
        t("memberPortal.packages.signature.benefit4")
      ]
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
        t("memberPortal.packages.ultimate.benefit4")
      ]
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
        t("memberPortal.packages.student.benefit4")
      ]
    };
  }
  return {
    name: t("memberPortal.packages.free.name", "Free Bio"),
    color: "#64748b",
    benefits: [
      t("memberPortal.packages.free.benefit1"),
      t("memberPortal.packages.free.benefit2"),
      t("memberPortal.packages.free.benefit3")
    ]
  };
};

// Membership-card visual — modeled after a physical card (chip, brand row,
// embossed name, validity dates) instead of a list row, since the previous
// flat/expandable rows still read as "just another settings list." Tapping
// opens a bottom sheet with the full benefits instead of expanding in place,
// which only worked when cards were stacked vertically.
function PackageCard({ name, duration, durationUnit, benefits, color, startLabel, expiresLabel, isBasePackage = false, t, onOpenDetails }) {
  const durationLabel = expiresLabel || `+${duration} ${durationUnit === "days" ? t("memberPortal.package.days", "Ngày") : durationUnit === "years" ? t("memberPortal.package.years", "Năm") : t("memberPortal.package.months", "Tháng")}`;
  const dark = shadeColor(color, -40);

  return (
    <button
      type="button"
      onClick={onOpenDetails}
      className="relative w-full h-[140px] sm:h-[150px] rounded-[24px] p-5 text-left overflow-hidden shadow-sm border border-black/5 transition-transform duration-300 hover:-translate-y-1 active:scale-[0.98]"
      style={{ background: `linear-gradient(135deg, ${color} 0%, ${dark} 100%)` }}
    >
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      
      {/* Embossed watermark icon */}
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
  const formattedBenefits = pkg.benefits || [];
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 pb-[calc(env(safe-area-inset-bottom,0px)+5rem)] sm:pb-4"
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
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

          {formattedBenefits.length > 0 ? (
            <div className="space-y-2">
              {formattedBenefits.map((benefit, i) => (
                <div key={i} className="flex gap-2.5 items-start p-3 rounded-xl bg-muted/50 border border-border/60">
                  <span className="material-symbols-outlined text-xs mt-0.5 shrink-0" style={{ color: pkg.color }}>check_circle</span>
                  <p className="text-[11px] font-bold text-foreground/80 leading-relaxed">{benefit}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground italic py-2">{t("memberPortal.package.noDetails")}</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function MemberManageTab({ bio, publicLink, handleCopyLink, handleDeleteBio, saving, t, i18n }) {
  const [copied, setCopied] = useState(false);
  const [activePkg, setActivePkg] = useState(null);

  const onCopy = () => {
    handleCopyLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isEn = i18n?.language?.startsWith('en');
  const dateLocale = isEn ? 'en-US' : 'vi-VN';

  const basePkg = getBasePackageDetails(bio?.serviceLabel, t);
  const startLabel = bio?.createdAt ? new Date(bio.createdAt).toLocaleDateString(dateLocale) : (isEn ? '05/15/2026' : '15/05/2026');
  const expiresLabel = bio?.expiresAt ? new Date(bio.expiresAt).toLocaleDateString(dateLocale) : t("memberTabs.manage.lifetime", "Lifetime (Vĩnh viễn)");

  return (
    <div className="max-w-xl mx-auto space-y-6 px-3 sm:px-0 animate-fadeIn">
      {/* Header */}
      <div className="space-y-1 text-left">
        <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-primary">wallet</span>{t("memberTabs.manage.ownedPackagesTitle")}</h2>
        <p className="text-[10px] text-muted-foreground/70">{t("memberTabs.manage.ownedPackagesDesc")}</p>
      </div>

      {/* Membership-card grid — use a vertical list/grid instead of horizontal scroll to avoid "cut in half" peek on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PackageCard t={t}
          name={basePkg.name}
          duration={12}
          durationUnit="months"
          benefits={basePkg.benefits}
          color={basePkg.color}
          startLabel={startLabel}
          expiresLabel={expiresLabel}
          isBasePackage={true}
          onOpenDetails={() => setActivePkg({ name: basePkg.name, color: basePkg.color, benefits: basePkg.benefits })}
        />

        {bio?.packages && bio.packages.map((pkg) => (
          <PackageCard t={t}
            key={pkg._id}
            name={pkg.name}
            duration={pkg.duration}
            durationUnit={pkg.durationUnit}
            benefits={pkg.benefits}
            color={pkg.color}
            startLabel={new Date(pkg.addedAt).toLocaleDateString(dateLocale)}
            isBasePackage={false}
            onOpenDetails={() => setActivePkg(pkg)}
          />
        ))}
      </div>

      <PackageDetailsSheet pkg={activePkg} onClose={() => setActivePkg(null)} t={t} />

      {/* Public Link Card */}
      <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl rounded-2xl border border-border/50 shadow-sm p-6 space-y-4">
        <div className="space-y-1 text-left">
          <h4 className="text-[11px] font-black text-foreground uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">link</span>
            {t("memberTabs.manage.publicLinkTitle")}
          </h4>
          <p className="text-[9.5px] text-muted-foreground/70">{t("memberTabs.manage.publicLinkDesc")}</p>
        </div>

        {bio?.slug ? (
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-muted/80 border border-border/60 font-mono text-[10px] sm:text-xs text-foreground/80 font-bold select-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <span className="material-symbols-outlined text-xs text-success shrink-0">lock</span>
              <span className="flex-1 overflow-x-auto scrollbar-hide whitespace-nowrap text-left">{publicLink}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={publicLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-foreground text-background hover:opacity-90 active:scale-95 font-bold py-2.5 rounded-xl transition-all text-center text-[10px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-xs">open_in_new</span>
                {t("memberTabs.manage.viewLiveBtn")}
              </a>
              <button
                type="button"
                onClick={onCopy}
                className="bg-zinc-100 hover:bg-muted/60 dark:hover:bg-zinc-900/80 text-foreground font-bold py-2.5 rounded-xl transition-all text-[10px] uppercase tracking-wider border border-border/60 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span className="material-symbols-outlined text-xs">
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? t("memberTabs.manage.copied") : t("memberTabs.manage.copyLink")}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-border rounded-xl">
            <span className="material-symbols-outlined text-2xl text-muted-foreground/70">link_off</span>
            <p className="text-[10px] italic text-zinc-400 mt-2">{t("memberTabs.manage.notActivatedDesc")}</p>
          </div>
        )}
      </div>

      {/* Warning Danger Zone */}
      {bio?._id && (
        <div className="bg-destructive/5 dark:bg-destructive/10 border border-destructive/20 dark:border-destructive/30 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex gap-3 text-left">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 bg-[#ff3b30] shadow-sm">
              <span className="material-symbols-outlined text-base">warning</span>
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground uppercase tracking-wider">{t("memberTabs.manage.removeBioTitle")}</h4>
              <p className="text-[9.5px] text-muted-foreground/70 mt-0.5 leading-relaxed">{t("memberTabs.manage.removeBioDesc")}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDeleteBio}
            disabled={saving}
            className="w-full bg-[#ff3b30] hover:bg-[#ff3b30]/90 text-white font-black uppercase text-[10px] tracking-wider py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">delete_forever</span>
            {t("memberTabs.manage.removeBtn")}
          </button>
        </div>
      )}

    </div>
  );
}

export default withTranslation()(MemberManageTab);
