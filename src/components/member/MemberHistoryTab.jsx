import { withTranslation } from "react-i18next";
import React, { Component } from 'react';
import HugoLogo from "../HugoLogo";
import { toast } from "react-hot-toast";

class MemberHistoryTab extends Component {
  constructor(props) {
    super(props);
  }

  getHistoryTypeConfig(t) {
    return {
      welcome:         { color: '#34c759', bg: 'bg-emerald-500/10 dark:bg-emerald-500/10', border: 'border-emerald-400/30', label: t("memberTabs.history.labels.welcome") },
      bio_link:        { color: '#0071e3', bg: 'bg-blue-500/10 dark:bg-blue-500/10',     border: 'border-blue-400/30',    label: 'Bio Link' },
      package_received:{ color: '#6366f1', bg: 'bg-indigo-500/10 dark:bg-indigo-500/10', border: 'border-indigo-400/30',  label: t("memberTabs.history.labels.package_received") },
      package_removed: { color: '#ff3b30', bg: 'bg-red-500/10 dark:bg-red-500/10',       border: 'border-red-400/30',     label: t("memberTabs.history.labels.package_removed") },
      profile_updated: { color: '#ff9500', bg: 'bg-amber-500/10 dark:bg-amber-500/10',   border: 'border-amber-400/30',   label: t("memberTabs.history.labels.profile_updated") },
      link_added:      { color: '#30b0c7', bg: 'bg-cyan-500/10 dark:bg-cyan-500/10',     border: 'border-cyan-400/30',    label: t("memberTabs.history.labels.link_added") },
      link_removed:    { color: '#8e8e93', bg: 'bg-zinc-500/10 dark:bg-zinc-500/10',     border: 'border-zinc-400/30',    label: t("memberTabs.history.labels.link_removed") },
      birthday_wish:   { color: '#ff2d55', bg: 'bg-rose-500/10 dark:bg-rose-500/10',     border: 'border-rose-400/30',    label: 'Sinh Nhật' },
      birthday_voucher:{ color: '#ff9500', bg: 'bg-amber-500/10 dark:bg-amber-500/10',   border: 'border-amber-400/30',   label: 'Quà Tặng' },
    };
  }

  formatTime(ts, t) {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return t("memberTabs.history.time.just_now");
    if (diff < 3600) return `${Math.floor(diff / 60)} ${t("memberTabs.history.time.minutes_ago")}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${t("memberTabs.history.time.hours_ago")}`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ${t("memberTabs.history.time.days_ago")}`;
    return d.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  render() {
    const { t } = this.props;
    const { bio } = this.props;
    const entries = [...(bio?.history || [])].reverse();

    return (
      <div className="max-w-2xl mx-auto space-y-4 px-3 sm:px-0 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#0071e3]">notifications</span>{t("memberTabs.history.title")}</h2>
            <p className="text-[10px] text-zinc-400">
              {entries.length > 0 ? `${entries.length} ${t("memberTabs.history.events_recorded")}` : t("memberTabs.history.no_events")}
            </p>
          </div>
          {entries.length > 0 && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-800">{t("memberTabs.history.newest_first")}</span>
          )}
        </div>

        {/* Empty State */}
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-zinc-300 dark:text-zinc-700">notifications</span>
            </div>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t("memberTabs.history.empty_title")}</p>
            <p className="text-xs text-zinc-400 max-w-xs">{t("memberTabs.history.empty_desc")}</p>
          </div>
        )}

        {/* Timeline */}
        {entries.length > 0 && (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-zinc-200 via-zinc-200 to-transparent dark:from-zinc-800 dark:via-zinc-800" />

            <div className="space-y-3">
              {entries.map((entry, idx) => {
                const cfg = this.getHistoryTypeConfig(t)[entry.type] || this.getHistoryTypeConfig(t)['profile_updated'];
                return (
                  <div key={idx} className="flex gap-4 group">
                    {/* Timeline dot */}
                    <div className="shrink-0 relative z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm transition-transform duration-200 group-hover:scale-110 ${cfg.bg} ${cfg.border}`}
                      >
                        <span className="material-symbols-outlined text-base" style={{ color: cfg.color }}>{entry.icon || 'notifications'}</span>
                      </div>
                    </div>

                    {/* Card */}
                    <div className={`flex-1 mb-1 rounded-lg border p-4 shadow-sm transition-all duration-200 group-hover:shadow-md bg-white dark:bg-[#1c1c1e] ${cfg.border}`}>
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.bg} border ${cfg.border}`}
                            style={{ color: cfg.color }}
                          >
                            {cfg.label || entry.type}
                          </span>
                        </div>
                        <span className="text-[9px] text-zinc-400 font-medium whitespace-nowrap">{this.formatTime(entry.timestamp, t)}</span>
                      </div>

                      {entry.type === 'birthday_wish' && (
                        <div className="mt-3 mb-2 pb-2 border-b border-rose-100 dark:border-rose-900/30 flex items-center gap-2">
                          <HugoLogo className="text-[14px] font-black" />
                          <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Official Wish</span>
                        </div>
                      )}

                      {entry.type === 'birthday_voucher' && (
                        <div className="mt-3 mb-2 pb-2 border-b border-amber-100 dark:border-amber-900/30 flex items-center gap-2">
                          <HugoLogo className="text-[14px] font-black" />
                          <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Official Gift</span>
                        </div>
                      )}

                      <p className="text-xs font-bold text-zinc-800 dark:text-white mt-2 leading-snug">{entry.title}</p>
                      {entry.detail && (
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed whitespace-pre-wrap">{entry.detail}</p>
                      )}
                      
                      {entry.type === 'birthday_voucher' && bio?.birthdayVoucherCode && (
                        <div className="mt-3 p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20 rounded-md flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[9px] font-bold text-rose-550 uppercase tracking-wider">Mã Quà Tặng Sinh Nhật</p>
                            <p className="text-sm font-black font-mono tracking-wider text-rose-700 dark:text-rose-350">{bio.birthdayVoucherCode}</p>
                          </div>
                          {bio.birthdayVoucherClaimed ? (
                            <span className="px-3 py-1.5 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1 shrink-0">
                              <span className="material-symbols-outlined text-xs font-bold">check_circle</span>Đã nhận quà
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(bio.birthdayVoucherCode);
                                toast.success(`Đã sao chép mã quà tặng! Hãy dán mã tại tab "Gói dịch vụ" để nhận quà.`, {
                                  style: {
                                    background: document.documentElement.classList.contains('dark') ? '#12111a' : '#ffffff',
                                    color: document.documentElement.classList.contains('dark') ? '#e4e4e7' : '#1f2937',
                                    borderRadius: '12px',
                                    border: '1px solid ' + (document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                                  }
                                });
                              }}
                              className="px-3 py-1.5 rounded text-[9px] font-bold uppercase bg-rose-600 hover:bg-rose-700 text-white transition-all active:scale-95 shadow-sm flex items-center gap-1 shrink-0"
                            >
                              <span className="material-symbols-outlined text-xs">content_copy</span>Sao chép
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
        )}

        {/* Footer note */}
        {entries.length >= 50 && (
          <p className="text-center text-[9px] text-zinc-400 italic pt-2">{t("memberTabs.history.footer_note")}</p>
        )}
      </div>
    );
  }
}

export default withTranslation()(MemberHistoryTab);
