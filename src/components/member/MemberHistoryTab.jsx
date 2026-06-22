import { withTranslation } from "react-i18next";
import React, { useState, useMemo } from 'react';
import HugoLogo from "../HugoLogo";
import { toast } from "react-hot-toast";

const getHistoryTypeConfig = (t) => ({
  welcome:         { color: 'hsl(var(--success))', bg: 'bg-success/10 dark:bg-success/15', border: 'border-success/20', label: t("memberTabs.history.labels.welcome"), cat: 'account', icon: 'waving_hand' },
  bio_link:        { color: 'hsl(var(--info))', bg: 'bg-info/10 dark:bg-info/15',     border: 'border-info/20',    label: 'Bio Link', cat: 'account', icon: 'link' },
  package_received:{ color: 'hsl(var(--primary))', bg: 'bg-primary/10 dark:bg-primary/15', border: 'border-primary/20',  label: t("memberTabs.history.labels.package_received"), cat: 'package', icon: 'card_membership' },
  package_removed: { color: 'hsl(var(--destructive))', bg: 'bg-destructive/10 dark:bg-destructive/15',       border: 'border-destructive/20',     label: t("memberTabs.history.labels.package_removed"), cat: 'package', icon: 'unsubscribe' },
  profile_updated: { color: 'hsl(var(--warning))', bg: 'bg-warning/10 dark:bg-warning/15',   border: 'border-warning/20',   label: t("memberTabs.history.labels.profile_updated"), cat: 'account', icon: 'manage_accounts' },
  link_added:      { color: 'hsl(var(--info))', bg: 'bg-info/10 dark:bg-info/15',     border: 'border-info/20',    label: t("memberTabs.history.labels.link_added"), cat: 'account', icon: 'add_link' },
  link_removed:    { color: 'hsl(var(--muted-foreground))', bg: 'bg-muted dark:bg-muted',     border: 'border-border',    label: t("memberTabs.history.labels.link_removed"), cat: 'account', icon: 'link_off' },
  birthday_wish:   { color: 'hsl(var(--accent))', bg: 'bg-accent/10 dark:bg-accent/15',     border: 'border-accent/20',    label: t("memberTabs.history.labels.birthday"), cat: 'gift', icon: 'cake' },
  birthday_voucher:{ color: 'hsl(var(--warning))', bg: 'bg-warning/10 dark:bg-warning/15',   border: 'border-warning/20',   label: t("memberTabs.history.labels.gift"), cat: 'gift', icon: 'featured_play_list' },
});

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

function MemberHistoryTab({ bio, t }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [claimedCodes, setClaimedCodes] = useState({});

  const typeConfig = getHistoryTypeConfig(t);
  const rawEntries = [...(bio?.history || [])].reverse();

  const filteredEntries = useMemo(() => {
    return rawEntries.filter(entry => {
      if (activeFilter === "all") return true;
      const cfg = typeConfig[entry.type] || typeConfig['profile_updated'];
      return cfg.cat === activeFilter;
    });
  }, [rawEntries, activeFilter]);

  const groupedEntries = useMemo(() => {
    const groups = {};
    filteredEntries.forEach(entry => {
      if (!entry.timestamp) return;
      const dateKey = new Date(entry.timestamp).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });
    return Object.entries(groups).map(([dateString, items]) => ({
      dateString,
      dateHeader: getRelativeDateHeader(dateString, t),
      items
    }));
  }, [filteredEntries, t]);

  const onCopyVoucher = (code) => {
    navigator.clipboard.writeText(code);
    setClaimedCodes(prev => ({ ...prev, [code]: true }));
    setTimeout(() => {
      setClaimedCodes(prev => ({ ...prev, [code]: false }));
    }, 2000);
    toast.success(t("memberTabs.history.copy_success_msg"), {
      style: {
        background: document.documentElement.classList.contains('dark') ? '#12111a' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#e4e4e7' : '#1f2937',
        borderRadius: '12px',
        border: '1px solid ' + (document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
      }
    });
  };
 
  return (
    <div className="max-w-xl mx-auto space-y-5 px-3 sm:px-0 animate-fadeIn text-left">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">notifications</span>{t("memberTabs.history.title")}</h2>
          <p className="text-[10px] text-zinc-450">
            {filteredEntries.length > 0 
              ? t("memberTabs.history.notification_count", { count: filteredEntries.length }) 
              : t("memberTabs.history.no_events")}
          </p>
        </div>
      </div>
 
      {/* Category Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-1">
        {[
          { id: "all",     label: t("memberTabs.history.filter.all"), icon: "inbox" },
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
                  : "bg-white dark:bg-card/60 border-border/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-250"
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
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-white/40 dark:bg-card/40 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-300 dark:text-zinc-700">
            <span className="material-symbols-outlined text-2xl">notifications_off</span>
          </div>
          <div>
            <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">{t("memberTabs.history.empty_title")}</p>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-400 mt-1 max-w-xs">{t("memberTabs.history.empty_desc")}</p>
          </div>
        </div>
      )}

      {/* Grouped Day Lists */}
      {groupedEntries.length > 0 && (
        <div className="space-y-6">
          {groupedEntries.map((group) => (
            <div key={group.dateString} className="space-y-3">
              {/* Day Header */}
              <h3 className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-2">
                {group.dateHeader}
              </h3>

              {/* Day Notification Items */}
              <div className="space-y-2">
                {group.items.map((entry, idx) => {
                  const cfg = typeConfig[entry.type] || typeConfig['profile_updated'];
                  return (
                    <div
                      key={idx}
                      className="group flex gap-3.5 p-4 bg-white/60 dark:bg-card/60 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm transition-all duration-300 hover:scale-[1.005] hover:shadow-md"
                    >
                      {/* Left icon wrapper */}
                      <div className="shrink-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center border shadow-sm transition-transform duration-300 group-hover:scale-105 ${cfg.bg} ${cfg.border}`}
                        >
                          <span className="material-symbols-outlined text-[15px]" style={{ color: cfg.color }}>{entry.icon || cfg.icon}</span>
                        </div>
                      </div>

                      {/* Content column */}
                      <div className="flex-1 min-w-0 space-y-1.5 text-left">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <span
                            className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.bg} border ${cfg.border}`}
                            style={{ color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-bold">{formatTime(entry.timestamp, t)}</span>
                        </div>

                        {entry.type === 'birthday_wish' && (
                          <div className="flex items-center gap-1.5 py-1 border-b border-accent/20 dark:border-accent/30 w-fit">
                            <HugoLogo className="text-[12px] font-black" />
                            <span className="text-[8px] font-black text-accent uppercase tracking-widest">Official Wish</span>
                          </div>
                        )}

                        {entry.type === 'birthday_voucher' && (
                          <div className="flex items-center gap-1.5 py-1 border-b border-warning/20 dark:border-warning/30 w-fit">
                            <HugoLogo className="text-[12px] font-black" />
                            <span className="text-[8px] font-black text-warning uppercase tracking-widest">Official Gift</span>
                          </div>
                        )}

                        <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 leading-snug">{entry.title}</p>
                        {entry.detail && (
                          <p className="text-[10px] text-zinc-550 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">{entry.detail}</p>
                        )}
                        
                        {entry.type === 'birthday_voucher' && bio?.birthdayVoucherCode && (
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
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Note */}
      {rawEntries.length >= 50 && (
        <p className="text-center text-[9px] text-zinc-400 italic pt-3">{t("memberTabs.history.footer_note")}</p>
      )}
    </div>
  );
}

export default withTranslation()(MemberHistoryTab);
