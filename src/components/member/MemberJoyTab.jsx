import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import MemberUtilityStoreTab from "./MemberUtilityStoreTab";
import CheckinCard from "./CheckinCard";
import JoyCard from "./card/JoyCard";
import MemberTierPrivilegesTab from "./card/MemberTierPrivilegesTab";
import { MembershipFactory } from "../../models/membershipTier";
import { useJoyStore } from "../../stores/joyStore";
import { fetchChallengeStatus, claimChallenge } from "../../services/joyApi";
import "./member-joy.css";
import {
  Search,
  CreditCard,
  MoreHorizontal,
  ChevronRight,
  Sparkles,
  Gift,
  Award,
  CheckCircle2,
  Send,
  ShoppingBag,
  Gamepad2,
  Zap,
  Copy,
  Users,
  QrCode
} from "lucide-react";
import { TabFallbackSkeleton } from "../ui/SkeletonLayouts";

const MemberManageTab = React.lazy(() => import("./MemberManageTab"));
const apiBase = import.meta.env.VITE_API_URL || "/api";
const MISSION_PREVIEW_COUNT = 10;

export default function MemberJoyTab({
  bio,
  showToast,
  onBioUpdate,
  publicLink,
  handleCopyLink,
  handleDeleteBio,
  saving,
  onOpenParticleModal
}) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") || searchParams.get("view");
  const [currentView, setCurrentView] = useState(() =>
    urlTab === "store" || urlTab === "stats" ? urlTab : "card"
  );

  useEffect(() => {
    if (urlTab === "store" || urlTab === "stats" || urlTab === "card") {
      setCurrentView(urlTab);
    }
  }, [urlTab]);

  const balance = useJoyStore((s) => s.balance);
  const referralCode = useJoyStore((s) => s.referralCode);
  const referralCount = useJoyStore((s) => s.referralCount);
  const setBalance = useJoyStore((s) => s.setBalance);
  const setReferralCount = useJoyStore((s) => s.setReferralCount);
  const fetchBalance = useJoyStore((s) => s.fetchBalance);

  const [referralApplied, setReferralApplied] = useState(Boolean(bio?.referralApplied));
  const [giftCode, setGiftCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [referrerCodeInput, setReferrerCodeInput] = useState("");
  const [applyingReferral, setApplyingReferral] = useState(false);

  // Daily missions
  const [challenges, setChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [claimingId, setClaimingId] = useState(null);
  const [missionsExpanded, setMissionsExpanded] = useState(false);

  const email = bio?.email;

  useEffect(() => {
    if (!email) return;
    fetchBalance(email);
    fetch(`${apiBase}/referral/me?email=${encodeURIComponent(email)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setReferralCount(d.referralCount || 0);
        setReferralApplied(Boolean(d.referralApplied || d.referredBy));
      })
      .catch(() => {});
  }, [email, fetchBalance, setReferralCount]);

  const loadChallenges = useCallback(() => {
    if (!email) return;
    setLoadingChallenges(true);
    fetchChallengeStatus(email)
      .then(setChallenges)
      .finally(() => setLoadingChallenges(false));
  }, [email]);

  useEffect(() => {
    if (currentView === "card" || currentView === "stats") loadChallenges();
  }, [currentView, loadChallenges]);

  useEffect(() => {
    const handleRealtime = () => {
      if (currentView === "card" || currentView === "stats") loadChallenges();
    };
    window.addEventListener("hugo:notification", handleRealtime);
    return () => window.removeEventListener("hugo:notification", handleRealtime);
  }, [currentView, loadChallenges]);

  async function handleRedeem() {
    if (!giftCode.trim() || !email || redeeming) return;
    setRedeeming(true);
    try {
      const r = await fetch(`${apiBase}/joy-gift-cards/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code: giftCode.trim() })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || t("memberPortal.joy.redeem.error"));
      setBalance(data.balance);
      showToast?.(t("memberPortal.joy.redeem.success", { amount: data.amount }), "success");
      setGiftCode("");
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setRedeeming(false);
    }
  }

  async function handleApplyReferral() {
    if (!referrerCodeInput.trim() || !email || applyingReferral) return;
    setApplyingReferral(true);
    try {
      const r = await fetch(`${apiBase}/referral/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, referrerCode: referrerCodeInput.trim() })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || t("memberPortal.joy.applyReferral.error"));
      fetchBalance(email);
      setReferralApplied(true);
      onBioUpdate?.({ referralApplied: true });
      showToast?.(t("memberPortal.joy.applyReferral.success", { days: data.bioExtendedDays }), "success");
      setReferrerCodeInput("");
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setApplyingReferral(false);
    }
  }

  function copyReferralCode() {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    showToast?.(t("memberPortal.joy.referral.copied"), "success");
  }

  function normalizeReferralInput(value) {
    let next = value.trim();
    if (next.includes("?") || next.includes("://")) {
      try {
        const parsed = new URL(next, window.location.origin);
        next = parsed.searchParams.get("ref") || next;
      } catch (_) {}
    }
    return next.toUpperCase().replace(/\s+/g, "").slice(0, 24);
  }

  async function handleClaimChallenge(id) {
    if (claimingId) return;
    setClaimingId(id);
    try {
      const data = await claimChallenge(email, id);
      setBalance(data.balance);
      const def = challenges.find((c) => c.id === id);
      showToast?.(t("memberPortal.joy.missions.claimSuccess", { amount: def?.amount ?? "" }), "success");
      loadChallenges();
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setClaimingId(null);
    }
  }

  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <div className="max-w-md mx-auto space-y-5 animate-fadeIn text-left select-none pb-6">
      {/* ── 1. TOP APPLE CARD TOOLBAR (Main Card View Only) ───────────────────────── */}
      {currentView === "card" && (
        <div className="flex items-center justify-between px-1 py-1">
          <button
            onClick={() => setCurrentView("stats")}
            className="text-primary font-bold text-sm hover:opacity-80 active:scale-95 transition-all flex items-center gap-1"
          >
            Thống kê JOY
          </button>

          <div className="flex items-center gap-2.5 text-foreground">
            <button
              onClick={() => setCurrentView("privileges")}
              className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center hover:bg-amber-500/20 active:scale-95 transition-all"
              title="Trang Đặc Quyền Thành Viên"
            >
              <Award className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenParticleModal?.()}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 active:scale-95 transition-all"
              title="Quét QR Chuyển JOY"
            >
              <QrCode className="w-4 h-4 text-foreground/80" />
            </button>
            <button
              onClick={() => setCurrentView("store")}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 active:scale-95 transition-all"
              title="Cửa hàng Ưu đãi"
            >
              <CreditCard className="w-4 h-4 text-foreground/80" />
            </button>
            <button
              onClick={copyReferralCode}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 active:scale-95 transition-all"
              title="Sao chép mã cá nhân"
            >
              <MoreHorizontal className="w-4 h-4 text-foreground/80" />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── VIEW 1: MAIN HUGO CARD (100% REAL FEATURES) ──────────────────────── */}
        {currentView === "card" && (
          <motion.div
            key="card_view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* AUTHENTIC HUGO CARD & OOP TIER SYSTEM */}
            <JoyCard
              referralCount={referralCount}
              balance={balance}
              referralCode={referralCode || bio?.referralCode}
              displayName={bio?.displayName}
              email={email}
              onCopyReferral={copyReferralCode}
              onOpenTransferModal={() => onOpenParticleModal?.()}
            />

            {/* REAL CARD BALANCE & MISSIONS GRID (2-COLUMN) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Referrals summary */}
              <div className="bg-card border border-border/50 rounded-3xl p-4 shadow-sm flex flex-col justify-between space-y-2 text-left">
                <span className="text-sm text-muted-foreground block">Đã giới thiệu</span>
                <div>
                  <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                    {referralCount} <span className="text-sm text-muted-foreground font-normal">người</span>
                  </h2>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    Hạng: <strong className="font-semibold" style={{ color: MembershipFactory.getCurrentTier(referralCount).colorHex === "#FFFFF0" ? "#D97706" : MembershipFactory.getCurrentTier(referralCount).colorHex }}>{MembershipFactory.getCurrentTier(referralCount).name}</strong>
                  </span>
                </div>
              </div>

              {/* Real Daily Missions Progress Box */}
              <div className="bg-card border border-border/50 rounded-3xl p-4 shadow-sm flex flex-col justify-between space-y-2 text-left">
                <span className="text-sm text-muted-foreground block">Nhiệm vụ hôm nay</span>
                <div>
                  <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                    {completedCount}/{challenges.length || 5}
                  </h2>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    Đã hoàn thành
                  </span>
                </div>
                <button
                  onClick={() => handleClaimChallenge(challenges.find((c) => c.completed && !c.claimed)?.id || "")}
                  disabled={!challenges.some((c) => c.completed && !c.claimed)}
                  className={`w-full py-2 px-3 rounded-full font-semibold text-sm transition-all active:scale-95 text-center mt-1 ${
                    challenges.some((c) => c.completed && !c.claimed)
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  Nhận JOY
                </button>
              </div>
            </div>

            {/* COMPACT APPLE-STYLE TIER PRIVILEGES LINK BAR */}
            <button
              type="button"
              onClick={() => setCurrentView("privileges")}
              className="w-full py-3.5 px-4 rounded-3xl bg-card hover:bg-muted border border-border/50 text-foreground flex items-center justify-between shadow-sm active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Award className="w-4.5 h-4.5" />
                </div>
                <div className="text-left">
                  <span className="text-xs text-muted-foreground block">
                    Đặc quyền thành viên
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    Hạng: <strong className="text-amber-500 font-semibold">{MembershipFactory.getCurrentTier(referralCount).name}</strong>
                  </span>
                </div>
              </div>

              <span className="text-sm font-medium text-primary flex items-center gap-1">
                <span>Chi tiết</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </button>

            {/* REAL DAILY CHECK-IN CARD */}
            <div className="bg-card border border-border/50 rounded-3xl p-4 shadow-sm">
              <CheckinCard email={email} showToast={showToast} />
            </div>

            {/* REAL MISSIONS FEED */}
            <div className="bg-card border border-border/50 rounded-3xl p-5 shadow-sm space-y-3.5 text-left font-sans">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {t("memberPortal.joy.sections.missions", "Nhiệm vụ nhận JOY")}
                  </h3>
                </div>
                <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                  {completedCount}/{challenges.length}
                </span>
              </div>

              {loadingChallenges ? (
                <p className="text-xs text-muted-foreground py-3 text-center animate-pulse">Đang tải nhiệm vụ...</p>
              ) : challenges.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">Chưa có nhiệm vụ mới hôm nay.</p>
              ) : (
                <div className="space-y-2">
                  {(missionsExpanded ? challenges : challenges.slice(0, MISSION_PREVIEW_COUNT)).map((c) => (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        c.claimed
                          ? "bg-muted/30 border-border/20 opacity-70"
                          : c.completed
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-background border-border/30"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            c.claimed
                              ? "bg-emerald-500 text-white"
                              : c.completed
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {c.claimed ? <CheckCircle2 className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <h4 className="text-sm font-semibold text-foreground truncate">{c.name}</h4>
                          <span className="text-xs text-muted-foreground block">
                            {c.claimed
                              ? "Đã nhận thưởng"
                              : c.completed
                              ? `Thưởng +${c.amount} JOY`
                              : "Chưa hoàn thành"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleClaimChallenge(c.id)}
                        disabled={!c.completed || c.claimed || claimingId === c.id}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ml-2 active:scale-95 shrink-0 ${
                          c.claimed
                            ? "bg-muted/60 text-muted-foreground cursor-not-allowed"
                            : c.completed
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                        }`}
                      >
                        {claimingId === c.id ? "..." : c.claimed ? "Đã nhận" : "Nhận JOY"}
                      </button>
                    </div>
                  ))}

                  {challenges.length > MISSION_PREVIEW_COUNT && (
                    <button
                      type="button"
                      onClick={() => setMissionsExpanded((v) => !v)}
                      className="w-full py-2 text-center text-sm font-medium text-primary hover:underline flex items-center justify-center gap-1 pt-1"
                    >
                      <span>{missionsExpanded ? "Ẩn bớt" : "Xem thêm nhiệm vụ"}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${missionsExpanded ? "rotate-90" : ""}`} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* REAL COUPON REDEEM & REFERRAL CARD */}
            <div className="bg-card border border-border/50 rounded-3xl p-5 shadow-sm space-y-3.5 text-left font-sans">
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  Đổi mã &amp; giới thiệu
                </h3>
              </div>

              {/* Coupon Code Input */}
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground block">
                  Mã quà tặng
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={giftCode}
                    onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã coupon"
                    className="flex-1 h-11 px-3.5 rounded-2xl bg-muted/50 border border-transparent text-sm font-mono text-foreground outline-none focus:border-amber-500/50 focus:bg-background transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleRedeem}
                    disabled={redeeming}
                    className="px-4 rounded-2xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {redeeming ? "..." : "Đổi"}
                  </button>
                </div>
              </div>

              {/* Referrer Code Input (if not applied yet) */}
              {!referralApplied && (
                <div className="space-y-1.5 pt-3 border-t border-border/40">
                  <label className="text-sm text-muted-foreground block">
                    Mã người giới thiệu
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referrerCodeInput}
                      onChange={(e) => setReferrerCodeInput(normalizeReferralInput(e.target.value))}
                      placeholder="Nhập mã giới thiệu"
                      className="flex-1 h-11 px-3.5 rounded-2xl bg-muted/50 border border-transparent text-sm font-mono uppercase text-foreground outline-none focus:border-primary/50 focus:bg-background transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleApplyReferral}
                      disabled={applyingReferral}
                      className="px-4 rounded-2xl bg-primary text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {applyingReferral ? "..." : "Áp dụng"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* REAL MEMBER MANAGEMENT & BIO SETTINGS */}
            <div className="bg-card border border-border/50 rounded-3xl p-5 shadow-sm space-y-3 text-left">
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h3 className="text-base font-semibold text-foreground">
                  Gói dịch vụ &amp; trang Bio
                </h3>
              </div>
              <React.Suspense fallback={<TabFallbackSkeleton />}>
                <MemberManageTab
                  bio={bio}
                  publicLink={publicLink}
                  handleCopyLink={handleCopyLink}
                  handleDeleteBio={handleDeleteBio}
                  saving={saving}
                />
              </React.Suspense>
            </div>
          </motion.div>
        )}

        {/* ── VIEW 2: REAL STATS & REFERRAL SUMMARY (REPLACED APPLE LOGO WITH JOY COIN) ── */}
        {currentView === "stats" && (
          <motion.div
            key="stats_view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 text-left"
          >
            {/* 1. REAL JOY BALANCE & REFERRAL STATS CARD */}
            <div className="bg-card border border-border/50 rounded-3xl p-5 shadow-sm space-y-3">
              <span className="text-sm text-muted-foreground block">Tổng quan ví JOY</span>
              <h2 className="text-3xl font-semibold text-foreground font-mono tracking-tight">
                {(balance ?? 0).toLocaleString("vi-VN")} <span className="text-base text-amber-500 font-semibold">JOY</span>
              </h2>

              <div className="pt-3 border-t border-border/40 flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-amber-500" /> Đã giới thiệu</span>
                <span className="font-mono text-foreground font-semibold">{referralCount} người</span>
              </div>
            </div>

            {/* 2. REFERRAL BONUS CARD */}
            <div className="bg-card border border-border/50 rounded-3xl p-5 shadow-sm space-y-3 text-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white mx-auto shadow-sm">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground">+100 JOY thưởng giới thiệu</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Nhận ngay 100 JOY và gia hạn ngày sử dụng khi bạn bè dùng mã giới thiệu của bạn.
                </p>
              </div>

              <button
                onClick={copyReferralCode}
                className="w-full py-3 rounded-full bg-primary text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
              >
                Sao chép mã ({referralCode || "HG9TNHHK"})
              </button>
            </div>
          </motion.div>
        )}

        {/* ── VIEW 3: DEDICATED MEMBERSHIP TIER PRIVILEGES PAGE (SWIPEABLE CAROUSEL) ── */}
        {currentView === "privileges" && (
          <motion.div
            key="privileges_view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <MemberTierPrivilegesTab
              referralCount={referralCount}
              balance={balance}
              referralCode={referralCode || bio?.referralCode}
              displayName={bio?.displayName}
              email={email}
              onBack={() => setCurrentView("card")}
              onCopyReferral={copyReferralCode}
              onOpenTransferModal={() => onOpenParticleModal?.()}
            />
          </motion.div>
        )}

        {/* ── VIEW 4: UTILITY REWARDS STORE ───────────────────────────────────── */}
        {currentView === "store" && (
          <motion.div
            key="store_view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <MemberUtilityStoreTab
              bio={bio}
              balance={balance}
              onPurchased={(newBalance) => setBalance(newBalance)}
              onBioUpdate={onBioUpdate}
              showToast={showToast}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
