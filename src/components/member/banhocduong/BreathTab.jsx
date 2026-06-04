import React, { useState, useEffect, useRef } from "react";

export default function BreathTab() {
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
          // Transition states
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

  const handleStartBreathing = () => {
    setBreathState("inhale");
    setBreathTimer(4);
  };

  const handleStopBreathing = () => {
    setBreathState("idle");
  };

  return (
    <div className="p-6 space-y-6 flex flex-col items-center justify-center text-center animate-fadeIn">
      <div className="space-y-1.5 max-w-sm">
        <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
          Hít Thở Giảm Lo Âu (4-7-8)
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed">
          Thở chậm và điều hòa là liều thuốc giảm stress tự nhiên. Tập trung hít vào (4 giây), nén hơi (7 giây) và thở ra (8 giây).
        </p>
      </div>

      {/* Breathing Ring visual guide */}
      <div className="py-10 relative flex items-center justify-center select-none w-52 h-52">
        {/* Outer pulsing ring */}
        <div
          className={`absolute w-44 h-44 rounded-full border-2 transition-all duration-1000 ${
            breathState === "inhale"
              ? "border-emerald-500/20 scale-[1.35] bg-emerald-500/5"
              : breathState === "hold"
              ? "border-amber-500/20 scale-[1.35] bg-amber-500/5 animate-pulse"
              : breathState === "exhale"
              ? "border-indigo-500/10 scale-100 bg-transparent"
              : "border-zinc-200 dark:border-zinc-800 scale-100 bg-transparent"
          }`}
        />

        {/* Inner core circle */}
        <div
          className={`w-32 h-32 rounded-full flex flex-col items-center justify-center text-white transition-all duration-[4000ms] shadow-lg relative z-10 ${
            breathState === "inhale"
              ? "bg-emerald-500 duration-[4000ms] scale-[1.25]"
              : breathState === "hold"
              ? "bg-amber-500 duration-[7000ms] scale-[1.25]"
              : breathState === "exhale"
              ? "bg-indigo-500 duration-[8000ms] scale-100"
              : "bg-zinc-800 dark:bg-zinc-900 scale-100"
          }`}
        >
          <span className="text-[9px] uppercase tracking-widest font-black opacity-80">
            {breathState === "inhale"
              ? "Hít vào"
              : breathState === "hold"
              ? "Giữ hơi"
              : breathState === "exhale"
              ? "Thở ra"
              : "Sẵn sàng"}
          </span>
          {breathState !== "idle" && (
            <span className="text-3xl font-mono font-black mt-1 animate-scaleUp">{breathTimer}s</span>
          )}
          {breathState === "idle" && (
            <span className="material-symbols-outlined text-2xl mt-1 animate-bounce">air</span>
          )}
        </div>
      </div>

      {/* Actions button */}
      <div className="pt-2">
        {breathState === "idle" ? (
          <button
            type="button"
            onClick={handleStartBreathing}
            className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-black shadow-sm transition-all active:scale-95 uppercase tracking-wider"
          >
            Bắt đầu tập thở
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStopBreathing}
            className="px-6 py-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-black transition-all active:scale-95 uppercase tracking-wider"
          >
            Dừng tập thở
          </button>
        )}
      </div>
    </div>
  );
}
