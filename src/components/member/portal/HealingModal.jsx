import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Extracted from MemberPortalPage — keeps the main file lean
function CompanionHistoryReportPanel({ historyLogs }) {
  const fmt = (iso) => {
    try {
      const d = new Date(iso);
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    } catch { return 'Không xác định'; }
  };
  const moodLabel = (m) => ['','⛈️ Kiệt sức','🌧️ Mỏi mệt','☁️ Bình thường','🌤️ Tốt','☀️ Rất tốt'][m] || '☁️';

  const { anomalies } = React.useMemo(() => {
    const a = [];
    const checkins = historyLogs.filter(l => l.type === 'checkin');
    const lows = checkins.filter(c => c.mood <= 2);
    if (lows.length) a.push({ title: 'Tâm trạng suy giảm', desc: `Ghi nhận ${lows.length} ngày tâm trạng trầm buồn.`, severity: 'medium' });
    const lateNight = historyLogs.filter(l => { const h = new Date(l.date).getHours(); return h >= 23 || h < 5; });
    if (lateNight.length) a.push({ title: 'Hoạt động muộn đêm', desc: `${lateNight.length} lần hoạt động từ 23h–5h, có thể ảnh hưởng giấc ngủ.`, severity: 'medium' });
    return { anomalies: a };
  }, [historyLogs]);

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Tổng quan hành trình</div>
      {anomalies.length > 0 && (
        <div className="space-y-2">
          {anomalies.map((a, i) => (
            <div key={i} className="bg-amber-500/8 dark:bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{a.title}</p>
              <p className="text-[9.5px] text-zinc-500 dark:text-zinc-400 mt-0.5">{a.desc}</p>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
        {historyLogs.slice().reverse().slice(0, 10).map((log, i) => (
          <div key={i} className="flex items-start gap-2 py-1.5 border-b border-zinc-100/60 dark:border-zinc-800/40 last:border-0">
            <div className="text-[9px] font-mono text-zinc-400 shrink-0 pt-0.5">{fmt(log.date)}</div>
            <div className="flex-1 min-w-0">
              {log.type === 'checkin' && <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{moodLabel(log.mood)}</p>}
              {log.note && <p className="text-[9.5px] text-zinc-500 truncate">{log.note}</p>}
            </div>
          </div>
        ))}
        {historyLogs.length === 0 && <p className="text-[10px] text-zinc-400 text-center py-4">Chưa có dữ liệu</p>}
      </div>
    </div>
  );
}

export default function HealingModal({
  showModal, subStep, state, mood, setMood, note, setNote,
  consecutiveLow, wheelRatings, setWheelRatings, historyLogs,
  onSubmit, onWheelSubmit, onGraduation,
  onGoToTest, onGoToBreath, onGoToChat,
  onDismiss, showToast,
}) {
  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className={`bg-white/85 dark:bg-[#12111a]/85 backdrop-blur-2xl border border-zinc-200/50 dark:border-zinc-800/60 rounded-2xl p-6 sm:p-8 w-full shadow-2xl space-y-6 relative overflow-hidden ${
              (subStep === 'checkin' || subStep === 'wheel') ? 'max-w-md md:max-w-4xl' : 'max-w-md'
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />

            {/* GRADUATION */}
            {subStep === 'graduation' && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center mx-auto text-white shadow-lg animate-bounce-short">
                  <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                </div>
                <div className="space-y-2">
                  <span className="text-[8.5px] font-black tracking-widest text-indigo-500 dark:text-indigo-400 uppercase">Hành trình hoàn tất</span>
                  <h3 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider">Chúc mừng cậu đã hoàn thành!</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-350 leading-relaxed font-semibold">Hành trình chữa lành của bạn đã hết rồi. Tớ hy vọng bạn đã vượt qua tất cả — bạn thực sự rất mạnh mẽ và xứng đáng được hạnh phúc.</p>
                </div>
                <button type="button" onClick={onGraduation}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-indigo-650 hover:from-pink-650 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98]">
                  Hoàn thành & xóa dữ liệu bảo mật
                </button>
              </div>
            )}

            {/* DAILY CHECK-IN */}
            {subStep === 'checkin' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                <div className="md:col-span-6 space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black tracking-widest bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 uppercase">Ngày {state.day} của lộ trình</span>
                      <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider mt-1">Hôm nay cậu thế nào?</h3>
                    </div>
                    <div className="flex justify-between gap-1.5 py-1">
                      {[{v:1,c:'😢',l:'Rất tệ'},{v:2,c:'😕',l:'Hơi buồn'},{v:3,c:'😐',l:'Bình thường'},{v:4,c:'🙂',l:'Khá tốt'},{v:5,c:'😄',l:'Rất tuyệt'}].map(item => (
                        <button key={item.v} type="button" onClick={() => setMood(item.v)}
                          className={`flex-1 py-3 rounded-xl border text-center transition-all ${mood === item.v ? 'bg-indigo-500/10 border-indigo-500 scale-[1.06] shadow-md' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                          <span className="text-2xl block">{item.c}</span>
                          <span className="text-[7.5px] font-black uppercase tracking-wider block mt-1">{item.l}</span>
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Đồ án khó, thi cử áp lực, hay hôm nay là một ngày tuyệt vời..."
                      value={note} onChange={e => setNote(e.target.value)}
                      className="w-full h-20 px-3 py-2.5 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/20 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-zinc-400 font-semibold resize-none"
                    />
                  </div>
                  <button type="button" onClick={onSubmit}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98]">
                    Tiếp tục
                  </button>
                </div>
                <div className="hidden md:block md:col-span-6 border-l border-zinc-200/50 dark:border-zinc-800/40 pl-6 max-h-[420px] overflow-y-auto pr-1">
                  <CompanionHistoryReportPanel historyLogs={historyLogs} />
                </div>
              </div>
            )}

            {/* WHEEL OF LIFE */}
            {subStep === 'wheel' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                <div className="md:col-span-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase">Bánh xe Cuộc sống</span>
                      <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider mt-1">Định vị Cân Bằng Hôm Nay</h3>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-36 h-36 bg-white dark:bg-[#15141c] rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 shadow-inner flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 300 300">
                          {[2,4,6,8,10].map(level => {
                            const r = level * 10;
                            const pts = [90,18,306,234,162].map(angle => {
                              const rad = angle * Math.PI / 180;
                              return `${150 + r * Math.cos(rad)},${150 - r * Math.sin(rad)}`;
                            }).join(' ');
                            return <polygon key={level} points={pts} fill="none" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray={level === 10 ? '0' : '3 3'} />;
                          })}
                          {[90,18,306,234,162].map((angle, idx) => {
                            const rad = angle * Math.PI / 180;
                            return <line key={idx} x1={150} y1={150} x2={150 + 100*Math.cos(rad)} y2={150 - 100*Math.sin(rad)} className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="1" />;
                          })}
                          <polygon points={wheelRatings.map((v, i) => {
                            const rad = [90,18,306,234,162][i] * Math.PI / 180;
                            return `${150 + v*10*Math.cos(rad)},${150 - v*10*Math.sin(rad)}`;
                          }).join(' ')} fill="rgba(16,185,129,0.12)" className="stroke-emerald-500 dark:stroke-emerald-400" strokeWidth="2.5" />
                          {wheelRatings.map((v, i) => {
                            const rad = [90,18,306,234,162][i] * Math.PI / 180;
                            return <circle key={i} cx={150 + v*10*Math.cos(rad)} cy={150 - v*10*Math.sin(rad)} r="4" className="fill-emerald-500 dark:fill-emerald-450 stroke-white dark:stroke-[#15141c]" strokeWidth="1.5" />;
                          })}
                        </svg>
                      </div>
                      <div className="w-full space-y-2.5">
                        {['Bản thân','Học tập','Công việc','Gia đình','Mối quan hệ'].map((cat, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between text-[10px] font-bold text-zinc-600 dark:text-zinc-400 pl-0.5">
                              <span>{cat}</span><span className="font-mono text-emerald-500 font-black">{wheelRatings[idx]}/10</span>
                            </div>
                            <input type="range" min="1" max="10" value={wheelRatings[idx]}
                              onChange={e => { const c=[...wheelRatings]; c[idx]=parseInt(e.target.value,10); setWheelRatings(c); }}
                              className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={onWheelSubmit}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98]">
                    Gửi cảm xúc & Bắt đầu ngày mới
                  </button>
                </div>
                <div className="hidden md:block md:col-span-6 border-l border-zinc-200/50 dark:border-zinc-800/40 pl-6 max-h-[420px] overflow-y-auto pr-1">
                  <CompanionHistoryReportPanel historyLogs={historyLogs} />
                </div>
              </div>
            )}

            {/* TEST REMINDER */}
            {subStep === 'reminder' && (
              <div className="space-y-5 text-center">
                <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center mx-auto shadow-sm">
                  <span className="material-symbols-outlined text-2xl animate-pulse">quiz</span>
                </div>
                <div className="space-y-2">
                  <span className="text-[8.5px] font-black tracking-widest text-indigo-500 dark:text-indigo-400 uppercase">
                    {consecutiveLow ? 'Hỗ trợ phục hồi khẩn cấp' : 'Kiểm tra định kỳ'}
                  </span>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                    {consecutiveLow ? 'Hãy yêu thương bản thân hơn nhé' : 'Đã đến lúc làm bài trắc nghiệm'}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-350 leading-relaxed font-semibold max-w-sm mx-auto">
                    {consecutiveLow
                      ? 'Tâm trạng cậu đang khá trầm xuống liên tục. Hãy thực hành bài tập điều hòa nhịp thở hoặc trò chuyện với tớ nhé.'
                      : 'Bạn Học Đường nhận thấy đã đến chu kỳ đánh giá định kỳ. Hãy làm một bài test DASS-42 để tớ đối chiếu chẩn đoán nhé.'}
                  </p>
                </div>
                {consecutiveLow ? (
                  <div className="flex flex-col gap-2 pt-1">
                    <button type="button" onClick={onGoToBreath}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md transition-colors flex items-center justify-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">air</span>Luyện Hít Thở 4-7-8
                    </button>
                    <button type="button" onClick={onGoToChat}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md transition-colors flex items-center justify-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">forum</span>Tâm sự cùng Trợ lý
                    </button>
                    <button type="button" onClick={onGoToTest}
                      className="w-full py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[9.5px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors">
                      Làm test lâm sàng DASS-42
                    </button>
                    <button type="button" onClick={() => onDismiss()}
                      className="py-2 text-[9px] font-bold text-zinc-400 hover:text-zinc-600 uppercase tracking-wider">
                      Bỏ qua
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button type="button" onClick={() => onDismiss()}
                      className="py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors">
                      Để sau
                    </button>
                    <button type="button" onClick={onGoToTest}
                      className="py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[10px] font-black uppercase tracking-wider shadow-md transition-colors">
                      Làm test ngay
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
