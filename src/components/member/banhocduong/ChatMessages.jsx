import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Stethoscope, Heart } from "lucide-react";
import TypewriterText from "./TypewriterText";

// ─── Inline interactive widgets (unchanged logic) ────────────────────────────

function InlineBreathingCircle() {
  const [phase, setPhase] = React.useState("idle");
  const [sec, setSec] = React.useState(0);
  const [isActive, setIsActive] = React.useState(false);
  const timerRef = React.useRef(null);

  const startBreathing = () => { setIsActive(true); setPhase("inhale"); setSec(4); };
  const stopBreathing = () => {
    setIsActive(false); setPhase("idle"); setSec(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  React.useEffect(() => {
    if (!isActive) return;
    timerRef.current = setInterval(() => {
      setSec(s => {
        if (s <= 1) {
          setPhase(p => {
            if (p === "inhale") { setSec(7); return "hold"; }
            if (p === "hold") { setSec(8); return "exhale"; }
            setSec(4); return "inhale";
          });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  const circleScale = phase === "inhale" ? 1.25 : phase === "hold" ? 1.25 : phase === "exhale" ? 0.85 : 1.0;
  const outerPulse = phase === "hold" ? [1.25, 1.35, 1.25] : circleScale;
  const phaseLabel = phase === "inhale" ? "Hít Vào (4s)" : phase === "hold" ? "Nín Thở (7s)" : phase === "exhale" ? "Thở Ra (8s)" : "Hít thở 4-7-8";

  return (
    <div className="mt-2 p-4 rounded-3xl bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent border border-sky-400/20 dark:border-sky-800/30 flex flex-col items-center gap-3.5 w-full max-w-[240px] shadow-sm backdrop-blur-md text-foreground">
      <div className="text-[9px] font-black uppercase text-sky-600 dark:text-sky-400 tracking-wider flex items-center gap-1">
        <span className="material-symbols-outlined text-[10px] animate-pulse">air</span>
        Bài tập Thở 4-7-8
      </div>
      <div className="w-20 h-20 rounded-full flex items-center justify-center relative bg-sky-500/5 dark:bg-sky-500/10">
        {/* Outer glowing pulsing halo */}
        <motion.div 
          className="absolute inset-0 rounded-full bg-sky-400/10 dark:bg-sky-400/5 blur-[4px]"
          animate={{ scale: outerPulse }}
          transition={{ 
            duration: phase === "hold" ? 7 : phase === "exhale" ? 8 : 4, 
            ease: phase === "hold" ? "easeInOut" : "linear",
            repeat: phase === "hold" ? Infinity : 0
          }} 
        />
        {/* Middle breathing ring */}
        <motion.div 
          className="absolute inset-1 rounded-full bg-sky-400/20 dark:bg-sky-500/15 border border-sky-400/30"
          animate={{ scale: circleScale }}
          transition={{ duration: phase === "hold" ? 7 : phase === "exhale" ? 8 : 4, ease: "linear" }} 
        />
        {/* Inner solid counter circle */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 shadow-sm z-10">
          <span className="text-[14px] font-black text-sky-700 dark:text-sky-300">
            {isActive ? sec : "🧘"}
          </span>
        </div>
      </div>
      <p className="text-[10.5px] font-black text-sky-700 dark:text-sky-300 text-center h-4 tracking-wide">
        {phaseLabel}
      </p>
      <button type="button" onClick={isActive ? stopBreathing : startBreathing}
        className={`w-full py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider text-white transition-all active:scale-95 shadow-sm ${
          isActive 
            ? "bg-zinc-400 hover:bg-zinc-500 dark:bg-zinc-700 dark:hover:bg-zinc-600" 
            : "bg-sky-500 hover:bg-sky-600 shadow-[0_2px_10px_rgba(14,165,233,0.3)]"
        }`}>
        {isActive ? "Dừng bài tập" : "Bắt đầu thở"}
      </button>
    </div>
  );
}

function InlineCbtCard() {
  const [challenged, setChallenged] = React.useState(false);
  return (
    <div className="mt-2 p-4 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-200/60 dark:border-indigo-900/40 flex flex-col gap-3 w-full max-w-[240px] shadow-sm backdrop-blur-md">
      <div className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1">
        <span className="material-symbols-outlined text-[10px]">psychology</span>
        Thử thách Suy nghĩ (CBT)
      </div>
      <div className="bg-zinc-100/80 dark:bg-zinc-900/60 p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/40 shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)]">
        <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Suy nghĩ tiêu cực:</p>
        <p className="text-[11px] font-bold text-foreground/70 mt-1 italic leading-relaxed">"Tớ cảm thấy mình thật vô dụng..."</p>
      </div>
      <AnimatePresence mode="wait">
        {challenged ? (
          <motion.div 
            key="reframe" 
            initial={{ opacity: 0, scale: 0.95, y: 8 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 dark:from-emerald-500/5 dark:to-teal-500/0 p-3 rounded-2xl border border-emerald-500/30 dark:border-emerald-400/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
          >
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-500 text-[12px] animate-pulse">sparkles</span>
              <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Góc nhìn cân bằng:</p>
            </div>
            <p className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 mt-1 leading-relaxed">
              "Mình đang học và cố gắng từng ngày — điều đó không định nghĩa giá trị của mình."
            </p>
          </motion.div>
        ) : (
          <motion.button 
            key="btn" 
            type="button" 
            onClick={() => setChallenged(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 rounded-2xl text-[10px] font-black uppercase bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-[0_2px_10px_rgba(99,102,241,0.3)]"
          >
            Thử thách suy nghĩ
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Bold markdown renderer ───────────────────────────────────────────────────
function FormatText({ text }) {
  if (!text) return null;
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={i} className="font-bold text-primary dark:text-sky-400">{part.slice(2, -2)}</strong>
          : part
      )}
    </>
  );
}

// ─── Single message bubble content ────────────────────────────────────────────
// ─── Inline mood check-in picker ─────────────────────────────────────────────
const MOOD_OPTS = [
  { value: 1, emoji: "😣", label: "Kiệt sức" },
  { value: 2, emoji: "😔", label: "Mỏi mệt" },
  { value: 3, emoji: "😐", label: "Bình thường" },
  { value: 4, emoji: "🙂", label: "Ổn" },
  { value: 5, emoji: "😄", label: "Rất vui" },
];
function MoodCheckinCard({ onMoodSelect }) {
  const [selected, setSelected] = React.useState(null);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="mt-2.5 p-3 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-violet-50/70 dark:from-indigo-950/35 dark:to-violet-950/20 border border-indigo-100/80 dark:border-indigo-800/25 w-full"
    >
      <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 dark:text-indigo-500 mb-2.5">
        Chạm để check-in hôm nay
      </p>
      <div className="flex justify-between gap-1">
        {MOOD_OPTS.map(opt => (
          <button
            key={opt.value}
            type="button"
            disabled={selected !== null}
            onClick={() => { setSelected(opt.value); onMoodSelect?.(opt.value); }}
            className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl transition-all duration-200 active:scale-90 ${
              selected === opt.value
                ? "bg-indigo-500 shadow-lg shadow-indigo-500/25 scale-105"
                : selected !== null
                ? "opacity-30"
                : "hover:bg-white/70 dark:hover:bg-white/[0.08] hover:shadow-sm"
            }`}
          >
            <span className="text-[22px] leading-none select-none">{opt.emoji}</span>
            <span className={`text-[8px] font-bold leading-none ${
              selected === opt.value ? "text-white" : "text-muted-foreground"
            }`}>{opt.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function BotBubble({ msg, completedMessageIds, setCompletedMessageIds, onStartTest, onSelectDuration, onNavigateToTab, onUnlockFeature, unlockingMethodId, onMoodSelect, moodCheckinDone, onOpenVerification }) {
  return (
    <div className="flex flex-col gap-1.5 items-start">
      {/* Main text bubble */}
      <div className="px-5 py-3.5 text-[12.5px] md:text-[14px] leading-relaxed bg-white/70 dark:bg-[#1a1a24]/60 backdrop-blur-3xl text-foreground rounded-[24px] rounded-tl-[8px] shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.08)] border border-border/80/[0.12] max-w-full">
        {!completedMessageIds.has(msg.id) && msg.id !== "init" ? (
          <TypewriterText text={msg.text} id={msg.id}
            onComplete={() => setCompletedMessageIds(prev => { const s = new Set(prev); s.add(msg.id); return s; })} />
        ) : (
          <p className="whitespace-pre-wrap font-medium"><FormatText text={msg.text} /></p>
        )}
        {msg.showTherapyButton && (
          <button type="button" onClick={() => onNavigateToTab?.("therapy")}
            className="mt-2.5 flex items-center gap-1.5 w-full justify-center py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold rounded-xl transition-all active:scale-95">
            <Heart className="w-3.5 h-3.5" /> Mở Trị Liệu ngay
          </button>
        )}
      </div>

      {/* Interactive widgets */}
      {msg.showInlineBreathing && <InlineBreathingCircle />}
      {msg.showInlineCbt && <InlineCbtCard />}

      {/* Mood check-in picker — only shown on the initial greeting message */}
      {msg.type === "mood_checkin" && !moodCheckinDone && (
        <MoodCheckinCard onMoodSelect={onMoodSelect} />
      )}

      {/* Test suggestion card — redesigned: soft pill chips, no pushy full-width buttons */}
      {(msg.suggestPhq9 || msg.suggestGad7 || msg.suggestWho5 || msg.suggestBigFive) && (
        <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-50/80 to-indigo-50/60 dark:from-violet-950/20 dark:to-indigo-950/15 border border-violet-100 dark:border-violet-800/25 space-y-2 w-full max-w-[260px]">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[12px] text-violet-600 dark:text-violet-400">monitoring</span>
            </div>
            <span className="text-[10px] font-extrabold text-violet-700 dark:text-violet-300">Gợi ý nhỏ từ tớ</span>
          </div>
          <p className="text-[10.5px] text-muted-foreground leading-snug">
            Tớ muốn hiểu cậu sâu hơn — thử đo nhanh nhé? Chỉ 2 phút thôi.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {msg.suggestPhq9 && (
              <button type="button" onClick={() => onStartTest("phq9")}
                className="px-2.5 py-1.5 text-[9.5px] font-bold rounded-xl bg-rose-500/12 hover:bg-rose-500/20 border border-rose-300/40 dark:border-rose-700/30 text-rose-600 dark:text-rose-400 transition-all active:scale-95">
                PHQ-9 · Trầm cảm
              </button>
            )}
            {msg.suggestGad7 && (
              <button type="button" onClick={() => onStartTest("gad7")}
                className="px-2.5 py-1.5 text-[9.5px] font-bold rounded-xl bg-cyan-500/12 hover:bg-cyan-500/20 border border-cyan-300/40 dark:border-cyan-700/30 text-cyan-600 dark:text-cyan-400 transition-all active:scale-95">
                GAD-7 · Lo âu
              </button>
            )}
            {msg.suggestWho5 && (
              <button type="button" onClick={() => onStartTest("who5")}
                className="px-2.5 py-1.5 text-[9.5px] font-bold rounded-xl bg-emerald-500/12 hover:bg-emerald-500/20 border border-emerald-300/40 dark:border-emerald-700/30 text-emerald-600 dark:text-emerald-400 transition-all active:scale-95">
                WHO-5 · Hạnh phúc
              </button>
            )}
            {msg.suggestBigFive && (
              <button type="button" onClick={() => onStartTest("bigfive")}
                className="px-2.5 py-1.5 text-[9.5px] font-bold rounded-xl bg-indigo-500/12 hover:bg-indigo-500/20 border border-indigo-300/40 dark:border-indigo-700/30 text-indigo-600 dark:text-indigo-400 transition-all active:scale-95">
                Big Five · Nhân cách
              </button>
            )}
          </div>
          <p className="text-[8.5px] text-muted-foreground/70">Không muốn làm ngay cũng ổn — cứ tâm sự tiếp nha!</p>
        </div>
      )}

      {/* Crisis call card */}
      {Array.isArray(msg.quickActions) && msg.quickActions.some(a => a.tel) && (
        <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-700/50 space-y-2 w-full max-w-[270px]">
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <span className="material-symbols-outlined text-[15px]">emergency</span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Gọi ngay để được giúp đỡ</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {msg.quickActions.filter(a => a.tel).map((action, i) => (
              <a key={i} href={`tel:${action.tel}`}
                className="w-full py-2 text-[11px] font-extrabold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all active:scale-95 text-center flex items-center justify-center gap-1.5">
                {action.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* JOY unlock card */}
      {Array.isArray(msg.quickActions) && msg.quickActions.some(a => a.type === "unlock") && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/40 space-y-2 w-full max-w-[270px]">
          {msg.quickActions.filter(a => a.type === "unlock").map((action, i) => (
            <button key={i} type="button" disabled={unlockingMethodId === action.methodId}
              onClick={() => onUnlockFeature?.(action)}
              className="w-full py-2 text-[11px] font-extrabold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl transition-all active:scale-95 text-center flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">paid</span>
              {unlockingMethodId === action.methodId ? "Đang xử lý..." : action.label}
            </button>
          ))}
        </div>
      )}

      {/* Locked-field → verification form redirect */}
      {Array.isArray(msg.quickActions) && msg.quickActions.some(a => a.type === "verify_form") && (
        <div className="w-full max-w-[270px]">
          {msg.quickActions.filter(a => a.type === "verify_form").map((action, i) => (
            <button key={i} type="button" onClick={() => onOpenVerification?.()}
              className="w-full py-2.5 text-[11px] font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">verified_user</span>
              {action.label || "Mở form xác minh"}
            </button>
          ))}
        </div>
      )}

      {/* Journey duration picker */}
      {msg.isCompanionSetup && !msg.selectedChoice && (
        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/25 border border-indigo-200/60 dark:border-indigo-700/30 space-y-2 w-full max-w-[250px]">
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <Heart className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Chọn lộ trình</span>
          </div>
          <button type="button" onClick={() => onSelectDuration(msg.id, msg.recommendedDays)}
            className="w-full py-2 text-[11px] font-extrabold bg-primary hover:bg-blue-600 text-white rounded-xl transition-all active:scale-95">
            Đồng ý ({msg.recommendedDays} ngày)
          </button>
          <div className="grid grid-cols-3 gap-1">
            {[7, 14, 30, 50, 90].map(d => (
              <button key={d} type="button" onClick={() => onSelectDuration(msg.id, d)}
                className="py-1.5 text-[9px] font-bold bg-muted text-muted-foreground rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95">
                {d}ngày
              </button>
            ))}
          </div>
          <button type="button" onClick={() => onSelectDuration(msg.id, "cancel")}
            className="w-full py-1.5 text-[10px] font-medium text-zinc-400 border border-border rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
            Để sau
          </button>
        </div>
      )}
      {msg.isCompanionSetup && msg.selectedChoice && (
        <span className="text-[9px] text-zinc-400 px-1">
          Đã chọn: {msg.selectedChoice === "cancel" ? "Từ chối" : `${msg.selectedChoice} ngày`}
        </span>
      )}

    </div>
  );
}

function UserBubble({ msg }) {
  return (
    <div className="px-5 py-3.5 text-[12.5px] md:text-[14px] leading-relaxed bg-gradient-to-br from-[#0071e3] to-[#5856d6] text-white rounded-[24px] rounded-tr-[8px] shadow-[0_8px_32px_rgba(0,113,227,0.3),inset_0_2px_6px_rgba(255,255,255,0.25)] border border-border/20/[0.15] max-w-full">
      <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
    </div>
  );
}

// ─── Main ChatMessages component ──────────────────────────────────────────────
function ChatMessages({
  messages,
  completedMessageIds,
  setCompletedMessageIds,
  onStartTest,
  onSelectDuration,
  loading,
  typingLabel = "Đang soạn tin...",
  onNavigateToTab,
  messagesEndRef,
  onUnlockFeature,
  unlockingMethodId,
  onMoodSelect,
  moodCheckinDone,
  onOpenVerification,
  keyboardInset = 0,
}) {
  const [showScrollBtn, setShowScrollBtn] = React.useState(false);
  const containerRef = React.useRef(null);
  const userScrolledUpRef = React.useRef(false);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUpRef.current = dist > 80;
    setShowScrollBtn(dist > 80);
  };
  const scrollToBottom = (behavior = "auto") => {
    const el = containerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  };

  React.useEffect(() => {
    if (!userScrolledUpRef.current) requestAnimationFrame(() => scrollToBottom("smooth"));
  }, [messages, loading]);

  // When the keyboard opens (inset grows), keep the latest message in view above
  // the lifted input bar — mirrors how native chat apps stay pinned to bottom.
  React.useEffect(() => {
    if (keyboardInset > 0 && !userScrolledUpRef.current) {
      requestAnimationFrame(() => scrollToBottom("smooth"));
    }
  }, [keyboardInset]);  

  React.useLayoutEffect(() => { scrollToBottom("auto"); }, []);

  return (
    <div className="relative h-full">
      {/* ─── Scrollable message list ─── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 space-y-1"
        style={{
          scrollbarWidth: "thin",
          // Extra clearance so the last message clears the keyboard-lifted input.
          paddingBottom: keyboardInset > 0 ? `${keyboardInset}px` : undefined,
        }}
      >
        {/* Date separator */}
        <div className="flex items-center gap-3 pb-3">
          <div className="flex-1 h-px bg-muted/50/[0.06]" />
          <span className="text-[10px] font-semibold text-muted-foreground/70 px-3 py-1 rounded-full bg-muted/[0.05] select-none">
            {new Date().toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "numeric" })}
          </span>
          <div className="flex-1 h-px bg-muted/50/[0.06]" />
        </div>

        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => {
            const isBot = msg.sender === "bot";
            const isPrecedingBotTyping = messages.slice(0, index).some(
              m => m.sender === "bot" && m.id !== "init" && !completedMessageIds.has(m.id)
            );
            if (isPrecedingBotTyping) return null;

            return (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className={`flex flex-col ${isBot ? "items-start" : "items-end"} mb-4`}
              >
                <div className={`flex items-end gap-2.5 w-full ${isBot ? "justify-start" : "justify-end"}`}>
                  {/* Bot avatar */}
                  {isBot && (
                    <div className="w-8 h-8 rounded-2xl overflow-hidden shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.4)] bg-gradient-to-br from-[#5856d6] to-[#0071e3] flex items-center justify-center relative z-10">
                      <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[80%] sm:max-w-[72%] ${isBot ? "items-start" : "items-end"}`}>
                    {isBot
                      ? <BotBubble msg={msg} completedMessageIds={completedMessageIds} setCompletedMessageIds={setCompletedMessageIds}
                          onStartTest={onStartTest}
                          onSelectDuration={onSelectDuration} onNavigateToTab={onNavigateToTab}
                          onUnlockFeature={onUnlockFeature} unlockingMethodId={unlockingMethodId}
                          onMoodSelect={onMoodSelect} moodCheckinDone={moodCheckinDone} onOpenVerification={onOpenVerification} />
                      : <UserBubble msg={msg} />}
                  </div>
                </div>

                {/* Timestamp */}
                <div className={`flex items-center gap-1.5 mt-1.5 ${isBot ? "ml-11" : "mr-1"}`}>
                  <span className="text-[9.5px] text-muted-foreground/70 font-medium">
                    {new Date(msg.time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {msg.timeLeft !== undefined && (
                    <span className="text-[9.5px] text-orange-500 font-black animate-pulse flex items-center gap-0.5">
                      🔥 {msg.timeLeft}s
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div key="typing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-end gap-2.5 justify-start mb-1">
              <div className="relative">
                <div className="w-8 h-8 rounded-2xl shrink-0 bg-gradient-to-br from-[#5856d6] to-[#0071e3] flex items-center justify-center shadow-sm relative z-10">
                  <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                </div>
                <div className="absolute inset-0 bg-blue-500 rounded-2xl animate-ping opacity-20" />
              </div>
              <div className="px-4 py-3 bg-card/80 backdrop-blur-md rounded-[20px] rounded-tl-[6px] border border-border/60/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] flex items-center gap-2.5">
                <span className="flex items-center gap-[3px]">
                  {[0, 150, 300].map((delay, i) => (
                    <span key={delay} className={`w-1.5 h-1.5 rounded-full animate-bounce ${i === 0 ? "bg-blue-500" : i === 1 ? "bg-indigo-500" : "bg-purple-500"}`}
                      style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} className="h-32" />
      </div>

      {/* Scroll-to-bottom FAB */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            key="fab" type="button"
            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={() => { userScrolledUpRef.current = false; scrollToBottom("smooth"); }}
            className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-full bg-white dark:bg-[#1e1d2c] border border-border shadow-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-90 transition-all"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(ChatMessages);
