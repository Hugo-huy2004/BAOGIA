import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import confetti from "canvas-confetti";
import { CLINICAL_TESTS } from "./clinicalTests";
import ChatMessages from "./ChatMessages";
import ClinicalTestPanel from "./ClinicalTestPanel";
import ClinicScanner from "./ClinicScanner";
import TherapyTab from "./TherapyTab";
import ChatInputBar from "./ChatInputBar";
import { RenderColoredText } from "../../HugoLogo";
import { webPushHelper } from "../../../utils/webPushHelper";

import BotManager from "../../../services/classes/CompanionBot/BotManager";
import { findMatchingIntent, removeVietnameseTones } from "./constants/intentClassifier";
import { DIALOGUE_TREE, COMPANION_DIALOGUE_TREE } from "./constants/chatDialogues";

// Short-label overrides for dialogue aspect chips (mobile space-saving).
// Falls back to the full `a.text` from the tree if a key is missing.
const ASPECT_LABELS = {};
import { THERAPY_METHODS } from "./constants/therapyMethods";
import WellnessRecommendationEngine from "../../../services/classes/CompanionBot/WellnessRecommendationEngine";
import { useJoyStore } from "../../../stores/joyStore";

// Raw chat text is only kept for 7 days — older messages are permanently
// dropped to keep the stored history light. Long-term "memory" instead comes
// from historyLogs (mood check-ins, test scores), which are NOT pruned here —
// the AI leans on those aggregated indicators to still feel like it
// remembers the user well beyond the 7-day chat window.
const CHAT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
function pruneOldMessages(msgs) {
  if (!Array.isArray(msgs)) return msgs;
  const cutoff = Date.now() - CHAT_RETENTION_MS;
  return msgs.filter(m => {
    const t = m.time instanceof Date ? m.time.getTime() : new Date(m.time).getTime();
    return Number.isNaN(t) || t >= cutoff;
  });
}

const MOOD_META = {
  5: { emoji: "😄", label: "Rất tốt" },
  4: { emoji: "🙂", label: "Tốt" },
  3: { emoji: "😐", label: "Bình thường" },
  2: { emoji: "😔", label: "Mỏi mệt" },
  1: { emoji: "😣", label: "Kiệt sức" },
};



function WellnessInsightStrip({ bio, historyLogs, chatMessages, onNavigateToTab }) {
  // Collapsed by default — this strip used to always show the full suggestion
  // list (icon + label + reason per card) pinned above the chat, which on a
  // phone ate most of the screen before any actual conversation was visible.
  // Now it's a single compact teaser pill that expands on tap.
  const [expanded, setExpanded] = useState(false);
  const { latestMood, streak, trend, latestClinical, recommendations } = React.useMemo(() => {
    return WellnessRecommendationEngine.generateSuggestions(bio, historyLogs, chatMessages);
  }, [bio, historyLogs, chatMessages]);

  const moodMeta = latestMood ? MOOD_META[latestMood] : null;

  const trendMeta = {
    up: { icon: "trending_up", label: "Cải thiện", cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
    down: { icon: "trending_down", label: "Cần chú ý", cls: "text-rose-600 dark:text-rose-400 bg-rose-500/10" },
    stable: { icon: "trending_flat", label: "Ổn định", cls: "text-zinc-500 dark:text-zinc-400 bg-zinc-500/10" },
  }[trend || "stable"];

  return (
    <div className="space-y-2 py-2">
      {/* Mini Stats Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide px-4">
        <span className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/70 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
          {moodMeta ? <>{moodMeta.emoji} {moodMeta.label}</> : <>— Chưa check-in</>}
        </span>
        <span className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-[10px] font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
          {streak} ngày
        </span>
        <span className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${trendMeta.cls}`}>
          <span className="material-symbols-outlined text-[12px]">{trendMeta.icon}</span>
          {trendMeta.label}
        </span>
        {latestClinical && (
          <button
            type="button"
            onClick={() => onNavigateToTab?.("evaluation")}
            className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-500/10 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[12px]">monitoring</span>
            {(latestClinical.test || "test").toUpperCase()} · Xem đánh giá
          </button>
        )}
      </div>

      {/* Smart Suggestions — collapsed teaser by default, expands on tap */}
      {recommendations && recommendations.length > 0 && (
        <div className="px-4 pb-1 space-y-1.5">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-between gap-2 text-left"
          >
            <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
              💡 {recommendations.length} gợi ý dành riêng cho cậu hôm nay
            </p>
            <span className="material-symbols-outlined text-[14px] text-zinc-400 transition-transform" style={{ transform: expanded ? "rotate(180deg)" : "none" }}>
              expand_more
            </span>
          </button>
          {expanded && (
          <div className="flex flex-col gap-2">
            {recommendations.map((suggestion, idx) => (
              <button
                key={`${suggestion.id}-${idx}`}
                type="button"
                onClick={() => {
                  if (suggestion.type === "therapy") {
                    onNavigateToTab?.("therapy", suggestion.id);
                  } else if (suggestion.type === "test") {
                    onNavigateToTab?.("evaluation");
                  } else if (suggestion.type === "unlock") {
                    onNavigateToTab?.("therapy");
                  }
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/5 to-violet-500/5 hover:from-indigo-500/10 hover:to-violet-500/10 border border-zinc-100 dark:border-zinc-800/80 text-left active:scale-[0.99] transition-all"
              >
                <span className="shrink-0 w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">
                    {suggestion.icon === "air" ? "wind_power" : suggestion.icon === "lock" ? "lock" : suggestion.icon === "spa" ? "spa" : "psychology"}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10.5px] font-black text-indigo-700 dark:text-indigo-450 leading-tight">{suggestion.label}</span>
                  <span className="block text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{suggestion.reason}</span>
                </span>
                <span className="material-symbols-outlined text-[16px] text-indigo-400 shrink-0">chevron_right</span>
              </button>
            ))}
          </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatTab({ 
  onNavigateToTab, 
  bio, 
  historyLogs, 
  onUpdateCompanionState, 
  chatMessages, 
  presetTest, 
  setPresetTest, 
  showToast, 
  healingActive,
  onProfileUpdate,
  onExitFullscreen,
  journeyProgress
}) {
  const [completedMessageIds, setCompletedMessageIds] = useState(new Set());
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTestsMenu, setShowTestsMenu] = useState(false);
  const [showTherapyOverlay, setShowTherapyOverlay] = useState(false);
  const [therapyInitialMethod, setTherapyInitialMethod] = useState(null);
  const [unlockingMethodId, setUnlockingMethodId] = useState(null);
  const joyBalance = useJoyStore(s => s.balance);
  const fetchJoyBalance = useJoyStore(s => s.fetchBalance);

  const [isVentingMode, setIsVentingMode] = useState(false);
  const [ventingTimerMinutes, setVentingTimerMinutes] = useState(1);
  const [normalMessagesBackup, setNormalMessagesBackup] = useState([]);

  const glowStyle = `
    @keyframes candleBreathe {
      0%, 100% { box-shadow: inset 0 0 40px rgba(251, 146, 60, 0.08); background-color: rgba(251, 146, 60, 0.03); }
      50% { box-shadow: inset 0 0 80px rgba(251, 146, 60, 0.16); background-color: rgba(251, 146, 60, 0.06); }
    }
    .candle-glow-bg {
      animation: candleBreathe 4s ease-in-out infinite;
    }
  `;

  const toggleVentingMode = () => {
    if (!isVentingMode) {
      setNormalMessagesBackup(messages);
      setIsVentingMode(true);
      setMessages([
        {
          id: `venting-greet-${Date.now()}`,
          sender: "bot",
          text: "🕯️ Cậu đang bước vào **Không gian Trút Bầu Tâm Sự An Toàn**. Tại đây, mọi tin nhắn gửi đi sẽ tự hủy sau thời gian đã chọn và hoàn toàn **không lưu lại bất cứ dấu vết nào** trong cơ sở dữ liệu hay bộ nhớ thiết bị. Hãy thoải mái trút bỏ mọi muộn phiền nhé.",
          time: new Date(),
          timeLeft: ventingTimerMinutes * 60
        }
      ]);
      showToast?.("Đã kích hoạt chế độ trút giận an toàn!", "success");
    } else {
      setIsVentingMode(false);
      setMessages(normalMessagesBackup);
      showToast?.("Đã quay lại chế độ trò chuyện thông thường.", "info");
    }
  };

  useEffect(() => {
    if (!isVentingMode) return;
    const interval = setInterval(() => {
      setMessages(prev => {
        const updated = prev.map(m => {
          if (m.timeLeft !== undefined) {
            return { ...m, timeLeft: m.timeLeft - 1 };
          }
          return m;
        });
        return updated.filter(m => m.timeLeft === undefined || m.timeLeft > 0);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isVentingMode]);

  const botManager = React.useMemo(() => new BotManager(bio, historyLogs, healingActive), [bio, historyLogs, healingActive]);

  // Fire-and-forget: the moment the local crisis detector fires (real-time,
  // before any network round-trip for the reply itself), tell Admin right
  // away with enough context to call the member back without digging through
  // history — bypasses the slower chatDistressCount accumulation entirely.
  const reportCrisisToAdmin = useCallback((triggerText, recentMessages) => {
    const apiBase = import.meta.env.VITE_API_URL || "/api";
    const summary = recentMessages
      .slice(-6)
      .map(m => `${m.sender === "user" ? "Người dùng" : "AI"}: ${m.text}`)
      .join("\n");
    fetch(`${apiBase}/companion/crisis-alert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: bio?.email, trigger: triggerText, conversationSummary: summary })
    }).catch(() => {});
  }, [bio?.email]);

  // Local intents now return an array of 2-3 short chunks instead of one long
  // paragraph — this drips them in one at a time (with a human-ish pause
  // between each) so a single intent reply reads like a real person texting
  // a few short messages in a row, not a wall of text. Extras (suggestPhq9
  // etc., used to render the test-shortcut buttons) only attach to the last
  // chunk. Resolves once the final chunk has been appended.
  const pushBotMessageChunks = useCallback((replyOrChunks, extra = {}) => {
    const chunks = Array.isArray(replyOrChunks) ? replyOrChunks : [replyOrChunks];
    return new Promise((resolve) => {
      chunks.forEach((chunkText, idx) => {
        setTimeout(() => {
          const isLast = idx === chunks.length - 1;
          setMessages(prev => [...prev, {
            id: `bot-text-${Date.now()}-${idx}`,
            sender: "bot",
            text: chunkText,
            time: new Date(),
            ...(isLast ? extra : {})
          }]);
          if (isLast) resolve();
        }, idx === 0 ? 0 : 550 + Math.random() * 350);
      });
    });
  }, []);

  // Buy-now from the chat's "unlock" quick action (see therapy_locked intent
  // in intentClassifier.js) — same endpoint/flow as TherapyTab's own unlock
  // button, just triggered from a chat bubble instead of the grid card.
  const handleUnlockFeature = useCallback(async (action) => {
    if (!bio?.email || unlockingMethodId) return;
    if (joyBalance < action.cost) {
      showToast?.(`Bạn cần ${action.cost} JOY để mở khoá tính năng này. Số dư hiện tại: ${joyBalance} JOY.`, "warning");
      return;
    }
    setUnlockingMethodId(action.methodId);
    try {
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const r = await fetch(`${apiBase}/companion/unlock-feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: bio.email, feature: action.lockKey }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Không thể mở khoá tính năng này.");
      onProfileUpdate?.({ unlockedCompanionFeatures: data.unlockedFeatures || [] });
      fetchJoyBalance(bio.email);
      const method = THERAPY_METHODS.find(m => m.id === action.methodId);
      pushBotMessageChunks([`Đã mở khoá xong rồi nè! 🎉 Mở "${method?.name || action.label}" cho cậu luôn đây.`]);
      setTherapyInitialMethod(action.methodId);
      setShowTherapyOverlay(true);
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setUnlockingMethodId(null);
    }
  }, [bio?.email, unlockingMethodId, joyBalance, onProfileUpdate, fetchJoyBalance, showToast, pushBotMessageChunks]);

  const runSleepSummary = useCallback(async () => {
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const r = await fetch(`${apiBase}/sleep?email=${encodeURIComponent(bio?.email || "")}&limit=14`, { credentials: "include" });
      const data = await r.json();
      const logs = data?.logs || [];
      const stats = data?.stats || {};
      const qualityLabel = (q) => q >= 4.5 ? "rất tốt" : q >= 3.5 ? "tốt" : q >= 2.5 ? "trung bình" : "kém";
      if (!logs.length) {
        await pushBotMessageChunks(["Tớ chưa thấy dữ liệu giấc ngủ nào của cậu cả.", "Cậu ghi lại giấc ngủ ở mục Giấc Ngủ, hoặc bật tự động phát hiện trong hồ sơ nhé."]);
      } else {
        const latest = logs[0];
        const lines = [
          `🌙 Đêm gần nhất (${new Date(latest.date).toLocaleDateString("vi-VN")}): ngủ ${latest.duration ?? "?"} giờ, chất lượng ${qualityLabel(latest.quality || 3)}.`,
          `Trung bình ${stats.total || logs.length} đêm gần đây: ${stats.avgDuration ?? "?"} giờ/đêm, chất lượng ${qualityLabel(stats.avgQuality || 3)}.`
        ];
        if (stats.avgDuration && stats.avgDuration < 6) lines.push("Cậu đang ngủ khá ít so với mức khuyến nghị (7–9 giờ) — thử ngủ sớm hơn vài đêm xem sao nhé.");
        await pushBotMessageChunks(lines);
      }
    } catch (_) {
      await pushBotMessageChunks(["Tớ chưa lấy được dữ liệu giấc ngủ lúc này, cậu thử lại sau nhé."]);
    } finally {
      setLoading(false);
    }
  }, [bio?.email, pushBotMessageChunks]);

  // Free-text equivalent of "Xem đánh giá giấc ngủ" — needs a network call so
  // it can't live in the synchronous intentClassifier.js, hence the special
  // case here ahead of the local/AI intent pipeline in handleSendFreeText.
  const SLEEP_SUMMARY_KEYWORDS = ["danh gia giac ngu", "giac ngu cua toi", "giac ngu cua to", "tinh trang giac ngu", "ngu the nao", "ngu co tot khong"];
  const isSleepSummaryRequest = (text) => {
    const clean = removeVietnameseTones(text).toLowerCase();
    return SLEEP_SUMMARY_KEYWORDS.some(kw => clean.includes(kw));
  };

  // Auto-launch preset test from redirects
  useEffect(() => {
    if (presetTest) {
      handleStartTest(presetTest);
      if (setPresetTest) {
        setPresetTest(null);
      }
    }
  }, [presetTest]);

  // dialogStage only still exists for a handful of internal setDialogStage(...)
  // writes deep in test/scan completion logic below — the guided dialogue-tree
  // UI that used to read it (topic/severity chips) is gone (free-text + LLM
  // intent only, per design), so nothing reads this value anymore. Left as
  // dead state rather than touching every one of those call sites for zero
  // behavior change.
  const [dialogStage, setDialogStage] = useState(1);

  // chatMode: 'normal' | 'test' | 'scan'
  const [chatMode, setChatMode] = useState("normal");
  const [activeTest, setActiveTest] = useState(null);
  // Second line of defense against handleTestComplete firing twice (e.g. if
  // ClinicalTestPanel's own submitting-guard is ever bypassed) — a ref (not
  // state) so the very first synchronous line of the function can check it
  // without waiting for a re-render.
  const testCompletingRef = useRef(false);
  const [isListening, setIsListening] = useState(false);

  const [remainingChatTokens, setRemainingChatTokens] = useState(10);
  const [tokenLockMinutes, setTokenLockMinutes] = useState(0);
  const [inputText, setInputText] = useState("");

  // Server (rate_limit_service) is the source of truth for the daily chat budget —
  // refresh from it instead of guessing locally, so the badge never goes stale.
  const refreshRemainingTokens = useCallback(async () => {
    const data = await botManager.getRemainingTokens();
    if (data && typeof data.remaining === "number") {
      setRemainingChatTokens(data.remaining);
      setTokenLockMinutes(data.locked ? (data.lockMinutes || 180) : 0);
    }
  }, [botManager]);

  useEffect(() => {
    refreshRemainingTokens();
  }, [refreshRemainingTokens]);

  const messagesEndRef = useRef(null);
  const lastSavedMessageIdRef = useRef("");
  const inputRef = useRef(null);
  const chatWrapperRef = useRef(null);

  // The chat frame follows the visual viewport so the composer stays above the
  // on-screen keyboard. Only the message list scrolls, like a native chat app.
  useLayoutEffect(() => {
    const el = chatWrapperRef.current;
    if (!el) return;
    let raf = 0;
    let lastHeight = 0;
    let lastTop = "";
    const setH = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const viewportHeight = vv?.height ?? window.innerHeight;
        const viewportTop = vv?.offsetTop ?? 0;
        const isMobile = window.innerWidth < 768;
        const top = Math.max(0, el.getBoundingClientRect().top);
        let nextHeight;

        if (isMobile && onExitFullscreen) {
          el.style.position = "fixed";
          el.style.left = "0";
          el.style.right = "0";
          const nextTop = `${Math.floor(viewportTop)}px`;
          if (nextTop !== lastTop) {
            lastTop = nextTop;
            el.style.top = nextTop;
          }
          el.style.width = "100vw";
          el.style.zIndex = "130";
          nextHeight = viewportHeight;
        } else if (!isMobile) {
          el.style.position = "relative";
          el.style.left = "";
          el.style.right = "";
          el.style.top = "";
          el.style.width = "";
          el.style.zIndex = "";
          nextHeight = Math.min(760, Math.max(520, viewportHeight - top - 24));
        } else {
          el.style.position = "relative";
          el.style.left = "";
          el.style.right = "";
          el.style.top = "";
          el.style.width = "";
          el.style.zIndex = "";
          nextHeight = viewportHeight - top;
        }

        nextHeight = Math.floor(nextHeight);
        if (nextHeight > 240 && Math.abs(nextHeight - lastHeight) > 1) {
          lastHeight = nextHeight;
          el.style.height = `${nextHeight}px`;
          el.style.maxHeight = `${nextHeight}px`;
        }
        el.style.minHeight = "0";
        el.style.overflow = "hidden";
      });
    };
    setH();
    // Re-measure after entry animation (200ms) and again after layout settles
    const t1 = setTimeout(setH, 220);
    const t2 = setTimeout(setH, 500);
    window.addEventListener("resize", setH);
    window.visualViewport?.addEventListener("resize", setH);
    window.visualViewport?.addEventListener("scroll", setH);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", setH);
      window.visualViewport?.removeEventListener("resize", setH);
      window.visualViewport?.removeEventListener("scroll", setH);
      el.style.position = "";
      el.style.left = "";
      el.style.right = "";
      el.style.top = "";
      el.style.width = "";
      el.style.zIndex = "";
    };
  }, [onExitFullscreen]);

  // Sync messages state when chatMessages prop updates from DB
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      const currentLastId = messages.length > 0 ? messages[messages.length - 1].id : null;
      const incomingLastId = chatMessages[chatMessages.length - 1].id;
      
      // Do not downgrade local messages if local is already ahead or identical
      if (messages.length > chatMessages.length || (messages.length === chatMessages.length && currentLastId === incomingLastId)) {
        return;
      }

      const mapped = pruneOldMessages(chatMessages.map(m => ({
        ...m,
        time: m.time instanceof Date ? m.time : new Date(m.time)
      })));
      setMessages(mapped);
      lastSavedMessageIdRef.current = incomingLastId;
      const ids = mapped.map(m => m.id);
      setCompletedMessageIds(new Set(ids));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages]);

  // Load chat messages from local storage/cache on mount
  useEffect(() => {
    const initBot = async () => {
      if (bio?.email) {
      const localMsgs = localStorage.getItem("banhocduong_chat_messages");
      if (localMsgs) {
        try {
          const parsed = JSON.parse(localMsgs);
          if (parsed.length > 0) {
            const mapped = pruneOldMessages(parsed.map(m => ({ ...m, time: new Date(m.time) })));
            if (mapped.length > 0) {
              setMessages(mapped);
              lastSavedMessageIdRef.current = mapped[mapped.length - 1].id;

              // Mark all existing loaded messages as completed immediately
              const ids = mapped.map(m => m.id);
              setCompletedMessageIds(new Set(ids));
              return;
            }
            // Everything loaded was older than the 7-day retention window —
            // fall through to the fresh greeting below instead of showing an
            // empty chat.
          }
        } catch (e) {
          console.error("Failed to parse local chat messages", e);
        }
      }

      // Fallback: If no history exists, set the initial bot greeting based on companion status
      // Bỏ greeting tĩnh, thay bằng botManager
      const botManagerInstance = new BotManager(bio, historyLogs, healingActive);
      const greetingText = await botManagerInstance.getGreeting();

      const initMsg = {
        id: "init",
        sender: "bot",
        text: greetingText,
        time: new Date()
      };
      setMessages([initMsg]);
      setCompletedMessageIds(new Set(["init"]));
      lastSavedMessageIdRef.current = "init";
    }
    };
    initBot();
  }, [bio ? bio.email : null, healingActive]);

  // Auto-save new chat messages to MongoDB and sync to localStorage synchronously to prevent tab unmount data loss
  useEffect(() => {
    if (messages.length > 0 && !isVentingMode) {
      const trimmed = pruneOldMessages(messages);
      localStorage.setItem("banhocduong_chat_messages", JSON.stringify(trimmed));

      const lastMsg = trimmed[trimmed.length - 1];
      if (lastMsg && lastMsg.id !== lastSavedMessageIdRef.current) {
        lastSavedMessageIdRef.current = lastMsg.id;
        onUpdateCompanionState({ chatMessages: trimmed });
      }
    }
  }, [messages, isVentingMode]);





  const startListening = () => {
    if (isListening && window.activeRecognition) {
      try {
        window.activeRecognition.stop();
      } catch (_) {}
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast && showToast("Trình duyệt không hỗ trợ nhận diện giọng nói.", "error");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      window.activeRecognition = recognition;
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev ? prev + " " + transcript : transcript);
      if (inputRef.current) {
        setTimeout(() => {
          inputRef.current.style.height = 'auto';
          inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 96) + 'px';
        }, 50);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      window.activeRecognition = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      window.activeRecognition = null;
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };


  // Duration adjustments agreement option
  // Stable identity (useCallback) is what lets ChatMessages.jsx's React.memo
  // actually skip re-rendering the message list on every keystroke elsewhere
  // in this component — an inline function prop would defeat memo entirely.
  const handleSelectDuration = useCallback((msgId, duration) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return { ...m, selectedChoice: duration };
        }
        return m;
      })
    );

    if (typeof duration === "number") {
      const isCurrentlyActive = healingActive;
      const healingStartDateStr = localStorage.getItem("banhocduong_healing_start_date") || "";
      let currentDay = 1;
      if (healingStartDateStr) {
        const start = new Date(healingStartDateStr).getTime();
        const now = new Date().getTime();
        currentDay = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1);
      }

      const updatedLogs = [...historyLogs, {
        date: new Date().toISOString(),
        type: "duration_change",
        reason: isCurrentlyActive
          ? `Điều chỉnh thời gian lộ trình đồng hành thành: ${duration} ngày.`
          : `Kích hoạt lộ trình đồng hành: ${duration} ngày.`
      }];
      
      onUpdateCompanionState({
        healingActive: true,
        healingDuration: duration,
        healingStartDate: isCurrentlyActive 
          ? (healingStartDateStr || new Date().toISOString())
          : new Date().toISOString(),
        historyLogs: updatedLogs
      });

      // Request push notification permission and register service worker subscription
      if (webPushHelper.isSupported()) {
        webPushHelper.requestPermission().then((permission) => {
          if (permission === 'granted' && bio && bio.email) {
            webPushHelper.registerAndSubscribe(bio.email).catch((err) => {
              console.error('Failed to register web push subscription:', err);
            });
          }
        });
      }

      const userMsg = {
        id: `user-select-${Date.now()}`,
        sender: "user",
        text: isCurrentlyActive
          ? `Dạ, tớ đồng ý điều chỉnh thời gian lộ trình thành ${duration} ngày cùng cậu.`
          : `Dạ, tớ đồng ý kích hoạt lộ trình trị liệu ${duration} ngày cùng cậu.`,
        time: new Date()
      };
      const botMsg = {
        id: `bot-confirm-${Date.now()}`,
        sender: "bot",
        text: isCurrentlyActive
          ? `Tớ đã cập nhật tổng thời gian lộ trình đồng hành thành ${duration} ngày cho cậu rồi. Mọi dữ liệu check-in và tiến trình ngày thứ ${currentDay} của cậu đều được giữ nguyên vẹn nhé cậu yêu! 🌟`
          : `Tớ đã thiết lập lộ trình đồng hành ${duration} ngày cho cậu rồi. Kể từ ngày mai, cậu hãy duy trì việc check-in cảm xúc hằng ngày tại đây để nhận các bài tập tự chữa lành thích ứng từ tớ nhé.`,
        time: new Date(),
        showTherapyButton: true
      };
      setMessages((prev) => [...prev, userMsg, botMsg]);
    } else {
      const userMsg = {
        id: `user-select-${Date.now()}`,
        sender: "user",
        text: `Tớ chưa muốn tham gia lộ trình lúc này.`,
        time: new Date()
      };
      const botMsg = {
        id: `bot-confirm-${Date.now()}`,
        sender: "bot",
        text: `Tớ tôn trọng quyết định của cậu. Bất cứ khi nào cảm thấy cần người đồng hành hoặc muốn thực hiện kiểm tra tinh thần, cậu luôn có thể trò chuyện với tớ tại đây nhé. Chúc cậu luôn bình yên!`,
        time: new Date()
      };
      setMessages((prev) => [...prev, userMsg, botMsg]);
    }
    setDialogStage(0);
  }, [historyLogs, healingActive, onUpdateCompanionState, bio]);

  const handleStartTest = useCallback((testId) => {
    const baseTest = CLINICAL_TESTS[testId];
    if (!baseTest) return;

    // Sample a random variant for each question index
    let randomizedQuestions = [];
    if (baseTest.questionPool) {
      randomizedQuestions = baseTest.questionPool.map((variants) => {
        const idx = Math.floor(Math.random() * variants.length);
        return variants[idx];
      });
    } else {
      randomizedQuestions = [...baseTest.questions];
    }

    const testInstance = {
      ...baseTest,
      questions: randomizedQuestions
    };

    setShowTestsMenu(false);
    setChatMode("test");
    setActiveTest(testInstance);

    const userMsg = {
      id: `user-test-${Date.now()}`,
      sender: "user",
      text: `Tớ muốn thực hiện bài test ${baseTest.name}`,
      time: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 600);
  }, []);



  const handleTestComplete = async (testId, score, answers) => {
    if (testCompletingRef.current) return;
    testCompletingRef.current = true;
    try {
      await handleTestCompleteInner(testId, score, answers);
    } finally {
      testCompletingRef.current = false;
    }
  };

  const handleTestCompleteInner = async (testId, score, answers) => {
    // If DASS-42 or MMPI-30, calculate scores and route to handleScanComplete
    if (testId === "dass42") {
      let d = 0, a = 0, s = 0;
      const types = ["S","A","D","A","S","S","A","D","A","D","S","S","A","A","D","D","S","S","A","D","D"];
      answers.forEach((val, i) => {
        if (types[i] === "D") d += val * 2;
        else if (types[i] === "A") a += val * 2;
        else if (types[i] === "S") s += val * 2;
      });
      
      const resultLog = {
        date: new Date().toISOString(),
        type: "clinical_test",
        test: "dass42",
        scores: { D: d, A: a, S: s }
      };
      
      await handleScanComplete("dass", resultLog);
      return;
    }

    if (testId === "mmpi30") {
      const validity = { L: 50, F: 50, K: 50 };
      const clinical = [
        { code: "Hs", score: 50 }, { code: "D", score: 50 }, { code: "Hy", score: 50 },
        { code: "Pd", score: 50 }, { code: "Mf", score: 50 }, { code: "Pa", score: 50 },
        { code: "Pt", score: 50 }, { code: "Sc", score: 50 }, { code: "Ma", score: 50 },
        { code: "Si", score: 50 }
      ];
      const resultLog = {
        date: new Date().toISOString(),
        type: "clinical_test",
        test: "mmpi30",
        validity,
        clinical,
        isReliable: true
      };
      await handleScanComplete("mmpi", resultLog);
      return;
    }

    setLoading(true);

    let reviewText = "";
    let eventLog = null;

    // Numeric-severity gate: PHQ-9/GAD-7 minimal scores and WHO-5 "good"
    // scores already have a complete, accurate canned interpretation (see
    // clinicalTests.js) — there's nothing nuanced an LLM call adds for a
    // clean result, so skip the network/token cost entirely for those tiers.
    // Only escalate to the LLM when the score actually signals something
    // worth a more personalized response (mild-or-above distress, or low
    // wellbeing on WHO-5). Big Five has no risk tiers, so it always benefits
    // from the richer LLM phrasing.
    const needsAiForScore = (id, scoreVal) => {
      if (id === "phq9" || id === "gad7") return scoreVal > 4;
      if (id === "who5") return scoreVal * 4 < 50;
      return true;
    };

    // Call Python AI backend for analysis — only when the numeric gate above
    // says the result is worth the extra round-trip.
    let aiAnalysis = null;
    try {
      if (testId === "phq9" && needsAiForScore("phq9", score)) {
        aiAnalysis = await botManager.aiBot.analyzeTest("phq9", { score }, null, null, "vi");
      } else if (testId === "gad7" && needsAiForScore("gad7", score)) {
        aiAnalysis = await botManager.aiBot.analyzeTest("gad7", { score }, null, null, "vi");
      } else if (testId === "who5" && needsAiForScore("who5", score)) {
        aiAnalysis = await botManager.aiBot.analyzeTest("who5", { score }, null, null, "vi");
      } else if (testId === "bigfive") {
        const interpretation = CLINICAL_TESTS.bigfive.getInterpretation(answers);
        aiAnalysis = await botManager.aiBot.analyzeTest("bigfive", { traits: interpretation }, null, null, "vi");
      }
    } catch (err) {
      console.warn("Lỗi gọi AI phân tích bài test:", err);
    }

    if (testId === "phq9") {
      const interpretation = CLINICAL_TESTS.phq9.getInterpretation(score);
      reviewText = aiAnalysis || `Tớ đã hoàn thành phân tích rồi. Kết quả đánh giá Trầm cảm PHQ-9 của cậu đạt ${score}/27 điểm (${interpretation.severity}).\n\n${interpretation.desc}`;
      
      eventLog = {
        date: new Date().toISOString(),
        test: "phq9",
        score,
        severity: interpretation.severity
      };
    } else if (testId === "gad7") {
      const interpretation = CLINICAL_TESTS.gad7.getInterpretation(score);
      reviewText = aiAnalysis || `Tớ đã phân tích xong rồi. Kết quả đánh giá Lo âu GAD-7 của cậu là ${score}/21 điểm (${interpretation.severity}).\n\n${interpretation.desc}`;
      
      eventLog = {
        date: new Date().toISOString(),
        test: "gad7",
        score,
        severity: interpretation.severity
      };
    } else if (testId === "who5") {
      const interpretation = CLINICAL_TESTS.who5.getInterpretation(score);
      reviewText = aiAnalysis || `Đã có kết quả phân tích rồi nè. Chỉ số trạng thái hạnh phúc WHO-5 của cậu đạt ${score}/25 điểm (${interpretation.status}).\n\n${interpretation.desc}`;
      
      eventLog = {
        date: new Date().toISOString(),
        test: "who5",
        score,
        status: interpretation.status,
        percent: score * 4
      };
    } else if (testId === "bigfive") {
      const interpretation = CLINICAL_TESTS.bigfive.getInterpretation(answers);
      reviewText = aiAnalysis || `Biểu đồ năm nhân tố tính cách Big Five của cậu đã hoàn thành rồi:\n${interpretation.desc}\n\nTớ đã cập nhật các bài tập tự chữa lành thích ứng ở phần Trị Liệu để cậu rèn luyện hằng ngày nhé.`;
      eventLog = {
        date: new Date().toISOString(),
        type: "clinical_test",
        test: "bigfive",
        traits: {
          extraversion: parseFloat(interpretation.extraversion),
          agreeableness: parseFloat(interpretation.agreeableness),
          conscientiousness: parseFloat(interpretation.conscientiousness),
          neuroticism: parseFloat(interpretation.neuroticism),
          openness: parseFloat(interpretation.openness)
        },
        desc: interpretation.desc
      };
    }

    if (eventLog) {
      const updatedLogs = [...historyLogs, eventLog];
      onUpdateCompanionState({
        lastTestDate: new Date().toDateString(),
        historyLogs: updatedLogs
      });
    }

    const botReviewMsgId = `bot-review-${Date.now()}`;
    const botReviewMsg = {
      id: botReviewMsgId,
      sender: "bot",
      text: reviewText,
      time: new Date()
    };

    let newMsgs = [botReviewMsg];

    if (["phq9", "gad7", "who5"].includes(testId)) {
      let days = 14;
      let name = "Hành trình Chăm sóc Tinh thần (Mindfulness)";

      if (testId === "phq9") {
        if (score >= 20) { days = 90; name = "Hành trình Đồng hành Chuyên sâu (Intensive)"; }
        else if (score >= 15) { days = 50; name = "Hành trình Phục hồi Thấu cảm (Compassionate)"; }
        else if (score >= 10) { days = 30; name = "Hành trình Tái tạo Cân bằng (Balance)"; }
        else if (score >= 5) { days = 14; name = "Hành trình Chăm sóc Tinh thần (Mindfulness)"; }
        else { days = 7; name = "Hành trình Nuôi dưỡng Bình yên (Peace)"; }
      } else if (testId === "gad7") {
        if (score >= 15) { days = 50; name = "Hành trình Phục hồi Thấu cảm (Compassionate)"; }
        else if (score >= 10) { days = 30; name = "Hành trình Tái tạo Cân bằng (Balance)"; }
        else if (score >= 5) { days = 14; name = "Hành trình Chăm sóc Tinh thần (Mindfulness)"; }
        else { days = 7; name = "Hành trình Nuôi dưỡng Bình yên (Peace)"; }
      } else if (testId === "who5") {
        if (score <= 8) { days = 50; name = "Hành trình Phục hồi Thấu cảm (Compassionate)"; }
        else if (score <= 12) { days = 30; name = "Hành trình Tái tạo Cân bằng (Balance)"; }
        else if (score <= 17) { days = 14; name = "Hành trình Chăm sóc Tinh thần (Mindfulness)"; }
        else { days = 7; name = "Hành trình Nuôi dưỡng Bình yên (Peace)"; }
      }

      // Check if this test score is worse than the previous test result of the same type
      const pastTests = historyLogs.filter(log => (log.test === testId || (testId === "who5" && log.type === "clinical_test" && log.test === "who5")));
      let isWorse = false;
      let isImproved = false;
      let diffVal = 0;
      if (pastTests.length > 0) {
        const lastPast = pastTests[pastTests.length - 1];
        const lastScore = lastPast.score;
        if (testId === "who5") {
          // For WHO-5, lower score is worse
          if (score < lastScore) {
            isWorse = true;
            diffVal = lastScore - score;
          } else if (score > lastScore) {
            isImproved = true;
            diffVal = score - lastScore;
          }
        } else {
          // For PHQ-9 and GAD-7, higher score is worse
          if (score > lastScore) {
            isWorse = true;
            diffVal = score - lastScore;
          } else if (score < lastScore) {
            isImproved = true;
            diffVal = lastScore - score;
          }
        }
      } else {
        // Fallback: If no past tests, compare current recommended package days with active duration
        const healingDurationVal = parseInt(localStorage.getItem("banhocduong_healing_duration") || "30", 10);
        if (days > healingDurationVal) {
          isWorse = true;
          diffVal = Math.ceil((days - healingDurationVal) / 10) || 1;
        } else if (days < healingDurationVal) {
          isImproved = true;
          diffVal = Math.ceil((healingDurationVal - days) / 10) || 1;
        }
      }

      if (healingActive) {
        // If already active, we adjust relative to the remaining duration rather than resetting from scratch
        const healingStartDateStr = localStorage.getItem("banhocduong_healing_start_date") || "";
        const healingDurationVal = parseInt(localStorage.getItem("banhocduong_healing_duration") || "30", 10);
        let progressDays = 1;
        if (healingStartDateStr) {
          const start = new Date(healingStartDateStr).getTime();
          const now = new Date().getTime();
          progressDays = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1);
        }
        const remainingDays = Math.max(0, healingDurationVal - progressDays);

        if (progressDays >= healingDurationVal) {
          // Exceeded current duration (e.g. Day 57 of a 50-day journey)
          if (isImproved || days <= 14) {
            // Suggest graduation!
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#34d399', '#f472b6', '#38bdf8']
            });
            const graduationMsg = {
              id: `bot-graduation-${Date.now() + 5}`,
              sender: "bot",
              text: `🎉 **Ghi nhận Tiến trình Phục hồi Tuyệt vời**: Chỉ số tái đánh giá ${testId.toUpperCase()} cho thấy sức khỏe tinh thần của cậu chuyển biến rất tốt và đã ổn định trở lại! \n\nCậu đã kiên trì vượt qua **${progressDays} ngày** của lộ trình tự chữa lành một cách xuất sắc. Tớ rất tự hào về cậu! Cậu hoàn toàn đã sẵn sàng để **tốt nghiệp lộ trình đồng hành** này rồi nhé. Cậu hãy bấm sang tab **Trị Liệu** hoặc **Hồ Sơ** để thực hiện tốt nghiệp nha! 🌸`,
              time: new Date(Date.now() + 5)
            };
            newMsgs.push(graduationMsg);
            setDialogStage(0);
          } else {
            // Suggest extension
            const extendDays = days;
            const finalRecommendedDuration = healingDurationVal + extendDays;
            const extensionMsg = {
              id: `bot-extend-${Date.now() + 5}`,
              sender: "bot",
              text: `📊 **Tái đánh giá Tinh thần**: Cậu đã đi qua **${progressDays} ngày** của lộ trình, nhưng kết quả test ${testId.toUpperCase()} lần này ghi nhận cậu vẫn còn gặp khá nhiều lo âu/mệt mỏi (${score} điểm). \n\nĐể tiếp tục nâng đỡ và hỗ trợ tinh thần cậu tốt nhất mà **không làm mất đi ${progressDays} ngày cậu đã kiên trì qua**, tớ đề xuất mở rộng thêm **+${extendDays} ngày** hỗ trợ (Tổng lộ trình nâng lên **${finalRecommendedDuration} ngày**, cậu còn **${remainingDays + extendDays} ngày**). Cậu có đồng ý áp dụng đề xuất thích ứng mới này không?`,
              time: new Date(Date.now() + 5),
              isCompanionSetup: true,
              recommendedDays: finalRecommendedDuration
            };
            newMsgs.push(extensionMsg);
            setDialogStage(5);
          }
        } else {
          // Within active journey
          if (isWorse) {
            // Calculate dynamically how many additional days of recovery support are needed depending on symptom surge
            let addDays = 7;
            if (testId === "phq9" && diffVal >= 5) addDays = 14;
            if (testId === "gad7" && diffVal >= 4) addDays = 14;
            if (testId === "who5" && diffVal >= 3) addDays = 10;
            if (pastTests.length === 0) addDays = Math.max(7, days - healingDurationVal);

            const finalRecommendedDuration = healingDurationVal + addDays;
            const worseningMsg = {
              id: `bot-worsening-${Date.now() + 5}`,
              sender: "bot",
              text: `📊 **Tái đánh giá Thích ứng**: Kết quả trắc nghiệm ${testId.toUpperCase()} ghi nhận chỉ số chuyển biến chưa thuận lợi (tăng ${diffVal} điểm so với lần trước). \n\nĐể hỗ trợ cậu vượt qua giai đoạn nhạy cảm này mà **không làm gián đoạn hay bác bỏ hành trình ${progressDays} ngày cậu đã cố gắng qua**, tớ đề xuất giữ nguyên tiến trình cũ và bổ sung thêm **+${addDays} ngày** hỗ trợ đặc biệt (Nâng tổng lộ trình thành **${finalRecommendedDuration} ngày**, cậu còn **${remainingDays + addDays} ngày** phía trước). Cậu có đồng ý áp dụng đề xuất này để tớ tiếp tục bên cạnh che chở cậu không?`,
              time: new Date(Date.now() + 5),
              isCompanionSetup: true,
              recommendedDays: finalRecommendedDuration
            };
            newMsgs.push(worseningMsg);
            setDialogStage(5);
          } else if (isImproved) {
            // If there is progress/improvement, check if we can reduce remaining days slightly to motivate, while keeping the journey intact
            let reduceDays = 0;
            if (pastTests.length > 0) {
              reduceDays = Math.min(Math.floor(remainingDays / 2), Math.max(3, diffVal * 2));
            } else {
              reduceDays = Math.min(Math.floor(remainingDays / 2), Math.max(3, Math.floor((healingDurationVal - days) / 2)));
            }

            if (reduceDays > 0 && remainingDays > 3) {
              const finalRecommendedDuration = Math.max(progressDays + 3, healingDurationVal - reduceDays);
              const progressMsg = {
                id: `bot-improvement-${Date.now() + 5}`,
                sender: "bot",
                text: `🎉 **Ghi nhận Tiến trình Tuyệt vời**: Chỉ số tái đánh giá tinh thần của cậu chuyển biến rất khả quan! Dưới góc nhìn khoa học hành vi, các hoạt động chánh niệm trị liệu đang thích ứng và phát huy tác dụng tích lũy lên trường năng lượng nội tại.\n\nĐể khích lệ và tối ưu lộ trình **dựa trên số liệu khoa học thực tế**, tớ đề xuất rút ngắn thời gian điều trị còn lại đi **-${reduceDays} ngày** (Tổng lộ trình đồng hành rút xuống **${finalRecommendedDuration} ngày**, cậu còn lại **${remainingDays - reduceDays} ngày** và giữ nguyên tiến trình đã tích lũy). Cậu có đồng ý áp dụng đề xuất thích ứng mới này không?`,
                time: new Date(Date.now() + 5),
                isCompanionSetup: true,
                recommendedDays: finalRecommendedDuration
              };
              newMsgs.push(progressMsg);
              setDialogStage(5);
            } else {
              // Stable
              const stayMsg = {
                id: `bot-proposal-${Date.now() + 10}`,
                sender: "bot",
                text: `Kết quả đánh giá định kỳ cho thấy tinh thần của cậu đang duy trì ở mức ổn định. Cậu hãy tiếp tục theo sát lộ trình chăm sóc hiện tại (**${remainingDays} ngày** còn lại trên tổng số **${healingDurationVal} ngày**) nhé!`,
                time: new Date(Date.now() + 10)
              };
              newMsgs.push(stayMsg);
              setDialogStage(0);
            }
          } else {
            // Stable
            const stayMsg = {
              id: `bot-proposal-${Date.now() + 10}`,
              sender: "bot",
              text: `Kết quả đánh giá định kỳ cho thấy tinh thần của cậu đang duy trì ở mức ổn định. Cậu hãy tiếp tục theo sát lộ trình chăm sóc hiện tại (**${remainingDays} ngày** còn lại trên tổng số **${healingDurationVal} ngày**) nhé!`,
              time: new Date(Date.now() + 10)
            };
            newMsgs.push(stayMsg);
            setDialogStage(0);
          }
        }
      } else {
        // Normal setup proposal for new journeys
        const proposalMsg = {
          id: `bot-proposal-${Date.now() + 10}`,
          sender: "bot",
          text: `Dựa trên kết quả đánh giá ${testId.toUpperCase()} vừa rồi, tớ khuyên cậu nên kích hoạt **${name}** với thời gian **${days} ngày** để tớ đồng hành chăm sức khỏe tinh thần hàng ngày cùng cậu. Cậu có muốn kích hoạt lộ trình này ngay bây giờ không?`,
          time: new Date(Date.now() + 10),
          isCompanionSetup: true,
          recommendedDays: days
        };
        newMsgs.push(proposalMsg);
        setDialogStage(5);
      }
    } else {
      setDialogStage(0);
    }

    setMessages((prev) => [...prev, ...newMsgs]);
    setChatMode("normal");
    setActiveTest(null);
  };

  const handleScanComplete = async (testType, resultLog) => {
    setLoading(true);

    let aiAnalysis = null;
    try {
      if (testType === "dass") {
        aiAnalysis = await botManager.aiBot.analyzeTest("dass42", resultLog.scores, null, null, "vi");
      } else if (testType === "general_medical") {
        aiAnalysis = await botManager.aiBot.analyzeTest("general_medical", resultLog.indices, null, null, "vi");
      } else {
        aiAnalysis = await botManager.aiBot.analyzeTest("mmpi30", null, resultLog.validity, resultLog.clinical, "vi");
      }
    } catch (err) {
      console.warn("Lỗi gọi AI phân tích kết quả quét bệnh án:", err);
    }

    let responseMsgText = "";
    if (testType === "dass") {
      if (aiAnalysis) {
        responseMsgText = aiAnalysis;
      } else {
        const getDassInterpret = (scale, score) => {
          if (scale === "D") {
            if (score <= 9) return "Bình thường";
            if (score <= 13) return "Nhẹ";
            if (score <= 20) return "Vừa phải";
            if (score <= 27) return "Nặng";
            return "Rất nặng";
          }
          if (scale === "A") {
            if (score <= 7) return "Bình thường";
            if (score <= 9) return "Nhẹ";
            if (score <= 14) return "Vừa phải";
            if (score <= 19) return "Nặng";
            return "Rất nặng";
          }
          if (score <= 14) return "Bình thường";
          if (score <= 18) return "Nhẹ";
          if (score <= 25) return "Vừa phải";
          if (score <= 33) return "Nặng";
          return "Rất nặng";
        };

        const dSev = getDassInterpret("D", resultLog.scores?.D ?? 0);
        const aSev = getDassInterpret("A", resultLog.scores?.A ?? 0);
        const sSev = getDassInterpret("S", resultLog.scores?.S ?? 0);

        let solutions = [];
        if ((resultLog.scores?.D ?? 0) >= 10) {
          solutions.push(`Thực hành liệu pháp **Trị liệu Trầm cảm (CBT)** để xoa dịu u uất.`);
        }
        if (resultLog.scores.A >= 8) {
          solutions.push(`Tập thở chánh niệm **Điều hòa nhịp thở 4-7-8** để cắt lo âu tức thì.`);
        }
        if (resultLog.scores.S >= 15) {
          solutions.push(`Dành 10-15 phút **Ngồi Tĩnh Tâm** trước khi ngủ để thư giãn sóng não.`);
        }
        if (solutions.length === 0) {
          solutions.push(`Các chỉ số tốt. Hãy rèn luyện thể chất và trải nghiệm **Đọc sách Trị liệu**.`);
        }

        responseMsgText = `Tớ đã phân tích kết quả DASS-42 lâm sàng trích xuất từ hồ sơ phòng khám của cậu:\n\n` +
          `• **Trầm cảm (D):** ${resultLog.scores?.D ?? 0}/42 điểm (${dSev})\n` +
          `• **Lo âu (A):** ${resultLog.scores?.A ?? 0}/42 điểm (${aSev})\n` +
          `• **Căng thẳng (S):** ${resultLog.scores?.S ?? 0}/42 điểm (${sSev})\n\n` +
          `💡 **Giải pháp & Lộ trình đề xuất:**\n• ${solutions.join("\n• ")}`;
      }
    } else if (testType === "general_medical") {
      if (aiAnalysis) {
        responseMsgText = aiAnalysis;
      } else {
        responseMsgText = `Tớ đã xem xét kết quả xét nghiệm tổng quát của cậu. Có tổng cộng ${resultLog.indices.length} chỉ số được ghi nhận.\n` +
        `Một số chỉ số cần lưu ý: ${resultLog.indices.filter(i => i.status !== "normal").map(i => i.name).join(", ") || "Tất cả đều ổn định"}.\n` +
        `Để biết chi tiết hơn, cậu có thể gửi lại hoặc nhờ bác sĩ tư vấn thêm nhé!`;
      }
    } else {
      if (aiAnalysis) {
        responseMsgText = aiAnalysis;
      } else {
        const scaleNames = { 
          Hs: "Nghi bệnh", D: "Trầm cảm", Hy: "Hysteria", Pd: "Sai lệch nhân cách", 
          Mf: "Nam/Nữ tính", Pa: "Hoang tưởng", Pt: "Suy nhược", 
          Sc: "Tâm thần phân liệt", Ma: "Hưng cảm nhẹ", Si: "Hướng ngoại xã hội" 
        };

        const validity = resultLog.validity;
        const clinical = resultLog.clinical;
        const elevated = clinical.filter(c => c.score >= 70);

        let solutions = [];
        if (elevated.length > 0) {
          elevated.forEach(e => {
            if (e.code === "Hs" || e.code === "Hy") {
              solutions.push(`Thang **${scaleNames[e.code]}** cao: Áp lực chuyển hóa thể chất. Hãy tập **Thở 4-7-8** để làm dịu.`);
            } else if (e.code === "D") {
              solutions.push(`Thang **Trầm cảm (D)** cao: Hãy viết nhật ký tích cực trong thẻ **Trị liệu Trầm cảm (CBT)**.`);
            } else if (e.code === "Pd") {
              solutions.push(`Thang **Sai lệch (Pd)** cao: Hãy ghi lại nhật ký cảm xúc để kiềm chế xung động.`);
            } else if (e.code === "Pt" || e.code === "Sc") {
              solutions.push(`Thang **${scaleNames[e.code]}** cao: Thường lo âu ám ảnh. Hãy rèn luyện thẻ **Ngồi Tĩnh Tâm**.`);
            } else if (e.code === "Si") {
              solutions.push(`Thang **Hướng nội (Si)** cao: Thiếu năng lượng xã hội. Hãy tham khảo **Đọc sách Trị liệu** tĩnh lặng.`);
            } else {
              solutions.push(`Thang **${scaleNames[e.code]}** cao: Thực hành các bài tập chánh niệm để tái tạo cân bằng.`);
            }
          });
        } else {
          solutions.push(`Các chỉ số nhân cách thích ứng tốt. Đề xuất thực hành **Đọc sách Trị liệu**.`);
        }

        responseMsgText = `Tớ đã hoàn tất trích xuất và phân tích 13 chỉ số nhân cách Mini-MMPI từ bệnh án phòng khám của cậu:\n\n` +
          `🔍 **Chỉ số kiểm định độ tin cậy (L-F-K):**\n` +
          `• L (Lie/Nói dối): **${validity.L} T-score** (${validity.L >= 70 ? "Vượt ngưỡng" : "Bình thường"})\n` +
          `• F (Infrequency/Dị biệt): **${validity.F} T-score** (${validity.F >= 80 ? "Cảnh báo" : "Bình thường"})\n` +
          `• K (Correction/Phòng vệ): **${validity.K} T-score** (${validity.K >= 70 ? "Vượt ngưỡng" : "Bình thường"})\n` +
          `• Đánh giá chung: **${resultLog.isReliable ? "Báo cáo hợp lệ" : "Báo cáo có độ tin cậy thấp"}**\n\n` +
          `📊 **Kết quả 10 Thang đo Lâm sàng:**\n` +
          clinical.map(c => `• ${scaleNames[c.code] || c.code}: **${c.score} T-score** ${c.score >= 70 ? "⚠️" : ""}`).join("\n") + `\n\n` +
          `💡 **Giải pháp tự chữa lành thích ứng:**\n• ${solutions.join("\n• ")}`;
      }
    }

    const updatedLogs = [...historyLogs, resultLog];
    onUpdateCompanionState({
      lastTestDate: new Date().toDateString(),
      historyLogs: updatedLogs
    });

    const botMsgId = `bot-scan-${Date.now()}`;
    const botMsg = {
      id: botMsgId,
      sender: "bot",
      text: responseMsgText,
      time: new Date()
    };

    // Calculate recommended days based on scan metrics
    let recommendedDays = 7;
    let pkgName = "Hành trình Nuôi dưỡng Bình yên (Peace)";
    if (testType === "dass") {
      const { D, A, S } = resultLog.scores;
      if (D >= 28) { recommendedDays = 90; pkgName = "Hành trình Đồng hành Chuyên sâu (Intensive)"; }
      else if (D >= 21 || A >= 20 || S >= 26) { recommendedDays = 50; pkgName = "Hành trình Phục hồi Thấu cảm (Compassionate)"; }
      else if (D >= 14 || A >= 10 || S >= 19) { recommendedDays = 30; pkgName = "Hành trình Tái tạo Cân bằng (Balance)"; }
      else if (D >= 10 || A >= 8 || S >= 15) { recommendedDays = 14; pkgName = "Hành trình Chăm sóc Tinh thần (Mindfulness)"; }
    } else if (testType === "general_medical") {
      const abnormalCount = resultLog.indices.filter(i => i.status !== "normal").length;
      if (abnormalCount >= 5) { recommendedDays = 30; pkgName = "Hành trình Chăm sóc Sức khỏe Chuyên sâu (Intensive)"; }
      else if (abnormalCount >= 2) { recommendedDays = 14; pkgName = "Hành trình Tái tạo Cân bằng (Balance)"; }
      else { recommendedDays = 7; pkgName = "Hành trình Nuôi dưỡng Sức khỏe (Wellness)"; }
    } else {
      const elevatedCount = resultLog.clinical.filter(c => c.score >= 70).length;
      if (elevatedCount >= 5) { recommendedDays = 90; pkgName = "Hành trình Đồng hành Chuyên sâu (Intensive)"; }
      else if (elevatedCount >= 3) { recommendedDays = 50; pkgName = "Hành trình Phục hồi Thấu cảm (Compassionate)"; }
      else if (elevatedCount >= 1) { recommendedDays = 30; pkgName = "Hành trình Tái tạo Cân bằng (Balance)"; }
      else if (!resultLog.isReliable) { recommendedDays = 14; pkgName = "Hành trình Chăm sóc Tinh thần (Mindfulness)"; }
    }

    let proposalMsg = null;
    let targetDialogStage = 5;

    if (healingActive) {
      const healingStartDateStr = localStorage.getItem("banhocduong_healing_start_date") || "";
      const healingDurationVal = parseInt(localStorage.getItem("banhocduong_healing_duration") || "30", 10);
      let progressDays = 1;
      if (healingStartDateStr) {
        const start = new Date(healingStartDateStr).getTime();
        const now = new Date().getTime();
        progressDays = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1);
      }
      const remainingDays = Math.max(0, healingDurationVal - progressDays);

      // Compare new scan with the previous test logs of same type
      let isWorse = false;
      let isImproved = false;
      let diffVal = 0;
      if (testType === "dass") {
        const pastDass = historyLogs.filter(l => l.scores);
        if (pastDass.length > 0) {
          const lastPast = pastDass[pastDass.length - 1];
          const newSum = (resultLog.scores?.D ?? 0) + (resultLog.scores?.A ?? 0) + (resultLog.scores?.S ?? 0);
          const prevSum = (lastPast.scores?.D ?? 0) + (lastPast.scores?.A ?? 0) + (lastPast.scores?.S ?? 0);
          if (newSum > prevSum) {
            isWorse = true;
            diffVal = newSum - prevSum;
          } else if (newSum < prevSum) {
            isImproved = true;
            diffVal = prevSum - newSum;
          }
        } else {
          if (recommendedDays > healingDurationVal) {
            isWorse = true;
            diffVal = Math.ceil((recommendedDays - healingDurationVal) / 10) || 1;
          } else if (recommendedDays < healingDurationVal) {
            isImproved = true;
            diffVal = Math.ceil((healingDurationVal - recommendedDays) / 10) || 1;
          }
        }
      } else if (testType === "general_medical") {
        const pastMed = historyLogs.filter(l => l.indices);
        if (pastMed.length > 0) {
          const lastPast = pastMed[pastMed.length - 1];
          const newAbnormal = resultLog.indices.filter(c => c.status !== "normal").length;
          const prevAbnormal = lastPast.indices.filter(c => c.status !== "normal").length;
          if (newAbnormal > prevAbnormal) {
            isWorse = true;
            diffVal = newAbnormal - prevAbnormal;
          } else if (newAbnormal < prevAbnormal) {
            isImproved = true;
            diffVal = prevAbnormal - newAbnormal;
          }
        } else {
          if (recommendedDays > healingDurationVal) {
            isWorse = true;
            diffVal = Math.ceil((recommendedDays - healingDurationVal) / 10) || 1;
          } else if (recommendedDays < healingDurationVal) {
            isImproved = true;
            diffVal = Math.ceil((healingDurationVal - recommendedDays) / 10) || 1;
          }
        }
      } else {
        const pastMmpi = historyLogs.filter(l => l.clinical);
        if (pastMmpi.length > 0) {
          const lastPast = pastMmpi[pastMmpi.length - 1];
          const newElevated = resultLog.clinical.filter(c => c.score >= 70).length;
          const prevElevated = lastPast.clinical.filter(c => c.score >= 70).length;
          if (newElevated > prevElevated) {
            isWorse = true;
            diffVal = newElevated - prevElevated;
          } else if (newElevated < prevElevated) {
            isImproved = true;
            diffVal = prevElevated - newElevated;
          }
        } else {
          if (recommendedDays > healingDurationVal) {
            isWorse = true;
            diffVal = Math.ceil((recommendedDays - healingDurationVal) / 10) || 1;
          } else if (recommendedDays < healingDurationVal) {
            isImproved = true;
            diffVal = Math.ceil((healingDurationVal - recommendedDays) / 10) || 1;
          }
        }
      }

      if (progressDays >= healingDurationVal) {
        // Exceeded current duration (e.g. Day 57 of a 50-day journey)
        if (isImproved || recommendedDays <= 14) {
          // Suggest graduation!
          proposalMsg = {
            id: `bot-graduation-${Date.now() + 10}`,
            sender: "bot",
            text: `🎉 **Ghi nhận Tiến trình Phục hồi Tuyệt vời**: Kết quả quét hồ sơ lâm sàng mới nhất cho thấy tình trạng của cậu chuyển biến rất tốt và đã ổn định trở lại! \n\nCậu đã kiên trì vượt qua **${progressDays} ngày** của lộ trình tự chữa lành một cách xuất sắc. Tớ rất tự hào về cậu! Cậu hoàn toàn đã sẵn sàng để **tốt nghiệp lộ trình đồng hành** này rồi nhé. Cậu hãy bấm sang tab **Trị Liệu** hoặc **Hồ Sơ** để thực hiện tốt nghiệp nha! 🌸`,
            time: new Date(Date.now() + 10)
          };
          targetDialogStage = 0;
        } else {
          // Suggest extension
          const extendDays = recommendedDays;
          const finalRecommendedDuration = healingDurationVal + extendDays;
          proposalMsg = {
            id: `bot-extend-${Date.now() + 10}`,
            sender: "bot",
            text: `**Tái đánh giá Tinh thần**: Cậu đã đi qua **${progressDays} ngày** của lộ trình, nhưng kết quả quét hồ sơ lâm sàng lần này ghi nhận cậu vẫn còn gặp một số áp lực lâm sàng. \n\nĐể tiếp tục nâng đỡ và hỗ trợ tinh thần cậu tốt nhất mà **không làm mất đi ${progressDays} ngày cậu đã kiên trì qua**, tớ đề xuất mở rộng thêm **+${extendDays} ngày** hỗ trợ (Tổng lộ trình nâng lên **${finalRecommendedDuration} ngày**, cậu còn **${remainingDays + extendDays} ngày**). Cậu có đồng ý áp dụng đề xuất thích ứng mới này không?`,
            time: new Date(Date.now() + 10),
            isCompanionSetup: true,
            recommendedDays: finalRecommendedDuration
          };
          targetDialogStage = 5;
        }
      } else {
        // Within active journey
        if (isWorse) {
          const addDays = testType === "dass" ? Math.min(14, Math.max(7, diffVal)) : Math.min(14, diffVal * 7);
          const finalRecommendedDuration = healingDurationVal + addDays;
          
          proposalMsg = {
            id: `bot-worsening-${Date.now() + 10}`,
            sender: "bot",
            text: `📊 **Tái đánh giá Thích ứng**: Kết quả quét bệnh án mới nhất cho thấy tình trạng của cậu có phần căng thẳng hơn trước (các chỉ số lâm sàng tăng nhẹ). \n\nĐể hỗ trợ cậu vượt qua giai đoạn này mà **không làm mất đi ${progressDays} ngày cậu đã cố gắng trước đó**, tớ đề xuất giữ nguyên tiến trình cũ và bổ sung thêm **+${addDays} ngày** đồng hành hỗ trợ (Nâng tổng lộ trình thành **${finalRecommendedDuration} ngày**, cậu còn **${remainingDays + addDays} ngày** phía trước). Cậu có đồng ý áp dụng đề xuất thích ứng mới này không?`,
            time: new Date(Date.now() + 10),
            isCompanionSetup: true,
            recommendedDays: finalRecommendedDuration
          };
          targetDialogStage = 5;
        } else if (isImproved) {
          // Improvement
          let reduceDays = 0;
          if (testType === "dass") {
            const pastDass = historyLogs.filter(l => l.scores && l.scores.D !== undefined);
            if (pastDass.length > 0) {
              reduceDays = Math.min(Math.floor(remainingDays / 2), Math.max(3, diffVal));
            } else {
              reduceDays = Math.min(Math.floor(remainingDays / 2), Math.max(3, Math.floor((healingDurationVal - recommendedDays) / 2)));
            }
          } else {
            const pastMmpi = historyLogs.filter(l => l.clinical);
            if (pastMmpi.length > 0) {
              reduceDays = Math.min(Math.floor(remainingDays / 2), Math.max(3, diffVal * 3));
            } else {
              reduceDays = Math.min(Math.floor(remainingDays / 2), Math.max(3, Math.floor((healingDurationVal - recommendedDays) / 2)));
            }
          }

          if (reduceDays > 0 && remainingDays > 3) {
            const finalRecommendedDuration = Math.max(progressDays + 3, healingDurationVal - reduceDays);
            proposalMsg = {
              id: `bot-improvement-${Date.now() + 10}`,
              sender: "bot",
              text: `🎉 **Ghi nhận Tiến trình Tuyệt vời**: Chỉ số tái đánh giá tinh thần qua bệnh án mới quét của cậu chuyển biến rất khả quan! \n\nĐể khích lệ và tối ưu lộ trình **dựa trên số liệu khoa học thực tế**, tớ đề xuất rút ngắn thời gian điều trị còn lại đi **-${reduceDays} ngày** (Tổng lộ trình đồng hành rút xuống **${finalRecommendedDuration} ngày**, cậu còn lại **${remainingDays - reduceDays} ngày** và giữ nguyên tiến trình đã tích lũy). Cậu có đồng ý áp dụng đề xuất thích ứng mới này không?`,
              time: new Date(Date.now() + 10),
              isCompanionSetup: true,
              recommendedDays: finalRecommendedDuration
            };
            targetDialogStage = 5;
          } else {
            proposalMsg = {
              id: `bot-proposal-${Date.now() + 10}`,
              sender: "bot",
              text: `Kết quả quét bệnh án định kỳ cho thấy tinh thần của cậu đang duy trì ở mức ổn định. Cậu hãy tiếp tục theo sát lộ trình chăm sóc hiện tại (**${remainingDays} ngày** còn lại trên tổng số **${healingDurationVal} ngày**) nhé!`,
              time: new Date(Date.now() + 10)
            };
            targetDialogStage = 0;
          }
        } else {
          // Stable
          proposalMsg = {
            id: `bot-proposal-${Date.now() + 10}`,
            sender: "bot",
            text: `Kết quả quét bệnh án định kỳ cho thấy tinh thần của cậu đang duy trì ở mức ổn định. Cậu hãy tiếp tục theo sát lộ trình chăm sóc hiện tại (**${remainingDays} ngày** còn lại trên tổng số **${healingDurationVal} ngày**) nhé!`,
            time: new Date(Date.now() + 10)
          };
          targetDialogStage = 0;
        }
      }
    } else {
      // Normal setup proposal for new journeys
      proposalMsg = {
        id: `bot-proposal-${Date.now() + 10}`,
        sender: "bot",
        text: `Dựa trên kết quả Quét hồ sơ lâm sàng của cậu, tớ khuyên cậu nên kích hoạt **${pkgName}** với thời gian **${recommendedDays} ngày** để tớ đồng hành chăm sóc sức khỏe tinh thần hàng ngày cùng cậu. Cậu có muốn kích hoạt lộ trình này ngay bây giờ không?`,
        time: new Date(Date.now() + 10),
        isCompanionSetup: true,
        recommendedDays: recommendedDays
      };
      targetDialogStage = 5;
    }

    setMessages((prev) => [...prev, botMsg, ...(proposalMsg ? [proposalMsg] : [])]);
    setChatMode("normal");
    setDialogStage(targetDialogStage);
  };

  // Free-text send: bypasses dialog tree, checks local intents, else calls LLM AI fallback
  const handleSendFreeText = async () => {
    const text = inputText.trim();
    if (!text || loading) return;
    if (tokenLockMinutes > 0) {
      showToast?.(`Token PSY đang bị khóa. Quay lại sau khoảng ${tokenLockMinutes} phút nhé.`, "warning");
      return;
    }

    // 0. Sleep summary needs a network call (SleepLog isn't in historyLogs),
    // so it can't be a synchronous intentClassifier.js rule like the rest.
    if (isSleepSummaryRequest(text)) {
      setInputText("");
      setMessages(prev => [...prev, { id: `user-text-${Date.now()}`, sender: "user", text, time: new Date() }]);
      runSleepSummary();
      return;
    }

    // 1. Local fast-path is now restricted to safety and UI actions only.
    // Normal emotional/supportive conversation goes to the LLM so users receive
    // richer, contextual, deeply personalized replies.
    const matched = findMatchingIntent(text, bio, historyLogs);
    const localOnlyIntentIds = new Set(["crisis", "therapy_open", "therapy_locked", "metrics_report"]);
    if (matched && localOnlyIntentIds.has(matched.id)) {
      setInputText("");
      const userMsg = { id: `user-text-${Date.now()}`, sender: "user", text, time: new Date() };
      setMessages(prev => [...prev, userMsg]);
      setLoading(true);
      // Telemetry only — lets us measure real local-match coverage vs. AI/fallback tiers.
      botManager.logLocalMatch(text, matched.id);

      // Save auto-collected emotional check-in status if returned by the intent
      if (matched.companionUpdate?.newLog && onUpdateCompanionState) {
        onUpdateCompanionState({ historyLogs: [...historyLogs, matched.companionUpdate.newLog] });
      }

      if (matched.id === "crisis") {
        reportCrisisToAdmin(text, [...messages, userMsg]);
      }

      // Natural typing delay simulation, then drip the reply chunk(s) in
      setTimeout(() => {
        pushBotMessageChunks(matched.reply, {
          suggestPhq9: matched.suggestPhq9,
          suggestGad7: matched.suggestGad7,
          quickActions: matched.quickActions || null
        }).then(() => {
          setLoading(false);
          // Therapy-navigation intents (see intentClassifier.js) ask to open a
          // panel directly — do it once the reply has finished dripping in.
          if (matched.action?.type === "open_therapy") {
            setTherapyInitialMethod(matched.action.methodId);
            setShowTherapyOverlay(true);
          }
        });
      }, 600);
      return;
    }

    // 2. Full conversational LLM. We intentionally skip AI intent classification
    // for normal messages so 99% of user sharing gets the strongest LLM answer.
    setInputText("");
    const userMsg = { id: `user-text-${Date.now()}`, sender: "user", text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // 3. Streaming conversational LLM AI server (costs 3 tokens on success).
    const bonusTokens = bio?.bonusChatTokens || 0;
    if (remainingChatTokens + bonusTokens <= 0) {
      showToast?.("Hết token chat hôm nay. Quay lại vào ngày mai nhé!", "warning");
      setLoading(false);
      return;
    }

    setDialogStage(0);
    const botMsgId = `bot-text-${Date.now()}`;
    await botManager.chatStream(
      text,
      (chunkText) => {
        setLoading(false);
        // The LLM may emit "|||" mid-stream as its multi-bubble separator —
        // while still streaming there's only one live bubble, so just show
        // it as a paragraph break rather than the raw delimiter.
        const displayText = chunkText.split("|||").join("\n\n");
        setMessages(prev => {
          if (!prev.some(m => m.id === botMsgId)) {
            return [...prev, { id: botMsgId, sender: "bot", text: displayText, time: new Date() }];
          }
          return prev.map(m => m.id === botMsgId ? { ...m, text: displayText } : m);
        });
      },
      (botResponse) => {
        // The server only charges (3 tokens, or a bonus token) after a confirmed successful
        // reply — errors never cost anything. Resync from the server instead of guessing locally.
        refreshRemainingTokens();
        if (botResponse.bioUpdate && onProfileUpdate) {
          onProfileUpdate(botResponse.bioUpdate);
          showToast?.("Đã lưu thông tin mới vào hồ sơ!", "success");
        }
        // Now that streaming is done, replace the single live bubble with the
        // real split bubbles (the LLM was asked to separate them with "|||").
        const chunks = botResponse.reply.split("|||").map(c => c.trim()).filter(Boolean);
        setMessages(prev => prev.filter(m => m.id !== botMsgId));
        pushBotMessageChunks(chunks.length ? chunks : [botResponse.reply], {
          suggestPhq9: botResponse.suggestPhq9,
          suggestGad7: botResponse.suggestGad7,
          suggestWho5: botResponse.suggestWho5,
          suggestBigFive: botResponse.suggestBigFive,
        }).then(() => setLoading(false));
      }
    );
  };

  // Therapy methods open right inside the chat (no tab switch) — Mở trị liệu
  // tâm lý from the "+" menu, or asking by name in free text, both land here.
  // Reusing TherapyTab wholesale (instead of re-implementing unlock checks,
  // JOY balance, and 8+ exercise panels a second time) keeps the paywall and
  // panel logic in exactly one place.
  if (showTherapyOverlay) {
    return (
      <div className="flex flex-col min-h-0 h-full bg-zinc-50/30 dark:bg-[#0a0a0f]/30 animate-fadeIn relative overflow-hidden">
        <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white/95 dark:bg-[#0e0e12]/95 backdrop-blur-sm border-b border-zinc-100 dark:border-zinc-800/50" style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}>
          <button
            type="button"
            onClick={() => { setShowTherapyOverlay(false); setTherapyInitialMethod(null); }}
            className="w-8 h-8 -ml-1 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <p className="text-[13px] font-extrabold text-zinc-800 dark:text-zinc-100">Trị Liệu Tâm Lý</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <TherapyTab
            bio={bio}
            historyLogs={historyLogs}
            chatMessages={messages}
            healingActive={healingActive}
            showToast={showToast}
            onUpdateCompanionState={onUpdateCompanionState}
            onBioUpdate={onProfileUpdate}
            onNavigateToTab={() => { setShowTherapyOverlay(false); setTherapyInitialMethod(null); }}
            initialMethod={therapyInitialMethod}
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={chatWrapperRef} className="flex flex-col flex-1 h-full min-h-0 bg-zinc-50/30 dark:bg-[#0a0a0f]/30 animate-fadeIn relative overflow-hidden md:rounded-3xl">


      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2.5 bg-white/95 dark:bg-[#0e0e12]/95 backdrop-blur-sm border-b border-zinc-100 dark:border-zinc-800/50" style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}>
        <div className="flex items-center gap-2.5">
          {/* Mobile-only: this header doubles as the app bar of the fullscreen
              chat takeover (see BanhocduongTab.jsx) — there's no other back
              affordance once the surrounding tab chrome is hidden. */}
          {onExitFullscreen && (
            <button
              type="button"
              onClick={onExitFullscreen}
              className="md:hidden w-8 h-8 -ml-1 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
          )}
          {/* Mobile-only: small HugoPSY icon + wordmark, "Hugo" colored per the
              Hugo Studio brand (see HugoLogo.jsx) — this is the only identity
              chrome left once the bot-name/status block below goes desktop-only. */}
          <div className="md:hidden flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#5856d6] to-[#0071e3] flex items-center justify-center shadow-sm shadow-indigo-500/20 shrink-0">
              <span className="material-symbols-outlined text-white text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <p className="text-[12px] font-black leading-none whitespace-nowrap">
              <RenderColoredText text="Hugo" /><span className="text-[#0071e3]">PSY</span>
            </p>
          </div>
          {/* Bot identity — desktop only now. On mobile the header is strictly
              back + token + lộ trình (per the chat-only mobile redesign);
              everything else (who the bot is, retaking a test, settings) is
              obtainable by just asking in chat instead of dedicated chrome. */}
          <div className="hidden md:flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#5856d6] to-[#0071e3] flex items-center justify-center shadow-sm shadow-indigo-500/20 shrink-0 relative">
              <span className="material-symbols-outlined text-white text-[17px]" style={{ fontVariationSettings:"'FILL' 1" }}>psychology</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0e0e12]" />
            </div>
            <div>
              <p className="text-[12px] font-extrabold text-zinc-800 dark:text-zinc-100 leading-none">Chuyên viên Đồng Hành AI</p>
              <p className="text-[9px] text-emerald-500 font-semibold mt-0.5">● Đang hoạt động</p>
            </div>
          </div>
          {/* Mobile-only compact "lộ trình" pill — replaces the standalone
              JourneyCard block that used to sit above the chat, eating space. */}
          {journeyProgress && (
            <div className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-[12px]">route</span>
              <span className="text-[10px] font-black whitespace-nowrap">Ngày {journeyProgress.currentDay}/{journeyProgress.duration} · {journeyProgress.percent}%</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${tokenLockMinutes > 0 || remainingChatTokens + (bio?.bonusChatTokens || 0) <= 1 ? 'bg-red-500/10 border-red-400/20 text-red-500' : 'bg-amber-500/10 border-amber-400/20 text-amber-600 dark:text-amber-400'}`} title={tokenLockMinutes > 0 ? `Token PSY bị khóa còn khoảng ${tokenLockMinutes} phút` : `Token còn lại: ${remainingChatTokens + (bio?.bonusChatTokens || 0)}/10 hôm nay`}>
            <span className="material-symbols-outlined text-[11px]">{tokenLockMinutes > 0 ? "lock" : "toll"}</span>
            <span className="text-[10px] font-black">{tokenLockMinutes > 0 ? "Khóa" : `${remainingChatTokens + (bio?.bonusChatTokens || 0)}/10`}</span>
          </div>
          {healingActive && (
            <button type="button" onClick={() => {
              const lastTestDateStr = localStorage.getItem("banhocduong_last_test_date");
              if (lastTestDateStr) {
                const h = (Date.now() - new Date(lastTestDateStr).getTime()) / 3_600_000;
                if (h < 32) { showToast?.(`Đợi thêm ${Math.ceil(32-h)} giờ nhé.`, "warning"); return; }
              }
              setShowTestsMenu(true);
            }}
              className="hidden md:flex px-2.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-400/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-extrabold items-center gap-1 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[11px]">refresh</span>
              Test lại
            </button>
          )}
        </div>
      </div>

      {/* ── Smart wellness insight strip ──────────────────────────────────────────
          Only shown in normal chat mode — hidden during an active test/scan so that
          flow gets the full available height instead of being squeezed below it
          (this was the main cramped-on-mobile complaint: the strip ate space that
          the test panel needed, especially on short viewports). */}
      {false && chatMode === "normal" && (
        <div className="shrink-0 bg-white/95 dark:bg-[#0e0e12]/95 backdrop-blur-sm border-b border-zinc-100 dark:border-zinc-800/50">
          <WellnessInsightStrip bio={bio} historyLogs={historyLogs} chatMessages={messages} onNavigateToTab={onNavigateToTab} />
        </div>
      )}

      {/* ── Tests bottom sheet ──────────────────────────────────────────────────── */}
      {showTestsMenu && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/50 backdrop-blur-sm"
          onClick={() => setShowTestsMenu(false)}>
          <div className="bg-white dark:bg-card rounded-t-3xl px-5 pt-4 pb-6 space-y-2.5"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Bài đánh giá lâm sàng</p>
              <button type="button" onClick={() => setShowTestsMenu(false)} className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center active:scale-90">
                <span className="material-symbols-outlined text-sm text-zinc-500">close</span>
              </button>
            </div>
            {[
              { id:'phq9',    label:'PHQ-9',    desc:'Đánh giá Trầm cảm',     cls:'text-rose-600 bg-rose-500/8 border-rose-300/40 dark:text-rose-400 dark:border-rose-700/30'    },
              { id:'gad7',    label:'GAD-7',    desc:'Đánh giá Lo âu',        cls:'text-cyan-600 bg-cyan-500/8 border-cyan-300/40 dark:text-cyan-400 dark:border-cyan-700/30'     },
              { id:'who5',    label:'WHO-5',    desc:'Chỉ số Hạnh phúc',      cls:'text-emerald-600 bg-emerald-500/8 border-emerald-300/40 dark:text-emerald-400 dark:border-emerald-700/30' },
              { id:'bigfive', label:'Big Five', desc:'Trắc nghiệm Nhân cách', cls:'text-indigo-600 bg-indigo-500/8 border-indigo-300/40 dark:text-indigo-400 dark:border-indigo-700/30' },
            ].map(t => (
              <button key={t.id} type="button"
                onClick={() => { handleStartTest(t.id); setShowTestsMenu(false); }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border ${t.cls} active:scale-[0.98] transition-all`}>
                <div className="text-left">
                  <p className="text-[13px] font-extrabold">[{t.label}]</p>
                  <p className="text-[10px] font-semibold opacity-70 mt-0.5">{t.desc}</p>
                </div>
                <span className="material-symbols-outlined text-[16px] opacity-50">chevron_right</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Messages area (fills remaining height — Telegram-style) ────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {chatMode === "normal" && (
          <ChatMessages
            messages={messages}
            completedMessageIds={completedMessageIds}
            setCompletedMessageIds={setCompletedMessageIds}
            onStartTest={handleStartTest}
            onSelectDuration={handleSelectDuration}
            loading={loading}
            onNavigateToTab={onNavigateToTab}
            messagesEndRef={messagesEndRef}
            onUnlockFeature={handleUnlockFeature}
            unlockingMethodId={unlockingMethodId}
          />
        )}
        {chatMode === "test" && activeTest && (
          <ClinicalTestPanel
            activeTest={activeTest}
            onTestComplete={handleTestComplete}
            onCancel={() => { setChatMode("normal"); setActiveTest(null); }}
          />
        )}
        {chatMode === "scan" && (
          <ClinicScanner
            onScanComplete={handleScanComplete}
            onCancel={() => setChatMode("normal")}
          />
        )}
      </div>

      {/* ── Input section (always at bottom — never scrolls away) ──────────────── */}
      {chatMode === "normal" && (
        <div className="shrink-0 bg-white/95 dark:bg-[#0e0e12]/95 border-t border-zinc-100 dark:border-zinc-800/60 backdrop-blur-xl shadow-[0_-8px_24px_rgba(15,23,42,0.04)]"
          style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}>

          {/* ── Composer (split into its own memoized component — see
              ChatInputBar.jsx — so typing a keystroke never has to re-render
              the message list above it) ──────────────────────────────────── */}
          <ChatInputBar
            inputRef={inputRef}
            value={inputText}
            onChange={setInputText}
            onSend={handleSendFreeText}
            disabled={tokenLockMinutes > 0 || (remainingChatTokens + (bio?.bonusChatTokens || 0)) <= 0 || loading}
            placeholder={tokenLockMinutes > 0 ? `Token PSY bị khóa ~${tokenLockMinutes} phút...` : (remainingChatTokens + (bio?.bonusChatTokens || 0)) <= 0 ? "Hết token hôm nay..." : "Nhắn tin cho Chuyên viên AI..."}
            isListening={isListening}
            onVoice={startListening}
          />
        </div>
      )}
    </div>
  );
}
