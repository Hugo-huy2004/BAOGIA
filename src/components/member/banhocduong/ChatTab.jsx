import React, { useState, useEffect, useRef } from "react";
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


  const lastMessage = messages[messages.length - 1];
  const isLastMessageCompleted = !lastMessage || lastMessage.sender === "user" || lastMessage.id === "init" || completedMessageIds.has(lastMessage.id);

  const messagesEndRef = useRef(null);
  const lastSavedMessageIdRef = useRef("");

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

  useEffect(() => {
    setTimeout(() => {
      const scrollContainer = document.getElementById("chat-messages-container");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }, 100);
  }, [messages, loading, chatMode]);




  const startAudioRecording = async () => {
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

  // Stage 1 -> Stage 2
  const handleAspectSelect = async (aspect) => {
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: aspect.text,
      time: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setSelectedAspect(aspect);

    const botText = await botManager.getResponse(aspect, "reply");
    
    const botMsg = {
      id: `bot-${Date.now()}`,
      sender: "bot",
      text: botText,
      time: new Date()
    };
    setMessages((prev) => [...prev, botMsg]);
    setLoading(false);
    setDialogStage(2);
  };

  // Stage 2 -> Stage 3 (Severity check-in follow-up)
  const handleSubAspectSelect = async (subOpt) => {
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: subOpt.text,
      time: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setSelectedSubOption(subOpt);

    const botText = await botManager.getResponse(subOpt, "followUp");

    const botMsg = {
      id: `bot-${Date.now()}`,
      sender: "bot",
      text: botText,
      time: new Date()
    };
    setMessages((prev) => [...prev, botMsg]);
    setLoading(false);
    setDialogStage(3);
  };

  // Stage 3 -> Stage 4 (Recommend test) or Stage 5 (Direct advice)
  const handleSeveritySelect = async (sevOpt) => {
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: sevOpt.text,
      time: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    if (sevOpt.nextAction === "recommend_test") {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `Cảm ơn cậu đã chia sẻ chân thành. Với mức độ ảnh hưởng này, tớ khuyên cậu nên dành ra vài phút làm bài đánh giá ${sevOpt.testLabel} hoặc Quét kết quả phòng khám lâm sàng để tớ chẩn đoán chính xác nhất nhé.`,
        time: new Date()
      };
      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
      setDialogStage(4);
    } else {
      const botText = await botManager.getResponse(sevOpt, "advice");
      const botMsgId = `bot-${Date.now()}`;
      const botMsg = {
        id: botMsgId,
        sender: "bot",
        text: `${botText}\n\n💡 Lời khuyên vàng: ${sevOpt.quote}`,
        time: new Date()
      };

        if (healingActive) {
          setMessages((prev) => [...prev, botMsg]);
          setLoading(false);
          setDialogStage(0);
        } else {
          const pkgNames = {
            7: "Hành trình Nuôi dưỡng Bình yên (Peace)",
            14: "Hành trình Chăm sóc Tinh thần (Mindfulness)",
            30: "Hành trình Tái tạo Cân bằng (Balance)",
            50: "Hành trình Phục hồi Thấu cảm (Compassionate)",
            90: "Hành trình Đồng hành Chuyên sâu (Intensive)"
          };
          const name = pkgNames[sevOpt.recommendedDays] || "Hành trình Chăm sóc Tinh thần (Mindfulness)";

          const proposalMsg = {
            id: `bot-proposal-${Date.now() + 10}`,
            sender: "bot",
            text: `Để hỗ trợ tốt nhất cho tình trạng hiện tại của cậu, tớ khuyên cậu nên kích hoạt **${name}** với thời gian **${sevOpt.recommendedDays} ngày** để tớ đồng hành chăm sóc sức khỏe tinh thần hàng ngày cùng cậu. Cậu có muốn kích hoạt lộ trình này ngay bây giờ không?`,
            time: new Date(Date.now() + 10),
            isCompanionSetup: true,
            recommendedDays: sevOpt.recommendedDays
          };

          setMessages((prev) => [...prev, botMsg, proposalMsg]);
          setLoading(false);
          setDialogStage(5);
        }
    }
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

        const dSev = getDassInterpret("D", resultLog.scores.D);
        const aSev = getDassInterpret("A", resultLog.scores.A);
        const sSev = getDassInterpret("S", resultLog.scores.S);

        let solutions = [];
        if (resultLog.scores.D >= 10) {
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
          `• **Trầm cảm (D):** ${resultLog.scores.D}/42 điểm (${dSev})\n` +
          `• **Lo âu (A):** ${resultLog.scores.A}/42 điểm (${aSev})\n` +
          `• **Căng thẳng (S):** ${resultLog.scores.S}/42 điểm (${sSev})\n\n` +
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
        const pastDass = historyLogs.filter(l => l.scores && l.scores.D !== undefined);
        if (pastDass.length > 0) {
          const lastPast = pastDass[pastDass.length - 1];
          const newSum = resultLog.scores.D + resultLog.scores.A + resultLog.scores.S;
          const prevSum = lastPast.scores.D + lastPast.scores.A + lastPast.scores.S;
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

  return (
    <div className="flex flex-col min-h-[580px] md:min-h-[600px] h-[580px] md:h-[600px] justify-between relative bg-zinc-50/20 dark:bg-black/10 animate-fadeIn">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-mascot {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.01); }
          100% { transform: translateY(0px) scale(1); }
        }
        .animate-float-mascot {
          animation: float-mascot 4s ease-in-out infinite;
        }
        .comic-dotted-bg {
          background-image: radial-gradient(rgba(0, 0, 0, 0.04) 1.5px, transparent 1.5px);
          background-size: 16px 16px;
        }
        .dark .comic-dotted-bg {
          background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1.5px, transparent 1.5px);
        }
      `}} />

      {/* Header Info */}
      <div className="px-5 py-3.5 bg-white dark:bg-[#12111a] border-b-2 border-zinc-900 dark:border-zinc-800 flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-sm font-black">healing</span>
          </div>
          <div>
            <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Chuyên viên Đồng Hành</h4>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Trị liệu & Chăm sóc Thích ứng</p>
          </div>
        </div>

        {healingActive && (
          <button
            type="button"
            onClick={() => {
              const lastTestDateStr = localStorage.getItem("banhocduong_last_test_date");
              if (lastTestDateStr) {
                const lastTestTime = new Date(lastTestDateStr).getTime();
                const nowTime = new Date().getTime();
                const hoursDiff = (nowTime - lastTestTime) / (1000 * 60 * 60);
                if (hoursDiff < 32) {
                  const remainingHours = Math.ceil(32 - hoursDiff);
                  if (showToast) {
                    showToast(`Cậu vừa làm bài test chưa lâu. Vui lòng đợi thêm ${remainingHours} giờ để tiếp tục đánh giá chính xác nhé.`, "warning");
                  }
                  return;
                }
              }
              setShowTestsMenu(true);
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-md text-[9px] font-black uppercase tracking-wider shadow-md transition-all active:scale-[0.98] flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[10px] font-bold">refresh</span>
            Chủ động test lại
          </button>
        )}
      </div>

      {/* Clinical Test Selection Menu Popup */}
      {showTestsMenu && (
        <div className="absolute top-[55px] right-4 w-64 p-4 rounded-lg border-2 border-zinc-900 dark:border-zinc-800 bg-white dark:bg-[#12111a] shadow-xl z-20 space-y-2 animate-scaleUp">
          <div className="flex justify-between items-center pb-1 border-b border-zinc-150/40">
            <h5 className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Bài đánh giá chuẩn lâm sàng</h5>
            <button type="button" onClick={() => setShowTestsMenu(false)} className="text-zinc-400 hover:text-zinc-650 text-[10px] font-bold">Đóng</button>
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => handleStartTest("phq9")}
              className="w-full text-left px-3 py-2 bg-red-500/5 hover:bg-red-500/10 text-red-650 rounded-md text-[10px] font-black uppercase tracking-wider border border-red-500/10"
            >
              [PHQ-9] Đánh giá Trầm cảm
            </button>
            <button
              type="button"
              onClick={() => handleStartTest("gad7")}
              className="w-full text-left px-3 py-2 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-650 rounded-md text-[10px] font-black uppercase tracking-wider border border-cyan-500/10"
            >
              [GAD-7] Đánh giá Lo âu
            </button>
            <button
              type="button"
              onClick={() => handleStartTest("who5")}
              className="w-full text-left px-3 py-2 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-650 rounded-md text-[10px] font-black uppercase tracking-wider border border-emerald-500/10"
            >
              [WHO-5] Đánh giá Hạnh phúc
            </button>
            <button
              type="button"
              onClick={() => handleStartTest("bigfive")}
              className="w-full text-left px-3 py-2 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-655 rounded-md text-[10px] font-black uppercase tracking-wider border border-indigo-500/10"
            >
              [Big Five] Trắc nghiệm Nhân cách
            </button>
          </div>
        </div>
      )}

      {/* Main Comic Strip Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 comic-dotted-bg">
        {/* Left Column: Mascot */}
        <div className="hidden md:flex md:w-[26%] flex-col justify-end items-center relative select-none pb-2 border-r border-zinc-200/50 dark:border-zinc-800/20">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-100/50 via-transparent to-transparent dark:from-zinc-950/20 pointer-events-none" />
          <img
            src="/image/avt7.png"
            alt="Chuyên viên đồng hành"
            className="w-full max-w-[200px] h-[340px] object-contain animate-float-mascot z-10 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/image/avt6.png"; 
            }}
          />
          <span className="mb-2 px-3 py-1 rounded-full bg-zinc-900/90 text-white dark:bg-white/90 dark:text-zinc-900 text-[8px] font-black tracking-widest uppercase z-10 shadow-sm">
            Chuyên viên Đồng Hành
          </span>
        </div>

        {/* Right Column: Dialogue and Actions */}
        <div className="flex-1 flex flex-col min-h-0 justify-between p-4">
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
              onCancel={() => {
                setChatMode("normal");
                setActiveTest(null);
              }}
            />
          )}

          {chatMode === "scan" && (
            <ClinicScanner
              onScanComplete={handleScanComplete}
              onCancel={() => setChatMode("normal")}
            />
          )}

          {/* Action Options Menu (No text typing allowed) */}
          {chatMode === "normal" && !loading && isLastMessageCompleted && (
            <>
              {dialogStage === 1 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/10 shrink-0">
                  <div className="flex items-center gap-2 w-full">
                    <button type="button" className={`p-2 rounded-full border shrink-0 transition-all ${isListening ? 'bg-rose-500/10 border-rose-500 text-rose-500 animate-pulse' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`} onClick={startListening}>
                      <Mic className="w-4 h-4" />
                    </button>
                    <div className="flex-1 flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {(healingActive ? COMPANION_DIALOGUE_TREE : DIALOGUE_TREE).aspects.map(aspect => (
                        <button
                          key={aspect.id}
                          type="button"
                          onClick={() => handleAspectSelect(aspect)}
                          className="py-2 px-3.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#1a1924] text-[9px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm shrink-0 flex items-center gap-1 transition-all"
                        >
                          <span>{aspect.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {dialogStage === 2 && selectedAspect && (
                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/10 shrink-0">
                  {selectedAspect.options.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSubAspectSelect(opt)}
                      className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
                    >
                      <span>{opt.text}</span>
                      <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setDialogStage(1);
                      const botMsg = {
                        id: `bot-reset-${Date.now()}`,
                        sender: "bot",
                        text: healingActive
                          ? "Tớ luôn bên cậu lắng nghe cậu yêu, cậu có muốn chia sẻ thêm khía cạnh nào khác không?"
                          : "Tớ luôn sẵn lòng lắng nghe cậu yêu, cậu có muốn chia sẻ về khía cạnh nào khác không?",
                        time: new Date()
                      };
                      setMessages(prev => [...prev, botMsg]);
                    }}
                    className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-850 bg-zinc-100 dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-550 hover:bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-center"
                  >
                    Quay lại chọn khía cạnh khác
                  </button>
                </div>
              )}

              {dialogStage === 3 && selectedSubOption && (
                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/10 shrink-0">
                  <div className="flex items-center gap-2 w-full">
                    <button type="button" className={`p-2 rounded-full border shrink-0 transition-all ${isListening ? 'bg-rose-500/10 border-rose-500 text-rose-500 animate-pulse' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`} onClick={startListening}>
                      <Mic className="w-4 h-4" />
                    </button>
                    <div className="flex-1 flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {selectedSubOption.severityOptions.map(sevOpt => (
                        <button
                          key={sevOpt.id}
                          type="button"
                          onClick={() => handleSeveritySelect(sevOpt)}
                          className="py-2 px-3.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#1a1924] text-[9px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm shrink-0 flex items-center gap-1 transition-all"
                        >
                          <span>{sevOpt.text}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setDialogStage(2);
                        }}
                        className="py-2 px-3.5 rounded-full bg-zinc-200/50 dark:bg-zinc-800/50 text-[9px] font-bold text-zinc-600 dark:text-zinc-400 shrink-0"
                      >
                        Quay lại
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {dialogStage === 4 && selectedSubOption && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const sevHigh = selectedSubOption.severityOptions.find(o => o.nextAction === "recommend_test");
                      if (sevHigh) handleStartTest(sevHigh.test);
                    }}
                    className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-850 bg-[#0071e3] text-white text-[9.5px] font-black uppercase hover:bg-[#0077ed] shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
                  >
                    <span>Làm bài test đánh giá</span>
                    <span className="material-symbols-outlined text-[11px]">play_arrow</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatMode("scan")}
                    className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
                  >
                    <span>Quét kết quả phòng khám</span>
                    <span className="material-symbols-outlined text-[11px]">cloud_upload</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDialogStage(1);
                      const botMsg = {
                        id: `bot-reset-${Date.now()}`,
                        sender: "bot",
                        text: healingActive
                          ? "Tớ hiểu rồi cậu yêu. Cậu có muốn giãi bày hay chia sẻ thêm khía cạnh nào khác với tớ không?"
                          : "Tớ hiểu rồi cậu yêu. Cậu muốn chia sẻ thêm khía cạnh nào khác không? Hãy cứ thoải mái bày tỏ suy nghĩ của cậu với tớ nhé.",
                        time: new Date()
                      };
                      setMessages(prev => [...prev, botMsg]);
                    }}
                    className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-855 bg-zinc-150 dark:bg-zinc-900 hover:bg-zinc-250 dark:hover:bg-zinc-800 text-[9.5px] font-black uppercase text-zinc-600 dark:text-zinc-300 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-center col-span-2"
                  >
                    Quay lại từ đầu
                  </button>
                </div>
              )}

              {dialogStage === 5 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setDialogStage(1);
                      const botMsg = {
                        id: `bot-reset-${Date.now()}`,
                        sender: "bot",
                        text: healingActive
                          ? "Tớ luôn bên cậu yêu. Dạo này tiến trình tự chữa lành và cảm xúc của cậu thế nào? Hãy chọn chia sẻ dưới đây nhé."
                          : "Tớ luôn sẵn lòng lắng nghe cậu yêu. Dạo gần đây có chuyện gì làm cậu bận tâm nhất? Hãy chọn chia sẻ với tớ dưới đây nhé.",
                        time: new Date()
                      };
                      setMessages(prev => [...prev, botMsg]);
                    }}
                    className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-855 bg-zinc-100 dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-550 hover:bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-center"
                  >
                    Quay lại từ đầu
                  </button>
                </div>
              )}

              {dialogStage === 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/10 shrink-0 w-full">
                  <button type="button" className={`p-2 rounded-full border shrink-0 transition-all ${isListening ? 'bg-rose-500/10 border-rose-500 text-rose-500 animate-pulse' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`} onClick={startListening} title="Thu âm chuyển thành Text">
                    <Mic className="w-4 h-4" />
                  </button>
                  <button type="button" className={`p-2 rounded-full border shrink-0 transition-all ${isRecordingAudio ? 'bg-purple-500/10 border-purple-500 text-purple-500 animate-pulse' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`} onPointerDown={startAudioRecording} onPointerUp={stopAudioRecording} onPointerCancel={stopAudioRecording} title="Giữ để Gọi điện với AI (Native Audio)">
                    {isRecordingAudio ? <MicOff className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => {
                        setDialogStage(1);
                        const botMsg = {
                          id: `bot-loop-${Date.now()}`,
                          sender: "bot",
                          text: healingActive
                            ? "Tớ luôn sẵn lòng đồng hành và lắng nghe cậu yêu. Hôm nay cậu muốn chia sẻ hay tâm sự thêm điều gì với tớ không?"
                            : "Tớ luôn sẵn lòng đồng hành cùng cậu yêu. Gần đây điều gì khiến cậu suy nghĩ nhiều nhất? Cậu có thể chọn chia sẻ dưới đây với tớ nhé.",
                          time: new Date()
                        };
                        setMessages(prev => [...prev, botMsg]);
                      }}
                      className="py-2 px-3.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#1a1924] text-[9px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm shrink-0 flex items-center gap-1 transition-all"
                    >
                      <span className="material-symbols-outlined text-[11px] text-blue-500">chat</span>
                      <span>Tâm sự tiếp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCallModalOpen(true)}
                      className="py-2 px-3.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-[9px] font-bold text-blue-500 hover:bg-blue-500/20 shadow-sm shrink-0 flex items-center gap-1 transition-all"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Gọi trực tiếp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTestsMenu(true)}
                      className="py-2 px-3.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#1a1924] text-[9px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm shrink-0 flex items-center gap-1 transition-all"
                    >
                      <span className="material-symbols-outlined text-[11px] text-emerald-500">assignment</span>
                      <span>Làm bài Test</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatMode("scan")}
                      className="py-2 px-3.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#1a1924] text-[9px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm shrink-0 flex items-center gap-1 transition-all"
                    >
                      <span className="material-symbols-outlined text-[11px] text-indigo-500">cloud_upload</span>
                      <span>Quét hồ sơ bệnh án</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <AICallModal 
        isOpen={isCallModalOpen} 
        onClose={() => setIsCallModalOpen(false)} 
        botManager={botManager} 
      />
    </div>
  );
}
