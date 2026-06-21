import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Unlock, BookOpen, Wind, Brain, Heart, ArrowLeft,
  Pencil, Dumbbell, Users, Flame, CheckCircle2, Circle,
  Timer, ChevronRight, Sparkles, TrendingUp, PhoneCall, FileText, CalendarCheck, Printer
} from "lucide-react";
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
      } catch (e) {
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

// ─── Gọi Thoại Không Giới Hạn (paid, passive perk — no "activity" to log) ──
function UnlimitedCallsPanel({ onNavigateToTab }) {
  return (
    <div className="space-y-4 text-center py-2">
      <div className="w-14 h-14 rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto">
        <PhoneCall className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[12px] font-black text-zinc-900 dark:text-zinc-100">Đã mở khoá Gọi Thoại Không Giới Hạn!</p>
        <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-bold mt-1 leading-relaxed">Giới hạn 5 cuộc gọi/ngày đã được gỡ bỏ vĩnh viễn cho tài khoản này. Cậu có thể gọi tư vấn AI bao nhiêu lần tuỳ thích trong tab Tâm Sự.</p>
      </div>
      <button
        onClick={() => onNavigateToTab?.("chat")}
        className="w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
      >
        Đến Tâm Sự để gọi ngay
      </button>
    </div>
  );
}

// ─── Báo Cáo Tâm Lý Chuyên Sâu (paid, generates a printable clinical-style report) ──
function DeepReportPanel({ bio, historyLogs, chatMessages }) {
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
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="py-10 text-center text-[11px] text-zinc-400 font-bold">Đang tổng hợp báo cáo...</div>;
  if (error || !report) {
    return <p className="text-[11px] text-rose-500 font-bold text-center py-6">{error || "Có lỗi xảy ra."}</p>;
  }

  const Section = ({ title, children }) => (
    <div className="space-y-1">
      <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">{title}</p>
      <div className="text-[11px] text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">{children}</div>
    </div>
  );

  return (
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
  );
}

// ─── Card definitions ─────────────────────────────────────────────────────────

const ALL_METHODS = [
  { id:"breath",     Icon: Wind,      name:"Hít Thở 4-7-8",    desc:"Làm dịu lo âu, nhịp tim nhanh tức thì (kèm Thư Giãn Cơ)", category:"Thở",   duration:"5 ph",     gradient:"from-amber-500/10 to-amber-500/5",    border:"border-amber-500/20 dark:border-amber-400/15",    badge:"bg-amber-500/10 text-amber-600 dark:text-amber-400",     iconBg:"bg-amber-500/15 text-amber-600 dark:text-amber-400",    btn:"bg-amber-500 hover:bg-amber-600",  lockKey:"breathing"  },
  { id:"gratitude",  Icon: Heart,     name:"Nhật Ký Biết Ơn",  desc:"Liệt kê 3 điều trân trọng hôm nay",             category:"Cảm xúc",   duration:"5 ph",     gradient:"from-purple-500/10 to-purple-500/5",  border:"border-purple-500/20 dark:border-purple-400/15",  badge:"bg-purple-500/10 text-purple-600 dark:text-purple-400",  iconBg:"bg-purple-500/15 text-purple-600 dark:text-purple-400", btn:"bg-purple-500 hover:bg-purple-600", lockKey:"gratitude" },
  { id:"reading",    Icon: BookOpen,  name:"Đọc Truyện AI Trị Liệu", desc:"AI viết & kể truyện ngắn riêng theo tâm trạng thật của bạn", category:"AI · Đọc", duration:"10 ph", gradient:"from-indigo-500/10 to-indigo-500/5",  border:"border-indigo-500/20 dark:border-indigo-400/15",  badge:"bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",  iconBg:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-400", btn:"bg-indigo-500 hover:bg-indigo-600",  lockKey:"reading",    joyLockable:true  },
  { id:"meditation", Icon: Flame,     name:"Thiền Dẫn AI Cá Nhân Hoá", desc:"Giọng dẫn thiền do AI soạn riêng theo mood hiện tại",  category:"AI · Thiền", duration:"10–20 ph", gradient:"from-teal-500/10 to-teal-500/5",      border:"border-teal-500/20 dark:border-teal-400/15",      badge:"bg-teal-500/10 text-teal-600 dark:text-teal-400",        iconBg:"bg-teal-500/15 text-teal-600 dark:text-teal-400",       btn:"bg-teal-500 hover:bg-teal-600",    lockKey:"meditation", joyLockable:true  },
  { id:"depression", Icon: Brain,     name:"CBT Worksheet Cá Nhân Hoá", desc:"AI phân tích lịch sử chat thật, soạn bảng ghi suy nghĩ riêng cho bạn", category:"AI · Nhận thức", duration:"15 ph", gradient:"from-rose-500/10 to-rose-500/5",      border:"border-rose-500/20 dark:border-rose-400/15",      badge:"bg-rose-500/10 text-rose-600 dark:text-rose-400",        iconBg:"bg-rose-500/15 text-rose-600 dark:text-rose-400",       btn:"bg-rose-500 hover:bg-rose-600",    lockKey:"depression", joyLockable:true  },
  { id:"action_plan",   Icon: CalendarCheck, name:"Lộ Trình 7 Ngày Cá Nhân Hoá", desc:"AI gộp viết · vận động · kết nối thành 1 kế hoạch riêng cho tuần này", category:"AI · Lộ trình", duration:"Cả tuần", gradient:"from-pink-500/10 to-pink-500/5", border:"border-pink-500/20 dark:border-pink-400/15", badge:"bg-pink-500/10 text-pink-600 dark:text-pink-400", iconBg:"bg-pink-500/15 text-pink-600 dark:text-pink-400", btn:"bg-pink-500 hover:bg-pink-600", lockKey:"action_plan", joyLockable:true },
  { id:"unlimited_calls", Icon: PhoneCall, name:"Gọi Thoại Không Giới Hạn", desc:"Gỡ bỏ vĩnh viễn giới hạn 5 cuộc gọi tư vấn AI/ngày", category:"Đặc quyền", duration:"Vĩnh viễn", gradient:"from-violet-500/10 to-violet-500/5", border:"border-violet-500/20 dark:border-violet-400/15", badge:"bg-violet-500/10 text-violet-600 dark:text-violet-400", iconBg:"bg-violet-500/15 text-violet-600 dark:text-violet-400", btn:"bg-violet-500 hover:bg-violet-600", lockKey:"unlimited_calls", joyLockable:true },
  { id:"deep_report", Icon: FileText, name:"Báo Cáo Tâm Lý Chuyên Sâu", desc:"Hồ sơ tổng hợp AI soạn để chia sẻ với chuyên viên thật, in/lưu PDF", category:"AI · Báo cáo", duration:"5 ph", gradient:"from-cyan-500/10 to-cyan-500/5", border:"border-cyan-500/20 dark:border-cyan-400/15", badge:"bg-cyan-500/10 text-cyan-600 dark:text-cyan-400", iconBg:"bg-cyan-500/15 text-cyan-600 dark:text-cyan-400", btn:"bg-cyan-500 hover:bg-cyan-600", lockKey:"deep_report", joyLockable:true },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function TherapyTab({ onNavigateToTab, bio, historyLogs, onUpdateCompanionState, healingActive, showToast, onBioUpdate, initialMethod }) {
  const [activePanel, setActivePanel] = useState(initialMethod || null);
  const [unlockedFeatures, setUnlockedFeatures] = useState(bio?.unlockedCompanionFeatures || []);
  const [unlockingId, setUnlockingId] = useState(null);
  const joyBalance = useJoyStore(s => s.balance);
  const fetchJoyBalance = useJoyStore(s => s.fetchBalance);

  useEffect(() => {
    if (bio?.unlockedCompanionFeatures) setUnlockedFeatures(bio.unlockedCompanionFeatures);
  }, [bio?.unlockedCompanionFeatures]);

  const unlocked = {
    reading: unlockedFeatures.includes("reading"),
    meditation: unlockedFeatures.includes("meditation"),
    depression: unlockedFeatures.includes("depression"),
    breathing: true,   // Hít Thở 4-7-8 (+ Thư Giãn Cơ) — always free
    gratitude: true,   // Viết Nhật Ký — always free
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
      showToast?.(`Đã mở khoá "${method.name}"! 🎉`, "success");
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

      {/* Card grid — always visible: Hít Thở 4-7-8 + Nhật Ký Biết Ơn are free for
          everyone, the JOY-lockable methods show an unlock button inline, and the
          "basic" clinical-gated methods keep their original earn-via-engagement lock. */}
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
                className={`relative flex flex-col gap-2 p-4 rounded-2xl border transition-all cursor-default ${
                  ok
                    ? `bg-gradient-to-br ${method.gradient} ${method.border} shadow-sm hover:shadow-lg`
                    : showJoyUnlock
                      ? `bg-gradient-to-br ${method.gradient} ${method.border} opacity-90`
                      : "bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-60 grayscale"
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
                    onClick={() => handleUnlockFeature(method)}
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
