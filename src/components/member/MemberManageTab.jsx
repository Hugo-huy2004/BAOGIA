import { withTranslation } from "react-i18next";
import React, { useState } from 'react';

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

function PackageCard({ name, duration, durationUnit, benefits, color, startLabel, expiresLabel, isBasePackage = false, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const formattedBenefits = benefits || [];

  return (
    <div className="space-y-3">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: `linear-gradient(135deg, ${color}15 0%, #15141c 60%, #0d0c10 100%)`,
          borderColor: `${color}30`
        }}
        className="relative overflow-hidden rounded-[24px] text-white p-6 sm:p-7 border shadow-[0_16px_36px_rgba(0,0,0,0.25)] flex flex-col justify-between h-[210px] sm:h-[235px] group transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_20px_48px_rgba(0,0,0,0.35)] cursor-pointer select-none"
      >
        <div 
          className="absolute inset-0 opacity-45 pointer-events-none transition-opacity duration-300 group-hover:opacity-60" 
          style={{ backgroundImage: `radial-gradient(circle at 80% 20%, ${color}35 0%, transparent 80%)` }}
        />
        <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-white/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-1.5 text-white/50 font-black uppercase text-[9px] tracking-[0.2em]">
              <span className="material-symbols-outlined text-xs" style={{ color }}>workspace_premium</span>
              {isBasePackage ? t("memberPortal.package.base") : t("memberPortal.package.promo")}
            </div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight uppercase bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent group-hover:from-white group-hover:to-white transition-all">{name}</h3>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t("memberPortal.package.activeStatus")}
          </div>
        </div>

        <div className="space-y-3 relative z-10 mt-auto">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="text-xs sm:text-sm font-semibold flex items-center gap-4 sm:gap-6 text-left">
              <div>
                <span className="text-[8px] sm:text-[9px] block text-white/40 font-bold uppercase tracking-wider mb-0.5">{t("memberPortal.package.startDate")}</span>
                <span className="text-[11px] sm:text-xs font-mono text-zinc-300 font-bold">{startLabel}</span>
              </div>
              {expiresLabel && (
                <>
                  <div className="w-[1px] h-6 bg-white/10" />
                  <div>
                    <span className="text-[8px] sm:text-[9px] block text-white/40 font-bold uppercase tracking-wider mb-0.5">{t("memberPortal.package.bioDuration")}</span>
                    <span className="text-rose-400 font-bold text-[11px] sm:text-xs font-mono">{expiresLabel}</span>
                  </div>
                </>
              )}
              {!expiresLabel && (
                <>
                  <div className="w-[1px] h-6 bg-white/10" />
                  <div>
                    <span className="text-[8px] sm:text-[9px] block text-white/40 font-bold uppercase tracking-wider mb-0.5">{t("memberPortal.package.addedDuration")}</span>
                    <span className="text-zinc-200 font-bold text-[11px] sm:text-xs font-mono">+{duration} {durationUnit === "days" ? t("memberPortal.package.days") : durationUnit === "years" ? t("memberPortal.package.years") : t("memberPortal.package.months")}</span>
                  </div>
                </>
              )}
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-white/60 transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                expand_more
              </span>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden"
        style={{ 
          maxHeight: isOpen ? '1000px' : '0px',
          opacity: isOpen ? 1 : 0
        }}
      >
        <div className="bg-zinc-50 dark:bg-[#15141c]/30 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 p-5 space-y-4">
          <div className="space-y-0.5 text-left">
            <h4 className="text-[10px] sm:text-[11px] font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-sm" style={{ color }}>verified_user</span>{t("memberTabs.manage.benefitsTitle")}</h4>
            <p className="text-[9px] text-zinc-400">{t("memberPortal.package.benefitsDesc")}</p>
          </div>

          {formattedBenefits.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-left">
              {formattedBenefits.map((benefit, i) => (
                <div key={i} className="flex gap-2.5 items-start p-3 rounded-xl bg-white dark:bg-[#1a1924]/60 border border-zinc-200/50 dark:border-zinc-800/40 transition-all hover:scale-[1.01] hover:border-zinc-300 dark:hover:border-zinc-700">
                  <span className="material-symbols-outlined text-xs mt-0.5 shrink-0" style={{ color }}>check_circle</span>
                  <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-350 leading-relaxed">{benefit}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-zinc-450 italic py-2">{t("memberPortal.package.noDetails")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberManageTab({ bio, publicLink, handleCopyLink, handleDeleteBio, saving, handleRedeemCode, t, i18n }) {
  const [giftCode, setGiftCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleRedeem = () => {
    if (!giftCode.trim()) return;
    handleRedeemCode(giftCode.trim());
    setGiftCode("");
  };

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
        <h2 className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-[#0071e3]">wallet</span>{t("memberTabs.manage.ownedPackagesTitle")}</h2>
        <p className="text-[10px] text-zinc-455 dark:text-zinc-400">{t("memberTabs.manage.ownedPackagesDesc")}</p>
      </div>

      {/* Base Package Card */}
      <PackageCard t={t}
        name={basePkg.name}
        duration={12}
        durationUnit="months"
        benefits={basePkg.benefits}
        color={basePkg.color}
        startLabel={startLabel}
        expiresLabel={expiresLabel}
        isBasePackage={true}
      />

      {/* Custom assigned packages from bio.packages */}
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
        />
      ))}

      {/* Redeem Gift Code Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-2xl border border-amber-500/20 shadow-sm p-6 space-y-4">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none" />
        <div className="space-y-1 text-left">
          <h4 className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">redeem</span>
            {t("memberTabs.manage.giftTitle")}
          </h4>
          <p className="text-[10px] text-amber-700/80 dark:text-amber-500/70 leading-relaxed">{t("memberTabs.manage.giftDesc")}</p>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t("memberTabs.manage.placeholderGift")}
            value={giftCode}
            onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRedeem(); }}
            className="flex-1 rounded-xl border border-amber-500/20 bg-white/50 dark:bg-black/25 text-xs p-3 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-bold font-mono tracking-widest placeholder:tracking-normal placeholder:font-medium placeholder:text-zinc-400"
          />
          <button
            type="button"
            onClick={handleRedeem}
            disabled={!giftCode.trim()}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 active:scale-95 text-white font-black uppercase text-[10px] tracking-wider px-4 rounded-xl transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">verified</span>
            <span>{t("memberTabs.manage.redeemBtn")}</span>
          </button>
        </div>
      </div>

      {/* Public Link Card */}
      <div className="bg-white/60 dark:bg-[#1a1924]/60 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm p-6 space-y-4">
        <div className="space-y-1 text-left">
          <h4 className="text-[11px] font-black text-zinc-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#0071e3]">link</span>
            {t("memberTabs.manage.publicLinkTitle")}
          </h4>
          <p className="text-[9.5px] text-zinc-450 dark:text-zinc-400">{t("memberTabs.manage.publicLinkDesc")}</p>
        </div>

        {bio?.slug ? (
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-zinc-50/80 dark:bg-black/35 border border-zinc-200/60 dark:border-zinc-800 font-mono text-[10px] sm:text-xs text-zinc-700 dark:text-zinc-300 font-bold select-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <span className="material-symbols-outlined text-xs text-emerald-500 shrink-0">lock</span>
              <span className="flex-1 overflow-x-auto scrollbar-none whitespace-nowrap text-left">{publicLink}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={publicLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 font-bold py-2.5 rounded-xl transition-all text-center text-[10px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-xs">open_in_new</span>
                {t("memberTabs.manage.viewLiveBtn")}
              </a>
              <button
                type="button"
                onClick={onCopy}
                className="bg-zinc-100 hover:bg-zinc-200/60 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/80 text-zinc-800 dark:text-zinc-200 font-bold py-2.5 rounded-xl transition-all text-[10px] uppercase tracking-wider border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span className="material-symbols-outlined text-xs">
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? t("memberTabs.manage.copied") : t("memberTabs.manage.copyLink")}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl">
            <span className="material-symbols-outlined text-2xl text-zinc-300 dark:text-zinc-750">link_off</span>
            <p className="text-[10px] italic text-zinc-400 mt-2">{t("memberTabs.manage.notActivatedDesc")}</p>
          </div>
        )}
      </div>

      {/* Warning Danger Zone */}
      {bio?._id && (
        <div className="bg-red-500/5 dark:bg-red-950/10 border border-red-200/20 dark:border-red-900/30 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex gap-3 text-left">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 bg-[#ff3b30] shadow-sm">
              <span className="material-symbols-outlined text-base">warning</span>
            </div>
            <div>
              <h4 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider">{t("memberTabs.manage.removeBioTitle")}</h4>
              <p className="text-[9.5px] text-zinc-450 dark:text-zinc-400 mt-0.5 leading-relaxed">{t("memberTabs.manage.removeBioDesc")}</p>
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
