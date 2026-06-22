import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import SubUtilityHeader from "../SubUtilityHeader";
import ChatTab from "./ChatTab";
import TherapyTab from "./TherapyTab";
import EvaluationTab from "./EvaluationTab";
import SleepTracker from "./SleepTracker";
import dataApi from "../../../services/dataApi";
import AIBot from "../../../services/classes/CompanionBot/AIBot";
import { webPushHelper } from "../../../utils/webPushHelper";
import { useTranslation } from "react-i18next";
import { useCompanionSessionTimer } from "../../../hooks/useCompanionSessionTimer";

// ── Sub-tab config ─────────────────────────────────────────────────────────────
const SUB_TABS = [
  { id: 'chat',       label: 'Tâm Sự',    icon: 'psychology_alt', grad: 'from-[#0071e3] to-[#0071e3]',  light: 'bg-[#0071e3]/10 text-[#0071e3] dark:text-[#0a84ff]',   dot: 'bg-[#0071e3] dark:bg-[#0a84ff]'   },
  { id: 'therapy',    label: 'Trị Liệu',  icon: 'spa',            grad: 'from-[#0071e3] to-[#0071e3]',  light: 'bg-[#0071e3]/10 text-[#0071e3] dark:text-[#0a84ff]',   dot: 'bg-[#0071e3] dark:bg-[#0a84ff]'   },
  { id: 'sleep',      label: 'Giấc Ngủ',  icon: 'bedtime',        grad: 'from-[#0071e3] to-[#0071e3]',  light: 'bg-[#0071e3]/10 text-[#0071e3] dark:text-[#0a84ff]',   dot: 'bg-[#0071e3] dark:bg-[#0a84ff]'   },
  { id: 'evaluation', label: 'Đánh Giá',  icon: 'analytics',      grad: 'from-[#0071e3] to-[#0071e3]',  light: 'bg-[#0071e3]/10 text-[#0071e3] dark:text-[#0a84ff]',   dot: 'bg-[#0071e3] dark:bg-[#0a84ff]'   },
];

// ── Helper: count qualified therapy activities ─────────────────────────────────
function countQualifiedActivities(logs = []) {
  return logs.filter(log => {
    if (log.type !== "therapy_activity") return false;
    const name = (log.name || "").toLowerCase();
    const desc = (log.desc || "").toLowerCase();
    const getMin = (d) => { const m = d.match(/(\d+)\s*phút/); return m ? parseInt(m[1]) : 0; };
    if (name.includes("đọc sách"))                        return getMin(desc) >= 30;
    if (name.includes("tĩnh tâm"))                        return getMin(desc) >= 30;
    if (name.includes("hít thở"))                         return getMin(desc) >= 10;
    if (name.includes("trầm cảm") || name.includes("cbt")) return getMin(desc) >= 10;
    return false;
  }).length;
}

// ── Journey Progress Card ──────────────────────────────────────────────────────
// ── Crisis Escalation Banner ────────────────────────────────────────────────────
// Shown when the system detects a high-severity crisis flag (chatDistressCount
// spike). Defaults to universally-safe guidance (115 emergency line, trusted
// contacts) — only shows a dedicated psychological hotline if one is actually
// configured via VITE_CRISIS_HOTLINE, since guessing a wrong specialized number
// would be worse than not showing one at all.
function CrisisBanner({ flag, onResolve, onTalkNow }) {
  const { t } = useTranslation();
  const hotline = import.meta.env.VITE_CRISIS_HOTLINE || "";
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-rose-300/60 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/20 p-4 space-y-3"
    >
      <div className="flex items-start gap-2.5">
        <span className="material-symbols-outlined text-rose-500 text-xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
        <div className="min-w-0">
          <p className="text-xs font-black text-rose-700 dark:text-rose-400">{t("companion.crisis.title", "Bạn không một mình")}</p>
          <p className="text-[11px] text-rose-600/90 dark:text-rose-400/80 leading-relaxed mt-0.5">
            {t("companion.crisis.desc", "Hệ thống nhận thấy cậu đang trải qua giai đoạn khó khăn. Nếu đang gặp nguy hiểm tức thời, hãy gọi 115 (Cấp cứu) hoặc đến cơ sở y tế gần nhất ngay. Hãy liên hệ người thân, bạn bè đáng tin cậy để được ở bên cạnh.")}
          </p>
          {hotline && (
            <a href={`tel:${hotline}`} className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-rose-700 dark:text-rose-400 underline">
              <span className="material-symbols-outlined text-[14px]">call</span>
              {t("companion.crisis.hotlineLabel", "Tổng đài tư vấn tâm lý")}: {hotline}
            </a>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onTalkNow}
          className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-all active:scale-[0.98]">
          {t("companion.crisis.talkNow", "Tớ cần nói chuyện ngay")}
        </button>
        <button type="button" onClick={() => onResolve(flag.flagId || flag._id)}
          className="flex-1 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 text-[11px] font-bold transition-all active:scale-[0.98]">
          {t("companion.crisis.imSafe", "Tớ đã an toàn / đã liên hệ trợ giúp")}
        </button>
      </div>
    </motion.div>
  );
}

function JourneyCard({ duration, startDate, getProgressDay, onCancel, historyLogs, bio, showToast }) {
  const { t, i18n } = useTranslation();
  const [notifStatus, setNotifStatus] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const currentDay      = getProgressDay();
  const qualifiedCount  = countQualifiedActivities(historyLogs);
  const shortenedDays   = Math.floor(qualifiedCount * 0.6);
  const effectiveDur    = Math.max(1, duration - shortenedDays);
  const progressPercent = Math.min(100, Math.round((currentDay / duration) * 100) + qualifiedCount * 2);
  const startStr        = startDate ? new Date(startDate).toLocaleDateString(i18n.language.startsWith('en') ? "en-US" : "vi-VN") : t("companion.tab.today", "Hôm nay");

  const handleEnablePush = async () => {
    if (!webPushHelper.isSupported()) return;
    try {
      const perm = await webPushHelper.requestPermission();
      setNotifStatus(perm);
      if (perm === 'granted' && bio?.email) {
        await webPushHelper.registerAndSubscribe(bio.email);
        showToast?.(t('companion.tab.dailyReminderEnabled', 'Đã bật nhắc nhở hàng ngày!'), 'success');
      } else if (perm === 'denied') {
        showToast?.(t('companion.tab.pushDenied', 'Quyền thông báo bị từ chối. Bật lại trong cài đặt trình duyệt.'), 'warning');
      }
    } catch (_) { showToast?.(t('companion.tab.pushError', 'Không thể đăng ký thông báo lúc này.'), 'error'); }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/20 dark:via-zinc-900/10 rounded-2xl border border-emerald-555/20 dark:border-emerald-800/30 px-4 py-2.5 flex items-center justify-between gap-4 shadow-sm shadow-emerald-500/5 backdrop-blur-md">
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div className="relative shrink-0 flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-505 bg-emerald-500 animate-pulse" />
        </div>
        <div className="min-w-0 flex-1 flex flex-col md:flex-row md:items-center md:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Lộ trình</p>
              {shortenedDays > 0 && (
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  -{shortenedDays} ngày
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 leading-tight">
              Ngày {currentDay}/{effectiveDur} · Bắt đầu {startStr}
            </p>
          </div>
          {/* Thin progress bar side-by-side */}
          <div className="flex-grow flex items-center gap-2 mt-1 md:mt-0 min-w-[120px] max-w-xs">
            <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              />
            </div>
            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 shrink-0">{progressPercent}%</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 shrink-0">
        {webPushHelper.isSupported() && notifStatus !== 'granted' && (
          <button type="button" onClick={handleEnablePush} title={t("companion.tab.enablePush", "Bật nhắc nhở")}
            className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-[14px]">notifications</span>
          </button>
        )}
        <button type="button" onClick={onCancel} title={t("companion.tab.cancelRoadmap", "Dừng lộ trình")}
          className="w-7 h-7 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500/25 active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-[14px]">stop_circle</span>
        </button>
      </div>
    </div>
  );
}

// ── Settings Panel (bottom sheet mobile / modal desktop) ───────────────────────
function SettingsPanel({ onClose, bio, showToast, onClearMessages }) {
  const { t } = useTranslation();
  const [chatLeft, setChatLeft] = useState(10);
  const [chatMax, setChatMax] = useState(10);
  const [notifStatus, setNotifStatus] = useState(() => typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');

  // Server (rate_limit_service) is the source of truth for the daily chat budget.
  useEffect(() => {
    (async () => {
      const bot = new AIBot(bio);
      const data = await bot.getRemainingTokens();
      if (data) {
        if (typeof data.remaining === "number") setChatLeft(data.remaining);
        if (typeof data.max === "number") setChatMax(data.max);
      }
    })();
  }, [bio]);

  const handlePush = async () => {
    if (!webPushHelper.isSupported()) return;
    try {
      const perm = await webPushHelper.requestPermission();
      setNotifStatus(perm);
      if (perm === 'granted' && bio?.email) {
        await webPushHelper.registerAndSubscribe(bio.email);
        showToast?.(t('companion.tab.reminderEnabledToast', 'Đã bật nhắc nhở!'), 'success');
      }
    } catch (_) {}
  };

  const handleClearChat = () => {
    toast((tToast) => (
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-rose-555 dark:text-rose-400 text-lg mt-0.5 animate-pulse">warning</span>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">{t("companion.tab.confirmDeleteTitle", "Xác Nhận Xóa")}</h4>
            <p className="text-[10.5px] font-semibold text-slate-500 dark:text-zinc-450 mt-0.5 leading-relaxed whitespace-normal">
              {t("companion.tab.confirmDeleteDesc", "Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện không?")}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-zinc-800/80 pt-2.5">
          <button 
            onClick={() => toast.dismiss(tToast.id)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            {t("companion.tab.skip", "Bỏ qua")}
          </button>
          <button 
            onClick={() => {
              toast.dismiss(tToast.id);
              localStorage.removeItem('banhocduong_chat_messages');
              onClearMessages?.();
              toast.success(t('companion.tab.deleteChatSuccess', 'Đã xóa lịch sử trò chuyện.'), {
                style: {
                  background: document.documentElement.classList.contains('dark') ? '#12111a' : '#ffffff',
                  color: document.documentElement.classList.contains('dark') ? '#e4e4e7' : '#1f2937',
                  borderRadius: '12px',
                  border: '1px solid ' + (document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                }
              });
              onClose();
            }}
            className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all"
          >
            {t("companion.tab.confirmDeleteBtn", "Xác nhận Xóa")}
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: 'top-center',
      style: {
        background: document.documentElement.classList.contains('dark') ? '#12111a' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#e4e4e7' : '#1f2937',
        borderRadius: '16px',
        border: '1px solid ' + (document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15)',
        maxWidth: '350px',
        padding: '12px'
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[160] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        className="bg-white dark:bg-[#1c1c1e] rounded-t-3xl md:rounded-2xl w-full md:w-[400px] shadow-2xl border-t border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        {/* Drag handle */}
        <div className="pt-3 pb-1 flex justify-center md:hidden">
          <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center">
                <span className="material-symbols-outlined text-white dark:text-zinc-900 text-[17px]" style={{ fontVariationSettings:"'FILL' 1" }}>settings</span>
              </div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">{t("companion.tab.settingsHeader", "Cài đặt HugoPSY")}</h3>
            </div>
            <button type="button" onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-zinc-500 text-sm">close</span>
            </button>
          </div>

          {/* Token usage */}
          <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{t("companion.tab.aiLimitToday", "Giới hạn AI hôm nay")}</p>
            {[
              { label: t('companion.tab.limitChat', 'Cuộc trò chuyện'), left: chatLeft, max: chatMax, color: 'bg-[#0071e3]', low: chatLeft < 4 },
            ].map(item => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-zinc-600 dark:text-zinc-400">{item.label}</span>
                  <span className={item.low ? 'text-amber-500 font-black' : 'text-zinc-500'}>{item.left + (bio?.bonusChatTokens || 0)}/{item.max}</span>
                </div>
                <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${Math.min(100, ((item.left + (bio?.bonusChatTokens || 0)) / item.max) * 100)}%` }} />
                </div>
              </div>
            ))}
            {bio?.bonusChatTokens > 0 && (
              <div className="flex items-center gap-3 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/40">
                <span className="flex items-center gap-1 text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                  <span className="material-symbols-outlined text-[13px]">add_circle</span>
                  {bio.bonusChatTokens} {t("memberPortal.joy.store.chatTokens", "lượt chat")} {t("companion.tab.bonusLabel", "thưởng")}
                </span>
              </div>
            )}
            <p className="text-[9px] text-zinc-400 font-semibold">{t("companion.tab.tokenRefreshNote", "Token tự động làm mới lúc 00:00 mỗi ngày")}</p>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500 text-[17px]" style={{ fontVariationSettings:"'FILL' 1" }}>notifications_active</span>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{t("companion.tab.dailyReminder", "Nhắc nhở hằng ngày")}</p>
                <p className="text-[9px] text-zinc-400">{t("companion.tab.checkinSchedule", "Check-in cảm xúc + lộ trình")}</p>
              </div>
            </div>
            <button type="button" onClick={handlePush}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${
                notifStatus === 'granted'   ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                notifStatus === 'denied'    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400' :
                notifStatus === 'unsupported' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400' :
                'bg-[#0071e3] text-white shadow-sm shadow-[#0071e3]/20'
              }`}
              disabled={notifStatus === 'denied' || notifStatus === 'unsupported'}
            >
              {notifStatus === 'granted' ? t('companion.tab.activeStatus.granted', '✓ Đã bật') : notifStatus === 'denied' ? t('companion.tab.activeStatus.denied', 'Bị chặn') : notifStatus === 'unsupported' ? t('companion.tab.activeStatus.unsupported', 'Không hỗ trợ') : t('companion.tab.enableNow', 'Bật ngay')}
            </button>
          </div>

          {/* Danger zone */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{t("companion.tab.dangerZone", "Vùng nguy hiểm")}</p>
            <button type="button" onClick={handleClearChat}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-200/50 dark:border-red-900/20 hover:bg-red-500/10 transition-colors text-red-500 text-xs font-bold active:scale-[0.98]">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings:"'FILL' 1" }}>delete_sweep</span>
              {t("companion.tab.deleteChatToday", "Xóa lịch sử trò chuyện hôm nay")}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main BanhocduongTab ────────────────────────────────────────────────────────
export default function BanhocduongTab({ onBack, activeSubTab: activeSubTabProp, onSubTabChange, defaultPresetTest = null, bio, showToast, setFormData, handleSave, sleepAutoDetect }) {
  const { t } = useTranslation();
  useCompanionSessionTimer({ email: bio?.email, enabled: !!bio?.email });
  const [internalSubTab, setInternalSubTab] = useState(activeSubTabProp || "chat");
  const activeSubTab = activeSubTabProp || internalSubTab;
  const setActiveSubTab = onSubTabChange || setInternalSubTab;
  const [presetTest, setPresetTest]         = useState(defaultPresetTest);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSettings, setShowSettings]     = useState(false);
  const [clearMessagesKey, setClearMessagesKey] = useState(0); // bump to force ChatTab remount

  // DB state
  const [healingActive, setHealingActive]         = useState(false);
  const [healingDuration, setHealingDuration]     = useState(30);
  const [healingStartDate, setHealingStartDate]   = useState("");
  const [historyLogs, setHistoryLogs]             = useState([]);
  const [chatMessages, setChatMessages]           = useState([]);
  const [adaptationAlert, setAdaptationAlert]     = useState(null);
  const [crisisFlags, setCrisisFlags]             = useState([]);
  const [claimedChallengesToday, setClaimedChallengesToday] = useState([]);

  // ── Sync from DB ──────────────────────────────────────────────────────────────
  const syncWithDb = useCallback(async () => {
    if (!bio?.email) return;
    try {
      const db = await dataApi.getCompanionHistory(bio.email);
      if (!db) return;

      let shouldReset = false;
      if (db.healingStartDate && db.healingActive) {
        const start     = new Date(db.healingStartDate);
        const now       = new Date();
        const elapsed   = Math.floor((now - start) / 86_400_000) + 1;
        const newMonth  = now.getMonth() !== start.getMonth() || now.getFullYear() !== start.getFullYear();
        if (newMonth && elapsed > db.healingDuration) shouldReset = true;
      }

      if (shouldReset) {
        const payload = { email: bio.email, healingActive: false, healingDuration: 30, healingStartDate: "", historyLogs: [], chatMessages: [], lastCheckinDate: "", lastTestDate: "", chatDistressCount: 0 };
        await dataApi.saveCompanionHistory(payload);
        ['healing_mode','healing_duration','healing_start_date','history','last_checkin_date','last_test_date','chat_distress_count','chat_messages']
          .forEach(k => localStorage.removeItem(`banhocduong_${k}`));
        setHealingActive(false); setHealingDuration(30); setHealingStartDate(""); setHistoryLogs([]); setChatMessages([]);
        setClaimedChallengesToday([]);
      } else {
        setHealingActive(db.healingActive);
        setHealingDuration(db.healingDuration);
        setHealingStartDate(db.healingStartDate ? new Date(db.healingStartDate).toISOString() : "");
        setHistoryLogs(db.historyLogs || []);
        setChatMessages(db.chatMessages || []);
        setCrisisFlags(db.crisisFlags || []);
        setClaimedChallengesToday(db.claimedChallengesToday || []);
        localStorage.setItem("banhocduong_healing_mode",       db.healingActive ? "active" : "");
        localStorage.setItem("banhocduong_healing_duration",   db.healingDuration.toString());
        localStorage.setItem("banhocduong_healing_start_date", db.healingStartDate || "");
        localStorage.setItem("banhocduong_history",            JSON.stringify(db.historyLogs  || []));
        localStorage.setItem("banhocduong_chat_messages",      JSON.stringify(db.chatMessages || []));
        localStorage.setItem("banhocduong_last_checkin_date",  db.lastCheckinDate || "");
        localStorage.setItem("banhocduong_last_test_date",     db.lastTestDate    || "");
        localStorage.setItem("banhocduong_chat_distress_count",(db.chatDistressCount || 0).toString());
      }
    } catch (e) { console.error("BHD syncWithDb:", e); }
  }, [bio?.email]);

  useEffect(() => { syncWithDb(); }, [syncWithDb]);

  // ── Unified state updater ─────────────────────────────────────────────────────
  const handleUpdateCompanionState = useCallback(async (updates) => {
    if (!bio?.email) return;
    try {
      if (updates.healingActive  !== undefined) { localStorage.setItem("banhocduong_healing_mode",       updates.healingActive ? "active" : ""); setHealingActive(updates.healingActive); }
      if (updates.healingDuration !== undefined){ localStorage.setItem("banhocduong_healing_duration",   updates.healingDuration.toString());     setHealingDuration(updates.healingDuration); }
      if (updates.healingStartDate!== undefined){ localStorage.setItem("banhocduong_healing_start_date", updates.healingStartDate || "");          setHealingStartDate(updates.healingStartDate ? new Date(updates.healingStartDate).toISOString() : ""); }
      if (updates.historyLogs    !== undefined) { localStorage.setItem("banhocduong_history",            JSON.stringify(updates.historyLogs));      setHistoryLogs(updates.historyLogs); }
      if (updates.chatMessages   !== undefined) { localStorage.setItem("banhocduong_chat_messages",      JSON.stringify(updates.chatMessages));     setChatMessages(updates.chatMessages); }

      const isActive   = localStorage.getItem("banhocduong_healing_mode") === "active";
      const dur        = Math.max(1, parseInt(localStorage.getItem("banhocduong_healing_duration") || "30", 10));
      const start      = localStorage.getItem("banhocduong_healing_start_date") || "";
      const logs       = JSON.parse(localStorage.getItem("banhocduong_history") || "[]");
      const msgs       = JSON.parse(localStorage.getItem("banhocduong_chat_messages") || "[]");
      const distress   = Number(localStorage.getItem("banhocduong_chat_distress_count") || 0);

      const res = await dataApi.saveCompanionHistory({
        email: bio.email, healingActive: isActive, healingDuration: dur, healingStartDate: start,
        lastCheckinDate:    updates.lastCheckinDate  ?? (localStorage.getItem("banhocduong_last_checkin_date") || ""),
        lastTestDate:       updates.lastTestDate     ?? (localStorage.getItem("banhocduong_last_test_date")    || ""),
        chatDistressCount:  updates.chatDistressCount ?? distress,
        historyLogs: logs, chatMessages: msgs,
      });
      if (res?.companionHistory) {
        const db = res.companionHistory;
        setHealingActive(db.healingActive); setHealingDuration(db.healingDuration);
        setHealingStartDate(db.healingStartDate ? new Date(db.healingStartDate).toISOString() : "");
        setHistoryLogs(db.historyLogs || []); setChatMessages(db.chatMessages || []);
        setClaimedChallengesToday(db.claimedChallengesToday || []);
      }
    } catch (e) { console.error("BHD handleUpdateCompanionState:", e); }
  }, [bio?.email]);

  // ── Adaptation alert ──────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      const raw = localStorage.getItem("banhocduong_duration_adaptation_alert");
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        setAdaptationAlert(data);
        localStorage.removeItem("banhocduong_duration_adaptation_alert");
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#34d399','#f472b6','#38bdf8','#fbbf24'] });
        syncWithDb();
      } catch (_) {}
    };
    check();
    const t = setInterval(check, 1500);
    return () => clearInterval(t);
  }, [syncWithDb]);

  const handleSubTabChange = (id) => { setActiveSubTab(id); setPresetTest(null); };
  const handleNavigateToTab = (id, preset = null) => { setActiveSubTab(id); setPresetTest(preset); };

  const getProgressDay = useCallback(() => {
    if (!healingStartDate) return 1;
    return Math.floor((Date.now() - new Date(healingStartDate).getTime()) / 86_400_000) + 1;
  }, [healingStartDate]);

  const handleCancelHealing = () => {
    const qualifiedCount = countQualifiedActivities(historyLogs);
    const currentDay = getProgressDay();
    const progressPercent = Math.min(100, Math.round((currentDay / healingDuration) * 100) + qualifiedCount * 2);
    if (progressPercent < 60) {
      showToast?.(t('companion.tab.stopRoadmap.progressRequirement', { percent: progressPercent }, `Cần hoàn tất tối thiểu 60% chặng đường để dừng (hiện tại: ${progressPercent}%). Hãy kiên trì thêm nhé!`), 'warning');
      return;
    }
    setShowCancelModal(true);
  };

  const confirmCancelHealing = async () => {
    setShowCancelModal(false);
    await handleUpdateCompanionState({ healingActive: false, healingDuration: 30, healingStartDate: null, historyLogs });
    showToast?.(t('companion.tab.stopRoadmap.stoppedSuccess', 'Đã dừng lộ trình. Lịch sử vẫn được lưu đầy đủ!'), 'success');
  };

  const activeHighCrisisFlag = crisisFlags.find(f => f.severity === 'high' && !f.resolved);

  const handleResolveCrisis = async (flagId) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const r = await fetch(`${apiBase}/companion/crisis/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: bio.email, flagId }),
      });
      const data = await r.json();
      if (r.ok) setCrisisFlags(data.crisisFlags || []);
    } catch (e) { console.error("BHD crisis resolve:", e); }
  };

  const handleClaimChallenge = async (challengeId) => {
    if (!bio?.email) return;
    try {
      const res = await dataApi.claimChallengeReward(bio.email, challengeId);
      if (res && res.success) {
        setClaimedChallengesToday(res.claimedChallengesToday || []);
        return res;
      }
    } catch (err) {
      showToast?.(err.message || "Không thể nhận phần thưởng lúc này.", "error");
      throw err;
    }
  };

  const activeTab = SUB_TABS.find(t => t.id === activeSubTab);

  return (
    <div className="flex flex-col min-h-[calc(100svh-160px)] md:min-h-0 space-y-3 md:space-y-2.5 animate-fadeIn">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="relative z-20 flex items-center justify-between gap-3">
        <SubUtilityHeader
          title={t("companion.tab.title", "HugoPSY")}
          icon="psychology"
          colorClass="text-emerald-500"
          onBack={onBack}
        />
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
          title={t("companion.tab.settings", "Cài đặt")}
        >
          <span className="material-symbols-outlined text-[17px]">settings</span>
        </button>
      </div>

      {/* ── Crisis escalation banner ──────────────────────────────────────────── */}
      {activeHighCrisisFlag && (
        <CrisisBanner
          flag={activeHighCrisisFlag}
          onResolve={handleResolveCrisis}
          onTalkNow={() => setActiveSubTab("chat")}
        />
      )}

      {/* ── Journey progress card ─────────────────────────────────────────────── */}
      {healingActive && (
        <JourneyCard
          duration={healingDuration}
          startDate={healingStartDate}
          getProgressDay={getProgressDay}
          onCancel={handleCancelHealing}
          historyLogs={historyLogs}
          bio={bio}
          showToast={showToast}
        />
      )}

      {/* ── Mobile tab pills ──────────────────────────────────────────────────── */}
      <div className="md:hidden flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
        {SUB_TABS.map(tab => {
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSubTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl shrink-0 transition-all duration-200 active:scale-[0.97] ${
                active
                  ? `bg-gradient-to-r ${tab.grad} text-white shadow-md`
                  : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-sm'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
              <span className="text-[11px] font-extrabold whitespace-nowrap">{t(`companion.tab.${tab.id}`, tab.label)}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main workspace ────────────────────────────────────────────────────── */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Desktop sidebar (md+) */}
        <aside className="hidden md:flex flex-col gap-2 w-[56px] lg:w-[190px] shrink-0">
          {SUB_TABS.map(tab => {
            const active = activeSubTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => handleSubTabChange(tab.id)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 relative font-bold border text-[11px] ${
                  active
                    ? 'bg-gradient-to-r from-blue-500/15 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25 dark:border-blue-500/30 shadow-sm shadow-blue-500/5 backdrop-blur-md'
                    : 'bg-white/40 dark:bg-[#12111a]/20 border-zinc-200/40 dark:border-zinc-800/30 text-zinc-500 dark:text-zinc-400 hover:bg-white/80 dark:hover:bg-[#1a1924]/40 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="activeTabIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
                <span className="font-extrabold uppercase tracking-wide hidden lg:block text-left">{t(`companion.tab.${tab.id}`, tab.label)}</span>
              </motion.button>
            );
          })}
        </aside>

        {/* Content area */}
        <div className="flex-1 min-w-0 bg-white/80 dark:bg-[#12111a]/80 backdrop-blur-2xl rounded-3xl border border-zinc-200/40 dark:border-zinc-800/50 shadow-lg overflow-hidden flex flex-col relative">
          {/* Subtle animated background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-[80px]" />
          </div>

          <div className="relative z-10 flex-1 flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSubTab}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="flex-1 flex flex-col min-h-0 h-full"
              >
                {activeSubTab === "chat" && (
                  <ChatTab
                    key={clearMessagesKey}
                    onNavigateToTab={handleNavigateToTab}
                    bio={bio}
                    historyLogs={historyLogs}
                    onUpdateCompanionState={handleUpdateCompanionState}
                    chatMessages={chatMessages}
                    presetTest={presetTest}
                    setPresetTest={setPresetTest}
                    showToast={showToast}
                    healingActive={healingActive}
                    onProfileUpdate={(newFields) => {
                      if (setFormData && handleSave) {
                        setFormData(prev => {
                          const updated = { ...prev, ...newFields };
                          setTimeout(() => handleSave({ preventDefault: () => {} }, updated), 0);
                          return updated;
                        });
                      }
                    }}
                  />
                )}
                {activeSubTab === "therapy" && (
                  <TherapyTab
                    onNavigateToTab={handleNavigateToTab}
                    bio={bio}
                    historyLogs={historyLogs}
                    chatMessages={chatMessages}
                    claimedChallengesToday={claimedChallengesToday}
                    onClaimChallenge={handleClaimChallenge}
                    onUpdateCompanionState={handleUpdateCompanionState}
                    healingActive={healingActive}
                    showToast={showToast}
                    initialMethod={presetTest}
                    onBioUpdate={(newFields) => {
                      if (setFormData && handleSave) {
                        setFormData(prev => {
                          const updated = { ...prev, ...newFields };
                          setTimeout(() => handleSave({ preventDefault: () => {} }, updated), 0);
                          return updated;
                        });
                      }
                    }}
                  />
                )}
                {activeSubTab === "sleep" && (
                  <div className="flex-1 overflow-y-auto p-4"><SleepTracker bio={bio} sleepAutoDetect={sleepAutoDetect} /></div>
                )}
                {activeSubTab === "evaluation" && (
                  <EvaluationTab onNavigateToTab={handleNavigateToTab} bio={bio} historyLogs={historyLogs} showToast={showToast} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Settings panel ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            bio={bio}
            showToast={showToast}
            onClearMessages={() => { setChatMessages([]); setClearMessagesKey(k => k + 1); }}
          />
        )}
      </AnimatePresence>

      {/* ── Adaptation alert modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {adaptationAlert && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-emerald-500/20 p-6 max-w-sm w-full shadow-2xl text-center space-y-5 overflow-hidden"
            >
              <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full -mx-6 -mt-6 mb-2" />
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings:"'FILL' 1" }}>auto_awesome</span>
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">{t("companion.tab.adaptiveAlert.title", "Tiến triển xuất sắc!")}</h4>
                <p className="text-[11px] text-zinc-500 mt-1">{t("companion.tab.adaptiveAlert.subtitle", "Lộ trình đồng hành thích ứng")}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 text-left space-y-2">
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {t("companion.tab.adaptiveAlert.recorded", "Ghi nhận:")} <span className="text-emerald-600 dark:text-emerald-400 font-bold">{adaptationAlert.improvement}</span>
                </p>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {t("companion.tab.adaptiveAlert.reduced", { count: adaptationAlert.reducedDays }, `Rút ngắn: -${adaptationAlert.reducedDays} ngày`)}
                </p>
                <div className="flex justify-between text-[10px] font-bold text-zinc-500 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                  <span>{t("companion.tab.adaptiveAlert.before", { count: adaptationAlert.oldDuration }, `Trước: ${adaptationAlert.oldDuration} ngày`)}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{t("companion.tab.adaptiveAlert.newDuration", { count: adaptationAlert.newDuration }, `Mới: ${adaptationAlert.newDuration} ngày`)}</span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 italic">{t("companion.tab.adaptiveAlert.encouragement", "\"Cậu đang làm rất tốt — tiếp tục nhé!\"")}</p>
              <button type="button" onClick={() => setAdaptationAlert(null)}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-extrabold uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all">
                {t("companion.tab.adaptiveAlert.btn", "Tuyệt vời, tiếp tục thôi!")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cancel journey confirmation ───────────────────────────────────────── */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-red-500/20 p-6 max-w-sm w-full shadow-2xl text-center space-y-5"
            >
              <div className="h-1 bg-gradient-to-r from-red-500 via-orange-400 to-red-500 rounded-full -mx-6 -mt-6 mb-2" />
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-red-500 text-3xl" style={{ fontVariationSettings:"'FILL' 1" }}>warning</span>
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">{t("companion.tab.stopRoadmap.title", "Dừng lộ trình?")}</h4>
                <p className="text-[11px] text-zinc-500 mt-1">{t("companion.tab.stopRoadmap.subtitle", "Thao tác này không thể hoàn tác")}</p>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed text-left bg-red-50 dark:bg-red-900/10 rounded-xl p-3 border border-red-200/50 dark:border-red-900/20">
                {t("companion.tab.stopRoadmap.desc", "Dữ liệu check-in, lịch sử trắc nghiệm và nhật ký cảm xúc sẽ bị xóa vĩnh viễn. Cậu có chắc chắn không?")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setShowCancelModal(false)}
                  className="py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  {t("companion.tab.stopRoadmap.cancel", "Quay lại")}
                </button>
                <button type="button" onClick={confirmCancelHealing}
                  className="py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-extrabold shadow-md shadow-red-500/20 active:scale-[0.98] transition-all">
                  {t("companion.tab.stopRoadmap.confirm", "Xác nhận dừng")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
