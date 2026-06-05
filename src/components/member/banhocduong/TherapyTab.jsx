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
        <div className="space-y-6">
          <div className="text-center space-y-1.5 max-w-md mx-auto">
            <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase">
              Phương Pháp Lâm Sàng
            </span>
            <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-150 uppercase tracking-wider">
              Thẻ Trị Liệu Tâm Lý
            </h4>
            <p className="text-[10.5px] text-zinc-500 dark:text-zinc-455 leading-relaxed font-bold">
              Dựa trên kết quả đánh giá lâm sàng hoặc quét hồ sơ bệnh án của phòng khám, hệ thống sẽ tự động mở khóa các bài tập trị liệu phù hợp nhất với tình trạng của em.
            </p>
          </div>
 
          {!hasActiveJourneyOrResults ? (
            <div className="max-w-md mx-auto text-center p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-white/40 dark:bg-black/5 rounded-3xl space-y-4 animate-scaleUp shadow-sm">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto text-zinc-400">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Trò chuyện cùng Chuyên viên Đồng Hành</h4>
              <p className="text-[10.5px] text-zinc-550 dark:text-zinc-450 leading-relaxed font-bold">
                Em cần trò chuyện cùng Chuyên viên Đồng Hành trước để tôi lắng nghe chia sẻ, từ đó định hướng bài kiểm tra phù hợp và mở khóa các liệu pháp tự chăm sóc đúng với tình trạng của em nhé.
              </p>
              <button
                type="button"
                onClick={() => onNavigateToTab && onNavigateToTab("chat")}
                className="px-5 py-2.5 rounded-xl border-2 border-zinc-900 dark:border-zinc-800 bg-[#0071e3] text-white text-[9.5px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-[#0077ed] active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                Trò chuyện cùng Chuyên viên ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Activity 1: Đọc sách */}
              <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                isReadingUnlocked 
                  ? "bg-white dark:bg-zinc-900/50 border-zinc-950 dark:border-zinc-800 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)]" 
                  : "bg-zinc-100 dark:bg-zinc-955/20 border-zinc-200 dark:border-zinc-900 opacity-60"
              }`}>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </span>
                    {isReadingUnlocked ? (
                      <span className="text-[8px] font-black uppercase text-emerald-500 tracking-wider flex items-center gap-1">
                        <Unlock className="w-2.5 h-2.5" /> Đã mở khóa
                      </span>
                    ) : (
                      <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Bị khóa
                      </span>
                    )}
                  </div>
                  <h5 className="text-xs font-black text-zinc-850 dark:text-zinc-100 uppercase tracking-wide">Đọc sách Trị liệu</h5>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-bold">
                    Dành 30-60 phút tĩnh lặng đọc sách hỗ trợ bởi sóng nhạc trị liệu đặc biệt giúp giảm căng thẳng và mở mang tâm trí.
                  </p>
                </div>
                <div className="pt-4">
                  {isReadingUnlocked ? (
                    <button
                      type="button"
                      onClick={() => setActivePanel("reading")}
                      className="w-full py-2 bg-indigo-500 hover:bg-indigo-650 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95"
                    >
                      Bắt đầu ngay
                    </button>
                  ) : (
                    <div className="text-[9px] text-zinc-400 italic text-center font-bold">Cần làm 1 bài test bất kỳ để kích hoạt</div>
                  )}
                </div>
              </div>

              {/* Activity 2: Ngồi tĩnh tâm */}
              <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                isMeditationUnlocked 
                  ? "bg-white dark:bg-zinc-900/50 border-zinc-950 dark:border-zinc-800 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)]" 
                  : "bg-zinc-100 dark:bg-zinc-955/20 border-zinc-200 dark:border-zinc-900 opacity-60"
              }`}>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="p-2 rounded-xl bg-teal-500/10 text-teal-500 shrink-0">
                      <Activity className="w-5 h-5" />
                    </span>
                    {isMeditationUnlocked ? (
                      <span className="text-[8px] font-black uppercase text-emerald-500 tracking-wider flex items-center gap-1">
                        <Unlock className="w-2.5 h-2.5" /> Đã mở khóa
                      </span>
                    ) : (
                      <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Bị khóa
                      </span>
                    )}
                  </div>
                  <h5 className="text-xs font-black text-zinc-855 dark:text-zinc-100 uppercase tracking-wide">Ngồi Tĩnh Tâm</h5>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-bold">
                    Thư giãn sâu từ 10-20 phút giải tỏa stress và căng thẳng quá mức. Đề xuất cho kết quả WHO-5 thấp hoặc DASS stress cao.
                  </p>
                </div>
                <div className="pt-4">
                  {isMeditationUnlocked ? (
                    <button
                      type="button"
                      onClick={() => setActivePanel("meditation")}
                      className="w-full py-2 bg-teal-500 hover:bg-teal-650 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95"
                    >
                      Bắt đầu ngay
                    </button>
                  ) : (
                    <div className="text-[9px] text-zinc-400 italic text-center font-bold">Yêu cầu test WHO-5 hoặc DASS Stress cao</div>
                  )}
                </div>
              </div>

              {/* Activity 3: Hít thở 4-7-8 */}
              <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                isBreathingUnlocked 
                  ? "bg-white dark:bg-zinc-900/50 border-zinc-950 dark:border-zinc-800 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)]" 
                  : "bg-zinc-100 dark:bg-zinc-955/20 border-zinc-200 dark:border-zinc-900 opacity-60"
              }`}>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                      <Activity className="w-5 h-5 animate-pulse" />
                    </span>
                    {isBreathingUnlocked ? (
                      <span className="text-[8px] font-black uppercase text-emerald-500 tracking-wider flex items-center gap-1">
                        <Unlock className="w-2.5 h-2.5" /> Đã mở khóa
                      </span>
                    ) : (
                      <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Bị khóa
                      </span>
                    )}
                  </div>
                  <h5 className="text-xs font-black text-zinc-855 dark:text-zinc-100 uppercase tracking-wide">Điều hòa nhịp thở 4-7-8</h5>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-bold">
                    Ức chế và làm dịu ngay lo âu, nhịp tim nhanh hoặc các cơn bồn chồn bộc phát tức thời. Đề xuất khi GAD-7 &ge; 5 hoặc DASS Lo âu cao.
                  </p>
                </div>
                <div className="pt-4">
                  {isBreathingUnlocked ? (
                    <button
                      type="button"
                      onClick={() => setActivePanel("breath")}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95"
                    >
                      Bắt đầu ngay
                    </button>
                  ) : (
                    <div className="text-[9px] text-zinc-400 italic text-center font-bold">Yêu cầu test GAD-7 hoặc DASS Lo âu cao</div>
                  )}
                </div>
              </div>

              {/* Activity 4: Depression CBT */}
              <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                isDepressionUnlocked 
                  ? "bg-white dark:bg-zinc-900/50 border-zinc-950 dark:border-zinc-800 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)]" 
                  : "bg-zinc-100 dark:bg-zinc-955/20 border-zinc-200 dark:border-zinc-900 opacity-60"
              }`}>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="p-2 rounded-xl bg-red-500/10 text-red-500 shrink-0">
                      <Heart className="w-5 h-5 animate-pulse" />
                    </span>
                    {isDepressionUnlocked ? (
                      <span className="text-[8px] font-black uppercase text-emerald-500 tracking-wider flex items-center gap-1">
                        <Unlock className="w-2.5 h-2.5" /> Đã mở khóa
                      </span>
                    ) : (
                      <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Bị khóa
                      </span>
                    )}
                  </div>
                  <h5 className="text-xs font-black text-zinc-855 dark:text-zinc-100 uppercase tracking-wide">Trị liệu Trầm Cảm (CBT)</h5>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-bold">
                    Sử dụng nhật ký tích cực và kích hoạt hành động để đẩy lùi triệu chứng trầm cảm. Đề xuất khi PHQ-9 &ge; 5 hoặc DASS Trầm cảm cao.
                  </p>
                </div>
                <div className="pt-4">
                  {isDepressionUnlocked ? (
                    <button
                      type="button"
                      onClick={() => setActivePanel("depression")}
                      className="w-full py-2 bg-red-500 hover:bg-red-650 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95"
                    >
                      Bắt đầu ngay
                    </button>
                  ) : (
                    <div className="text-[9px] text-zinc-400 italic text-center font-bold">Yêu cầu test PHQ-9 hoặc DASS Trầm cảm cao</div>
                  )}
                </div>
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
