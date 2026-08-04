import { useTranslation } from "react-i18next";
import { Copy, Send, Sparkles, Lock, Unlock } from "lucide-react";
import { MembershipFactory } from "../../../models/membershipTier";

/**
 * Bright Neon Apple-style JoyCard Component
 * Features clean bright neon gradients, filled concentric circles (Image 2 style),
 * EMV Smart Chip, and floating status badge.
 */
export default function JoyCard({
  referralCount = 0,
  balance = 0,
  referralCode = "",
  displayName = "",
  email = "",
  onCopyReferral,
  onOpenTransferModal,
  selectedTierOverride = null
}) {
  const { t, i18n } = useTranslation();
  // Use OOP Factory to resolve current tier & next tier
  const activeTier = selectedTierOverride || MembershipFactory.getCurrentTier(referralCount);
  const isUnlocked = activeTier.isUnlocked(referralCount);
  const isDarkText = activeTier.textClass.includes("zinc-950") || activeTier.textClass.includes("zinc-900");

  const rawName = displayName || email?.split("@")[0] || t("memberPortal.navigation.memberFallback");
  const cleanName = rawName.replace(/\s*\([^)]*\)/g, "").trim();
  const numberLocale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";

  return (
    <div className="relative w-full aspect-[1.586/1] rounded-[24px] overflow-visible transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] group select-none">
      {/* ── 1. CARD BODY CONTAINER (flat, Apple Wallet style) ─────────────── */}
      <div
        className="absolute inset-0 rounded-[24px] overflow-hidden shadow-[0_8px_28px_rgba(0,0,0,0.18)]"
        style={{
          background: activeTier.cardBgStyle,
          border: `1px solid ${activeTier.neonBorder}55`
        }}
      >
        {/* Soft Ambient Light Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/5 via-transparent to-white/20 pointer-events-none" />

        {/* ── 2. FILLED CONCENTRIC CIRCLES OVERLAY (Matching Image 2) ─────── */}
        <div className="absolute top-1/2 -right-16 -translate-y-1/2 w-72 h-72 pointer-events-none">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="100" cy="100" r="100" fill={activeTier.ringsColor || "currentColor"} opacity="1" />
            <circle cx="100" cy="100" r="75" fill={activeTier.ringsColor || "currentColor"} opacity="1.3" />
            <circle cx="100" cy="100" r="50" fill={activeTier.ringsColor || "currentColor"} opacity="1.6" />
            <circle cx="100" cy="100" r="25" fill={activeTier.ringsColor || "currentColor"} opacity="2" />
          </svg>
        </div>

        {/* ── 3. MAIN CARD CONTENT CONTAINER ─────────────────────────────────── */}
        <div className={`relative z-10 h-full flex flex-col justify-between p-5 sm:p-6 ${activeTier.textClass}`}>
          {/* Top Row: Referral Code Pill & Tier Title */}
          <div className="flex items-center justify-between gap-2">
            {/* Referral Code Copy Button */}
            <button
              type="button"
              onClick={onCopyReferral}
              className={`px-3 py-1 rounded-full text-[11px] font-mono font-black tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shadow-xs backdrop-blur-md ${activeTier.pillStyle}`}
              title={t("memberPortal.joy.card.copyCode")}
            >
              <span className="material-symbols-outlined text-xs">badge</span>
              <span>{referralCode || "HG9TNHHK"}</span>
              <Copy className="w-3 h-3 opacity-90" />
            </button>

            {/* Bright Tier Badge Label */}
            <div className="flex items-center gap-1.5">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 backdrop-blur-md shadow-xs ${activeTier.pillStyle}`}
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>{activeTier.badgeTitle}</span>
              </span>

              <span className="text-[10px] font-mono font-black tracking-widest uppercase opacity-80 hidden sm:inline-block ml-1">
                {t("memberPortal.joy.card.cardName")}
              </span>
            </div>
          </div>

          {/* Middle Row: Balance Readout */}
          <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest opacity-75 block">
              {t("memberPortal.joy.card.availableBalance")}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] sm:text-[38px] leading-none font-semibold tracking-tight tabular-nums">
                {(balance ?? 0).toLocaleString(numberLocale)}
              </span>
              <span className={`text-sm sm:text-base font-semibold ${activeTier.joyTextColor}`}>
                JOY
              </span>
            </div>
          </div>

          {/* Bottom Row: EMV Chip + Member Info + "Chuyển JOY" Action */}
          <div className="flex items-end justify-between gap-2 pt-1">
            {/* Member Name + EMV Smart Chip Graphic (Image 2 style) */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Metallic Gold EMV Chip Graphic */}
              <div
                className="w-10 h-7 rounded-md border border-amber-300/80 shadow-sm flex flex-col justify-between p-1 shrink-0 relative overflow-hidden"
                style={{
                  background: activeTier.chipGradient || "linear-gradient(135deg, #FFF099 0%, #E6C200 50%, #997A00 100%)"
                }}
                title={t("memberPortal.joy.card.smartChip")}
              >
                <div className="w-full h-px bg-amber-950/30" />
                <div className="flex justify-between w-full h-2">
                  <div className="w-2.5 h-full border-r border-amber-950/30" />
                  <div className="w-2.5 h-full border-l border-amber-950/30" />
                </div>
                <div className="w-full h-px bg-amber-950/30" />
              </div>

              {/* Member Info */}
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-90 block truncate">
                  HUGO STUDIO
                </span>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider block truncate max-w-[170px] sm:max-w-[220px]">
                  {cleanName}
                </span>
              </div>
            </div>

            {/* Action: "Chuyển JOY" Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenTransferModal?.();
              }}
              className={`px-3 py-1 rounded-full backdrop-blur-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all shadow-xs shrink-0 border ${activeTier.actionBtnStyle}`}
            >
              <Send className="w-3 h-3" />
              <span>{t("memberPortal.joy.card.transfer")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. FLOATING BOTTOM BADGE (Lock/Unlock Icon - Image 2 style) ───── */}
      <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="w-8 h-8 rounded-full bg-white shadow-lg border border-black/10 flex items-center justify-center text-pink-600">
          {isUnlocked ? (
            <Unlock className="w-4 h-4 text-emerald-600" />
          ) : (
            <Lock className="w-4 h-4 text-pink-600" />
          )}
        </div>
      </div>
    </div>
  );
}

export { JoyCard };
