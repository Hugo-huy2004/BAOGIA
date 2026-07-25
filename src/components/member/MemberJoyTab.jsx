import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import MemberUtilityStoreTab from "./MemberUtilityStoreTab";
import CheckinCard from "./CheckinCard";
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
  const setBalance = useJoyStore((s) => s.setBalance);
  const fetchBalance = useJoyStore((s) => s.fetchBalance);

  const [referralCount, setReferralCount] = useState(0);
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
  }, [email, fetchBalance]);

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
    <div className="max-w-md mx-auto space-y-5 animate-fadeIn text-left select-none pb-28">
      {/* ── 1. TOP APPLE CARD TOOLBAR ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 py-1">
        <button
          onClick={() => setCurrentView(currentView === "card" ? "stats" : "card")}
          className="text-primary font-bold text-sm hover:opacity-80 active:scale-95 transition-all flex items-center gap-1"
        >
          {currentView === "card" ? "Thống kê JOY" : "Quay lại Ví"}
        </button>

        <div className="flex items-center gap-3 text-foreground">
          <button
            onClick={() => onOpenParticleModal?.()}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 active:scale-95 transition-all"
            title="Quét QR Chuyển JOY"
          >
            <QrCode className="w-4 h-4 text-foreground/80" />
          </button>
          <button
            onClick={() => setCurrentView(currentView === "store" ? "card" : "store")}
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
            {/* AUTHENTIC HUGO CARD ASSET */}
            <div className="relative aspect-[1.586/1] w-full rounded-[24px] overflow-hidden p-6 shadow-xl border border-white/20 dark:border-white/10 transition-transform hover:scale-[1.01] active:scale-[0.99] duration-300">
              {/* Smooth Apple Card Pastel Mesh Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffd5dc] via-[#ffe5b4] via-[#d4f0f0] to-[#e4d5ff] dark:from-[#3a2030] dark:via-[#3d2f20] dark:via-[#1e3434] dark:to-[#2b2042] pointer-events-none" />
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-300/40 dark:bg-amber-500/20 rounded-full blur-[40px] pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-300/40 dark:bg-purple-500/20 rounded-full blur-[40px] pointer-events-none" />

              <div className="relative z-10 h-full flex flex-col justify-between text-zinc-900 dark:text-white">
                {/* Top Row: Member Code Badge & Hugo Card Brand */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={copyReferralCode}
                    className="px-3 py-1 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/15 text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shadow-xs hover:bg-black/20 dark:hover:bg-white/20"
                    title="Sao chép mã cá nhân"
                  >
                    <span className="material-symbols-outlined text-xs text-amber-500">badge</span>
                    <span>{referralCode || bio?.referralCode || "HG9TNHHK"}</span>
                    <Copy className="w-3 h-3 text-amber-500 opacity-80" />
                  </button>

                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase opacity-70">
                    Hugo Card
                  </span>
                </div>

                {/* Bottom Row: Cardholder Name & Direct "Chuyển JOY" Action Button */}
                <div className="flex items-end justify-between gap-2 pt-2">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 block">THÀNH VIÊN GREENWICH</span>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider block truncate">
                      {bio?.displayName || email?.split("@")[0] || "LE GIA HUY (FGW HCM)"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenParticleModal?.();
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-black/15 dark:bg-white/15 hover:bg-black/25 dark:hover:bg-white/25 border border-black/15 dark:border-white/25 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-500" />
                    <span>Chuyển JOY</span>
                  </button>
                </div>
              </div>
            </div>

            {/* REAL CARD BALANCE & MISSIONS GRID (2-COLUMN) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Card Balance Box */}
              <div className="bg-card border border-border/40 rounded-[20px] p-4 shadow-xs flex flex-col justify-between space-y-2 text-left">
                <span className="text-[11px] font-bold text-muted-foreground block">Số Dư Ví JOY</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-foreground font-mono tracking-tight">
                    {(balance ?? 0).toLocaleString("vi-VN")} <span className="text-xs text-amber-500 font-bold">JOY</span>
                  </h2>
                  <span className="text-[10px] font-medium text-muted-foreground block mt-0.5">
                    Cá nhân khả dụng
                  </span>
                </div>
              </div>

              {/* Real Daily Missions Progress Box */}
              <div className="bg-card border border-border/40 rounded-[20px] p-4 shadow-xs flex flex-col justify-between space-y-2 text-left">
                <span className="text-[11px] font-bold text-muted-foreground block">Nhiệm Vụ Hôm Nay</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    {completedCount}/{challenges.length || 5}
                  </h2>
                  <span className="text-[10px] font-medium text-muted-foreground block mt-0.5">
                    Đã hoàn thành
                  </span>
                </div>
                <button
                  onClick={() => handleClaimChallenge(challenges.find((c) => c.completed && !c.claimed)?.id || "")}
                  disabled={!challenges.some((c) => c.completed && !c.claimed)}
                  className={`w-full py-1.5 px-3 rounded-full font-semibold text-xs transition-all active:scale-95 text-center mt-1 ${
                    challenges.some((c) => c.completed && !c.claimed)
                      ? "bg-amber-500 text-white shadow-xs hover:bg-amber-600"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  Nhận JOY
                </button>
              </div>
            </div>

            {/* REAL DAILY CHECK-IN CARD */}
            <div className="bg-card border border-border/40 rounded-[20px] p-4 shadow-xs">
              <CheckinCard email={email} showToast={showToast} />
            </div>

            {/* REAL MISSIONS FEED */}
            <div className="bg-card border border-border/40 rounded-[20px] p-4 shadow-xs space-y-3 text-left">
              <div className="flex items-center justify-between border-b border-border/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                    {t("memberPortal.joy.sections.missions", "Nhiệm Vụ Nhận JOY")}
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-muted-foreground">
                  {completedCount}/{challenges.length} Done
                </span>
              </div>

              {loadingChallenges ? (
                <p className="text-xs text-muted-foreground py-2">Đang tải nhiệm vụ...</p>
              ) : challenges.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Chưa có nhiệm vụ mới hôm nay.</p>
              ) : (
                <div className="space-y-2">
                  {(missionsExpanded ? challenges : challenges.slice(0, MISSION_PREVIEW_COUNT)).map((c) => (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        c.claimed
                          ? "bg-muted/40 border-border/30 opacity-70"
                          : c.completed
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-card border-border/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${c.claimed ? "bg-emerald-500" : "bg-primary/20 text-primary"}`}>
                          {c.claimed ? <CheckCircle2 className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <h4 className="text-xs font-black text-foreground truncate">{c.name}</h4>
                          <span className="text-[10px] font-bold text-muted-foreground block">
                            {c.claimed
                              ? "Đã nhận thưởng"
                              : c.completed
                              ? `Phần thưởng: +${c.amount} JOY`
                              : "Chưa hoàn thành"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleClaimChallenge(c.id)}
                        disabled={!c.completed || c.claimed || claimingId === c.id}
                        className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ml-2 ${
                          c.claimed
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : c.completed
                            ? "bg-emerald-500 text-white shadow-xs hover:opacity-90 active:scale-95"
                            : "bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
                        }`}
                      >
                        {claimingId === c.id ? "..." : c.claimed ? "Đã nhận" : "Nhận JOY"}
                      </button>
                    </div>
                  ))}

                  {challenges.length > MISSION_PREVIEW_COUNT && (
                    <button
                      onClick={() => setMissionsExpanded((v) => !v)}
                      className="w-full py-2 text-center text-xs font-black uppercase text-primary hover:underline flex items-center justify-center gap-1 pt-1"
                    >
                      <span>{missionsExpanded ? "Ẩn bớt" : "Xem thêm nhiệm vụ"}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${missionsExpanded ? "rotate-90" : ""}`} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* REAL COUPON REDEEM & REFERRAL CARD */}
            <div className="bg-card border border-border/40 rounded-[20px] p-4 shadow-xs space-y-3 text-left">
              <div className="flex items-center gap-2 border-b border-border/30 pb-2">
                <Gift className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                  Đổi Mã Coupon &amp; Nhập Mã Giới Thiệu
                </h3>
              </div>

              {/* Coupon Code Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Mã Giftcode Coupon</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={giftCode}
                    onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                    placeholder="Mã quà tặng Coupon..."
                    className="flex-1 h-10 px-3.5 rounded-xl bg-muted/60 border border-border/40 text-xs font-mono font-bold text-foreground outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={redeeming}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {redeeming ? "..." : "Đổi Coupon"}
                  </button>
                </div>
              </div>

              {/* Referrer Code Input (if not applied yet) */}
              {!referralApplied && (
                <div className="space-y-1.5 pt-2 border-t border-border/30">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Nhập Mã Giới Thiệu Của Bạn Bè</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referrerCodeInput}
                      onChange={(e) => setReferrerCodeInput(normalizeReferralInput(e.target.value))}
                      placeholder="Mã người giới thiệu..."
                      className="flex-1 h-10 px-3.5 rounded-xl bg-muted/60 border border-border/40 text-xs font-mono font-bold uppercase text-foreground outline-none focus:border-primary"
                    />
                    <button
                      onClick={handleApplyReferral}
                      disabled={applyingReferral}
                      className="px-4 py-2 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-wider shadow-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {applyingReferral ? "..." : "Áp dụng"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* REAL MEMBER MANAGEMENT & BIO SETTINGS */}
            <div className="bg-card border border-border/40 rounded-[20px] p-4 shadow-xs space-y-3 text-left">
              <div className="flex items-center gap-2 border-b border-border/30 pb-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                  Gói Dịch Vụ &amp; Trang Bio Thành Viên
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
            <div className="bg-card border border-border/40 rounded-[20px] p-5 shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-muted-foreground block uppercase">Tổng Quan Ví JOY</span>
              <h2 className="text-3xl font-black text-foreground font-mono tracking-tight">
                {(balance ?? 0).toLocaleString("vi-VN")} <span className="text-sm text-amber-500 font-bold">JOY</span>
              </h2>

              <div className="pt-2 border-t border-border/30 flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-amber-500" /> Người đã giới thiệu:</span>
                <span className="font-mono text-foreground font-black text-sm">{referralCount} người</span>
              </div>
            </div>

            {/* 2. REFERRAL BONUS CARD (WITH REAL JOY COIN ICON INSTEAD OF APPLE LOGO) */}
            <div className="bg-card border border-border/40 rounded-[20px] p-5 shadow-xs space-y-3 text-center relative overflow-hidden">
              {/* JOY COIN ICON BADGE INSTEAD OF APPLE LOGO */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center text-white mx-auto shadow-md">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
              </div>

              <div>
                <h3 className="text-sm font-black text-foreground">+100 JOY Thưởng Giới Thiệu</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Nhận ngay 100 JOY và gia hạn thêm ngày sử dụng khi bạn bè sử dụng mã giới thiệu của bạn.
                </p>
              </div>

              <button
                onClick={copyReferralCode}
                className="w-full py-2.5 rounded-full bg-primary text-white font-black text-xs uppercase tracking-wider shadow-xs hover:opacity-90 active:scale-95 transition-all"
              >
                Sao Chép Mã Giới Thiệu ({referralCode || "HG9TNHHK"})
              </button>
            </div>
          </motion.div>
        )}

        {/* ── VIEW 3: UTILITY REWARDS STORE ───────────────────────────────────── */}
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
