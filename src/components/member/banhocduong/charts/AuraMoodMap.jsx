import React from "react";
import { Sparkles, Heart } from "lucide-react";

export default function AuraMoodMap({ historyLogs = [] }) {
  const checkins = (historyLogs || []).filter(l => l.type === "checkin");
  const recent = checkins.slice(-7);
  
  // Calculate average mood
  let avgMood = 3;
  if (recent.length > 0) {
    const sum = recent.reduce((acc, curr) => acc + (curr.mood || 3), 0);
    avgMood = sum / recent.length;
  }

  // Determine Aura Theme & Colors based on average mood
  let auraTitle = "Hào Quang Cân Bằng (Balanced Teal Aura)";
  let auraDesc = "Tâm trí cậu đang ở trạng thái cân bằng hoặc trung lập. Có một chút lắng đọng nhẹ, là thời điểm tuyệt vời để tự chiêm nghiệm và tĩnh tâm.";
  let auraGlow = "rgba(45, 212, 191, 0.4)"; // Teal glow
  let glowClasses = "from-teal-500/20 via-cyan-500/25 to-transparent";

  if (avgMood <= 2.2) {
    auraTitle = "Hào Quang Lắng Đọng (Deep Indigo Aura)";
    auraDesc = "Gần đây cậu đang phải trải qua những cảm xúc nặng nề hoặc áp lực dồn nén. Hào quang trầm ấm này nhắc nhở cậu hãy nhẹ nhàng với bản thân và tìm kiếm sự nâng đỡ.";
    auraGlow = "rgba(129, 140, 248, 0.4)"; // Indigo glow
    glowClasses = "from-indigo-500/20 via-purple-500/25 to-transparent";
  } else if (avgMood >= 3.8) {
    auraTitle = "Hào Quang Rạng Rỡ (Radiant Emerald-Gold)";
    auraDesc = "Tâm trí cậu đang tràn ngập năng lượng tích cực, sự ấm áp và bình yên. Sắc hào quang rạng rỡ này rất tốt để cậu chia sẻ niềm vui tới mọi người xung quanh.";
    auraGlow = "rgba(52, 211, 153, 0.4)"; // Emerald glow
    glowClasses = "from-emerald-500/20 via-amber-500/20 to-transparent";
  }

  return (
    <div className="relative z-10 p-5 rounded-3xl border border-zinc-800 bg-black/40 overflow-hidden space-y-4 text-zinc-100">
      {/* Background glowing aura blob */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-60 pointer-events-none transition-all duration-1000 animate-pulse"
        style={{
          background: `radial-gradient(circle, ${auraGlow} 0%, rgba(0,0,0,0) 70%)`
        }}
      />

      <div className="relative z-10 flex items-center justify-between border-b pb-2 border-zinc-800/80">
        <span className="text-[10px] font-black uppercase text-warning tracking-wider flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Bản đồ hào quang cảm xúc
        </span>
        <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400 bg-white/5 px-2 py-0.5 rounded">
          {recent.length}/7 ngày gần nhất
        </span>
      </div>

      <div className="relative z-10 flex flex-col items-center py-4 space-y-3">
        {/* Glowing floating core */}
        <div 
          className={`w-32 h-32 rounded-full bg-gradient-to-tr ${glowClasses} blur-[2px] border border-white/10 flex items-center justify-center relative animate-bounce`}
          style={{ animationDuration: '6s' }}
        >
          <div className="absolute inset-2 rounded-full border border-white/5 backdrop-blur-md flex flex-col items-center justify-center text-center p-2 bg-zinc-900/60">
            <span className="text-[8px] font-black uppercase text-zinc-400">Chỉ số Mood</span>
            <span className="text-2xl font-mono font-black mt-0.5 text-zinc-100">{avgMood.toFixed(1)}</span>
          </div>
        </div>

        <div className="text-center space-y-1 max-w-sm">
          <h5 className="text-[13px] font-black text-white uppercase tracking-wide">
            {auraTitle}
          </h5>
          <p className="text-[10.5px] text-zinc-300 font-bold leading-relaxed">
            {auraDesc}
          </p>
        </div>
      </div>

      {/* Mood History Chart snippet */}
      <div className="relative z-10 bg-black/40 border border-white/5 rounded-2xl p-3">
        <h6 className="text-[9px] font-black uppercase tracking-wider text-zinc-400 mb-2 text-left">Nhật ký trạng thái tuần này:</h6>
        {recent.length === 0 ? (
          <p className="text-[9.5px] text-zinc-500 font-bold italic text-center py-2">
            Chưa có ghi chép nào. Hãy điểm danh cảm xúc hôm nay nhé!
          </p>
        ) : (
          <div className="flex justify-between items-end h-16 pt-2">
            {recent.map((log, idx) => {
              const heightPct = (log.mood / 5) * 100;
              const barColors = 
                log.mood <= 2 ? "bg-indigo-500/80" : 
                log.mood === 3 ? "bg-teal-500/80" : "bg-emerald-500/80";
              
              // Get day name
              const dateObj = new Date(log.date);
              const dayStr = dateObj.toLocaleDateString("vi-VN", { weekday: "short" });

              return (
                <div key={idx} className="flex flex-col items-center flex-1 group">
                  <div className="w-full px-1 flex items-end h-10">
                    <div 
                      className={`w-full rounded-t ${barColors} transition-all duration-500`}
                      style={{ height: `${heightPct}%` }}
                      title={`Tâm trạng: ${log.mood}/5 - ${log.note || ""}`}
                    />
                  </div>
                  <span className="text-[7.5px] font-mono font-black text-zinc-500 mt-1">
                    {dayStr}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
