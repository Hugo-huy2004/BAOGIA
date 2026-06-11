import React, { useState } from "react";
import { Lock, Unlock, BookOpen, Heart, Activity } from "lucide-react";
import BreathingTherapy from "./BreathingTherapy";
import ReadingTherapy from "./ReadingTherapy";
import MeditationTherapy from "./MeditationTherapy";
import DepressionCbtTherapy from "./DepressionCbtTherapy";

export default function TherapyTab({ onNavigateToTab, bio, historyLogs, onUpdateCompanionState, healingActive, showToast }) {
  // activePanel: null | 'reading' | 'meditation' | 'breath' | 'depression'
  const [activePanel, setActivePanel] = useState(null); 

  // Lock/Unlock checks
  const hasClinicalResults = historyLogs.some(log => 
    log.type === "clinical_test" || 
    log.test === "phq9" || 
    log.test === "gad7" || 
    log.test === "who5" || 
    log.test === "bigfive" || 
    log.test === "dass42" || 
    log.test === "mmpi30"
  );

  const hasActiveJourneyOrResults = hasClinicalResults || healingActive;

  const isReadingUnlocked = hasActiveJourneyOrResults;
  
  const isBreathingUnlocked = healingActive || historyLogs.some(log => {
    if (log.test === "gad7" && log.score >= 5) return true;
    if (log.test === "dass42" && log.scores && log.scores.A >= 7) return true;
    if (log.test === "mmpi30" && log.clinical && log.clinical.some(c => (c.code === "Hs" || c.code === "Hy") && c.score >= 70)) return true;
    if (log.type === "chat_anomaly" && log.text && (log.text.includes("sợ") || log.text.includes("lo"))) return true;
    return false;
  });

  const isMeditationUnlocked = healingActive || historyLogs.some(log => {
    if (log.test === "who5" && log.score <= 12) return true;
    if (log.test === "dass42" && log.scores && log.scores.S >= 10) return true;
    if (log.test === "mmpi30" && log.clinical && log.clinical.some(c => (c.code === "Pt" || c.code === "Sc") && c.score >= 70)) return true;
    return false;
  });

  const isDepressionUnlocked = healingActive || historyLogs.some(log => {
    if (log.test === "phq9" && log.score >= 5) return true;
    if (log.test === "dass42" && log.scores && log.scores.D >= 10) return true;
    if (log.test === "mmpi30" && log.clinical && log.clinical.some(c => c.code === "D" && c.score >= 70)) return true;
    return false;
  });

  // Log completed events to MongoDB via props
  const handleCompleteActivity = (name, desc) => {
    const newEntry = {
      date: new Date().toISOString(),
      type: "therapy_activity",
      name,
      desc
    };
    const updatedLogs = [...historyLogs, newEntry];
    onUpdateCompanionState({ historyLogs: updatedLogs });
  };

  return (
    <div className="p-6 space-y-6 flex flex-col justify-between animate-fadeIn">
      {/* 1. Normal State: List of activities with Lock/Unlock */}
      {!activePanel && (
        <div className="space-y-6 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800 pb-20">
          <div className="text-center space-y-2 max-w-md mx-auto">
            <span className="px-3 py-1 rounded-full text-[9px] font-black tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase">
              Phương Pháp Lâm Sàng
            </span>
            <h4 className="text-[14px] font-black text-zinc-900 dark:text-zinc-150 uppercase tracking-wider">
              Hệ Sinh Thái Trị Liệu
            </h4>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-455 leading-relaxed font-bold">
              Các bài tập tự chăm sóc được cá nhân hóa dựa trên dữ liệu đánh giá và tâm lý học hành vi.
            </p>
          </div>
 
          {!hasActiveJourneyOrResults ? (
            <div className="max-w-md mx-auto text-center p-8 border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-[#1a1924]/40 backdrop-blur-xl rounded-3xl space-y-4 animate-scaleUp shadow-xl">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto text-zinc-400 shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Chưa mở khóa trị liệu</h4>
              <p className="text-[10.5px] text-zinc-550 dark:text-zinc-450 leading-relaxed font-bold">
                Cần có dữ liệu đầu vào. Hãy trò chuyện hoặc làm bài đánh giá để AI phân tích và đề xuất phương pháp phù hợp nhất.
              </p>
              <button
                type="button"
                onClick={() => onNavigateToTab && onNavigateToTab("chat")}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Trò chuyện cùng AI ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-[160px]">
              {/* Activity 1: Đọc sách (Span 1x1) */}
              <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-all hover:scale-[1.02] shadow-sm hover:shadow-xl ${
                isReadingUnlocked 
                  ? "bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border-indigo-500/20 dark:border-indigo-500/30" 
                  : "bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-70 grayscale"
              }`}>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="p-2.5 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
                      <BookOpen className="w-5 h-5" />
                    </span>
                    {isReadingUnlocked ? (
                      <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">
                        <Unlock className="w-3 h-3" /> Sẵn sàng
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">
                        <Lock className="w-3 h-3" /> Đã khóa
                      </span>
                    )}
                  </div>
                  <h5 className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide mt-2">Đọc Sách</h5>
                  <p className="text-[9.5px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-bold line-clamp-2">
                    Nhạc sóng não và không gian tĩnh lặng.
                  </p>
                </div>
                {isReadingUnlocked && (
                  <button onClick={() => setActivePanel("reading")} className="mt-auto w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95">Mở</button>
                )}
              </div>

              {/* Activity 2: Ngồi tĩnh tâm (Span 2x1 trên Desktop) */}
              <div className={`col-span-1 md:col-span-2 p-5 rounded-3xl border flex flex-col justify-between transition-all hover:scale-[1.02] shadow-sm hover:shadow-xl ${
                isMeditationUnlocked 
                  ? "bg-gradient-to-br from-teal-500/10 to-emerald-500/5 border-teal-500/20 dark:border-teal-500/30" 
                  : "bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-70 grayscale"
              }`}>
                <div className="flex flex-col md:flex-row gap-4 justify-between h-full">
                  <div className="space-y-3 flex-1 text-left">
                    <span className="inline-block p-2.5 rounded-xl bg-teal-500 text-white shadow-lg shadow-teal-500/30">
                      <Activity className="w-5 h-5" />
                    </span>
                    <div>
                      <h5 className="text-[12px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Ngồi Tĩnh Tâm</h5>
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-bold mt-1">
                        Thư giãn sâu từ 10-20 phút giải tỏa stress và căng thẳng quá mức. Hiệu quả với WHO-5 thấp.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-end shrink-0 w-32">
                    {isMeditationUnlocked ? (
                      <span className="text-[9px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider flex items-center gap-1 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">
                        <Unlock className="w-3 h-3" /> Mở khóa
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">
                        <Lock className="w-3 h-3" /> Đã khóa
                      </span>
                    )}
                    {isMeditationUnlocked && (
                      <button onClick={() => setActivePanel("meditation")} className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-md">Thực hành</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity 4: Depression CBT (Span 2x1) */}
              <div className={`col-span-1 md:col-span-2 p-5 rounded-3xl border flex flex-col justify-between transition-all hover:scale-[1.02] shadow-sm hover:shadow-xl ${
                isDepressionUnlocked 
                  ? "bg-gradient-to-br from-red-500/10 to-rose-500/5 border-red-500/20 dark:border-red-500/30" 
                  : "bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-70 grayscale"
              }`}>
                <div className="flex flex-col md:flex-row gap-4 justify-between h-full">
                  <div className="space-y-3 flex-1 text-left">
                    <span className="inline-block p-2.5 rounded-xl bg-red-500 text-white shadow-lg shadow-red-500/30">
                      <Heart className="w-5 h-5 animate-pulse" />
                    </span>
                    <div>
                      <h5 className="text-[12px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Nhật Ký Trầm Cảm (CBT)</h5>
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-bold mt-1">
                        Sử dụng liệu pháp nhận thức hành vi để đẩy lùi triệu chứng trầm cảm.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-end shrink-0 w-32">
                    {isDepressionUnlocked ? (
                      <span className="text-[9px] font-black uppercase text-red-600 dark:text-red-400 tracking-wider flex items-center gap-1 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">
                        <Unlock className="w-3 h-3" /> Đã mở khóa
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">
                        <Lock className="w-3 h-3" /> Đã khóa
                      </span>
                    )}
                    {isDepressionUnlocked && (
                      <button onClick={() => setActivePanel("depression")} className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-md">Thực hành</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity 3: Hít thở 4-7-8 (Span 1x1) */}
              <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-all hover:scale-[1.02] shadow-sm hover:shadow-xl ${
                isBreathingUnlocked 
                  ? "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20 dark:border-amber-500/30" 
                  : "bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-70 grayscale"
              }`}>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="p-2.5 rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
                      <Activity className="w-5 h-5" />
                    </span>
                    {isBreathingUnlocked ? (
                      <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">
                        <Unlock className="w-3 h-3" /> Sẵn sàng
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">
                        <Lock className="w-3 h-3" /> Đã khóa
                      </span>
                    )}
                  </div>
                  <h5 className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide mt-2">Hít thở 4-7-8</h5>
                  <p className="text-[9.5px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-bold line-clamp-2">
                    Làm dịu lo âu, nhịp tim nhanh.
                  </p>
                </div>
                {isBreathingUnlocked && (
                  <button onClick={() => setActivePanel("breath")} className="mt-auto w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95">Mở</button>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* 2. Reading Panel */}
      {activePanel === "reading" && (
        <ReadingTherapy
          onBack={() => setActivePanel(null)}
          onCompleteActivity={handleCompleteActivity}
          showToast={showToast}
        />
      )}

      {/* 3. Meditation Panel */}
      {activePanel === "meditation" && (
        <MeditationTherapy
          onBack={() => setActivePanel(null)}
          onCompleteActivity={handleCompleteActivity}
          showToast={showToast}
        />
      )}

      {/* 4. Breathing Panel */}
      {activePanel === "breath" && (
        <BreathingTherapy
          onBack={() => setActivePanel(null)}
          onCompleteActivity={handleCompleteActivity}
          showToast={showToast}
        />
      )}

      {/* 5. Depression CBT Panel */}
      {activePanel === "depression" && (
        <DepressionCbtTherapy
          onBack={() => setActivePanel(null)}
          onCompleteActivity={handleCompleteActivity}
          showToast={showToast}
        />
      )}
    </div>
  );
}
