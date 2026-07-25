import React, { useState, useEffect } from "react";
import { Zap, CloudSun } from "lucide-react";
import { useData } from "../../../context/DataContext";

export default function HugoZenlyMasterWidget() {
  const { data } = useData();
  const [now, setNow] = useState(new Date());

  const userAvatar = data?.member?.avatarUrl || "/image/avt1.png";
  const userName = data?.member?.displayName || "Wishpax Hugo";
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
    weekday: "short",
    day: "numeric",
    month: "numeric"
  });

  return (
    <div className="relative w-full h-[150px] rounded-[30px] p-4 sm:p-5 text-white shadow-[0_16px_40px_rgba(255,45,85,0.3)] overflow-hidden transition-all duration-300 hover:scale-[1.01] cursor-pointer bg-gradient-to-r from-[#FF2D55] via-rose-500 to-amber-400 border border-white/30 flex flex-col justify-between text-left select-none">
      
      {/* ☀️ Zenly Background Ambient Orbits */}
      <div className="absolute -top-6 -right-6 text-6xl opacity-25 pointer-events-none">
        ☀️
      </div>

      {/* ── TOP ROW: CLEAN AVATAR, USER NAME & WEATHER PILL ───────────────── */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Clean Avatar with Live Online Dot */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-white/20">
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-xs" />
          </div>

          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight truncate drop-shadow-sm">
              {userName}
            </h3>
            <p className="text-[11px] font-semibold text-white/90 truncate -mt-0.5">
              TP. Hồ Chí Minh · Greenwich Campus
            </p>
          </div>
        </div>

        {/* Zenly Weather Capsule */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/30 text-white text-[11px] font-black shrink-0 shadow-xs">
          <CloudSun className="w-3.5 h-3.5 text-amber-300" />
          <span>28°C · Nắng Nhẹ</span>
        </div>
      </div>

      {/* ── BOTTOM ROW: LIVE TIME & JOY BALANCE CHIP ─────────────────────── */}
      <div className="relative z-10 flex items-end justify-between gap-3">
        {/* Live Digital Clock & Date */}
        <div>
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white leading-none drop-shadow-md">
            {timeStr}
          </div>
          <span className="text-[11px] font-bold text-white/90 capitalize block mt-1">
            {dateStr}
          </span>
        </div>

        {/* Right JOY Balance Chip */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-black font-black text-xs shadow-lg active:scale-95 transition-all shrink-0">
          <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>{(joyBalance ?? 0).toLocaleString("vi-VN")} JOY</span>
        </div>
      </div>

    </div>
  );
}
