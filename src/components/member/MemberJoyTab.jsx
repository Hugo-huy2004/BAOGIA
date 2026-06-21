import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import JoyCoinBadge from "../shared/JoyCoinBadge";
import MemberUtilityStoreTab from "./MemberUtilityStoreTab";
import CheckinCard from "./CheckinCard";
import { useJoyStore } from "../../stores/joyStore";

const apiBase = import.meta.env.VITE_API_URL || "/api";

const SECTIONS = [
  { id: "wallet", icon: "account_balance_wallet" },
  { id: "store", icon: "storefront" },
  { id: "history", icon: "receipt_long" },
];

export default function MemberJoyTab({ bio, showToast }) {
  const { t } = useTranslation();
  const [section, setSection] = useState("wallet");
  const balance = useJoyStore(s => s.balance);
  const referralCode = useJoyStore(s => s.referralCode);
  const setBalance = useJoyStore(s => s.setBalance);
  const fetchBalance = useJoyStore(s => s.fetchBalance);

  const [referralCount, setReferralCount] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [giftCode, setGiftCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const email = bio?.email;

  useEffect(() => {
    if (!email) return;
    fetchBalance(email);
    fetch(`${apiBase}/referral/me?email=${encodeURIComponent(email)}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setReferralCount(d.referralCount || 0))
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

  useEffect(() => {
    if (section === "history") loadHistory();
  }, [section, loadHistory]);

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

  function copyReferralLink() {
    const link = `${window.location.origin}/login?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    showToast?.(t("memberPortal.joy.referral.copied"), "success");
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Wallet header */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5 rounded-3xl border border-amber-200/60 dark:border-amber-500/20 p-6 flex flex-col items-center gap-3 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
          {t("memberPortal.joy.walletTitle")}
        </span>
        <JoyCoinBadge amount={balance} size="lg" />
        {referralCode && (
          <div className="flex items-center gap-2 mt-1 bg-white/70 dark:bg-black/20 rounded-full px-3 py-1.5">
            <span className="font-mono text-xs font-bold tracking-widest text-zinc-700 dark:text-zinc-200">{referralCode}</span>
            <button onClick={copyReferralLink} className="text-amber-600 dark:text-amber-400">
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
            </button>
          </div>
        )}
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {t("memberPortal.joy.referral.countLabel", { count: referralCount })}
        </p>
      </div>

      {/* Section switcher */}
      <div className="flex gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900/60 rounded-2xl">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
              section === s.id ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
            {t(`memberPortal.joy.sections.${s.id}`)}
          </button>
        ))}
      </div>

      {section === "wallet" && (
        <div className="space-y-4">
          <CheckinCard email={email} showToast={showToast} />
          <div className="bg-white dark:bg-[#181622] rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-5 space-y-3">
            <h4 className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              {t("memberPortal.joy.redeem.title")}
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={giftCode}
                onChange={e => setGiftCode(e.target.value.toUpperCase())}
                placeholder={t("memberPortal.joy.redeem.placeholder")}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#0c0b11] text-sm font-mono tracking-widest text-zinc-900 dark:text-white"
              />
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {redeeming ? "..." : t("memberPortal.joy.redeem.button")}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed px-1">
            {t("memberPortal.joy.earnInfo")}
          </p>
        </div>
      )}

      {section === "store" && (
        <MemberUtilityStoreTab
          bio={bio}
          balance={balance}
          onPurchased={(newBalance) => setBalance(newBalance)}
          showToast={showToast}
        />
      )}

      {section === "history" && (
        <div className="space-y-5">
          <div>
            <h4 className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2 px-1">
              {t("memberPortal.joy.history.transactions")}
            </h4>
            {transactions.length === 0 ? (
              <p className="text-xs text-zinc-400 px-1">{t("memberPortal.joy.history.empty")}</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-[#181622] rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-800 dark:text-white truncate">{tx.description}</p>
                      <p className="text-[10px] text-zinc-400">{new Date(tx.createdAt).toLocaleString("vi-VN")}</p>
                    </div>
                    <span className={`font-mono font-bold text-xs whitespace-nowrap ml-2 ${tx.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
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
              <div className="space-y-2">
                {orders.map(o => (
                  <div key={o._id} className="flex items-center justify-between p-3 bg-white dark:bg-[#181622] rounded-xl border border-zinc-200 dark:border-zinc-800/80">
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
      )}
    </div>
  );
}
