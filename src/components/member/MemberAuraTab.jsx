import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useJoyStore } from "../../stores/joyStore";
import SubUtilityHeader from "./SubUtilityHeader";
import FeatureGate from "./shared/FeatureGate";

const LOFI_PLAYLIST = [
  { id: "sunset_breeze", title: "Shinjuku Gyoen", artist: "Cat System Corp.", url: "https://archive.org/download/lofi-plvgkk/%E7%8C%AB%20%E3%82%B7%20Corp.%20-%20lofi%20-%2001%20Shinjuki%20Gyoen.mp3" },
  { id: "study_focus", title: "Amano", artist: "Cat System Corp.", url: "https://archive.org/download/lofi-plvgkk/%E7%8C%AB%20%E3%82%B7%20Corp.%20-%20lofi%20-%2002%20Amano.mp3" },
  { id: "rainy_night", title: "Late Breakfast", artist: "Cat System Corp.", url: "https://archive.org/download/lofi-plvgkk/%E7%8C%AB%20%E3%82%B7%20Corp.%20-%20lofi%20-%2004%20Late%20Breakfast.mp3" },
  { id: "sleepy_cat", title: "Rainy Sunday", artist: "Cat System Corp.", url: "https://archive.org/download/lofi-plvgkk/%E7%8C%AB%20%E3%82%B7%20Corp.%20-%20lofi%20-%2005%20Rainy%20Sunday.mp3" },
  { id: "coding_cafe", title: "Campus Coffee", artist: "Cat System Corp.", url: "https://archive.org/download/lofi-plvgkk/%E7%8C%AB%20%E3%82%B7%20Corp.%20-%20lofi%20-%2007%20Campus%20Coffee.mp3" }
];

const THEME_SHOP = [
  { id: "default", name: "Classic Cosmic", desc: "Không gian vũ trụ dải sáng tím lam huyền ảo.", price: 0, preview: "from-primary via-accent to-secondary" },
  { id: "sunset", name: "Sunset Aura", desc: "Sắc cam hoàng hôn ấm áp hòa cùng ánh hồng đào.", price: 50, preview: "from-secondary via-accent to-warning" },
  { id: "cyberpunk", name: "Cyberpunk Neon", desc: "Dải sáng neon xanh lam, fuchsia và tím rực rỡ.", price: 50, preview: "from-secondary via-accent to-primary" },
  { id: "emerald", name: "Emerald Healing", desc: "Xanh ngọc bích mát lành điểm thêm tia sáng vàng.", price: 50, preview: "from-success via-success/70 to-warning" },
  { id: "obsidian", name: "Obsidian Eclipse", desc: "Sắc xám obsidian huyền bí cùng hạt sáng bạc.", price: 50, preview: "from-warning via-muted to-warning/80" }
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

export default function MemberAuraTab({ onBack, bio, showToast, onBioUpdate }) {
  const { t } = useTranslation();
  const fetchJoyBalance = useJoyStore((s) => s.fetchBalance);

  // Derive theme aesthetics
  const activeThemeId = bio?.activeAuraTheme || "default";
  const accent = THEME_ACCENTS[activeThemeId] || THEME_ACCENTS.default;

  // --- Pomodoro State ---
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [timerMode, setTimerMode] = useState("focus"); // 'focus' or 'break'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const timerIntervalRef = useRef(null);

  // --- Lofi Audio Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [visHeights, setVisHeights] = useState([12, 18, 10, 24, 15, 20, 8, 16]);

  const audioRef = useRef(null);
  const [rentingThemeId, setRentingThemeId] = useState(null);
  const [timeTick, setTimeTick] = useState(Date.now()); // for countdown labels sync

  // Track timer interval for relative countdown strings refresh
  useEffect(() => {
    const it = setInterval(() => setTimeTick(Date.now()), 15000);
    return () => clearInterval(it);
  }, []);

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
    audioRef.current.src = LOFI_PLAYLIST[currentTrackIndex].url;
    audioRef.current.load();
    if (isPlayingBefore) {
      audioRef.current.play().catch(() => setPlaying(false));
    }
  }, [currentTrackIndex]);

  // Visualizer bar heights animation loop
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setVisHeights(visHeights.map(() => Math.floor(Math.random() * 26) + 4));
    }, 150);
    return () => clearInterval(interval);
  }, [playing, visHeights]);

  // Set default initial timer on selected minutes change
  useEffect(() => {
    if (!timerActive) {
      setTimeLeft(timerMode === "focus" ? selectedMinutes * 60 : 5 * 60);
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
    setCurrentTrackIndex((prev) => (prev + 1) % LOFI_PLAYLIST.length);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + LOFI_PLAYLIST.length) % LOFI_PLAYLIST.length);
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
    } catch(e) {}

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

  // Pomodoro Interval Tick Effect
  useEffect(() => {
    if (timerActive) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            completeFocusBlock();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerActive, completeFocusBlock]);

  // Clean-up loop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleToggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setTimeLeft(timerMode === "focus" ? selectedMinutes * 60 : 5 * 60);
  };

  const handleSwitchMode = (mode) => {
    setTimerActive(false);
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

  // Theme Shop APIs
  const handleRentTheme = async (themeId) => {
    if (!bio?.email) {
      showToast?.(t("aura.toastLoginRequired"), "warning");
      return;
    }
    setRentingThemeId(themeId);
    try {
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${apiBase}/joy/rent-theme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: bio.email, themeId })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast?.(data.error || t("aura.toastRentFailed"), "error");
        return;
      }
      const themeName = t(`aura.theme${themeId.charAt(0).toUpperCase() + themeId.slice(1)}Name`);
      showToast?.(t("aura.toastRentSuccess", { name: themeName }), "success");
      onBioUpdate?.(data.bio);
      fetchJoyBalance(bio.email);
    } catch (e) {
      showToast?.(t("aura.toastNetworkError"), "error");
    } finally {
      setRentingThemeId(null);
    }
  };

  const handleSelectTheme = async (themeId) => {
    if (!bio?.email) return;
    try {
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${apiBase}/joy/set-theme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: bio.email, themeId })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast?.(data.error || t("aura.toastSelectFailed"), "error");
        return;
      }
      onBioUpdate?.(data.bio);
      const themeName = t(`aura.theme${themeId.charAt(0).toUpperCase() + themeId.slice(1)}Name`);
      showToast?.(t("aura.toastSelectSuccess", { name: themeName }), "success");
    } catch (e) {
      showToast?.(t("aura.toastNetworkError"), "error");
    }
  };

  const isThemeRented = (themeId) => {
    if (themeId === "default") return true;
    const record = bio?.rentedThemes?.find(t => t.themeId === themeId);
    return record && new Date(record.expiresAt).getTime() > Date.now();
  };

  const getThemeExpiryText = (themeId) => {
    if (themeId === "default") return "";
    const record = bio?.rentedThemes?.find(t => t.themeId === themeId);
    if (!record) return "";
    const msLeft = new Date(record.expiresAt).getTime() - Date.now();
    if (msLeft <= 0) return "";
    
    const hrs = Math.floor(msLeft / (60 * 60 * 1000));
    const mins = Math.floor((msLeft % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hrs > 0) return t("aura.remainingHoursMinutes", { hours: hrs, minutes: mins });
    return t("aura.remainingMinutes", { minutes: mins });
  };

  // Dial SVG configurations
  const maxTime = timerMode === "focus" ? selectedMinutes * 60 : 5 * 60;
  const progressRatio = (maxTime - timeLeft) / maxTime;
  const dashOffset = 439.82 * (1 - progressRatio);

  return (
    <div className="space-y-6">
      <SubUtilityHeader title={t("aura.title")} icon="blur_on" colorClass={accent.accentText} onBack={onBack} />

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={LOFI_PLAYLIST[currentTrackIndex].url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        loop={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Pomodoro Board */}
        <div className="lg:col-span-7 flex flex-col items-center justify-between bg-white/40 dark:bg-zinc-950/40 backdrop-blur-3xl border border-white/20 dark:border-zinc-800/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-center">
          <div className={`absolute inset-0 bg-gradient-to-br ${accent.themeBg} pointer-events-none opacity-50`} />
          
          <div className="relative z-10 w-full flex flex-col items-center">
            <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">alarm</span>
              {t("aura.pomodoroDesk")}
            </h3>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 gap-3.5 w-full max-w-md mb-8">
              {FOCUS_PRESETS.map((preset) => {
                const isActive = selectedMinutes === preset.minutes;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.minutes)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 ${isActive ? `bg-white/70 dark:bg-zinc-900/80 border-white dark:border-zinc-700 shadow-md ${accent.glow}` : "bg-white/10 hover:bg-white/20 dark:bg-zinc-900/20 dark:hover:bg-zinc-900/40 border-transparent text-zinc-600 dark:text-zinc-450"}`}
                  >
                    <span className={`material-symbols-outlined text-xl mb-1 ${isActive ? accent.accentText : "text-zinc-500"}`}>{preset.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-wide leading-none text-zinc-800 dark:text-zinc-200">
                      {t(`aura.preset${preset.id.charAt(0).toUpperCase() + preset.id.slice(1)}`)}
                    </span>
                    <span className={`text-[8.5px] font-bold mt-1.5 px-2 py-0.5 rounded-full border ${isActive ? accent.badge : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-transparent"}`}>
                      +{preset.reward} JOY
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Glowing Timer Circle */}
            <div className="relative w-56 h-56 flex items-center justify-center mb-8 select-none">
              {/* Outer glowing ripple ring when active */}
              {timerActive && (
                <div className={`absolute inset-4 rounded-full border-2 border-transparent border-t-accent/20 animate-spin`} style={{ animationDuration: "3s" }} />
              )}
              
              <svg className="w-full h-full transform -rotate-90">
                {/* Outer Track Circle */}
                <circle
                  cx="112"
                  cy="112"
                  r="70"
                  className="stroke-zinc-200/50 dark:stroke-zinc-800/50 fill-none"
                  strokeWidth="6"
                />
                {/* Active Progress Circle */}
                <circle
                  cx="112"
                  cy="112"
                  r="70"
                  className={`fill-none transition-all duration-300 ${accent.stroke}`}
                  strokeWidth="6"
                  strokeDasharray="439.82"
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                />
              </svg>
              
              <div className="absolute flex flex-col items-center justify-center font-mono">
                <span className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white leading-none">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400 mt-2">
                  {timerMode === "focus" ? t("aura.focusBlock") : t("aura.breakInterval")}
                </span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-3 relative z-10 w-full max-w-[280px]">
              <button
                onClick={handleResetTimer}
                className="flex-1 flex items-center justify-center gap-1 py-3.5 rounded-2xl bg-white/40 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-900/60 active:scale-95 transition-all font-black text-[10px] uppercase tracking-wider border border-white/20 dark:border-zinc-800/50"
              >
                <span className="material-symbols-outlined text-sm">replay</span>{t("aura.resetBtn")}
              </button>
              
              <button
                onClick={handleToggleTimer}
                className={`flex-[1.5] flex items-center justify-center gap-1.5 py-3.5 rounded-2xl text-white shadow-xl active:scale-95 transition-all font-black text-[10px] uppercase tracking-wider ${timerActive ? "bg-destructive hover:bg-destructive/90 shadow-destructive/20" : `${accent.accentBg} ${accent.glow}`}`}
              >
                <span className="material-symbols-outlined text-sm">{timerActive ? "pause" : "play_arrow"}</span>
                {timerActive ? t("aura.pauseBtn") : t("aura.startBtn")}
              </button>
            </div>
          </div>

          {/* Mode indicators */}
          <div className="relative z-10 w-full flex justify-center gap-4 mt-6 text-[9px] font-black uppercase tracking-wider text-zinc-450 dark:text-zinc-400">
            <button onClick={() => handleSwitchMode("focus")} className={`hover:text-zinc-800 dark:hover:text-zinc-250 transition-colors ${timerMode === "focus" ? `underline underline-offset-4 ${accent.accentText}` : ""}`}>
              {t("aura.workSession")} ({selectedMinutes}m)
            </button>
            <span>•</span>
            <button onClick={() => handleSwitchMode("break")} className={`hover:text-zinc-800 dark:hover:text-zinc-250 transition-colors ${timerMode === "break" ? `underline underline-offset-4 ${accent.accentText}` : ""}`}>
              {t("aura.breakSession")} (5m)
            </button>
          </div>
        </div>

        {/* Right Column: Lofi Player & Theme Shop — gated behind a monthly
            JOY subscription. Pomodoro (left column) stays free for everyone. */}
        <FeatureGate
          bio={bio}
          featureKey="hugoAura"
          priceJoy={150}
          icon="music_note"
          title="Mở khóa Lofi & Cửa hàng giao diện bằng JOY"
          description="Pomodoro tập trung vẫn luôn miễn phí cho mọi người."
          onBioUpdate={onBioUpdate}
          className="lg:col-span-5"
        >
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Lofi Lounge Player Card */}
          <div className="bg-white/40 dark:bg-zinc-950/40 backdrop-blur-3xl border border-white/20 dark:border-zinc-800/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className={`absolute inset-0 bg-gradient-to-br ${accent.themeBg} pointer-events-none opacity-40`} />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
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
              <div className="flex items-center gap-4 bg-white/30 dark:bg-zinc-900/30 p-3.5 rounded-2xl border border-white/10 dark:border-zinc-800/40">
                {/* Rotating Vinyl Record Graphic */}
                <div
                  className={`w-14 h-14 rounded-full bg-zinc-900 dark:bg-black flex items-center justify-center text-white ring-4 ring-zinc-300/40 dark:ring-zinc-800/60 shadow-lg shrink-0 ${playing ? "animate-spin" : ""}`}
                  style={{ animationDuration: "8s", transformOrigin: "center" }}
                >
                  <div className="w-4 h-4 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                  </div>
                </div>

                <div className="min-w-0 flex-1 text-left leading-tight">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-550 block">{t("aura.lofiWaves")}</span>
                  <span className="text-xs font-black text-zinc-800 dark:text-zinc-150 block truncate mt-1">
                    {LOFI_PLAYLIST[currentTrackIndex].title}
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block truncate mt-0.5">
                    {LOFI_PLAYLIST[currentTrackIndex].artist}
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
                  className={`w-full h-1.5 rounded-full appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-800 ${accent.sliderAccent} [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-zinc-700 dark:[&::-webkit-slider-thumb]:bg-white`}
                  aria-label={t("aura.timelineScrub")}
                />
                <div className="flex justify-between text-[9px] font-mono text-zinc-450 dark:text-zinc-550">
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
                    className={`w-16 h-1 rounded-full appearance-none bg-zinc-200 dark:bg-zinc-800 ${accent.sliderAccent} [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-zinc-650`}
                    aria-label={t("aura.volumeLabel")}
                  />
                </div>

                {/* Navigation group */}
                <div className="flex items-center gap-3">
                  <button onClick={handlePrev} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/20 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-zinc-900/50 active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-base">skip_previous</span>
                  </button>

                  <button
                    onClick={handlePlayPause}
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-all ${accent.accentBg}`}
                  >
                    <span className="material-symbols-outlined text-xl">{playing ? "pause" : "play_arrow"}</span>
                  </button>

                  <button onClick={handleNext} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/20 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-zinc-900/50 active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-base">skip_next</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Shop Card */}
          <div className="bg-white/40 dark:bg-zinc-950/40 backdrop-blur-3xl border border-white/20 dark:border-zinc-800/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between flex-1">
            <div className={`absolute inset-0 bg-gradient-to-br ${accent.themeBg} pointer-events-none opacity-40`} />
            
            <div className="relative z-10 space-y-4">
              <div>
                <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">palette</span>
                  {t("aura.themeShop")}
                </h4>
                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-snug mt-1">
                  {t("aura.themeShopDesc")}
                </p>
              </div>

              {/* Theme Shop Items */}
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {THEME_SHOP.map((theme) => {
                  const isRented = isThemeRented(theme.id);
                  const isActive = activeThemeId === theme.id;
                  const expiryText = getThemeExpiryText(theme.id);
                  const isPurchasing = rentingThemeId === theme.id;

                  return (
                    <div
                      key={theme.id}
                      className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${isActive ? "bg-white/60 dark:bg-zinc-900/40 border-white dark:border-zinc-800 shadow-sm" : "bg-white/10 dark:bg-zinc-900/10 border-transparent"}`}
                    >
                      {/* Gradient preview circle */}
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${theme.preview} shrink-0 ring-2 ring-white/30 dark:ring-zinc-950/20`} />

                      {/* Details */}
                      <div className="flex-1 min-w-0 text-left leading-tight">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-black text-zinc-800 dark:text-zinc-150">
                            {t(`aura.theme${theme.id.charAt(0).toUpperCase() + theme.id.slice(1)}Name`)}
                          </span>
                          {expiryText && (
                            <span className="text-[8px] font-bold text-success px-1 rounded bg-success/5 uppercase border border-success/10 shrink-0">
                              {expiryText}
                            </span>
                          )}
                        </div>
                        <span className="text-[8.5px] text-zinc-450 dark:text-zinc-450 block truncate mt-0.5">
                          {t(`aura.theme${theme.id.charAt(0).toUpperCase() + theme.id.slice(1)}Desc`)}
                        </span>
                      </div>

                      {/* Buy or Select Button */}
                      <div className="shrink-0">
                        {isRented ? (
                          isActive ? (
                            <span className={`text-[8.5px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl border border-transparent select-none bg-zinc-200/50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600`}>
                              {t("aura.themeUsed")}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSelectTheme(theme.id)}
                              className={`text-[8.5px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl border transition-all border-zinc-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 active:scale-95`}
                            >
                              {t("aura.themeApply")}
                            </button>
                          )
                        ) : (
                          <button
                            disabled={isPurchasing}
                            onClick={() => handleRentTheme(theme.id)}
                            className={`text-[8.5px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl text-white transition-all active:scale-95 ${accent.accentBg} ${accent.glow} flex items-center gap-1 disabled:opacity-50`}
                          >
                            {isPurchasing ? (
                              <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[10px]">paid</span>
                                {t("aura.themeRentCost", { price: theme.price })}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
        </FeatureGate>
      </div>
    </div>
  );
}
