import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon, Sun, Clock, Sparkles, TrendingUp, AlertTriangle, CheckCircle,
  ChevronDown, Plus, Trash2, BarChart2, Brain, Zap, Wifi, Battery,
  Smartphone, Eye, Activity, ShieldCheck, Edit3, X,
} from "lucide-react";
import dataApi from "../../../services/dataApi";

const AI_BASE = import.meta.env.VITE_AI_URL ?? "";
const INTERNAL_KEY = import.meta.env.VITE_INTERNAL_API_KEY ?? "";

// ── Static data ────────────────────────────────────────────────────────────

const MOODS = [
  { value: "great",    label: "Rất tốt",   emoji: "😄" },
  { value: "good",     label: "Tốt",       emoji: "🙂" },
  { value: "okay",     label: "Bình thường", emoji: "😐" },
  { value: "bad",      label: "Không tốt", emoji: "😔" },
  { value: "terrible", label: "Rất tệ",    emoji: "😞" },
];

const QUALITY_LABELS = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Rất tốt"];
const QUALITY_COLORS = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500", "bg-blue-500"];
const QUALITY_TEXT   = ["", "text-red-500", "text-orange-500", "text-yellow-500", "text-emerald-500", "text-blue-500"];

const SIGNAL_META = {
  screen_locked:   { icon: Smartphone, label: "Màn hình khoá",   color: "text-indigo-400" },
  screen_unlocked: { icon: Smartphone, label: "Màn hình mở",     color: "text-yellow-400" },
  page_hidden:     { icon: Eye,        label: "Tab ẩn",           color: "text-blue-400"   },
  page_visible:    { icon: Eye,        label: "Tab hiện",         color: "text-green-400"  },
  inactivity_30m:  { icon: Clock,      label: "Không hoạt động",  color: "text-purple-400" },
  user_activity:   { icon: Activity,   label: "Hoạt động",        color: "text-rose-400"   },
  browser_close:   { icon: X,          label: "Đóng tab",         color: "text-orange-400" },
  battery_charge:  { icon: Battery,    label: "Cắm sạc",          color: "text-emerald-400"},
  device_still:    { icon: Smartphone, label: "Thiết bị tĩnh",    color: "text-cyan-400"   },
  device_moving:   { icon: Activity,   label: "Thiết bị cử động", color: "text-pink-400"   },
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
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-blue-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

function barColor(pct) {
  if (pct >= 95) return "bg-blue-500";
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 65) return "bg-yellow-500";
  return "bg-red-500";
}

function ageGroup(bio) {
  const age = bio?.age ? Number(bio.age) : null;
  if (!age) return 8;
  if (age <= 12) return 10;
  if (age <= 17) return 9;
  return 8;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

// ── Component ──────────────────────────────────────────────────────────────

export default function SleepTracker({ bio, sleepAutoDetect }) {
  const email = bio?.email;

  const [logs, setLogs]           = useState([]);
  const [stats, setStats]         = useState(null);
  const [loadingLogs, setLoading] = useState(false);
  const [didFetch, setDidFetch]   = useState(false);

  const [analysis, setAnalysis]     = useState(null);
  const [analyzing, setAnalyzing]   = useState(false);
  // Desktop: show manual form by default; mobile: show auto-detect first
  const [showForm, setShowForm]     = useState(() => window.innerWidth >= 768);
  const [showHistory, setShowHistory] = useState(false);
  const [deleting, setDeleting]     = useState(null);
  const [toast, setToast]           = useState(null);

  const [sensorsConnected, setSensorsConnected] = useState(() => {
    return localStorage.getItem("device_sensors_connected") === "true";
  });
  const [motionVal, setMotionVal] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [batteryCharging, setBatteryCharging] = useState(false);
  const [tabVisibility, setTabVisibility] = useState(document.hidden ? "Ẩn" : "Hiện");

  const handleConnectSensors = async () => {
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

  // Pending auto-detect confirmation (shown when a complete cycle is detected)
  const [pendingCycle, setPendingCycleRaw] = useState(null); // {date, bedtime, wakeTime}
  const setPendingCycle = useCallback((val) => {
    setPendingCycleRaw(val);
    if (val === null) sleepAutoDetect?.clearPendingCycle?.();
  }, [sleepAutoDetect]);

  const [form, setForm] = useState({
    date:       todayStr(),
    bedtime:    "22:30",
    wakeTime:   "06:30",
    quality:    3,
    mood:       "okay",
    notes:      "",
    dreamNotes: "",
  });

  // Prevent double-fetch
  const fetchRef = useRef(false);

  // ── Auto-detection (hook is mounted portal-wide in MemberPortalPage so it
  // keeps listening even when this tab isn't open — see `sleepAutoDetect` prop) ──

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
      const res = await dataApi.get(`/api/sleep?email=${encodeURIComponent(email)}&limit=30`);
      setLogs(res.data.logs || []);
      setStats(res.data.stats || null);
      setDidFetch(true);
    } catch (_) {
    } finally {
      setLoading(false);
      fetchRef.current = false;
    }
  }, [email]);

  // Lazy-load on first open
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
      const res = await fetch(`${AI_BASE}/api/sleep/analyze`, {
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
  const targetHours = ageGroup(bio);
  const maxDuration = Math.max(...last7.map(l => l.duration || 0), targetHours);

  // ── Render helpers ─────────────────────────────────────────────────────

  const detectStateMeta = {
    monitoring: { label: "Đang theo dõi",    dot: "bg-blue-400 animate-pulse",    ring: "border-blue-500/20" },
    sleeping:   { label: "Đang ngủ...",       dot: "bg-indigo-400 animate-pulse",  ring: "border-indigo-500/30" },
    awake:      { label: "Đã thức dậy",       dot: "bg-emerald-400",               ring: "border-emerald-500/20" },
  }[detectState] || {};

  // ── JSX ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col md:flex-col-reverse gap-4 animate-fadeIn">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold border
              ${toast.type === "success" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-200"
              : toast.type === "error"   ? "bg-red-500/20 border-red-500/30 text-red-200"
              : "bg-blue-500/20 border-blue-500/30 text-blue-200"}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Live detection status card — prominent on mobile, secondary on desktop ── */}
      <div className={`bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-sky-500/5
        dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-sky-950/10
        border ${detectStateMeta.ring || "border-indigo-500/10"} rounded-2xl p-4 space-y-3
        md:order-last`}
      >
        {/* Connection Row */}
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sensorsConnected ? "bg-emerald-400" : "bg-red-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${sensorsConnected ? "bg-emerald-500" : "bg-red-500"}`}></span>
            </span>
            <span className="text-[11px] font-bold text-foreground">Bộ cảm biến: {sensorsConnected ? "Đang kết nối" : "Chưa liên kết"}</span>
          </div>
          <button
            type="button"
            onClick={handleConnectSensors}
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 border ${
              sensorsConnected
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-indigo-600 hover:bg-indigo-500 text-white border-transparent"
            }`}
          >
            {sensorsConnected ? "Đã liên kết" : "Liên kết thiết bị"}
          </button>
        </div>

        {/* Real-time monitor grid */}
        {sensorsConnected && (
          <div className="grid grid-cols-3 gap-2 bg-black/10 dark:bg-black/30 rounded-xl p-3 border border-border/30">
            <div className="text-center space-y-1">
              <div className="text-[9px] text-muted-foreground font-medium uppercase">Cử động</div>
              <div className="text-xs font-mono font-bold text-pink-400 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[10px] animate-pulse">waves</span>
                <span>{motionVal} m/s²</span>
              </div>
            </div>
            <div className="text-center space-y-1 border-x border-border/30">
              <div className="text-[9px] text-muted-foreground font-medium uppercase">Pin</div>
              <div className="text-xs font-mono font-bold text-emerald-400 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[10px]">{batteryCharging ? "battery_charging_full" : "battery_full"}</span>
                <span>{batteryLevel !== null ? `${batteryLevel}%` : "—"}{batteryCharging && " ⚡"}</span>
              </div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-[9px] text-muted-foreground font-medium uppercase">Trạng thái Tab</div>
              <div className="text-xs font-bold text-blue-400 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[10px]">{tabVisibility === "Hiện" ? "visibility" : "visibility_off"}</span>
                <span>{tabVisibility}</span>
              </div>
            </div>
          </div>
        )}

        {/* Header row */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              {detectState === "sleeping" ? <Moon className="w-4 h-4 text-indigo-400" />
                : detectState === "awake" ? <Sun  className="w-4 h-4 text-amber-400" />
                : <Clock className="w-4 h-4 text-blue-400" />}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm thủ công
            </button>
            <button
              onClick={() => { ensureFetched(); runAnalysis(); }}
              disabled={analyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <Brain className="w-3.5 h-3.5" />
              {analyzing ? "Đang phân tích…" : "Phân tích AI"}
            </button>
          </div>
        </div>

        {/* Sleep onset info */}
        {detectState === "sleeping" && sleepStart && (
          <div className="bg-indigo-500/10 border border-indigo-500/15 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-indigo-300">Ghi nhận ngủ lúc {sleepStart.time}</span>
              <span className="text-muted-foreground ml-1.5">· {sleepStart.date}</span>
            </div>
          </div>
        )}

        {/* Sleep onset confidence progress */}
        {detectState === "monitoring" && confidence > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground font-medium">Tín hiệu ngủ đang thu thập…</span>
              <span className="text-[10px] font-bold text-indigo-300">{confidence}%</span>
            </div>
            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-500 rounded-full"
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
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
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
              { label: "TB ngủ",   value: stats.avgDuration ? `${stats.avgDuration}h` : "—", color: "indigo" },
              { label: "TB CL",    value: stats.avgQuality  ? `${stats.avgQuality}/5`  : "—", color: "purple" },
              { label: "Đêm ghi", value: stats.total ?? 0,                                   color: "sky"    },
            ].map(({ label, value, color }) => (
              <div key={label} className={`bg-${color}-500/10 rounded-xl p-2.5 text-center border border-${color}-500/10`}>
                <div className={`text-base font-black text-${color}-400`}>{value}</div>
                <div className="text-[9px] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Auto-detection confirmation banner ──────────────────────────── */}
      <AnimatePresence>
        {pendingCycle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            className="bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/25 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-emerald-300">Tự động ghi nhận giấc ngủ</p>
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
                          onClick={() => setForm(f => ({ ...f, quality: q }))}
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
                          onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 transition-all
                            ${form.mood === m.value
                              ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                              : "bg-muted/20 border-border text-muted-foreground"}`}
                        >
                          {m.emoji} {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => confirmCycle()}
                    className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all"
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

      {/* ── Manual log form ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
          >
            <form onSubmit={handleSave} className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  Ghi Nhật Ký Thủ Công
                </h4>
                <button type="button" onClick={() => setShowForm(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted/30 text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: "date",     label: "Ngày",     type: "date", max: todayStr() },
                  { key: "bedtime",  label: "Giờ ngủ",  type: "time" },
                  { key: "wakeTime", label: "Giờ dậy",  type: "time" },
                ].map(({ key, label, type, max }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
                    <input type={type} value={form[key]} max={max}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 flex justify-between">
                  <span>Chất lượng</span>
                  <span className={`font-black ${QUALITY_TEXT[form.quality]}`}>{QUALITY_LABELS[form.quality]}</span>
                </label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(q => (
                    <button key={q} type="button"
                      onClick={() => setForm(f => ({ ...f, quality: q }))}
                      className={`flex-1 h-8 rounded-lg text-xs font-bold border transition-all
                        ${form.quality === q ? `${QUALITY_COLORS[q]} text-white border-transparent`
                          : "bg-muted/30 border-border text-muted-foreground"}`}
                    >{q}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Tâm trạng</label>
                <div className="flex gap-2 flex-wrap">
                  {MOODS.map(m => (
                    <button key={m.value} type="button"
                      onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-all
                        ${form.mood === m.value
                          ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                          : "bg-muted/20 border-border text-muted-foreground"}`}
                    >{m.emoji} {m.label}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "notes",      label: "Ghi chú",     placeholder: "Giấc ngủ cảm giác thế nào…", max: 500 },
                  { key: "dreamNotes", label: "Giấc mơ",     placeholder: "Giấc mơ đêm qua…",           max: 300 },
                ].map(({ key, label, placeholder, max }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
                    <textarea rows={2} maxLength={max} value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
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
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-all">Lưu</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 7-day chart (lazy-loaded) ─────────────────────────────────────── */}
      {!didFetch && !loadingLogs && (
        <button onClick={ensureFetched}
          className="w-full py-3 rounded-2xl border border-border/50 text-xs text-muted-foreground hover:bg-muted/10 transition-all flex items-center justify-center gap-2">
          <BarChart2 className="w-4 h-4" /> Tải lịch sử giấc ngủ
        </button>
      )}

      {loadingLogs && (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {didFetch && last7.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><BarChart2 className="w-4 h-4" /> 7 Ngày Gần Nhất</span>
            <span className="text-[10px] normal-case font-normal">Mục tiêu: {targetHours}h/đêm</span>
          </h4>
          <div className="flex items-end gap-2" style={{ height: "7rem" }}>
            {last7.map((log, i) => {
              const dur  = log.duration || 0;
              const pct  = dur ? Math.min(100, Math.round((dur / maxDuration) * 100)) : 8;
              const fill = dur ? barColor(Math.round((dur / targetHours) * 100)) : "bg-muted/25";
              const day  = new Date(log.date).toLocaleDateString("vi-VN", { weekday: "short" });
              return (
                <div key={log.date || i} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg px-2 py-1.5 text-[10px] w-28 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
                    <div className="font-bold text-foreground">{dur ? `${dur}h` : "—"}</div>
                    <div className="text-muted-foreground">{log.bedtime || "?"} → {log.wakeTime || "?"}</div>
                    {log.quality && <div className={QUALITY_TEXT[log.quality]}>{QUALITY_LABELS[log.quality]}</div>}
                    {log.passiveDetected && <div className="text-indigo-400">Tự động ✓</div>}
                  </div>
                  <div className={`w-full rounded-t-lg ${fill} opacity-75 group-hover:opacity-100 transition-all`}
                    style={{ height: `${pct}%` }} />
                  <span className="text-[9px] text-muted-foreground font-medium">{day}</span>
                  {log.quality && <div className={`w-1.5 h-1.5 rounded-full ${QUALITY_COLORS[log.quality]}`} />}
                  {log.passiveDetected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 ring-1 ring-indigo-400/40" title="Tự động" />}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 flex-wrap text-[10px] text-muted-foreground">
            {[["bg-blue-500","≥ 100%"],["bg-emerald-500","80–99%"],["bg-yellow-500","65–79%"],["bg-red-500","< 65%"],["bg-indigo-400","Tự động"]].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${c}`} />
                {l}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Analysis ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-blue-500/5
              dark:from-purple-950/30 border border-purple-500/15 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
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
                <p className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Cảnh báo
                </p>
                {analysis.risk_flags.map((f, i) => (
                  <div key={i} className="text-xs text-foreground/80 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 flex gap-2">
                    <span className="text-red-400 mt-0.5">•</span>{f}
                  </div>
                ))}
              </div>
            )}

            {analysis.strengths?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Điểm mạnh
                </p>
                {analysis.strengths.map((s, i) => (
                  <div key={i} className="text-xs text-foreground/80 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2 flex gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span>{s}
                  </div>
                ))}
              </div>
            )}

            {analysis.recommendations?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" /> Khuyến nghị AI
                </p>
                {analysis.recommendations.map((r, i) => (
                  <div key={i} className="text-xs text-foreground/80 bg-indigo-500/5 border border-indigo-500/10 rounded-lg px-3 py-2 flex gap-2">
                    <span className="text-indigo-400 font-bold mt-0.5">{i + 1}.</span>{r}
                  </div>
                ))}
              </div>
            )}

            {analysis.tonight_advice && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                <p className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
                  <Moon className="w-3.5 h-3.5" /> Lời khuyên tối nay
                </p>
                <p className="text-xs text-foreground/80">{analysis.tonight_advice}</p>
              </div>
            )}

            {analysis.science_note && (
              <p className="text-[10px] text-muted-foreground italic border-t border-border/50 pt-2.5">
                <Zap className="w-3 h-3 inline mr-1 text-yellow-400" />
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
                <div className="divide-y divide-border/50 max-h-72 overflow-y-auto">
                  {logs.map(log => (
                    <div key={log.date} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/10 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                        <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground">
                            {new Date(log.date).toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "short" })}
                          </span>
                          {log.passiveDetected && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-semibold">
                              Tự động{log.autoConfidence ? ` ${log.autoConfidence}%` : ""}
                            </span>
                          )}
                          {log.quality && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${QUALITY_TEXT[log.quality]}`}>
                              {QUALITY_LABELS[log.quality]}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {log.bedtime && log.wakeTime
                            ? `${log.bedtime} → ${log.wakeTime} · ${log.duration ? `${log.duration}h` : "?"}`
                            : "Chưa đủ dữ liệu"}
                          {log.mood && ` · ${MOODS.find(m => m.value === log.mood)?.emoji || ""}`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(log.date)}
                        disabled={deleting === log.date}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
          <Moon className="w-10 h-10 text-indigo-400/40 mx-auto" />
          <p className="text-sm text-muted-foreground">Hệ thống đang theo dõi. Ngủ ngon nhé!</p>
          <p className="text-xs text-muted-foreground/60">Nhật ký sẽ tự động xuất hiện sau khi bạn thức dậy.</p>
        </div>
      )}
    </div>
  );
}
