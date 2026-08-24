
export default function AISupportBriefingModal({ isOpen, briefingData, onClose }) {
  if (!isOpen || !briefingData || !briefingData.hasBriefing) return null;

  const { counts = {}, items = [], totalCount = 0 } = briefingData;

  const handlePlayVoiceBriefing = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const text = `Xin chào Boss! Tôi là AI Quản gia Hugo Studio. Trong thời gian bạn vắng mặt, tôi đã tự động xử lý ${totalCount} công việc. Bao gồm ${counts.ticket_reply || 0} ticket thắc mắc và chuyển ${counts.escalate || 0} trường hợp để Boss duyệt. Hệ thống đang vận hành ổn định!`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-slate-100">
        {/* Glow Header Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="material-symbols-outlined text-white text-xl">smart_toy</span>
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                AI Butler Support Agent
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Quản gia Tự động
                </span>
              </h3>
              <p className="text-xs text-slate-400">Báo cáo các công việc đã tự động xử lý khi bạn vắng mặt</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayVoiceBriefing}
              title="Phát báo cáo bằng giọng nói"
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm animate-pulse">volume_up</span>
              <span>Đọc báo cáo</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>

        {/* Summary Badges */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3.5 text-center">
            <div className="text-2xl font-black text-cyan-400">{briefingData.totalCount || 0}</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">Tổng công việc</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3.5 text-center">
            <div className="text-2xl font-black text-emerald-400">{counts.ticket_reply || 0}</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">Ticket trả lời tự động</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3.5 text-center">
            <div className="text-2xl font-black text-amber-400">{counts.escalate || 0}</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">Chuyển Boss duyệt</div>
          </div>
        </div>

        {/* Recent Items List */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Chi tiết các hành động tự động gần đây
          </h4>
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {items.map((item) => (
              <div
                key={item._id || Math.random()}
                className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-start gap-3 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-sm">
                    {item.actionType === 'ticket_reply' ? 'chat' : item.actionType === 'escalate' ? 'priority_high' : 'check_circle'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-200 leading-snug">{item.summary}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span>{item.targetEmail}</span>
                    <span>•</span>
                    <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            AI Support Agent đang hoạt động 24/7
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
          >
            Đã xem & Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
