import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import MemberUtilityStoreTab from "./MemberUtilityStoreTab";
import CheckinCard from "./CheckinCard";
import { useJoyStore } from "../../stores/joyStore";
import { fetchChallengeStatus, claimChallenge } from "../../services/joyApi";
import "./member-joy.css";
import { WalletCards, Store } from "lucide-react";
import JoyCoinBadge from "../shared/JoyCoinBadge";

const MemberManageTab = React.lazy(() => import("./MemberManageTab"));

const apiBase = import.meta.env.VITE_API_URL || "/api";

// "Quản Lý Ví" absorbs the former Tổng quan + Nhiệm vụ + Gửi JOY + Gói dịch vụ
// sections — one e-wallet style home screen instead of hopping across tabs.

// First-page size for the missions grid before "Xem thêm" reveals the rest —
// matches the 5-col desktop / 2-col mobile grid so the first page never cuts
// a card off mid-row.
const MISSION_PREVIEW_COUNT = 10;


export default function MemberJoyTab({ bio, showToast, onBioUpdate, publicLink, handleCopyLink, handleDeleteBio, saving, onOpenParticleModal }) {
  const { t } = useTranslation();
  const SECTIONS = [
    { id: "wallet", label: t("memberPortal.joyWallet.sectionWallet"), Icon: WalletCards },
    { id: "store", label: t("memberPortal.joyWallet.sectionStore"), Icon: Store },
  ];
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

  const goToWalletSection = (anchorId) => {
    setSection('wallet');
    requestAnimationFrame(() => document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  return (
    <div className="joy-dashboard animate-fadeIn">
      {/* Hero — flat dark card matching the rest of Hugo Studio's member portal */}
      <div className="joy-card-hero">
        <div className="joy-card-row-top">
          <span className="joy-card-brand"><span className="material-symbols-outlined">bolt</span>{t("memberPortal.joyWallet.brand")}</span>
        </div>
        <div className="joy-card-balance">
          <span className="joy-balance-num">{(balance ?? 0).toLocaleString("vi-VN")}</span>
          <JoyCoinBadge amount={balance} hideAmount size="lg" className="joy-balance-coin" />
        </div>
        <p className="joy-card-sub">{t("memberPortal.joyWallet.sub")}</p>
        <div className="joy-card-stats">
          <div className="joy-card-stat"><small>{t("memberPortal.joyWallet.statReferrals")}</small><strong>{referralCount}</strong></div>
          <div className="joy-card-stat"><small>{t("memberPortal.joyWallet.statBonusChat")}</small><strong>{bio?.bonusChatTokens || 0}</strong></div>
          {referralCode ? (
            <button onClick={copyReferralCode} className="joy-card-stat is-code">
              <span><small>{t("memberPortal.joyWallet.statReferralCode")}</small><strong>{referralCode}</strong></span>
              <span className="material-symbols-outlined">content_copy</span>
            </button>
          ) : (
            <div className="joy-card-stat"><small>{t("memberPortal.joyWallet.statReferralCode")}</small><strong>—</strong></div>
          )}
        </div>
      </div>

      {/* Circular quick actions — the "home screen" of any e-wallet app */}
      <div className="joy-actions-row">
        <button className="joy-action-circle" onClick={() => onOpenParticleModal?.()}>
          <span className="joy-action-icon material-symbols-outlined">send</span>
          <span>{t("memberPortal.joyWallet.actionSend")}</span>
        </button>
        <button className="joy-action-circle" onClick={() => goToWalletSection('joy-coupon-card')}>
          <span className="joy-action-icon material-symbols-outlined">confirmation_number</span>
          <span>{t("memberPortal.joyWallet.actionCoupon")}</span>
        </button>
        <button className="joy-action-circle" onClick={() => goToWalletSection('joy-missions-card')}>
          <span className="joy-action-icon material-symbols-outlined">flag_circle</span>
          <span>{t("memberPortal.joyWallet.actionMissions")}</span>
        </button>
        <button className="joy-action-circle" onClick={() => setSection('store')}>
          <span className="joy-action-icon material-symbols-outlined">storefront</span>
          <span>{t("memberPortal.joyWallet.actionStore")}</span>
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
                      <div className="joy-mission-list">
                        {(missionsExpanded ? challenges : challenges.slice(0, MISSION_PREVIEW_COUNT)).map(c => (
                          <div key={c.id} className={`joy-mission-item ${c.claimed ? "claimed" : c.completed ? "completed" : ""}`}>
                            <div className="joy-mission-item-left">
                              <div className="joy-mission-icon">
                                <span className="material-symbols-outlined">{c.claimed ? "check_circle" : "flag_circle"}</span>
                              </div>
                              <div className="joy-mission-info">
                                <h4 className="joy-mission-name">{c.name}</h4>
                                <span className="joy-mission-sub">
                                  {c.claimed
                                    ? t("memberPortal.joy.missions.claimed", "Đã hoàn thành")
                                    : c.completed
                                      ? `Phần thưởng: +${c.amount} JOY`
                                      : t("memberPortal.joy.missions.notDoneYet", "Chưa hoàn thành")}
                                </span>
                              </div>
                            </div>
                            <div className="joy-mission-action">
                              <button
                                onClick={() => handleClaimChallenge(c.id)}
                                disabled={!c.completed || c.claimed || claimingId === c.id}
                              >
                                {claimingId === c.id ? "..." : c.claimed ? t("memberPortal.joy.missions.claimed", "Đã nhận") : t("memberPortal.joy.missions.claimButton", "Nhận JOY")}
                              </button>
                            </div>
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
    </div>
  );
}
