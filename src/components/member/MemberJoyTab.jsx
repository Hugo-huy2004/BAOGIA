import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import MemberUtilityStoreTab from "./MemberUtilityStoreTab";
import CheckinCard from "./CheckinCard";
import { useJoyStore } from "../../stores/joyStore";
import { resolvePhone, transferJoy, fetchChallengeStatus, claimChallenge } from "../../services/joyApi";
import "./member-joy.css";
import { WalletCards, Store } from "lucide-react";

const MemberManageTab = React.lazy(() => import("./MemberManageTab"));

const apiBase = import.meta.env.VITE_API_URL || "/api";

// "Quản Lý Ví" absorbs the former Tổng quan + Nhiệm vụ + Gửi JOY + Gói dịch vụ
// sections — one e-wallet style home screen instead of hopping across tabs.
const SECTIONS = [
  { id: "wallet", label: "Quản Lý Ví", Icon: WalletCards },
  { id: "store", label: "Cửa hàng", Icon: Store },
];

const LOADING_STEPS = ["Đang xác thực giao dịch...", "Đang chuyển JOY...", "Đang hoàn tất..."];
// First-page size for the missions grid before "Xem thêm" reveals the rest —
// matches the 5-col desktop / 2-col mobile grid so the first page never cuts
// a card off mid-row.
const MISSION_PREVIEW_COUNT = 10;

function RecipientAvatar({ name, avatar, size = "w-12 h-12" }) {
  if (avatar) {
    return <img src={avatar} alt={name} className={`${size} rounded-full object-cover border border-zinc-200 dark:border-zinc-700`} />;
  }
  return (
    <div className={`${size} rounded-full bg-warning/10 dark:bg-warning/15 border border-warning/20 dark:border-warning/30 flex items-center justify-center text-warning font-black uppercase`}>
      {(name || "?").charAt(0)}
    </div>
  );
}

export default function MemberJoyTab({ bio, showToast, onBioUpdate, publicLink, handleCopyLink, handleDeleteBio, saving }) {
  const { t } = useTranslation();
  const [section, setSection] = useState("wallet");
  const balance = useJoyStore(s => s.balance);
  const referralCode = useJoyStore(s => s.referralCode);
  const setBalance = useJoyStore(s => s.setBalance);
  const fetchBalance = useJoyStore(s => s.fetchBalance);

  const [referralCount, setReferralCount] = useState(0);
  const [referralApplied, setReferralApplied] = useState(Boolean(bio?.referralApplied));
  const [giftCode, setGiftCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [referrerCodeInput, setReferrerCodeInput] = useState("");
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [offerTab, setOfferTab] = useState("coupon"); // coupon | referral — purely presentational

  // Send-JOY-by-phone flow — opened as a banking-style overlay from the "Gửi JOY" quick action
  const [sendFlowOpen, setSendFlowOpen] = useState(false);
  const [sendPhone, setSendPhone] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [recipient, setRecipient] = useState(null);
  const [sendAmount, setSendAmount] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [receipt, setReceipt] = useState(null);

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
      .then(r => r.json())
      .then(d => {
        setReferralCount(d.referralCount || 0);
        setReferralApplied(Boolean(d.referralApplied || d.referredBy));
      })
      .catch(() => {});
  }, [email]);

  const loadChallenges = useCallback(() => {
    if (!email) return;
    setLoadingChallenges(true);
    fetchChallengeStatus(email)
      .then(setChallenges)
      .finally(() => setLoadingChallenges(false));
  }, [email]);

  useEffect(() => {
    if (section === "wallet") loadChallenges();
  }, [section, loadChallenges]);

  useEffect(() => {
    const handleRealtime = () => {
      if (section === "wallet") loadChallenges();
    };
    window.addEventListener('hugo:notification', handleRealtime);
    return () => window.removeEventListener('hugo:notification', handleRealtime);
  }, [section, loadChallenges]);

  // Cycles the loading-overlay caption while a transfer is in flight
  useEffect(() => {
    if (!sending) { setLoadingStepIdx(0); return; }
    const id = setInterval(() => setLoadingStepIdx(i => (i + 1) % LOADING_STEPS.length), 700);
    return () => clearInterval(id);
  }, [sending]);

  async function handleRedeem() {
    if (!giftCode.trim() || !email || redeeming) return;
    setRedeeming(true);
    try {
      const r = await fetch(`${apiBase}/joy-gift-cards/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code: giftCode.trim() }),
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
        body: JSON.stringify({ email, referrerCode: referrerCodeInput.trim() }),
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

  function resetSendFlow() {
    setSendPhone("");
    setRecipient(null);
    setSendAmount("");
    setSendMessage("");
    setShowInvoice(false);
    setSendFlowOpen(false);
  }

  async function handleLookupRecipient() {
    if (!sendPhone.trim() || lookingUp) return;
    setLookingUp(true);
    setRecipient(null);
    try {
      const data = await resolvePhone(sendPhone.trim());
      setRecipient(data);
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setLookingUp(false);
    }
  }

  async function handleConfirmSend() {
    const amount = parseInt(sendAmount, 10);
    if (!amount || amount < 10 || sending) return;
    setShowInvoice(false);
    setSending(true);
    try {
      const data = await transferJoy({ fromEmail: email, toPhone: sendPhone.trim(), amount, message: sendMessage.trim() });
      setBalance(data.balance);

      setReceipt({
        txCode: data.txCode,
        amount: amount,
        netAmount: data.netAmount,
        feeAmount: data.feeAmount,
        message: data.message || sendMessage.trim(),
        senderName: data.senderName || bio?.displayName || "Bạn",
        recipientName: data.recipientName || recipient?.displayName || "Người nhận",
        recipientAvatar: recipient?.avatar,
        recipientPhone: sendPhone.trim(),
        time: new Date().toLocaleString("vi-VN")
      });

      resetSendFlow();
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setSending(false);
    }
  }

  async function handleClaimChallenge(id) {
    if (claimingId) return;
    setClaimingId(id);
    try {
      const data = await claimChallenge(email, id);
      setBalance(data.balance);
      const def = challenges.find(c => c.id === id);
      showToast?.(t("memberPortal.joy.missions.claimSuccess", { amount: def?.amount ?? "" }), "success");
      loadChallenges();
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setClaimingId(null);
    }
  }

  const numericSendAmount = Number(sendAmount) || 0;
  const feePreview = Math.floor(numericSendAmount * 0.05);
  const totalPreview = numericSendAmount + feePreview;

  const goToWalletSection = (anchorId) => {
    setSection('wallet');
    requestAnimationFrame(() => document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  return (
    <div className="joy-dashboard animate-fadeIn">
      {/* Hero — simple card following Hugo Studio's primary/accent gradient */}
      <div className="joy-card-hero">
        <div className="joy-card-row-top">
          <span className="joy-card-brand"><span className="material-symbols-outlined">bolt</span>Hugo JOY Wallet</span>
        </div>
        <div className="joy-card-balance">
          <span className="joy-balance-num">{(balance ?? 0).toLocaleString("vi-VN")}</span>
          <span className="joy-balance-unit">JOY</span>
        </div>
        <p className="joy-card-sub">JOY có thể dùng cho quà tặng, tiện ích và các trải nghiệm trong hệ sinh thái Hugo.</p>
        <div className="joy-card-stats">
          <div className="joy-card-stat"><small>Đã giới thiệu</small><strong>{referralCount}</strong></div>
          <div className="joy-card-stat"><small>Chat thưởng</small><strong>{bio?.bonusChatTokens || 0}</strong></div>
          {referralCode ? (
            <button onClick={copyReferralCode} className="joy-card-stat is-code">
              <span><small>Mã giới thiệu</small><strong>{referralCode}</strong></span>
              <span className="material-symbols-outlined">content_copy</span>
            </button>
          ) : (
            <div className="joy-card-stat"><small>Mã giới thiệu</small><strong>—</strong></div>
          )}
        </div>
      </div>

      {/* Circular quick actions — the "home screen" of any e-wallet app */}
      <div className="joy-actions-row">
        <button className="joy-action-circle" onClick={() => setSendFlowOpen(true)}>
          <span className="joy-action-icon material-symbols-outlined">send</span>
          <span>Gửi JOY</span>
        </button>
        <button className="joy-action-circle" onClick={() => goToWalletSection('joy-coupon-card')}>
          <span className="joy-action-icon material-symbols-outlined">confirmation_number</span>
          <span>Coupon</span>
        </button>
        <button className="joy-action-circle" onClick={() => goToWalletSection('joy-missions-card')}>
          <span className="joy-action-icon material-symbols-outlined">flag_circle</span>
          <span>Nhiệm vụ</span>
        </button>
        <button className="joy-action-circle" onClick={() => setSection('store')}>
          <span className="joy-action-icon material-symbols-outlined">storefront</span>
          <span>Cửa hàng</span>
        </button>
      </div>

      {/* Segmented switch: Quản Lý Ví vs Cửa hàng */}
      <nav className="joy-segment">
        {SECTIONS.map(s => {
          const SectionIcon = s.Icon;
          return <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={section === s.id ? "active" : ""}
          >
            <SectionIcon size={15} aria-hidden="true" />
            <span>{s.label}</span>
          </button>;
        })}
      </nav>

      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {section === "wallet" && (
            <motion.div key="wallet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="joy-feed-grid">
              {/* Left column — check-in alone */}
              <div className="joy-feed">
                <div className="joy-feed-card joy-checkin-wrap"><CheckinCard email={email} showToast={showToast} /></div>
              </div>

              {/* Right column — coupon/referral grouped together with missions
                  (both are "earn JOY" actions), per request to stop splitting
                  them apart into unrelated columns */}
              <div className="joy-feed">
                <div className="joy-feed-card" id="joy-coupon-card">
                  <h3 className="joy-feed-card-title"><span className="material-symbols-outlined">redeem</span>Ưu đãi &amp; Mã</h3>
                  {!referralApplied && (
                    <div className="joy-offer-tabs">
                      <button onClick={() => setOfferTab("coupon")} className={offerTab === "coupon" ? "active" : ""}>Coupon</button>
                      <button onClick={() => setOfferTab("referral")} className={offerTab === "referral" ? "active" : ""}>Giới thiệu</button>
                    </div>
                  )}
                  {offerTab === "referral" && !referralApplied ? (
                    <>
                      <div className="joy-input-action">
                        <input
                          type="text"
                          value={referrerCodeInput}
                          onChange={e => setReferrerCodeInput(normalizeReferralInput(e.target.value))}
                          placeholder={t("memberPortal.joy.applyReferral.placeholder")}
                          className="joy-code-input"
                        />
                        <button
                          onClick={handleApplyReferral}
                          disabled={applyingReferral}
                          className="joy-action-button amber"
                        >
                          {applyingReferral ? "..." : t("memberPortal.joy.applyReferral.button")}
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-2">{t("memberPortal.joy.applyReferral.hint")}</p>
                    </>
                  ) : (
                    <>
                      <div className="joy-input-action">
                        <input
                          type="text"
                          value={giftCode}
                          onChange={e => setGiftCode(e.target.value.toUpperCase())}
                          placeholder="Nhập mã Coupon..."
                          className="joy-code-input"
                        />
                        <button
                          onClick={handleRedeem}
                          disabled={redeeming}
                          className="joy-action-button"
                        >
                          {redeeming ? "..." : "Đổi Coupon"}
                        </button>
                      </div>
                      <p className="joy-earn-note">{t("memberPortal.joy.earnInfo")}</p>
                    </>
                  )}
                </div>

                <div className="joy-feed-card" id="joy-missions-card">
                  <h3 className="joy-feed-card-title"><span className="material-symbols-outlined">flag_circle</span>{t("memberPortal.joy.sections.missions", "Nhiệm vụ")}</h3>
                  {loadingChallenges ? (
                    <p className="text-xs text-zinc-400 px-1">{t("memberPortal.joy.missions.subtitle")}</p>
                  ) : challenges.length === 0 ? (
                    <p className="text-xs text-zinc-400 px-1">{t("memberPortal.joy.missions.empty")}</p>
                  ) : (
                    <>
                      <div className="joy-mission-grid">
                        {(missionsExpanded ? challenges : challenges.slice(0, MISSION_PREVIEW_COUNT)).map(c => (
                          <div key={c.id} className={`joy-mission-tile ${c.claimed ? "claimed" : c.completed ? "completed" : ""}`}>
                            <span className="joy-mission-pill-icon material-symbols-outlined">{c.claimed ? "check_circle" : "flag_circle"}</span>
                            <p className="joy-mission-pill-name">{c.name}</p>
                            <p className="joy-mission-pill-sub">
                              {c.claimed
                                ? t("memberPortal.joy.missions.claimed")
                                : c.completed
                                  ? `+${c.amount} JOY`
                                  : t("memberPortal.joy.missions.notDoneYet")}
                            </p>
                            <button
                              onClick={() => handleClaimChallenge(c.id)}
                              disabled={!c.completed || c.claimed || claimingId === c.id}
                            >
                              {claimingId === c.id ? "..." : c.claimed ? t("memberPortal.joy.missions.claimed") : t("memberPortal.joy.missions.claimButton")}
                            </button>
                          </div>
                        ))}
                      </div>
                      {challenges.length > MISSION_PREVIEW_COUNT && (
                        <button
                          onClick={() => setMissionsExpanded(v => !v)}
                          className="joy-mission-more"
                        >
                          {missionsExpanded ? t("memberPortal.joy.missions.collapse", "Ẩn bớt") : t("memberPortal.joy.missions.seeMore", "Xem thêm")}
                          <span className="material-symbols-outlined text-sm" style={{ transform: missionsExpanded ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Full-width row below — packages carousel needs the extra width, plus bio link */}
              <div className="joy-feed joy-feed-span">
                <div className="joy-feed-card">
                  <h3 className="joy-feed-card-title"><span className="material-symbols-outlined">workspace_premium</span>Gói dịch vụ &amp; Trang Bio</h3>
                  <React.Suspense fallback={<div className="py-8 text-center text-xs text-zinc-400">Đang tải...</div>}>
                    <MemberManageTab bio={bio} publicLink={publicLink} handleCopyLink={handleCopyLink} handleDeleteBio={handleDeleteBio} saving={saving} />
                  </React.Suspense>
                </div>
              </div>
            </motion.div>
          )}

          {section === "store" && (
            <motion.div key="store" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
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

      {/* Banking-style "Gửi JOY" overlay flow: lookup -> amount -> invoice -> loading -> receipt */}
      <AnimatePresence>
        {sendFlowOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="joy-send-modal bg-white dark:bg-[#1a1924] w-full max-w-sm rounded-[1.75rem] overflow-hidden shadow-2xl border border-border flex flex-col max-h-[90vh]"
            >
              <div className="px-5 py-4 flex items-center justify-between bg-gradient-to-r from-primary to-accent text-primary-foreground">
                <h3 className="text-sm font-bold flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-base">send</span>
                  </span>
                  Gửi JOY
                </h3>
                <button onClick={resetSendFlow} className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto">
                {!recipient ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {t("memberPortal.joy.send.phoneLabel")}
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">call</span>
                        <input
                          type="tel"
                          value={sendPhone}
                          onChange={e => setSendPhone(e.target.value)}
                          placeholder={t("memberPortal.joy.send.phonePlaceholder")}
                          className="joy-send-input pl-11"
                        />
                      </div>
                      <button
                        onClick={handleLookupRecipient}
                        disabled={lookingUp || !sendPhone.trim()}
                        className="joy-send-cta"
                      >
                        {lookingUp ? (
                          <span className="flex items-center justify-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang tra cứu...</span>
                        ) : t("memberPortal.joy.send.lookupButton")}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{t("memberPortal.joy.send.ageGateHint")} {t("memberPortal.joy.send.dailyCapNote")}</p>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-primary/8 rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <RecipientAvatar name={recipient.displayName} avatar={recipient.avatar} />
                        <div>
                          <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                            {t("memberPortal.joy.send.recipientLabel")}
                          </p>
                          <p className="text-sm font-bold text-foreground">{recipient.displayName}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setRecipient(null); setSendAmount(""); }}
                        className="text-[10px] font-bold text-muted-foreground hover:text-foreground underline shrink-0"
                      >
                        {t("memberPortal.joy.send.changeRecipient")}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {t("memberPortal.joy.send.amountLabel")}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="10"
                          max="1000"
                          value={sendAmount}
                          onChange={e => setSendAmount(e.target.value)}
                          placeholder="Tối thiểu 10 JOY"
                          className="joy-send-input text-lg font-bold pr-14"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground">JOY</span>
                      </div>
                      {numericSendAmount > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          Phí giao dịch dự kiến: <strong className="text-foreground">{feePreview} JOY</strong>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nội dung chuyển (Tùy chọn)</label>
                      <textarea
                        value={sendMessage}
                        onChange={(e) => setSendMessage(e.target.value)}
                        placeholder="Nhập nội dung chuyển..."
                        rows="2"
                        className="joy-send-input resize-none"
                      />
                    </div>

                    <button
                      onClick={() => setShowInvoice(true)}
                      disabled={numericSendAmount < 10}
                      className="joy-send-cta"
                    >
                      Xác Nhận Thông Tin Chuyển JOY
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice / final-confirmation modal */}
      <AnimatePresence>
        {showInvoice && recipient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1a1924] w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col"
            >
              <div className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl">receipt_long</span>
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider">Xác Nhận Chuyển JOY</h3>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-left space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Người nhận</span>
                    <div className="flex items-center gap-2">
                      <RecipientAvatar name={recipient.displayName} avatar={recipient.avatar} size="w-5 h-5" />
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{recipient.displayName}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Số điện thoại</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">{sendPhone.trim()}</span>
                  </div>
                  <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-700 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Số JOY gửi đi</span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">{numericSendAmount} JOY</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Phí giao dịch (5%)</span>
                    <span className="text-sm font-medium text-destructive">+{feePreview} JOY</span>
                  </div>
                  {sendMessage.trim() && (
                    <>
                      <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-700 my-1" />
                      <div className="flex justify-between items-start gap-3">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider shrink-0">Nội dung</span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-white text-right">{sendMessage.trim()}</span>
                      </div>
                    </>
                  )}
                  <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-700 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Tổng khấu trừ</span>
                    <span className="text-lg font-black text-zinc-900 dark:text-white">{totalPreview} <small className="text-xs text-zinc-500 font-bold">JOY</small></span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 text-center">Vui lòng kiểm tra kỹ thông tin trước khi xác nhận. Giao dịch JOY không thể hoàn lại.</p>
              </div>

              <div className="p-4 flex gap-3 bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setShowInvoice(false)}
                  className="flex-1 py-3 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmSend}
                  className="flex-[2] py-3 rounded-xl bg-success hover:bg-success/90 text-success-foreground text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  Xác nhận chuyển
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading effect — shown right at the "transferring" moment, as requested */}
      <AnimatePresence>
        {sending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-[#1a1924] w-full max-w-xs rounded-[2rem] p-8 flex flex-col items-center text-center shadow-2xl border border-zinc-200 dark:border-zinc-800"
            >
              <div className="relative w-16 h-16 mb-5">
                <div className="absolute inset-0 rounded-full border-4 border-warning/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-warning animate-spin" />
                <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-warning text-2xl">paid</span>
              </div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-1">Đang xử lý giao dịch</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{LOADING_STEPS[loadingStepIdx]}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banking Receipt Overlay */}
      <AnimatePresence>
        {receipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white dark:bg-[#1a1924] w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl shadow-success/20 border border-zinc-200 dark:border-zinc-800 relative flex flex-col max-h-[90vh]"
            >
              <div className="h-32 bg-gradient-to-b from-success/20 to-transparent absolute top-0 left-0 right-0" />
              <div className="p-8 pb-6 flex flex-col items-center text-center relative z-10 overflow-y-auto">
                <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center shadow-lg shadow-success/30 mb-4 animate-bounce-sm">
                  <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check
                  </span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Chuyển JOY thành công</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{receipt.time}</p>

                <div className="mt-8 mb-6 w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-4xl font-black text-success">-{receipt.amount}</span>
                    <span className="text-lg font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">JOY</span>
                  </div>
                </div>

                <div className="w-full bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-left space-y-3">
                  {receipt.txCode && (
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Mã giao dịch</span>
                      <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white select-all">{receipt.txCode}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Từ</span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">{receipt.senderName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Người nhận</span>
                    <div className="flex items-center gap-2">
                      <RecipientAvatar name={receipt.recipientName} avatar={receipt.recipientAvatar} size="w-6 h-6" />
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{receipt.recipientName}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Số điện thoại</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">{receipt.recipientPhone}</span>
                  </div>
                  {receipt.feeAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Phí giao dịch</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">{receipt.feeAmount} JOY</span>
                    </div>
                  )}
                  {receipt.message && (
                    <>
                      <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-700 my-1" />
                      <div className="flex justify-between items-start gap-3">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider shrink-0">Nội dung</span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-white text-right">{receipt.message}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="p-4 pt-0">
                <button
                  onClick={() => setReceipt(null)}
                  className="w-full py-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-bold uppercase tracking-wider transition-colors"
                >
                  Đóng &amp; Trở về
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
