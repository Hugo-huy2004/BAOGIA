import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Award,
  Lock,
  Unlock,
  Sparkles,
  Share2,
  Copy,
  ArrowLeft,
  CheckCircle2,
  Gift,
  Zap,
  Gamepad2
} from "lucide-react";
import JoyCard from "./JoyCard";
import { MembershipFactory } from "../../../models/membershipTier";

/**
 * Authentic Apple Wallet-style Membership Tier Privileges Page
 * Clean iOS aesthetics, segmented control, Apple Card Cover Flow, and inset grouped list.
 */
export default function MemberTierPrivilegesTab({
  referralCount = 0,
  balance = 0,
  referralCode = "",
  displayName = "",
  email = "",
  onBack,
  onCopyReferral,
  onOpenTransferModal
}) {
  const allTiers = MembershipFactory.getAllTiers();
  const currentTierDetails = MembershipFactory.calculateProgressDetails(referralCount);
  const userCurrentTier = currentTierDetails.currentTier;

  // Selected slide index (defaults to user's current tier index)
  const initialIndex = allTiers.findIndex((t) => t.id === userCurrentTier.id);
  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  const selectedTier = allTiers[currentIndex];
  const isUnlocked = selectedTier.isUnlocked(referralCount);
  const isCurrentTier = selectedTier.id === userCurrentTier.id;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allTiers.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < allTiers.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="max-w-md mx-auto space-y-6 text-left select-none pb-10 animate-fadeIn font-sans">
      {/* ── 1. UNIFIED APPLE NAVIGATION BAR ───────────────────────────────── */}
      <div className="flex items-center justify-between px-1 py-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 shrink-0 items-center gap-1 rounded-xl pl-2 pr-3.5 text-[15px] font-medium text-foreground transition-colors hover:bg-muted"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          <span>Quay lại Ví</span>
        </button>

        <h1 className="text-sm font-bold text-foreground tracking-tight">
          Đặc Quyền Thành Viên
        </h1>

        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          {userCurrentTier.name}
        </span>
      </div>

      {/* ── 2. CLEAN APPLE IOS SEGMENTED CONTROL ───────────────────────────── */}
      <div className="bg-muted/60 p-1 rounded-2xl flex items-center justify-between border border-border/40 gap-1">
        {allTiers.map((tier, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`flex-1 py-1.5 px-1 sm:px-2 rounded-xl text-[11px] font-bold tracking-tight transition-all duration-200 text-center flex items-center justify-center gap-1.5 ${
                isActive
                  ? "bg-card text-foreground shadow-xs scale-100"
                  : "text-muted-foreground hover:text-foreground opacity-70 hover:opacity-100"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: tier.colorHex }}
              />
              <span className={isActive ? "inline" : "hidden sm:inline"}>{tier.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. APPLE WALLET COVER FLOW CARD SHOWCASE ──────────────────────── */}
      <div className="space-y-3">
        <div className="relative">
          {/* Animated Apple Card View */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTier.id}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.x < -40 || velocity.x < -200) handleNext();
                if (offset.x > 40 || velocity.x > 200) handlePrev();
              }}
              className="touch-pan-y cursor-grab active:cursor-grabbing px-1"
            >
              <JoyCard
                referralCount={referralCount}
                balance={balance}
                referralCode={referralCode}
                displayName={displayName}
                email={email}
                onCopyReferral={onCopyReferral}
                onOpenTransferModal={onOpenTransferModal}
                selectedTierOverride={selectedTier}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Apple Style Carousel Controls: Sleek Prev/Next & Dots */}
        <div className="flex items-center justify-between px-3 pt-1">
          <button
            type="button"
            onClick={handlePrev}
            className="w-8 h-8 rounded-full bg-card hover:bg-muted border border-border/40 text-foreground/80 hover:text-foreground flex items-center justify-center shadow-xs active:scale-95 transition-all"
            title="Thẻ trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Carousel Pagination Dots */}
          <div className="flex justify-center items-center gap-1.5">
            {allTiers.map((t, idx) => (
              <button
                key={t.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-8 h-8 rounded-full bg-card hover:bg-muted border border-border/40 text-foreground/80 hover:text-foreground flex items-center justify-center shadow-xs active:scale-95 transition-all"
            title="Thẻ tiếp theo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 4. APPLE IOS INSET GROUPED: CURRENT USER PROGRESS ─────────────── */}
      <div className="bg-card border border-border/40 rounded-[24px] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            TIẾN TRÌNH CỦA BẠN
          </span>
          <span className="text-xs font-bold text-foreground">
            {referralCount} người giới thiệu
          </span>
        </div>

        {/* Apple Fitness Style Segment Progress Bar */}
        {currentTierDetails.nextTier ? (
          <div className="space-y-2">
            <div className="w-full h-3 rounded-full bg-muted overflow-hidden p-0.5 border border-border/20">
              <div
                className="h-full rounded-full transition-all duration-500 bg-primary"
                style={{
                  width: `${currentTierDetails.progressPct}%`
                }}
              />
            </div>

            <div className="flex justify-between text-xs text-muted-foreground font-medium pt-0.5">
              <span>Hạng hiện tại: <strong className="text-foreground">{userCurrentTier.name}</strong></span>
              <span>Lên hạng <strong className="text-foreground">{currentTierDetails.nextTier.name}</strong>: {currentTierDetails.referralsNeeded} người nữa</span>
            </div>
          </div>
        ) : (
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            🎉 Bạn đã đạt Hạng Cao Nhất (Premium Tier)!
          </p>
        )}
      </div>

      {/* ── 5. APPLE IOS INSET GROUPED: PRIVILEGES DETAILS LIST ───────────── */}
      <div className="bg-card border border-border/40 rounded-[24px] p-5 shadow-xs space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block">
              DANH SÁCH ĐẶC QUYỀN
            </span>
            <h2 className="text-base font-bold text-foreground mt-0.5">
              Hạng {selectedTier.name}
            </h2>
          </div>

          {/* Status Badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              isUnlocked
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-muted text-muted-foreground border border-border/30"
            }`}
          >
            {isUnlocked ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã mở khóa</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Khóa ({selectedTier.minReferrals} người)</span>
              </>
            )}
          </span>
        </div>

        {/* iOS Inset List */}
        <div className="space-y-3">
          {selectedTier.privileges.map((p, i) => (
            <div
              key={p.id || i}
              className={`p-3.5 rounded-[18px] border flex items-center gap-3.5 transition-all ${
                isUnlocked
                  ? "bg-background border-border/40 text-foreground"
                  : "bg-muted/30 border-border/20 text-muted-foreground"
              }`}
            >
              {/* App-like Icon Container */}
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  isUnlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                <span className="material-symbols-outlined text-xl">{p.icon || "stars"}</span>
              </div>

              {/* Title & Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-foreground">{p.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {p.detail || "Đặc quyền dành riêng cho thành viên hạng này"}
                </p>
              </div>

              {isUnlocked && (
                <span className="text-emerald-500 font-bold text-xs shrink-0">✓</span>
              )}
            </div>
          ))}
        </div>

        {/* Primary Apple Action Button */}
        {!isUnlocked ? (
          <button
            type="button"
            onClick={onCopyReferral}
            className="w-full h-11 rounded-full bg-primary text-primary-foreground font-semibold text-xs tracking-wide uppercase flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all mt-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Chia Sẻ Mã Để Lên Hạng (Cần {selectedTier.getReferralsNeeded(referralCount)} người)</span>
          </button>
        ) : (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold text-center">
            ✓ Tài khoản của bạn đã sở hữu trọn bộ đặc quyền Hạng {selectedTier.name}
          </div>
        )}
      </div>
    </div>
  );
}
