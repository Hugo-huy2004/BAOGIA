import { Fragment, useState, useMemo } from "react";
import { withTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { notify } from "../../lib/notify";
import { hapticSelect } from "../../utils/haptics";
import {
  Bell,
  RotateCw,
  CheckCheck,
  X,
  Sparkles,
  CreditCard,
  Shield,
  AlertCircle,
  Info,
  Gift,
  ExternalLink,
  Sliders,
  Wallet,
  User,
} from "lucide-react";

const getHistoryTypeConfig = (t) => ({
  welcome: { color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", label: t("memberTabs.history.labels.welcome"), cat: "account", icon: User },
  bio_link: { color: "text-sky-500", bg: "bg-sky-500/10 border-sky-500/20", label: t("memberTabs.history.labels.bio_link"), cat: "account", icon: ExternalLink },
  package_received: { color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20", label: t("memberTabs.history.labels.package_received"), cat: "package", icon: CreditCard },
  package_removed: { color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20", label: t("memberTabs.history.labels.package_removed"), cat: "package", icon: AlertCircle },
  profile_updated: { color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", label: t("memberTabs.history.labels.profile_updated"), cat: "account", icon: User },
  link_added: { color: "text-sky-500", bg: "bg-sky-500/10 border-sky-500/20", label: t("memberTabs.history.labels.link_added"), cat: "account", icon: ExternalLink },
  link_removed: { color: "text-muted-foreground", bg: "bg-muted border-border", label: t("memberTabs.history.labels.link_removed"), cat: "account", icon: X },
  birthday_wish: { color: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/20", label: t("memberTabs.history.labels.birthday"), cat: "gift", icon: Gift },
  birthday_voucher: { color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", label: t("memberTabs.history.labels.gift"), cat: "gift", icon: Gift }
});

const NOTIF_CATEGORY_CONFIG = {
  joy: { color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", cat: "joy", icon: Wallet },
  payment: { color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", cat: "joy", icon: CreditCard },
  package: { color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20", cat: "package", icon: CreditCard },
  verification: { color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", cat: "account", icon: Shield },
  security: { color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20", cat: "account", icon: AlertCircle },
  wellness: { color: "text-teal-500", bg: "bg-teal-500/10 border-teal-500/20", cat: "account", icon: Sparkles },
  system: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", cat: "system", icon: Info },
  general: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", cat: "system", icon: Bell }
};

const formatTime = (ts, t) => {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return t("memberTabs.history.time.just_now");
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t("memberTabs.history.time.minutes_ago")}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${t("memberTabs.history.time.hours_ago")}`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ${t("memberTabs.history.time.days_ago")}`;
  return d.toLocaleDateString(t("memberTabs.history.localeCode", "vi-VN"), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getDayBucket = (timestamp) => {
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) return "earlier";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(value);
  day.setHours(0, 0, 0, 0);
  const difference = Math.floor((today.getTime() - day.getTime()) / 86_400_000);
  if (difference <= 0) return "today";
  if (difference === 1) return "yesterday";
  if (difference <= 7) return "this_week";
  return "earlier";
};

function parseJoyDetail(text) {
  if (!text) return { raw: text };
  let txId = null;
  const txMatch = text.match(/Mã GD:\s*([A-Z0-9]+)/);
  if (txMatch) txId = txMatch[1];

  let balance = null;
  const balMatch = text.match(/Số dư:\s*([\d,.]+)\s*JOY/);
  if (balMatch) balance = balMatch[1];

  let message = null;
  const msgMatch = text.match(/Lời nhắn:\s*"([^"]+)"/);
  if (msgMatch) message = msgMatch[1];

  let amount = null;
  let isPositive = null;
  const recvMatch = text.match(/chuyển\s*([\d,.]+)\s*JOY đến bạn/);
  if (recvMatch) {
    amount = recvMatch[1];
    isPositive = true;
  }
  const sendMatch = text.match(/\(\s*-([\d,.]+)\s*JOY/);
  if (sendMatch) {
    amount = sendMatch[1];
    isPositive = false;
  }

  let cleanText = text
    .replace(/Mã GD:\s*[A-Z0-9]+[.]?\s*/, "")
    .replace(/Số dư:\s*[\d,.]+\s*JOY[.]?\s*/, "")
    .replace(/Lời nhắn:\s*"[^"]+"[.]?\s*/, "")
    .trim();

  return { raw: text, cleanText, txId, balance, message, amount, isPositive };
}

function MemberHistoryTab({ bio, t, notifications = [], onMarkRead, onMarkAllRead, onDismiss }) {
  const [expandedId, setExpandedId] = useState(null);
  const [claimedCodes, setClaimedCodes] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const typeConfig = getHistoryTypeConfig(t);

  const mergedEntries = useMemo(() => {
    const fromBio = [...(bio?.history || [])].reverse().map((entry, idx) => {
      const cfg = typeConfig[entry.type] || typeConfig["profile_updated"];
      return {
        key: `bio-${idx}-${entry.timestamp}`,
        source: "bio",
        timestamp: entry.timestamp,
        title: entry.title,
        detail: entry.detail,
        cfg,
        raw: entry
      };
    });

    const fromNotif = notifications.map((n) => {
      const cfg = NOTIF_CATEGORY_CONFIG[n.category] || NOTIF_CATEGORY_CONFIG.system;
      return {
        key: `notif-${n._id}`,
        source: "notification",
        id: n._id,
        timestamp: n.createdAt,
        title: n.title,
        detail: n.message,
        cfg,
        read: n.read
      };
    });

    return [...fromBio, ...fromNotif].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [bio?.history, notifications, typeConfig]);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const filteredEntries = mergedEntries;

  const { visibleItems: visibleEntries, sentinelRef, hasMore } = useInfiniteScroll(filteredEntries, { pageSize: 25 });

  const handleRefresh = () => {
    hapticSelect();
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      notify.success(t("memberTabs.history.refreshed"));
    }, 600);
  };

  const onCopyVoucher = (code) => {
    navigator.clipboard.writeText(code);
    setClaimedCodes((prev) => ({ ...prev, [code]: true }));
    setTimeout(() => setClaimedCodes((prev) => ({ ...prev, [code]: false })), 2000);
    notify.success(t("memberTabs.history.copy_success_msg"));
  };

  return (
    <div className="activity-gallery mx-auto animate-fadeIn select-none pb-28 text-left font-sans">
      <header className="activity-inbox-header">
        <div className="min-w-0">
          <div className="activity-inbox-titleline">
            <h2>{t("memberTabs.history.inbox_title")}</h2>
            {unreadNotifCount > 0 ? <span>{unreadNotifCount > 99 ? "99+" : unreadNotifCount}</span> : null}
          </div>
          <p>{t("memberTabs.history.inbox_description")}</p>
        </div>
        <div className="activity-inbox-actions">
          {unreadNotifCount > 0 ? (
            <button type="button" onClick={() => onMarkAllRead?.()}>
              {t("memberTabs.history.read_all")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleRefresh}
            className={`activity-gallery-refresh ${isRefreshing ? "is-refreshing" : ""}`}
            title={t("memberTabs.history.refresh")}
            aria-label={t("memberTabs.history.refresh")}
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── 3. EMPTY STATE ─────────────────────────────────────────────────── */}
      {filteredEntries.length === 0 && (
        <div className="bg-card border border-border/40 rounded-[24px] p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">{t("memberTabs.history.empty_title")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("memberTabs.history.empty_desc")}
            </p>
          </div>
        </div>
      )}

      {/* ── 4. NOTIFICATION LIST ITEMS (EXPANDABLE CARD FEED) ──────────────── */}
      <div className="activity-gallery-grid">
        {visibleEntries.map((entry, index) => {
          const cfg = entry.cfg;
          const IconComp = cfg.icon || Bell;
          const isNotif = entry.source === "notification";
          const unread = isNotif && !entry.read;
          const isExpanded = expandedId === entry.key;
          const dayBucket = getDayBucket(entry.timestamp);
          const previousBucket = index > 0 ? getDayBucket(visibleEntries[index - 1]?.timestamp) : null;

          let parsedJoy = null;
          if (cfg.cat === "joy") {
            parsedJoy = parseJoyDetail(entry.detail);
          }

          return (
            <Fragment key={entry.key}>
            {dayBucket !== previousBucket ? (
              <h3 className="activity-day-heading">{t(`memberTabs.history.days.${dayBucket}`)}</h3>
            ) : null}
            <div
              className={`activity-artifact text-left ${
                unread
                  ? "is-unread"
                  : ""
              }`}
              role="button"
              tabIndex={0}
              onClick={() => {
                hapticSelect();
                setExpandedId(isExpanded ? null : entry.key);
                if (unread) onMarkRead?.(entry.id);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setExpandedId(isExpanded ? null : entry.key);
                  if (unread) onMarkRead?.(entry.id);
                }
              }}
            >
              <span className="activity-artifact-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              {/* Top Row: Icon + Title + Meta Actions */}
              <div className="flex items-start gap-3">
                {/* Category Icon Badge */}
                <div className={`activity-notification-icon w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.color}`}>
                  <IconComp className="w-4.5 h-4.5" />
                </div>

                {/* Main Content Info */}
                <div className="flex-1 min-w-0">
                  <div className="activity-notification-titleline">
                    <h4 className="text-xs font-black text-foreground leading-snug truncate">
                      {entry.title}
                    </h4>
                    <span>{formatTime(entry.timestamp, t)}</span>
                  </div>

                  {/* Parsed JOY Details */}
                  {parsedJoy && parsedJoy.amount ? (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-xl border border-border/30">
                        <p className="text-xs font-bold text-foreground truncate">
                          {parsedJoy.cleanText || entry.title}
                        </p>
                        <span className={`text-xs font-black font-mono shrink-0 ml-2 ${parsedJoy.isPositive ? "text-emerald-500" : "text-foreground"}`}>
                          {parsedJoy.isPositive ? "+" : "-"}{parsedJoy.amount} JOY
                        </span>
                      </div>

                      {/* Receipt Metadata Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {parsedJoy.txId && (
                          <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-mono font-bold text-muted-foreground border border-border/30">
                            {t("memberTabs.history.transaction_short")}: {parsedJoy.txId}
                          </span>
                        )}
                        {parsedJoy.balance && (
                          <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground border border-border/30">
                            {t("memberTabs.history.balance_short")}: {parsedJoy.balance} JOY
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Standard Message Preview */
                    entry.detail && !isExpanded && (
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">
                        {entry.detail}
                      </p>
                    )
                  )}

                  {/* Expandable Body Accordion */}
                  <AnimatePresence>
                    {isExpanded && entry.detail && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 pt-2 border-t border-border/30 space-y-2 text-xs text-foreground leading-relaxed"
                      >
                        <p className="whitespace-pre-wrap">{entry.detail}</p>

                        {/* Birthday Voucher Copy Action */}
                        {entry.raw?.type === "birthday_voucher" && bio?.birthdayVoucherCode && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-amber-500 uppercase block">{t("memberTabs.history.birthday_voucher_title")}</span>
                              <span className="text-xs font-mono font-black text-foreground">{bio.birthdayVoucherCode}</span>
                            </div>
                            <button
                              onClick={() => onCopyVoucher(bio.birthdayVoucherCode)}
                              className="px-3 py-1 bg-amber-500 text-white font-black text-[10.5px] uppercase rounded-lg shadow-xs hover:opacity-90 active:scale-95"
                            >
                              {claimedCodes[bio.birthdayVoucherCode] ? t("memberTabs.history.copied") : t("memberTabs.history.copy")}
                            </button>
                          </div>
                        )}

                        {/* Interactive Okay / Mark Read Action Button */}
                        {unread && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              onMarkRead?.(entry.id);
                            }}
                            className="px-3 py-1 bg-primary text-white font-black text-[10.5px] uppercase tracking-wider rounded-lg shadow-xs hover:opacity-90 active:scale-95 transition-all mt-1"
                          >
                            {t("memberTabs.history.mark_read")}
                          </button>
                        )}
                        {isNotif ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onDismiss?.(entry.id);
                            }}
                            className="activity-notification-dismiss"
                          >
                            <X className="w-3.5 h-3.5" />
                            {t("memberTabs.history.dismiss")}
                          </button>
                        ) : null}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            </Fragment>
          );
        })}
      </div>

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} className="h-1" />
      {hasMore && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── 5. BOTTOM ACTION FOOTER BAR ─────────────────────────────────────── */}
      <div className="bg-card border border-border/40 rounded-[20px] p-3 shadow-xs flex items-center justify-between">
        <button
          onClick={() => {
            hapticSelect();
            if (unreadNotifCount > 0) onMarkAllRead?.();
          }}
          disabled={unreadNotifCount === 0}
          className="text-xs font-bold text-primary hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1 active:scale-95 transition-all"
        >
          <CheckCheck className="w-4 h-4" />
          <span>{t("memberPortal.historyActions.markAllRead")}</span>
        </button>

        <button
          onClick={() => {
            hapticSelect();
            window.location.href = "/member/settings";
          }}
          className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 active:scale-95 transition-all"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{t("memberPortal.historyActions.settingsBtn")}</span>
        </button>
      </div>
    </div>
  );
}

export default withTranslation()(MemberHistoryTab);
