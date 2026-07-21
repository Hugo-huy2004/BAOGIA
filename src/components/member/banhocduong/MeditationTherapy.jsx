import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, Sparkles, Play, Pause, Square, Volume2, 
  VolumeX, Wind, Timer, Compass, RefreshCw,
  Moon, Zap, Heart, CloudRain, Waves, Flame, Music
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getBestViVoice } from "./utils/getBestViVoice";
const INTERNAL_KEY = import.meta.env.VITE_INTERNAL_API_KEY ?? "";

const MEDITATION_MOODS = [
  { id: "lo âu", label: "Giải tỏa lo âu", icon: Sparkles },
  { id: "mất ngủ", label: "Dễ ngủ sâu", icon: Moon },
  { id: "mệt mỏi", label: "Tái tạo năng lượng", icon: Zap },
  { id: "tổn thương", label: "Chữa lành nỗi đau", icon: Heart }
];

export default function MeditationTherapy({ onBack, onCompleteActivity, showToast, bio }) {
  const [step, setStep] = useState("setup"); // 'setup' | 'loading' | 'meditating' | 'completed'
  const [selectedMood, setSelectedMood] = useState("lo âu");
  const [customContext, setCustomContext] = useState("");
  const [phrases, setPhrases] = useState([]);
  
  // Session parameters
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const timerIntervalRef = useRef(null);
  const phraseTimerRef = useRef(null);
  const [voices, setVoices] = useState([]);

  // Background Ambience Audio
  const [playingSounds, setPlayingSounds] = useState({
    rain: false,
    ocean: false,
    campfire: false,
    zen: true // default playing soft music for meditation
  });
  const [volumes, setVolumes] = useState({
    rain: 0.25,
    ocean: 0.25,
    campfire: 0.25,
    zen: 0.3
  });
  const audiosRef = useRef({
    rain: new Audio("/audio/rain.mp3"),
    ocean: new Audio("/audio/sea.mp3"),
    campfire: new Audio("/audio/campfire.mp3"),
    zen: new Audio("/audio/ambient.mp3")
  });

  // Audio setup
  useEffect(() => {
    Object.keys(audiosRef.current).forEach(key => {
      audiosRef.current[key].loop = true;
    });
    return () => {
      Object.keys(audiosRef.current).forEach(key => {
        audiosRef.current[key].pause();
      });
      stopTimers();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    Object.keys(audiosRef.current).forEach(key => {
      audiosRef.current[key].volume = volumes[key];
    });
  }, [volumes]);

  // Voice setup
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

  const toggleSound = (key) => {
    const audio = audiosRef.current[key];
    if (playingSounds[key]) {
      audio.pause();
      setPlayingSounds(p => ({ ...p, [key]: false }));
    } else {
      audio.play().catch(e => console.error("Audio play failed:", e));
      setPlayingSounds(p => ({ ...p, [key]: true }));
    }
  };

  // Generate AI Meditation script
  const handleGenerate = async () => {
    setStep("loading");
    try {
      const payload = {
        mood: selectedMood,
        context: customContext,
        bio: bio
      };
      
      // Same-origin through the API gateway's /api/ai/* proxy (see AIBot.js /
      // SleepTracker.jsx) — no separate "ai.<domain>" host in dev or prod.
      const r = await fetch(`/api/ai/therapy/meditation-script`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Key": INTERNAL_KEY
        },
        body: JSON.stringify(payload)
      });
      
      if (!r.ok) throw new Error("Không thể kết nối đến máy chủ AI.");
      const data = await r.json();
      
      if (!data.phrases || data.phrases.length === 0) {
        throw new Error("Không nhận được kịch bản thiền.");
      }
      
      setPhrases(data.phrases);
      setStep("meditating");
      setCurrentPhraseIdx(0);
      setSessionSeconds(0);
      setIsRunning(true);
      
      // Start active ambient music
      if (playingSounds.zen) {
        audiosRef.current.zen.play().catch(e => console.error(e));
      }
      
      // Start loops
      startSessionLoop(data.phrases);
      
    } catch (e) {
      showToast?.(e.message || "Lỗi tạo script thiền.", "error");
      setStep("setup");
    }
  };

  const speakPhrase = (text) => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "vi-VN";
    utter.rate = 0.72; // Extra slow rate for meditation breathing
    utter.pitch = 0.88; // Deep, relaxing male pitch
    utter.voice = getBestViVoice(voices);
    window.speechSynthesis.speak(utter);
  };

  const startSessionLoop = (scriptPhrases) => {
    stopTimers();
    
    // Timer seconds countdown tracker
    timerIntervalRef.current = setInterval(() => {
      setSessionSeconds(s => s + 1);
    }, 1000);

    // Speak initial phrase
    speakPhrase(scriptPhrases[0]);

    // Phrase iterator with adaptive gaps based on phrase length
    // Short phrases (1-2 sentences) = ~10s, long phrases (3+) = up to 18s
    const getInterval = (text) => Math.max(10000, Math.min(18000, text.length * 200));

    let curIdx = 0;
    const scheduleNext = () => {
      const interval = getInterval(scriptPhrases[curIdx] || "");
      phraseTimerRef.current = setTimeout(() => {
        curIdx++;
        if (curIdx >= scriptPhrases.length) {
          setIsRunning(false);
          setStep("completed");
          onCompleteActivity?.("Thiền Định AI", `Hoàn tất phiên thiền định chánh niệm cá nhân hóa.`);
          showToast?.("Phiên thiền chánh niệm đã kết thúc. Hãy từ từ mở mắt ra và mỉm cười nhé!", "success");
        } else {
          setCurrentPhraseIdx(curIdx);
          speakPhrase(scriptPhrases[curIdx]);
          scheduleNext();
        }
      }, interval);
    };
    scheduleNext();
  };

  const stopTimers = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (phraseTimerRef.current) clearTimeout(phraseTimerRef.current);
  };

  const handlePauseToggle = () => {
    if (isRunning) {
      setIsRunning(false);
      stopTimers();
      window.speechSynthesis.cancel();
      Object.keys(audiosRef.current).forEach(key => {
        audiosRef.current[key].pause();
      });
    } else {
      setIsRunning(true);
      Object.keys(playingSounds).forEach(key => {
        if (playingSounds[key]) {
          audiosRef.current[key].play().catch(e => console.error(e));
        }
      });
      timerIntervalRef.current = setInterval(() => {
        setSessionSeconds(s => s + 1);
      }, 1000);

      speakPhrase(phrases[currentPhraseIdx]);
      let curIdx = currentPhraseIdx;

      const getInterval = (text) => Math.max(10000, Math.min(18000, text.length * 200));

      const scheduleNext = () => {
        const interval = getInterval(phrases[curIdx] || "");
        phraseTimerRef.current = setTimeout(() => {
          curIdx++;
          if (curIdx >= phrases.length) {
            setIsRunning(false);
            stopTimers();
            setStep("completed");
            onCompleteActivity?.("Thiền Định AI", `Hoàn tất phiên thiền định chánh niệm.`);
            showToast?.("Phiên thiền chánh niệm đã kết thúc.", "success");
          } else {
            setCurrentPhraseIdx(curIdx);
            speakPhrase(phrases[curIdx]);
            scheduleNext();
          }
        }, interval);
      };
      scheduleNext();
    }
  };

  const handleReset = () => {
    stopTimers();
    window.speechSynthesis.cancel();
    Object.keys(audiosRef.current).forEach(key => {
      audiosRef.current[key].pause();
    });
    setStep("setup");
    setPhrases([]);
    setCurrentPhraseIdx(0);
    setSessionSeconds(0);
    setIsRunning(false);
  };

  const formatTimerTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="max-w-md mx-auto space-y-5 animate-scaleUp bg-gradient-to-br from-zinc-950 via-slate-900 to-primary/20 text-zinc-100 p-6 rounded-3xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b pb-2.5 border-zinc-800/60">
        <button type="button" onClick={() => { handleReset(); onBack(); }} className="text-zinc-400 text-[10px] font-black uppercase tracking-wider hover:text-zinc-200 transition-colors">
          Quay lại thẻ
        </button>
        <span className="text-[10px] font-black uppercase text-primary tracking-wider">Thiền Dẫn AI</span>
        <button
          type="button"
          onClick={() => {
            setVoiceEnabled(v => {
              const next = !v;
              if (!next) window.speechSynthesis?.cancel();
              return next;
            });
          }}
          title={voiceEnabled ? "Tắt giọng dẫn" : "Bật giọng dẫn"}
          className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md transition-colors ${
            voiceEnabled ? "text-primary bg-primary/10" : "text-zinc-400 bg-white/5 hover:bg-white/10"
          }`}
        >
          {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>

      {step === "setup" && (
        <div className="space-y-5 text-left relative z-10">
          <p className="text-[11px] text-zinc-300 font-bold leading-relaxed">
            AI sẽ biên soạn các chỉ dẫn thiền chánh niệm cá nhân hóa sâu sắc theo trạng thái tâm trí của cậu lúc này, kết hợp cùng dải tần âm thanh giúp ổn định nhịp tim và cortisol.
          </p>

          <div className="space-y-4 bg-white/5 border border-white/10 p-4 rounded-3xl">
            <div className="space-y-3">
              <label className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400">Chọn chủ đề tĩnh tâm</label>
              <div className="grid grid-cols-2 gap-2">
                {MEDITATION_MOODS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMood(m.id)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all text-left ${
                      selectedMood === m.id
                        ? "bg-primary/10 border-primary text-primary scale-[1.02]"
                        : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    {React.createElement(m.icon, { className: "w-4 h-4 text-primary shrink-0" })}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400">Ghi chú vấn đề cần tĩnh lặng (tùy chọn)</label>
                <textarea
                  placeholder="Ví dụ: Tớ khó tập trung học do trong đầu luôn lo sợ thi rớt..."
                  value={customContext}
                  onChange={e => setCustomContext(e.target.value)}
                  className="w-full h-20 p-3 border border-white/10 bg-white/5 text-xs rounded-xl outline-none focus:ring-2 ring-primary/50 transition-all font-medium text-white placeholder-zinc-550"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 border border-primary/20"
            >
              <Sparkles className="w-4 h-4" />
              Tạo bài dẫn thiền AI
            </button>
          </div>
        </div>
      )}

      {step === "loading" && (
        <div className="py-20 text-center space-y-4 relative z-10">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Compass className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] font-black text-muted-foreground/60">Đang soạn thảo bài dẫn thiền riêng...</p>
            <p className="text-[9.5px] text-muted-foreground mt-1">Đồng bộ nhịp sóng não alpha để giải tỏa bão lòng...</p>
          </div>
        </div>
      )}

      {step === "meditating" && phrases.length > 0 && (
        <div className="space-y-6 text-center py-4 relative z-10">
          
          {/* Timer Display */}
          <div className="text-3xl font-mono font-black text-primary tracking-widest animate-pulse">
            {formatTimerTime(sessionSeconds)}
          </div>

          {/* Glowing Circular Lotus Mandala Visualizer */}
          <div className="relative flex items-center justify-center select-none w-56 h-56 mx-auto my-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={isRunning ? { scale: [1, 1.4, 1.4, 1], rotate: 360 } : {}}
                transition={isRunning ? { duration: 12, repeat: Infinity, ease: "easeInOut" } : {}}
                className="w-40 h-40 rounded-full border border-primary/30 bg-primary/5 blur-[2px]"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={isRunning ? { scale: [1.1, 1.3, 1.1] } : {}}
                transition={isRunning ? { duration: 6, repeat: Infinity, ease: "easeInOut" } : {}}
                className="w-32 h-32 rounded-full border border-primary/20 bg-primary/10"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-22 h-22 rounded-full bg-primary/20 text-primary flex items-center justify-center relative z-10 shadow-lg border-2 border-primary/40">
                <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: isRunning ? "24s" : "0s" }} />
              </div>
            </div>
          </div>

          {/* Dynamic guided text phrase */}
          <div className="px-4 min-h-[60px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentPhraseIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-[12.5px] font-bold text-zinc-200 leading-relaxed font-serif"
              >
                {phrases[currentPhraseIdx]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Music Console */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-3xl space-y-3 text-left">
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block">Âm thanh thiên nhiên hòa phối</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "rain", label: "Mưa rơi", icon: CloudRain },
                { key: "ocean", label: "Sóng biển", icon: Waves },
                { key: "campfire", label: "Lửa ấm", icon: Flame },
                { key: "zen", label: "Nhạc Thiền", icon: Music }
              ].map(sound => (
                <div key={sound.key} className="flex flex-col gap-1 p-2 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-zinc-300 flex items-center gap-1.5">
                      {React.createElement(sound.icon, { className: "w-3.5 h-3.5 text-primary shrink-0" })}
                      <span>{sound.label}</span>
                    </span>
                    <button
                      onClick={() => toggleSound(sound.key)}
                      disabled={!isRunning}
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        playingSounds[sound.key]
                          ? "bg-primary text-white"
                          : "bg-white/5 text-zinc-400"
                      } disabled:opacity-30`}
                    >
                      {playingSounds[sound.key] ? <Volume2 className="w-2.5 h-2.5" /> : <VolumeX className="w-2.5 h-2.5" />}
                    </button>
                  </div>
                  {playingSounds[sound.key] && isRunning && (
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volumes[sound.key]}
                      onChange={e => setVolumes(v => ({ ...v, [sound.key]: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Primary controls */}
          <div className="flex justify-center gap-4 pt-2">
            <button
              onClick={handlePauseToggle}
              className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-zinc-200 active:scale-95 transition-all"
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 pl-0.5" />}
            </button>
            <button
              onClick={handleReset}
              className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-zinc-200 active:scale-95 transition-all"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === "completed" && (
        <div className="py-12 text-center space-y-5 relative z-10">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto animate-bounce">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-black text-white">Hoàn Tất Tĩnh Tâm Thiền Định</h3>
            <p className="text-[10.5px] text-zinc-300 font-bold max-w-xs mx-auto leading-relaxed">
              Cảm ơn cậu vì đã dành thời gian tĩnh lặng chăm sóc tâm hồn mình ngày hôm nay.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all w-full border border-primary/20"
          >
            Quay lại & Thử chủ đề khác
          </button>
        </div>
      )}

    </div>
  );
}
