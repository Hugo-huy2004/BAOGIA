import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, PhoneCall } from "lucide-react";
import confetti from "canvas-confetti";
import { CLINICAL_TESTS } from "./clinicalTests";
import ChatMessages from "./ChatMessages";
import ClinicalTestPanel from "./ClinicalTestPanel";
import ClinicScanner from "./ClinicScanner";
import AICallModal from "./AICallModal";
import { webPushHelper } from "../../../utils/webPushHelper";

import { DIALOGUE_TREE, COMPANION_DIALOGUE_TREE } from "./constants/chatDialogues";
import BotManager from "../../../services/classes/CompanionBot/BotManager";
import { getRandomResponse, needsAI } from "./constants/randomResponses";

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
  onProfileUpdate 
}) {
  const [completedMessageIds, setCompletedMessageIds] = useState(new Set());
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTestsMenu, setShowTestsMenu] = useState(false);

  const botManager = React.useMemo(() => new BotManager(bio, historyLogs, healingActive), [bio, historyLogs, healingActive]);


  // Auto-launch preset test from redirects
  useEffect(() => {
    if (presetTest) {
      handleStartTest(presetTest);
      if (setPresetTest) {
        setPresetTest(null);
      }
    }
  }, [presetTest]);

  // dialogStage: 1 (aspect concern), 2 (probing question), 3 (severity check), 4 (test recommend), 5 (advice duration setup), 0 (loop options)
  const [dialogStage, setDialogStage] = useState(1);
  const [selectedAspect, setSelectedAspect] = useState(null);
  const [selectedSubOption, setSelectedSubOption] = useState(null);

  // chatMode: 'normal' | 'test' | 'scan'
  const [chatMode, setChatMode] = useState("normal");
  const [activeTest, setActiveTest] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunks = useRef([]);

  const [remainingChatTokens, setRemainingChatTokens] = useState(3);
  const [remainingCallTokens, setRemainingCallTokens] = useState(5);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const storedChatTokens = localStorage.getItem(`ai_chat_tokens_${today}`);
    if (storedChatTokens !== null) {
      setRemainingChatTokens(parseInt(storedChatTokens));
    } else {
      setRemainingChatTokens(3);
      localStorage.setItem(`ai_chat_tokens_${today}`, 3);
    }

    const storedCallTokens = localStorage.getItem(`consultant_tokens_${today}`);
    if (storedCallTokens !== null) {
      setRemainingCallTokens(parseInt(storedCallTokens));
    } else {
      setRemainingCallTokens(5);
      localStorage.setItem(`consultant_tokens_${today}`, 5);
    }
  }, []);

  const lastMessage = messages[messages.length - 1];
  const isLastMessageCompleted = !lastMessage || lastMessage.sender === "user" || lastMessage.id === "init" || completedMessageIds.has(lastMessage.id);

  const messagesEndRef = useRef(null);
  const lastSavedMessageIdRef = useRef("");
  const inputRef = useRef(null);
  const chatWrapperRef = useRef(null);

  // Compute exact height to fill viewport below ChatTab — no reliance on ancestor heights
  useLayoutEffect(() => {
    const el = chatWrapperRef.current;
    if (!el) return;
    const isMobile = window.innerWidth < 768;
    const BOTTOM_NAV = isMobile ? 64 : 0; // slightly larger to account for safe-area
    const setH = () => {
      const vvh = window.visualViewport?.height ?? window.innerHeight;
      const top = Math.max(0, el.getBoundingClientRect().top);
      const h = vvh - top - BOTTOM_NAV;
      if (h > 200) el.style.height = h + "px";
    };
    setH();
    // Re-measure after entry animation (200ms) and again after layout settles
    const t1 = setTimeout(setH, 220);
    const t2 = setTimeout(setH, 500);
    window.addEventListener("resize", setH);
    window.visualViewport?.addEventListener("resize", setH);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", setH);
      window.visualViewport?.removeEventListener("resize", setH);
    };
  }, []);

  // Sync messages state when chatMessages prop updates from DB
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      const currentLastId = messages.length > 0 ? messages[messages.length - 1].id : null;
      const incomingLastId = chatMessages[chatMessages.length - 1].id;
      
      // Do not downgrade local messages if local is already ahead or identical
      if (messages.length > chatMessages.length || (messages.length === chatMessages.length && currentLastId === incomingLastId)) {
        return;
      }

      const mapped = chatMessages.map(m => ({
        ...m,
        time: m.time instanceof Date ? m.time : new Date(m.time)
      }));
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
            const mapped = parsed.map(m => ({ ...m, time: new Date(m.time) }));
            setMessages(mapped);
            lastSavedMessageIdRef.current = mapped[mapped.length - 1].id;
            
            // Mark all existing loaded messages as completed immediately
            const ids = mapped.map(m => m.id);
            setCompletedMessageIds(new Set(ids));
            return;
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
    if (messages.length > 0) {
      localStorage.setItem("banhocduong_chat_messages", JSON.stringify(messages));
      
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.id !== lastSavedMessageIdRef.current) {
        lastSavedMessageIdRef.current = lastMsg.id;
        onUpdateCompanionState({ chatMessages: messages });
      }
    }
  }, [messages]);





  const startAudioRecording = async () => {
    const today = new Date().toISOString().split("T")[0];
    const currentTokens = parseInt(localStorage.getItem(`ai_chat_tokens_${today}`) || 3);
    if (currentTokens <= 0) {
      showToast && showToast("Cậu đã hết token trò chuyện AI hôm nay. Hãy quay lại vào ngày mai nhé!", "warning");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];
      recorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setIsRecordingAudio(false);
        setLoading(true);

        const userMsg = {
          id: `user-audio-${Date.now()}`,
          sender: "user",
          text: "🎤 [Tin nhắn thoại Audio]",
          time: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setDialogStage(0);

        try {
          const response = await botManager.chatAudio(audioBlob);
          const textReply = response.text || "Tớ đã nhận được tin nhắn thoại của cậu.";
          const newTokens = currentTokens - 1;
          setRemainingChatTokens(newTokens);
          localStorage.setItem(`ai_chat_tokens_${today}`, newTokens);
          const botMsg = {
            id: `bot-audio-${Date.now()}`,
            sender: "bot",
            text: textReply,
            time: new Date(),
          };
          setMessages(prev => [...prev, botMsg]);
          
          if (response.audio_base64) {
            const audio = new Audio("data:audio/webm;base64," + response.audio_base64);
            audio.play().catch(e => console.error("Lỗi phát audio:", e));
          }
        } catch(e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecordingAudio(true);
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Không thể truy cập Microphone", "error");
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const startListening = () => {
    const today = new Date().toISOString().split("T")[0];
    const currentTokens = parseInt(localStorage.getItem(`ai_chat_tokens_${today}`) || 3);
    if (currentTokens <= 0) {
      showToast && showToast("Cậu đã hết token trò chuyện AI hôm nay. Hãy quay lại vào ngày mai nhé!", "warning");
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

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);

      const userMsg = {
        id: `user-voice-${Date.now()}`,
        sender: "user",
        text: transcript,
        time: new Date()
      };
      setMessages(prev => [...prev, userMsg]);
      setDialogStage(0);

      setLoading(true);
      const botMsgId = `bot-voice-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: botMsgId,
        sender: "bot",
        text: "...", // Initial empty text
        time: new Date()
      }]);

      await botManager.chatStream(
        transcript,
        (chunkText) => {
          setLoading(false);
          setMessages(prev => prev.map(m => {
            if (m.id === botMsgId) {
              return { ...m, text: chunkText };
            }
            return m;
          }));
        },
        (botResponse) => {
          let textReply = botResponse.reply;
          let suggestionFlags = {
            suggestPhq9: botResponse.suggestPhq9,
            suggestGad7: botResponse.suggestGad7,
            suggestWho5: botResponse.suggestWho5,
            suggestBigFive: botResponse.suggestBigFive
          };

          if (botResponse.bioUpdate && onProfileUpdate) {
            onProfileUpdate(botResponse.bioUpdate);
            if (showToast) showToast("Đã tự động lưu thông tin mới vào hồ sơ y khoa.", "success");
          }

          const newTokens = currentTokens - 1;
          setRemainingChatTokens(newTokens);
          localStorage.setItem(`ai_chat_tokens_${today}`, newTokens);

          setMessages(prev => prev.map(m => {
            if (m.id === botMsgId) {
              return { ...m, text: textReply, ...suggestionFlags };
            }
            return m;
          }));
          setLoading(false);
        }
      );
    };
    recognition.onerror = () => {
      setIsListening(false);
      showToast && showToast("Lỗi nhận diện giọng nói, vui lòng thử lại.", "info");
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // Stage 1 -> Stage 2 (random bot — no token cost)
  const handleAspectSelect = (aspect) => {
    const userMsg = { id: `user-${Date.now()}`, sender: "user", text: aspect.text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setSelectedAspect(aspect);
    setLoading(true);
    setTimeout(() => {
      const response = getRandomResponse(aspect.text, aspect.id);
      const botMsg = { id: `bot-${Date.now()}`, sender: "bot", text: response, time: new Date() };
      setMessages(prev => [...prev, botMsg]);
      setLoading(false);
      setDialogStage(2);
    }, 400 + Math.random() * 600);
  };

  // Stage 2 -> Stage 3 (random bot — no token cost)
  const handleSubAspectSelect = (subOpt) => {
    const userMsg = { id: `user-${Date.now()}`, sender: "user", text: subOpt.text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setSelectedSubOption(subOpt);
    setLoading(true);
    setTimeout(() => {
      const response = getRandomResponse(subOpt.text);
      const botMsg = { id: `bot-${Date.now()}`, sender: "bot", text: response, time: new Date() };
      setMessages(prev => [...prev, botMsg]);
      setLoading(false);
      setDialogStage(3);
    }, 400 + Math.random() * 600);
  };

  // Stage 3 -> Stage 4 / advice (random bot — no token cost)
  const handleSeveritySelect = (sevOpt) => {
    const userMsg = { id: `user-${Date.now()}`, sender: "user", text: sevOpt.text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    setTimeout(() => {
      if (sevOpt.nextAction === "recommend_test") {
        const botMsg = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `Cảm ơn cậu đã chia sẻ. 🩺 Tớ gợi ý cậu làm bài **${sevOpt.testLabel}** để tớ hiểu rõ hơn tình trạng và đưa ra hướng dẫn chính xác nhất nhé!`,
          time: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
        setLoading(false);
        setDialogStage(4);
      } else {
        const pkgNames = {
          7: "Hành trình Nuôi dưỡng Bình yên (Peace)",
          14: "Hành trình Chăm sóc Tinh thần (Mindfulness)",
          30: "Hành trình Tái tạo Cân bằng (Balance)",
          50: "Hành trình Phục hồi Thấu cảm (Compassionate)",
          90: "Hành trình Đồng hành Chuyên sâu (Intensive)"
        };
        const advice = getRandomResponse(sevOpt.text);
        const finalReply = sevOpt.quote ? `${advice}\n\n💡 **Lời khuyên:** ${sevOpt.quote}` : advice;
        const botMsg = { id: `bot-advice-${Date.now()}`, sender: "bot", text: finalReply, time: new Date() };
        setMessages(prev => [...prev, botMsg]);

        if (healingActive) {
          setLoading(false);
          setDialogStage(0);
        } else {
          const name = pkgNames[sevOpt.recommendedDays] || "Hành trình Chăm sóc Tinh thần (Mindfulness)";
          const proposalMsg = {
            id: `bot-proposal-${Date.now() + 10}`,
            sender: "bot",
            text: `Để hỗ trợ tốt nhất cho cậu, tớ khuyên kích hoạt **${name}** trong **${sevOpt.recommendedDays} ngày** để đồng hành cùng cậu hàng ngày. Cậu có muốn kích hoạt không?`,
            time: new Date(Date.now() + 10),
            isCompanionSetup: true,
            recommendedDays: sevOpt.recommendedDays
          };
          setMessages(prev => [...prev, proposalMsg]);
          setLoading(false);
          setDialogStage(5);
        }
      }
    }, 500 + Math.random() * 500);
  };

  // Duration adjustments agreement option
  const handleSelectDuration = (msgId, duration) => {
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
  };

  const handleStartTest = (testId) => {
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
  };




  const handleTestComplete = async (testId, score, answers) => {
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

    // Call Python AI backend for analysis
    let aiAnalysis = null;
    try {
      if (testId === "phq9") {
        aiAnalysis = await botManager.aiBot.analyzeTest("phq9", { score }, null, null, "vi");
      } else if (testId === "gad7") {
        aiAnalysis = await botManager.aiBot.analyzeTest("gad7", { score }, null, null, "vi");
      } else if (testId === "who5") {
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
            text: `📊 **Tái đánh giá Tinh thần**: Cậu đã đi qua **${progressDays} ngày** của lộ trình, nhưng kết quả quét hồ sơ lâm sàng lần này ghi nhận cậu vẫn còn gặp một số áp lực lâm sàng. \n\nĐể tiếp tục nâng đỡ và hỗ trợ tinh thần cậu tốt nhất mà **không làm mất đi ${progressDays} ngày cậu đã kiên trì qua**, tớ đề xuất mở rộng thêm **+${extendDays} ngày** hỗ trợ (Tổng lộ trình nâng lên **${finalRecommendedDuration} ngày**, cậu còn **${remainingDays + extendDays} ngày**). Cậu có đồng ý áp dụng đề xuất thích ứng mới này không?`,
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

  // Free-text send: bypasses dialog tree, calls AI directly
  const handleSendFreeText = async () => {
    const text = inputText.trim();
    if (!text || loading) return;
    const today = new Date().toISOString().split("T")[0];
    const currentTokens = parseInt(localStorage.getItem(`ai_chat_tokens_${today}`) || 3);
    if (currentTokens <= 0) {
      showToast?.("Hết token chat hôm nay. Quay lại vào ngày mai nhé!", "warning");
      return;
    }
    setInputText("");
    setDialogStage(0);
    const userMsg = { id: `user-text-${Date.now()}`, sender: "user", text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    const botMsgId = `bot-text-${Date.now()}`;
    setMessages(prev => [...prev, { id: botMsgId, sender: "bot", text: "...", time: new Date() }]);
    await botManager.chatStream(
      text,
      (chunkText) => {
        setLoading(false);
        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: chunkText } : m));
      },
      (botResponse) => {
        const newTokens = currentTokens - 1;
        setRemainingChatTokens(newTokens);
        localStorage.setItem(`ai_chat_tokens_${today}`, newTokens);
        if (botResponse.bioUpdate && onProfileUpdate) {
          onProfileUpdate(botResponse.bioUpdate);
          showToast?.("Đã lưu thông tin mới vào hồ sơ!", "success");
        }
        setMessages(prev => prev.map(m => m.id === botMsgId ? {
          ...m,
          text: botResponse.reply,
          suggestPhq9: botResponse.suggestPhq9,
          suggestGad7: botResponse.suggestGad7,
          suggestWho5: botResponse.suggestWho5,
          suggestBigFive: botResponse.suggestBigFive,
        } : m));
        setLoading(false);
      }
    );
  };

  return (
    <div ref={chatWrapperRef} className="flex flex-col min-h-0 bg-zinc-50/30 dark:bg-[#0a0a0f]/30 animate-fadeIn relative overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2.5 bg-white/95 dark:bg-[#0e0e12]/95 backdrop-blur-sm border-b border-zinc-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#5856d6] to-[#0071e3] flex items-center justify-center shadow-sm shadow-indigo-500/20 shrink-0 relative">
            <span className="material-symbols-outlined text-white text-[17px]" style={{ fontVariationSettings:"'FILL' 1" }}>psychology</span>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0e0e12]" />
          </div>
          <div>
            <p className="text-[12px] font-extrabold text-zinc-800 dark:text-zinc-100 leading-none">Chuyên viên Đồng Hành AI</p>
            <p className="text-[9px] text-emerald-500 font-semibold mt-0.5">● Đang hoạt động</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${remainingChatTokens <= 1 ? 'bg-red-500/10 border-red-400/20 text-red-500' : 'bg-amber-500/10 border-amber-400/20 text-amber-600 dark:text-amber-400'}`} title={`Token còn lại: ${remainingChatTokens}/3 hôm nay`}>
            <span className="material-symbols-outlined text-[11px]">toll</span>
            <span className="text-[10px] font-black">{remainingChatTokens}/3</span>
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
              className="px-2.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-400/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-extrabold flex items-center gap-1 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[11px]">refresh</span>
              Test lại
            </button>
          )}
        </div>
      </div>

      {/* ── Tests bottom sheet ──────────────────────────────────────────────────── */}
      {showTestsMenu && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/50 backdrop-blur-sm"
          onClick={() => setShowTestsMenu(false)}>
          <div className="bg-white dark:bg-[#1c1c1e] rounded-t-3xl px-5 pt-4 pb-6 space-y-2.5"
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
        <div className="shrink-0 bg-white/96 dark:bg-[#0e0e12]/96 backdrop-blur-sm border-t border-zinc-100/80 dark:border-zinc-800/50"
          style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>

          {/* Context-sensitive suggestion chips */}
          {isLastMessageCompleted && !loading && (
            <div className="pt-2 px-3">

              {/* Stage 1 — topic chips (horizontal scroll) */}
              {dialogStage === 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                  {(healingActive ? COMPANION_DIALOGUE_TREE : DIALOGUE_TREE).aspects.map(a => (
                    <button key={a.id} type="button" onClick={() => handleAspectSelect(a)}
                      className="shrink-0 px-4 py-2.5 rounded-2xl bg-[#0071e3]/8 dark:bg-[#0071e3]/15 border border-[#0071e3]/20 dark:border-[#0071e3]/25 text-[#0071e3] dark:text-blue-300 text-[12px] font-semibold active:scale-95 transition-all whitespace-nowrap hover:bg-[#0071e3]/15">
                      {a.text}
                    </button>
                  ))}
                </div>
              )}

              {/* Stage 2 — sub-option list */}
              {dialogStage === 2 && selectedAspect && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedAspect.options.map(o => (
                    <button key={o.id} type="button" onClick={() => handleSubAspectSelect(o)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/50 text-[12px] font-medium text-zinc-800 dark:text-zinc-200 active:scale-[0.99] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-left">
                      <span>{o.text}</span>
                      <span className="material-symbols-outlined text-[14px] text-zinc-400 shrink-0">chevron_right</span>
                    </button>
                  ))}
                  <button type="button" onClick={() => setDialogStage(1)}
                    className="w-full text-center py-1.5 text-[11px] text-zinc-400 font-medium hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                    ← Chủ đề khác
                  </button>
                </div>
              )}

              {/* Stage 3 — severity chips */}
              {dialogStage === 3 && selectedSubOption && (
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                  {selectedSubOption.severityOptions.map(s => (
                    <button key={s.id} type="button" onClick={() => handleSeveritySelect(s)}
                      className="shrink-0 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-700/30 text-amber-700 dark:text-amber-300 text-[12px] font-medium active:scale-95 transition-all whitespace-nowrap hover:bg-amber-100 dark:hover:bg-amber-900/30">
                      {s.text}
                    </button>
                  ))}
                  <button type="button" onClick={() => setDialogStage(2)}
                    className="shrink-0 px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 text-[12px] font-medium active:scale-95 whitespace-nowrap">
                    ← Quay lại
                  </button>
                </div>
              )}

              {/* Stage 4 — test or scan */}
              {dialogStage === 4 && (
                <div className="grid grid-cols-2 gap-2 pb-1">
                  <button type="button"
                    onClick={() => { const s = selectedSubOption?.severityOptions.find(o => o.nextAction === "recommend_test"); if (s) handleStartTest(s.test); }}
                    className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl bg-[#0071e3] text-white text-[11px] font-bold active:scale-[0.97] shadow-md shadow-[#0071e3]/20 transition-all">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings:"'FILL' 1" }}>assignment</span>
                    Làm bài test
                  </button>
                  <button type="button" onClick={() => setChatMode("scan")}
                    className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-[11px] font-bold active:scale-[0.97] transition-all">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings:"'FILL' 1" }}>cloud_upload</span>
                    Quét phòng khám
                  </button>
                  <button type="button" onClick={() => { setDialogStage(1); setMessages(prev => [...prev, { id:`bot-reset-${Date.now()}`, sender:"bot", text: healingActive ? "Tớ luôn ở đây. Cậu muốn chia sẻ thêm không?" : "Tớ sẵn sàng. Điều gì khác đang làm cậu băn khoăn?", time: new Date() }]); }}
                    className="col-span-2 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 text-[11px] font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/60 active:scale-[0.99] transition-all">
                    Quay lại từ đầu
                  </button>
                </div>
              )}

              {/* Stage 5 — after journey proposal */}
              {dialogStage === 5 && (
                <div className="pb-1">
                  <button type="button" onClick={() => { setDialogStage(1); setMessages(prev => [...prev, { id:`bot-loop-${Date.now()}`, sender:"bot", text: healingActive ? "Tớ luôn bên cậu. Hôm nay cậu cảm thấy thế nào?" : "Tớ sẵn sàng lắng nghe. Gần đây có gì làm cậu bận tâm không?", time: new Date() }]); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-700/30 text-indigo-700 dark:text-indigo-300 text-[12px] font-bold active:scale-[0.98] transition-all">
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings:"'FILL' 1" }}>chat</span>
                    Tiếp tục tâm sự
                  </button>
                </div>
              )}

              {/* Stage 0 — quick actions when in free chat */}
              {dialogStage === 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                  <button type="button" onClick={() => { setDialogStage(1); setMessages(prev => [...prev, { id:`bot-restart-${Date.now()}`, sender:"bot", text: healingActive ? "Cậu muốn chia sẻ điều gì hôm nay?" : "Dạo gần đây có gì làm cậu bận tâm không?", time: new Date() }]); }}
                    className="shrink-0 px-3.5 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-400 text-[11px] font-medium active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap">
                    <span className="material-symbols-outlined text-[13px]">restart_alt</span>
                    Bắt đầu lại
                  </button>
                  <button type="button" onClick={() => setShowTestsMenu(true)}
                    className="shrink-0 px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-700/30 text-amber-600 dark:text-amber-400 text-[11px] font-medium active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap">
                    <span className="material-symbols-outlined text-[13px]">assignment</span>
                    Bài test tâm lý
                  </button>
                  <button type="button" onClick={() => setChatMode("scan")}
                    className="shrink-0 px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-700/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap">
                    <span className="material-symbols-outlined text-[13px]">cloud_upload</span>
                    Quét hồ sơ
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Text input bar — Desktop only (md+) ─────────────────────────── */}
          <div className="hidden md:flex px-3 pt-2 pb-3 items-end gap-2">

            {/* Voice to text */}
            <button type="button" onClick={startListening}
              title="Nhận diện giọng nói"
              className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
                isListening
                  ? 'bg-rose-500/15 border-2 border-rose-500 text-rose-500 animate-pulse'
                  : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400'
              }`}>
              <Mic className="w-[18px] h-[18px]" />
            </button>

            {/* Auto-grow textarea */}
            <div className={`flex-1 rounded-2xl border flex items-end px-4 py-2.5 min-h-[44px] max-h-28 transition-colors ${
              remainingChatTokens <= 0
                ? 'bg-zinc-100/80 dark:bg-zinc-800/40 border-zinc-200/50 dark:border-zinc-700/30 opacity-60'
                : 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200/70 dark:border-zinc-700/60 focus-within:border-[#0071e3]/50 dark:focus-within:border-[#0071e3]/40 focus-within:bg-white dark:focus-within:bg-zinc-800'
            }`}>
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={e => {
                  setInputText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendFreeText(); }
                }}
                placeholder={remainingChatTokens <= 0 ? "Hết token hôm nay..." : "Nhắn tin cho Chuyên viên AI..."}
                disabled={remainingChatTokens <= 0 || loading}
                rows={1}
                className="w-full bg-transparent text-[13px] text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none resize-none leading-snug"
                style={{ height: '22px' }}
              />
            </div>

            {/* Send (typed) OR Call (empty) */}
            {inputText.trim() ? (
              <button type="button" onClick={handleSendFreeText}
                disabled={loading || remainingChatTokens <= 0}
                className="w-11 h-11 shrink-0 rounded-2xl bg-[#0071e3] flex items-center justify-center text-white shadow-md shadow-[#0071e3]/25 active:scale-90 transition-all disabled:opacity-40">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings:"'FILL' 1" }}>send</span>
              </button>
            ) : (
              <button type="button" onClick={() => setIsCallModalOpen(true)}
                title="Gọi tư vấn AI"
                className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/25 active:scale-90 transition-all">
                <PhoneCall className="w-[18px] h-[18px]" />
              </button>
            )}
          </div>

          {/* Mobile hint — shown only on mobile when no chips visible */}
          {!isLastMessageCompleted && !loading && (
            <div className="md:hidden px-4 pb-3 pt-1 text-center">
              <p className="text-[10px] text-zinc-400 dark:text-zinc-600">Chọn câu trả lời có sẵn bên trên</p>
            </div>
          )}
        </div>
      )}

      {/* ── AI Call Modal ──────────────────────────────────────────────────────── */}
      <AICallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        botManager={botManager}
        remainingCallTokens={remainingCallTokens}
        setRemainingCallTokens={(n) => {
          const today = new Date().toISOString().split("T")[0];
          setRemainingCallTokens(n);
          localStorage.setItem(`consultant_tokens_${today}`, n);
        }}
      />
    </div>
  );
}
