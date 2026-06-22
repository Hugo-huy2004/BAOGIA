import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import JoyCoinBadge from "../shared/JoyCoinBadge";
import MemberUtilityStoreTab from "./MemberUtilityStoreTab";
import CheckinCard from "./CheckinCard";
import { useJoyStore } from "../../stores/joyStore";
import { resolvePhone, transferJoy, fetchChallengeStatus, claimChallenge } from "../../services/joyApi";
import "./member-joy.css";
import { WalletCards, Send, Target, Store, History } from "lucide-react";

const apiBase = import.meta.env.VITE_API_URL || "/api";

const SECTIONS = [
  { id: "overview", label: "Tổng quan", Icon: WalletCards },
  { id: "send", label: "Chuyển JOY", Icon: Send },
  { id: "missions", label: "Nhiệm vụ", Icon: Target },
  { id: "store", label: "Cửa hàng", Icon: Store },
  { id: "history", label: "Lịch sử", Icon: History },
];

const SOURCE_ICONS = {
  referral_referrer: "group_add",
  referral_referee: "group_add",
  chess_win: "emoji_events",
  chess_match: "extension",
  companion: "favorite",
  checkin: "event_available",
  gift_code: "redeem",
  store_purchase: "shopping_bag",
  admin_adjustment: "tune",
  companion_unlock: "lock_open",
  daily_challenge: "flag_circle",
  arcade_score: "sports_esports",
  focus_session: "self_improvement",
  aura_theme_rent: "palette",
  joy_gift_sent: "call_made",
  joy_gift_received: "call_received",
  ide_learning: "school",
};

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

export default function MemberJoyTab({ bio, showToast, onBioUpdate }) {
  const { t } = useTranslation();
  const [section, setSection] = useState("overview");
  const balance = useJoyStore(s => s.balance);
  const referralCode = useJoyStore(s => s.referralCode);
  const setBalance = useJoyStore(s => s.setBalance);
  const fetchBalance = useJoyStore(s => s.fetchBalance);

  const [referralCount, setReferralCount] = useState(0);
  const [referralApplied, setReferralApplied] = useState(Boolean(bio?.referralApplied));
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [giftCode, setGiftCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [referrerCodeInput, setReferrerCodeInput] = useState("");
  const [applyingReferral, setApplyingReferral] = useState(false);

  // Send-JOY-by-phone flow
  const [sendPhone, setSendPhone] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [recipient, setRecipient] = useState(null);
  const [sendAmount, setSendAmount] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [sending, setSending] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // Daily missions
  const [challenges, setChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [claimingId, setClaimingId] = useState(null);

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

  const loadHistory = useCallback(() => {
    if (!email) return;
    fetch(`${apiBase}/joy/history?email=${encodeURIComponent(email)}&limit=30`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setTransactions(d.transactions || []))
      .catch(() => {});
    fetch(`${apiBase}/utility-store/orders?email=${encodeURIComponent(email)}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : []))
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
    if (section === "history") loadHistory();
    if (section === "missions") loadChallenges();
  }, [section, loadHistory, loadChallenges]);

  useEffect(() => {
    const handleRealtime = () => {
      if (section === "history") loadHistory();
      if (section === "missions") loadChallenges();
    };
    window.addEventListener('hugo:notification', handleRealtime);
    return () => window.removeEventListener('hugo:notification', handleRealtime);
  }, [section, loadHistory, loadChallenges]);

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
      loadHistory();
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
    setSending(true);
    try {
      const data = await transferJoy({ fromEmail: email, toPhone: sendPhone.trim(), amount, message: sendMessage.trim() });
      setBalance(data.balance);
      
      setReceipt({
        amount: amount,
        netAmount: data.netAmount,
        feeAmount: data.feeAmount,
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

  return (
    <div className="joy-dashboard animate-fadeIn">
      {/* Wallet hero — always visible regardless of section, the wallet's anchor */}
      <div className="joy-wallet-hero">
        <div className="joy-orb joy-orb-one" /><div className="joy-orb joy-orb-two" />
        <div className="joy-balance-block">
          <span className="joy-eyebrow"><span className="material-symbols-outlined">account_balance_wallet</span>{t("memberPortal.joy.walletTitle")}</span>
          <JoyCoinBadge amount={balance} size="lg" className="joy-main-balance" />
          <p>JOY có thể dùng cho quà tặng, tiện ích và các trải nghiệm trong hệ sinh thái Hugo.</p>
        </div>
        <div className="joy-hero-details">
          <div className="joy-stat"><span className="material-symbols-outlined">group_add</span><div><small>ĐÃ GIỚI THIỆU</small><strong>{referralCount}</strong></div></div>
          <div className="joy-stat"><span className="material-symbols-outlined">chat</span><div><small>CHAT THƯỞNG</small><strong>{bio?.bonusChatTokens || 0}</strong></div></div>
          {referralCode && <button onClick={copyReferralCode} className="joy-referral-code"><span><small>MÃ GIỚI THIỆU · CHẠM ĐỂ SAO CHÉP</small><strong>{referralCode}</strong></span><span className="material-symbols-outlined">content_copy</span></button>}
        </div>
      </div>

      {/* Section switcher — horizontally scrollable so 5 tabs stay legible on phones */}
      <nav className="joy-section-nav">
        {SECTIONS.map(s => {
          const SectionIcon = s.Icon;
          return <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={section === s.id ? "active" : ""}
          >
            <SectionIcon aria-hidden="true" />
            <span>{t(`memberPortal.joy.sections.${s.id}`, s.label)}</span>
          </button>;
        })}
      </nav>

      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {section === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <div className="joy-overview-grid">
                <div className="joy-checkin-wrap"><CheckinCard email={email} showToast={showToast} /></div>
                <div className="joy-code-column">
                {!referralApplied && (
                  <div className="joy-action-card referral-card">
                    <h4 className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      {t("memberPortal.joy.applyReferral.title")}
                    </h4>
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
                    <p className="text-[10px] text-zinc-400">{t("memberPortal.joy.applyReferral.hint")}</p>
                  </div>
                )}
                <div className="joy-action-card gift-card">
                  <h4 className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    {t("memberPortal.joy.redeem.title")}
                  </h4>
                  <div className="joy-input-action">
                    <input
                      type="text"
                      value={giftCode}
                      onChange={e => setGiftCode(e.target.value.toUpperCase())}
                      placeholder={t("memberPortal.joy.redeem.placeholder")}
                      className="joy-code-input"
                    />
                    <button
                      onClick={handleRedeem}
                      disabled={redeeming}
                      className="joy-action-button dark"
                    >
                      {redeeming ? "..." : t("memberPortal.joy.redeem.button")}
                    </button>
                  </div>
                </div>
                <p className="joy-earn-note">
                  {t("memberPortal.joy.earnInfo")}
                </p></div>
              </div>
            </motion.div>
          )}

          {section === "send" && (
            <motion.div key="send" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <div className="joy-section-content">
                <div className="joy-content-card joy-send-card">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-800 dark:text-white">{t("memberPortal.joy.send.title")}</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{t("memberPortal.joy.send.subtitle")}</p>
                  </div>

                  {!recipient ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                          {t("memberPortal.joy.send.phoneLabel")}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="tel"
                            value={sendPhone}
                            onChange={e => setSendPhone(e.target.value)}
                            placeholder={t("memberPortal.joy.send.phonePlaceholder")}
                            className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#0c0b11] text-base font-medium text-zinc-900 dark:text-white"
                          />
                          <button
                            onClick={handleLookupRecipient}
                            disabled={lookingUp || !sendPhone.trim()}
                            className="px-5 py-3 rounded-xl bg-warning hover:bg-warning/90 text-warning-foreground text-xs font-bold uppercase tracking-wider disabled:opacity-50 shrink-0"
                          >
                            {lookingUp ? "..." : t("memberPortal.joy.send.lookupButton")}
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400">{t("memberPortal.joy.send.ageGateHint")} {t("memberPortal.joy.send.dailyCapNote")}</p>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-warning/10 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                          <RecipientAvatar name={recipient.displayName} avatar={recipient.avatar} />
                          <div>
                            <p className="text-[10px] font-bold text-warning uppercase tracking-wider">
                              {t("memberPortal.joy.send.recipientLabel")}
                            </p>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{recipient.displayName}</p>
                          </div>
                        </div>
                        <button
                          onClick={resetSendFlow}
                          className="text-[10px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline shrink-0"
                        >
                          {t("memberPortal.joy.send.changeRecipient")}
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                          {t("memberPortal.joy.send.amountLabel")}
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="1000"
                          value={sendAmount}
                          onChange={e => setSendAmount(e.target.value)}
                          placeholder="Nhập số lượng (tối thiểu 10 JOY)"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#0c0b11] text-lg font-bold text-zinc-900 dark:text-white"
                        />
                        {numericSendAmount > 0 && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Phí giao dịch dự kiến: {feePreview} JOY
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => setShowInvoice(true)}
                        disabled={numericSendAmount < 10}
                        className="w-full py-3.5 rounded-xl bg-warning hover:bg-warning/90 text-warning-foreground text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                      >
                        Tạo Hóa Đơn Chuyển JOY
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Modal Overlay */}
              <AnimatePresence>
                {showInvoice && recipient && (
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
                      className="bg-white dark:bg-[#1a1924] w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col"
                    >
                      <div className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center mb-3">
                          <span className="material-symbols-outlined text-2xl">receipt_long</span>
                        </div>
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider">Hóa Đơn Chuyển JOY</h3>
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
                          <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-700 my-1" />
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Tổng khấu trừ</span>
                            <span className="text-lg font-black text-zinc-900 dark:text-white">{totalPreview} <small className="text-xs text-zinc-500 font-bold">JOY</small></span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Nội dung chuyển (Tùy chọn)</label>
                          <textarea
                            value={sendMessage}
                            onChange={(e) => setSendMessage(e.target.value)}
                            placeholder="Nhập nội dung chuyển..."
                            rows="2"
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#0c0b11] text-sm text-zinc-900 dark:text-white resize-none"
                          />
                        </div>
                      </div>

                      <div className="p-4 flex gap-3 bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                          onClick={() => setShowInvoice(false)}
                          disabled={sending}
                          className="flex-1 py-3 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          onClick={handleConfirmSend}
                          disabled={sending}
                          className="flex-[2] py-3 rounded-xl bg-success hover:bg-success/90 text-success-foreground text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {sending ? "Đang xử lý..." : "Xác nhận chuyển"}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {section === "missions" && (
            <motion.div key="missions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <div className="joy-mission-list">
                {loadingChallenges ? (
                  <p className="text-xs text-zinc-400 px-1">{t("memberPortal.joy.missions.subtitle")}</p>
                ) : challenges.length === 0 ? (
                  <p className="text-xs text-zinc-400 px-1">{t("memberPortal.joy.missions.empty")}</p>
                ) : (
                  challenges.map(c => (
                    <div
                      key={c.id}
                      className={`joy-mission-card ${c.claimed ? "claimed" : c.completed ? "completed" : ""}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          c.claimed ? "bg-success/10 dark:bg-success/15 text-success" : "bg-muted text-muted-foreground"
                        }`}>
                          <span className="material-symbols-outlined text-[20px]">
                            {c.claimed ? "check_circle" : "flag_circle"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-800 dark:text-white truncate">{c.name}</p>
                          <p className="text-[11px] text-zinc-400">
                            {c.claimed
                              ? t("memberPortal.joy.missions.claimed")
                              : c.completed
                                ? `+${c.amount} JOY`
                                : t("memberPortal.joy.missions.notDoneYet")}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleClaimChallenge(c.id)}
                        disabled={!c.completed || c.claimed || claimingId === c.id}
                        className="px-4 py-2 rounded-xl bg-warning hover:bg-warning/90 text-warning-foreground text-[11px] font-bold uppercase tracking-wider disabled:opacity-40 disabled:bg-muted shrink-0"
                      >
                        {claimingId === c.id ? "..." : c.claimed ? t("memberPortal.joy.missions.claimed") : t("memberPortal.joy.missions.claimButton")}
                      </button>
                    </div>
                  ))
                )}
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

          {section === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <div className="joy-history-grid">
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2 px-1">
                    {t("memberPortal.joy.history.transactions")}
                  </h4>
                  {transactions.length === 0 ? (
                    <p className="text-xs text-zinc-400 px-1">{t("memberPortal.joy.history.empty")}</p>
                  ) : (
                    <div className="joy-history-list">
                      {transactions.map((tx, i) => (
                        <div key={i} className="joy-history-row">
                          <span className="material-symbols-outlined text-[18px] text-zinc-400 shrink-0">
                            {SOURCE_ICONS[tx.source] || "receipt_long"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-zinc-800 dark:text-white truncate">{tx.description}</p>
                            <p className="text-[10px] text-zinc-400">{new Date(tx.createdAt).toLocaleString("vi-VN")}</p>
                          </div>
                          <span className={`font-mono font-bold text-xs whitespace-nowrap ml-2 ${tx.amount >= 0 ? "text-success" : "text-destructive"}`}>
                            {tx.amount >= 0 ? "+" : ""}{tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2 px-1">
                    {t("memberPortal.joy.history.orders")}
                  </h4>
                  {orders.length === 0 ? (
                    <p className="text-xs text-zinc-400 px-1">{t("memberPortal.joy.history.emptyOrders")}</p>
                  ) : (
                    <div className="joy-history-list">
                      {orders.map(o => (
                        <div key={o._id} className="joy-history-row order-row">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-800 dark:text-white truncate">{o.productName}</p>
                            <p className="text-[10px] text-zinc-400 font-mono">{o.purchaseCode}</p>
                          </div>
                          <JoyCoinBadge amount={o.priceJoy} size="sm" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
              className="bg-white dark:bg-[#1a1924] w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl shadow-success/20 border border-zinc-200 dark:border-zinc-800 relative flex flex-col"
            >
              <div className="h-32 bg-gradient-to-b from-success/20 to-transparent absolute top-0 left-0 right-0" />
              <div className="p-8 pb-6 flex flex-col items-center text-center relative z-10">
                <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center shadow-lg shadow-success/30 mb-4 animate-bounce-sm">
                  <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check
                  </span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Giao dịch thành công</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{receipt.time}</p>
                
                <div className="mt-8 mb-6 w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-4xl font-black text-success">-{receipt.amount}</span>
                    <span className="text-lg font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">JOY</span>
                  </div>
                </div>

                <div className="w-full bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-left space-y-3">
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
                </div>
              </div>
              <div className="p-4 pt-0">
                <button
                  onClick={() => setReceipt(null)}
                  className="w-full py-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-bold uppercase tracking-wider transition-colors"
                >
                  Đóng & Trở về
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
