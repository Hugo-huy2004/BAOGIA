import React from "react";
import { Sparkles, Activity, Calendar } from "lucide-react";

export default function AuraMoodMap({ historyLogs = [] }) {
  const checkins = (historyLogs || []).filter(l => l.type === "checkin");
  const recent = checkins.slice(-7);
  
  // Calculate average mood
  let avgMood = 3.5;
  if (recent.length > 0) {
    const sum = recent.reduce((acc, curr) => acc + (curr.mood || 3), 0);
    avgMood = sum / recent.length;
  }

  // Determine Aura Theme & Colors based on average mood
  let auraTitle = "Hào Quang Cân Bằng (Balanced Teal Aura)";
  let auraDesc = "Tâm trí cậu đang ở trạng thái cân bằng và tĩnh tại. Là thời điểm tuyệt vời để tự chiêm nghiệm và học tập.";
  let auraGlow = "rgba(20, 184, 166, 0.35)"; // Teal
  let glowClasses = "from-teal-500 via-cyan-400 to-emerald-400";
  let moodBadgeColor = "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20";

  if (avgMood <= 2.2) {
    auraTitle = "Hào Quang Lắng Đọng (Deep Violet Aura)";
    auraDesc = "Cậu đang trải qua những cảm xúc dồn nén hoặc áp lực. Hào quang nhắc nhở cậu hãy thả lỏng và tìm sự nâng đỡ.";
    auraGlow = "rgba(139, 92, 246, 0.35)"; // Violet
    glowClasses = "from-violet-500 via-purple-400 to-indigo-500";
    moodBadgeColor = "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20";
  } else if (avgMood >= 3.8) {
    auraTitle = "Hào Quang Rạng Rỡ (Radiant Emerald Gold)";
    auraDesc = "Tâm trí cậu tràn ngập năng lượng tích cực và sự ấm áp. Hãy lan tỏa niềm vui và sự lạc quan này nhé!";
    auraGlow = "rgba(16, 185, 129, 0.35)"; // Emerald
    glowClasses = "from-emerald-500 via-teal-400 to-amber-400";
    moodBadgeColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  }

  return (
    <div className="relative z-10 p-5 rounded-3xl border border-border/60 bg-white/70 dark:bg-card/70 backdrop-blur-xl shadow-lg overflow-hidden space-y-4 text-left transition-all hover:shadow-xl">
      {/* Background glowing aura blob */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl opacity-50 pointer-events-none transition-all duration-1000 animate-pulse"
        style={{
          background: `radial-gradient(circle, ${auraGlow} 0%, rgba(0,0,0,0) 70%)`
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b pb-3 border-border/60">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
            Bản Đồ Hào Quang Cảm Xúc
          </h4>
        </div>
        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${moodBadgeColor}`}>
          {recent.length}/7 ngày điểm danh
        </span>
      </div>

      {/* Floating Glowing Aura Core */}
      <div className="relative z-10 flex flex-col items-center py-2 space-y-3">
        <div className="relative flex items-center justify-center">
          <div 
            className={`w-28 h-28 rounded-full bg-gradient-to-tr ${glowClasses} p-1 shadow-lg shadow-primary/20 animate-pulse`}
          >
            <div className="w-full h-full rounded-full bg-white dark:bg-zinc-950 backdrop-blur-md flex flex-col items-center justify-center text-center p-2">
              <span className="text-[8px] font-black uppercase text-muted-foreground tracking-wider">Chỉ Số Mood</span>
              <span className="text-2xl font-black text-foreground mt-0.5">{avgMood.toFixed(1)}</span>
              <span className="text-[8px] font-bold text-muted-foreground">/ 5.0</span>
            </div>
          </div>
        </div>

        <div className="text-center space-y-1 max-w-md px-2">
          <h5 className="text-xs font-black text-foreground uppercase tracking-wide">
            {auraTitle}
          </h5>
          <p className="text-[11px] text-muted-foreground font-bold leading-relaxed">
            {auraDesc}
          </p>
        </div>
      </div>

      {/* Weekly Mood Bar Chart */}
      <div className="relative z-10 bg-muted/40 border border-border/60 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <h6 className="text-[9.5px] font-black uppercase tracking-wider text-foreground">
            Nhật Ký Cảm Xúc 7 Ngày Gần Nhất
          </h6>
          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
        </div>

        {recent.length === 0 ? (
          <p className="text-[10px] text-muted-foreground font-bold italic text-center py-3">
            Chưa có ghi chép cảm xúc. Hãy thực hiện điểm danh hôm nay nhé!
          </p>
        ) : (
          <div className="flex justify-between items-end h-16 pt-2 gap-1.5">
            {recent.map((log, idx) => {
              const heightPct = Math.max(20, (log.mood / 5) * 100);
              const barColors = 
                log.mood <= 2 ? "bg-violet-500" : 
                log.mood === 3 ? "bg-teal-500" : "bg-emerald-500";
              
              const d = new Date(log.date);
              const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
              const dayStr = dayNames[d.getDay()];

              return (
                <div key={idx} className="flex flex-col items-center flex-1 group">
                  <div className="w-full px-1 flex items-end h-11">
                    <div 
                      className={`w-full rounded-t-md ${barColors} shadow-sm group-hover:scale-105 transition-all duration-300`}
                      style={{ height: `${heightPct}%` }}
                      title={`Tâm trạng: ${log.mood}/5 - ${log.note || ""}`}
                    />
                  </div>
                  <span className="text-[8.5px] font-black text-muted-foreground mt-1">
                    {dayStr}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 365-day Emotional Heatmap Matrix */}
      <div className="relative z-10 bg-muted/40 border border-border/60 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <h6 className="text-[9.5px] font-black uppercase tracking-wider text-foreground">
              Ma Trận Cảm Xúc 365 Ngày (Heatmap)
            </h6>
          </div>
          <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-muted-foreground/30" /> Trống</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-violet-500" /> Trầm</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-teal-500" /> Vừa</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> Vui</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="grid grid-rows-7 grid-flow-col gap-1 min-w-[480px]">
            {Array.from({ length: 140 }).map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (139 - i));
              const dateKey = d.toISOString().split("T")[0];
              const matchedLog = checkins.find((c) => (c.date || "").startsWith(dateKey));

              let color = "bg-muted-foreground/20";
              if (matchedLog) {
                if (matchedLog.mood <= 2) color = "bg-violet-500 shadow-xs shadow-violet-500/50";
                else if (matchedLog.mood === 3) color = "bg-teal-500 shadow-xs shadow-teal-500/50";
                else color = "bg-emerald-500 shadow-xs shadow-emerald-500/50";
              }

              return (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-[2.5px] ${color} hover:scale-125 transition-all cursor-pointer`}
                  title={`${dateKey}: ${matchedLog ? `Mood ${matchedLog.mood}/5` : "Chưa check-in"}`}
                />
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
