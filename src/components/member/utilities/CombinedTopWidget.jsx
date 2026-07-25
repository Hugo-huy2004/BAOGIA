import React, { useState, useEffect } from "react";
import { CloudSun, Sparkles } from "lucide-react";

export default function CombinedTopWidget() {
  const [now, setNow] = useState(new Date());
  const [temp, setTemp] = useState(28);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const dateStr = now.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "numeric"
  });

  return (
    <div className="relative w-full h-[148px] rounded-[30px] shadow-2xl overflow-hidden border border-white/20 dark:border-white/10 flex text-white select-none transition-all duration-300 hover:scale-[1.01] cursor-pointer">
      
      {/* ── LEFT HALF: ZENLY CUTE WEATHER (50% Width) ─────────────────────── */}
      <div className="w-1/2 h-full bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-4 flex flex-col justify-between relative overflow-hidden text-left border-r border-white/20">
        <div className="absolute -right-3 -top-3 opacity-25 pointer-events-none">
          <CloudSun className="w-20 h-20 text-white" />
        </div>
        
        {/* Weather Header */}
        <div className="flex items-center justify-between z-10">
          <span className="text-[11px] font-black uppercase tracking-wider text-white/90 drop-shadow-xs truncate">
            TP. HỒ CHÍ MINH
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/30 text-[9px] font-black tracking-wider text-white">
            Nắng Nhẹ 🌤️
          </span>
        </div>

        {/* Temperature & Condition */}
        <div className="z-10">
          <div className="text-3xl font-black tracking-tighter leading-none text-white drop-shadow-md">
            {temp}°C
          </div>
          <p className="text-[10px] font-bold text-white/90 mt-1 truncate">
            Trời trong · Cao 32° Thấp 24°
          </p>
        </div>
      </div>

      {/* ── RIGHT HALF: APPLE CLOCK & CALENDAR (50% Width) ───────────────── */}
      <div className="w-1/2 h-full bg-zinc-950/95 dark:bg-black p-4 flex flex-col justify-between relative text-right">
        {/* Clock Header */}
        <div className="flex items-center justify-between z-10">
          <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">
            APPLE CLOCK
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Thời gian thực"></span>
        </div>

        {/* Big Digital Clock Readout */}
        <div className="z-10">
          <div className="text-3xl font-black font-mono tracking-tight text-white leading-none drop-shadow-sm">
            {timeStr}
          </div>
          <p className="text-[10px] font-bold text-zinc-400 capitalize mt-1">
            {dateStr}
          </p>
        </div>
      </div>

    </div>
  );
}
