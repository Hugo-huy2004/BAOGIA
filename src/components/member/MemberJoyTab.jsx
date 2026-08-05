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
import { fetchChallengeStatus, claimChallenge, checkHasPin } from "../../services/joyApi";
import JoyHistory from "./joy/JoyHistory";
import "./member-joy.css";
import { ChevronRight, Sparkles, Gift, Award, CheckCircle2, Users } from "lucide-react";
import { TabFallbackSkeleton } from "../ui/SkeletonLayouts";
import BackButton from "./shared/BackButton";
import JoyCoinBadge from "../shared/JoyCoinBadge";

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
  onOpenParticleModal,
  onBack
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
  const [hasPin, setHasPin] = useState(null);

  const email = bio?.email;

  useEffect(() => {
    if (!email) return;
    checkHasPin()
      .then((d) => setHasPin(Boolean(d.hasPin)))
      .catch(() => setHasPin(null));
  }, [email]);

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
      fetchBalance(email, undefined, { force: true });
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
      {/* Đỉnh trang chỉ còn một nút quay lại. Thẻ JOY tự nó đã là tiêu đề. */}
      {currentView === "card" && onBack && (
        <div className="-mb-2">
          <BackButton onClick={onBack} />
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
              onOpenTransferModal={() => onOpenParticleModal?.("search")}
            />

            {/* Gửi / Nhận / Quét — ba lối vào ví, trước đây chỉ có ở trang
                /joy riêng biệt nên tab chính không chuyển JOY được. */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode: "search", icon: "send", label: "Gửi JOY" },
                { mode: "myqr", icon: "qr_code_2", label: "Nhận JOY" },
                { mode: "scan", icon: "qr_code_scanner", label: "Quét mã" }
              ].map((a) => (
                <button
                  key={a.mode}
                  type="button"
                  onClick={() => onOpenParticleModal?.(a.mode)}
                  className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card text-foreground transition-colors hover:bg-muted active:bg-muted"
                >
                  <span className="material-symbols-outlined text-[22px] text-muted-foreground">{a.icon}</span>
                  <span className="text-[13px] font-medium">{a.label}</span>
                </button>
              ))}
            </div>

            {/* Trạng thái mã PIN — cảnh báo nếu ví chưa khoá. */}
            {hasPin === false && (
              <button
                type="button"
                onClick={() => onOpenParticleModal?.("search")}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted"
              >
                <span className="material-symbols-outlined text-[22px] text-muted-foreground">lock_open</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-foreground">Chưa đặt mã PIN giao dịch</span>
                  <span className="block text-[12.5px] text-muted-foreground">Đặt PIN 6 số để khoá mọi lượt chuyển JOY</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            )}

            {/* REAL CARD BALANCE & MISSIONS GRID (2-COLUMN) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Referrals summary */}
              <div className="bg-card border border-border/50 rounded-3xl p-4 flex min-w-0 flex-col justify-between space-y-2 text-left">
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
              <div className="bg-card border border-border/50 rounded-3xl p-4 flex min-w-0 flex-col justify-between space-y-2 text-left">
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
                    className="min-w-0 flex-1 h-11 px-3.5 rounded-2xl bg-muted/50 border border-transparent text-sm font-mono text-foreground outline-none focus:border-amber-500/50 focus:bg-background transition-all"
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
                      className="min-w-0 flex-1 h-11 px-3.5 rounded-2xl bg-muted/50 border border-transparent text-sm font-mono uppercase text-foreground outline-none focus:border-primary/50 focus:bg-background transition-all"
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

            {/* Lối vào ba màn còn lại. Trước đây chúng chỉ mở được từ thanh 4
                nút ở đỉnh trang — bỏ thanh đó mà không đặt lại lối vào là mất
                trắng cả ba màn. Dạng dòng danh sách, không phải thanh chrome. */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {[
                { id: "stats", icon: "receipt_long", label: "Lịch sử ví JOY", desc: "Mọi khoản nhận, đã dùng và tổng kết 30 ngày" },
                { id: "privileges", icon: "workspace_premium", label: "Đặc quyền thành viên", desc: "Quyền lợi theo từng hạng thẻ" },
                { id: "store", icon: "redeem", label: "Cửa hàng ưu đãi", desc: "Đổi JOY lấy vật phẩm và gói dịch vụ" },
              ].map((row, index) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setCurrentView(row.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted active:bg-muted ${
                    index > 0 ? "border-t border-border" : ""
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px] text-muted-foreground">{row.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-foreground">{row.label}</span>
                    <span className="block text-[12.5px] text-muted-foreground">{row.desc}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
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
            className="space-y-3 text-left"
          >
            <BackButton onClick={() => setCurrentView("card")} />

            {/* Số dư — nguồn duy nhất là joyStore, không nhận qua prop nữa. */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <span className="block text-[12.5px] text-muted-foreground">Số dư ví JOY</span>
              <JoyCoinBadge size="lg" className="mt-1.5" />
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[14px]">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-4 w-4" /> Đã giới thiệu
                </span>
                <span className="font-mono font-semibold text-foreground">{referralCount} người</span>
              </div>
            </div>

            {/* Lịch sử + tổng kết 30 ngày. `/api/joy/history` đã có sẵn từ lâu
                nhưng trước đây chỉ trang /joy riêng dùng tới. */}
            <JoyHistory />

            <button
              type="button"
              onClick={copyReferralCode}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted"
            >
              <span className="material-symbols-outlined text-[22px] text-muted-foreground">ios_share</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-foreground">
                  Mời bạn bè · +100 JOY mỗi người
                </span>
                <span className="block font-mono text-[12.5px] text-muted-foreground">
                  Mã của bạn: {referralCode || bio?.referralCode || "—"}
                </span>
              </span>
              <span className="material-symbols-outlined text-[20px] text-muted-foreground">content_copy</span>
            </button>
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
            className="space-y-3"
          >
            <BackButton onClick={() => setCurrentView("card")} />
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
