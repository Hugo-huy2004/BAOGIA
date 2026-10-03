import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { BorderBeam } from "border-beam";
import dataApi from "../../../services/api/modules/dataApi";
import { webPushHelper } from "../../../utils/webPushHelper";
import { useTranslation } from "react-i18next";
import { useCompanionSessionTimer } from "../../../hooks/useCompanionSessionTimer";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { notify } from "../../../lib/notify";
import { sensory } from "../../../lib/sensory";
import { DEFAULT_HOTLINES } from "./constants/hotlines";
import EmergencySiren from "./EmergencySiren";
import { AnimulaAvatar } from "./AnimulaAvatar";
import { COMPANIONS, companionById, recommendCompanion, resolveCompanion, saveCompanionChoice } from "./constants/companions";
import "../../../styles/hugoPsy.css";
import { isStandalone } from "../../../config/platform";

import AppFrame from "../os/AppFrame";
import LazyBoundary from "../os/LazyBoundary";

const ChatTab = React.lazy(() => import("./ChatTab"));
const TherapyTab = React.lazy(() => import("./TherapyTab"));
const EvaluationTab = React.lazy(() => import("./EvaluationTab"));
const SleepTracker = React.lazy(() => import("./SleepTracker"));

// ── Chat là màn chính, ba màn còn lại là lối tắt trên thanh tiêu đề ────────────
// App chat 100%: không thanh tab dưới. Bản cũ có BA bộ điều hướng tự dựng (pill
// mobile, sidebar desktop, 3 nút nhanh trong chat) cho cùng bốn màn này. Nhân vật
// trong chat cũng tự mở các màn này khi người dùng hỏi (onNavigateToTab).
const SUB_TABS = [
  { id: "chat", label: "Tâm sự", icon: "forum" },
  { id: "therapy", label: "Thư giãn", icon: "spa" },
  { id: "sleep", label: "Giấc ngủ", icon: "bedtime" },
  { id: "evaluation", label: "Đánh giá", icon: "monitoring" },
];
const TAB_IDS = SUB_TABS.map((tab) => tab.id);
// Khách dùng thử chỉ có dữ liệu cục bộ — hai màn này đọc dữ liệu tài khoản.
const ACCOUNT_ONLY_TABS = ["sleep", "evaluation"];

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

function cacheCompanionSnapshot(db = {}) {
  localStorage.setItem("banhocduong_healing_mode", db.healingActive ? "active" : "");
  localStorage.setItem("banhocduong_healing_duration", String(db.healingDuration || 30));
  localStorage.setItem("banhocduong_healing_start_date", db.healingStartDate || "");
  localStorage.setItem("banhocduong_history", JSON.stringify(db.historyLogs || []));
  localStorage.setItem("banhocduong_chat_messages", JSON.stringify(db.chatMessages || []));
  localStorage.setItem("banhocduong_last_checkin_date", db.lastCheckinDate || "");
  localStorage.setItem("banhocduong_last_test_date", db.lastTestDate || "");
  localStorage.setItem("banhocduong_chat_distress_count", String(db.chatDistressCount || 0));
}

// Lớp phủ dùng chung cho mọi hộp thoại của app: nền tối + bám safe-area.
function Overlay({ children, onClose, z = "z-[160]", sheet = false }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={`psy-modal-safe-layer fixed inset-0 ${z} flex justify-center bg-black/55 ${sheet ? "items-end md:items-center p-0 md:p-4" : "items-center p-4"}`}
      onClick={(e) => { if (onClose && e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </motion.div>
  );
}

// ── Crisis popup ───────────────────────────────────────────────────────────────
// Một hộp thoại cho mọi màn hình. Bản cũ có hai biến thể (thẻ đầy đủ ở desktop,
// popup ở mobile) với cùng danh sách số — giờ là một, và đóng tạm thời thì nút
// SOS trên thanh tiêu đề mở lại được, nên đường dây nóng không bao giờ mất lối.
function CrisisDialog({ flag, onResolve, onDismiss }) {
  const { t } = useTranslation();
  const adminHotline = import.meta.env.VITE_CRISIS_HOTLINE || "";
  const lines = [
    ...DEFAULT_HOTLINES,
    ...(adminHotline ? [{ label: t("companion.crisis.hotlineLabel", "Tổng đài tư vấn tâm lý"), number: adminHotline }] : []),
  ];

  return (
    <Overlay z="z-[300]" onClose={onDismiss}>
      <BorderBeam size="md" colorVariant="sunset" strength={0.9} borderRadius={28} className="w-full max-w-sm">
        <motion.div
          role="alertdialog"
          aria-labelledby="psy-crisis-title"
          initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full rounded-[28px] border border-border bg-card p-5 space-y-4"
        >
          <button type="button" onClick={onDismiss}
            className="absolute top-2 right-2 w-11 h-11 rounded-full text-muted-foreground flex items-center justify-center active:scale-95 transition-transform"
            aria-label={t("hugoPsy.tab.dongTamThoi")}>
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div className="flex flex-col items-center text-center gap-2 pt-1">
            <span className="w-14 h-14 rounded-full bg-rose-500/12 flex items-center justify-center">
              <span className="material-symbols-outlined text-rose-500 text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
            </span>
            <p id="psy-crisis-title" className="text-[17px] font-bold text-foreground">{t("companion.crisis.title", "Bạn không một mình")}</p>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              {t("companion.crisis.descShort", "Nếu đang gặp nguy hiểm tức thời, hãy gọi ngay các số dưới đây hoặc liên hệ người thân đáng tin cậy.")}
            </p>
          </div>

          <div className="space-y-1.5">
            {lines.map((h) => (
              <a key={h.number} href={`tel:${h.number}`}
                className="flex min-h-[48px] items-center justify-between gap-3 px-4 rounded-2xl bg-rose-500/10 active:scale-[0.98] transition-transform">
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-foreground truncate">{h.label}</span>
                  {h.note && <span className="block text-[13px] text-muted-foreground">{h.note}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-[15px] font-bold text-rose-600 dark:text-rose-400">
                  <span className="material-symbols-outlined text-[18px]">call</span>{h.display || h.number}
                </span>
              </a>
            ))}
          </div>

          <div className="flex gap-2">
            <EmergencySiren />
            <button type="button" onClick={() => onResolve(flag.flagId || flag._id)}
              className="flex-1 min-h-[44px] rounded-2xl border border-border text-foreground text-[15px] font-semibold active:scale-[0.98] transition-transform">
              {t("companion.crisis.imSafeShort", "Tớ đã an toàn")}
            </button>
          </div>
        </motion.div>
      </BorderBeam>
    </Overlay>
  );
}

// ── Settings (bottom sheet mobile / modal desktop) ─────────────────────────────
// Thẻ "Lộ trình" từng nằm cố định trên đầu app, chiếm một hàng trên mọi màn.
// Tiến độ nay ở phụ đề thanh tiêu đề; nút dừng + bật nhắc nhở dời vào đây.
function SettingsPanel({ onClose, bio, showToast, historyLogs, onClearMessages, journey, onCancelJourney }) {
  const { t } = useTranslation();
  const [notifStatus, setNotifStatus] = useState(() => typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');

  const { totalDays, streak, lastTest } = useMemo(() => {
    const logs = historyLogs || [];
    const dayStrings = new Set(logs.map(l => new Date(l.date).toDateString()));

    let streakCount = 0;
    const checkinDays = new Set(logs.filter(l => l.type === "checkin" && l.mood).map(l => new Date(l.date).toDateString()));
    const cursor = new Date();
    if (!checkinDays.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
    while (checkinDays.has(cursor.toDateString())) {
      streakCount++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const testLogs = logs.filter(l => l.test).sort((a, b) => new Date(b.date) - new Date(a.date));
    let lastTestInfo = null;
    if (testLogs.length > 0) {
      const latest = testLogs[0];
      const daysAgo = Math.floor((Date.now() - new Date(latest.date).getTime()) / 86_400_000);
      lastTestInfo = {
        name: latest.test.toUpperCase(),
        when: daysAgo <= 0 ? "hôm nay" : daysAgo === 1 ? "hôm qua" : `${daysAgo} ngày trước`
      };
    }

    return { totalDays: dayStrings.size, streak: streakCount, lastTest: lastTestInfo };
  }, [historyLogs]);

  const handlePush = async () => {
    if (!webPushHelper.isSupported()) return;
    try {
      const perm = await webPushHelper.requestPermission();
      setNotifStatus(perm);
      if (perm === 'granted' && bio?.email) {
        await webPushHelper.registerAndSubscribe(bio.email);
        showToast?.(t('companion.tab.reminderEnabledToast', 'Đã bật nhắc nhở!'), 'success');
      } else if (perm === 'denied') {
        showToast?.(t('companion.tab.pushDenied', 'Quyền thông báo bị từ chối. Bật lại trong cài đặt trình duyệt.'), 'warning');
      }
    } catch { showToast?.(t('companion.tab.pushError', 'Không thể đăng ký thông báo lúc này.'), 'error'); }
  };

  const handleClearChat = async () => {
    const ok = await notify.confirm({
      title: t("companion.tab.confirmDeleteTitle", "Xác Nhận Xóa"),
      message: t("companion.tab.confirmDeleteDesc", "Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện không?"),
      cancelText: t("companion.tab.skip", "Bỏ qua"),
      confirmText: t("companion.tab.confirmDeleteBtn", "Xác nhận Xóa"),
      danger: true,
    });
    if (!ok) return;
    localStorage.removeItem('banhocduong_chat_messages');
    onClearMessages?.();
    notify.success(t('companion.tab.deleteChatSuccess', 'Đã xóa lịch sử trò chuyện.'));
    onClose();
  };

  const stats = [
    { value: totalDays, label: t("companion.tab.statsDays", "Ngày đồng hành") },
    { value: streak, label: t("companion.tab.statsStreak", "Streak check-in") },
    { value: lastTest ? lastTest.name : "—", label: lastTest ? lastTest.when : t("companion.tab.statsNoTest", "Chưa test") },
  ];
  const rowLabel = "text-[13px] font-semibold uppercase tracking-wide text-muted-foreground";

  return (
    <Overlay z="z-[1100]" sheet onClose={onClose}>
      <motion.div
        role="dialog"
        aria-label={t("companion.tab.settingsHeader", "Cài đặt HugoPSY")}
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        className="w-full md:w-[440px] max-h-[88dvh] overflow-y-auto rounded-t-[28px] md:rounded-[28px] border border-border bg-card"
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
      >
        <div className="pt-2.5 flex justify-center md:hidden">
          <div className="w-10 h-1 bg-muted-foreground/25 rounded-full" />
        </div>

        <div className="px-5 pt-3 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-bold text-foreground">{t("companion.tab.settingsHeader", "Cài đặt HugoPSY")}</h3>
            <button type="button" onClick={onClose} aria-label={t("common.close", "Đóng")}
              className="-mr-2 w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          {(totalDays > 0 || streak > 0 || lastTest) && (
            <div className="grid grid-cols-3 divide-x divide-border rounded-2xl bg-muted/50">
              {stats.map((s) => (
                <div key={s.label} className="px-2 py-3 text-center min-w-0">
                  <p className="text-[17px] font-bold text-foreground truncate">{s.value}</p>
                  <p className="text-[13px] text-muted-foreground mt-0.5 truncate">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {journey && (
            <section className="space-y-2">
              <p className={rowLabel}>{t("hugoPsy.tab.loTrinh")}</p>
              <div className="flex items-center justify-between text-[15px]">
                <span className="text-foreground">{t("hugoPsy.tab.ngay2")} {journey.currentDay}/{journey.duration}</span>
                <span className="font-bold text-foreground">{journey.percent}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${journey.percent}%` }} />
              </div>
              <button type="button" onClick={onCancelJourney}
                className="w-full min-h-[44px] rounded-2xl border border-border text-[15px] font-semibold text-rose-600 dark:text-rose-400 active:scale-[0.98] transition-transform">
                {t("companion.tab.cancelRoadmap", "Dừng lộ trình")}
              </button>
            </section>
          )}

          <section className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-foreground">{t("companion.tab.dailyReminder", "Nhắc nhở hằng ngày")}</p>
              <p className="text-[13px] text-muted-foreground">{t("companion.tab.checkinSchedule", "Check-in cảm xúc + lộ trình")}</p>
            </div>
            <button type="button" onClick={handlePush}
              disabled={notifStatus !== 'default'}
              className={`min-h-[44px] shrink-0 px-4 rounded-full text-[15px] font-semibold transition-colors ${
                notifStatus === 'default' ? 'text-white' : 'bg-muted text-muted-foreground'
              }`}
              style={notifStatus === 'default' ? { background: "var(--ax, #0A84FF)" } : undefined}
            >
              {notifStatus === 'granted' ? t('companion.tab.activeStatus.granted', 'Đã bật') : notifStatus === 'denied' ? t('companion.tab.activeStatus.denied', 'Bị chặn') : notifStatus === 'unsupported' ? t('companion.tab.activeStatus.unsupported', 'Không hỗ trợ') : t('companion.tab.enableNow', 'Bật ngay')}
            </button>
          </section>

          <section className="pt-4 border-t border-border">
            <button type="button" onClick={handleClearChat}
              className="w-full min-h-[48px] flex items-center gap-3 px-4 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[15px] font-semibold active:scale-[0.98] transition-transform">
              <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
              {t("companion.tab.deleteChatToday", "Xóa lịch sử trò chuyện hôm nay")}
            </button>
          </section>
        </div>
      </motion.div>
    </Overlay>
  );
}

// ── Chọn nhân vật đồng hành ────────────────────────────────────────────────────
function StatBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <span className="w-[76px] shrink-0">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </span>
      <span className="w-9 text-right tabular-nums">{value}%</span>
    </div>
  );
}

function CompanionSheet({ current, auto, recommendedId, onPick, onClose }) {
  const dark = document.documentElement.classList.contains("dark");
  return (
    <Overlay z="z-[1100]" sheet onClose={onClose}>
      <motion.div
        role="dialog"
        aria-label="Chọn người đồng hành"
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        className="w-full md:w-[640px] max-h-[90dvh] overflow-y-auto rounded-t-[28px] md:rounded-[28px] border border-border bg-card px-4 pt-3"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-start justify-between gap-3 px-1">
          <div>
            <h3 className="text-[17px] font-bold text-foreground">Người đồng hành</h3>
            <p className="text-[15px] text-muted-foreground">Mỗi màu đồng hành một chiều cảm xúc, suốt lộ trình của cậu.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng"
            className="-mr-2 w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-muted-foreground">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <button type="button" onClick={() => onPick("auto")}
          className={`mt-3 flex w-full min-h-[52px] items-center gap-3 rounded-2xl border px-4 text-left ${auto ? "border-foreground/30 bg-muted" : "border-border"}`}>
          <span className="material-symbols-outlined text-[22px] text-foreground">auto_mode</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-foreground">Tự động theo đánh giá</span>
            <span className="block text-[13px] text-muted-foreground">
              Hiện hợp với cậu: {COMPANIONS.find((c) => c.id === recommendedId)?.name}
            </span>
          </span>
          {auto && <span className="material-symbols-outlined text-[22px] text-foreground">check</span>}
        </button>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {COMPANIONS.map((c) => {
            const selected = !auto && current.id === c.id;
            const card = (
              <button type="button" onClick={() => onPick(c.id)}
                className={`flex w-full items-start gap-3 rounded-[22px] border bg-card p-3.5 text-left transition active:scale-[0.98] ${selected ? "border-transparent" : "border-border"}`}>
                <AnimulaAvatar size={56} type={c.type} color={c.color} interactive={false} />
                <span className="min-w-0 flex-1 space-y-1.5">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[17px] font-bold text-foreground">{c.name}</span>
                    <span className="text-[13px] text-muted-foreground">{c.mood}</span>
                  </span>
                  <span className="block text-[13px] text-muted-foreground">{c.tagline}</span>
                  <StatBar label="Thông minh" value={c.stats.smart} color={c.color} />
                  <StatBar label="Hài hước" value={c.stats.humor} color={c.color} />
                  <StatBar label="Thẳng thắn" value={c.stats.honest} color={c.color} />
                </span>
              </button>
            );
            return selected ? (
              <BorderBeam key={c.id} size="md" colorVariant="colorful" theme={dark ? "dark" : "light"} strength={0.9} borderRadius={22}>
                {card}
              </BorderBeam>
            ) : <div key={c.id}>{card}</div>;
          })}
        </div>
      </motion.div>
    </Overlay>
  );
}

// ── Hoạt cảnh chuyển ca ────────────────────────────────────────────────────────
// Nhân vật cũ vẫy tay lùi ra, nhân vật mới nhảy vào — đổi nhân vật là một khoảnh
// khắc trong câu chuyện, không phải đổi một cài đặt.
function CompanionHandoff({ from, to, auto, onDone }) {
  useEffect(() => {
    confetti({ particleCount: 70, spread: 75, origin: { y: 0.45 }, colors: [to.color, "#ffffff"] });
    const timer = setTimeout(onDone, 3200);
    return () => clearTimeout(timer);
  }, [to, onDone]);
  const dark = document.documentElement.classList.contains("dark");

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="psy-modal-safe-layer fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-6"
      onClick={onDone}
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
        <div className="relative flex h-36 w-full items-end justify-center">
          {from && (
            <motion.div
              className="absolute"
              initial={{ x: 0, opacity: 1, scale: 1, rotate: 0 }}
              animate={{ x: -110, opacity: 0, scale: 0.6, rotate: [0, -14, 14, -14, 0] }}
              transition={{ duration: 1.1, ease: "easeIn" }}
            >
              <AnimulaAvatar size={88} type={from.type} color={from.color} interactive={false} />
            </motion.div>
          )}
          <motion.div
            className="absolute"
            initial={{ y: -160, opacity: 0, scale: 0.6 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 260, damping: 14 }}
          >
            <AnimulaAvatar size={120} type={to.type} color={to.color} state="working" interactive={false} />
          </motion.div>
        </div>

        <motion.div
          className="w-full"
          initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <BorderBeam size="md" colorVariant="colorful" theme={dark ? "dark" : "light"} strength={0.9} borderRadius={24}>
            <div className="rounded-[24px] border border-border bg-card px-5 py-4">
              <p className="text-[17px] font-bold text-foreground">
                {from ? `${from.name} chuyển ca cho ${to.name}` : `${to.name} đến rồi đây!`}
              </p>
              <p className="mt-1 text-[15px] text-muted-foreground">
                {auto
                  ? `Theo nhịp cảm xúc gần đây của cậu, ${to.name} sẽ đồng hành tiếp chặng này.`
                  : to.tagline}
              </p>
            </div>
          </BorderBeam>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Hộp thoại xác nhận/thông báo nhỏ dùng chung cho hai modal còn lại.
function Dialog({ icon, tone, title, subtitle, children, actions }) {
  return (
    <Overlay>
      <BorderBeam size="md" colorVariant={tone === "danger" ? "sunset" : "forest"} strength={0.85} borderRadius={28} className="max-w-sm w-full">
        <motion.div
          role="dialog"
          initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }}
          className="rounded-[28px] border border-border bg-card p-6 w-full text-center space-y-4"
        >
          <span className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center ${tone === "danger" ? "bg-rose-500/12 text-rose-500" : "bg-emerald-500/12 text-emerald-600"}`}>
            <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          </span>
          <div>
            <h4 className="text-[17px] font-bold text-foreground">{title}</h4>
            <p className="text-[15px] text-muted-foreground mt-1">{subtitle}</p>
          </div>
          {children}
          {actions}
        </motion.div>
      </BorderBeam>
    </Overlay>
  );
}

// ── Main BanhocduongTab ────────────────────────────────────────────────────────
export default function BanhocduongTab({ onBack, route: routeProp, onRouteChange, defaultPresetTest = null, bio, showToast, setFormData, handleSave, sleepAutoDetect, isGuestMode = false, requireAccount }) {
  const { t } = useTranslation();
  useCompanionSessionTimer({ email: bio?.email, enabled: !!bio?.email });

  const [internalTab, setInternalTab] = useState(routeProp || "chat");
  const requestedTab = routeProp || internalTab;
  const activeTab = TAB_IDS.includes(requestedTab) ? requestedTab : "chat";
  const setActiveTab = onRouteChange || setInternalTab;
  const [presetTest, setPresetTest]           = useState(defaultPresetTest);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSettings, setShowSettings]       = useState(false);
  const [showCompanions, setShowCompanions]   = useState(false);
  const [showMenu, setShowMenu]               = useState(false);
  const [companionTick, setCompanionTick]     = useState(0);
  const [companionMood, setCompanionMood]     = useState("");
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
  const memberEmail = bio?.email || "";

  // ── Sync from DB ──────────────────────────────────────────────────────────────
  const applyCompanionSnapshot = useCallback((db) => {
    setHealingActive(Boolean(db.healingActive));
    setHealingDuration(db.healingDuration || 30);
    setHealingStartDate(db.healingStartDate ? new Date(db.healingStartDate).toISOString() : "");
    setHistoryLogs(db.historyLogs || []);
    setChatMessages(db.chatMessages || []);
    setCrisisFlags(db.crisisFlags || []);
    setClaimedChallengesToday(db.claimedChallengesToday || []);
    cacheCompanionSnapshot(db);
  }, []);

  // Chỉ sau lần đồng bộ đầu tiên mới biết kết quả đánh giá thật — trước đó
  // historyLogs rỗng và hệ thống sẽ gợi ý nhầm nhân vật mặc định.
  const [synced, setSynced] = useState(!memberEmail);
  const syncWithDb = useCallback(async () => {
    if (!memberEmail) return;
    try {
      const db = await dataApi.getCompanionHistory(memberEmail);
      if (db) applyCompanionSnapshot(db);
    } catch (e) { console.error("BHD syncWithDb:", e); }
    finally { setSynced(true); }
  }, [memberEmail, applyCompanionSnapshot]);

  useEffect(() => { syncWithDb(); }, [syncWithDb]);

  // ── Unified state updater ─────────────────────────────────────────────────────
  const handleUpdateCompanionState = useCallback(async (updates) => {
    if (!memberEmail) return null;
    try {
      const isActive   = updates.healingActive ?? healingActive;
      const dur        = Math.max(1, Number(updates.healingDuration ?? healingDuration) || 30);
      const start      = updates.healingStartDate ?? healingStartDate;
      const logs       = updates.historyLogs ?? historyLogs;
      const msgs       = updates.chatMessages ?? chatMessages;
      const distress   = Number(localStorage.getItem("banhocduong_chat_distress_count") || 0);

      const res = await dataApi.saveCompanionHistory({
        email: memberEmail, healingActive: isActive, healingDuration: dur, healingStartDate: start,
        lastCheckinDate:    updates.lastCheckinDate  ?? (localStorage.getItem("banhocduong_last_checkin_date") || ""),
        lastTestDate:       updates.lastTestDate     ?? (localStorage.getItem("banhocduong_last_test_date")    || ""),
        chatDistressCount:  updates.chatDistressCount ?? distress,
        historyLogs: logs, chatMessages: msgs,
      });
      if (res?.companionHistory) {
        applyCompanionSnapshot(res.companionHistory);
      }
      return res?.companionHistory || null;
    } catch (e) {
      console.error("BHD handleUpdateCompanionState:", e);
      showToast?.("HugoPSY chưa thể đồng bộ dữ liệu. Vui lòng thử lại.", "error");
      return null;
    }
  }, [memberEmail, healingActive, healingDuration, healingStartDate, historyLogs, chatMessages, applyCompanionSnapshot, showToast]);

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
      } catch {}
    };
    check();
    const timer = setInterval(check, 1500);
    return () => clearInterval(timer);
  }, [syncWithDb]);

  const handleTabChange = (id) => {
    if (isGuestMode && ACCOUNT_ONLY_TABS.includes(id)) { requireAccount?.(); return; }
    sensory.tap();
    setActiveTab(id);
    setPresetTest(null);
  };
  // Stable reference — keeps ChatMessages' React.memo effective.
  const handleNavigateToTab = useCallback((id, preset = null) => { setActiveTab(id); setPresetTest(preset); }, [setActiveTab]);

  const getProgressDay = useCallback(() => {
    if (!healingStartDate) return 1;
    return Math.floor((Date.now() - new Date(healingStartDate).getTime()) / 86_400_000) + 1;
  }, [healingStartDate]);

  const journeyProgress = useMemo(() => {
    if (!healingActive) return null;
    const currentDay = getProgressDay();
    const qualifiedCount = countQualifiedActivities(historyLogs);
    const effectiveDur = Math.max(1, healingDuration - Math.floor(qualifiedCount * 0.6));
    const percent = Math.min(100, Math.round((currentDay / healingDuration) * 100) + qualifiedCount * 2);
    return { currentDay, duration: effectiveDur, percent };
  }, [healingActive, healingDuration, historyLogs, getProgressDay]);

  const handleCancelHealing = () => {
    const percent = journeyProgress?.percent ?? 0;
    if (percent < 60) {
      showToast?.(t('companion.tab.stopRoadmap.progressRequirement', { percent }, `Cần hoàn tất tối thiểu 60% chặng đường để dừng (hiện tại: ${percent}%). Hãy kiên trì thêm nhé!`), 'warning');
      return;
    }
    setShowSettings(false);
    setShowCancelModal(true);
  };

  const confirmCancelHealing = async () => {
    setShowCancelModal(false);
    await handleUpdateCompanionState({ healingActive: false, healingDuration: 30, healingStartDate: null, historyLogs });
    showToast?.(t('companion.tab.stopRoadmap.stoppedSuccess', 'Đã dừng lộ trình. Lịch sử vẫn được lưu đầy đủ!'), 'success');
  };

  const activeHighCrisisFlag = crisisFlags.find(f => f.severity === 'high' && !f.resolved);

  // X hides the popup for this session without resolving; a NEW flag shows it again.
  const [crisisPopupDismissed, setCrisisPopupDismissed] = useState(false);
  const activeCrisisFlagId = activeHighCrisisFlag?.flagId || activeHighCrisisFlag?._id || null;
  useEffect(() => { setCrisisPopupDismissed(false); }, [activeCrisisFlagId]);

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

  const handleProfileUpdate = useCallback((newFields) => {
    if (!setFormData || !handleSave) return;
    setFormData(prev => {
      const updated = { ...prev, ...newFields };
      setTimeout(() => handleSave({ preventDefault: () => {} }, updated), 0);
      return updated;
    });
  }, [setFormData, handleSave]);

  // ── Hình thái ─────────────────────────────────────────────────────────────────
  // Điện thoại + PWA: portal cho app chiếm trọn màn (h-full). Desktop trình duyệt
  // thì app nằm trong trang cuộn của portal, không có tổ tiên cao cố định — phải
  // tự bó chiều cao theo viewport, nếu không danh sách tin nhắn kéo dài cả trang.
  const isMobileView = useIsMobile();
  const framed = !isMobileView && !isStandalone();
  const isChat = activeTab === "chat";
  const shortcuts = SUB_TABS
    .filter((tab) => tab.id !== "chat")
    .map((tab) => ({ ...tab, label: t(`companion.tab.${tab.id}`, tab.label) }));
  const activeShortcut = shortcuts.find((tab) => tab.id === activeTab);

  // Nhân vật đồng hành: tự gán theo đánh giá mới nhất, hoặc người dùng đã khoá.
  const { companion, auto: companionAuto } = useMemo(
    () => resolveCompanion(historyLogs),
    [historyLogs, companionTick], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const pickCompanion = async (id) => {
    const nextId = id === "auto" ? recommendCompanion(historyLogs) : id;
    if (nextId !== companion.id) {
      const next = companionById(nextId);
      const ok = await notify.confirm({
        title: `Đổi sang ${next.name}?`,
        message: `${next.name} sẽ bắt đầu một cuộc trò chuyện mới cùng cậu. Những gì đã trò chuyện với ${companion.name} sẽ được khép lại.`,
        confirmText: `Gặp ${next.name}`,
        cancelText: "Ở lại",
      });
      if (!ok) return;
    }
    saveCompanionChoice(id);
    setCompanionTick((n) => n + 1);
    setShowCompanions(false);
    sensory.tap();
  };

  // ── Đổi nhân vật = cuộc trò chuyện mới ─────────────────────────────────────
  // Tự động (đánh giá mới đổi gợi ý) hay tự chọn đều đi qua đây: hoạt cảnh chuyển
  // ca, xoá lịch sử chat, nhân vật mới chào lại từ đầu. Nhân vật đang đồng hành
  // được nhớ theo tài khoản, nên đổi xảy ra khi rời app cũng được báo lần mở sau.
  const [handoff, setHandoff] = useState(null);
  const closeHandoff = useCallback(() => setHandoff(null), []);
  const activeKey = `hugopsy_active_companion:${memberEmail || "guest"}`;
  useEffect(() => {
    if (!synced) return;
    let previous = null;
    try { previous = localStorage.getItem(activeKey); } catch { /* ignore */ }
    if (previous === companion.id) return;
    try { localStorage.setItem(activeKey, companion.id); } catch { /* ignore */ }
    if (!previous) return; // lần đầu gặp: không có ai để chuyển ca
    setHandoff({ from: companionById(previous), to: companion, auto: companionAuto });
    try { localStorage.removeItem("banhocduong_chat_messages"); } catch { /* ignore */ }
    setChatMessages([]);
    handleUpdateCompanionState({ chatMessages: [] });
    setClearMessagesKey((k) => k + 1);
  }, [synced, companion.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtitle = !isChat ? undefined : journeyProgress
    ? `${companion.name} · ${companionMood || companion.mood} · ${t("hugoPsy.tab.ngay2")} ${journeyProgress.currentDay}/${journeyProgress.duration} · ${journeyProgress.percent}%`
    : `${companion.name} · ${companionMood || companion.mood}`;

  const iconBtn = "w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform";
  const actions = (
    <div className="flex items-center gap-0.5">
      {activeHighCrisisFlag && crisisPopupDismissed && (
        <button type="button" onClick={() => setCrisisPopupDismissed(false)}
          aria-label={t("companion.crisis.title", "Bạn không một mình")}
          className="w-11 h-11 rounded-full flex items-center justify-center text-rose-500 active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
        </button>
      )}
      {isChat && (
        <>
          <button type="button" onClick={() => setShowCompanions(true)}
            aria-label={`Người đồng hành: ${companion.name}`} className={`${iconBtn} hidden md:flex`}>
            <AnimulaAvatar size={34} type={companion.type} color={companion.color} interactive={false} />
          </button>
          {/* Từ md: lối tắt nằm thẳng trên thanh. Hẹp hơn: NavBar chỉ chừa ~77px bên
              phải (đã trừ chỗ nút X), hai nút trở lên là tràn đè tiêu đề — gom
              hết vào một nút ⋯. */}
          {shortcuts.map((tab) => (
            <button key={tab.id} type="button" onClick={() => handleTabChange(tab.id)}
              aria-label={tab.label} title={tab.label}
              className={`${iconBtn} hidden md:flex`} style={{ color: "var(--ax)" }}>
              <span className="material-symbols-outlined text-[24px]">{tab.icon}</span>
            </button>
          ))}
          {!isGuestMode && (
            <button type="button" onClick={() => setShowSettings(true)}
              aria-label={t("companion.tab.settings", "Cài đặt")}
              className={`${iconBtn} hidden md:flex`} style={{ color: "var(--ax)" }}>
              <span className="material-symbols-outlined text-[24px]">tune</span>
            </button>
          )}
          <button type="button" onClick={() => setShowMenu(true)}
            aria-label={t("companion.tab.settings", "Cài đặt")}
            className={`${iconBtn} md:hidden`} style={{ color: "var(--ax)" }}>
            <span className="material-symbols-outlined text-[26px]">more_horiz</span>
          </button>
        </>
      )}
    </div>
  );

  const spinner = (
    <div className="flex flex-1 items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );

  return (
    <div className={`hugo-psy-shell min-h-0 ${framed ? "h-[calc(100dvh-160px)] overflow-hidden rounded-[28px] border border-border" : "h-full"}`}>
      <AppFrame
        appId="psychology"
        title={activeShortcut?.label}
        subtitle={subtitle}
        onBack={isChat ? onBack : () => handleTabChange("chat")}
        backLabel={isChat ? undefined : t(`companion.tab.chat`, "Tâm sự")}
        scrollKey={activeTab}
        actions={actions}
        // Chat tự cuộn bên trong (ô nhập ghim đáy) nên cột của khung phải là một
        // hộp cao cố định, không phải vùng cuộn — xem .psy-chat-body.
        contentClassName={activeTab === "chat" ? "psy-chat-body" : "px-4 pt-3"}
        contentMaxWidth={activeTab === "chat" ? "820px" : "960px"}
      >
        {/* Bốn màn đều là chunk riêng. Chunk hỏng mà không có ranh giới lỗi thì
            lỗi vọt lên làm trắng cả portal — ở một app sức khoẻ tâm thần, đó là
            chặn luôn đường tới danh sách đường dây nóng. */}
        <LazyBoundary resetKey={activeTab}>
          <React.Suspense fallback={spinner}>
            {activeTab === "chat" && (
              <ChatTab
                key={clearMessagesKey}
                companion={companion}
                journeyPercent={journeyProgress?.percent ?? null}
                onMoodChange={setCompanionMood}
                onNavigateToTab={handleNavigateToTab}
                bio={bio}
                historyLogs={historyLogs}
                onUpdateCompanionState={handleUpdateCompanionState}
                chatMessages={chatMessages}
                presetTest={presetTest}
                setPresetTest={setPresetTest}
                showToast={showToast}
                healingActive={healingActive}
                isGuestMode={isGuestMode}
                requireAccount={requireAccount}
                onProfileUpdate={handleProfileUpdate}
              />
            )}
            {activeTab === "therapy" && (
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
                onBioUpdate={handleProfileUpdate}
              />
            )}
            {activeTab === "sleep" && <SleepTracker bio={bio} sleepAutoDetect={sleepAutoDetect} />}
            {activeTab === "evaluation" && (
              <EvaluationTab onNavigateToTab={handleNavigateToTab} bio={bio} historyLogs={historyLogs} showToast={showToast} />
            )}
          </React.Suspense>
        </LazyBoundary>
      </AppFrame>

      {activeHighCrisisFlag && !crisisPopupDismissed && (
        <CrisisDialog
          flag={activeHighCrisisFlag}
          onResolve={handleResolveCrisis}
          onDismiss={() => setCrisisPopupDismissed(true)}
        />
      )}

      {/* Menu lối tắt trên điện thoại — thả xuống từ thanh tiêu đề. */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-black/30"
            onClick={() => setShowMenu(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}
              className="absolute right-3 w-60 origin-top-right rounded-[20px] border border-border bg-card p-1.5 shadow-xl"
              style={{ top: "calc(max(4px, env(safe-area-inset-top, 0px)) + 56px)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" onClick={() => { setShowMenu(false); setShowCompanions(true); }}
                className="flex w-full min-h-[52px] items-center gap-3 rounded-2xl px-2 text-left active:bg-muted">
                <AnimulaAvatar size={34} type={companion.type} color={companion.color} interactive={false} />
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium text-foreground">{companion.name}</span>
                  <span className="block text-[13px] text-muted-foreground">Đổi người đồng hành</span>
                </span>
              </button>
              <div className="my-1 h-px bg-border" />
              {[...shortcuts, ...(isGuestMode ? [] : [{ id: "settings", icon: "tune", label: t("companion.tab.settings", "Cài đặt") }])].map((item) => (
                <button key={item.id} type="button"
                  onClick={() => { setShowMenu(false); item.id === "settings" ? setShowSettings(true) : handleTabChange(item.id); }}
                  className="flex w-full min-h-[48px] items-center gap-3 rounded-2xl px-3 text-left text-[15px] font-medium text-foreground active:bg-muted">
                  <span className="material-symbols-outlined text-[22px] text-muted-foreground">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {handoff && (
          <CompanionHandoff
            from={handoff.from}
            to={handoff.to}
            auto={handoff.auto}
            onDone={closeHandoff}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompanions && (
          <CompanionSheet
            current={companion}
            auto={companionAuto}
            recommendedId={recommendCompanion(historyLogs)}
            onPick={pickCompanion}
            onClose={() => setShowCompanions(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            bio={bio}
            showToast={showToast}
            historyLogs={historyLogs}
            journey={journeyProgress}
            onCancelJourney={handleCancelHealing}
            onClearMessages={() => { setChatMessages([]); setClearMessagesKey(k => k + 1); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {adaptationAlert && (
          <Dialog
            icon="auto_awesome"
            title={t("companion.tab.adaptiveAlert.title", "Tiến triển xuất sắc!")}
            subtitle={t("companion.tab.adaptiveAlert.subtitle", "Lộ trình đồng hành thích ứng")}
            actions={
              <button type="button" onClick={() => setAdaptationAlert(null)}
                className="w-full min-h-[48px] rounded-2xl bg-emerald-600 text-white text-[15px] font-semibold active:scale-[0.98] transition-transform">
                {t("companion.tab.adaptiveAlert.btn", "Tuyệt vời, tiếp tục thôi!")}
              </button>
            }
          >
            <div className="rounded-2xl bg-muted/50 p-4 text-left space-y-1.5 text-[15px] text-muted-foreground">
              <p>{t("companion.tab.adaptiveAlert.recorded", "Ghi nhận:")} <span className="text-foreground font-semibold">{adaptationAlert.improvement}</span></p>
              <p>{t("companion.tab.adaptiveAlert.reduced", { count: adaptationAlert.reducedDays }, `Rút ngắn: -${adaptationAlert.reducedDays} ngày`)}</p>
              <div className="flex justify-between pt-2 border-t border-border">
                <span>{t("companion.tab.adaptiveAlert.before", { count: adaptationAlert.oldDuration }, `Trước: ${adaptationAlert.oldDuration} ngày`)}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t("companion.tab.adaptiveAlert.newDuration", { count: adaptationAlert.newDuration }, `Mới: ${adaptationAlert.newDuration} ngày`)}</span>
              </div>
            </div>
          </Dialog>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCancelModal && (
          <Dialog
            icon="warning"
            tone="danger"
            title={t("companion.tab.stopRoadmap.title", "Dừng lộ trình?")}
            subtitle={t("companion.tab.stopRoadmap.subtitle", "Thao tác này không thể hoàn tác")}
            actions={
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setShowCancelModal(false)}
                  className="min-h-[48px] rounded-2xl border border-border text-[15px] font-semibold text-foreground">
                  {t("companion.tab.stopRoadmap.cancel", "Quay lại")}
                </button>
                <button type="button" onClick={confirmCancelHealing}
                  className="min-h-[48px] rounded-2xl bg-rose-600 text-white text-[15px] font-semibold active:scale-[0.98] transition-transform">
                  {t("companion.tab.stopRoadmap.confirm", "Xác nhận dừng")}
                </button>
              </div>
            }
          >
            <p className="text-[15px] text-muted-foreground leading-relaxed text-left">
              {t("companion.tab.stopRoadmap.desc", "Dữ liệu check-in, lịch sử trắc nghiệm và nhật ký cảm xúc sẽ bị xóa vĩnh viễn. Cậu có chắc chắn không?")}
            </p>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
