import React, { useState, useEffect } from "react";

export default function AppleClockWidget() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours();

  const secAngle = seconds * 6;
  const minAngle = (minutes + seconds / 60) * 6;
  const hourAngle = ((hours % 12) + minutes / 60) * 30;

  const timeStr = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  const dayStr = now.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "numeric"
  });

  return (
    <div className="relative w-full h-[148px] rounded-[28px] p-4 bg-zinc-950/95 dark:bg-black text-white border border-white/15 shadow-xl flex items-center justify-between overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer text-left">
      
      {/* Left: Authentic Ticking Apple Analog Clock Face */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-25 h-25 drop-shadow-md">
          {/* Clock Outer Dial */}
          <circle cx="50" cy="50" r="46" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />

          {/* 12 Hour Ticks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30;
            const isMajor = i % 3 === 0;
            return (
              <line
                key={i}
                x1="50"
                y1={isMajor ? "10" : "12"}
                x2="50"
                y2={isMajor ? "16" : "14"}
                stroke={isMajor ? "#f4f4f5" : "#71717a"}
                strokeWidth={isMajor ? "2.2" : "1"}
                transform={`rotate(${angle} 50 50)`}
              />
            );
          })}

          {/* Hour Hand */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="26"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            transform={`rotate(${hourAngle} 50 50)`}
          />

          {/* Minute Hand */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="18"
            stroke="#e4e4e7"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${minAngle} 50 50)`}
          />

          {/* Second Hand (Apple Orange Needle) */}
          <line
            x1="50"
            y1="56"
            x2="50"
            y2="14"
            stroke="#f97316"
            strokeWidth="1.5"
            strokeLinecap="round"
            transform={`rotate(${secAngle} 50 50)`}
          />

          {/* Center Hub Pin */}
          <circle cx="50" cy="50" r="3" fill="#f97316" />
          <circle cx="50" cy="50" r="1.5" fill="#ffffff" />
        </svg>
      </div>

      {/* Right: Digital Readout & Date */}
      <div className="flex flex-col justify-center text-right pl-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">
          ĐỒNG HỒ APPLE
        </span>
        
        <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono text-white leading-none my-1">
          {timeStr}
        </div>

        <span className="text-[11px] font-bold text-zinc-400 capitalize">
          {dayStr} · TP.HCM
        </span>
      </div>

    </div>
  );
}
