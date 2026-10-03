import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ClipboardCheck,
  Flame,
  HeartHandshake,
  Smile,
  Sparkles,
} from "lucide-react";
import { CLINICAL_TESTS } from "./clinicalTests";
import ChatMessages from "./ChatMessages";
import ClinicalTestPanel from "./ClinicalTestPanel";
import ChatInputBar from "./ChatInputBar";
import { CrisisSosCountdown } from "./EmergencySiren";

import { getLockedFields, fieldLabel, parseProfileCommand } from "./constants/bioFields";
import { webPushHelper } from "../../../utils/webPushHelper";
import { useKeyboardInset, useVirtualKeyboardOptIn } from "../../../hooks/useKeyboardVisible";
import { useChatEngine } from "./hooks/useChatEngine";
import { joyText } from "../../../lib/joyDisplay";

import BotManager from "../../../services/classes/CompanionBot/BotManager";
import { buildLocalReply } from "../../../services/classes/CompanionBot/localFallback";
import { findMatchingIntent, removeVietnameseTones } from "./constants/intentClassifier";
import { checkPeriodicAssessmentDue } from "./utils/weeklyDigestHelper";

import { THERAPY_METHODS } from "./constants/therapyMethods";
import { companionPromptHint } from "./constants/companions";
import { BorderBeam } from "border-beam";
import { CompanionAvatar } from "./AnimulaAvatar";
import { notify } from "../../../lib/notify";
import { isCrisisText } from "./constants/intentClassifier";
import * as brain from "./brain/companionBrain";
import { avatarMotion, buildCharacterPrompt, buildMessages, emotionOf, feel, loadMind, saveMind, stripExpr, sulkGreeting, voiceReply } from "./brain/companionMind";
import EmotionGauge from "./components/EmotionGauge";
import { useJoyStore } from "../../../stores/joyStore";

// Raw chat text is only kept for 7 days — older messages are permanently
// dropped to keep the stored history light. Long-term "memory" instead comes
// from historyLogs (mood check-ins, test scores), which are NOT pruned here —
// the AI leans on those aggregated indicators to still feel like it
// remembers the user well beyond the 7-day chat window.
const CHAT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
function localDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function pruneOldMessages(msgs) {
  if (!Array.isArray(msgs)) return msgs;
  const cutoff = Date.now() - CHAT_RETENTION_MS;
  return msgs.filter(m => {
    const t = m.time instanceof Date ? m.time.getTime() : new Date(m.time).getTime();
    return Number.isNaN(t) || t >= cutoff;
  });
}

// Luật cục bộ vẫn tự trả lời những intent này dù còn lượt AI: an toàn (crisis)
// phải tất định; lệnh mở/mở khoá bài tập là thao tác, không phải trò chuyện;
// chỉ số đọc thẳng từ historyLogs chính xác hơn để AI diễn giải lại.
const LOCAL_ONLY_INTENTS = new Set(["crisis", "therapy_open", "therapy_locked", "metrics_report"]);

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

// Thẻ "đánh thức" — chỉ hiện khi máy chạy được bộ não mà chưa tải. Trong lúc
// tải, chat vẫn dùng bộ luật trên máy nên người dùng không phải chờ.
function BrainWakeCard({ companion, status, progress, onWake }) {
  const dark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const loading = status === "loading";
  // Kể bằng câu chuyện, không bằng thông số: người dùng đang gặp một nhân vật,
  // không phải đang cài phần mềm.
  const title = loading
    ? `${companion.name} đang dụi mắt thức dậy…`
    : status === "error" ? `${companion.name} ngủ say quá` : `Đánh thức khả năng trò chuyện của ${companion.name}`;
  const line = status === "error"
    ? `Gọi ${companion.name} thêm lần nữa nhé.`
    : `${companion.name} đang ngủ. Gọi dậy để ${companion.name} thật sự lắng nghe và trò chuyện cùng cậu.`;
  return (
    <BorderBeam size="md" colorVariant="colorful" theme={dark ? "dark" : "light"} strength={0.7} active={!loading} borderRadius={22}>
      <div className="flex items-center gap-3 rounded-[22px] border border-border bg-card px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-foreground">{title}</p>
          {loading ? (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(4, Math.round(progress * 100))}%`, background: companion.color }} />
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">{line}</p>
          )}
        </div>
        {!loading && (
          <button type="button" onClick={onWake}
            className="min-h-[44px] shrink-0 rounded-full px-4 text-[15px] font-semibold text-white"
            style={{ background: "var(--ax, #0A84FF)" }}>
            {status === "error" ? "Gọi lại" : "Đánh thức"}
          </button>
        )}
      </div>
    </BorderBeam>
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
  companion,
  companionDays: daysTogether = 0,
  handoffLetter = null,
  onActivity,
  isGuestMode = false,
  requireAccount
}) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "vi").split("-")[0];
  const [completedMessageIds, setCompletedMessageIds] = useState(new Set());
  const [messages, setMessages] = useState([]);
  const [currentMood, setCurrentMood] = useState(3);

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
  const [showCoachMenu, setShowCoachMenu] = useState(false);

  const [unlockingMethodId, setUnlockingMethodId] = useState(null);
  const joyBalance = useJoyStore(s => s.balance);
  const fetchJoyBalance = useJoyStore(s => s.fetchBalance);
  const { createLocalSafetyReply } = useChatEngine();
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

  // Bot nói bằng giọng của nhân vật đang đồng hành (constants/companions.js).
  const botBio = useMemo(
    () => ({ ...bio, companionPersonaHint: companionPromptHint(companion) }),
    [bio, companion],
  );
  const botManagerRef = useRef(null);
  if (!botManagerRef.current) {
    botManagerRef.current = new BotManager(botBio, historyLogs, healingActive, messages);
  }
  const botManager = botManagerRef.current;
  useEffect(() => {
    botManager.updateContext(botBio, historyLogs, healingActive, messages);
  }, [botManager, botBio, historyLogs, healingActive, messages]);

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
    if (isGuestMode || !bio?.email) return;
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
  }, [bio?.email, isGuestMode]);

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

  // Daily Pulse handler — saves mood + energy + pressure + current need as one
  // daily signal, then turns it into a concrete next step without claiming a
  // diagnosis. Re-checking on the same day replaces that day's pulse.
  const handleMoodSelect = useCallback(async (pulseInput) => {
    if (isGuestMode || !bio?.email) {
      requireAccount?.();
      throw new Error("ACCOUNT_REQUIRED");
    }
    const pulse = typeof pulseInput === "number"
      ? { mood: pulseInput, energy: 3, stress: 3, need: "talk" }
      : pulseInput;
    const moodValue = Number(pulse?.mood || 3);
    const energy = Number(pulse?.energy || 3);
    const stress = Number(pulse?.stress || 3);
    const need = ["calm", "focus", "rest", "talk"].includes(pulse?.need) ? pulse.need : "talk";

    const today = localDateKey();
    const newLog = {
      date: new Date().toISOString(),
      type: "checkin",
      mood: moodValue,
      energy,
      stress,
      need,
      source: "daily_pulse",
      note: "Daily Pulse",
    };
    const previousLogs = historyLogs || [];
    const updatedLogs = [
      ...previousLogs.filter((log) => !(log?.type === "checkin" && localDateKey(log.date) === today)),
      newLog,
    ];

    // Do not show a false success state if persistence failed.
    const saved = await onUpdateCompanionState?.({ lastCheckinDate: today, historyLogs: updatedLogs });
    if (!saved) throw new Error("DAILY_PULSE_SAVE_FAILED");

    setCurrentMood(moodValue);
    setMoodCheckinDone(true);
    // Strip the completed picker from whichever daily greeting owns it so it
    // saves as a normal message instead of reopening after remount.
    setMessages(prev => prev.map(m => m.type === "mood_checkin" ? { ...m, type: undefined } : m));

    const name = bio?.displayName?.trim().split(" ").pop() || "bạn";
    const MOOD_LABELS = { 5: "Rất vui", 4: "Tốt", 3: "Bình thường", 2: "Mỏi mệt", 1: "Kiệt sức" };
    const NEED_LABELS = { calm: "bình tâm", focus: "tập trung", rest: "nghỉ ngơi", talk: "được lắng nghe" };
    const NEED_PLANS = {
      calm: ["Thả lỏng vai và thở chậm trong 2 phút", "Tạm rời màn hình 5 phút", "Quay lại với đúng một việc nhỏ"],
      focus: ["Chọn một việc quan trọng nhất", "Tập trung 15 phút và tắt thông báo", "Nghỉ 3 phút rồi mới quyết định vòng tiếp theo"],
      rest: ["Uống nước và rời màn hình", "Cho phép bản thân nghỉ 10 phút không cảm thấy có lỗi", "Giảm một việc không bắt buộc hôm nay"],
      talk: ["Gọi tên điều đang nặng nhất", "Chọn một người an toàn để nhắn tin", "Kể HugoPSY một chuyện, từng phần nhỏ cũng được"],
    };
    const NEED_CHIPS = {
      calm: ["Bài thở 2 phút", "Giúp tớ hạ áp lực", "Mở không gian yên tĩnh"],
      focus: ["Chia nhỏ việc cần làm", "Bắt đầu 15 phút", "Giảm kế hoạch hôm nay"],
      rest: ["Cho tớ bài thư giãn", "Lập kế hoạch nghỉ", "Xem giấc ngủ của tớ"],
      talk: ["Tớ muốn kể rõ hơn", "Cứ lắng nghe tớ", "Giúp tớ gọi tên cảm xúc"],
    };

    const userMsg = {
      id: `mood-${Date.now()}`,
      sender: "user",
      text: `Daily Pulse · ${MOOD_LABELS[moodValue]} · Năng lượng ${energy}/5 · Áp lực ${stress}/5`,
      time: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    setTimeout(() => {
      const plan = NEED_PLANS[need];
      const observation = stress >= 4
        ? `${name} đang ghi nhận mức áp lực khá cao; hôm nay mình sẽ ưu tiên giảm tải trước.`
        : energy <= 2
          ? `Năng lượng của ${name} đang thấp; kế hoạch hôm nay nên ngắn và có khoảng nghỉ.`
          : `Nhịp hôm nay đã được lưu. HugoPSY sẽ dùng nó để so xu hướng theo tuần.`;
      pushBotMessageChunks([
        observation,
        `Cậu cần **${NEED_LABELS[need]}** nhất. Kế hoạch nhẹ hôm nay:\n1. ${plan[0]}\n2. ${plan[1]}\n3. ${plan[2]}`,
      ]).then(() => {
        setLoading(false);
        setChatQuickReplies(NEED_CHIPS[need] || NEED_CHIPS.talk);
      });
    }, 500);
  }, [bio, historyLogs, isGuestMode, onUpdateCompanionState, pushBotMessageChunks, requireAccount]);

  // Buy-now from the chat's "unlock" quick action (see therapy_locked intent
  // in intentClassifier.js) — same endpoint/flow as TherapyTab's own unlock
  // button, just triggered from a chat bubble instead of the grid card.
  const handleUnlockFeature = useCallback(async (action) => {
    if (!bio?.email || unlockingMethodId) return;
    if (joyBalance < action.cost) {
      showToast?.(`Bạn cần ${joyText(action.cost)} để mở khoá tính năng này. Số dư hiện tại: ${joyText(joyBalance)}.`, "warning");
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
      onNavigateToTab?.("therapy", action.methodId);
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setUnlockingMethodId(null);
    }
  }, [bio?.email, unlockingMethodId, joyBalance, onProfileUpdate, fetchJoyBalance, showToast, pushBotMessageChunks, onNavigateToTab]);

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
    } catch {
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
  // Chat nay chạy trên máy nên không còn ngân sách lượt; chỉ giữ khoá bảo mật
  // (máy chủ khoá tài khoản lạm dụng — xem security lockout).
  const [tokenLockMinutes, setTokenLockMinutes] = useState(0);
  const [inputText, setInputText] = useState("");
  const [chatQuickReplies, setChatQuickReplies] = useState([]);
  const [moodCheckinDone, setMoodCheckinDone] = useState(false);
  const [typingLabel, setTypingLabel] = useState("Đang soạn tin...");

  const refreshRemainingTokens = useCallback(async () => {
    if (isGuestMode) return;
    const data = await botManager.getRemainingTokens();
    if (data) setTokenLockMinutes(data.locked ? (data.lockMinutes || 180) : 0);
  }, [botManager, isGuestMode]);

  useEffect(() => {
    if (!isGuestMode) refreshRemainingTokens();
  }, [refreshRemainingTokens, isGuestMode]);

  const messagesEndRef = useRef(null);
  const lastSavedMessageIdRef = useRef("");
  const inputRef = useRef(null);
  // RAF batch: commit streaming chunks at most once per animation frame (60fps cap).
  const _rafRef = useRef(null);
  const _pendingChunkRef = useRef(null);

  // ── Bộ não trên máy ────────────────────────────────────────────────────────
  // checking → unsupported | asleep | loading → awake | error
  const [brainStatus, setBrainStatus] = useState("checking");
  const [brainProgress, setBrainProgress] = useState(0);
  const [mind, setMind] = useState(() => loadMind(companion));
  useEffect(() => { setMind(loadMind(companion)); }, [companion]);
  // Lâu không gặp → nhân vật mở lời bằng câu lẫy (một lần, sau khi chat đã nạp).
  const sulkDoneRef = useRef(false);
  useEffect(() => {
    if (sulkDoneRef.current || messages.length === 0) return;
    sulkDoneRef.current = true;
    const line = sulkGreeting(companion, mind);
    if (!line) return;
    saveMind(companion, mind); // đã lẫy rồi — tải lại trang không lẫy lần nữa
    setMessages(prev => [...prev, { id: `bot-sulk-${Date.now()}`, sender: "bot", text: line, time: new Date(), emotion: "lay" }]);
  }, [messages.length, companion, mind]);

  const wakeBrain = useCallback(async () => {
    setBrainStatus("loading");
    try {
      await brain.wake((report) => setBrainProgress(report.progress || 0));
      setBrainStatus("awake");
    } catch (err) {
      console.error("HugoPSY brain:", err);
      setBrainStatus("error");
    }
  }, []);

  // Bộ não trên máy chỉ dành cho KHÁCH (khách không gọi được bộ não đám mây).
  // Thành viên dùng đám mây; nạp thêm ~2GB vào GPU mỗi lần mở chat chỉ để dự
  // phòng thì tốn pin và bộ nhớ điện thoại hơn là đáng.
  useEffect(() => {
    if (!isGuestMode) { setBrainStatus("unsupported"); return undefined; }
    let cancelled = false;
    (async () => {
      if (brain.isAwake()) { setBrainStatus("awake"); return; }
      if (!(await brain.isSupported())) { if (!cancelled) setBrainStatus("unsupported"); return; }
      // Đã tải rồi thì nạp lại từ máy — không tốn mạng, khỏi hỏi.
      if (await brain.isDownloaded()) { if (!cancelled) wakeBrain(); return; }
      if (!cancelled) setBrainStatus("asleep");
    })();
    return () => { cancelled = true; };
  }, [wakeBrain, isGuestMode]);

  const askToWake = async () => {
    const conn = typeof navigator !== "undefined" ? navigator.connection : null;
    const onCellular = conn && (conn.type === "cellular" || conn.saveData);
    if (onCellular) {
      const ok = await notify.confirm({
        title: `Gọi ${companion.name} dậy ngay?`,
        message: `Lần đầu gọi ${companion.name} dậy sẽ tốn khá nhiều dữ liệu di động. Đợi có Wi-Fi rồi gọi nhé?`,
        confirmText: "Gọi luôn",
        cancelText: "Đợi Wi-Fi",
      });
      if (!ok) return;
    }
    wakeBrain();
  };

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
      const today = localDateKey();
      const storedCheckinDate = localStorage.getItem("banhocduong_last_checkin_date") || "";
      const checkedInToday = storedCheckinDate === today || storedCheckinDate === new Date().toDateString();
      if (localMsgs) {
        try {
          const parsed = JSON.parse(localMsgs);
          if (parsed.length > 0) {
            const mapped = pruneOldMessages(parsed.map(m => ({ ...m, time: new Date(m.time) })));
            if (mapped.length > 0) {
              // HMR/remounts from older builds may have inserted the same daily
              // card more than once. De-duplicate persisted messages and remove
              // today's old card before adding the single live picker.
              const uniqueMapped = [...new Map(mapped.map((message) => [message.id, message])).values()];
              const dailyPulseId = `daily-pulse-${today}`;
              const withoutStalePicker = uniqueMapped
                .filter((message) => message.id !== dailyPulseId)
                .map((message) => message.type === "mood_checkin" ? { ...message, type: undefined } : message);
              const dailyMessages = checkedInToday ? withoutStalePicker : [...withoutStalePicker, {
                id: dailyPulseId,
                sender: "bot",
                type: "mood_checkin",
                text: "Trước khi mình bắt đầu, cho tớ bắt nhịp hôm nay của cậu nhé.",
                time: new Date(),
              }];
              setMessages(dailyMessages);
              setMoodCheckinDone(checkedInToday);
              lastSavedMessageIdRef.current = dailyMessages[dailyMessages.length - 1].id;

              // Mark all existing loaded messages as completed immediately
              const ids = dailyMessages.map(m => m.id);
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
        // Mỗi lần đổi nhân vật là một cuộc trò chuyện mới — nhân vật tự giới thiệu.
        text: `Chào ${name}! Tớ là ${companion.name}, ${companion.voice.who}. ${companion.self.catchphrase}. Trước khi mình bắt đầu, cho tớ bắt nhịp hôm nay của cậu nhé.`,
        time: new Date()
      };
      setMessages(checkedInToday ? [{ ...initMsg, type: undefined }] : [initMsg]);
      setMoodCheckinDone(checkedInToday);
      setCompletedMessageIds(new Set(["init"]));
      lastSavedMessageIdRef.current = "init";
    } else {
      // Khách dùng thử: không có check-in (cần tài khoản) nhưng vẫn được nhân vật chào.
      setMessages([{
        id: "init",
        sender: "bot",
        text: `Chào cậu! Tớ là ${companion.name}, ${companion.voice.who}. ${companion.self.catchphrase}. Hôm nay cậu thế nào?`,
        time: new Date(),
      }]);
      setCompletedMessageIds(new Set(["init"]));
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

    // Nhân vật nghe câu này → cảm xúc của nó đổi, dù ai trả lời (bộ não hay luật).
    onActivity?.();
    const nextMind = feel(companion, mind, text);
    setMind(nextMind);
    saveMind(companion, nextMind);

    // 0. Sleep summary needs a network call (SleepLog isn't in historyLogs),
    // so it can't be a synchronous intentClassifier.js rule like the rest.
    if (isSleepSummaryRequest(text)) {
      setInputText("");
      setMessages(prev => [...prev, { id: `user-text-${Date.now()}`, sender: "user", text, time: new Date() }]);
      runSleepSummary();
      return;
    }

    // 0b. Lệnh sửa hồ sơ ("đổi biệt danh thành …") — đọc tất định, không qua model.
    const profileUpdate = !isGuestMode && parseProfileCommand(text);
    if (profileUpdate) {
      setMessages(prev => [...prev, { id: `user-text-${Date.now()}`, sender: "user", text, time: new Date() }]);
      applyBioUpdate(profileUpdate);
      const [field, value] = Object.entries(profileUpdate)[0];
      if (!getLockedFields(bio).has(field)) {
        pushBotMessageChunks([`Xong! Tớ đã đổi ${fieldLabel(field)} của cậu thành "${value}" rồi nha.`]);
      }
      return;
    }

    // 1. Bộ luật cục bộ chỉ còn tự trả lời khi (a) bắt buộc phải tất định:
    // khủng hoảng, lệnh mở/mở khoá bài tập, chỉ số đọc thẳng từ dữ liệu; hoặc
    // (b) khách chưa đánh thức bộ não trên máy (khách không gọi được đám mây).
    const matched = findMatchingIntent(text, bio, historyLogs);
    const brainAwake = brainStatus === "awake";
    const mustAnswerLocally = Boolean(matched) && LOCAL_ONLY_INTENTS.has(matched.id);
    if (matched && (mustAnswerLocally || (isGuestMode && !brainAwake))) {
      setInputText("");
      const userMsg = { id: `user-text-${Date.now()}`, sender: "user", text, time: new Date() };
      setMessages(prev => [...prev, userMsg]);
      setTypingLabel(getTypingLabel(text, matched.id));
      setLoading(true);
      // Telemetry only — lets us measure real local-match coverage vs. AI/fallback tiers.
      if (!isGuestMode) botManager.logLocalMatch(text, matched.id);

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
            onNavigateToTab?.("therapy", matched.action.methodId);
          }
        });
      }, 600);
      return;
    }
    // 2. Khớp luật nhưng để bộ não trả lời: luật vẫn ghi check-in và gắn widget
    // nó gợi ý (bài thở, gợi ý test) vào câu trả lời.
    if (matched?.companionUpdate?.newLog && onUpdateCompanionState) {
      onUpdateCompanionState({ historyLogs: [...historyLogs, matched.companionUpdate.newLog] });
    }
    const userMsg = { id: `user-text-${Date.now()}`, sender: "user", text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setTypingLabel(getTypingLabel(text, matched?.id || null));
    setLoading(true);

    // 4. Nhân vật trả lời theo cảm xúc vừa đổi và nhiệm vụ của chặng.
    const characterPrompt = buildCharacterPrompt({
      companion,
      mind: nextMind,
      days: daysTogether,
      letter: handoffLetter,
      userText: text,
      bio,
      historyLogs,
      lang,
    });
    const botMsgId = `bot-text-${Date.now()}`;
    const showLive = (liveText) => {
      _pendingChunkRef.current = { text: liveText, id: botMsgId };
      if (_rafRef.current) return;
      _rafRef.current = requestAnimationFrame(() => {
        _rafRef.current = null;
        const pending = _pendingChunkRef.current;
        if (!pending) return;
        setMessages(prev => prev.some(m => m.id === pending.id)
          ? prev.map(m => m.id === pending.id ? { ...m, text: pending.text } : m)
          : [...prev, { id: pending.id, sender: "bot", text: pending.text, time: new Date() }]);
      });
    };

    // Bộ não, theo thứ tự — 0 đồng ở mọi tầng:
    //   1. Đám mây (thành viên): Qwen3-30B trên Cloudflare Workers AI, gói miễn phí.
    //      Thử thật 03/10: model 1–2B trên máy lặp và lạc ý qua nhiều lượt, nên
    //      bộ não lớn đi trước. Render chỉ chuyển tiếp vài KB, không phải nghĩ.
    //   2. Trên máy (đã đánh thức): khi hết hạn mức ngày, mất mạng, hoặc là khách.
    //   3. Bộ câu soạn sẵn (bên dưới).
    const brainMessages = buildMessages({ companion, characterPrompt, history: messages, userText: text });
    const strip = (x) => stripExpr(companion, x);
    let reply = "";
    if (!isGuestMode) {
      try { reply = await brain.thinkRemote(brainMessages, { strip }); }
      catch (err) { console.warn("HugoPSY cloud brain:", err.message); }
    }
    if (!reply && brainAwake) {
      try { reply = await brain.think(brainMessages, (live) => { setLoading(false); showLive(live); }, { strip }); }
      catch (err) { console.warn("HugoPSY device brain:", err.message); }
    }
    if (!reply) {
      // Không bộ não nào trả lời (khách chưa đánh thức, hết hạn mức, mất mạng):
      // câu soạn sẵn đúng chủ đề nếu luật có khớp, không thì trợ lý tất định.
      setMessages(prev => prev.filter(m => m.id !== botMsgId));
      const fallback = matched || buildLocalReply(text, { bio, historyLogs });
      const chunks = fallback.rawReplyArray || (Array.isArray(fallback.reply) ? fallback.reply : [fallback.reply]);
      // Chỉ chuyển trường widget — `fallback.id` (tên intent) mà lọt vào sẽ đè id tin nhắn.
      const { suggestPhq9, suggestGad7, showInlineBreathing, showInlineCbt, quickActions } = fallback;
      await pushBotMessageChunks(chunks, { suggestPhq9, suggestGad7, showInlineBreathing, showInlineCbt, quickActions: quickActions || null, emotion: nextMind.emotion });
      setLoading(false);
      setChatQuickReplies(fallback.quickReplies?.length ? fallback.quickReplies : deriveSmartFollowUps(text, chunks.join(" "), currentMood));
      return;
    }
    if (_rafRef.current) { cancelAnimationFrame(_rafRef.current); _rafRef.current = null; }
    _pendingChunkRef.current = null;
    setMessages(prev => prev.filter(m => m.id !== botMsgId));

    // Chốt an toàn đầu ra: model 1B thỉnh thoảng lạc đề; câu trả lời rỗng hoặc
    // chạm chủ đề tự hại thì thay bằng câu an toàn soạn sẵn.
    const unsafe = !reply || isCrisisText(removeVietnameseTones(reply).toLowerCase());
    const finalText = unsafe ? createLocalSafetyReply(text, { bio, historyLogs }).reply : voiceReply(companion, nextMind, reply);
    pushBotMessageChunks([finalText], {
      emotion: unsafe ? "buon" : nextMind.emotion,
      suggestPhq9: matched?.suggestPhq9,
      suggestGad7: matched?.suggestGad7,
      suggestWho5: matched?.suggestWho5,
      suggestBigFive: matched?.suggestBigFive,
      showInlineBreathing: matched?.showInlineBreathing,
      showInlineCbt: matched?.showInlineCbt,
    }).then(() => {
      setLoading(false);
      setChatQuickReplies(deriveSmartFollowUps(text, finalText, currentMood));
    });
  };

  const coachRow = "flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-3 text-left transition active:scale-[0.98] hover:bg-muted/60";
  const coachIcon = "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-foreground/75";

  // Chat 100%: không header riêng, không thanh nút nhanh, không nền động —
  // AppFrame vẽ thanh trên cùng, phần còn lại là tin nhắn + ô nhập. Các lối tắt
  // (gợi ý, kế hoạch, đánh giá, trút giận, lượt chat) gom vào nút ✦ của ô nhập.
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Đồng hồ cảm xúc: người dùng luôn thấy nhân vật đang cảm thấy gì. */}
      <div className="relative z-20 flex shrink-0 items-center gap-3 border-b border-border/60 px-4 pb-1.5 pt-2" role="status" aria-live="polite">
        <EmotionGauge emotion={mind.emotion} intensity={mind.intensity} />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-foreground">
            {companion.name} <span style={{ color: emotionOf(mind).color }}>{emotionOf(mind).label}</span>
          </p>
          <p className="truncate text-[13px] text-muted-foreground">{companion.role} · ngày {Math.max(1, daysTogether)}</p>
        </div>
        <div className="ml-auto">
          <CompanionAvatar companion={companion} size={44} motion={avatarMotion(mind)} interactive={false} />
        </div>
      </div>
      <div className="relative z-10 min-h-0 flex-1 overflow-hidden">
        {chatMode === "normal" && (
          <ChatMessages
            messages={messages}
            companion={companion}
            mind={mind}
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
      </div>

      {/* ── Chọn bài sàng lọc ─────────────────────────────────────────────── */}
      {showTestsMenu && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/45" onClick={() => setShowTestsMenu(false)}>
          <div className="mx-auto w-full max-w-xl rounded-t-[28px] border border-border bg-card px-4 pt-3 space-y-1"
            style={{ paddingBottom: "max(20px, calc(env(safe-area-inset-bottom, 0px) + 12px))" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-1 pb-1">
              <p className="text-[17px] font-bold text-foreground">{t("hugoPsy.assessment.title")}</p>
              <button type="button" onClick={() => setShowTestsMenu(false)} aria-label={t("common.close", "Đóng")}
                className="-mr-2 w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            {[
              { id: "phq9", label: "PHQ-9", desc: t("hugoPsy.chat.sangLocTrieuChung") },
              { id: "gad7", label: "GAD-7", desc: t("hugoPsy.chat.sangLocTrieuChung2") },
              { id: "who5", label: "WHO-5", desc: t("hugoPsy.chat.trangThaiTinhThan") },
              { id: "bigfive", label: "Big Five", desc: t("hugoPsy.chat.tracNghiemNhanCach") },
            ].map(item => (
              <button key={item.id} type="button"
                onClick={() => { handleStartTest(item.id); setShowTestsMenu(false); }}
                className={coachRow}>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-foreground">{item.label}</span>
                  <span className="block text-[13px] text-muted-foreground">{item.desc}</span>
                </span>
                <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Ô nhập nổi ─────────────────────────────────────────────────────── */}
      {chatMode === "normal" && (
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none px-3 sm:px-4 will-change-transform"
          style={hasNativeKeyboard ? {
            // VirtualKeyboard API: env() cập nhật trên compositor thread — ô nhập
            // bám theo bàn phím 1:1 không giật.
            bottom: "env(keyboard-inset-height, 0px)",
            paddingBottom: keyboardInset > 0 ? "8px" : "max(12px, env(safe-area-inset-bottom))",
          } : {
            // iOS Safari: nâng bằng transform GPU.
            bottom: 0,
            transform: keyboardInset > 0 ? `translateY(-${keyboardInset}px)` : "none",
            transition: "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
            paddingBottom: keyboardInset > 0 ? "8px" : "max(12px, env(safe-area-inset-bottom))",
          }}
        >
          <div className="pointer-events-auto mx-auto max-w-3xl space-y-2">
            <AnimatePresence>
              {showCoachMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="rounded-[24px] border border-border bg-card p-2 shadow-lg"
                >
                  <div className="flex items-center justify-between px-2 pb-1 pt-1">
                    <p className="text-[15px] font-bold text-foreground">{t("hugoPsy.coach.title")}</p>
                    <span className="text-[13px] text-muted-foreground">{t("hugoPsy.coach.private")}</span>
                  </div>
                  <div className="grid sm:grid-cols-2">
                    <button type="button" onClick={() => handleCoachAction("insight")} className={coachRow}>
                      <span className={coachIcon}><Sparkles className="h-4 w-4" /></span>
                      <span className="text-[15px] font-medium text-foreground">{t("hugoPsy.coach.insight")}</span>
                    </button>
                    <button type="button" onClick={() => handleCoachAction("plan")} className={coachRow}>
                      <span className={coachIcon}><ClipboardCheck className="h-4 w-4" /></span>
                      <span className="text-[15px] font-medium text-foreground">{t("hugoPsy.coach.plan")}</span>
                    </button>
                    <button type="button" onClick={() => handleCoachAction("assessment")} className={coachRow}>
                      <span className={coachIcon}><HeartHandshake className="h-4 w-4" /></span>
                      <span className="text-[15px] font-medium text-foreground">{t("hugoPsy.coach.assessment")}</span>
                    </button>
                    <button type="button" onClick={() => { toggleVentingMode(); setShowCoachMenu(false); }} className={coachRow}>
                      <span className={coachIcon}>{isVentingMode ? <Flame className="h-4 w-4" /> : <Smile className="h-4 w-4" />}</span>
                      <span className="text-[15px] font-medium text-foreground">
                        {isVentingMode ? t("hugoPsy.chat.thoatCheDoTrut") : t("hugoPsy.chat.cheDoTrutGian")}
                      </span>
                    </button>
                  </div>
                  <p className="px-2 pb-1 pt-1 text-[13px] leading-snug text-muted-foreground">{t("hugoPsy.coach.disclaimer")}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {isGuestMode && (brainStatus === "asleep" || brainStatus === "loading" || brainStatus === "error") && (
              <BrainWakeCard
                companion={companion}
                status={brainStatus}
                progress={brainProgress}
                onWake={askToWake}
              />
            )}

            <ChatInputBar
              inputRef={inputRef}
              value={inputText}
              onChange={setInputText}
              onSend={handleSendFreeText}
              busy={loading}
              disabled={(!isGuestMode && tokenLockMinutes > 0) || loading}
              placeholder={
                isGuestMode
                  ? `Nhắn cho ${companion.name}...`
                  : tokenLockMinutes > 0
                  ? `Token PSY bị khóa ~${tokenLockMinutes} phút...`
                  : isVentingMode
                  ? t("hugoPsy.chat.trutBoMoiMuon")
                  : `Nhắn cho ${companion.name}...`
              }
              quickReplies={chatQuickReplies}
              onQuickReply={(qr) => {
                const msgText = typeof qr === "string" ? qr : (qr.text || qr.label || "");
                if (!msgText || loading) return;
                setInputText("");
                handleSendFreeText(msgText);
              }}
              coachOpen={showCoachMenu}
              onToggleCoach={() => setShowCoachMenu((open) => !open)}
              coachLabel={t("hugoPsy.coach.title")}
            />
          </div>
        </div>
      )}


      {/* Calm safety prompt; SOS sound only starts after an explicit tap. */}
      <CrisisSosCountdown open={sosPromptOpen} onClose={() => setSosPromptOpen(false)} />
    </div>
  );
}
