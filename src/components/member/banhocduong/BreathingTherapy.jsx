import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BreathingTherapy({ onBack, onCompleteActivity, showToast }) {
  const [breathState, setBreathState] = useState("idle"); // 'idle', 'inhale', 'hold', 'exhale'
  const [breathTimer, setBreathTimer] = useState(4);
  const breathTimerRef = useRef(null);

  const [timerSecondsLeft, setTimerSecondsLeft] = useState(600);
  const [targetDuration, setTargetDuration] = useState(600);

  // Breathing pattern cycle logic (4-7-8)
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

  // Session duration countdown timer logic
  useEffect(() => {
    if (breathState === "idle") {
      return;
    }

    const timer = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setBreathState("idle");
          if (onCompleteActivity) {
            onCompleteActivity(
              "Hít thở 4-7-8",
              `Hoàn thành liệu pháp thời lượng ${Math.round(targetDuration / 60)} phút.`
            );
          }
          if (showToast) {
            showToast("Tuyệt vời! Cậu vừa hoàn thành thời gian hít thở 4-7-8 điều hòa. Tớ rất tự hào về cậu! 🌸💨", "success");
          }
          return targetDuration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [breathState, targetDuration, onCompleteActivity, showToast]);

  const selectDuration = (secs) => {
    setBreathState("idle");
    setTargetDuration(secs);
    setTimerSecondsLeft(secs);
  };

  const formatTimerTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const ringVariants = {
    idle: { scale: 1, borderColor: "rgba(161, 161, 170, 0.2)", backgroundColor: "transparent" },
    inhale: { scale: 1.4, borderColor: "rgba(16, 185, 129, 0.2)", backgroundColor: "rgba(16, 185, 129, 0.05)", transition: { duration: 4, ease: "easeInOut" } },
    hold: { scale: 1.4, borderColor: "rgba(245, 158, 11, 0.3)", backgroundColor: "rgba(245, 158, 11, 0.05)", transition: { duration: 7, ease: "linear" } },
    exhale: { scale: 1, borderColor: "rgba(99, 102, 241, 0.1)", backgroundColor: "transparent", transition: { duration: 8, ease: "easeInOut" } }
  };

  const coreVariants = {
    idle: { scale: 1, backgroundColor: "#27272a" },
    inhale: { scale: 1.3, backgroundColor: "#10b981", transition: { duration: 4, ease: "easeInOut" } },
    hold: { scale: 1.3, backgroundColor: "#f59e0b", transition: { duration: 7, ease: "linear" } },
    exhale: { scale: 1, backgroundColor: "#6366f1", transition: { duration: 8, ease: "easeInOut" } }
  };

  return (
    <div className="space-y-5 text-center max-w-md mx-auto animate-scaleUp">
      <div className="flex items-center justify-between border-b pb-2 border-zinc-200/50">
        <button type="button" onClick={onBack} className="text-zinc-450 text-[10px] font-black uppercase tracking-wider hover:text-zinc-700">
          Quay lại thẻ
        </button>
        <span className="text-[9.5px] font-black uppercase text-amber-500">Hít thở 4-7-8</span>
      </div>

      <div className="py-4 space-y-4 flex flex-col items-center">
        {/* Timer Presets */}
        <div className="flex justify-center gap-2 mb-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => selectDuration(300)}
            className={`px-3 py-1.5 rounded-md border text-[9px] font-black uppercase tracking-wider transition-colors ${
              targetDuration === 300
                ? "bg-amber-500 border-zinc-950 dark:border-zinc-800 text-zinc-950"
                : "border-zinc-350 dark:border-zinc-800 text-zinc-650 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            5 phút
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => selectDuration(600)}
            className={`px-3 py-1.5 rounded-md border text-[9px] font-black uppercase tracking-wider transition-colors ${
              targetDuration === 600
                ? "bg-amber-500 border-zinc-950 dark:border-zinc-800 text-zinc-950"
                : "border-zinc-350 dark:border-zinc-800 text-zinc-650 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            10 phút
          </motion.button>
        </div>

        {breathState !== "idle" && (
          <div className="text-zinc-500 dark:text-zinc-400 font-mono font-black text-xs">
            Thời gian phiên: {formatTimerTime(timerSecondsLeft)}
          </div>
        )}

        {/* Breathing Ring visual guide */}
        <div className="relative flex items-center justify-center select-none w-44 h-44 my-4">
          <motion.div 
            variants={ringVariants}
            initial="idle"
            animate={breathState}
            className="absolute w-36 h-36 rounded-full border-2" 
          />

          <motion.div 
            variants={coreVariants}
            initial="idle"
            animate={breathState}
            className="w-24 h-24 rounded-full flex flex-col items-center justify-center text-white shadow-lg relative z-10"
          >
            <span className="text-[8px] uppercase tracking-widest font-black opacity-80">
              {breathState === "inhale" ? "Hít vào" :
               breathState === "hold" ? "Giữ hơi" :
               breathState === "exhale" ? "Thở ra" : "Sẵn sàng"}
            </span>
            {breathState !== "idle" && (
              <span className="text-2xl font-mono font-black mt-0.5">{breathTimer}s</span>
            )}
          </motion.div>
        </div>

        <div className="pt-2">
          {breathState === "idle" ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                setTimerSecondsLeft(targetDuration);
                setBreathState("inhale");
              }}
              className="px-6 py-2.5 rounded-md border-2 border-zinc-950 dark:border-zinc-800 bg-[#0071e3] text-white text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] transition-all"
            >
              Bắt đầu tập thở
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                setBreathState("idle");
                setTimerSecondsLeft(targetDuration);
              }}
              className="px-6 py-2.5 rounded-md border-2 border-red-500 text-red-500 bg-white dark:bg-zinc-900 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(239,68,68,0.2)] transition-all"
            >
              Dừng tập thở
            </motion.button>
          )}
        </div>
        <p className="text-[10px] text-zinc-400 italic max-w-xs mx-auto leading-relaxed font-semibold">
          Mẹo: Tập trung cao vào đếm nhịp hít (4s), nén hơi trong lồng ngực (7s) và thở ra hoàn toàn qua kẽ môi (8s). Lặp lại liên tục trong chu kỳ tập để làm dịu tâm trạng.
        </p>
      </div>
    </div>
  );
}
