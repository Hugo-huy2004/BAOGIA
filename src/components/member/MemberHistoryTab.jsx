import React, { Component } from 'react';

class MemberHistoryTab extends Component {
  constructor(props) {
    super(props);
    this.historyTypeConfig = {
      welcome:         { color: '#34c759', bg: 'bg-emerald-500/10 dark:bg-emerald-500/10', border: 'border-emerald-400/30', label: 'Chào mừng' },
      bio_link:        { color: '#0071e3', bg: 'bg-blue-500/10 dark:bg-blue-500/10',     border: 'border-blue-400/30',    label: 'Bio Link' },
      package_received:{ color: '#6366f1', bg: 'bg-indigo-500/10 dark:bg-indigo-500/10', border: 'border-indigo-400/30',  label: 'Nhận gói' },
      package_removed: { color: '#ff3b30', bg: 'bg-red-500/10 dark:bg-red-500/10',       border: 'border-red-400/30',     label: 'Gỡ gói' },
      profile_updated: { color: '#ff9500', bg: 'bg-amber-500/10 dark:bg-amber-500/10',   border: 'border-amber-400/30',   label: 'Cập nhật' },
      link_added:      { color: '#30b0c7', bg: 'bg-cyan-500/10 dark:bg-cyan-500/10',     border: 'border-cyan-400/30',    label: 'Thêm link' },
      link_removed:    { color: '#8e8e93', bg: 'bg-zinc-500/10 dark:bg-zinc-500/10',     border: 'border-zinc-400/30',    label: 'Xóa link' },
    };
  }

  formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return d.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  render() {
    const { bio } = this.props;
    const entries = [...(bio?.history || [])].reverse();

    return (
      <div className="max-w-2xl mx-auto space-y-4 px-3 sm:px-0 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#0071e3]">history</span>
              Lịch Sử Hoạt Động
            </h2>
            <p className="text-[10px] text-zinc-400">
              {entries.length > 0 ? `${entries.length} sự kiện được ghi lại (tối đa 50)` : 'Chưa có sự kiện nào'}
            </p>
          </div>
          {entries.length > 0 && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-800">
              Mới nhất trên đầu
            </span>
          )}
        </div>

        {/* Empty State */}
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-zinc-300 dark:text-zinc-700">history</span>
            </div>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Chưa có lịch sử nào</p>
            <p className="text-xs text-zinc-400 max-w-xs">Các thay đổi và sự kiện quan trọng sẽ được ghi lại tại đây tự động.</p>
          </div>
        )}

        {/* Timeline */}
        {entries.length > 0 && (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-zinc-200 via-zinc-200 to-transparent dark:from-zinc-800 dark:via-zinc-800" />

            <div className="space-y-3">
              {entries.map((entry, idx) => {
                const cfg = this.historyTypeConfig[entry.type] || this.historyTypeConfig['profile_updated'];
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
                    <div className={`flex-1 mb-1 rounded-2xl border p-4 shadow-sm transition-all duration-200 group-hover:shadow-md bg-white dark:bg-[#1c1c1e] ${cfg.border}`}>
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.bg} border ${cfg.border}`}
                            style={{ color: cfg.color }}
                          >
                            {cfg.label || entry.type}
                          </span>
                        </div>
                        <span className="text-[9px] text-zinc-400 font-medium whitespace-nowrap">{this.formatTime(entry.timestamp)}</span>
                      </div>

                      <p className="text-xs font-bold text-zinc-800 dark:text-white mt-2 leading-snug">{entry.title}</p>
                      {entry.detail && (
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed whitespace-pre-wrap">{entry.detail}</p>
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
          <p className="text-center text-[9px] text-zinc-400 italic pt-2">
            Lịch sử chỉ lưu tối đa 50 sự kiện gần nhất để tối ưu hiệu suất.
          </p>
        )}
      </div>
    );
  }
}

export default MemberHistoryTab;
