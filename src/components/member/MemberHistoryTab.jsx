import { withTranslation } from "react-i18next";
import React, { useState, useMemo } from 'react';
import HugoLogo from "../HugoLogo";
import { notify } from "../../lib/notify";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

const getHistoryTypeConfig = (t) => ({
  welcome:         { color: 'hsl(var(--success))', bg: 'bg-success/10 dark:bg-success/15', border: 'border-success/20', label: t("memberTabs.history.labels.welcome"), cat: 'account', icon: 'waving_hand' },
  bio_link:        { color: 'hsl(var(--info))', bg: 'bg-info/10 dark:bg-info/15',     border: 'border-info/20',    label: 'Bio Link', cat: 'account', icon: 'link' },
  package_received:{ color: 'hsl(var(--primary))', bg: 'bg-primary/10 dark:bg-primary/15', border: 'border-primary/20',  label: t("memberTabs.history.labels.package_received"), cat: 'package', icon: 'card_membership' },
  package_removed: { color: 'hsl(var(--destructive))', bg: 'bg-destructive/10 dark:bg-destructive/15',       border: 'border-destructive/20',     label: t("memberTabs.history.labels.package_removed"), cat: 'package', icon: 'unsubscribe' },
  profile_updated: { color: 'hsl(var(--warning))', bg: 'bg-warning/10 dark:bg-warning/15',   border: 'border-warning/20',   label: t("memberTabs.history.labels.profile_updated"), cat: 'account', icon: 'manage_accounts' },
  link_added:      { color: 'hsl(var(--info))', bg: 'bg-info/10 dark:bg-info/15',     border: 'border-info/20',    label: t("memberTabs.history.labels.link_added"), cat: 'account', icon: 'add_link' },
  link_removed:    { color: 'hsl(var(--muted-foreground))', bg: 'bg-muted',     border: 'border-border',    label: t("memberTabs.history.labels.link_removed"), cat: 'account', icon: 'link_off' },
  birthday_wish:   { color: 'hsl(var(--accent))', bg: 'bg-accent/10 dark:bg-accent/15',     border: 'border-accent/20',    label: t("memberTabs.history.labels.birthday"), cat: 'gift', icon: 'cake' },
  birthday_voucher:{ color: 'hsl(var(--warning))', bg: 'bg-warning/10 dark:bg-warning/15',   border: 'border-warning/20',   label: t("memberTabs.history.labels.gift"), cat: 'gift', icon: 'featured_play_list' },
});

// Notifications (InAppNotification — JOY transactions, verification, package,
// security, payment, etc.) are merged into this same feed, bucketed by
// category instead of the bio.history `type` above.
const NOTIF_CATEGORY_CONFIG = {
  joy:          { color: 'hsl(var(--warning))', bg: 'bg-warning/10 dark:bg-warning/15', border: 'border-warning/20', cat: 'joy', icon: 'paid' },
  payment:      { color: 'hsl(var(--warning))', bg: 'bg-warning/10 dark:bg-warning/15', border: 'border-warning/20', cat: 'joy', icon: 'payments' },
  package:      { color: 'hsl(var(--primary))', bg: 'bg-primary/10 dark:bg-primary/15', border: 'border-primary/20', cat: 'package', icon: 'card_membership' },
  verification: { color: 'hsl(var(--info))', bg: 'bg-info/10 dark:bg-info/15', border: 'border-info/20', cat: 'account', icon: 'verified_user' },
  security:     { color: 'hsl(var(--destructive))', bg: 'bg-destructive/10 dark:bg-destructive/15', border: 'border-destructive/20', cat: 'account', icon: 'security' },
  wellness:     { color: 'hsl(var(--accent))', bg: 'bg-accent/10 dark:bg-accent/15', border: 'border-accent/20', cat: 'account', icon: 'favorite' },
  system:       { color: 'hsl(var(--muted-foreground))', bg: 'bg-muted', border: 'border-border', cat: 'account', icon: 'notifications' },
  general:      { color: 'hsl(var(--muted-foreground))', bg: 'bg-muted', border: 'border-border', cat: 'account', icon: 'notifications' },
};

const formatTime = (ts, t) => {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return t("memberTabs.history.time.just_now");
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t("memberTabs.history.time.minutes_ago")}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${t("memberTabs.history.time.hours_ago")}`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ${t("memberTabs.history.time.days_ago")}`;
  return d.toLocaleDateString(t("memberTabs.history.localeCode", "vi-VN"), { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
};

const getRelativeDateHeader = (dateString, t) => {
  const d = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return t("memberTabs.history.days.today");
  } else if (d.toDateString() === yesterday.toDateString()) {
    return t("memberTabs.history.days.yesterday");
  } else {
    return d.toLocaleDateString(t("memberTabs.history.localeCode", "vi-VN"), { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  }
};

function parseJoyDetail(text) {
  if (!text) return { raw: text };
  
  // Try to find Transaction ID
  let txId = null;
  const txMatch = text.match(/Mã GD:\s*([A-Z0-9]+)/);
  if (txMatch) txId = txMatch[1];

  // Try to find Balance
  let balance = null;
  const balMatch = text.match(/Số dư:\s*([\d,.]+)\s*JOY/);
  if (balMatch) balance = balMatch[1];

  // Try to find Message
  let message = null;
  const msgMatch = text.match(/Lời nhắn:\s*"([^"]+)"/);
  if (msgMatch) message = msgMatch[1];

  // Try to extract amount from specific formats
  let amount = null;
  let isPositive = null;
  
  // "đã chuyển 20 JOY đến bạn" -> +20
  const recvMatch = text.match(/chuyển\s*([\d,.]+)\s*JOY đến bạn/);
  if (recvMatch) {
    amount = recvMatch[1];
    isPositive = true;
  }
  
  // "(-200 JOY, phí -10 JOY)" -> -200
  const sendMatch = text.match(/\(\s*-([\d,.]+)\s*JOY/);
  if (sendMatch) {
    amount = sendMatch[1];
    isPositive = false;
  }
  
  // Clean up the main text to use as "title" or "description"
  let cleanText = text
    .replace(/Mã GD:\s*[A-Z0-9]+[.]?\s*/, '')
    .replace(/Số dư:\s*[\d,.]+\s*JOY[.]?\s*/, '')
    .replace(/Lời nhắn:\s*"[^"]+"[.]?\s*/, '')
    .trim();

  return { raw: text, cleanText, txId, balance, message, amount, isPositive };
}

function MemberHistoryTab({ bio, t, notifications = [], onMarkRead, onMarkAllRead, onDismiss }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [claimedCodes, setClaimedCodes] = useState({});

  const typeConfig = getHistoryTypeConfig(t);

  // Merge bio.history (profile/package/gift events, no read state) with the
  // InAppNotification feed (JOY transactions + everything else, has read
  // state) into one chronological list.
  const mergedEntries = useMemo(() => {
    const fromBio = [...(bio?.history || [])].reverse().map((entry, idx) => {
      const cfg = typeConfig[entry.type] || typeConfig['profile_updated'];
      return {
        key: `bio-${idx}-${entry.timestamp}`,
        source: 'bio',
        timestamp: entry.timestamp,
        title: entry.title,
        detail: entry.detail,
        icon: entry.icon || cfg.icon,
        cfg,
        raw: entry,
      };
    });

    const fromNotif = notifications.map((n) => {
      const cfg = NOTIF_CATEGORY_CONFIG[n.category] || NOTIF_CATEGORY_CONFIG.system;
      return {
        key: `notif-${n._id}`,
        source: 'notification',
        id: n._id,
        timestamp: n.createdAt,
        title: n.title,
        detail: n.message,
        icon: cfg.icon,
        cfg,
        read: n.read,
      };
    });

    return [...fromBio, ...fromNotif].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [bio?.history, notifications, typeConfig]);

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const filteredEntries = useMemo(() => {
    return mergedEntries.filter(entry => {
      if (activeFilter === "all") return true;
      return entry.cfg.cat === activeFilter;
    });
  }, [mergedEntries, activeFilter]);

  const { visibleItems: visibleEntries, sentinelRef, hasMore } = useInfiniteScroll(filteredEntries, { pageSize: 20 });

  const groupedEntries = useMemo(() => {
    const groups = {};
    visibleEntries.forEach(entry => {
      if (!entry.timestamp) return;
      const dateKey = new Date(entry.timestamp).toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(entry);
    });
    return Object.entries(groups).map(([dateString, items]) => ({
      dateString,
      dateHeader: getRelativeDateHeader(dateString, t),
      items
    }));
  }, [visibleEntries, t]);

  const onCopyVoucher = (code) => {
    navigator.clipboard.writeText(code);
    setClaimedCodes(prev => ({ ...prev, [code]: true }));
    setTimeout(() => {
      setClaimedCodes(prev => ({ ...prev, [code]: false }));
    }, 2000);
    notify.success(t("memberTabs.history.copy_success_msg"));
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 px-3 sm:px-0 animate-fadeIn text-left">
      {/* Header */}
      <div className="flex items-center justify-between bg-card/60 backdrop-blur-md rounded-xl p-4 border border-border/50 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">notifications</span>{t("memberTabs.history.title")}</h2>
          <p className="text-[10px] font-medium text-foreground/80">
            {filteredEntries.length > 0
              ? t("memberTabs.history.notification_count", { count: filteredEntries.length })
              : t("memberTabs.history.no_events")}
          </p>
        </div>
        {unreadNotifCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-[10px] font-bold text-primary hover:underline shrink-0"
          >
            Đọc tất cả ({unreadNotifCount})
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1">
        {[
          { id: "all",     label: t("memberTabs.history.filter.all"), icon: "inbox" },
          { id: "joy",     label: "JOY", icon: "paid" },
          { id: "account", label: t("memberTabs.history.filter.account"), icon: "manage_accounts" },
          { id: "package", label: t("memberTabs.history.filter.package"), icon: "card_membership" },
          { id: "gift",    label: t("memberTabs.history.filter.gift"), icon: "redeem" }
        ].map(filter => {
          const active = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all duration-200 shrink-0 ${
                active
                  ? "bg-primary border-primary text-white shadow-sm"
                  : "bg-white/80 dark:bg-card/60 border-border/50 text-foreground/80 hover:text-zinc-900 dark:hover:text-zinc-100 backdrop-blur-sm"
              }`}
            >
              <span className="material-symbols-outlined text-xs">{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-white/40 dark:bg-card/40 border border-border rounded-2xl p-6">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground/70">
            <span className="material-symbols-outlined text-2xl">notifications_off</span>
          </div>
          <div>
            <p className="text-xs font-black text-foreground uppercase tracking-wider">{t("memberTabs.history.empty_title")}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1 max-w-xs">{t("memberTabs.history.empty_desc")}</p>
          </div>
        </div>
      )}

      {/* Grouped Day Lists */}
      {groupedEntries.length > 0 && (
        <div className="space-y-6">
          {groupedEntries.map((group) => (
            <div key={group.dateString} className="space-y-2">
              {/* Day Header */}
              <div className="pl-2">
                <span className="inline-block px-2.5 py-1 rounded-lg bg-card/70 backdrop-blur-md text-[10px] font-black text-foreground uppercase tracking-widest border border-border/50 shadow-sm">
                  {group.dateHeader}
                </span>
              </div>

              {/* Day Notification Items - Flat List */}
              <div className="bg-card/70 backdrop-blur-xl rounded-[1.25rem] border border-border/50 shadow-sm overflow-hidden divide-y divide-zinc-200/50 dark:divide-zinc-800/40">
                {group.items.map((entry) => {
                  const cfg = entry.cfg;
                  const isNotif = entry.source === 'notification';
                  const unread = isNotif && !entry.read;
                  
                  // Detail Parsing for JOY
                  let parsedJoy = null;
                  if (cfg.cat === 'joy') {
                    parsedJoy = parseJoyDetail(entry.detail);
                  }

                  return (
                    <div
                      key={entry.key}
                      onClick={() => unread && onMarkRead?.(entry.id)}
                      className={`group flex gap-3.5 p-4 transition-colors duration-200 relative ${
                        unread
                          ? 'bg-primary/5 dark:bg-primary/10 cursor-pointer'
                          : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'
                      }`}
                    >
                      {/* Unread Indicator */}
                      {unread && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md" />}

                      {/* Left icon wrapper */}
                      <div className="shrink-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 ${cfg.bg} ${cfg.border}`}
                        >
                          <span className="material-symbols-outlined text-[18px]" style={{ color: cfg.color }}>{entry.icon}</span>
                        </div>
                      </div>

                      {/* Content column */}
                      <div className="flex-1 min-w-0 space-y-1 text-left pt-0.5">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-[12px] font-bold text-foreground leading-snug truncate">
                            {entry.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                            {formatTime(entry.timestamp, t)}
                          </span>
                        </div>

                        {/* Parsed JOY Details */}
                        {parsedJoy && parsedJoy.amount ? (
                          <div className="mt-1 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                {parsedJoy.cleanText}
                              </p>
                              <div className="shrink-0 text-right">
                                <span className={`text-[13px] font-black tracking-tight ${parsedJoy.isPositive ? 'text-success' : 'text-foreground'}`}>
                                  {parsedJoy.isPositive ? '+' : '-'}{parsedJoy.amount} JOY
                                </span>
                              </div>
                            </div>
                            
                            {/* Receipt Metadata Row */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {parsedJoy.txId && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[8px] font-mono font-bold uppercase">
                                  <span className="material-symbols-outlined text-[10px]">receipt_long</span>
                                  {parsedJoy.txId}
                                </span>
                              )}
                              {parsedJoy.balance && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[8px] font-bold uppercase">
                                  <span className="material-symbols-outlined text-[10px]">account_balance_wallet</span>
                                  Dư: {parsedJoy.balance}
                                </span>
                              )}
                            </div>
                            
                            {parsedJoy.message && (
                              <div className="mt-2 text-[10px] font-medium text-muted-foreground bg-muted/50 p-2.5 rounded-lg border border-border/60 italic flex gap-2">
                                <span className="material-symbols-outlined text-[12px] text-zinc-400">format_quote</span>
                                "{parsedJoy.message}"
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Standard Details */
                          entry.detail && (
                            <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {entry.detail}
                            </p>
                          )
                        )}

                        {entry.raw?.type === 'birthday_voucher' && bio?.birthdayVoucherCode && (
                          <div className="mt-2.5 p-3 bg-warning/10 dark:bg-warning/15 border border-warning/20 dark:border-warning/30 rounded-xl flex items-center justify-between gap-3 shadow-inner">
                            <div className="text-left">
                              <p className="text-[8px] font-black text-warning uppercase tracking-wider">{t("memberTabs.history.birthday_voucher_title")}</p>
                              <p className="text-xs font-black font-mono tracking-widest text-warning mt-0.5">{bio.birthdayVoucherCode}</p>
                            </div>
                            {bio.birthdayVoucherClaimed ? (
                              <span className="px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase bg-success/10 text-success dark:bg-success/15 border border-success/20 dark:border-success/30 flex items-center gap-1 shrink-0">
                                <span className="material-symbols-outlined text-xs font-bold">check_circle</span>{t("memberTabs.history.claimed")}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onCopyVoucher(bio.birthdayVoucherCode)}
                                className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase bg-warning hover:bg-warning/90 text-warning-foreground transition-all active:scale-95 shadow-sm flex items-center gap-1 shrink-0"
                              >
                                <span className="material-symbols-outlined text-[10px]">
                                  {claimedCodes[bio.birthdayVoucherCode] ? "check" : "content_copy"}
                                </span>
                                <span>{claimedCodes[bio.birthdayVoucherCode] ? t("memberTabs.history.copied") : t("memberTabs.history.copy")}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {isNotif && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onDismiss?.(entry.id); }}
                          className="text-zinc-300 hover:text-destructive transition-colors shrink-0 self-start p-1 ml-1 active:scale-90"
                          aria-label="Xóa"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />
      {hasMore && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {!hasMore && filteredEntries.length > 0 && (
        <p className="text-center text-[9px] text-zinc-400 italic pt-3">{t("memberTabs.history.footer_note")}</p>
      )}
    </div>
  );
}

export default withTranslation()(MemberHistoryTab);
