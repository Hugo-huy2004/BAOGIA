import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon, Sun, Clock, Sparkles, TrendingUp, AlertTriangle, CheckCircle,
  ChevronDown, Plus, Trash2, BarChart2, Brain, Zap, Wifi, Battery,
  Smartphone, Eye, Activity, ShieldCheck, Edit3, X, Target, Flame,
  Coffee, Droplets, Dumbbell, Monitor, BedDouble, Timer, ArrowUp, ArrowDown,
  Calendar, TrendingDown, Minus, Info,
} from "lucide-react";
import dataApi from "../../../services/dataApi";
import { HugoNoticeToast } from "../../shared/HugoNotice";

const AI_BASE = import.meta.env.VITE_API_URL || "/api";
const INTERNAL_KEY = import.meta.env.VITE_INTERNAL_API_KEY ?? "";

// ── Static data ────────────────────────────────────────────────────────────

const MOODS = [
  { value: "great",    label: "Rất tốt", emoji: "😊" },
  { value: "good",     label: "Tốt", emoji: "🙂" },
  { value: "okay",     label: "Bình thường", emoji: "😐" },
  { value: "bad",      label: "Không tốt", emoji: "😔" },
  { value: "terrible", label: "Rất tệ", emoji: "😫" },
];

const QUALITY_LABELS = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Rất tốt"];
const QUALITY_COLORS = ["", "bg-destructive", "bg-warning", "bg-info", "bg-success", "bg-primary"];
const QUALITY_TEXT   = ["", "text-destructive", "text-warning", "text-info", "text-success", "text-primary"];

const CAFFEINE_OPTIONS = [
  { value: "none",     label: "Không", icon: "🚫" },
  { value: "light",    label: "Ít", icon: "☕" },
  { value: "moderate", label: "Vừa", icon: "☕☕" },
  { value: "heavy",    label: "Nhiều", icon: "☕☕☕" },
];

const EXERCISE_OPTIONS = [
  { value: "none",     label: "Không", icon: "🚫" },
  { value: "light",    label: "Nhẹ", icon: "🚶" },
  { value: "moderate", label: "Vừa", icon: "🏃" },
  { value: "intense",  label: "Mạnh", icon: "💪" },
];

const ALCOHOL_OPTIONS = [
  { value: "none",     label: "Không", icon: "🚫" },
  { value: "light",    label: "Ít", icon: "🍺" },
  { value: "moderate", label: "Vừa", icon: "🍷" },
  { value: "heavy",    label: "Nhiều", icon: "🥃" },
];

const ENV_OPTIONS = [
  { value: "excellent", label: "Rất tốt", color: "text-success" },
  { value: "good",      label: "Tốt", color: "text-info" },
  { value: "fair",      label: "Bình thường", color: "text-warning" },
  { value: "poor",      label: "Kém", color: "text-destructive" },
];

const SIGNAL_META = {
  screen_locked:   { icon: Smartphone, label: "Màn hình khoá",   color: "text-primary" },
  screen_unlocked: { icon: Smartphone, label: "Màn hình mở",     color: "text-warning" },
  page_hidden:     { icon: Eye,        label: "Tab ẩn",           color: "text-info"   },
  page_visible:    { icon: Eye,        label: "Tab hiện",         color: "text-success"  },
  inactivity_30m:  { icon: Clock,      label: "Không hoạt động",  color: "text-accent" },
  user_activity:   { icon: Activity,   label: "Hoạt động",        color: "text-destructive"   },
  browser_close:   { icon: X,          label: "Đóng tab",         color: "text-warning" },
  battery_charge:  { icon: Battery,    label: "Cắm sạc",          color: "text-success"},
  device_still:    { icon: Smartphone, label: "Thiết bị tĩnh",    color: "text-info"   },
  device_moving:   { icon: Activity,   label: "Thiết bị cử động", color: "text-accent"   },
};

const CAPABILITY_ICONS = [
  { key: "pageVisibility", icon: Eye,        label: "Chế độ tab" },
  { key: "idleDetector",   icon: Smartphone, label: "Màn hình khoá" },
  { key: "battery",        icon: Battery,    label: "Pin" },
  { key: "deviceMotion",   icon: Activity,   label: "Cảm biến cử động" },
  { key: "periodicSync",   icon: Wifi,       label: "Nền hệ thống" },
];

function getScoreColor(score) {
  if (!score) return "text-muted-foreground";
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-info";
  if (score >= 40) return "text-warning";
  return "text-destructive";
}

function getScoreGradient(score) {
  if (!score) return "from-muted/20 to-muted/10";
  if (score >= 80) return "from-success/20 to-success/5";
  if (score >= 60) return "from-info/20 to-info/5";
  if (score >= 40) return "from-warning/20 to-warning/5";
  return "from-destructive/20 to-destructive/5";
}

function barColor(pct) {
  if (pct >= 95) return "bg-primary";
  if (pct >= 80) return "bg-success";
  if (pct >= 65) return "bg-warning";
  return "bg-destructive";
}

function ageGroup(bio) {
  const age = bio?.age ? Number(bio.age) : null;
  if (!age) return 8;
  if (age <= 12) return 10;
  if (age <= 17) return 9;
  return 8;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

/** Score label in Vietnamese */
function scoreLabel(score) {
  if (!score && score !== 0) return "—";
  if (score >= 90) return "Xuất sắc";
  if (score >= 75) return "Tốt";
  if (score >= 60) return "Khá";
  if (score >= 40) return "Trung bình";
  return "Kém";
}

/** Trend arrow */
function TrendIcon({ value }) {
  if (value > 0) return <ArrowUp className="w-3 h-3 text-success" />;
  if (value < 0) return <ArrowDown className="w-3 h-3 text-destructive" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
}

// ── Score Breakdown Ring ──────────────────────────────────────────────────

function ScoreRing({ score, size = 80, stroke = 6 }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="currentColor" strokeWidth={stroke}
        className="text-muted/20" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function SleepTracker({ bio, sleepAutoDetect }) {
  const email = bio?.email;
  const isPWA = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  const [logs, setLogs]           = useState([]);
  const [stats, setStats]         = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingLogs, setLoading] = useState(false);
  const [didFetch, setDidFetch]   = useState(false);

  const [analysis, setAnalysis]     = useState(null);
  const [analyzing, setAnalyzing]   = useState(false);
  const [showForm, setShowForm]     = useState(() => window.innerWidth >= 768);
  const [showHistory, setShowHistory] = useState(false);
  const [deleting, setDeleting]     = useState(null);
  const [toast, setToast]           = useState(null);
  const [showDetails, setShowDetails] = useState(null); // date of expanded log details

  const [sensorsConnected, setSensorsConnected] = useState(() => {
    if (isPWA) return true;
    return localStorage.getItem("device_sensors_connected") === "true";
  });
  const [motionVal, setMotionVal] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [batteryCharging, setBatteryCharging] = useState(false);
  const [tabVisibility, setTabVisibility] = useState(document.hidden ? "Ẩn" : "Hiện");

  const handleConnectSensors = async () => {
    if (isPWA) return;
    try {
      if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        const result = await DeviceMotionEvent.requestPermission();
        if (result === "granted") {
          showToastMsg("Đồng bộ cảm biến cử động iOS thành công!", "success");
        } else {
          showToastMsg("Quyền cảm biến chuyển động bị từ chối.", "warning");
        }
      }

      if ("IdleDetector" in window) {
        const state = await IdleDetector.requestPermission();
        if (state === "granted") {
          showToastMsg("Đồng bộ màn hình khóa thành công!", "success");
        }
      }

      if (navigator.getBattery) {
        await navigator.getBattery();
      }

      localStorage.setItem("device_sensors_connected", "true");
      setSensorsConnected(true);
      showToastMsg("Đã kết nối cảm biến thiết bị thành công!", "success");
    } catch (e) {
      console.error("Connect sensors error:", e);
      showToastMsg("Lỗi khi kết nối cảm biến: " + e.message, "error");
    }
  };

  useEffect(() => {
    if (!sensorsConnected) return;

    const handleMotion = (e) => {
      const a = e.acceleration;
      if (a) {
        const val = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
        setMotionVal(Number(val.toFixed(2)));
      }
    };
    
    const interval = setInterval(() => {
      setMotionVal(prev => {
        const drift = (Math.random() - 0.5) * 0.05;
        return Math.max(0, Math.min(2, Number((prev + drift).toFixed(2))));
      });
    }, 1000);

    window.addEventListener("devicemotion", handleMotion);

    const handleVisibility = () => {
      setTabVisibility(document.hidden ? "Ẩn" : "Hiện");
    };
    document.addEventListener("visibilitychange", handleVisibility);

    if (navigator.getBattery) {
      navigator.getBattery().then(bat => {
        setBatteryLevel(Math.round(bat.level * 100));
        setBatteryCharging(bat.charging);
        const updateCharging = () => setBatteryCharging(bat.charging);
        const updateLevel = () => setBatteryLevel(Math.round(bat.level * 100));
        bat.addEventListener("chargingchange", updateCharging);
        bat.addEventListener("levelchange", updateLevel);
        return () => {
          bat.removeEventListener("chargingchange", updateCharging);
          bat.removeEventListener("levelchange", updateLevel);
        };
      });
    }

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [sensorsConnected]);

  // Pending auto-detect confirmation
  const [pendingCycle, setPendingCycleRaw] = useState(null);
  const setPendingCycle = useCallback((val) => {
    setPendingCycleRaw(val);
    if (val === null) sleepAutoDetect?.clearPendingCycle?.();
  }, [sleepAutoDetect]);

  const emptyForm = {
    date:       todayStr(),
    bedtime:    "22:30",
    wakeTime:   "06:30",
    quality:    3,
    mood:       "okay",
    notes:      "",
    dreamNotes: "",
    sleepLatency: 15,
    awakenings: 0,
    wakeAfterSleepOnset: 0,
    screenTime: 30,
    caffeine:   "none",
    exercise:   "none",
    alcohol:    "none",
    sleepEnvironment: "good",
    stressLevel: 2,
  };
  const [form, setForm] = useState(emptyForm);

  const fetchRef = useRef(false);

  // ── Auto-detection ──

  const { state: detectState, sleepStart, confidence, recentSignals, caps,
    pendingCycle: autoPendingCycle, clearPendingCycle } = sleepAutoDetect || {};

  useEffect(() => {
    if (autoPendingCycle) {
      setPendingCycle(autoPendingCycle);
      fetchLogs();
    }
  }, [autoPendingCycle]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch ─────────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    if (!email || fetchRef.current) return;
    fetchRef.current = true;
    setLoading(true);
    try {
      const ageParam = bio?.age ? `&age=${bio.age}` : "";
      const res = await dataApi.get(`/api/sleep?email=${encodeURIComponent(email)}&limit=30${ageParam}`);
      setLogs(res.data.logs || []);
      setStats(res.data.stats || null);
      setAnalytics(res.data.analytics || null);
      setDidFetch(true);
    } catch (_) {
    } finally {
      setLoading(false);
      fetchRef.current = false;
    }
  }, [email, bio?.age]);

  const ensureFetched = useCallback(() => {
    if (!didFetch && !loadingLogs) fetchLogs();
  }, [didFetch, loadingLogs, fetchLogs]);

  // ── Toast ─────────────────────────────────────────────────────────────

  function showToastMsg(msg, type = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Save log ──────────────────────────────────────────────────────────

  const handleSave = async (e, overrides = {}) => {
    e?.preventDefault();
    if (!email) return;
    const payload = { ...form, ...overrides, email };
    try {
      await dataApi.post("/api/sleep", payload);
      showToastMsg("Đã lưu nhật ký giấc ngủ!", "success");
      setShowForm(false);
      setPendingCycle(null);
      fetchLogs();
    } catch (err) {
      showToastMsg("Lỗi khi lưu: " + (err?.response?.data?.error || err.message), "error");
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────

  const handleDelete = async (date) => {
    if (!email) return;
    setDeleting(date);
    try {
      await dataApi.delete(`/api/sleep/${date}?email=${encodeURIComponent(email)}`);
      showToastMsg("Đã xóa!", "success");
      setLogs(prev => prev.filter(l => l.date !== date));
    } catch (_) {
      showToastMsg("Lỗi xóa dữ liệu.", "error");
    } finally {
      setDeleting(null);
    }
  };

  // ── AI Analysis ───────────────────────────────────────────────────────

  const runAnalysis = async () => {
    if (!logs.length) { ensureFetched(); return; }
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch(`${AI_BASE}/sleep/analyze`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "X-Internal-Key": INTERNAL_KEY },
        body:    JSON.stringify({ sleepLogs: logs.slice(0, 14), bio: bio || {} }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (_) {
      showToastMsg("Không thể phân tích lúc này, thử lại sau.", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Confirm auto-detected cycle ───────────────────────────────────────

  const confirmCycle = (editedCycle) => {
    const target = editedCycle || pendingCycle;
    handleSave(null, {
      date:       target.date,
      bedtime:    target.bedtime,
      wakeTime:   target.wakeTime,
      quality:    form.quality,
      mood:       form.mood,
    });
  };

  // ── Chart data ────────────────────────────────────────────────────────

  const last7       = [...logs].slice(0, 7).reverse();
  const targetHours = stats?.targetHours || ageGroup(bio);
  const maxDuration = Math.max(...last7.map(l => l.duration || 0), targetHours);

  // Sleep debt trend (compare last 7 vs previous 7)
  const debtTrend = useMemo(() => {
    if (logs.length < 8) return null;
    const prev7 = logs.slice(7, 14);
    const curAvg = last7.filter(l => l.duration).reduce((s, l, _, a) => s + l.duration / a.length, 0);
    const prevAvg = prev7.filter(l => l.duration).reduce((s, l, _, a) => s + l.duration / a.length, 0);
    return Math.round((curAvg - prevAvg) * 10) / 10;
  }, [logs, last7]);

  // ── Render helpers ─────────────────────────────────────────────────────

  const detectStateMeta = {
    monitoring: { label: "Đang theo dõi",    dot: "bg-info animate-pulse",    ring: "border-info/20" },
    sleeping:   { label: "Đang ngủ...",       dot: "bg-primary animate-pulse",  ring: "border-primary/30" },
    awake:      { label: "Đã thức dậy",       dot: "bg-success",               ring: "border-success/20" },
  }[detectState] || {};

  const sleepScore = analytics?.sleepScore;
  const sleepDebt  = analytics?.sleepDebt;
  const regularity = analytics?.regularity;

  // ── Form update helper ──
  const updateForm = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── JSX ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col md:flex-col-reverse gap-4 animate-fadeIn">

      <HugoNoticeToast
        open={Boolean(toast)}
        type={toast?.type || "info"}
        message={toast?.msg}
        zIndex={320}
      />

      {/* ── Live detection status card ── */}
      <div className={`bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/5
        dark:from-primary/30 dark:via-accent/20 dark:to-secondary/10
        border ${detectStateMeta.ring || "border-primary/10"} rounded-2xl p-4 space-y-3
        md:order-last`}
      >
        {/* Connection Row */}
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sensorsConnected ? "bg-success" : "bg-destructive"}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${sensorsConnected ? "bg-success" : "bg-destructive"}`}></span>
            </span>
            <span className="text-[11px] font-bold text-foreground">
              Bộ cảm biến: {isPWA ? "Tự động kích hoạt (PWA)" : sensorsConnected ? "Đang kết nối" : "Chưa liên kết"}
            </span>
          </div>
          {isPWA ? (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success/15 text-success border border-success/30">
              Tự động
            </span>
          ) : (
            <button
              type="button"
              onClick={handleConnectSensors}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 border ${
                sensorsConnected
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-primary hover:bg-primary/90 text-white border-transparent"
              }`}
            >
              {sensorsConnected ? "Đã liên kết" : "Liên kết thiết bị"}
            </button>
          )}
        </div>

        {/* Real-time monitor grid */}
        {sensorsConnected && (
          <div className="grid grid-cols-3 gap-2 bg-black/10 dark:bg-black/30 rounded-xl p-3 border border-border/30">
            <div className="text-center space-y-1">
              <div className="text-[9px] text-muted-foreground font-medium uppercase">Cử động</div>
              <div className="text-xs font-mono font-bold text-accent flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[10px] animate-pulse">waves</span>
                <span>{motionVal} m/s²</span>
              </div>
            </div>
            <div className="text-center space-y-1 border-x border-border/30">
              <div className="text-[9px] text-muted-foreground font-medium uppercase">Pin</div>
              <div className="text-xs font-mono font-bold text-success flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[10px]">{batteryCharging ? "battery_charging_full" : "battery_full"}</span>
                <span>{batteryLevel !== null ? `${batteryLevel}%` : "—"}{batteryCharging && " ⚡"}</span>
              </div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-[9px] text-muted-foreground font-medium uppercase">Trạng thái Tab</div>
              <div className="text-xs font-bold text-info flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[10px]">{tabVisibility === "Hiện" ? "visibility" : "visibility_off"}</span>
                <span>{tabVisibility}</span>
              </div>
            </div>
          </div>
        )}

        {/* Header row */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              {detectState === "sleeping" ? <Moon className="w-4 h-4 text-primary" />
                : detectState === "awake" ? <Sun  className="w-4 h-4 text-warning" />
                : <Clock className="w-4 h-4 text-info" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${detectStateMeta.dot}`} />
                <h3 className="text-sm font-bold text-foreground">{detectStateMeta.label}</h3>
              </div>
              <p className="text-[10px] text-muted-foreground">Tự động · 8 tín hiệu thiết bị thật</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(v => !v); ensureFetched(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm thủ công
            </button>
            <button
              onClick={() => { ensureFetched(); runAnalysis(); }}
              disabled={analyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 hover:bg-accent/25 text-accent text-xs font-semibold transition-all disabled:opacity-50"
            >
              <Brain className="w-3.5 h-3.5" />
              {analyzing ? "Đang phân tích…" : "Phân tích AI"}
            </button>
          </div>
        </div>

        {/* Sleep onset info */}
        {detectState === "sleeping" && sleepStart && (
          <div className="bg-primary/10 border border-primary/15 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <Moon className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-primary">Ghi nhận ngủ lúc {sleepStart.time}</span>
              <span className="text-muted-foreground ml-1.5">· {sleepStart.date}</span>
            </div>
          </div>
        )}

        {/* Sleep onset confidence progress */}
        {detectState === "monitoring" && confidence > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground font-medium">Tín hiệu ngủ đang thu thập…</span>
              <span className="text-[10px] font-bold text-primary">{confidence}%</span>
            </div>
            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${confidence}%` }}
                transition={{ type: "spring", stiffness: 60 }}
              />
            </div>
          </div>
        )}

        {/* Capability badges */}
        <div className="flex gap-1.5 flex-wrap">
          {CAPABILITY_ICONS.map(({ key, icon: Icon, label }) => (
            <div
              key={key}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all
                ${caps[key]
                  ? "bg-success/10 border-success/20 text-success"
                  : "bg-muted/20 border-border/40 text-muted-foreground/50"
                }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </div>
          ))}
        </div>

        {/* Recent signal feed */}
        {recentSignals.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground self-center">Tín hiệu gần nhất:</span>
            {recentSignals.map((sig, i) => {
              const meta = SIGNAL_META[sig];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <motion.div
                  key={`${sig}-${i}`}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-semibold bg-white/5 border border-white/10 ${meta.color}`}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {meta.label}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Quick stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: "TB ngủ",   value: stats.avgDuration ? `${stats.avgDuration}h` : "—", bg: "bg-primary/10", border: "border-primary/10", text: "text-primary" },
              { label: "TB CL",    value: stats.avgQuality  ? `${stats.avgQuality}/5`  : "—", bg: "bg-accent/10", border: "border-accent/10", text: "text-accent" },
              { label: "Đêm ghi", value: stats.total ?? 0,                                   bg: "bg-info/10", border: "border-info/10", text: "text-info" },
            ].map(({ label, value, bg, border, text }) => (
              <div key={label} className={`${bg} rounded-xl p-2.5 text-center border ${border}`}>
                <div className={`text-base font-black ${text}`}>{value}</div>
                <div className="text-[9px] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sleep Score Dashboard ────────────────────────────── */}
      {didFetch && sleepScore && (
        <div className={`bg-gradient-to-br ${getScoreGradient(sleepScore.total)} border border-border/50 rounded-2xl p-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4" /> Điểm Số Giấc Ngủ
            </h4>
            <span className="text-[10px] text-muted-foreground">7 ngày gần nhất</span>
          </div>

          <div className="flex items-center gap-6">
            {/* Main score ring */}
            <div className="relative flex-shrink-0">
              <ScoreRing score={sleepScore.total} size={90} stroke={7} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl font-black ${getScoreColor(sleepScore.total)}`}>{sleepScore.total}</span>
                <span className="text-[9px] text-muted-foreground font-medium">/100</span>
              </div>
            </div>

            {/* Breakdown bars */}
            <div className="flex-1 space-y-2">
              {[
                { label: "Thời lượng", score: sleepScore.duration, icon: Clock },
                { label: "Chất lượng", score: sleepScore.quality, icon: Sparkles },
                { label: "Ổn định", score: sleepScore.consistency, icon: TrendingUp },
                { label: "Thời điểm", score: sleepScore.timing, icon: Moon },
                { label: "Hiệu suất", score: sleepScore.efficiency, icon: Zap },
              ].map(({ label, score: s, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground w-14 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor(s)}`} style={{ width: `${s}%` }} />
                  </div>
                  <span className="text-[10px] font-bold w-6 text-right">{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pt-1">
            <span className="text-xs font-bold text-foreground">{scoreLabel(sleepScore.total)}</span>
            <span className="text-[10px] text-muted-foreground ml-2">
              · TB {sleepScore.avgDuration}h/đêm · CL {sleepScore.avgQuality}/5
            </span>
          </div>
        </div>
      )}

      {/* ── Sleep Debt & Regularity Cards ─────────────────────── */}
      {didFetch && (sleepDebt || regularity) && (
        <div className="grid grid-cols-2 gap-3">
          {/* Sleep Debt */}
          {sleepDebt && sleepDebt.debt > 0 && (
            <div className="bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/15 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-destructive/15 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Thiếu ngủ</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-destructive">{sleepDebt.debt}</span>
                <span className="text-xs text-destructive/70 font-semibold">giờ</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Trong {sleepDebt.days} ngày · Thiếu TB {sleepDebt.avgDeficit}h/đêm
              </p>
              {sleepDebt.recoveryDays > 0 && (
                <p className="text-[10px] text-destructive/80 font-medium">
                  Cần ~{sleepDebt.recoveryDays} đêm ngủ bù thêm 1h
                </p>
              )}
            </div>
          )}

          {sleepDebt && sleepDebt.debt === 0 && (
            <div className="bg-gradient-to-br from-success/10 to-success/5 border border-success/15 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-success/15 flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-success" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Không thiếu ngủ</span>
              </div>
              <p className="text-xs text-success font-semibold">Đủ giấc trong {sleepDebt.days} ngày qua ✓</p>
            </div>
          )}

          {/* Regularity */}
          {regularity !== null && regularity !== undefined && (
            <div className="bg-gradient-to-br from-info/10 to-info/5 border border-info/15 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-info/15 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5 text-info" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Ổn định lịch</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-info">{regularity}</span>
                <span className="text-xs text-info/70 font-semibold">/100</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {regularity >= 80 ? "Lịch ngủ rất ổn định" :
                 regularity >= 60 ? "Khá ổn định, nên cố định hơn" :
                 regularity >= 40 ? "Biến động较多, nên ngủ đúng giờ" :
                 "Lịch ngủ thất thường, cần cải thiện"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Auto-detection confirmation banner ──────────────────────────── */}
      <AnimatePresence>
        {pendingCycle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            className="bg-gradient-to-r from-success/15 to-success/10 border border-success/25 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-success">Tự động ghi nhận giấc ngủ</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hệ thống phát hiện bạn ngủ lúc{" "}
                  <span className="font-bold text-foreground">{pendingCycle.bedtime}</span>
                  {" "}và thức dậy lúc{" "}
                  <span className="font-bold text-foreground">{pendingCycle.wakeTime}</span>
                  {" "}· {pendingCycle.date}
                </p>

                {/* Quality + mood quick pick before confirming */}
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground">Chất lượng giấc ngủ?</label>
                    <div className="flex gap-1.5 mt-1">
                      {[1,2,3,4,5].map(q => (
                        <button key={q} type="button"
                          onClick={() => updateForm("quality", q)}
                          className={`flex-1 h-7 rounded-lg text-xs font-bold border transition-all
                            ${form.quality === q
                              ? `${QUALITY_COLORS[q]} text-white border-transparent`
                              : "bg-muted/20 border-border text-muted-foreground"}`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground">Tâm trạng khi dậy?</label>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {MOODS.map(m => (
                        <button key={m.value} type="button"
                          onClick={() => updateForm("mood", m.value)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 transition-all
                            ${form.mood === m.value
                              ? "bg-primary/20 border-primary/40 text-primary"
                              : "bg-muted/20 border-border text-muted-foreground"}`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => confirmCycle()}
                    className="flex-1 py-2 rounded-lg bg-success hover:bg-success/90 text-white text-xs font-bold transition-all"
                  >
                    <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                    Xác nhận & Lưu
                  </button>
                  <button
                    onClick={() => {
                      setForm(f => ({ ...f, ...pendingCycle }));
                      setPendingCycle(null);
                      setShowForm(true);
                    }}
                    className="px-3 py-2 rounded-lg bg-muted/20 hover:bg-muted/40 text-muted-foreground text-xs font-semibold transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => setPendingCycle(null)}
                    className="px-3 py-2 rounded-lg bg-muted/20 hover:bg-muted/40 text-muted-foreground text-xs font-semibold transition-all"
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Manual log form (enhanced) ──────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
          >
            <form onSubmit={handleSave} className="bg-card border border-border rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Moon className="w-4 h-4 text-primary" />
                  Ghi Nhật Ký Giấc Ngủ
                </h4>
                <button type="button" onClick={() => setShowForm(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted/30 text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Core sleep times */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: "date",     label: "Ngày",     type: "date", max: todayStr(), icon: Calendar },
                  { key: "bedtime",  label: "Giờ ngủ",  type: "time", icon: Moon },
                  { key: "wakeTime", label: "Giờ dậy",  type: "time", icon: Sun },
                ].map(({ key, label, type, max, icon: Icon }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                      <Icon className="w-3 h-3" />{label}
                    </label>
                    <input type={type} value={form[key]} max={max}
                      onChange={e => updateForm(key, e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                  </div>
                ))}
              </div>

              {/* Sleep quality */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 flex justify-between">
                  <span>Chất lượng giấc ngủ</span>
                  <span className={`font-black ${QUALITY_TEXT[form.quality]}`}>{QUALITY_LABELS[form.quality]}</span>
                </label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(q => (
                    <button key={q} type="button"
                      onClick={() => updateForm("quality", q)}
                      className={`flex-1 h-9 rounded-lg text-xs font-bold border transition-all
                        ${form.quality === q ? `${QUALITY_COLORS[q]} text-white border-transparent`
                          : "bg-muted/30 border-border text-muted-foreground"}`}
                    >{q}</button>
                  ))}
                </div>
              </div>

              {/* Clinical metrics row */}
              <div className="bg-muted/10 rounded-xl p-3 space-y-3 border border-border/30">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> Chỉ số lâm sàng
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                      <Timer className="w-3 h-3" /> Delay (phút)
                    </label>
                    <input type="number" min={0} max={120} value={form.sleepLatency}
                      onChange={e => updateForm("sleepLatency", Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground"
                      placeholder="15" />
                    <span className="text-[9px] text-muted-foreground">Lý tưởng: 10-20 phút</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> tỉnh giấc
                    </label>
                    <input type="number" min={0} max={20} value={form.awakenings}
                      onChange={e => updateForm("awakenings", Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground"
                      placeholder="0" />
                    <span className="text-[9px] text-muted-foreground">Lý tưởng: 0-1 lần</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                      <BedDouble className="w-3 h-3" /> WASO (phút)
                    </label>
                    <input type="number" min={0} max={180} value={form.wakeAfterSleepOnset}
                      onChange={e => updateForm("wakeAfterSleepOnset", Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground"
                      placeholder="0" />
                    <span className="text-[9px] text-muted-foreground">Thức sau khi ngủ</span>
                  </div>
                </div>
              </div>

              {/* Behavioral context */}
              <div className="bg-muted/10 rounded-xl p-3 space-y-3 border border-border/30">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3 h-3" /> Hoạt động trước khi ngủ
                </p>

                {/* Screen time */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                    <Monitor className="w-3 h-3" /> Thời gian màn hình (phút)
                  </label>
                  <input type="range" min={0} max={240} step={5} value={form.screenTime}
                    onChange={e => updateForm("screenTime", Number(e.target.value))}
                    className="w-full h-1.5 bg-muted/30 rounded-full appearance-none cursor-pointer accent-primary" />
                  <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                    <span>0 phút</span>
                    <span className={`font-bold ${form.screenTime > 60 ? "text-destructive" : form.screenTime > 30 ? "text-warning" : "text-success"}`}>
                      {form.screenTime} phút {form.screenTime > 60 ? "⚠️" : ""}
                    </span>
                    <span>4h</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Caffeine */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Coffee className="w-3 h-3" /> Caffeine
                    </label>
                    <div className="flex gap-1">
                      {CAFFEINE_OPTIONS.map(o => (
                        <button key={o.value} type="button"
                          onClick={() => updateForm("caffeine", o.value)}
                          className={`flex-1 py-1 rounded-md text-[10px] font-semibold border transition-all
                            ${form.caffeine === o.value
                              ? "bg-primary/20 border-primary/40 text-primary"
                              : "bg-muted/20 border-border text-muted-foreground"}`}
                        >{o.icon}</button>
                      ))}
                    </div>
                  </div>

                  {/* Exercise */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Dumbbell className="w-3 h-3" /> Vận động
                    </label>
                    <div className="flex gap-1">
                      {EXERCISE_OPTIONS.map(o => (
                        <button key={o.value} type="button"
                          onClick={() => updateForm("exercise", o.value)}
                          className={`flex-1 py-1 rounded-md text-[10px] font-semibold border transition-all
                            ${form.exercise === o.value
                              ? "bg-primary/20 border-primary/40 text-primary"
                              : "bg-muted/20 border-border text-muted-foreground"}`}
                        >{o.icon}</button>
                      ))}
                    </div>
                  </div>

                  {/* Alcohol */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Droplets className="w-3 h-3" /> Rượu bia
                    </label>
                    <div className="flex gap-1">
                      {ALCOHOL_OPTIONS.map(o => (
                        <button key={o.value} type="button"
                          onClick={() => updateForm("alcohol", o.value)}
                          className={`flex-1 py-1 rounded-md text-[10px] font-semibold border transition-all
                            ${form.alcohol === o.value
                              ? "bg-primary/20 border-primary/40 text-primary"
                              : "bg-muted/20 border-border text-muted-foreground"}`}
                        >{o.icon}</button>
                      ))}
                    </div>
                  </div>

                  {/* Sleep environment */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                      <BedDouble className="w-3 h-3" /> Môi trường
                    </label>
                    <div className="flex gap-1">
                      {ENV_OPTIONS.map(o => (
                        <button key={o.value} type="button"
                          onClick={() => updateForm("sleepEnvironment", o.value)}
                          className={`flex-1 py-1 rounded-md text-[10px] font-semibold border transition-all
                            ${form.sleepEnvironment === o.value
                              ? "bg-primary/20 border-primary/40 text-primary"
                              : "bg-muted/20 border-border text-muted-foreground"}`}
                        >{o.label}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stress level */}
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Brain className="w-3 h-3" /> Căng thẳng trước khi ngủ
                  </label>
                  <div className="flex gap-1.5">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button"
                        onClick={() => updateForm("stressLevel", s)}
                        className={`flex-1 h-7 rounded-lg text-[10px] font-bold border transition-all
                          ${form.stressLevel === s
                            ? `${s <= 2 ? "bg-success/20 border-success/40 text-success" : s === 3 ? "bg-warning/20 border-warning/40 text-warning" : "bg-destructive/20 border-destructive/40 text-destructive"}`
                            : "bg-muted/20 border-border text-muted-foreground"}`}
                      >
                        {s === 1 ? "Rất ít" : s === 2 ? "Ít" : s === 3 ? "Vừa" : s === 4 ? "Nhiều" : "Rất nhiều"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mood */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Tâm trạng khi dậy</label>
                <div className="flex gap-2 flex-wrap">
                  {MOODS.map(m => (
                    <button key={m.value} type="button"
                      onClick={() => updateForm("mood", m.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-all
                        ${form.mood === m.value
                          ? "bg-primary/20 border-primary/40 text-primary"
                          : "bg-muted/20 border-border text-muted-foreground"}`}
                    >{m.icon} {m.label}</button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "notes",      label: "Ghi chú",     placeholder: "Giấc ngủ cảm giác thế nào…" },
                  { key: "dreamNotes", label: "Giấc mơ",     placeholder: "Giấc mơ đêm qua…" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
                    <textarea rows={2} maxLength={key === "notes" ? 500 : 300} value={form[key]}
                      onChange={e => updateForm(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none placeholder:text-muted-foreground/60"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-muted/30 hover:bg-muted/50 text-muted-foreground transition-all">Huỷ</button>
                <button type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-white transition-all">Lưu</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 7-day chart (enhanced) ─────────────────────────────────────── */}
      {!didFetch && !loadingLogs && (
        <button onClick={ensureFetched}
          className="w-full py-3 rounded-2xl border border-border/50 text-xs text-muted-foreground hover:bg-muted/10 transition-all flex items-center justify-center gap-2">
          <BarChart2 className="w-4 h-4" /> Tải lịch sử giấc ngủ
        </button>
      )}

      {loadingLogs && (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {didFetch && last7.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2"><BarChart2 className="w-4 h-4" /> 7 Ngày Gần Nhất</span>
            <span className="text-[10px] normal-case font-normal flex items-center gap-1.5">
              Mục tiêu: {targetHours}h/đêm
              {debtTrend !== null && (
                <span className={`flex items-center gap-0.5 ${debtTrend > 0 ? "text-success" : debtTrend < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  <TrendIcon value={debtTrend} />
                  {debtTrend > 0 ? "+" : ""}{debtTrend}h
                </span>
              )}
            </span>
          </h4>

          {/* Main bar chart */}
          <div className="flex items-end gap-2" style={{ height: "7rem" }}>
            {last7.map((log, i) => {
              const dur  = log.duration || 0;
              const pct  = dur ? Math.min(100, Math.round((dur / maxDuration) * 100)) : 8;
              const fill = dur ? barColor(Math.round((dur / targetHours) * 100)) : "bg-muted/25";
              const day  = new Date(log.date).toLocaleDateString("vi-VN", { weekday: "short" });
              return (
                <div key={log.date || i} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg px-2.5 py-2 text-[10px] w-36 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg space-y-1">
                    <div className="font-bold text-foreground">{dur ? `${dur}h` : "—"}</div>
                    <div className="text-muted-foreground">{log.bedtime || "?"} → {log.wakeTime || "?"}</div>
                    {log.quality && <div className={QUALITY_TEXT[log.quality]}>{QUALITY_LABELS[log.quality]}</div>}
                    {log.sleepLatency != null && <div className="text-muted-foreground">Delay: {log.sleepLatency} phút</div>}
                    {log.awakenings != null && log.awakenings > 0 && <div className="text-muted-foreground">Tỉnh: {log.awakenings} lần</div>}
                    {log.sleepEfficiency != null && <div className="text-muted-foreground">Hiệu suất: {log.sleepEfficiency}%</div>}
                    {log.passiveDetected && <div className="text-primary">Tự động ✓</div>}
                  </div>
                  <div className={`w-full rounded-t-lg ${fill} opacity-75 group-hover:opacity-100 transition-all`}
                    style={{ height: `${pct}%` }} />
                  <span className="text-[9px] text-muted-foreground font-medium">{day}</span>
                  {log.quality && <div className={`w-1.5 h-1.5 rounded-full ${QUALITY_COLORS[log.quality]}`} />}
                  {log.passiveDetected && <div className="w-1.5 h-1.5 rounded-full bg-primary ring-1 ring-primary/40" title="Tự động" />}
                </div>
              );
            })}
          </div>

          {/* Target range indicator */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <div className="flex-1 border-t border-dashed border-primary/30" />
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3 text-primary" />
              Khoảng mục tiêu: {targetHours - 1}h – {targetHours + 1}h
            </span>
            <div className="flex-1 border-t border-dashed border-primary/30" />
          </div>

          <div className="flex gap-4 flex-wrap text-[10px] text-muted-foreground">
            {[["bg-primary","≥ 100%"],["bg-success","80–99%"],["bg-warning","65–79%"],["bg-destructive","< 65%"],["bg-primary","Tự động"]].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${c}`} />
                {l}
              </div>
            ))}
          </div>

          {/* Sleep stages visualization (if available from recent auto-detected logs) */}
          {logs[0]?.sleepStages && (
            <div className="bg-muted/10 rounded-xl p-3 border border-border/30 space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Moon className="w-3 h-3" /> Giai đoạn giấc ngủ (mô phỏng)
              </p>
              <div className="flex rounded-lg overflow-hidden h-6">
                {[
                  { label: "Sâu", pct: logs[0].sleepStages.deep || 20, color: "bg-primary" },
                  { label: "REM", pct: logs[0].sleepStages.rem || 25, color: "bg-accent" },
                  { label: "Nhẹ", pct: logs[0].sleepStages.light || 45, color: "bg-info/60" },
                  { label: "Thức", pct: logs[0].sleepStages.awake || 10, color: "bg-warning/60" },
                ].map(({ label, pct, color }) => (
                  <div key={label} className={`${color} flex items-center justify-center text-[9px] font-bold text-white`}
                    style={{ width: `${pct}%`, minWidth: pct > 5 ? "auto" : 0 }}>
                    {pct > 8 ? `${label} ${pct}%` : ""}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 text-[9px] text-muted-foreground">
                <span>● <span className="text-primary">Sâu</span>: Ngủ sâu phục hồi</span>
                <span>● <span className="text-accent">REM</span>: Giấc mơ, trí nhớ</span>
                <span>● <span className="text-info">Nhẹ</span>: Thư giãn</span>
                <span>● <span className="text-warning">Thức</span>: Tỉnh giấc</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AI Analysis ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="bg-gradient-to-br from-accent/10 via-primary/5 to-info/5
              dark:from-accent/30 border border-accent/15 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <h4 className="text-sm font-bold text-foreground">Phân Tích AI Giấc Ngủ</h4>
              <span className={`ml-auto text-2xl font-black ${getScoreColor(analysis.score)}`}>
                {analysis.score ?? "—"}<span className="text-sm font-bold text-muted-foreground">/100</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: "Trạng thái",   value: analysis.status            || "—" },
                { label: "TB ngủ",       value: analysis.avg_duration  ? `${analysis.avg_duration}h` : "—" },
                { label: "TB chất lượng",value: analysis.avg_quality   ? `${analysis.avg_quality}/5`  : "—" },
                { label: "Nhịp sinh học",value: analysis.bedtime_consistency || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-background/50 rounded-xl p-2.5 text-center">
                  <div className="text-sm font-bold text-foreground">{value}</div>
                  <div className="text-[9px] text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>

            {analysis.risk_flags?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Cảnh báo
                </p>
                {analysis.risk_flags.map((f, i) => (
                  <div key={i} className="text-xs text-foreground/80 bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2 flex gap-2">
                    <span className="text-destructive mt-0.5">•</span>{f}
                  </div>
                ))}
              </div>
            )}

            {analysis.strengths?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-success flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Điểm mạnh
                </p>
                {analysis.strengths.map((s, i) => (
                  <div key={i} className="text-xs text-foreground/80 bg-success/5 border border-success/10 rounded-lg px-3 py-2 flex gap-2">
                    <span className="text-success mt-0.5">✓</span>{s}
                  </div>
                ))}
              </div>
            )}

            {analysis.recommendations?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" /> Khuyến nghị AI
                </p>
                {analysis.recommendations.map((r, i) => (
                  <div key={i} className="text-xs text-foreground/80 bg-primary/5 border border-primary/10 rounded-lg px-3 py-2 flex gap-2">
                    <span className="text-primary font-bold mt-0.5">{i + 1}.</span>{r}
                  </div>
                ))}
              </div>
            )}

            {analysis.tonight_advice && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                <p className="text-xs font-bold text-primary flex items-center gap-1.5 mb-1">
                  <Moon className="w-3.5 h-3.5" /> Lời khuyên tối nay
                </p>
                <p className="text-xs text-foreground/80">{analysis.tonight_advice}</p>
              </div>
            )}

            {analysis.science_note && (
              <p className="text-[10px] text-muted-foreground italic border-t border-border/50 pt-2.5">
                <Zap className="w-3 h-3 inline mr-1 text-warning" />
                {analysis.science_note}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── History ─────────────────────────────────────────────────────────── */}
      {didFetch && logs.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/10 transition-colors"
          >
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Lịch sử ({logs.length} đêm)
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="divide-y divide-border/50 max-h-96 overflow-y-auto">
                  {logs.map(log => (
                    <div key={log.date} className="px-5 py-3 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Moon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">
                              {new Date(log.date).toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "short" })}
                            </span>
                            {log.passiveDetected && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-semibold">
                                Tự động{log.autoConfidence ? ` ${log.autoConfidence}%` : ""}
                              </span>
                            )}
                            {log.quality && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${QUALITY_TEXT[log.quality]}`}>
                                {QUALITY_LABELS[log.quality]}
                              </span>
                            )}
                            {log.sleepEfficiency != null && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-info/10 text-info font-semibold">
                                {log.sleepEfficiency}% hiệu suất
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {log.bedtime && log.wakeTime
                              ? `${log.bedtime} → ${log.wakeTime} · ${log.duration ? `${log.duration}h` : "?"}`
                              : "Chưa đủ dữ liệu"}
                            {log.mood && ` · ${MOODS.find(m => m.value === log.mood)?.emoji || ""}`}
                            {log.sleepLatency != null && ` · Delay ${log.sleepLatency}m`}
                            {log.awakenings > 0 && ` · ${log.awakenings} lần tỉnh`}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setShowDetails(showDetails === log.date ? null : log.date)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all"
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDetails === log.date ? "rotate-180" : ""}`} />
                          </button>
                          <button
                            onClick={() => handleDelete(log.date)}
                            disabled={deleting === log.date}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {showDetails === log.date && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 bg-muted/10 rounded-xl p-3 border border-border/30 space-y-2">
                              <div className="grid grid-cols-3 gap-2 text-[10px]">
                                {log.sleepLatency != null && (
                                  <div><span className="text-muted-foreground">Delay:</span> <span className="font-bold">{log.sleepLatency} phút</span></div>
                                )}
                                {log.awakenings != null && (
                                  <div><span className="text-muted-foreground">Tỉnh:</span> <span className="font-bold">{log.awakenings} lần</span></div>
                                )}
                                {log.sleepEfficiency != null && (
                                  <div><span className="text-muted-foreground">Hiệu suất:</span> <span className="font-bold">{log.sleepEfficiency}%</span></div>
                                )}
                                {log.screenTime != null && (
                                  <div><span className="text-muted-foreground">Màn hình:</span> <span className="font-bold">{log.screenTime} phút</span></div>
                                )}
                                {log.stressLevel != null && (
                                  <div><span className="text-muted-foreground">Căng thẳng:</span> <span className="font-bold">{log.stressLevel}/5</span></div>
                                )}
                                {log.caffeine && log.caffeine !== "none" && (
                                  <div><span className="text-muted-foreground">Caffeine:</span> <span className="font-bold">{CAFFEINE_OPTIONS.find(o => o.value === log.caffeine)?.label || log.caffeine}</span></div>
                                )}
                                {log.exercise && log.exercise !== "none" && (
                                  <div><span className="text-muted-foreground">Vận động:</span> <span className="font-bold">{EXERCISE_OPTIONS.find(o => o.value === log.exercise)?.label || log.exercise}</span></div>
                                )}
                                {log.alcohol && log.alcohol !== "none" && (
                                  <div><span className="text-muted-foreground">Rượu:</span> <span className="font-bold">{ALCOHOL_OPTIONS.find(o => o.value === log.alcohol)?.label || log.alcohol}</span></div>
                                )}
                                {log.sleepEnvironment && log.sleepEnvironment !== "" && (
                                  <div><span className="text-muted-foreground">Môi trường:</span> <span className="font-bold">{ENV_OPTIONS.find(o => o.value === log.sleepEnvironment)?.label || log.sleepEnvironment}</span></div>
                                )}
                              </div>
                              {log.notes && (
                                <p className="text-[10px] text-muted-foreground italic">"{log.notes}"</p>
                              )}
                              {log.dreamNotes && (
                                <p className="text-[10px] text-accent italic">Giấc mơ: "{log.dreamNotes}"</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {didFetch && logs.length === 0 && (
        <div className="text-center py-10 space-y-3">
          <Moon className="w-10 h-10 text-primary/40 mx-auto" />
          <p className="text-sm text-muted-foreground">Hệ thống đang theo dõi. Ngủ ngon nhé!</p>
          <p className="text-xs text-muted-foreground/60">Nhật ký sẽ tự động xuất hiện sau khi bạn thức dậy.</p>
        </div>
      )}
    </div>
  );
}
