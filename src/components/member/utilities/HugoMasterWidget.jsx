import React, { useState, useEffect } from "react";
import { CloudSun, Sparkles, Zap, MapPin } from "lucide-react";
import { useData } from "../../../context/DataContext";

export default function HugoMasterWidget() {
  const { data } = useData();
  const [now, setNow] = useState(new Date());
  const joyBalance = data?.member?.joyBalance || 1540;

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
    weekday: "long",
    day: "numeric",
    month: "numeric"
  });

  return (
    <div className="relative w-full h-[150px] rounded-[32px] p-5 text-white shadow-[0_16px_45px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300 hover:scale-[1.01] cursor-pointer bg-gradient-to-r from-slate-950 via-purple-950 to-indigo-950 border border-white/20 backdrop-blur-2xl flex flex-col justify-between text-left select-none">
      
      {/* 🌌 Background Ambient Glow & Floating Zenly Orbits */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
      
      {/* ── TOP ROW: HUGO BADGE & ZENLY WEATHER PILL ─────────────────────── */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {/* Hugo Studio Master Label */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          <span className="text-[11px] font-black tracking-widest text-white/90 uppercase font-mono">
            HUGO OS · SÀI GÒN
          </span>
        </div>

        {/* Zenly Weather Capsule Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 text-white shadow-sm">
          <CloudSun className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="text-[11px] font-black">28°C</span>
          <span className="text-[10px] font-medium opacity-90 hidden sm:inline">· Nắng Nhẹ 🌤️</span>
        </div>
      </div>

      {/* ── MAIN MIDDLE ROW: CLOCK & QUICK INFO ──────────────────────────── */}
      <div className="relative z-10 flex items-end justify-between gap-4">
        {/* Huge Digital Clock & Date */}
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl sm:text-5xl font-black font-mono tracking-tighter text-white leading-none drop-shadow-md">
              {timeStr}
            </h2>
            <span className="text-xs font-mono font-bold text-purple-300/80 animate-pulse">
              :{now.getSeconds().toString().padStart(2, "0")}
            </span>
          </div>

          <p className="text-xs font-semibold text-zinc-300 capitalize mt-1.5 drop-shadow-xs">
            {dateStr}
          </p>
        </div>

        {/* Right Action / Balance Chip */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 font-mono font-bold text-xs shadow-sm">
            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{(joyBalance ?? 0).toLocaleString("vi-VN")} JOY</span>
          </div>
          <span className="text-[10px] font-medium text-zinc-400">
            Greenwich Campus ✨
          </span>
        </div>
      </div>

    </div>
  );
}
