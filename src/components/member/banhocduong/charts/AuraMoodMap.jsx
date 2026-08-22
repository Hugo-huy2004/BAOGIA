import { Sparkles, Activity, Calendar } from "lucide-react";

function localDayKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function AuraMoodMap({ historyLogs = [] }) {
  // Keep one (the newest) pulse per local calendar day so a re-check does not
  // distort the weekly chart or count as another streak day.
  const pulseByDay = new Map();
  (historyLogs || [])
    .filter((log) => log.type === "checkin" && Number.isFinite(Number(log.mood)))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((log) => pulseByDay.set(localDayKey(log.date), log));
  const checkins = [...pulseByDay.values()];
  const recent = checkins.slice(-7);
  
  const averageOf = (field) => {
    const values = recent.map((log) => Number(log[field])).filter(Number.isFinite);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  };
  const avgMood = averageOf("mood");
  const avgEnergy = averageOf("energy");
  const avgStress = averageOf("stress");

  // Visual trend only — this is deliberately descriptive, not a clinical
  // interpretation of the member's mental health.
  let auraTitle = "Chưa đủ Daily Pulse";
  let auraDesc = "Check-in vài ngày để HugoPSY hiển thị xu hướng từ dữ liệu cậu tự ghi nhận.";
  let auraGlow = "rgba(20, 184, 166, 0.35)"; // Teal
  let glowClasses = "from-teal-500 via-cyan-400 to-emerald-400";
  let moodBadgeColor = "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20";

  if (avgMood !== null && avgMood <= 2.2) {
    auraTitle = "Xu hướng cảm xúc đang thấp";
    auraDesc = "Các check-in gần đây nghiêng về mệt mỏi. Đây là tín hiệu tự ghi nhận để cậu cân nhắc giảm tải và tìm sự nâng đỡ phù hợp.";
    auraGlow = "rgba(139, 92, 246, 0.35)"; // Violet
    glowClasses = "from-violet-500 via-purple-400 to-indigo-500";
    moodBadgeColor = "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20";
  } else if (avgMood !== null && avgMood >= 3.8) {
    auraTitle = "Xu hướng cảm xúc đang tích cực";
    auraDesc = "Các check-in gần đây khá tích cực. Cậu có thể ghi lại điều đang giúp mình để dùng lại vào những ngày khó hơn.";
    auraGlow = "rgba(16, 185, 129, 0.35)"; // Emerald
    glowClasses = "from-emerald-500 via-teal-400 to-amber-400";
    moodBadgeColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  } else if (avgMood !== null) {
    auraTitle = "Xu hướng cảm xúc tương đối ổn định";
    auraDesc = "Các check-in gần đây ở vùng giữa. Tiếp tục ghi nhận năng lượng và áp lực để thấy điều gì đang ảnh hưởng đến nhịp của cậu.";
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

      {/* Three independent signals prevent one mood number from pretending to
          explain the member's whole day. */}
      <div className="relative z-10 grid grid-cols-3 gap-2">
        {[
          { label: "Tâm trạng", value: avgMood, icon: "mood", cls: "text-indigo-600 bg-indigo-500/10" },
          { label: "Năng lượng", value: avgEnergy, icon: "battery_5_bar", cls: "text-sky-600 bg-sky-500/10" },
          { label: "Áp lực", value: avgStress, icon: "speed", cls: "text-violet-600 bg-violet-500/10" },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-border/60 bg-background/70 p-2.5 text-center">
            <span className={`material-symbols-outlined inline-flex h-7 w-7 items-center justify-center rounded-xl text-[15px] ${metric.cls}`}>{metric.icon}</span>
            <p className="mt-1 text-[8px] font-black uppercase tracking-wider text-muted-foreground">{metric.label}</p>
            <p className="text-sm font-black text-foreground">{metric.value === null ? "—" : metric.value.toFixed(1)}<span className="text-[8px] text-muted-foreground"> / 5</span></p>
          </div>
        ))}
      </div>

      {/* Floating Glowing Aura Core */}
      <div className="relative z-10 flex flex-col items-center py-2 space-y-3">
        <div className="relative flex items-center justify-center">
          <div 
            className={`w-28 h-28 rounded-full bg-gradient-to-tr ${glowClasses} p-1 shadow-lg shadow-primary/20 animate-pulse`}
          >
            <div className="w-full h-full rounded-full bg-white dark:bg-zinc-950 backdrop-blur-md flex flex-col items-center justify-center text-center p-2">
              <span className="text-[8px] font-black uppercase text-muted-foreground tracking-wider">Chỉ Số Mood</span>
              <span className="text-2xl font-black text-foreground mt-0.5">{avgMood === null ? "—" : avgMood.toFixed(1)}</span>
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
              const dateKey = localDayKey(d);
              const matchedLog = checkins.find((c) => localDayKey(c.date) === dateKey);

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
