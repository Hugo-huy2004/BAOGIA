import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Volume2, VolumeX, Wind, Dumbbell, Play, Pause, RotateCcw } from "lucide-react";

const BREATH_CUES = { inhale: "Hít vào", hold: "Giữ hơi", exhale: "Thở ra" };

const MUSCLE_STEPS = [
  { part: "Bàn tay & cẳng tay", cue: "Siết chặt nắm đấm tay, cảm nhận sức căng cơ..." },
  { part: "Bắp tay", cue: "Gập khuỷu tay lại, căng bắp tay của cậu lên..." },
  { part: "Vai & cổ", cue: "Nhún vai lên sát tai, giữ căng vùng vai gáy..." },
  { part: "Mặt & trán", cue: "Nhíu trán, nheo mắt và mím chặt môi lại..." },
  { part: "Bụng", cue: "Hóp bụng thật chặt, giữ căng cơ bụng..." },
  { part: "Đùi & mông", cue: "Siết chặt cơ đùi và mông của cậu..." },
  { part: "Bàn chân", cue: "Cuộn các ngón chân xuống dưới, cảm nhận lòng bàn chân căng ra..." },
];

export default function BreathingTherapy({ onBack, onCompleteActivity, showToast }) {
  const [activeMode, setActiveMode] = useState("breath"); // 'breath' | 'pmr'
  const [voices, setVoices] = useState([]);

  // Voice setup with premium picker
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  const getBestViVoice = () => {
    const viVoices = voices.filter(v => v.lang.startsWith("vi") || v.lang.includes("vi-VN"));
    if (viVoices.length === 0) return null;
    return (
      viVoices.find(v => v.name.includes("Siri") || v.name.includes("Premium") || v.name.includes("Natural")) ||
      viVoices.find(v => v.name.includes("Google")) ||
      viVoices[0]
    );
  };

  const speakText = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "vi-VN";
    utter.rate = 0.75; // Calm, relaxed speech rate
    utter.pitch = 1.0;
    utter.voice = getBestViVoice();
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // 4-7-8 Breathing State
  // ───────────────────────────────────────────────────────────────────────────
  const [breathState, setBreathState] = useState("idle"); // 'idle', 'inhale', 'hold', 'exhale'
  const [breathTimer, setBreathTimer] = useState(4);
  const breathTimerRef = useRef(null);
  const [breathVoiceEnabled, setBreathVoiceEnabled] = useState(true);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(300);
  const [breathTargetDuration, setBreathTargetDuration] = useState(300);

  // guided voice for breath
  useEffect(() => {
    if (!breathVoiceEnabled || breathState === "idle") return;
    const text = BREATH_CUES[breathState];
    if (text) speakText(text);
  }, [breathState, breathVoiceEnabled]);

  // breath step cycle timer
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
    return () => { if (breathTimerRef.current) clearInterval(breathTimerRef.current); };
  }, [breathState]);

  // breath session timer
  useEffect(() => {
    if (breathState === "idle") return;
    const timer = setInterval(() => {
      setBreathSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setBreathState("idle");
          onCompleteActivity?.("Hít thở 4-7-8", `Hoàn thành liệu pháp thời lượng ${Math.round(breathTargetDuration / 60)} phút.`);
          showToast?.("Tuyệt vời! Cậu vừa hoàn thành phiên hít thở 4-7-8 điều hòa tâm trí. Thật nhẹ nhõm đúng không?", "success");
          return breathTargetDuration;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [breathState, breathTargetDuration]);

  const selectBreathDuration = (secs) => {
    setBreathState("idle");
    setBreathTargetDuration(secs);
    setBreathSecondsLeft(secs);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // PMR Muscle Relaxation State
  // ───────────────────────────────────────────────────────────────────────────
  const [pmrState, setPmrState] = useState("idle"); // 'idle', 'tense', 'relax', 'completed'
  const [pmrStep, setPmrStep] = useState(0);
  const [pmrTimer, setPmrTimer] = useState(5);
  const pmrTimerRef = useRef(null);
  const [pmrVoiceEnabled, setPmrVoiceEnabled] = useState(true);

  // PMR Voice Cues
  useEffect(() => {
    if (pmrState === "idle" || pmrState === "completed" || !pmrVoiceEnabled) return;
    const current = MUSCLE_STEPS[pmrStep];
    if (!current) return;
    if (pmrState === "tense") {
      speakText(`Hãy căng cơ: ${current.part}. ${current.cue}`);
    } else if (pmrState === "relax") {
      speakText("Thở ra nhẹ nhàng, thả lỏng toàn bộ cơ và cảm nhận sự thư giãn hoàn toàn.");
    }
  }, [pmrStep, pmrState, pmrVoiceEnabled]);

  const startPmrStep = (idx, stepPhase = "tense") => {
    if (pmrTimerRef.current) clearInterval(pmrTimerRef.current);
    setPmrStep(idx);
    setPmrState(stepPhase);
    const limit = stepPhase === "tense" ? 5 : 8;
    setPmrTimer(limit);

    pmrTimerRef.current = setInterval(() => {
      setPmrTimer((prev) => {
        if (prev <= 1) {
          clearInterval(pmrTimerRef.current);
          if (stepPhase === "tense") {
            // switch to relax phase
            startPmrStep(idx, "relax");
          } else {
            // go to next muscle step
            const nextIdx = idx + 1;
            if (nextIdx >= MUSCLE_STEPS.length) {
              setPmrState("completed");
              onCompleteActivity?.("Thư giãn cơ PMR", "Hoàn thành bài tập căng-thả 7 nhóm cơ chống lo âu.");
              showToast?.("Chúc mừng cậu đã hoàn thành trọn vẹn bài thực hành thư giãn cơ sâu! Toàn thân nhẹ bẫng rồi đúng không?", "success");
            } else {
              startPmrStep(nextIdx, "tense");
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopPmr = () => {
    if (pmrTimerRef.current) clearInterval(pmrTimerRef.current);
    setPmrState("idle");
    setPmrStep(0);
    setPmrTimer(5);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  };

  const formatTimerTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Ring animation variants for breath
  const ringVariants = {
    idle: { scale: 1, borderColor: "rgba(228, 228, 231, 0.2)", filter: "drop-shadow(0 0 0px rgba(161, 161, 170, 0))" },
    inhale: { scale: 1.5, borderColor: "rgba(16, 185, 129, 0.4)", filter: "drop-shadow(0 0 20px rgba(16, 185, 129, 0.3))", transition: { duration: 4, ease: "easeInOut" } },
    hold: { scale: 1.5, borderColor: "rgba(245, 158, 11, 0.5)", filter: "drop-shadow(0 0 25px rgba(245, 158, 11, 0.4))", transition: { duration: 7, ease: "linear" } },
    exhale: { scale: 1, borderColor: "rgba(99, 102, 241, 0.3)", filter: "drop-shadow(0 0 10px rgba(99, 102, 241, 0.1))", transition: { duration: 8, ease: "easeInOut" } }
  };

  const coreVariants = {
    idle: { scale: 1, backgroundColor: "#27272a" },
    inhale: { scale: 1.25, backgroundColor: "#10b981", transition: { duration: 4, ease: "easeInOut" } },
    hold: { scale: 1.25, backgroundColor: "#f59e0b", transition: { duration: 7, ease: "linear" } },
    exhale: { scale: 1, backgroundColor: "#6366f1", transition: { duration: 8, ease: "easeInOut" } }
  };

  const handleModeChange = (mode) => {
    // stop both sessions on tab change
    setBreathState("idle");
    stopPmr();
    setActiveMode(mode);
  };

  return (
    <div className="space-y-5 text-center max-w-md mx-auto animate-scaleUp bg-gradient-to-br from-zinc-950 via-slate-900 to-indigo-950 text-zinc-100 p-6 rounded-3xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b pb-2.5 border-zinc-800/60">
        <button type="button" onClick={onBack} className="text-zinc-400 text-[10px] font-black uppercase tracking-wider hover:text-zinc-200 transition-colors">
          Quay lại thẻ
        </button>
        <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Hít Thở & Cơ Thể</span>
        <button
          type="button"
          onClick={() => {
            if (activeMode === "breath") {
              setBreathVoiceEnabled(v => !v);
              window.speechSynthesis?.cancel();
            } else {
              setPmrVoiceEnabled(v => !v);
              window.speechSynthesis?.cancel();
            }
          }}
          title={(activeMode === "breath" ? breathVoiceEnabled : pmrVoiceEnabled) ? "Tắt giọng dẫn" : "Bật giọng dẫn"}
          className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md transition-colors ${
            (activeMode === "breath" ? breathVoiceEnabled : pmrVoiceEnabled) 
              ? "text-amber-400 bg-amber-500/10" 
              : "text-zinc-400 bg-white/5 hover:bg-white/10"
          }`}
        >
          { (activeMode === "breath" ? breathVoiceEnabled : pmrVoiceEnabled) ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" /> }
        </button>
      </div>

      {/* Mode Selector */}
      <div className="relative z-10 flex bg-black/40 rounded-xl p-1 shadow-inner border border-white/5">
        <button
          onClick={() => handleModeChange("breath")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
            activeMode === "breath"
              ? "bg-white/10 text-white shadow-md border border-white/5"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Wind className="w-4 h-4 text-emerald-400" />
          Hít thở 4-7-8
        </button>
        <button
          onClick={() => handleModeChange("pmr")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
            activeMode === "pmr"
              ? "bg-white/10 text-white shadow-md border border-white/5"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Dumbbell className="w-4 h-4 text-purple-400" />
          Thư giãn cơ PMR
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeMode === "breath" ? (
          <motion.div
            key="breath"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4 py-2 relative z-10"
          >
            {/* Breath View */}
            <div className="flex justify-center gap-2 mb-2">
              {[
                { time: 120, label: "2 phút" },
                { time: 300, label: "5 phút" },
                { time: 600, label: "10 phút" }
              ].map(item => (
                <button
                  key={item.time}
                  type="button"
                  onClick={() => selectBreathDuration(item.time)}
                  className={`px-3 py-1.5 rounded-md border text-[9px] font-black uppercase tracking-wider transition-all ${
                    breathTargetDuration === item.time
                      ? "bg-amber-500 border-transparent text-white shadow-sm"
                      : "border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {breathState !== "idle" && (
              <div className="text-zinc-400 font-mono font-black text-xs tracking-wider">
                Thời gian: {formatTimerTime(breathSecondsLeft)}
              </div>
            )}

            {/* Breathing Ring visual guide with Glow */}
            <div className="relative flex items-center justify-center select-none w-56 h-56 mx-auto my-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  variants={ringVariants}
                  initial="idle"
                  animate={breathState}
                  className="w-40 h-40 rounded-full border-4"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  variants={coreVariants}
                  initial="idle"
                  animate={breathState}
                  className="w-28 h-28 rounded-full flex flex-col items-center justify-center text-white shadow-xl relative z-10"
                >
                  <span className="text-[8px] uppercase tracking-widest font-black opacity-90">
                    {breathState === "inhale" ? "Hít vào" :
                     breathState === "hold" ? "Giữ hơi" :
                     breathState === "exhale" ? "Thở ra" : "Sẵn sàng"}
                  </span>
                  {breathState !== "idle" && (
                    <span className="text-2xl font-mono font-black mt-0.5">{breathTimer}s</span>
                  )}
                </motion.div>
              </div>
            </div>

            <div className="pt-2">
              {breathState === "idle" ? (
                <button
                  type="button"
                  onClick={() => {
                    setBreathSecondsLeft(breathTargetDuration);
                    setBreathState("inhale");
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all border border-emerald-500/30"
                >
                  Bắt đầu hít thở
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setBreathState("idle")}
                  className="px-6 py-2.5 rounded-xl border-2 border-red-500 hover:bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
                >
                  Dừng hít thở
                </button>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 italic max-w-xs mx-auto leading-relaxed font-bold mt-4">
              "Phương pháp 4-7-8 kích hoạt trực tiếp dây thần kinh phế vị, giúp nhịp tim của cậu dịu lại ngay lập tức."
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="pmr"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4 py-2 relative z-10"
          >
            {/* PMR View */}
            {pmrState === "idle" ? (
              <div className="space-y-4 text-left">
                <p className="text-[10.5px] text-zinc-300 font-bold leading-relaxed">
                  Kỹ thuật PMR (Thư Giãn Cơ Sâu) giúp gạt bỏ căng thẳng thể chất bằng cách căng cơ trong 5 giây, sau đó buông lỏng đột ngột để cơ bắp thư giãn trong 8 giây.
                </p>
                <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-3xl">
                  <h6 className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400 mb-1">Các nhóm cơ thực hiện:</h6>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-zinc-300">
                    {MUSCLE_STEPS.map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center text-[9px] shrink-0">{i+1}</span>
                        <span>{s.part}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => startPmrStep(0, "tense")}
                  className="w-full py-3 rounded-xl bg-purple-650 hover:bg-purple-650/80 text-white text-[10px] font-black uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all border border-purple-500/30"
                >
                  Bắt đầu thư giãn cơ
                </button>
              </div>
            ) : pmrState === "completed" ? (
              <div className="py-10 space-y-4 text-center">
                <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <Dumbbell className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] font-black text-zinc-100">Đã Hoàn Thành Bài Tập PMR!</p>
                  <p className="text-[10px] text-zinc-400 font-bold max-w-xs mx-auto leading-relaxed">
                    Cơ thể cậu đã được giải tỏa hoàn toàn các axit lactic tích tụ do căng thẳng kéo dài.
                  </p>
                </div>
                <button
                  onClick={stopPmr}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  Luyện tập lại
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 py-4">
                {/* PMR Active Visuals */}
                <div className="flex gap-1">
                  {MUSCLE_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                        i < pmrStep
                          ? "bg-purple-500"
                          : i === pmrStep
                            ? "bg-purple-400 scale-y-110 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                            : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>

                <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-1000 relative mx-auto ${
                  pmrState === "tense"
                    ? "border-red-500 bg-red-500/10 scale-110 shadow-[0_0_25px_rgba(239,68,68,0.3)]"
                    : "border-purple-500 bg-purple-500/10 scale-100 shadow-[0_0_25px_rgba(168,85,247,0.3)]"
                }`}>
                  <span className="text-3xl font-black text-zinc-100">{pmrTimer}s</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                    {pmrState === "tense" ? "Căng Cơ" : "Thả Lỏng"}
                  </span>
                </div>

                <div className="text-center space-y-1 max-w-xs">
                  <p className="text-[12px] font-black text-purple-450 uppercase tracking-wide">
                    {MUSCLE_STEPS[pmrStep].part}
                  </p>
                  <p className="text-[10px] text-zinc-300 font-bold leading-relaxed min-h-[30px]">
                    {pmrState === "tense" ? MUSCLE_STEPS[pmrStep].cue : "Từ từ thở ra qua miệng, cảm nhận sự nhẹ nhõm lan tỏa..."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={stopPmr}
                  className="flex items-center gap-1.5 px-4 py-2 border-2 border-red-550/20 hover:bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Dừng thực hành
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
