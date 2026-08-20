import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useJoyStore } from "../../stores/joyStore";
import SubUtilityHeader from "./SubUtilityHeader";
import FeatureGate from "./shared/FeatureGate";
import { motion } from "framer-motion";
import { joyText } from "../../lib/joyDisplay";

const LOFI_PLAYLIST = [
  { id: "stream_africa", title: "Lofi Hip Hop Radio", artist: "Stream Africa", url: "https://play.streamafrica.net/lofi" },
  { id: "epic_lounge", title: "Workday Lounge", artist: "Epic Lounge", url: "https://stream.epic-lounge.com/workday-lounge" },
  { id: "hotmix_lofi", title: "Hotmix Lofi", artist: "Hotmix Radio", url: "https://streaming.hotmixradio.com/hotmix-lofi-en-mp3" }
];

// Base rewards x3.
const FOCUS_PRESETS = [
  { id: "lite", label: "Focus Lite", minutes: 25, reward: 15, icon: "local_cafe" },
  { id: "deep", label: "Focus Deep", minutes: 60, reward: 45, icon: "psychology" },
  { id: "master", label: "Focus Master", minutes: 180, reward: 150, icon: "workspace_premium" }
];

const THEME_ACCENTS = {
  default: {
    accentText: "text-primary",
    accentBg: "bg-primary hover:bg-primary/90",
    stroke: "stroke-primary",
    glow: "shadow-primary/20",
    sliderAccent: "accent-primary",
    badge: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/5",
    themeBg: "from-primary/10 to-primary/10"
  },
  sunset: {
    accentText: "text-secondary",
    accentBg: "bg-secondary hover:bg-secondary/90",
    stroke: "stroke-secondary",
    glow: "shadow-secondary/20",
    sliderAccent: "accent-secondary",
    badge: "bg-secondary/10 text-secondary border-secondary/20 dark:bg-secondary/5",
    themeBg: "from-secondary/10 to-secondary/10"
  },
  cyberpunk: {
    accentText: "text-accent",
    accentBg: "bg-accent hover:bg-accent/90",
    stroke: "stroke-accent",
    glow: "shadow-accent/20",
    sliderAccent: "accent-accent",
    badge: "bg-accent/10 text-accent border-accent/20 dark:bg-accent/5",
    themeBg: "from-accent/10 to-accent/10"
  },
  emerald: {
    accentText: "text-success",
    accentBg: "bg-success hover:bg-success/90",
    stroke: "stroke-success",
    glow: "shadow-success/20",
    sliderAccent: "accent-success",
    badge: "bg-success/10 text-success border-success/20 dark:bg-success/5",
    themeBg: "from-success/10 to-success/10"
  },
  obsidian: {
    accentText: "text-warning",
    accentBg: "bg-warning hover:bg-warning/90",
    stroke: "stroke-warning",
    glow: "shadow-warning/20",
    sliderAccent: "accent-warning",
    badge: "bg-warning/10 text-warning border-warning/20 dark:bg-warning/5",
    themeBg: "from-warning/10 to-warning/10"
  }
};

export default function MemberAuraTab({
  onBack,
  bio,
  showToast,
  onBioUpdate,
  canUseAccountFeatures = true,
  requireAccount,
}) {
  const { t } = useTranslation();
  const fetchJoyBalance = useJoyStore((s) => s.fetchBalance);

  // Derive theme aesthetics
  // HugoAura owns only focus and audio. Portal backgrounds live in Account.
  const accent = THEME_ACCENTS.default;
  const currentPlaylist = LOFI_PLAYLIST;

  // --- Pomodoro State ---
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [timerMode, setTimerMode] = useState("focus"); // 'focus' or 'break'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [targetTime, setTargetTime] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const wakeLockRef = useRef(null);

  // --- Lofi Audio Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [visHeights, setVisHeights] = useState([12, 18, 10, 24, 15, 20, 8, 16]);

  const audioRef = useRef(null);

  // Sync volume of audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Sync source and track swap
  useEffect(() => {
    if (!audioRef.current) return;
    const isPlayingBefore = playing;
    audioRef.current.src = currentPlaylist[currentTrackIndex].url;
    audioRef.current.load();
    if (isPlayingBefore) {
      audioRef.current.play().catch(() => setPlaying(false));
    }
  }, [currentTrackIndex, currentPlaylist]);

  // Visualizer bar heights animation loop
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setVisHeights(visHeights.map(() => Math.floor(Math.random() * 26) + 4));
    }, 150);
    return () => clearInterval(interval);
  }, [playing, visHeights]);

  // Wake Lock management
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && timerActive) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    };
    
    if (timerActive) {
      requestWakeLock();
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        }).catch(() => {});
      }
    }
    
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, [timerActive]);

  // Set default initial timer on selected minutes change
  useEffect(() => {
    if (!timerActive) {
      setTimeLeft(timerMode === "focus" ? selectedMinutes * 60 : 5 * 60);
      setTargetTime(null);
    }
  }, [selectedMinutes, timerMode, timerActive]);

  // --- Lofi Player Controls ---
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setPlaying(true))
        .catch((e) => {
          console.warn("Audio play failed:", e);
          showToast?.(t("aura.playWarning"), "info");
        });
    }
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % currentPlaylist.length);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + currentPlaylist.length) % currentPlaylist.length);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleAudioEnded = () => {
    handleNext();
  };

  const handleAudioError = () => {
    console.warn("Lofi stream error, skipping to next track...");
    handleNext(); // Auto-skip broken streams
  };

  const handleProgressChange = (e) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  // --- Timer completion logic ---
  const completeFocusBlock = useCallback(async () => {
    setTimerActive(false);
    
    // Play Success chime
    try {
      const bell = new Audio("https://www.soundjay.com/clock/sounds/bell-ringing-05.mp3");
      bell.volume = 0.25;
      bell.play().catch(() => {});
    } catch {}

    if (timerMode === "focus") {
      showToast?.(t("aura.toastFocusCompleted", { minutes: selectedMinutes }), "success");
      
      // Award JOY points on backend
      if (bio?.email) {
        try {
          const apiBase = import.meta.env.VITE_API_URL || "/api";
          const res = await fetch(`${apiBase}/joy/award-focus`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: bio.email, minutes: selectedMinutes })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            showToast?.(t("aura.toastJoyReceived", { amount: data.awarded }), "success");
            fetchJoyBalance(bio.email);
          } else {
            showToast?.(data.error || t("aura.toastJoyFailed"), "error");
          }
        } catch (e) {
          console.error("Failed to award focus points:", e);
        }
      }
      
      // Toggle to Break Mode
      setTimerMode("break");
      setTimeLeft(5 * 60);
    } else {
      showToast?.(t("aura.toastBreakCompleted"), "success");
      setTimerMode("focus");
      setTimeLeft(selectedMinutes * 60);
    }
  }, [timerMode, bio, showToast, fetchJoyBalance, selectedMinutes]);

  // Pomodoro Interval Tick Effect using Delta Time
  useEffect(() => {
    let animationFrameId;
    
    const tick = () => {
      if (!timerActive || !targetTime) return;
      
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((targetTime - now) / 1000));
      
      if (remaining !== timeLeft) {
        setTimeLeft(remaining);
      }
      
      if (remaining <= 0) {
        completeFocusBlock();
      } else {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (timerActive && targetTime) {
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [timerActive, targetTime, completeFocusBlock, timeLeft]);

  // Clean-up loop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleToggleTimer = () => {
    if (!timerActive) {
      // Starting
      setTargetTime(Date.now() + timeLeft * 1000);
      setTimerActive(true);
    } else {
      // Pausing
      setTimerActive(false);
      setTargetTime(null);
    }
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setTargetTime(null);
    setTimeLeft(timerMode === "focus" ? selectedMinutes * 60 : 5 * 60);
  };

  const handleSwitchMode = (mode) => {
    setTimerActive(false);
    setTargetTime(null);
    setTimerMode(mode);
    setTimeLeft(mode === "focus" ? selectedMinutes * 60 : 5 * 60);
  };

  const handleSelectPreset = (minutes) => {
    if (timerActive) {
      showToast?.(t("aura.presetWarning"), "warning");
      return;
    }
    setSelectedMinutes(minutes);
    setTimerMode("focus");
  };

  // Helper formats
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatAudioTime = (time) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Dial SVG configurations
  const maxTime = timerMode === "focus" ? selectedMinutes * 60 : 5 * 60;
  const progressRatio = maxTime > 0 ? (maxTime - timeLeft) / maxTime : 0;
  const dashOffset = 691.15 * (1 - progressRatio);

  return (
    <div className="space-y-6">
      <SubUtilityHeader title={t("aura.title")} icon="blur_on" colorClass={accent.accentText} onBack={onBack} />

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentPlaylist[currentTrackIndex].url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        loop={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Pomodoro Board */}
        <div className="lg:col-span-7 flex flex-col items-center justify-between bg-card/40 backdrop-blur-3xl border border-border/20 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-center">
          <div className={`absolute inset-0 bg-gradient-to-br ${accent.themeBg} pointer-events-none opacity-50`} />
          <div className="relative z-10 w-full flex flex-col items-center">
            <h3 className="text-xs font-black text-foreground uppercase tracking-wider mb-5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">alarm</span>
              {t("aura.pomodoroDesk")}
            </h3>

            {/* Presets Grid - Premium Glass Cards */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 w-full max-w-md mb-12">
              {FOCUS_PRESETS.map((preset) => {
                const isActive = selectedMinutes === preset.minutes;
                return (
                  <motion.button
                    key={preset.id}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectPreset(preset.minutes)}
                    className={`relative flex flex-col items-center justify-center p-3 md:p-4 rounded-[1.25rem] border transition-all duration-300 shadow-sm backdrop-blur-md overflow-hidden ${isActive ? `${accent.accentBg} ${accent.glow} border-transparent text-white ring-2 ring-white/20` : "bg-white/40 hover:bg-card/70 dark:hover:bg-zinc-900/60 border-border/60 text-muted-foreground"}`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-preset-glow"
                        className="absolute inset-0 bg-white/20 dark:bg-white/10 rounded-[1.25rem]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center w-full">
                      <span className={`material-symbols-outlined text-2xl md:text-3xl mb-2 transition-transform duration-300 ${isActive ? "text-white scale-110" : "text-zinc-500"}`}>{preset.icon}</span>
                      <span className="text-[8.5px] md:text-[10px] font-black uppercase tracking-widest text-center leading-tight w-full truncate">
                        {t(`aura.preset${preset.id.charAt(0).toUpperCase() + preset.id.slice(1)}`)}
                      </span>
                      <span className={`text-[8.5px] font-bold mt-1.5 px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-muted/50 text-muted-foreground"}`}>
                        +{joyText(preset.reward)}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Glowing Timer Circle */}
            <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center mb-10 select-none">
              {/* Outer glowing ripple ring when active */}
              {timerActive && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0.15, 0.4, 0.15], scale: [1, 1.08, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className={`absolute inset-0 rounded-full bg-gradient-to-br ${accent.themeBg} blur-2xl`} 
                />
              )}
              
              <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 256 256">
                {/* Outer Track Circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  className="stroke-zinc-200/50 dark:stroke-zinc-800/60 fill-none"
                  strokeWidth="10"
                />
                {/* Active Progress Circle */}
                <motion.circle
                  cx="128"
                  cy="128"
                  r="110"
                  className={`fill-none ${accent.stroke}`}
                  strokeWidth="10"
                  strokeDasharray="691.15"
                  initial={{ strokeDashoffset: 691.15 }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                  strokeLinecap="round"
                />
              </svg>
              
              <div className="absolute flex flex-col items-center justify-center z-20">
                <span className="text-6xl md:text-7xl font-black tracking-tighter text-foreground leading-none mb-1">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                  {timerMode === "focus" ? t("aura.focusBlock") : t("aura.breakInterval")}
                </span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-4 relative z-10 w-full max-w-[320px]">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleResetTimer}
                className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center bg-card/50 text-muted-foreground hover:bg-white/80 dark:hover:bg-zinc-800 transition-colors border border-border/60 shadow-sm backdrop-blur-md"
                title={t("aura.resetBtn")}
              >
                <span className="material-symbols-outlined text-2xl">replay</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleToggleTimer}
                className={`flex-1 h-14 rounded-full flex items-center justify-center gap-2 text-white shadow-xl transition-colors font-black text-sm uppercase tracking-wider ${timerActive ? "bg-zinc-800 hover:bg-foreground dark:text-black dark:hover:bg-zinc-200" : `${accent.accentBg} ${accent.glow}`}`}
              >
                <span className="material-symbols-outlined text-2xl">{timerActive ? "pause" : "play_arrow"}</span>
                {timerActive ? t("aura.pauseBtn") : t("aura.startBtn")}
              </motion.button>
            </div>
          </div>

          {/* Mode indicators */}
          <div className="relative z-10 w-full flex justify-center gap-4 mt-6 text-[9px] font-black uppercase tracking-wider text-muted-foreground/70">
            <button onClick={() => handleSwitchMode("focus")} className={`hover:text-zinc-800 dark:hover:text-muted-foreground/60 transition-colors ${timerMode === "focus" ? `underline underline-offset-4 ${accent.accentText}` : ""}`}>
              {t("aura.workSession")} ({selectedMinutes}m)
            </button>
            <span>•</span>
            <button onClick={() => handleSwitchMode("break")} className={`hover:text-zinc-800 dark:hover:text-muted-foreground/60 transition-colors ${timerMode === "break" ? `underline underline-offset-4 ${accent.accentText}` : ""}`}>
              {t("aura.breakSession")} (5m)
            </button>
          </div>
        </div>

        {/* Lofi is the only subscription feature left in HugoAura. Portal
            backgrounds are managed independently from Account. */}
        <div
          className="lg:col-span-5"
          onClickCapture={canUseAccountFeatures ? undefined : requireAccount}
        >
        <FeatureGate
          bio={bio}
          featureKey="hugoAura"
          priceJoy={150}
          icon="music_note"
          title="Mở khóa Lofi Focus bằng JOY"
          description="Pomodoro tập trung vẫn luôn miễn phí cho mọi người."
          onBioUpdate={onBioUpdate}
          className="h-full"
        >
        <div className="flex flex-col gap-6">

          {/* Lofi Lounge Player Card */}
          <div className="bg-card/40 backdrop-blur-3xl border border-border/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className={`absolute inset-0 bg-gradient-to-br ${accent.themeBg} pointer-events-none opacity-40`} />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">music_note</span>
                  {t("aura.lofiStation")}
                </h4>

                {/* Simulated Equalizer Waveform */}
                <div className="flex items-end gap-[3px] h-6 px-2">
                  {visHeights.map((h, i) => (
                    <div
                      key={i}
                      className={`w-[3px] rounded-full transition-all duration-150 ${playing ? accent.accentBg : "bg-zinc-300 dark:bg-zinc-700"}`}
                      style={{ height: `${playing ? h : 4}px` }}
                    />
                  ))}
                </div>
              </div>

              {/* Active Track Info */}
              <div className="flex items-center gap-4 bg-card/30 p-3.5 rounded-2xl border border-border/10">
                {/* Rotating Vinyl Record Graphic */}
                <div
                  className={`w-14 h-14 rounded-full bg-zinc-900 dark:bg-black flex items-center justify-center text-white ring-4 ring-border shadow-lg shrink-0 ${playing ? "animate-spin" : ""}`}
                  style={{ animationDuration: "8s", transformOrigin: "center" }}
                >
                  <div className="w-4 h-4 rounded-full bg-card flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                  </div>
                </div>

                <div className="min-w-0 flex-1 text-left leading-tight">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 block">{t("aura.lofiWaves")}</span>
                  <span className="text-xs font-black text-foreground block truncate mt-1">
                    {currentPlaylist[currentTrackIndex].title}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground block truncate mt-0.5">
                    {currentPlaylist[currentTrackIndex].artist}
                  </span>
                </div>
              </div>

              {/* Slider timeline scrubbing */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleProgressChange}
                  className={`w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted ${accent.sliderAccent} [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-zinc-700 dark:[&::-webkit-slider-thumb]:bg-white`}
                  aria-label={t("aura.timelineScrub")}
                />
                <div className="flex justify-between text-[9px] font-mono text-muted-foreground/70">
                  <span>{formatAudioTime(currentTime)}</span>
                  <span>{formatAudioTime(duration)}</span>
                </div>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center justify-between gap-4 pt-1">
                {/* Volume slider control */}
                <div className="flex items-center gap-2 max-w-[90px]">
                  <span className="material-symbols-outlined text-zinc-400 text-base shrink-0">volume_down</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className={`w-16 h-1 rounded-full appearance-none bg-muted ${accent.sliderAccent} [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-muted-foreground`}
                    aria-label={t("aura.volumeLabel")}
                  />
                </div>

                {/* Navigation group */}
                <div className="flex items-center gap-3">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handlePrev} className="w-9 h-9 rounded-full flex items-center justify-center bg-card/20 text-foreground/80 hover:bg-white/40 dark:hover:bg-zinc-900/50 transition-colors">
                    <span className="material-symbols-outlined text-base">skip_previous</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePlayPause}
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-md transition-colors ${accent.accentBg}`}
                  >
                    <span className="material-symbols-outlined text-xl">{playing ? "pause" : "play_arrow"}</span>
                  </motion.button>

                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleNext} className="w-9 h-9 rounded-full flex items-center justify-center bg-card/20 text-foreground/80 hover:bg-white/40 dark:hover:bg-zinc-900/50 transition-colors">
                    <span className="material-symbols-outlined text-base">skip_next</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

        </div>
        </FeatureGate>
        </div>
      </div>
    </div>
  );
}
