import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Unlock, BookOpen, Wind, Brain, ArrowLeft,
  Pencil, Dumbbell, Users, Flame, CheckCircle2, Circle,
  Timer, ChevronRight, Sparkles, TrendingUp, FileText, CalendarCheck, Printer,
  Headphones, Volume2, Award, MessageSquare, ClipboardList
} from "lucide-react";
import confetti from "canvas-confetti";
import BreathingTherapy from "./BreathingTherapy";
import ReadingTherapy from "./ReadingTherapy";
import MeditationTherapy from "./MeditationTherapy";
import DepressionCbtTherapy from "./DepressionCbtTherapy";
import JoyCoinBadge from "../../shared/JoyCoinBadge";
import { useJoyStore } from "../../../stores/joyStore";
import { getAiUrl } from "../../../services/api";

const apiBase = import.meta.env.VITE_API_URL || "/api";
const AI_BASE = getAiUrl();
const INTERNAL_KEY = import.meta.env.VITE_INTERNAL_API_KEY ?? "";
const UNLOCK_COST = 150;

function ExpressiveWritingPanel({ onBack, onComplete }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Bài viết tự do giúp bạn ghi lại cảm xúc trong vài phút để hạ nhịp căng thẳng.
      </p>
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm font-semibold">Quay lại</button>
        <button onClick={onComplete} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Hoàn thành</button>
      </div>
    </div>
  );
}

function LightExercisePanel({ onBack, onComplete }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Vận động nhẹ trong một vài phút để cơ thể bớt căng và đầu óc tỉnh hơn.
      </p>
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm font-semibold">Quay lại</button>
        <button onClick={onComplete} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Hoàn thành</button>
      </div>
    </div>
  );
}

function SocialConnectionPanel({ onBack, onComplete }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Kết nối với người thân hoặc bạn bè để giảm cảm giác một mình.
      </p>
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm font-semibold">Quay lại</button>
        <button onClick={onComplete} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Hoàn thành</button>
      </div>
    </div>
  );
}

// ─── Inline mini-panels ──────────────────────────────────────────────────────

function SoundscapePanel({ onBack, onComplete }) {
  const [playing, setPlaying] = useState({
    rain: false,
    ocean: false,
    campfire: false,
    whiteNoise: false
  });
  
  const [volumes, setVolumes] = useState({
    rain: 0.5,
    ocean: 0.5,
    campfire: 0.5,
    whiteNoise: 0.5
  });

  const audiosRef = useRef({
    rain: new Audio("/audio/rain.mp3"),
    ocean: new Audio("/audio/sea.mp3"),
    campfire: new Audio("/audio/campfire.mp3"),
    whiteNoise: new Audio("/audio/ambient.mp3")
  });

  useEffect(() => {
    Object.keys(audiosRef.current).forEach(key => {
      audiosRef.current[key].loop = true;
    });
    
    return () => {
      Object.keys(audiosRef.current).forEach(key => {
        audiosRef.current[key].pause();
      });
    };
  }, []);

  useEffect(() => {
    Object.keys(audiosRef.current).forEach(key => {
      audiosRef.current[key].volume = volumes[key];
    });
  }, [volumes]);

  const toggleSound = (key) => {
    const audio = audiosRef.current[key];
    if (playing[key]) {
      audio.pause();
      setPlaying(p => ({ ...p, [key]: false }));
    } else {
      audio.play().catch(e => console.error("Audio play failed:", e));
      setPlaying(p => ({ ...p, [key]: true }));
    }
  };

  const isAnyPlaying = Object.values(playing).some(v => v);

  return (
    <div className="space-y-5">
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold leading-relaxed">
        Tạo không gian thư giãn của riêng bạn. Cậu có thể bật và trộn lẫn nhiều âm thanh thiên nhiên cùng một lúc, tùy chỉnh âm lượng của từng loại.
      </p>

      {/* Visualizer animation */}
      <div className="h-16 bg-black/10 dark:bg-black/40 rounded-2xl flex items-center justify-center gap-1 overflow-hidden px-4 border border-border/30 relative">
        {isAnyPlaying ? (
          <div className="flex items-end justify-center gap-1 h-8 w-full">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-indigo-500 rounded-full animate-bounce"
                style={{
                  height: "28px",
                  animationDuration: `${0.6 + Math.random() * 0.4}s`,
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
          </div>
        ) : (
          <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
            <Headphones className="w-3.5 h-3.5" /> Bật âm thanh để bắt đầu thư giãn
          </span>
        )}
      </div>

      <div className="space-y-3">
        {[
          { key: "rain", label: "Mưa Rơi", icon: "cloud_rain", desc: "Tiếng mưa rơi trên mái lá" },
          { key: "ocean", label: "Sóng Biển", icon: "waves", desc: "Rì rào sóng vỗ bờ cát bình yên" },
          { key: "campfire", label: "Lửa Trại", icon: "local_fire_department", desc: "Tiếng lửa trại bập bùng, tí tách" },
          { key: "whiteNoise", label: "Nhạc Tĩnh Tâm", icon: "spa", desc: "Nhạc thiền định thư giãn nhịp sóng não" }
        ].map(item => (
          <div key={item.key} className="bg-white/50 dark:bg-zinc-800/40 rounded-2xl p-3 flex flex-col gap-2 border border-zinc-200 dark:border-zinc-700/50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-lg text-indigo-400 shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-zinc-800 dark:text-zinc-100">{item.label}</p>
                  <p className="text-[9px] text-zinc-400 truncate">{item.desc}</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => toggleSound(item.key)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  playing[item.key]
                    ? "bg-indigo-500 text-white"
                    : "bg-zinc-150 dark:bg-zinc-850 text-zinc-500 hover:bg-zinc-200"
                }`}
              >
                <span className="material-symbols-outlined text-sm">{playing[item.key] ? "pause" : "play_arrow"}</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2 px-1">
              <Volume2 className="w-3 h-3 text-zinc-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volumes[item.key]}
                onChange={e => setVolumes(v => ({ ...v, [item.key]: parseFloat(e.target.value) }))}
                className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-[8px] font-mono text-zinc-400 w-5 text-right">{Math.round(volumes[item.key] * 100)}%</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          Object.keys(audiosRef.current).forEach(key => {
            audiosRef.current[key].pause();
          });
          onComplete();
        }}
        className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
      >
        Lưu hoạt động & dừng phát
      </button>
    </div>
  );
}

const MUSCLE_STEPS = [
  { part: "Bàn tay & cẳng tay", cue: "Siết chặt nắm đấm, giữ…" },
  { part: "Bắp tay", cue: "Gập khuỷu tay, căng bắp tay…" },
  { part: "Vai & cổ", cue: "Nhún vai lên tai, giữ…" },
  { part: "Mặt & trán", cue: "Nhíu mày, nheo mắt, giữ…" },
  { part: "Bụng", cue: "Hóp bụng thật chặt, giữ…" },
  { part: "Đùi & mông", cue: "Siết chặt cơ đùi, giữ…" },
  { part: "Bàn chân", cue: "Cuộn ngón chân xuống, giữ…" },
];

function MuscleRelaxPanel({ onBack, onComplete }) {
  const [step, setStep] = useState(-1); // -1 = intro
  const [phase, setPhase] = useState("tense"); // tense | relax
  const [tick, setTick] = useState(0);
  const timerRef = useRef(null);

  const TENSE_SEC = 5;
  const RELAX_SEC = 8;

  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const startStep = (idx) => {
    clearTimer();
    setStep(idx);
    setPhase("tense");
    setTick(TENSE_SEC);
    timerRef.current = setInterval(() => {
      setTick(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase("relax");
          setTick(RELAX_SEC);
          timerRef.current = setInterval(() => {
            setTick(r => {
              if (r <= 1) {
                clearInterval(timerRef.current);
                const next = idx + 1;
                if (next >= MUSCLE_STEPS.length) {
                  onComplete();
                } else {
                  startStep(next);
                }
                return 0;
              }
              return r - 1;
            });
          }, 1000);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearTimer(), []);

  if (step === -1) {
    return (
      <div className="space-y-4">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold leading-relaxed">
          Kỹ thuật PMR giúp giảm lo âu bằng cách căng — rồi thả lỏng từng nhóm cơ. Mỗi bước: căng 5 giây, thả 8 giây. Tổng ~7 phút.
        </p>
        <ul className="grid grid-cols-2 gap-2">
          {MUSCLE_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 bg-teal-500/5 border border-teal-500/10 rounded-xl px-3 py-2">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center text-[9px] font-black">{i + 1}</span>
              <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{s.part}</span>
            </div>
          ))}
        </ul>
        <button onClick={() => startStep(0)} className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95">
          Bắt đầu luyện tập
        </button>
      </div>
    );
  }

  const current = MUSCLE_STEPS[step];
  const isTense = phase === "tense";

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex gap-1.5">
        {MUSCLE_STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i < step ? "bg-teal-500" : i === step ? "bg-teal-400" : "bg-zinc-200 dark:bg-zinc-700"}`} />
        ))}
      </div>
      <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-700 ${isTense ? "border-red-400 bg-red-400/10 scale-110" : "border-teal-400 bg-teal-400/10 scale-100"}`}>
        <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{tick}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{isTense ? "Căng" : "Thả"}</span>
      </div>
      <div className="text-center space-y-1">
        <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{current.part}</p>
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">{isTense ? current.cue : "Thở ra…  thả lỏng hoàn toàn…"}</p>
      </div>
      <p className="text-[9px] text-zinc-400 font-bold">Bước {step + 1} / {MUSCLE_STEPS.length}</p>
    </div>
  );
}

// ─── Lộ Trình Hoạt Động Cá Nhân Hoá (paid, merges writing+exercise+social) ──
function ActionPlanPanel({ bio, historyLogs, onBack, onComplete }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedDays, setCompletedDays] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`${AI_BASE}/api/ai/therapy/action-plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Internal-Key": INTERNAL_KEY },
          body: JSON.stringify({ historyLogs, bio }),
        });
        const data = await r.json();
        if (cancelled) return;
        if (data.error || !data.days) throw new Error(data.error || "Không thể tạo lộ trình lúc này.");
        setPlan(data);
      } catch {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pillarIcon = { writing: Pencil, movement: Dumbbell, social: Users };
  const pillarColor = { writing: "text-pink-500 bg-pink-500/10", movement: "text-emerald-500 bg-emerald-500/10", social: "text-blue-500 bg-blue-500/10" };

  const toggleDay = (day) => {
    const next = new Set(completedDays);
    if (next.has(day)) next.delete(day); else next.add(day);
    setCompletedDays(next);
  };

  if (loading) {
    return <div className="py-10 text-center text-[11px] text-zinc-400 font-bold">Đang tạo lộ trình cá nhân hoá cho cậu...</div>;
  }
  if (error || !plan) {
    return (
      <div className="py-6 text-center space-y-2">
        <p className="text-[11px] text-rose-500 font-bold">{error || "Có lỗi xảy ra."}</p>
        <button onClick={onBack} className="text-[10px] text-zinc-400 underline">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold leading-relaxed">{plan.week_theme}</p>
      {(plan.days || []).map((d) => {
        const Icon = pillarIcon[d.pillar] || Sparkles;
        const done = completedDays.has(d.day);
        return (
          <button
            key={d.day}
            onClick={() => toggleDay(d.day)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] ${done ? "bg-pink-500/10 border-pink-500/30" : "bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pillarColor[d.pillar] || "text-zinc-500 bg-zinc-200/60"}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Ngày {d.day}</p>
              <p className={`text-[11px] font-black ${done ? "text-pink-600 dark:text-pink-400 line-through" : "text-zinc-900 dark:text-zinc-100"}`}>{d.title}</p>
              <p className="text-[9.5px] text-zinc-500 font-bold leading-snug">{d.action}</p>
            </div>
            {done ? <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0" /> : <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" />}
          </button>
        );
      })}
      {completedDays.size > 0 && (
        <button
          onClick={() => onComplete()}
          className="w-full py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
        >
          Lưu tiến độ ({completedDays.size}/7 ngày)
        </button>
      )}
    </div>
  );
}



// ─── Báo Cáo Tâm Lý Chuyên Sâu (paid, generates a printable clinical-style report) ──
function DeepReportPanel({ bio, historyLogs, chatMessages, onBack }) {
  const { t } = useTranslation();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`${AI_BASE}/api/ai/therapy/deep-report`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Internal-Key": INTERNAL_KEY },
          body: JSON.stringify({ historyLogs, chatMessages, bio }),
        });
        const data = await r.json();
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        setReport(data);
      } catch {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div className="space-y-5 text-center max-w-md mx-auto animate-scaleUp">
      <div className="flex items-center justify-between border-b pb-2 border-zinc-200/50">
        <button type="button" onClick={onBack} className="text-zinc-450 text-[10px] font-black uppercase tracking-wider hover:text-zinc-700">
          Quay lại thẻ
        </button>
        <span className="text-[9.5px] font-black uppercase text-cyan-500">Báo cáo sức khỏe</span>
      </div>
      <div className="py-10 text-[11px] text-zinc-400 font-bold">Đang tổng hợp báo cáo...</div>
    </div>
  );

  if (error || !report) {
    return (
      <div className="space-y-5 text-center max-w-md mx-auto animate-scaleUp">
        <div className="flex items-center justify-between border-b pb-2 border-zinc-200/50">
          <button type="button" onClick={onBack} className="text-zinc-450 text-[10px] font-black uppercase tracking-wider hover:text-zinc-700">
            Quay lại thẻ
          </button>
          <span className="text-[9.5px] font-black uppercase text-cyan-500">Báo cáo sức khỏe</span>
        </div>
        <p className="text-[11px] text-rose-500 font-bold py-6">{error || "Có lỗi xảy ra."}</p>
      </div>
    );
  }

  const Section = ({ title, children }) => (
    <div className="space-y-1 text-left">
      <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">{title}</p>
      <div className="text-[11px] text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">{children}</div>
    </div>
  );

  return (
    <div className="space-y-5 text-center max-w-md mx-auto animate-scaleUp">
      <div className="flex items-center justify-between border-b pb-2 border-zinc-200/50">
        <button type="button" onClick={onBack} className="text-zinc-450 text-[10px] font-black uppercase tracking-wider hover:text-zinc-700">
          Quay lại thẻ
        </button>
        <span className="text-[9.5px] font-black uppercase text-cyan-500">Báo cáo sức khỏe</span>
      </div>

      <div className="space-y-4">
        <div id="deep-report-print" className="space-y-4 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-700">
          <Section title={`Báo cáo ngày ${report.report_date || ""}`}>{report.overview}</Section>
          <Section title="Xu hướng tâm trạng">{report.mood_trend_summary}</Section>
          <Section title="Tổng hợp test lâm sàng">{report.clinical_test_summary}</Section>
          {report.risk_indicators?.length > 0 && (
            <Section title="Chỉ số rủi ro">
              <ul className="list-disc pl-4 space-y-0.5">{report.risk_indicators.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </Section>
          )}
          {report.strengths_and_progress?.length > 0 && (
            <Section title="Điểm tích cực / tiến bộ">
              <ul className="list-disc pl-4 space-y-0.5">{report.strengths_and_progress.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </Section>
          )}
          {report.recommendations_for_specialist?.length > 0 && (
            <Section title="Gợi ý cho chuyên viên">
              <ul className="list-disc pl-4 space-y-0.5">{report.recommendations_for_specialist.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </Section>
          )}
          <p className="text-[9px] text-zinc-400 italic pt-2 border-t border-zinc-200 dark:border-zinc-700">{report.disclaimer}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
        >
          <Printer className="w-4 h-4" /> In / Lưu PDF để gửi chuyên viên
        </button>
      </div>
    </div>
  );
}

// ─── Card definitions ─────────────────────────────────────────────────────────

const ALL_METHODS = [
  { id:"breath",     Icon: Wind,      name:"Hít Thở 4-7-8",    desc:"Làm dịu lo âu, nhịp tim nhanh tức thì (kèm Thư Giãn Cơ)", category:"Thở",   duration:"5 ph",     gradient:"from-amber-500/10 to-amber-500/5",    border:"border-amber-500/20 dark:border-amber-400/15",    badge:"bg-amber-500/10 text-amber-600 dark:text-amber-400",     iconBg:"bg-amber-500/15 text-amber-600 dark:text-amber-400",    btn:"bg-amber-500 hover:bg-amber-600",  lockKey:"breathing",  joyLockable:true  },
  { id:"soundscape", Icon: Headphones,name:"Âm Thanh Thiên Nhiên", desc:"Tự tạo không gian thư giãn với tiếng mưa, sóng biển, lửa trại", category:"Thư giãn", duration:"Tự do", gradient:"from-emerald-500/10 to-emerald-500/5", border:"border-emerald-500/20 dark:border-emerald-400/15", badge:"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", iconBg:"bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", btn:"bg-emerald-500 hover:bg-emerald-600", lockKey:"soundscape", joyLockable:true },
  { id:"reading",    Icon: BookOpen,  name:"Đọc Truyện & Giải Mã Giấc Mơ AI", desc:"AI viết & kể truyện trị liệu, giải mã điềm báo giấc mơ", category:"AI · Đọc", duration:"10 ph", gradient:"from-indigo-500/10 to-indigo-500/5",  border:"border-indigo-500/20 dark:border-indigo-400/15",  badge:"bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",  iconBg:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-400", btn:"bg-indigo-500 hover:bg-indigo-600",  lockKey:"reading",    joyLockable:true  },
  { id:"meditation", Icon: Flame,     name:"Thiền Định Giọng Nói AI", desc:"Giọng dẫn thiền do AI soạn riêng theo mood hiện tại của bạn",  category:"AI · Thiền", duration:"10–20 ph", gradient:"from-teal-500/10 to-teal-500/5",      border:"border-teal-500/20 dark:border-teal-400/15",      badge:"bg-teal-500/10 text-teal-600 dark:text-teal-400",        iconBg:"bg-teal-500/15 text-teal-600 dark:text-teal-400",       btn:"bg-teal-500 hover:bg-teal-600",    lockKey:"meditation", joyLockable:true  },
  { id:"depression", Icon: Brain,     name:"CBT Worksheet & Lộ Trình", desc:"AI phân tích lịch sử chat, soạn bảng ghi suy nghĩ và lộ trình riêng", category:"AI · Nhận thức", duration:"15 ph", gradient:"from-rose-500/10 to-rose-500/5",      border:"border-rose-500/20 dark:border-rose-400/15",      badge:"bg-rose-500/10 text-rose-600 dark:text-rose-400",        iconBg:"bg-rose-500/15 text-rose-600 dark:text-rose-400",       btn:"bg-rose-500 hover:bg-rose-600",    lockKey:"depression", joyLockable:true  },
  { id:"deep_report", Icon: FileText, name:"Báo Cáo Sức Khỏe Tâm Lý Chuyên Sâu", desc:"Hồ sơ tổng hợp AI soạn để chia sẻ với chuyên gia thật, in/lưu PDF", category:"AI · Báo cáo", duration:"5 ph", gradient:"from-cyan-500/10 to-cyan-500/5", border:"border-cyan-500/20 dark:border-cyan-400/15", badge:"bg-cyan-500/10 text-cyan-600 dark:text-cyan-400", iconBg:"bg-cyan-500/15 text-cyan-600 dark:text-cyan-400", btn:"bg-cyan-500 hover:bg-cyan-600", lockKey:"deep_report", joyLockable:true },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function TherapyTab({
  onNavigateToTab,
  bio,
  historyLogs = [],
  chatMessages = [],
  claimedChallengesToday = [],
  onClaimChallenge,
  onUpdateCompanionState,
  healingActive,
  showToast,
  onBioUpdate,
  initialMethod
}) {
  const [activePanel, setActivePanel] = useState(initialMethod || null);
  const [unlockedFeatures, setUnlockedFeatures] = useState(bio?.unlockedCompanionFeatures || []);
  const [unlockingId, setUnlockingId] = useState(null);
  // Invoice shown right after a successful JOY-for-therapy exchange — mirrors
  // the receipt UX of the JOY transfer flow (MemberJoyTab.jsx), since the
  // unlock toast alone left no on-screen record of the transaction.
  const [unlockReceipt, setUnlockReceipt] = useState(null);
  const joyBalance = useJoyStore(s => s.balance);
  const fetchJoyBalance = useJoyStore(s => s.fetchBalance);

  useEffect(() => {
    if (bio?.unlockedCompanionFeatures) setUnlockedFeatures(bio.unlockedCompanionFeatures);
  }, [bio?.unlockedCompanionFeatures]);

  // --- Daily Challenges State & Logic ---
  const todayStr = new Date().toISOString().slice(0, 10);
  const isLogToday = (logDate) => {
    if (!logDate) return false;
    return new Date(logDate).toISOString().slice(0, 10) === todayStr;
  };

  const { breathCompleted, userMessagesCount, chatCompleted, assessmentCompleted } = React.useMemo(() => {
    const breath = (historyLogs || []).some(log => 
      log.type === "therapy_activity" && 
      (log.name?.toLowerCase().includes("hít thở") || log.name?.toLowerCase().includes("thư giãn cơ")) &&
      isLogToday(log.date)
    );

    const userCount = (chatMessages || []).filter(msg => 
      msg.sender === "user" && 
      isLogToday(msg.time)
    ).length;

    const assessment = (historyLogs || []).some(log => 
      (log.type === "clinical_test" || log.test) && 
      isLogToday(log.date)
    );

    return {
      breathCompleted: breath,
      userMessagesCount: userCount,
      chatCompleted: userCount >= 3,
      assessmentCompleted: assessment
    };
  }, [historyLogs, chatMessages, todayStr]);

  // Challenge claims list
  const claims = claimedChallengesToday || [];

  const challenges = [
    {
      id: "breath",
      title: "Hít thở 4-7-8 / Tập Cơ",
      desc: "Luyện thở hoặc thư giãn cơ sâu",
      reward: 45,
      completed: breathCompleted,
      progressText: breathCompleted ? "1/1" : "0/1",
      progressPercent: breathCompleted ? 100 : 0,
      claimed: claims.includes("breath"),
      icon: Wind,
      color: "from-amber-500/20 to-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
    },
    {
      id: "chat",
      title: "Tâm sự cùng Companion AI",
      desc: "Gửi ít nhất 3 tin nhắn hôm nay",
      reward: 45,
      completed: chatCompleted,
      progressText: `${Math.min(3, userMessagesCount)}/3`,
      progressPercent: Math.min(100, Math.round((userMessagesCount / 3) * 100)),
      claimed: claims.includes("chat"),
      icon: MessageSquare,
      color: "from-indigo-500/20 to-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
    },
    {
      id: "assessment",
      title: "Làm test đánh giá tâm lý",
      desc: "Hoàn thành 1 bài test lâm sàng",
      reward: 60,
      completed: assessmentCompleted,
      progressText: assessmentCompleted ? "1/1" : "0/1",
      progressPercent: assessmentCompleted ? 100 : 0,
      claimed: claims.includes("assessment"),
      icon: ClipboardList,
      color: "from-teal-500/20 to-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30"
    }
  ];

  const totalCompleted = challenges.filter(c => c.completed).length;
  const [claimingId, setClaimingId] = useState(null);

  const handleClaimReward = async (id) => {
    if (claimingId) return;
    setClaimingId(id);
    try {
      const res = await onClaimChallenge?.(id);
      if (res && res.success) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#fbbf24", "#f59e0b", "#34d399", "#38bdf8", "#ec4899"]
        });
        // refresh global balance
        if (bio?.email) {
          fetchJoyBalance(bio.email);
        }
      }
    } catch (err) {
      // already handles error showing toast
    } finally {
      setClaimingId(null);
    }
  };

  const unlocked = {
    reading: unlockedFeatures.includes("reading"),
    meditation: unlockedFeatures.includes("meditation"),
    depression: unlockedFeatures.includes("depression"),
    deep_report: unlockedFeatures.includes("deep_report"),
    breathing: unlockedFeatures.includes("breathing"),
    soundscape: unlockedFeatures.includes("soundscape"),
    basic: true,       // Viết Tự Do / Vận Động Nhẹ / Kết Nối Xã Hội — always free, no clinical data required
  };

  const isUnlocked = (method) => unlocked[method.lockKey] ?? false;

  const handleUnlockFeature = async (method) => {
    if (!bio?.email || unlockingId) return;
    if (joyBalance < UNLOCK_COST) {
      showToast?.(`Bạn cần ${UNLOCK_COST} JOY để mở khoá tính năng này. Số dư hiện tại: ${joyBalance} JOY.`, "warning");
      return;
    }
    setUnlockingId(method.id);
    try {
      const r = await fetch(`${apiBase}/companion/unlock-feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: bio.email, feature: method.lockKey }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Không thể mở khoá tính năng này.");
      setUnlockedFeatures(data.unlockedFeatures || []);
      onBioUpdate?.({ unlockedCompanionFeatures: data.unlockedFeatures || [] });
      fetchJoyBalance(bio.email);
      showToast?.(`Đã mở khoá "${method.name}"!`, "success");
      setUnlockReceipt({ name: method.name, cost: UNLOCK_COST, balanceAfter: data.balance, time: new Date() });
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setUnlockingId(null);
    }
  };

  // ── Stats ──
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekActivities = historyLogs.filter(l => l.type === "therapy_activity" && new Date(l.date).getTime() > oneWeekAgo).length;

  const streak = (() => {
    const days = new Set(
      historyLogs
        .filter(l => l.type === "therapy_activity")
        .map(l => new Date(l.date).toDateString())
    );
    let s = 0;
    const d = new Date();
    while (days.has(d.toDateString())) { s++; d.setDate(d.getDate() - 1); }
    return s;
  })();

  // ── Complete handler ──
  const handleCompleteActivity = (name, desc) => {
    const newEntry = { date: new Date().toISOString(), type: "therapy_activity", name, desc };
    onUpdateCompanionState({ historyLogs: [...historyLogs, newEntry] });
    showToast?.("Đã ghi nhận hoạt động!", "success");
    setActivePanel(null);
  };

  const openPanel = (id) => setActivePanel(id);
  const closePanel = () => setActivePanel(null);

  const activeMethod = ALL_METHODS.find(m => m.id === activePanel);

  // ── Full-screen panels for external components ──
  if (activePanel === "reading") return <ReadingTherapy onBack={closePanel} onCompleteActivity={handleCompleteActivity} showToast={showToast} bio={bio} />;
  if (activePanel === "meditation") return <MeditationTherapy onBack={closePanel} onCompleteActivity={handleCompleteActivity} showToast={showToast} bio={bio} />;
  if (activePanel === "breath") return <BreathingTherapy onBack={closePanel} onCompleteActivity={handleCompleteActivity} showToast={showToast} />;
  if (activePanel === "depression") return <DepressionCbtTherapy onBack={closePanel} onCompleteActivity={handleCompleteActivity} showToast={showToast} bio={bio} historyLogs={historyLogs} chatMessages={chatMessages} />;
  if (activePanel === "deep_report") return <DeepReportPanel bio={bio} historyLogs={historyLogs} chatMessages={chatMessages} onBack={closePanel} />;

  // ── Inline mini-panels ──
  const inlinePanels = { soundscape: true, muscle: true, writing: true, exercise: true, social: true };
  const showInline = activePanel && inlinePanels[activePanel];

  return (
    <div className="p-4 pb-20 space-y-4 animate-fadeIn">

      {/* Daily Challenges Widget */}
      {!showInline && (
        <div className="bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-transparent dark:from-amber-950/10 dark:via-zinc-900/5 rounded-3xl border border-amber-500/20 dark:border-amber-900/35 p-5 shadow-sm backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-500">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 leading-none">
                  Thử thách Chăm sóc Tinh thần
                </h4>
                <p className="text-[10px] text-zinc-400 font-bold leading-none mt-1">
                  Thực hành tự phục hồi và tích lũy JOY hằng ngày
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full">
                Hoàn thành: {totalCompleted}/3
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(totalCompleted / 3) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

          {/* Challenge List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {challenges.map((ch) => {
              const Icon = ch.icon;
              return (
                <div
                  key={ch.id}
                  className={`bg-white/40 dark:bg-background/20 border border-zinc-200/40 dark:border-zinc-800/30 rounded-2xl p-3 flex flex-col justify-between gap-3 relative transition-all hover:bg-white/60 dark:hover:bg-[#1c1a26]/40`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br ${ch.color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 leading-tight">
                        {ch.title}
                      </p>
                      <p className="text-[9px] text-zinc-400 font-medium leading-tight mt-0.5">
                        {ch.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-850">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase text-zinc-450 dark:text-zinc-550 leading-none">
                        Tiến độ
                      </span>
                      <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-300 mt-0.5">
                        {ch.progressText}
                      </span>
                    </div>

                    {ch.claimed ? (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                        ✓ Đã nhận
                      </span>
                    ) : ch.completed ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleClaimReward(ch.id)}
                        disabled={claimingId !== null}
                        className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl shadow-md shadow-amber-555/20 active:scale-95 transition-all"
                      >
                        {claimingId === ch.id ? "Đang nhận..." : `Nhận +${ch.reward} JOY`}
                      </motion.button>
                    ) : (
                      <span className="text-[9px] font-black uppercase text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-xl">
                        Chưa đạt
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats bar */}
      {!showInline && (
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-white/60 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 backdrop-blur-sm">
            <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Tuần này</p>
              <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{weekActivities} <span className="text-[10px] font-bold text-zinc-500">hoạt động</span></p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-white/60 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 backdrop-blur-sm">
            <Flame className="w-4 h-4 text-orange-500 shrink-0" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Streak</p>
              <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{streak} <span className="text-[10px] font-bold text-zinc-500">ngày</span></p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-white/60 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-2.5 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Phương pháp</p>
              <p className="text-[13px] font-black text-zinc-900 dark:text-zinc-100">{ALL_METHODS.length} <span className="text-[10px] font-bold text-zinc-500">có sẵn</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Card grid — always visible: every method is now JOY-lockable (shows an
          unlock button inline) except the "basic" clinical-gated methods, which
          keep their original earn-via-engagement lock. */}
      {!showInline && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ALL_METHODS.map((method) => {
            const ok = isUnlocked(method);
            const showJoyUnlock = method.joyLockable && !ok;
            const isUnlockingThis = unlockingId === method.id;
            return (
              <motion.div
                key={method.id}
                whileHover={ok ? { scale: 1.02 } : {}}
                whileTap={ok ? { scale: 0.98 } : {}}
                onClick={() => ok && openPanel(method.id)}
                className={`relative flex flex-col gap-2 p-4 rounded-2xl border transition-all ${
                  ok
                    ? `bg-gradient-to-br ${method.gradient} ${method.border} shadow-sm hover:shadow-lg cursor-pointer`
                    : showJoyUnlock
                      ? `bg-gradient-to-br ${method.gradient} ${method.border} opacity-90 cursor-default`
                      : "bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-60 grayscale cursor-default"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${ok || showJoyUnlock ? method.iconBg : "bg-zinc-200/60 dark:bg-zinc-700/40 text-zinc-400"}`}>
                    <method.Icon className="w-5 h-5" />
                  </div>
                  {ok ? (
                    <span className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${method.badge}`}>
                      <Unlock className="w-2.5 h-2.5" /> Mở
                    </span>
                  ) : showJoyUnlock ? (
                    <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Lock className="w-2.5 h-2.5" /> JOY
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-700/60 text-zinc-500">
                      <Lock className="w-2.5 h-2.5" /> Khóa
                    </span>
                  )}
                </div>

                {/* Category */}
                <span className={`self-start text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${method.badge}`}>
                  {method.category}
                </span>

                {/* Name & desc */}
                <div className="flex-1">
                  <p className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 leading-tight">{method.name}</p>
                  <p className="text-[9.5px] text-zinc-500 dark:text-zinc-400 font-bold leading-snug mt-0.5 line-clamp-2">{method.desc}</p>
                </div>

                {/* Duration + button */}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] font-black text-zinc-400 bg-zinc-100 dark:bg-zinc-700/70 px-2 py-0.5 rounded-md">{method.duration}</span>
                  {ok && (
                    <button
                      onClick={() => openPanel(method.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${method.btn} text-white text-[9px] font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all`}
                    >
                      Bắt đầu <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* JOY unlock CTA */}
                {showJoyUnlock && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnlockFeature(method);
                    }}
                    disabled={isUnlockingThis}
                    className="mt-1 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[9.5px] font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isUnlockingThis ? "Đang xử lý..." : (
                      <>
                        <JoyCoinBadge amount={UNLOCK_COST} size="sm" className="[&_span]:text-white" />
                        <span>Mở khoá</span>
                      </>
                    )}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Inline mini-panel wrapper */}
      <AnimatePresence>
        {showInline && activeMethod && (
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`rounded-3xl border p-5 bg-gradient-to-br ${activeMethod.gradient} ${activeMethod.border} space-y-4 shadow-lg`}
          >
            {/* Panel header */}
            <div className="flex items-center gap-3">
              <button
                onClick={closePanel}
                className="p-2 rounded-xl bg-white/60 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-700 transition-all active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              </button>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeMethod.iconBg}`}>
                  <activeMethod.Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[12px] font-black text-zinc-900 dark:text-zinc-100">{activeMethod.name}</p>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${activeMethod.badge}`}>{activeMethod.category} · {activeMethod.duration}</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-zinc-200/60 dark:bg-zinc-700/40" />

            {/* Panel content */}

            {activePanel === "soundscape" && (
              <SoundscapePanel
                onBack={closePanel}
                onComplete={() => handleCompleteActivity("Âm Thanh Thiên Nhiên", "Thư giãn đầu óc với nhạc thiên nhiên")}
              />
            )}
            {activePanel === "muscle" && (
              <MuscleRelaxPanel
                onBack={closePanel}
                onComplete={() => handleCompleteActivity("Thư Giãn Cơ (PMR)", "Hoàn thành bài tập căng–thả 7 nhóm cơ")}
              />
            )}
            {activePanel === "writing" && (
              <ExpressiveWritingPanel
                onBack={closePanel}
                onComplete={() => handleCompleteActivity("Viết Tự Do", "Hoàn thành bài viết biểu đạt cảm xúc 10 phút")}
              />
            )}
            {activePanel === "exercise" && (
              <LightExercisePanel
                onBack={closePanel}
                onComplete={() => handleCompleteActivity("Vận Động Nhẹ", "Hoàn thành ít nhất 1 bài tập vận động nhẹ")}
              />
            )}
            {activePanel === "social" && (
              <SocialConnectionPanel
                onBack={closePanel}
                onComplete={() => handleCompleteActivity("Kết Nối Xã Hội", "Chủ động kết nối với người thân / bạn bè")}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice for a JOY-for-therapy exchange — see unlockReceipt above */}
      <AnimatePresence>
        {unlockReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setUnlockReceipt(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1a1924] w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col"
            >
              <div className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl">receipt_long</span>
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider">Hoá Đơn Trao Đổi JOY</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 text-left space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Liệu pháp</span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white text-right">{unlockReceipt.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Thời gian</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">{unlockReceipt.time.toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-700 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Số JOY đã trừ</span>
                    <span className="text-sm font-bold text-destructive">-{unlockReceipt.cost} JOY</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Số dư còn lại</span>
                    <span className="text-lg font-black text-zinc-900 dark:text-white">{unlockReceipt.balanceAfter} <small className="text-xs text-zinc-500 font-bold">JOY</small></span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 text-center">Tính năng đã được mở khoá vĩnh viễn cho tài khoản của cậu. Lịch sử giao dịch đầy đủ có tại tab Ví JOY.</p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setUnlockReceipt(null)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Đã hiểu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
