import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  BrainCircuit,
  ClipboardCheck,
  Flame,
  HeartHandshake,
  HeartPulse,
  LockKeyhole,
  MoonStar,
  Smile,
  Sparkles,
  Zap,
} from "lucide-react";
import { CLINICAL_TESTS } from "./clinicalTests";
import ChatMessages from "./ChatMessages";
import ClinicalTestPanel from "./ClinicalTestPanel";
import ClinicScanner from "./ClinicScanner";
import TherapyTab from "./TherapyTab";
import EvaluationTab from "./EvaluationTab";
import SleepTracker from "./SleepTracker";
import ChatInputBar from "./ChatInputBar";
import TokenExchangeModal from "./TokenExchangeModal";
import { CrisisSosCountdown } from "./EmergencySiren";
import { getLockedFields, fieldLabel } from "./constants/bioFields";
import { webPushHelper } from "../../../utils/webPushHelper";
import { useKeyboardInset, useVirtualKeyboardOptIn } from "../../../hooks/useKeyboardVisible";
import { useChatEngine } from "./hooks/useChatEngine";

import BotManager from "../../../services/classes/CompanionBot/BotManager";
import { computeAdaptivePersona } from "./utils/adaptivePersonaEngine";
import { findMatchingIntent, removeVietnameseTones } from "./constants/intentClassifier";
import { checkPeriodicAssessmentDue } from "./utils/weeklyDigestHelper";

import { THERAPY_METHODS } from "./constants/therapyMethods";
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

const getAuraColors = (mood) => {
  if (mood <= 2) {
    return {
      topRight: "bg-rose-400/25 dark:bg-rose-600/20",
      middleLeft: "bg-orange-400/20 dark:bg-orange-600/15",
      bottomRight: "bg-indigo-400/10 dark:bg-indigo-600/10"
    };
  } else if (mood === 3) {
    return {
      topRight: "bg-blue-400/20 dark:bg-blue-600/20",
      middleLeft: "bg-purple-400/20 dark:bg-purple-600/15",
      bottomRight: "bg-emerald-400/10 dark:bg-emerald-600/10"
    };
  } else {
    return {
      topRight: "bg-[#5856d6]/20 dark:bg-[#5856d6]/20",
      middleLeft: "bg-violet-400/20 dark:bg-violet-600/15",
      bottomRight: "bg-teal-400/15 dark:bg-teal-600/15"
    };
  }
};

function deriveSmartFollowUps(userText, botText, mood) {
  const source = removeVietnameseTones(`${userText} ${botText}`).toLowerCase();
  if (/(ngu|mat ngu|tran troc|ac mong)/.test(source)) {
    return ["Xem giấc ngủ của tớ", "Cho tớ bài thở ngắn", "Lập kế hoạch tối nay"];
  }
  if (/(hoc|thi|deadline|do an|diem)/.test(source)) {
    return ["Chia nhỏ việc cần làm", "Tớ đang sợ thất bại", "Lập kế hoạch 24 giờ"];
  }
  if (/(lo|so|hoang|overthinking|bon chon)/.test(source)) {
    return ["Giúp tớ gọi tên nỗi lo", "Bài thở 2 phút", "Tớ muốn đánh giá lo âu"];
  }
  if (/(chia tay|gia dinh|ban be|co don)/.test(source)) {
    return ["Tớ muốn kể rõ hơn", "Giúp tớ đặt ranh giới", "Tớ cần một bước nhỏ"];
  }
  if (mood <= 2) {
    return ["Cứ lắng nghe tớ", "Lập kế hoạch thật nhẹ", "Cho tớ bài thư giãn"];
  }
  return ["Hỏi tớ thêm một câu", "Tạo kế hoạch hôm nay", "Xem tiến triển của tớ"];
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
  journeyProgress,
  sleepAutoDetect,
  onClaimChallenge
}) {
  const { t } = useTranslation();
  const [completedMessageIds, setCompletedMessageIds] = useState(new Set());
  const [messages, setMessages] = useState([]);
  const [currentMood, setCurrentMood] = useState(3);

  const adaptivePersona = useMemo(() => {
    return computeAdaptivePersona(historyLogs, bio);
  }, [historyLogs, bio]);

  useEffect(() => {
    if (Array.isArray(historyLogs)) {
      const checkins = historyLogs.filter(log => log.type === "checkin" && typeof log.mood === "number");
      if (checkins.length > 0) {
        const sorted = [...checkins].sort((a, b) => new Date(b.date) - new Date(a.date));
        setCurrentMood(sorted[0].mood);
      }
    }
  }, [historyLogs]);
  const [loading, setLoading] = useState(false);
  const [showTestsMenu, setShowTestsMenu] = useState(false);
  const [showTokenExchangeModal, setShowTokenExchangeModal] = useState(false);
  const [showTherapyOverlay, setShowTherapyOverlay] = useState(false);
  const [showCoachMenu, setShowCoachMenu] = useState(false);
  const [activeModalDrawer, setActiveModalDrawer] = useState(null); // therapy, sleep, evaluation, null

  const [therapyInitialMethod, setTherapyInitialMethod] = useState(null);
  const [unlockingMethodId, setUnlockingMethodId] = useState(null);
  const joyBalance = useJoyStore(s => s.balance);
  const fetchJoyBalance = useJoyStore(s => s.fetchBalance);
  const { createLocalSafetyReply, sanitizeStreamChunk, normalizeFinalResponse } = useChatEngine();
  // Pixel height the mobile keyboard overlaps the viewport — lifts the input
  // bar to sit flush above the keyboard (Viber-style) instead of being covered.
  // Standards-track PWA keyboard handling (VirtualKeyboard API): when the
  // browser supports it, the input bar is positioned with the compositor-
  // driven env(keyboard-inset-height) — perfectly smooth, no JS per frame.
  // Elsewhere (iOS Safari) we fall back to the visualViewport transform.
  const hasNativeKeyboard = useVirtualKeyboardOptIn();
  const keyboardInset = useKeyboardInset();
  // Safety prompt triggered by the local self-harm detector. The siren itself
  // always requires an explicit user tap.
  const [sosPromptOpen, setSosPromptOpen] = useState(false);
  const [isVentingMode, setIsVentingMode] = useState(false);
  const [ventingTimerMinutes] = useState(1);
  const [normalMessagesBackup, setNormalMessagesBackup] = useState([]);

  const toggleVentingMode = () => {
    if (!isVentingMode) {
      setNormalMessagesBackup(messages);
      setIsVentingMode(true);
      setMessages([
        {
          id: `venting-greet-${Date.now()}`,
          sender: "bot",
          text: "🕯️ Cậu đang bước vào **Không gian Tâm Sự Tạm Thời**. Tin nhắn trong chế độ này không được thêm vào lịch sử HugoPSY trên thiết bị hay tài khoản. Nội dung vẫn được xử lý tạm thời để tạo phản hồi và sẽ biến mất khỏi màn hình sau thời gian cậu chọn.",
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

  const botManagerRef = useRef(null);
  if (!botManagerRef.current) {
    botManagerRef.current = new BotManager(bio, historyLogs, healingActive, messages);
  }
  const botManager = botManagerRef.current;
  useEffect(() => {
    botManager.updateContext(bio, historyLogs, healingActive, messages);
  }, [botManager, bio, historyLogs, healingActive, messages]);

  // Returns a contextual Vietnamese typing label based on the matched intent or user text keywords.
  const getTypingLabel = (text, intentId) => {
    const INTENT_LABELS = {
      crisis: "Tớ đang lo lắng cho cậu...",
      sadness: "Tớ đang lắng nghe cậu...",
      anxiety: "Tớ đang cảm nhận cùng cậu...",
      burnout: "Tớ đang nghĩ về cậu...",
      loneliness: "Tớ đang ở đây với cậu...",
      overthinking: "Để tớ suy nghĩ cùng cậu...",
      grief: "Tớ đang đồng hành cùng cậu...",
      anger: "Tớ đang lắng nghe cậu...",
      emptiness: "Tớ đang ở đây...",
      low_self_esteem: "Tớ đang nghĩ cho cậu...",
      social_anxiety: "Tớ đang lắng nghe...",
      perfectionism: "Tớ đang suy nghĩ...",
      university_exam: "Tớ đang xem cho cậu...",
      exercise_request: "Tớ đang chuẩn bị bài tập...",
      phq9_suggest: "Tớ đang chuẩn bị đánh giá...",
      positive: "Tớ đang vui cùng cậu... 🎉",
      gratitude: "Tớ đang cảm nhận điều này...",
    };
    if (intentId && INTENT_LABELS[intentId]) return INTENT_LABELS[intentId];
    const t = text.toLowerCase();
    if (t.includes("lo") || t.includes("sợ") || t.includes("hoảng")) return "Tớ đang lắng nghe cậu...";
    if (t.includes("buồn") || t.includes("khóc") || t.includes("chán")) return "Tớ đang đồng hành cùng cậu...";
    if (t.includes("mệt") || t.includes("kiệt") || t.includes("stress")) return "Tớ đang nghĩ về cậu...";
    if (t.includes("vui") || t.includes("tốt") || t.includes("ổn")) return "Tớ đang vui cùng cậu... 🌟";
    if (t.includes("bài tập") || t.includes("thở") || t.includes("thiền")) return "Tớ đang chuẩn bị bài tập...";
    return "Đang soạn tin...";
  };

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

  const handleCoachAction = useCallback((action) => {
    setShowCoachMenu(false);
    if (action === "assessment") {
      setShowTestsMenu(true);
      return;
    }

    const checkins = (historyLogs || [])
      .filter((log) => log?.type === "checkin" && Number.isFinite(Number(log.mood)));
    const latestMood = Number(checkins.at(-1)?.mood || currentMood || 3);
    const latestTests = (historyLogs || []).filter(
      (log) => log?.type === "clinical_test" || log?.test,
    );
    const lastTest = latestTests.at(-1);

    if (action === "insight") {
      const moodLine = latestMood <= 2
        ? "Mức năng lượng gần nhất của cậu đang khá thấp, nên hôm nay mình ưu tiên giảm tải."
        : latestMood >= 4
          ? "Tâm trạng gần nhất của cậu khá ổn; đây là lúc tốt để củng cố một thói quen nhỏ."
          : "Tâm trạng gần nhất đang ở mức trung tính; mình có thể quan sát thêm mà chưa cần ép bản thân.";
      const testLine = lastTest
        ? `Tớ cũng đang ghi nhớ bài ${String(lastTest.test || "đánh giá").toUpperCase()} gần nhất để đối chiếu xu hướng, không dùng nó như một chẩn đoán.`
        : "Hiện chưa có bài sàng lọc gần đây; nếu cậu muốn, mình có thể chọn một bài ngắn phù hợp.";
      setLoading(true);
      pushBotMessageChunks([
        `Đây là điều tớ đang hiểu về cậu lúc này: ${moodLine}`,
        testLine,
        "Điều nào đang chiếm nhiều năng lượng của cậu nhất hôm nay?",
      ]).then(() => {
        setLoading(false);
        setChatQuickReplies(["Học tập", "Gia đình", "Mối quan hệ", "Chính bản thân tớ"]);
      });
      return;
    }

    const plan = latestMood <= 2
      ? [
          "Uống nước và rời màn hình trong 3 phút.",
          "Chọn đúng một việc bắt buộc, làm trong 10 phút.",
          "Trước khi ngủ, ghi lại một điều cậu đã cố gắng.",
        ]
      : [
          "Chọn một ưu tiên quan trọng nhất trong ngày.",
          "Tập trung 25 phút, sau đó nghỉ và vận động 5 phút.",
          "Cuối ngày check-in lại cảm xúc bằng một con số từ 1–5.",
        ];
    setLoading(true);
    pushBotMessageChunks([
      "Tớ đã tạo một kế hoạch 24 giờ thật nhẹ, dựa trên check-in gần nhất của cậu.",
      `**Kế hoạch hôm nay**\n1. ${plan[0]}\n2. ${plan[1]}\n3. ${plan[2]}`,
      "Cậu muốn bắt đầu từ bước nào? Mình có thể tiếp tục chia nhỏ nó.",
    ]).then(() => {
      setLoading(false);
      setChatQuickReplies(["Bắt đầu bước 1", "Giúp tớ chia nhỏ bước 2", "Điều chỉnh nhẹ hơn"]);
    });
  }, [currentMood, historyLogs, pushBotMessageChunks]);

  // HugoPSY can edit the user's Bio in the DB when they ask ("đổi biệt danh
  // thành X"). Fields locked after edu-verification (name/birthday/phone/
  // education/contactEmail) can't be changed silently — those requests are
  // routed to the verification form instead of falsely reporting success.
  const openVerificationForm = useCallback(() => {
    window.dispatchEvent(new CustomEvent("hugo:open-verification"));
  }, []);

  const applyBioUpdate = useCallback((bioUpdate) => {
    const locked = getLockedFields(bio);
    const allowed = {};
    const blocked = [];
    for (const [k, v] of Object.entries(bioUpdate || {})) {
      if (locked.has(k)) blocked.push(k);
      else allowed[k] = v;
    }
    if (Object.keys(allowed).length) {
      onProfileUpdate?.(allowed);
    }
    if (blocked.length) {
      const names = blocked.map(fieldLabel).join(", ");
      const okNote = Object.keys(allowed).length ? "Tớ đã cập nhật những mục còn lại giúp cậu rồi nha. " : "";
      pushBotMessageChunks(
        [`${okNote}Riêng ${names} đã được khoá sau khi tài khoản xác minh sinh viên, nên tớ không tự đổi được. Cậu điền form xác minh để cập nhật nhé 📝`],
        { quickActions: [{ type: "verify_form", label: "Mở form xác minh" }] }
      );
    } else if (Object.keys(allowed).length) {
      showToast?.("Đã cập nhật hồ sơ của cậu! ✨", "success");
    }
  }, [bio, onProfileUpdate, pushBotMessageChunks, showToast]);

  // Mood check-in handler — instant local response, no AI call, contextual therapy chips.
  const handleMoodSelect = useCallback((moodValue) => {
    setCurrentMood(moodValue);
    setMoodCheckinDone(true);
    // Strip the picker from the init message so it saves cleanly to localStorage
    setMessages(prev => prev.map(m => m.id === "init" ? { ...m, type: undefined } : m));

    const name = bio?.displayName?.trim().split(" ").pop() || "bạn";
    const MOOD_LABELS = { 5: "Rất vui", 4: "Tốt", 3: "Bình thường", 2: "Mỏi mệt", 1: "Kiệt sức" };
    const MOOD_RESPONSES = {
      5: [`Woah, ${name} đang vibe xịn vậy!`, `Điều gì làm cậu vui vậy — kể tớ nghe nha?`],
      4: [`Nghe ổn rồi đó!`, `Hôm nay cậu muốn làm gì — tâm sự hay thư giãn một chút?`],
      3: [`Bình thường thôi hả — đôi khi thế cũng ổn mà.`, `Có điều gì cậu đang suy nghĩ không, kể tớ nghe nha?`],
      2: [`Hơi xìu xìu... không sao, tớ ở đây nè ${name}`, `Cậu muốn tâm sự hay thư giãn xíu?`],
      1: [`Ugh, kiệt sức rồi à. Tớ nghe thấy cậu.`, `Có điều gì muốn nói ra không — tớ đang ở đây hết nha.`],
    };
    const MOOD_CHIPS = {
      5: ["Kể thêm đi", "Xem streak của tớ", "Chia sẻ điều tốt hôm nay"],
      4: ["Tâm sự thêm đi", "Cho tớ bài thư giãn", "Xem tiến triển của tớ"],
      3: ["Kể thêm cho tớ nghe", "Cho tớ bài tập thư giãn", "Tớ đang suy nghĩ về..."],
      2: ["Kể thêm cho tớ", "Cho tớ bài tập thở", "Tớ cần nghỉ ngơi"],
      1: ["Tớ muốn tâm sự", "Cho tớ bài tập thở", "Tớ cần không gian yên tĩnh"],
    };

    // Log check-in
    const newLog = { date: new Date().toISOString(), type: "checkin", mood: moodValue, note: "Daily mood check-in" };
    if (onUpdateCompanionState) {
      onUpdateCompanionState({ historyLogs: [...(historyLogs || []), newLog] });
    }

    // Show user's mood as a message
    const userMsg = { id: `mood-${Date.now()}`, sender: "user", text: MOOD_LABELS[moodValue], time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    setTimeout(() => {
      pushBotMessageChunks(MOOD_RESPONSES[moodValue] || MOOD_RESPONSES[3]).then(() => {
        setLoading(false);
        setChatQuickReplies(MOOD_CHIPS[moodValue] || []);
      });
    }, 500);
  }, [bio, historyLogs, onUpdateCompanionState, pushBotMessageChunks]);

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
      pushBotMessageChunks([`Đã mở khoá xong rồi nè! Mở "${method?.name || action.label}" cho cậu luôn đây.`]);
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

  // chatMode: 'normal' | 'test' | 'scan'
  const [chatMode, setChatMode] = useState("normal");
  const [activeTest, setActiveTest] = useState(null);
  // Second line of defense against handleTestComplete firing twice (e.g. if
  // ClinicalTestPanel's own submitting-guard is ever bypassed) — a ref (not
  // state) so the very first synchronous line of the function can check it
  // without waiting for a re-render.
  const testCompletingRef = useRef(false);
  const [remainingChatTokens, setRemainingChatTokens] = useState(10);
  const [maxChatTokens, setMaxChatTokens] = useState(20);
  const [tokenLockMinutes, setTokenLockMinutes] = useState(0);
  const [inputText, setInputText] = useState("");
  const [chatQuickReplies, setChatQuickReplies] = useState([]);
  const [moodCheckinDone, setMoodCheckinDone] = useState(false);
  const [typingLabel, setTypingLabel] = useState("Đang soạn tin...");

  // Server (rate_limit_service) is the source of truth for the daily chat budget —
  // refresh from it instead of guessing locally, so the badge never goes stale.
  const refreshRemainingTokens = useCallback(async () => {
    const data = await botManager.getRemainingTokens();
    if (data && typeof data.remaining === "number") {
      setRemainingChatTokens(data.remaining);
      if (typeof data.max === "number") setMaxChatTokens(data.max);
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
  // RAF batch: commit streaming chunks at most once per animation frame (60fps cap).
  const _rafRef = useRef(null);
  const _pendingChunkRef = useRef(null);

  // The chat frame is configured purely via CSS flexbox. Manual layout updates
  // based on visualViewport were removed because they conflict with native
  // mobile safe-areas and virtual keyboards, causing severe jumping (jitter).

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
              setMoodCheckinDone(true); // Existing chat — picker already answered
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

      // Fresh chat — show interactive mood check-in card (sync, instant, no async needed).
      const name = bio?.displayName?.trim().split(" ").pop() || "bạn";
      const initMsg = {
        id: "init",
        sender: "bot",
        type: "mood_checkin",
        text: `Chào ${name}! 🌸 Hôm nay cậu đang cảm thấy thế nào?`,
        time: new Date()
      };
      setMessages([initMsg]);
      setMoodCheckinDone(false);
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
          : `Dạ, tớ đồng ý bắt đầu lộ trình tự chăm sóc ${duration} ngày cùng cậu.`,
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
  }, [historyLogs, healingActive, onUpdateCompanionState, bio]);

  const handleStartTest = useCallback((testId) => {
    if (["mmpi30", "dass42"].includes(testId)) {
      const message = testId === "dass42"
        ? "DASS-21 không mở cho người dùng tự làm trong HugoPSY. Khuyến nghị chính thức không cho phép ứng dụng công khai tự diễn giải kết quả này."
        : "Bài sàng lọc 30 câu đang được hiệu chỉnh và tạm thời chưa mở để tránh trả kết quả thiếu căn cứ.";
      showToast?.(message, "info");
      return;
    }
    const baseTest = CLINICAL_TESTS[testId];
    if (!baseTest) return;

    const testInstance = {
      ...baseTest,
      // Validated screeners must keep the same wording and order every time.
      // Random paraphrases make scores between sessions non-comparable.
      questions: [...baseTest.questions]
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
  }, [showToast]);



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
    const phq9SafetyFlag = testId === "phq9" && Number(answers?.[8]) > 0;
    if (phq9SafetyFlag) {
      setSosPromptOpen(true);
      reportCrisisToAdmin(
        `PHQ-9 item 9 response level ${Number(answers[8])}`,
        messages
      );
    }

    setLoading(true);

    let reviewText = "";
    let eventLog = null;

    if (testId === "phq9") {
      const interpretation = CLINICAL_TESTS.phq9.getInterpretation(score);
      reviewText = `Kết quả sàng lọc PHQ-9 của cậu là ${score}/27 điểm (${interpretation.severity}).\n\n${interpretation.desc}`;
      if (phq9SafetyFlag) {
        reviewText += "\n\nVì câu trả lời liên quan đến an toàn cá nhân lớn hơn 0, HugoPSY đang ưu tiên hiển thị các lựa chọn hỗ trợ. Điều này không có nghĩa hệ thống đã kết luận cậu đang gặp nguy hiểm tức thời.";
      }
      
      eventLog = {
        date: new Date().toISOString(),
        test: "phq9",
        score,
        severity: interpretation.severity
      };
    } else if (testId === "gad7") {
      const interpretation = CLINICAL_TESTS.gad7.getInterpretation(score);
      reviewText = `Kết quả sàng lọc GAD-7 của cậu là ${score}/21 điểm (${interpretation.severity}).\n\n${interpretation.desc}`;
      
      eventLog = {
        date: new Date().toISOString(),
        test: "gad7",
        score,
        severity: interpretation.severity
      };
    } else if (testId === "who5") {
      const interpretation = CLINICAL_TESTS.who5.getInterpretation(score);
      reviewText = `Kết quả WHO-5 của cậu là ${score}/25 điểm (${score * 4}/100 sau quy đổi).\n\n${interpretation.desc}`;
      
      eventLog = {
        date: new Date().toISOString(),
        test: "who5",
        score,
        status: interpretation.status,
        percent: score * 4
      };
    } else if (testId === "bigfive") {
      const interpretation = CLINICAL_TESTS.bigfive.getInterpretation(answers);
      reviewText = `Bản tự nhìn nhận Big Five của cậu đã hoàn thành:\n${interpretation.desc}\n\nKết quả chỉ phản ánh câu trả lời hiện tại và không đánh giá sức khỏe tinh thần. Cậu có thể dùng nó như một gợi ý tự quan sát, không phải nhãn tính cách cố định.`;
      eventLog = {
        date: new Date().toISOString(),
        type: "self_reflection",
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
      const updatedTestScores = {
        ...(bio?.testScores || {}),
        [testId]: eventLog.score ?? eventLog.traits ?? eventLog.scores ?? eventLog.severity ?? eventLog.status
      };
      onUpdateCompanionState({
        lastTestDate: new Date().toDateString(),
        historyLogs: updatedLogs,
        testScores: updatedTestScores
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
      const suggestsFurtherAssessment =
        (testId === "phq9" && score >= 10) ||
        (testId === "gad7" && score >= 10) ||
        (testId === "who5" && score < 13);
      const nextStepText = phq9SafetyFlag
        ? "HugoPSY sẽ không tự điều chỉnh “thời gian điều trị” từ một bài sàng lọc. Hãy dùng bảng an toàn đang hiển thị và ưu tiên kết nối với người đáng tin cậy hoặc chuyên gia đủ chuyên môn."
        : suggestsFurtherAssessment
          ? "Kết quả đã được lưu để theo dõi xu hướng. Vì điểm số chạm ngưỡng gợi ý đánh giá thêm, cậu nên trao đổi với chuyên gia đủ chuyên môn nếu triệu chứng kéo dài hoặc ảnh hưởng sinh hoạt."
          : "Kết quả đã được lưu để theo dõi xu hướng. HugoPSY không tự suy ra chẩn đoán hoặc thay đổi thời gian chăm sóc chỉ từ một lần sàng lọc.";
      newMsgs.push({
        id: `bot-next-step-${Date.now() + 5}`,
        sender: "bot",
        text: nextStepText,
        time: new Date(Date.now() + 5)
      });
      setMessages((prev) => [...prev, ...newMsgs]);
      setChatMode("normal");
      setActiveTest(null);
      setLoading(false);
      return;
    }

    setMessages((prev) => [...prev, ...newMsgs]);
    setChatMode("normal");
    setActiveTest(null);
    setLoading(false);
  };

  const handleScanComplete = (testType, resultLog) => {
    setLoading(true);

    const safeText = (value, fallback = "Không có dữ liệu") => {
      if (value === null || value === undefined || value === "") return fallback;
      return String(value).replace(/[\r\n|]/g, " ").trim().slice(0, 100) || fallback;
    };
    let responseMsgText = "";
    if (testType === "dass") {
      responseMsgText = `HugoPSY đã lưu các giá trị được cậu kiểm tra lại từ hồ sơ DASS:\n\n` +
        `• **D:** ${safeText(resultLog.scores?.D)}\n` +
        `• **A:** ${safeText(resultLog.scores?.A)}\n` +
        `• **S:** ${safeText(resultLog.scores?.S)}\n\n` +
        "Ứng dụng không tự gắn mức độ, chẩn đoán hoặc thay đổi lộ trình từ các điểm này. Hãy đối chiếu với báo cáo gốc và trao đổi với người có chuyên môn đã thực hiện đánh giá.";
    } else if (testType === "general_medical") {
      const indices = Array.isArray(resultLog.indices) ? resultLog.indices : [];
      const rows = indices.map((item) => {
        const unit = item?.unit ? ` ${safeText(item.unit, "")}` : "";
        const reference = item?.reference ? ` · khoảng trên phiếu: ${safeText(item.reference, "")}` : "";
        return `• **${safeText(item?.name, "Chỉ số")}**: ${safeText(item?.value)}${unit}${reference}`;
      });
      responseMsgText = `HugoPSY đã lưu **${indices.length} chỉ số** sau khi cậu xác nhận:\n\n` +
        `${rows.join("\n")}\n\n` +
        "Đây là dữ liệu được chép lại bằng OCR, không phải nhận định y khoa. Ứng dụng không tự kết luận “cao/thấp/bình thường” và không thay đổi lộ trình; hãy đối chiếu báo cáo gốc hoặc trao đổi với cơ sở xét nghiệm.";
    } else {
      const validity = resultLog.validity || {};
      const clinical = Array.isArray(resultLog.clinical) ? resultLog.clinical : [];
      const validityRows = ["L", "F", "K"]
        .map((code) => `• **${code}:** ${safeText(validity[code])} T-score`)
        .join("\n");
      const clinicalRows = clinical
        .map((item) => `• **${safeText(item?.code, "Thang")}:** ${safeText(item?.score)} T-score`)
        .join("\n");
      responseMsgText = `HugoPSY đã lưu các T-score được cậu kiểm tra lại từ báo cáo:\n\n` +
        `**L–F–K**\n${validityRows}\n\n` +
        `**Các thang trên báo cáo**\n${clinicalRows || "Không có dữ liệu"}\n\n` +
        "Tên mã và điểm số được giữ nguyên như tài liệu. HugoPSY không tự xác nhận độ tin cậy, gắn nhãn bệnh, đề xuất điều trị hoặc diễn giải MMPI; việc này cần người được đào tạo và có đầy đủ bối cảnh đánh giá.";
    }

    const updatedLogs = [...historyLogs, resultLog];
    const updatedTestScores = {
      ...(bio?.testScores || {}),
      [resultLog.test || testType]: resultLog.scores ?? resultLog.clinical ?? resultLog.score
    };
    onUpdateCompanionState({
      historyLogs: updatedLogs,
      testScores: updatedTestScores
    });

    const botMsgId = `bot-scan-${Date.now()}`;
    const botMsg = {
      id: botMsgId,
      sender: "bot",
      text: responseMsgText,
      time: new Date()
    };

    setMessages((prev) => [...prev, botMsg]);
    setChatMode("normal");
    setLoading(false);

  };

  // Periodic self-check prompt for active roadmap users.
  useEffect(() => {
    const isRoadmapActive = healingActive || bio?.healingActive || false;
    if (!isRoadmapActive) return;

    const sessionPrompted = typeof sessionStorage !== "undefined" && sessionStorage.getItem("hugopsy_deploy_test_sweep_prompted");
    const periodicCheck = checkPeriodicAssessmentDue(historyLogs, bio?.lastTestDate || "");

    if (sessionPrompted && !periodicCheck.isDue) return;

    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("hugopsy_deploy_test_sweep_prompted", "true");
    }

    const nameParts = (bio?.displayName || bio?.name || "cậu").trim().split(" ");
    const friendlyName = nameParts[nameParts.length - 1];

    const isPeriodicPrompt = periodicCheck.isDue && sessionPrompted;
    const msgText = isPeriodicPrompt
      ? `Chào ${friendlyName}. Đã ${periodicCheck.daysElapsed} ngày kể từ lần tự đánh giá gần nhất. Nếu thấy phù hợp, cậu có thể chọn một công cụ bên dưới để xem xu hướng tự báo cáo; không cần làm tất cả cùng lúc.`
      : `Chào ${friendlyName}! Nếu thấy phù hợp, cậu có thể chọn một công cụ tự đánh giá bên dưới. Không cần làm tất cả cùng lúc và kết quả không phải chẩn đoán.`;

    const sweepMessage = {
      id: `deploy-test-sweep-${Date.now()}`,
      sender: "bot",
      text: `${msgText} [[SUGGEST:phq9,gad7,who5,bigfive]]`,
      time: new Date(),
      suggestPhq9: true,
      suggestGad7: true,
      suggestWho5: true,
      suggestBigFive: true,
    };

    setMessages(prev => {
      if (prev.some(m => m.id.startsWith("deploy-test-sweep-"))) return prev;
      return [...prev, sweepMessage];
    });
  }, [healingActive, bio, historyLogs]);

  // Free-text send: bypasses dialog tree, checks local intents, else calls LLM AI fallback.
  // Accepts optional `overrideText` so quick-reply chips can auto-send without going through inputText state.
  const handleSendFreeText = async (overrideText) => {
    const text = (typeof overrideText === "string" ? overrideText : inputText).trim();
    if (!text || loading) return;
    // Clear chips and any in-progress typed text immediately on every send.
    setChatQuickReplies([]);
    setInputText("");
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

    // 1. Local fast-path: handle ALL matched intents offline — no AI call consumed.
    // LLM is only invoked when nothing matches (truly open-ended, novel messages).
    const matched = findMatchingIntent(text, bio, historyLogs);
    if (matched) {
      setInputText("");
      const userMsg = { id: `user-text-${Date.now()}`, sender: "user", text, time: new Date() };
      setMessages(prev => [...prev, userMsg]);
      setTypingLabel(getTypingLabel(text, matched.id));
      setLoading(true);
      // Telemetry only — lets us measure real local-match coverage vs. AI/fallback tiers.
      botManager.logLocalMatch(text, matched.id);

      // Save auto-collected emotional check-in status if returned by the intent
      if (matched.companionUpdate?.newLog && onUpdateCompanionState) {
        onUpdateCompanionState({ historyLogs: [...historyLogs, matched.companionUpdate.newLog] });
      }

      if (matched.id === "crisis") {
        reportCrisisToAdmin(text, [...messages, userMsg]);
        // Arm the SOS beacon immediately: a cancellable 15s countdown, then
        // the phone sirens so people nearby can step in (see EmergencySiren).
        setSosPromptOpen(true);
      }

      // Natural typing delay simulation, then drip the reply chunk(s) in
      setTimeout(() => {
        pushBotMessageChunks(matched.reply, {
          suggestPhq9: matched.suggestPhq9,
          suggestGad7: matched.suggestGad7,
          showInlineBreathing: matched.showInlineBreathing,
          showInlineCbt: matched.showInlineCbt,
          showInlineBuy: matched.showInlineBuy,
          quickActions: matched.quickActions || null
        }).then(() => {
          setLoading(false);
          // Show quick-reply chips once reply has fully dripped in.
          if (matched.quickReplies?.length) setChatQuickReplies(matched.quickReplies);
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
    // 2. Full conversational LLM — only reached when no local path fits.
    setInputText("");
    const userMsg = { id: `user-text-${Date.now()}`, sender: "user", text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setTypingLabel(getTypingLabel(text, null));
    setLoading(true);

    // 4. Streaming conversational LLM AI server (costs 3 tokens on success).
    const bonusTokens = bio?.bonusChatTokens || 0;
    if (remainingChatTokens + bonusTokens <= 0) {
      setLoading(false);
      setShowTokenExchangeModal(true); // Open exchange modal directly
      return;
    }

    const botMsgId = `bot-text-${Date.now()}`;
    const localSafetyReply = createLocalSafetyReply(text);
    await botManager.chatStream(
      text,
      (chunkText) => {
        setLoading(false);
        const safeChunkText = sanitizeStreamChunk(chunkText, localSafetyReply);
        // The LLM may emit "|||" mid-stream as its multi-bubble separator —
        // while still streaming there's only one live bubble, so just show
        // it as a paragraph break rather than the raw delimiter.
        const displayText = safeChunkText.split("|||").join("\n\n");
        // Batch setMessages to at most one per animation frame — prevents
        // a React setState storm on high-frequency SSE chunks (60fps cap).
        _pendingChunkRef.current = { text: displayText, id: botMsgId };
        if (_rafRef.current) return;
        _rafRef.current = requestAnimationFrame(() => {
          _rafRef.current = null;
          const pending = _pendingChunkRef.current;
          if (!pending) return;
          setMessages(prev => {
            if (!prev.some(m => m.id === pending.id)) {
              return [...prev, { id: pending.id, sender: "bot", text: pending.text, time: new Date() }];
            }
            return prev.map(m => m.id === pending.id ? { ...m, text: pending.text } : m);
          });
        });
      },
      (botResponse) => {
        // Flush any pending RAF before replacing the live bubble with split chunks.
        if (_rafRef.current) { cancelAnimationFrame(_rafRef.current); _rafRef.current = null; }
        _pendingChunkRef.current = null;
        
        if (botResponse.outOfTokens) {
          setLoading(false);
          setMessages(prev => prev.filter(m => m.id !== botMsgId));
          setShowTokenExchangeModal(true);
          return;
        }

        // The server only charges (3 tokens, or a bonus token) after a confirmed successful
        // reply — errors never cost anything. Resync from the server instead of guessing locally.
        refreshRemainingTokens();
        if (botResponse.bioUpdate && onProfileUpdate) {
          applyBioUpdate(botResponse.bioUpdate);
        }
        const finalBotResponse = normalizeFinalResponse(botResponse, localSafetyReply);
        // Now that streaming is done, replace the single live bubble with the
        // real split bubbles (the LLM was asked to separate them with "|||").
        const chunks = finalBotResponse.reply.split("|||").map(c => c.trim()).filter(Boolean);
        setMessages(prev => prev.filter(m => m.id !== botMsgId));
        pushBotMessageChunks(chunks.length ? chunks : [finalBotResponse.reply], {
          suggestPhq9: finalBotResponse.suggestPhq9,
          suggestGad7: finalBotResponse.suggestGad7,
          suggestWho5: finalBotResponse.suggestWho5,
          suggestBigFive: finalBotResponse.suggestBigFive,
          showInlineBreathing: finalBotResponse.showInlineBreathing,
          showInlineCbt: finalBotResponse.showInlineCbt,
          showInlineBuy: finalBotResponse.showInlineBuy,
        }).then(() => {
          setLoading(false);
          setChatQuickReplies(
            deriveSmartFollowUps(text, finalBotResponse.reply, currentMood),
          );
        });
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
        <div className="psy-chat-safe-header shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white/95 dark:bg-[#0e0e12]/95 backdrop-blur-sm border-b border-border/60">
          <button
            type="button"
            onClick={() => { setShowTherapyOverlay(false); setTherapyInitialMethod(null); }}
            className="w-8 h-8 -ml-1 rounded-full flex items-center justify-center text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <p className="text-[13px] font-extrabold text-foreground">{t("hugoPsy.chat.thuGianTuCham")}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <TherapyTab
            onClaimChallenge={onClaimChallenge}
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
        <TokenExchangeModal
          isOpen={showTokenExchangeModal}
          onClose={() => setShowTokenExchangeModal(false)}
          email={bio?.email}
          onSuccess={() => {
            // Gửi lại tin nhắn tự động hoặc yêu cầu người dùng thử lại
            showToast?.(t("hugoPsy.chat.banDaCoToken"), "success");
          }}
          showToast={showToast}
        />
      </div>
    );
  }

  const aura = getAuraColors(currentMood);

  return (
    <div ref={chatWrapperRef} className="flex flex-col flex-1 h-full min-h-0 bg-zinc-50/50 dark:bg-[#060609] animate-fadeIn relative overflow-hidden md:rounded-3xl shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
      
      {/* Ambient background glow (Dynamic Aura) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -top-32 -right-32 w-[500px] h-[500px] blur-[100px] rounded-full transition-colors duration-1000 ${aura.topRight}`}
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className={`absolute top-1/4 -left-32 w-[400px] h-[400px] blur-[120px] rounded-full transition-colors duration-1000 ${aura.middleLeft}`}
        />
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className={`absolute bottom-1/4 right-1/4 w-[300px] h-[300px] blur-[100px] rounded-full transition-colors duration-1000 ${aura.bottomRight}`}
        />
      </div>

      {/* ── Header — redesigned ────────────────────────────────────────────────── */}
      <div
        className="psy-chat-safe-header shrink-0 z-20 flex items-center gap-3 px-3 sm:px-4 py-3 bg-gradient-to-b from-white/90 via-white/50 to-transparent dark:from-[#060609]/90 dark:via-[#060609]/50 dark:to-transparent pb-8"
      >
        {/* Back button (mobile fullscreen only) */}
        {onExitFullscreen && (
          <button type="button" onClick={onExitFullscreen}
            className="md:hidden -ml-1 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-zinc-100 dark:hover:bg-white/[0.07] active:scale-90 transition-all shrink-0">
            <span className="material-symbols-outlined text-[22px]">chevron_left</span>
          </button>
        )}

        {/* Monochrome app mark with a semantic presence dot. */}
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center shadow-sm">
            <BrainCircuit className="h-[18px] w-[18px]" strokeWidth={2} />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-[#0d0c16] shadow-sm" />
        </div>

        {/* Bot identity */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-extrabold text-foreground leading-tight truncate">
            HugoPSY
          </p>
          <p className="text-[9.5px] text-emerald-500 dark:text-emerald-400 font-semibold leading-none mt-0.5">
            {loading ? typingLabel : t("hugoPsy.chat.trucTuyen")}
          </p>
        </div>

        {/* Adaptive Persona Pill */}
        {adaptivePersona?.autoEnabled && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-500 dark:text-indigo-400 shrink-0 cursor-pointer"
            title={adaptivePersona.hint || t("hugoPsy.chat.cheDoTuDong")}
          >
            <span className="material-symbols-outlined text-[13px]">{adaptivePersona.icon}</span>
            <span className="text-[10px] font-black whitespace-nowrap">{adaptivePersona.label}</span>
          </div>
        )}

        {/* Journey progress pill */}
        {journeyProgress && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            <span className="material-symbols-outlined text-[12px]">route</span>
            <span className="text-[10px] font-black whitespace-nowrap">{t("hugoPsy.chat.ngay")} {journeyProgress.currentDay}/{journeyProgress.duration}</span>
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Token progress ring capsule */}
          {(() => {
            const totalTokens = remainingChatTokens + (bio?.bonusChatTokens || 0);
            const percentage = Math.min(100, Math.max(0, (totalTokens / maxChatTokens) * 100));
            const radius = 8;
            const circumference = 2 * Math.PI * radius; // ~50.26
            const strokeDashoffset = circumference - (percentage / 100) * circumference;
            const TokenIcon = tokenLockMinutes > 0 ? LockKeyhole : Zap;

            return (
              <button 
                type="button"
                onClick={() => setShowTokenExchangeModal(true)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[10px] font-black text-foreground/80 transition-all bg-white/70 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-zinc-800/40 shadow-sm active:scale-95"
                title={tokenLockMinutes > 0 ? `Bị khóa trong ~${tokenLockMinutes} phút` : `Token: ${totalTokens}/${maxChatTokens} (Click để đổi thêm)`}
              >
                <div className="relative w-4 h-4 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="8" 
                      cy="8" 
                      r={radius} 
                      className="stroke-zinc-200 dark:stroke-zinc-800/60" 
                      strokeWidth="1.5" 
                      fill="transparent" 
                    />
                    <motion.circle 
                      cx="8" 
                      cy="8" 
                      r={radius} 
                      className="stroke-foreground/70"
                      strokeWidth="1.5" 
                      fill="transparent" 
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </svg>
                  <TokenIcon className="absolute h-2.5 w-2.5 text-foreground/75" strokeWidth={2.25} />
                </div>
                <span className="font-extrabold text-foreground/80">
                  {tokenLockMinutes > 0 ? t("hugoPsy.chat.khoa") : `${totalTokens}/${maxChatTokens}`}
                </span>
              </button>
            );
          })()}

          {/* Re-test button (desktop, inside active journey) */}
          {healingActive && (
            <button type="button"
              onClick={() => {
                const lastTestDateStr = localStorage.getItem("banhocduong_last_test_date");
                if (lastTestDateStr) {
                  const h = (Date.now() - new Date(lastTestDateStr).getTime()) / 3_600_000;
                  if (h < 32) { showToast?.(`Đợi thêm ${Math.ceil(32 - h)} giờ nhé.`, "warning"); return; }
                }
                setShowTestsMenu(true);
              }}
              className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black active:scale-90 transition-all">
              <span className="material-symbols-outlined text-[11px]">refresh</span>
              {t("hugoPsy.chat.testLai")}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowCoachMenu((open) => !open)}
            title={t("hugoPsy.coach.title")}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              showCoachMenu
                ? "bg-foreground/10 text-foreground ring-1 ring-foreground/10"
                : "text-muted-foreground/70 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
            }`}
          >
            <BrainCircuit className="h-[17px] w-[17px]" />
          </button>

          {/* Venting mode toggle */}
          <button type="button" onClick={toggleVentingMode}
            title={isVentingMode ? t("hugoPsy.chat.thoatCheDoTrut") : t("hugoPsy.chat.cheDoTrutGian")}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isVentingMode
                ? "bg-foreground/10 text-foreground border border-foreground/15"
                : "text-muted-foreground/70 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
            }`}>
            {isVentingMode
              ? <Flame className="h-[17px] w-[17px]" strokeWidth={2} />
              : <Smile className="h-[17px] w-[17px]" strokeWidth={2} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showCoachMenu && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="absolute left-3 right-3 top-[76px] z-30 mx-auto max-w-xl rounded-[24px] border border-white/60 bg-white/88 p-3 shadow-[0_24px_70px_rgba(31,41,55,0.18)] backdrop-blur-3xl dark:border-white/10 dark:bg-[#17171b]/92"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <div>
                <p className="text-[13px] font-bold tracking-[-0.02em] text-foreground">{t("hugoPsy.coach.title")}</p>
                <p className="text-[10px] text-muted-foreground">{t("hugoPsy.coach.subtitle")}</p>
              </div>
              <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                {t("hugoPsy.coach.private")}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handleCoachAction("insight")}
                className="flex min-h-[72px] items-start gap-2.5 rounded-2xl border border-border/60 bg-card/80 p-3 text-left transition active:scale-[0.98]"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-foreground/[0.06] text-foreground/75">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span>
                  <strong className="block text-[11px] text-foreground">{t("hugoPsy.coach.insight")}</strong>
                  <small className="mt-1 block text-[9px] leading-4 text-muted-foreground">{t("hugoPsy.coach.insightDescription")}</small>
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleCoachAction("plan")}
                className="flex min-h-[72px] items-start gap-2.5 rounded-2xl border border-border/60 bg-card/80 p-3 text-left transition active:scale-[0.98]"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-foreground/[0.06] text-foreground/75">
                  <ClipboardCheck className="h-4 w-4" />
                </span>
                <span>
                  <strong className="block text-[11px] text-foreground">{t("hugoPsy.coach.plan")}</strong>
                  <small className="mt-1 block text-[9px] leading-4 text-muted-foreground">{t("hugoPsy.coach.planDescription")}</small>
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleCoachAction("assessment")}
                className="flex min-h-[72px] items-start gap-2.5 rounded-2xl border border-border/60 bg-card/80 p-3 text-left transition active:scale-[0.98]"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-foreground/[0.06] text-foreground/75">
                  <HeartHandshake className="h-4 w-4" />
                </span>
                <span>
                  <strong className="block text-[11px] text-foreground">{t("hugoPsy.coach.assessment")}</strong>
                  <small className="mt-1 block text-[9px] leading-4 text-muted-foreground">{t("hugoPsy.coach.assessmentDescription")}</small>
                </span>
              </button>
            </div>
            <p className="mt-2 px-1 text-[9px] leading-4 text-muted-foreground">
              {t("hugoPsy.coach.disclaimer")}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tests bottom sheet ──────────────────────────────────────────────────── */}
      {showTestsMenu && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/50 backdrop-blur-sm"
          onClick={() => setShowTestsMenu(false)}>
          <div className="bg-white dark:bg-card rounded-t-3xl px-5 pt-4 pb-6 space-y-2.5"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t("hugoPsy.assessment.title")}</p>
              <button type="button" onClick={() => setShowTestsMenu(false)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center active:scale-90">
                <span className="material-symbols-outlined text-sm text-zinc-500">close</span>
              </button>
            </div>
            {[
              { id:'phq9',    label:'PHQ-9',    desc:t("hugoPsy.chat.sangLocTrieuChung"), cls:'text-rose-600 bg-rose-500/8 border-rose-300/40 dark:text-rose-400 dark:border-rose-700/30' },
              { id:'gad7',    label:'GAD-7',    desc:t("hugoPsy.chat.sangLocTrieuChung2"), cls:'text-cyan-600 bg-cyan-500/8 border-cyan-300/40 dark:text-cyan-400 dark:border-cyan-700/30' },
              { id:'who5',    label:'WHO-5',    desc:t("hugoPsy.chat.trangThaiTinhThan"),  cls:'text-emerald-600 bg-emerald-500/8 border-emerald-300/40 dark:text-emerald-400 dark:border-emerald-700/30' },
              { id:'bigfive', label:'Big Five', desc:t("hugoPsy.chat.tracNghiemNhanCach"), cls:'text-indigo-600 bg-indigo-500/8 border-indigo-300/40 dark:text-indigo-400 dark:border-indigo-700/30' },
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

      {/* Mobile quick actions keep every HugoPSY capability reachable from chat. */}
      <div className="md:hidden grid grid-cols-3 gap-2 px-3 py-2 bg-muted/35 border-b border-border/50 z-20 shrink-0">
          <button
            type="button"
            onClick={() => setActiveModalDrawer("therapy")}
            className="min-w-0 px-2.5 py-2 rounded-xl text-[10px] font-bold text-foreground/80 border border-border/70 bg-background/65 transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <HeartPulse className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span className="truncate">{t("hugoPsy.chat.thuGian")}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModalDrawer("sleep")}
            className="min-w-0 px-2.5 py-2 rounded-xl text-[10px] font-bold text-foreground/80 border border-border/70 bg-background/65 transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <MoonStar className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span className="truncate">{t("hugoPsy.chat.giacNgu")}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModalDrawer("evaluation")}
            className="min-w-0 px-2.5 py-2 rounded-xl text-[10px] font-bold text-foreground/80 border border-border/70 bg-background/65 transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <ClipboardCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span className="truncate">{t("hugoPsy.chat.danhGia")}</span>
          </button>
      </div>

      {/* ── Messages area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden relative bg-transparent z-10">
        {chatMode === "normal" && (
          <ChatMessages
            messages={messages}
            completedMessageIds={completedMessageIds}
            setCompletedMessageIds={setCompletedMessageIds}
            onStartTest={handleStartTest}
            onSelectDuration={handleSelectDuration}
            loading={loading}
            typingLabel={typingLabel}
            onNavigateToTab={onNavigateToTab}
            messagesEndRef={messagesEndRef}
            onUnlockFeature={handleUnlockFeature}
            unlockingMethodId={unlockingMethodId}
            onMoodSelect={handleMoodSelect}
            moodCheckinDone={moodCheckinDone}
            keyboardInset={keyboardInset}
            onOpenVerification={openVerificationForm}
            joyBalance={joyBalance}
            unlockedFeatures={bio?.unlockedCompanionFeatures || []}
            bio={bio}
            historyLogs={historyLogs}
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

      {/* ── Input section (Floating Dynamic Island) ─────────────────────────────────────────────────────── */}
      {chatMode === "normal" && (
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none pb-4 px-3 sm:px-6 will-change-transform"
          style={hasNativeKeyboard ? {
            // VirtualKeyboard API path: the browser updates this env() on the
            // compositor thread, so the bar rides the keyboard animation 1:1
            // with zero jank — no JS transform, no transition needed.
            bottom: "env(keyboard-inset-height, 0px)",
            paddingBottom: keyboardInset > 0 ? "8px" : "max(16px, env(safe-area-inset-bottom))",
          } : {
            // iOS Safari fallback: lift with a GPU transform. iOS fires a
            // single late viewport resize (not per-frame), so a short ease
            // makes the jump feel animated instead of teleporting.
            bottom: 0,
            transform: keyboardInset > 0 ? `translateY(-${keyboardInset}px)` : "none",
            transition: "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
            paddingBottom: keyboardInset > 0 ? "8px" : "max(16px, env(safe-area-inset-bottom))",
          }}
        >
          <div className="pointer-events-auto max-w-3xl mx-auto space-y-2">
            {/* Quick Purchase Ribbon when out of tokens */}
            {(remainingChatTokens + (bio?.bonusChatTokens || 0)) <= 0 && (
              <div className="mx-2 px-4 py-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-500/20 dark:border-amber-500/30 rounded-2xl flex items-center justify-between shadow-sm animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-sm animate-pulse">bolt</span>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">{t("hugoPsy.chat.hetTokenTroChuyen")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTokenExchangeModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white text-[10px] font-black transition-all shadow-md shrink-0"
                >
                  {t("hugoPsy.chat.muaNhanhBangJoy")}
                </button>
              </div>
            )}

            <div className="bg-white/60 dark:bg-[#060609]/60 backdrop-blur-3xl rounded-[32px] border border-border/50/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-1.5 transition-all">
              <ChatInputBar
                inputRef={inputRef}
                value={inputText}
                onChange={setInputText}
                onSend={handleSendFreeText}
                disabled={tokenLockMinutes > 0 || (remainingChatTokens + (bio?.bonusChatTokens || 0)) <= 0 || loading}
                placeholder={
                  tokenLockMinutes > 0
                    ? `Token PSY bị khóa ~${tokenLockMinutes} phút...`
                    : (remainingChatTokens + (bio?.bonusChatTokens || 0)) <= 0
                    ? t("hugoPsy.chat.hetTokenHomNay")
                    : isVentingMode
                    ? t("hugoPsy.chat.trutBoMoiMuon")
                    : t("hugoPsy.chat.nhanTinVoiHugopsy")
                }
                quickReplies={chatQuickReplies}
                onQuickReply={(qr) => {
                  const msgText = typeof qr === "string" ? qr : (qr.text || qr.label || "");
                  if (!msgText || loading) return;
                  setInputText("");
                  handleSendFreeText(msgText);
                }}
                onUploadReport={() => setChatMode("scan")}
              />
            </div>
          </div>
        </div>
      )}
      <TokenExchangeModal
        isOpen={showTokenExchangeModal}
        onClose={() => setShowTokenExchangeModal(false)}
        email={bio?.email}
        onSuccess={() => {
          showToast?.(t("hugoPsy.chat.banDaCoToken"), "success");
        }}
        showToast={showToast}
      />
      {/* Interactive Modal Drawer overlay for Therapy, Sleep, or Evaluation in PWA / Chat mode */}
      <AnimatePresence>
        {activeModalDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative text-left"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/60 bg-muted/30">
                <span className="flex min-w-0 items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground">
                  {activeModalDrawer === "therapy" && <><HeartPulse className="h-4 w-4 shrink-0" /><span>{t("hugoPsy.chat.baiTapTinhTam")}</span></>}
                  {activeModalDrawer === "sleep" && <><MoonStar className="h-4 w-4 shrink-0" /><span>{t("hugoPsy.chat.nhatKyChuKy")}</span></>}
                  {activeModalDrawer === "evaluation" && <><ClipboardCheck className="h-4 w-4 shrink-0" /><span>{t("hugoPsy.chat.baoCaoDanhGia")}</span></>}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveModalDrawer(null)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {activeModalDrawer === "therapy" && (
                  <TherapyTab
                    onNavigateToTab={onNavigateToTab}
                    onClaimChallenge={onClaimChallenge}
                    bio={bio}
                    historyLogs={historyLogs}
                    chatMessages={messages}
                    onUpdateCompanionState={onUpdateCompanionState}
                    healingActive={healingActive}
                    showToast={showToast}
                  />
                )}
                {activeModalDrawer === "sleep" && (
                  <SleepTracker bio={bio} sleepAutoDetect={sleepAutoDetect} />
                )}
                {activeModalDrawer === "evaluation" && (
                  <EvaluationTab onNavigateToTab={onNavigateToTab} bio={bio} historyLogs={historyLogs} showToast={showToast} />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Calm safety prompt; SOS sound only starts after an explicit tap. */}
      <CrisisSosCountdown open={sosPromptOpen} onClose={() => setSosPromptOpen(false)} />
    </div>
  );
}
