import React, { useState, useEffect, useRef } from "react";

export default function BreathingTherapy({ onBack }) {
  const [breathState, setBreathState] = useState("idle"); // 'idle', 'inhale', 'hold', 'exhale'
  const [breathTimer, setBreathTimer] = useState(4);
  const breathTimerRef = useRef(null);

  useEffect(() => {
    if (breathState === "idle") {
      setBreathTimer(4);
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
      return;
    }

    breathTimerRef.current = setInterval(() => {
      setBreathTimer((prev) => {
        if (prev <= 1) {
          if (breathState === "inhale") {
            setBreathState("hold");
            return 7;
          } else if (breathState === "hold") {
            setBreathState("exhale");
            return 8;
          } else if (breathState === "exhale") {
            setBreathState("inhale");
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    };
  }, [breathState]);

  return (
    <div className="space-y-5 text-center max-w-md mx-auto animate-scaleUp">
      <div className="flex items-center justify-between border-b pb-2 border-zinc-200/50">
        <button type="button" onClick={onBack} className="text-zinc-450 text-[10px] font-black uppercase tracking-wider hover:text-zinc-700">
          Quay lại thẻ
        </button>
        <span className="text-[9.5px] font-black uppercase text-amber-500">Hít thở 4-7-8</span>
      </div>

      <div className="py-4 space-y-4 flex flex-col items-center">
        {/* Breathing Ring visual guide */}
        <div className="relative flex items-center justify-center select-none w-44 h-44 my-4">
          <div className={`absolute w-36 h-36 rounded-full border-2 transition-all duration-[3000ms] ${
            breathState === "inhale" ? "border-emerald-500/20 scale-[1.35] bg-emerald-500/5" :
            breathState === "hold" ? "border-amber-500/20 scale-[1.35] bg-amber-500/5 animate-pulse" :
            breathState === "exhale" ? "border-indigo-500/10 scale-100 bg-transparent" :
            "border-zinc-200 dark:border-zinc-800 scale-100 bg-transparent"
          }`} />

          <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center text-white transition-all shadow-lg relative z-10 ${
            breathState === "inhale" ? "bg-emerald-500 duration-[4000ms] scale-[1.25]" :
            breathState === "hold" ? "bg-amber-500 duration-[7000ms] scale-[1.25]" :
            breathState === "exhale" ? "bg-indigo-500 duration-[8000ms] scale-100" :
            "bg-zinc-800 dark:bg-zinc-900 scale-100"
          }`}>
            <span className="text-[8px] uppercase tracking-widest font-black opacity-80">
              {breathState === "inhale" ? "Hít vào" :
               breathState === "hold" ? "Giữ hơi" :
               breathState === "exhale" ? "Thở ra" : "Sẵn sàng"}
            </span>
            {breathState !== "idle" && (
              <span className="text-2xl font-mono font-black mt-0.5">{breathTimer}s</span>
            )}
          </div>
        </div>

        <div className="pt-2">
          {breathState === "idle" ? (
            <button
              type="button"
              onClick={() => setBreathState("inhale")}
              className="px-6 py-2.5 rounded-xl border-2 border-zinc-950 dark:border-zinc-800 bg-[#0071e3] text-white text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              Bắt đầu tập thở
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setBreathState("idle")}
              className="px-6 py-2.5 rounded-xl border-2 border-red-500 text-red-500 bg-white dark:bg-zinc-900 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(239,68,68,0.2)] transition-all active:scale-95"
            >
              Dừng tập thở
            </button>
          )}
        </div>
        <p className="text-[10px] text-zinc-400 italic max-w-xs mx-auto leading-relaxed font-semibold">
          Mẹo: Tập trung cao vào đếm nhịp hít (4s), nén hơi trong lồng ngực (7s) và thở ra hoàn toàn qua kẽ môi (8s). Lặp lại 4-5 chu kỳ để ức chế các cơn lo âu đột ngột.
        </p>
      </div>
    </div>
  );
}
