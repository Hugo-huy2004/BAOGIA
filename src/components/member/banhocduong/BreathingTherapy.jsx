import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Volume2, VolumeX, Wind, Dumbbell, RotateCcw, CloudRain, Waves, Bell, Music } from "lucide-react";
import { getBestViVoice } from "./utils/getBestViVoice";
import { MUSCLE_STEPS } from "./constants/pmrSteps";

const BREATH_CUES = { inhale: "Hít vào", hold: "Giữ hơi", exhale: "Thở ra" };

// ─────────────────────────────────────────────────────────────────────────────
// WEB AUDIO API SYNTHESIZER (100% self-contained, no network lag or broken assets)
// ─────────────────────────────────────────────────────────────────────────────
let audioCtx = null;
let ambientNodes = null; // Stores currently playing Web Audio Nodes

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function startAmbientSound(type) {
  stopAmbientSound();
  const ctx = getAudioContext();
  if (!ctx) return;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 1.5); // Fade in over 1.5s
  gainNode.connect(ctx.destination);

  if (type === "rain" || type === "waves") {
    // Generate white noise programmatically
    const bufferSize = ctx.sampleRate * 2; 
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    
    if (type === "rain") {
      filter.type = "bandpass";
      filter.frequency.value = 900;
      filter.Q.value = 1.2;
      
      whiteNoise.connect(filter);
      filter.connect(gainNode);
    } else {
      // waves
      filter.type = "lowpass";
      filter.frequency.value = 350;
      
      // LFO to modulate the lowpass cutoff (ebb and flow tide effect)
      const modulator = ctx.createOscillator();
      modulator.type = "sine";
      modulator.frequency.value = 0.12; // ~8 seconds wave cycle
      
      const modGain = ctx.createGain();
      modGain.gain.value = 200; // Oscillates filter between 150Hz and 550Hz
      
      modulator.connect(modGain);
      modGain.connect(filter.frequency);
      
      whiteNoise.connect(filter);
      filter.connect(gainNode);
      
      modulator.start();
      ambientNodes = { modulator };
    }
    
    whiteNoise.start();
    ambientNodes = { ...ambientNodes, source: whiteNoise, gain: gainNode, filter };
  } else if (type === "chimes") {
    let chimeInterval = null;
    const playChime = () => {
      const chimeCtx = getAudioContext();
      if (!chimeCtx || chimeCtx.state === "suspended") return;
      
      const now = chimeCtx.currentTime;
      // Synthesize a calming Zen singing bowl harmony (D4, A4, D5, A5 chords)
      const freqs = [293.66, 440.0, 587.33, 880.0];
      freqs.forEach((f, idx) => {
        const osc = chimeCtx.createOscillator();
        const oscGain = chimeCtx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now);
        
        // Bell decay envelope
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.06 / (idx + 1), now + 0.05); 
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.5 - idx); 
        
        osc.connect(oscGain);
        oscGain.connect(gainNode);
        
        osc.start(now);
        osc.stop(now + 6);
      });
    };
    
    playChime();
    chimeInterval = setInterval(playChime, 7500); // Trigger every 7.5s
    ambientNodes = { interval: chimeInterval, gain: gainNode };
  }
}

function stopAmbientSound() {
  if (ambientNodes) {
    if (ambientNodes.source) {
      try { ambientNodes.source.stop(); } catch (e) {}
    }
    if (ambientNodes.modulator) {
      try { ambientNodes.modulator.stop(); } catch (e) {}
    }
    if (ambientNodes.interval) {
      clearInterval(ambientNodes.interval);
    }
    if (ambientNodes.gain) {
      try { ambientNodes.gain.disconnect(); } catch (e) {}
    }
    ambientNodes = null;
  }
}

export default function BreathingTherapy({ onBack, onCompleteActivity, showToast }) {
  const [activeMode, setActiveMode] = useState("breath"); 
  const [voices, setVoices] = useState([]);
  const [ambientSound, setAmbientSound] = useState("none"); // 'none' | 'rain' | 'waves' | 'chimes'

  // Text-To-Speech Setup
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

  const speakText = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "vi-VN";
    utter.rate = 0.82; 
    utter.pitch = 0.95; 
    utter.voice = getBestViVoice(voices);
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
        stopAmbientSound();
      }
    };
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // 4-7-8 Breathing States
  // ───────────────────────────────────────────────────────────────────────────
  const [breathState, setBreathState] = useState("idle"); 
  const [breathTimer, setBreathTimer] = useState(4);
  const breathTimerRef = useRef(null);
  const [breathVoiceEnabled, setBreathVoiceEnabled] = useState(true);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(300);
  const [breathTargetDuration, setBreathTargetDuration] = useState(300);

  // Play audio synthesize dynamically
  useEffect(() => {
    if (activeMode === "breath" && breathState !== "idle" && ambientSound !== "none") {
      startAmbientSound(ambientSound);
    } else {
      stopAmbientSound();
    }
    return () => stopAmbientSound();
  }, [ambientSound, breathState, activeMode]);

  // Voice prompting
  useEffect(() => {
    if (!breathVoiceEnabled || breathState === "idle") return;
    const text = BREATH_CUES[breathState];
    if (text) speakText(text);
  }, [breathState, breathVoiceEnabled]);

  // Cycle Timer
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

  // Session Duration Timer
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
  // PMR States
  // ───────────────────────────────────────────────────────────────────────────
  const [pmrState, setPmrState] = useState("idle"); 
  const [pmrStep, setPmrStep] = useState(0);
  const [pmrTimer, setPmrTimer] = useState(5);
  const pmrTimerRef = useRef(null);
  const [pmrVoiceEnabled, setPmrVoiceEnabled] = useState(true);

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
            startPmrStep(idx, "relax");
          } else {
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

  // Ring and color state changes based on premium colors
  const getBlobStyle = () => {
    switch (breathState) {
      case "inhale":
        return {
          scale: 1.5,
          background: "radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(16,185,129,0.05) 70%)",
          borderColor: "rgba(16,185,129,0.7)",
          boxShadow: "0 0 35px rgba(16,185,129,0.5)",
          transition: { duration: 4, ease: "easeInOut" }
        };
      case "hold":
        return {
          scale: 1.5,
          background: "radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(245,158,11,0.05) 70%)",
          borderColor: "rgba(245,158,11,0.8)",
          boxShadow: "0 0 45px rgba(245,158,11,0.6)",
          transition: { duration: 7, ease: "linear" }
        };
      case "exhale":
        return {
          scale: 1.0,
          background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(99,102,241,0.02) 70%)",
          borderColor: "rgba(99,102,241,0.5)",
          boxShadow: "0 0 20px rgba(99,102,241,0.3)",
          transition: { duration: 8, ease: "easeInOut" }
        };
      default:
        return {
          scale: 1.0,
          background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)",
          borderColor: "rgba(255,255,255,0.1)",
          boxShadow: "0 0 0px rgba(255,255,255,0)",
          transition: { duration: 1 }
        };
    }
  };

  const handleModeChange = (mode) => {
    setBreathState("idle");
    stopPmr();
    setActiveMode(mode);
  };

  return (
    <div className="space-y-5 text-center max-w-md mx-auto animate-scaleUp bg-gradient-to-br from-zinc-950 via-slate-900 to-primary/20 text-zinc-100 p-6 rounded-3xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
      <style>{`
        @keyframes blob-liquid {
          0% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; transform: rotate(0deg); }
          50% { border-radius: 70% 30% 52% 48% / 60% 40% 60% 40%; transform: rotate(180deg); }
          100% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; transform: rotate(360deg); }
        }
        .liquid-bubble {
          animation: blob-liquid 14s infinite linear;
        }
      `}</style>

      {/* Background soft glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b pb-2.5 border-zinc-800/60">
        <button type="button" onClick={onBack} className="text-zinc-400 text-[10px] font-black uppercase tracking-wider hover:text-zinc-200 transition-colors">
          Quay lại thẻ
        </button>
        <span className="text-[10px] font-black uppercase text-warning tracking-wider">Hít Thở & Cơ Thể</span>
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
              ? "text-warning bg-warning/10"
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
          <Wind className="w-4 h-4 text-success" />
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
          <Dumbbell className="w-4 h-4 text-indigo-400" />
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
            {/* Duration Selector */}
            <div className="flex justify-center gap-2 mb-1">
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
                      ? "bg-warning border-transparent text-warning-foreground shadow-sm"
                      : "border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Ambient Sound Selector */}
            <div className="bg-black/20 border border-white/5 rounded-2xl p-2.5 space-y-1.5">
              <span className="text-[8px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1 justify-center">
                <Music className="w-3.5 h-3.5" /> Nhạc nền thiền tự nhiên
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "none", label: "Tắt", icon: <VolumeX className="w-3.5 h-3.5" /> },
                  { id: "rain", label: "Mưa rơi", icon: <CloudRain className="w-3.5 h-3.5" /> },
                  { id: "waves", label: "Sóng biển", icon: <Waves className="w-3.5 h-3.5" /> },
                  { id: "chimes", label: "Chuông thiền", icon: <Bell className="w-3.5 h-3.5" /> }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAmbientSound(item.id)}
                    className={`flex flex-col items-center gap-1 py-1.5 rounded-lg border text-[8px] font-bold uppercase transition-all ${
                      ambientSound === item.id
                        ? "bg-warning/25 border-warning text-warning shadow-inner"
                        : "border-white/5 text-zinc-400 bg-white/2 hover:bg-white/5"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {breathState !== "idle" && (
              <div className="text-zinc-400 font-mono font-black text-xs tracking-wider">
                Thời gian: {formatTimerTime(breathSecondsLeft)}
              </div>
            )}

            {/* Glowing Liquid Wave Bubble visual guide */}
            <div className="relative flex items-center justify-center select-none w-56 h-56 mx-auto my-3">
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  style={getBlobStyle()}
                  className="w-44 h-44 border-2 liquid-bubble"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full flex flex-col items-center justify-center text-white shadow-xl relative z-10 bg-zinc-900 border border-zinc-800">
                  <span className="text-[8px] uppercase tracking-widest font-black opacity-90">
                    {breathState === "inhale" ? "Hít vào" :
                     breathState === "hold" ? "Giữ hơi" :
                     breathState === "exhale" ? "Thở ra" : "Sẵn sàng"}
                  </span>
                  {breathState !== "idle" && (
                    <span className="text-2xl font-mono font-black mt-0.5">{breathTimer}s</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-1">
              {breathState === "idle" ? (
                <button
                  type="button"
                  onClick={() => {
                    setBreathSecondsLeft(breathTargetDuration);
                    setBreathState("inhale");
                  }}
                  className="px-6 py-2.5 rounded-xl bg-success hover:bg-success/90 text-success-foreground text-[10px] font-black uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all border border-success/30"
                >
                  Bắt đầu hít thở
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setBreathState("idle")}
                  className="px-6 py-2.5 rounded-xl border-2 border-destructive hover:bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all"
                >
                  Dừng hít thở
                </button>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 italic max-w-xs mx-auto leading-relaxed font-bold mt-3">
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
                        <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[9px] shrink-0">{i+1}</span>
                        <span>{s.part}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => startPmrStep(0, "tense")}
                  className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all border border-indigo-400/30"
                >
                  Bắt đầu thư giãn cơ
                </button>
              </div>
            ) : pmrState === "completed" ? (
              <div className="py-10 space-y-4 text-center">
                <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
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
                  className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  Luyện tập lại
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="flex gap-1">
                  {MUSCLE_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                        i < pmrStep
                          ? "bg-indigo-500"
                          : i === pmrStep
                            ? "bg-indigo-500 scale-y-110 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                            : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>

                <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-1000 relative mx-auto ${
                  pmrState === "tense"
                    ? "border-destructive bg-destructive/10 scale-110 shadow-[0_0_25px_rgba(239,68,68,0.3)]"
                    : "border-indigo-500 bg-indigo-500/10 scale-100 shadow-[0_0_25px_rgba(99,102,241,0.3)]"
                }`}>
                  <span className="text-3xl font-black text-zinc-100">{pmrTimer}s</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                    {pmrState === "tense" ? "Căng Cơ" : "Thả Lỏng"}
                  </span>
                </div>

                <div className="text-center space-y-1 max-w-xs">
                  <p className="text-[12px] font-black text-indigo-400 uppercase tracking-wide">
                    {MUSCLE_STEPS[pmrStep].part}
                  </p>
                  <p className="text-[10px] text-zinc-300 font-bold leading-relaxed min-h-[30px]">
                    {pmrState === "tense" ? MUSCLE_STEPS[pmrStep].cue : "Từ từ thở ra qua miệng, cảm nhận sự nhẹ nhõm lan tỏa..."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={stopPmr}
                  className="flex items-center gap-1.5 px-4 py-2 border-2 border-destructive/20 hover:bg-destructive/10 text-destructive text-[9px] font-black uppercase tracking-wider rounded-xl transition-all"
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
