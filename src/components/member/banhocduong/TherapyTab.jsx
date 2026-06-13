import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Unlock, BookOpen, Wind, Brain, Heart, ArrowLeft,
  Pencil, Dumbbell, Users, Flame, CheckCircle2, Circle,
  Timer, ChevronRight, Sparkles, TrendingUp
} from "lucide-react";
import BreathingTherapy from "./BreathingTherapy";
import ReadingTherapy from "./ReadingTherapy";
import MeditationTherapy from "./MeditationTherapy";
import DepressionCbtTherapy from "./DepressionCbtTherapy";

// ─── Inline mini-panels ──────────────────────────────────────────────────────

function GratitudePanel({ onBack, onComplete }) {
  const [items, setItems] = useState(["", "", ""]);
  const [done, setDone] = useState(false);

  const handleSubmit = () => {
    const filled = items.filter(i => i.trim());
    if (filled.length === 0) return;
    setDone(true);
    setTimeout(() => onComplete(), 1400);
  };

  return (
    <div className="space-y-5">
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold leading-relaxed">
        Viết ra 3 điều bạn biết ơn hôm nay — dù nhỏ bé đến đâu. Nghiên cứu cho thấy thói quen này tăng hạnh phúc tới 25%.
      </p>
      {items.map((val, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</span>
          <input
            value={val}
            onChange={e => { const n = [...items]; n[i] = e.target.value; setItems(n); }}
            placeholder={["Một người tôi yêu quý…", "Một điều tôi tự hào…", "Một khoảnh khắc nhỏ đẹp…"][i]}
            className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-2.5 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 ring-purple-400/50 transition-all font-medium"
          />
        </div>
      ))}
      {done ? (
        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-black">
          <CheckCircle2 className="w-4 h-4" /> Đã ghi lại! Cảm ơn bạn 💜
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!items.some(i => i.trim())}
          className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
        >
          Lưu nhật ký hôm nay
        </button>
      )}
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

function ExpressiveWritingPanel({ onBack, onComplete }) {
  const [text, setText] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  const start = () => {
    setStarted(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDone(true);
    setTimeout(() => onComplete(), 1400);
  };

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <CheckCircle2 className="w-10 h-10 text-rose-500" />
        <p className="text-[12px] font-black text-zinc-900 dark:text-zinc-100">Bài viết đã lưu!</p>
        <p className="text-[10px] text-zinc-500 font-bold text-center">Bày tỏ cảm xúc qua chữ viết giúp giải phóng tâm lý rất hiệu quả.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold leading-relaxed max-w-xs">
          Viết tự do về bất cứ điều gì đang trong tâm trí bạn. Không cần đúng ngữ pháp — chỉ cần viết thật.
        </p>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[12px] ${started && timeLeft <= 60 ? "bg-red-500/10 text-red-500" : "bg-rose-500/10 text-rose-500"}`}>
          <Timer className="w-4 h-4" /> {mins}:{secs}
        </div>
      </div>
      <textarea
        value={text}
        onChange={e => { if (!started) start(); setText(e.target.value); }}
        placeholder="Bắt đầu viết… (bộ đếm sẽ tự chạy khi bạn gõ)"
        rows={8}
        className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-[11px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 ring-rose-400/50 resize-none font-medium leading-relaxed transition-all"
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
      >
        Hoàn thành & lưu
      </button>
    </div>
  );
}

const EXERCISES = [
  { name: "Đi bộ 10 phút",   desc: "Ra ngoài, hít thở không khí",        duration: "10 phút" },
  { name: "10 nhảy bật",     desc: "Jumping jacks để tăng nhịp tim",      duration: "2 phút"  },
  { name: "Kéo giãn 5 phút", desc: "Cổ, vai, lưng, chân",                 duration: "5 phút"  },
  { name: "10 cái squat",    desc: "Vận động cơ đùi nhẹ nhàng",           duration: "3 phút"  },
  { name: "Yoga mèo-bò",     desc: "Giải phóng căng thẳng cột sống",      duration: "5 phút"  },
];

function LightExercisePanel({ onBack, onComplete }) {
  const [completed, setCompleted] = useState(new Set());

  const toggle = (i) => {
    const next = new Set(completed);
    if (next.has(i)) next.delete(i); else next.add(i);
    setCompleted(next);
    if (next.size === EXERCISES.length) {
      setTimeout(() => onComplete(), 900);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold">Hoàn thành ít nhất 1 bài. Gõ vào ô để đánh dấu xong!</p>
      {EXERCISES.map((ex, i) => {
        const done = completed.has(i);
        return (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${done ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:border-emerald-400/40"}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${done ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-zinc-100 dark:bg-zinc-700/60 text-zinc-500"}`}>
                <Dumbbell className="w-4 h-4" />
              </div>
            <div className="flex-1">
              <p className={`text-[11px] font-black ${done ? "text-emerald-600 dark:text-emerald-400 line-through" : "text-zinc-900 dark:text-zinc-100"}`}>{ex.name}</p>
              <p className="text-[9.5px] text-zinc-500 font-bold">{ex.desc}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[9px] font-black text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded-md">{ex.duration}</span>
              {done ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />}
            </div>
          </button>
        );
      })}
      {completed.size > 0 && completed.size < EXERCISES.length && (
        <button
          onClick={() => onComplete()}
          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
        >
          Xong {completed.size} bài — lưu lại
        </button>
      )}
    </div>
  );
}

const SOCIAL_TASKS = [
  { label: "Nhắn tin cho một người bạn" },
  { label: "Video call gia đình" },
  { label: "Tham gia một buổi sinh hoạt nhóm" },
  { label: "Nói lời cảm ơn với ai đó hôm nay" },
  { label: "Gọi điện cho người thân" },
];

function SocialConnectionPanel({ onBack, onComplete }) {
  const [checked, setChecked] = useState(new Set());

  const toggle = (i) => {
    const next = new Set(checked);
    if (next.has(i)) next.delete(i); else next.add(i);
    setChecked(next);
  };

  const handleDone = () => { if (checked.size > 0) onComplete(); };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold">Kết nối xã hội là "thuốc" chống trầm cảm tự nhiên. Hãy thực hiện ít nhất 1 điều hôm nay.</p>
      {SOCIAL_TASKS.map((t, i) => {
        const done = checked.has(i);
        return (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] ${done ? "bg-blue-500/10 border-blue-500/30" : "bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:border-blue-400/40"}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${done ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" : "bg-zinc-100 dark:bg-zinc-700/60 text-zinc-500"}`}>
                <Users className="w-4 h-4" />
              </div>
            <p className={`flex-1 text-[11px] font-bold ${done ? "text-blue-600 dark:text-blue-400 line-through" : "text-zinc-800 dark:text-zinc-200"}`}>{t.label}</p>
            {done ? <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> : <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" />}
          </button>
        );
      })}
      <button
        onClick={handleDone}
        disabled={checked.size === 0}
        className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
      >
        Xác nhận đã kết nối ({checked.size})
      </button>
    </div>
  );
}

// ─── Card definitions ─────────────────────────────────────────────────────────

const ALL_METHODS = [
  { id:"reading",    Icon: BookOpen,  name:"Đọc Sách",         desc:"Nhạc sóng não & không gian tĩnh lặng",          category:"Đọc",       duration:"15–30 ph", gradient:"from-indigo-500/10 to-indigo-500/5",  border:"border-indigo-500/20 dark:border-indigo-400/15",  badge:"bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",  iconBg:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-400", btn:"bg-indigo-500 hover:bg-indigo-600",  lockKey:"reading"    },
  { id:"meditation", Icon: Flame,     name:"Ngồi Tĩnh Tâm",    desc:"Giảm stress, thư giãn sâu toàn thân",           category:"Thiền",     duration:"10–20 ph", gradient:"from-teal-500/10 to-teal-500/5",      border:"border-teal-500/20 dark:border-teal-400/15",      badge:"bg-teal-500/10 text-teal-600 dark:text-teal-400",        iconBg:"bg-teal-500/15 text-teal-600 dark:text-teal-400",       btn:"bg-teal-500 hover:bg-teal-600",    lockKey:"meditation" },
  { id:"breath",     Icon: Wind,      name:"Hít Thở 4-7-8",    desc:"Làm dịu lo âu, nhịp tim nhanh tức thì",         category:"Thở",       duration:"5 ph",     gradient:"from-amber-500/10 to-amber-500/5",    border:"border-amber-500/20 dark:border-amber-400/15",    badge:"bg-amber-500/10 text-amber-600 dark:text-amber-400",     iconBg:"bg-amber-500/15 text-amber-600 dark:text-amber-400",    btn:"bg-amber-500 hover:bg-amber-600",  lockKey:"breathing"  },
  { id:"depression", Icon: Brain,     name:"Nhật Ký CBT",      desc:"Liệu pháp nhận thức hành vi chống trầm cảm",    category:"Nhận thức", duration:"20 ph",    gradient:"from-rose-500/10 to-rose-500/5",      border:"border-rose-500/20 dark:border-rose-400/15",      badge:"bg-rose-500/10 text-rose-600 dark:text-rose-400",        iconBg:"bg-rose-500/15 text-rose-600 dark:text-rose-400",       btn:"bg-rose-500 hover:bg-rose-600",    lockKey:"depression" },
  { id:"gratitude",  Icon: Heart,     name:"Nhật Ký Biết Ơn",  desc:"Liệt kê 3 điều trân trọng hôm nay",             category:"Cảm xúc",   duration:"5 ph",     gradient:"from-purple-500/10 to-purple-500/5",  border:"border-purple-500/20 dark:border-purple-400/15",  badge:"bg-purple-500/10 text-purple-600 dark:text-purple-400",  iconBg:"bg-purple-500/15 text-purple-600 dark:text-purple-400", btn:"bg-purple-500 hover:bg-purple-600", lockKey:"basic"     },
  { id:"muscle",     Icon: Sparkles,  name:"Thư Giãn Cơ",      desc:"PMR: căng rồi thả lỏng 7 nhóm cơ",             category:"Thở",       duration:"7 ph",     gradient:"from-cyan-500/10 to-cyan-500/5",      border:"border-cyan-500/20 dark:border-cyan-400/15",      badge:"bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",        iconBg:"bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",       btn:"bg-cyan-500 hover:bg-cyan-600",    lockKey:"breathing"  },
  { id:"writing",    Icon: Pencil,    name:"Viết Tự Do",        desc:"10 phút xả cảm xúc không kiểm duyệt",          category:"Cảm xúc",   duration:"10 ph",    gradient:"from-pink-500/10 to-pink-500/5",      border:"border-pink-500/20 dark:border-pink-400/15",      badge:"bg-pink-500/10 text-pink-600 dark:text-pink-400",        iconBg:"bg-pink-500/15 text-pink-600 dark:text-pink-400",       btn:"bg-pink-500 hover:bg-pink-600",    lockKey:"basic"      },
  { id:"exercise",   Icon: Dumbbell,  name:"Vận Động Nhẹ",     desc:"5 bài tập đơn giản tăng endorphin",             category:"Vận động",  duration:"15 ph",    gradient:"from-emerald-500/10 to-emerald-500/5",border:"border-emerald-500/20 dark:border-emerald-400/15",badge:"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",iconBg:"bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",btn:"bg-emerald-500 hover:bg-emerald-600",lockKey:"basic"  },
  { id:"social",     Icon: Users,     name:"Kết Nối Xã Hội",   desc:"Chủ động liên lạc, chia sẻ với người thân",    category:"Kết nối",   duration:"10 ph",    gradient:"from-blue-500/10 to-blue-500/5",      border:"border-blue-500/20 dark:border-blue-400/15",      badge:"bg-blue-500/10 text-blue-600 dark:text-blue-400",        iconBg:"bg-blue-500/15 text-blue-600 dark:text-blue-400",       btn:"bg-blue-500 hover:bg-blue-600",    lockKey:"basic"      },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function TherapyTab({ onNavigateToTab, bio, historyLogs, onUpdateCompanionState, healingActive, showToast }) {
  const [activePanel, setActivePanel] = useState(null);

  // ── Lock checks ──
  const hasClinicalResults = historyLogs.some(log =>
    log.type === "clinical_test" ||
    log.test === "phq9" || log.test === "gad7" || log.test === "who5" ||
    log.test === "bigfive" || log.test === "dass42" || log.test === "mmpi30"
  );
  const hasActiveJourneyOrResults = hasClinicalResults || healingActive;

  const unlocked = {
    reading: hasActiveJourneyOrResults,
    meditation: healingActive || historyLogs.some(log => {
      if (log.test === "who5" && log.score <= 12) return true;
      if (log.test === "dass42" && log.scores?.S >= 10) return true;
      if (log.test === "mmpi30" && log.clinical?.some(c => (c.code === "Pt" || c.code === "Sc") && c.score >= 70)) return true;
      return false;
    }),
    breathing: healingActive || historyLogs.some(log => {
      if (log.test === "gad7" && log.score >= 5) return true;
      if (log.test === "dass42" && log.scores?.A >= 7) return true;
      if (log.test === "mmpi30" && log.clinical?.some(c => (c.code === "Hs" || c.code === "Hy") && c.score >= 70)) return true;
      if (log.type === "chat_anomaly" && log.text && (log.text.includes("sợ") || log.text.includes("lo"))) return true;
      return false;
    }),
    depression: healingActive || historyLogs.some(log => {
      if (log.test === "phq9" && log.score >= 5) return true;
      if (log.test === "dass42" && log.scores?.D >= 10) return true;
      if (log.test === "mmpi30" && log.clinical?.some(c => c.code === "D" && c.score >= 70)) return true;
      return false;
    }),
    basic: hasActiveJourneyOrResults,
  };

  const isUnlocked = (method) => unlocked[method.lockKey] ?? false;

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
    showToast?.("Đã ghi nhận hoạt động! 🎉", "success");
    setActivePanel(null);
  };

  const openPanel = (id) => setActivePanel(id);
  const closePanel = () => setActivePanel(null);

  const activeMethod = ALL_METHODS.find(m => m.id === activePanel);

  // ── Full-screen panels for external components ──
  if (activePanel === "reading") return <ReadingTherapy onBack={closePanel} onCompleteActivity={handleCompleteActivity} showToast={showToast} />;
  if (activePanel === "meditation") return <MeditationTherapy onBack={closePanel} onCompleteActivity={handleCompleteActivity} showToast={showToast} />;
  if (activePanel === "breath") return <BreathingTherapy onBack={closePanel} onCompleteActivity={handleCompleteActivity} showToast={showToast} />;
  if (activePanel === "depression") return <DepressionCbtTherapy onBack={closePanel} onCompleteActivity={handleCompleteActivity} showToast={showToast} />;

  // ── Inline mini-panels ──
  const inlinePanels = { gratitude: true, muscle: true, writing: true, exercise: true, social: true };
  const showInline = activePanel && inlinePanels[activePanel];

  return (
    <div className="p-4 pb-20 space-y-4 animate-fadeIn">

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

      {/* Locked state — no data at all */}
      {!showInline && !hasActiveJourneyOrResults && (
        <div className="max-w-md mx-auto text-center p-8 border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-[#1a1924]/40 backdrop-blur-xl rounded-3xl space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto text-zinc-400 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Chưa mở khóa trị liệu</h4>
          <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-bold">
            Cần có dữ liệu đầu vào. Hãy trò chuyện hoặc làm bài đánh giá để AI phân tích và đề xuất phương pháp phù hợp nhất.
          </p>
          <button
            type="button"
            onClick={() => onNavigateToTab && onNavigateToTab("chat")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Trò chuyện cùng AI ngay
          </button>
        </div>
      )}

      {/* Card grid */}
      {!showInline && hasActiveJourneyOrResults && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ALL_METHODS.map((method) => {
            const ok = isUnlocked(method);
            return (
              <motion.div
                key={method.id}
                whileHover={ok ? { scale: 1.02 } : {}}
                whileTap={ok ? { scale: 0.98 } : {}}
                className={`relative flex flex-col gap-2 p-4 rounded-2xl border transition-all cursor-default ${
                  ok
                    ? `bg-gradient-to-br ${method.gradient} ${method.border} shadow-sm hover:shadow-lg`
                    : "bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-60 grayscale"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${ok ? method.iconBg : "bg-zinc-200/60 dark:bg-zinc-700/40 text-zinc-400"}`}>
                    <method.Icon className="w-5 h-5" />
                  </div>
                  {ok ? (
                    <span className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${method.badge}`}>
                      <Unlock className="w-2.5 h-2.5" /> Mở
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
            {activePanel === "gratitude" && (
              <GratitudePanel
                onBack={closePanel}
                onComplete={() => handleCompleteActivity("Nhật Ký Biết Ơn", "Ghi lại 3 điều biết ơn trong ngày")}
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
    </div>
  );
}
