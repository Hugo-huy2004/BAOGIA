import React, { useState, useEffect } from "react";
import { CloudSun, Sun, CloudRain, Sparkles } from "lucide-react";

export default function ZenlyWeatherWidget() {
  const [temp, setTemp] = useState(28);
  const [condition, setCondition] = useState("Nắng Đẹp ☀️");

  useEffect(() => {
    // Dynamic slight variance for live feel
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 17) {
      setTemp(28);
      setCondition("Nắng Nhẹ 🌤️");
    } else {
      setTemp(24);
      setCondition("Mát Mẻ 🌙");
    }
  }, []);

  return (
    <div className="relative group w-full h-[148px] rounded-[28px] p-4 text-white shadow-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 border border-white/40">
      {/* Zenly 3D Floating Clouds Decor */}
      <div className="absolute -right-3 -top-3 opacity-30 pointer-events-none">
        <CloudSun className="w-24 h-24 text-white" />
      </div>
      <div className="absolute -left-6 -bottom-6 opacity-20 pointer-events-none">
        <Sparkles className="w-20 h-20 text-white" />
      </div>

      <div className="relative z-10 flex flex-col justify-between h-full text-left">
        {/* Top: Location & Zenly Badge */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black tracking-wide text-white/90 uppercase drop-shadow-sm">
              TP. Hồ Chí Minh
            </h4>
            <span className="text-[10px] font-bold text-white/80 block">
              Zenly Weather 🎨
            </span>
          </div>

          <div className="px-2 py-0.5 rounded-full bg-white/30 backdrop-blur-md text-[10px] font-black tracking-wider text-white shadow-xs">
            {condition}
          </div>
        </div>

        {/* Bottom: Big Temperature & High/Low */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-4xl font-black tracking-tighter leading-none text-white drop-shadow-md">
              {temp}°C
            </div>
            <p className="text-[10px] font-bold text-white/90 mt-1">
              Trời trong · Đẹp trời
            </p>
          </div>

          <div className="text-right text-[10px] font-mono font-bold text-white/90">
            <p>Cao: 32°</p>
            <p>Thấp: 24°</p>
          </div>
        </div>
      </div>
    </div>
  );
}
