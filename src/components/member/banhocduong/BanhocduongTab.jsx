import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Heart, Trash2, ShieldCheck, MessageSquare, AlertTriangle, ChevronDown, ChevronUp, Clock, Sparkles, Bell } from "lucide-react";
import SubUtilityHeader from "../SubUtilityHeader";
import ChatTab from "./ChatTab";
import TherapyTab from "./TherapyTab";
import ProfileTab from "./ProfileTab";
import EvaluationTab from "./EvaluationTab";
import SleepTracker from "./SleepTracker";
import dataApi from "../../../services/dataApi";
import psychologyService from "../../../services/classes/PsychologyService";
import { webPushHelper } from "../../../utils/webPushHelper";
import { useTranslation } from "react-i18next";

function CompanionDashboard({ duration, startDate, getProgressDay, onCancel, historyLogs, bio }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(
    'Notification' in window ? Notification.permission : 'default'
  );

  const handleEnablePush = async () => {
    try {
      const permission = await webPushHelper.requestPermission();
      setNotificationStatus(permission);
      if (permission === 'granted' && bio && bio.email) {
        await webPushHelper.registerAndSubscribe(bio.email);
        if (showToast) {
          showToast('Đăng ký nhận thông báo nhắc nhở thành công! 🎉', 'success');
        }
      } else if (permission === 'denied') {
        if (showToast) {
          showToast('Quyền thông báo đã bị từ chối. Cậu vui lòng bật lại quyền thông báo trong cài đặt trình duyệt của mình nhé.', 'warning');
        }
      }
    } catch (err) {
      console.error(err);
      if (showToast) {
        showToast('Không thể đăng ký nhận thông báo đẩy lúc này.', 'error');
      }
    }
  };
  const getQualifiedActivitiesCount = (logs) => {
    if (!logs) return 0;
    return logs.filter(log => {
      if (log.type !== "therapy_activity") return false;
      const name = (log.name || "").toLowerCase();
      const desc = (log.desc || "").toLowerCase();
      if (name.includes("đọc sách")) {
        const match = desc.match(/(\d+)\s*phút/);
        return (match ? parseInt(match[1]) : 0) >= 30;
      }
      if (name.includes("tĩnh tâm")) {
        const match = desc.match(/(\d+)\s*phút/);
        return (match ? parseInt(match[1]) : 0) >= 30;
      }
      if (name.includes("hít thở")) {
        const match = desc.match(/(\d+)\s*phút/);
        return (match ? parseInt(match[1]) : 0) >= 10;
      }
      if (name.includes("trầm cảm") || name.includes("cbt")) {
        const match = desc.match(/(\d+)\s*phút/);
        return (match ? parseInt(match[1]) : 0) >= 10;
      }
      return false;
    }).length;
  };

  const currentDay = getProgressDay();
  const qualifiedCount = getQualifiedActivitiesCount(historyLogs);
  const bonusPercent = qualifiedCount * 2;
  const shortenedDays = Math.floor(qualifiedCount * 0.6);
  const effectiveDuration = Math.max(1, duration - shortenedDays);
  
  const progressPercent = Math.min(100, Math.round((currentDay / duration) * 100) + bonusPercent);

  const formatDateTime = (isoString) => {
    try {
      const d = new Date(isoString);
      const pad = (n) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
      return "Không xác định";
    }
  };

  const getMoodEmoji = (mood) => {
    switch (mood) {
      case 5: return "Rất tốt";
      case 4: return "Tốt";
      case 3: return "Bình thường";
      case 2: return "Mỏi mệt";
      case 1: return "Kiệt sức";
      default: return "Không xác định";
    }
  };

  const { anomalies, recommendation } = React.useMemo(() => {
    const anomaliesList = [];
    const checkins = historyLogs.filter(l => l.type === "checkin");
    const dassTests = historyLogs.filter(l => l.test === "dass42");
    const mmpiTests = historyLogs.filter(l => l.test === "mmpi30");
    const chatAnomalies = historyLogs.filter(l => l.type === "chat_anomaly");
    const uploadAnomalies = historyLogs.filter(l => l.type === "upload_anomaly");

    // 1. Mood abnormalities
    const lowMoods = checkins.filter(c => c.mood <= 2);
    if (lowMoods.length > 0) {
      anomaliesList.push({
        title: "Tâm trạng suy giảm",
        desc: `Ghi nhận ${lowMoods.length} ngày cậu có tâm trạng khá trầm buồn hoặc mệt mỏi.`,
        severity: "medium"
      });
    }

    // 2. Wheel of life imbalance
    if (checkins.length > 0) {
      const lastCheckinWithWheel = [...checkins].reverse().find(c => c.wheelRatings);
      if (lastCheckinWithWheel && lastCheckinWithWheel.wheelRatings) {
        const categories = ["Bản thân", "Học tập", "Công việc", "Gia đình", "Mối quan hệ"];
        const imbalanced = [];
        lastCheckinWithWheel.wheelRatings.forEach((rating, idx) => {
          if (rating <= 4) {
            imbalanced.push(`${categories[idx]} (${rating}/10)`);
          }
        });
        if (imbalanced.length > 0) {
          anomaliesList.push({
            title: "Bánh xe cuộc sống mất cân bằng",
            desc: `Khía cạnh ${imbalanced.join(", ")} đang ghi nhận mức độ hài lòng thấp.`,
            severity: "medium"
          });
        }
      }
    }

    // 3. Late-Night Activity (Sleep disruption check)
    const lateNightEvents = historyLogs.filter(l => {
      if (!l.date) return false;
      const d = new Date(l.date);
      const hours = d.getHours();
      return hours >= 23 || hours < 5;
    });
    if (lateNightEvents.length > 0) {
      anomaliesList.push({
        title: "Rối loạn giấc ngủ / Hoạt động muộn",
        desc: `Ghi nhận ${lateNightEvents.length} lần cậu hoạt động muộn vào ban đêm (từ 23h đến 5h sáng), có thể ảnh hưởng xấu đến chu kỳ giấc ngủ.`,
        severity: "medium"
      });
    }

    // 4. MMPI validity checkers
    const unreliableMmpis = mmpiTests.filter(m => m.isReliable === false);
    if (unreliableMmpis.length > 0) {
      anomaliesList.push({
        title: "Kiểm định MMPI tin cậy thấp",
        desc: `Có ${unreliableMmpis.length} kết quả trắc nghiệm MMPI nghi ngờ độ tin cậy của chỉ số L-F-K.`,
        severity: "medium"
      });
    }

    // 5. Upload errors
    if (uploadAnomalies.length > 0) {
      anomaliesList.push({
        title: "Lỗi tải báo cáo sức khỏe",
        desc: `Ghi nhận ${uploadAnomalies.length} lần tải lên tệp không đúng định dạng quy chuẩn.`,
        severity: "medium"
      });
    }

    // 6. DASS clinical levels
    if (dassTests.length > 0) {
      const latest = dassTests[dassTests.length - 1];
      const elevated = [];
      if (latest.severities) {
        if (["severe", "extremely_severe"].includes(latest.severities.D)) elevated.push(`Trầm cảm (${latest.severities.D === "severe" ? "Nặng" : "Cực đoan"})`);
        if (["severe", "extremely_severe"].includes(latest.severities.A)) elevated.push(`Lo âu (${latest.severities.A === "severe" ? "Nặng" : "Cực đoan"})`);
        if (["severe", "extremely_severe"].includes(latest.severities.S)) elevated.push(`Căng thẳng (${latest.severities.S === "severe" ? "Nặng" : "Cực đoan"})`);
      }
      
      if (elevated.length > 0) {
        anomaliesList.push({
          title: "Chỉ số lâm sàng DASS vượt ngưỡng",
          desc: `Bài kiểm tra DASS-21 ghi nhận tình trạng ${elevated.join(", ")}.`,
          severity: "high"
        });
      }
    }

    // 7. MMPI clinical scales
    if (mmpiTests.length > 0) {
      const latest = mmpiTests[mmpiTests.length - 1];
      const elevatedScales = latest.clinical ? latest.clinical.filter(c => c.score >= 70) : [];
      if (elevatedScales.length > 0) {
        const scaleNames = { Hs: "Nghi bệnh", D: "Trầm cảm", Hy: "Hysteria", Pd: "Sai lệch nhân cách", Mf: "Nam/Nữ tính", Pa: "Hoang tưởng", Pt: "Suy nhược tâm thần", Sc: "Tâm thần phân liệt", Ma: "Hưng cảm nhẹ", Si: "Hướng ngoại xã hội" };
        const list = elevatedScales.map(s => `${scaleNames[s.code] || s.code} (${s.score} T-score)`);
        anomaliesList.push({
          title: "Xu hướng hành vi MMPI vượt ngưỡng",
          desc: `Phát hiện bất thường lâm sàng tại các thang đo: ${list.join(", ")}.`,
          severity: "high"
        });
      }
    }

    // 8. Chat anomalies
    if (chatAnomalies.length > 0) {
      const lastAnomaly = chatAnomalies[chatAnomalies.length - 1];
      anomaliesList.push({
        title: "Dấu hiệu bất ổn trong hội thoại",
        desc: `Phát hiện các từ khóa áp lực/căng thẳng trong tin nhắn: "${lastAnomaly.text}" (Từ khóa: ${lastAnomaly.triggers ? lastAnomaly.triggers.join(", ") : "stress"}).`,
        severity: "medium"
      });
    }

    // Generate custom recommendations
    let rec = "";
    if (anomaliesList.some(a => a.severity === "high")) {
      rec = "Khuyến nghị: Chỉ số sức khỏe tinh thần của cậu đang có dấu hiệu bất ổn lâm sàng nghiêm trọng. Cậu nên giảm bớt cường độ bài vở, thực hành thở sâu 4-7-8 mỗi đêm và trò chuyện thường xuyên hơn với Chuyên viên Đồng Hành. Nếu cảm xúc này kéo dài liên tục trên 2 tuần, hãy liên hệ trực tiếp với chuyên viên tư vấn tâm lý hoặc phòng y tế trường học để được hỗ trợ kịp thời nhé.";
    } else if (anomaliesList.length > 0) {
      rec = "Khuyến nghị: Hệ thống phát hiện một vài căng thẳng nhẹ và sự mất cân bằng trong sinh hoạt/học tập của cậu. Cậu hãy dành thêm thời gian nghỉ ngơi, ngủ đủ giấc và tiếp tục chia sẻ nỗi lòng cùng Chuyên viên Đồng Hành mỗi khi mệt mỏi nhé.";
    } else {
      rec = "Khuyến nghị: Cảm xúc và chỉ số sinh hoạt của cậu dạo gần đây cực kỳ tốt và cân bằng ổn định. Hãy tiếp tục duy trì năng lượng tích cực này, hít thở điều hòa và trò chuyện cùng Chuyên viên Đồng Hành khi cần nhé!";
    }

    return { anomalies: anomaliesList, recommendation: rec };
  }, [historyLogs]);

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-rose-500/5 dark:from-emerald-950/15 dark:via-zinc-900/40 dark:to-zinc-950/20 backdrop-blur-xl rounded-3xl border border-emerald-500/10 dark:border-emerald-500/10 shadow-2xl p-6 space-y-5 animate-scaleUp">
      {/* Journey details */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-250/50 dark:border-zinc-800/40 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider">Hành Trình Chăm Sóc Tinh Thần</h3>
          </div>
          <p className="text-[10px] text-zinc-550 dark:text-zinc-400 font-bold uppercase tracking-widest flex flex-wrap items-center gap-1.5">
            <span>Ngày {currentDay}/{effectiveDuration}</span>
            <span>•</span>
            <span>Bắt đầu: {startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "Hôm nay"}</span>
            {shortenedDays > 0 && (
              <>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black animate-pulse bg-emerald-500/10 px-2 py-0.5 rounded-full text-[9px] uppercase">
                  Rút ngắn -{shortenedDays} ngày 🎉
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {webPushHelper.isSupported() && notificationStatus !== 'granted' && (
            <button
              type="button"
              onClick={handleEnablePush}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-emerald-500/20 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/15 text-[10px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-wider transition-all"
            >
              <Bell className="w-3.5 h-3.5 animate-bounce text-emerald-500" />
              Bật nhắc nhở đẩy
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-500/20 hover:border-red-500 bg-red-500/5 hover:bg-red-500/15 text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Dừng lộ trình
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider pl-0.5">
          <span>Tiến trình hoàn thành</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden p-[2px]">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      </div>
  
  );
}

export default function BanhocduongTab({ onBack, defaultSubTab = "chat", defaultPresetTest = null, bio, showToast, setFormData, handleSave }) {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState(defaultSubTab); // "chat", "therapy", "profile", "evaluation"
  const [presetTest, setPresetTest] = useState(defaultPresetTest);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // States synchronized from DB
  const [healingActive, setHealingActive] = useState(false);
  const [healingDuration, setHealingDuration] = useState(30);
  const [healingStartDate, setHealingStartDate] = useState("");
  const [historyLogs, setHistoryLogs] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [adaptationAlert, setAdaptationAlert] = useState(null);

  // Sync state from Database
  const syncWithDb = async () => {
    if (!bio || !bio.email) return;
    try {
      const db = await dataApi.getCompanionHistory(bio.email);
      if (db) {
        let isReset = false;
        
        // Month end check logic:
        // "Tất cả lịch sử... lưu 100% cho đến hết tháng. Khi qua tháng mới, nếu ngày đồng hành vẫn còn thì sẽ vẫn giữ... nếu đã hoàn tất thì reset"
        if (db.healingStartDate && db.healingActive) {
          const start = new Date(db.healingStartDate);
          const now = new Date();
          const elapsedDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          const isNewMonth = now.getMonth() !== start.getMonth() || now.getFullYear() !== start.getFullYear();
          const isCompleted = elapsedDays > db.healingDuration;
          
          if (isNewMonth && isCompleted) {
             isReset = true;
          }
        }
        
        if (isReset) {
          setHealingActive(false);
          setHealingDuration(30);
          setHealingStartDate("");
          setHistoryLogs([]);
          setChatMessages([]);
          
          localStorage.removeItem("banhocduong_healing_mode");
          localStorage.removeItem("banhocduong_healing_duration");
          localStorage.removeItem("banhocduong_healing_start_date");
          localStorage.removeItem("banhocduong_history");
          localStorage.removeItem("banhocduong_last_checkin_date");
          localStorage.removeItem("banhocduong_last_test_date");
          localStorage.removeItem("banhocduong_chat_distress_count");
          localStorage.removeItem("banhocduong_chat_messages");
          
          await dataApi.saveCompanionHistory({
            email: bio.email,
            healingActive: false,
            healingDuration: 30,
            healingStartDate: "",
            historyLogs: [],
            chatMessages: [],
            lastCheckinDate: "",
            lastTestDate: "",
            chatDistressCount: 0
          });
        } else {
          setHealingActive(db.healingActive);
          setHealingDuration(db.healingDuration);
          setHealingStartDate(db.healingStartDate ? new Date(db.healingStartDate).toISOString() : "");
          setHistoryLogs(db.historyLogs || []);
          setChatMessages(db.chatMessages || []);

          localStorage.setItem("banhocduong_healing_mode", db.healingActive ? "active" : "");
          localStorage.setItem("banhocduong_healing_duration", db.healingDuration.toString());
          localStorage.setItem("banhocduong_healing_start_date", db.healingStartDate || "");
          localStorage.setItem("banhocduong_history", JSON.stringify(db.historyLogs || []));
          localStorage.setItem("banhocduong_last_checkin_date", db.lastCheckinDate || "");
          localStorage.setItem("banhocduong_last_test_date", db.lastTestDate || "");
          localStorage.setItem("banhocduong_chat_distress_count", (db.chatDistressCount || 0).toString());
          localStorage.setItem("banhocduong_chat_messages", JSON.stringify(db.chatMessages || []));
        }
      }
    } catch (e) {
      console.error("Failed to sync companion history from DB", e);
    }
  };

  useEffect(() => {
    syncWithDb();
  }, [bio?.email]);

  // Unified updates dispatcher to save to MongoDB
  const handleUpdateCompanionState = async (updates) => {
    if (!bio || !bio.email) return;
    try {
      // 1. Sync updates to localStorage and React state synchronously to prevent stale React state overrides on rapid sequential calls
      if (updates.healingActive !== undefined) {
        localStorage.setItem("banhocduong_healing_mode", updates.healingActive ? "active" : "");
        setHealingActive(updates.healingActive);
      }
      if (updates.healingDuration !== undefined) {
        localStorage.setItem("banhocduong_healing_duration", updates.healingDuration.toString());
        setHealingDuration(updates.healingDuration);
      }
      if (updates.healingStartDate !== undefined) {
        localStorage.setItem("banhocduong_healing_start_date", updates.healingStartDate || "");
        setHealingStartDate(updates.healingStartDate ? new Date(updates.healingStartDate).toISOString() : "");
      }
      if (updates.historyLogs !== undefined) {
        localStorage.setItem("banhocduong_history", JSON.stringify(updates.historyLogs));
        setHistoryLogs(updates.historyLogs);
      }
      if (updates.chatMessages !== undefined) {
        localStorage.setItem("banhocduong_chat_messages", JSON.stringify(updates.chatMessages));
        setChatMessages(updates.chatMessages);
      }

      // 2. Build payload using localStorage as the synchronous source of truth
      const isHealingActive = localStorage.getItem("banhocduong_healing_mode") === "active";
      const parsedDur = parseInt(localStorage.getItem("banhocduong_healing_duration"), 10);
      const healingDur = (!isNaN(parsedDur) && parsedDur > 0) ? parsedDur : 30;
      const healingStart = localStorage.getItem("banhocduong_healing_start_date") || "";
      const logs = JSON.parse(localStorage.getItem("banhocduong_history") || "[]");
      const msgs = JSON.parse(localStorage.getItem("banhocduong_chat_messages") || "[]");

      const rawDistressCount = Number(localStorage.getItem("banhocduong_chat_distress_count") || 0);
      const distressCount = !isNaN(rawDistressCount) ? rawDistressCount : 0;

      const payload = {
        email: bio.email,
        healingActive: isHealingActive,
        healingDuration: healingDur,
        healingStartDate: healingStart,
        lastCheckinDate: updates.lastCheckinDate !== undefined ? updates.lastCheckinDate : (localStorage.getItem("banhocduong_last_checkin_date") || ""),
        lastTestDate: updates.lastTestDate !== undefined ? updates.lastTestDate : (localStorage.getItem("banhocduong_last_test_date") || ""),
        chatDistressCount: updates.chatDistressCount !== undefined ? updates.chatDistressCount : distressCount,
        historyLogs: logs,
        chatMessages: msgs
      };

      const res = await dataApi.saveCompanionHistory(payload);
      if (res && res.companionHistory) {
        const db = res.companionHistory;
        setHealingActive(db.healingActive);
        setHealingDuration(db.healingDuration);
        setHealingStartDate(db.healingStartDate ? new Date(db.healingStartDate).toISOString() : "");
        setHistoryLogs(db.historyLogs || []);
        setChatMessages(db.chatMessages || []);

        localStorage.setItem("banhocduong_healing_mode", db.healingActive ? "active" : "");
        localStorage.setItem("banhocduong_healing_duration", db.healingDuration.toString());
        localStorage.setItem("banhocduong_healing_start_date", db.healingStartDate || "");
        localStorage.setItem("banhocduong_history", JSON.stringify(db.historyLogs || []));
        localStorage.setItem("banhocduong_last_checkin_date", db.lastCheckinDate || "");
        localStorage.setItem("banhocduong_last_test_date", db.lastTestDate || "");
        localStorage.setItem("banhocduong_chat_distress_count", (db.chatDistressCount || 0).toString());
        localStorage.setItem("banhocduong_chat_messages", JSON.stringify(db.chatMessages || []));
      }
    } catch (e) {
      console.error("Failed to save companion state", e);
    }
  };

  useEffect(() => {
    const checkAdaptationAlert = () => {
      const alertRaw = localStorage.getItem("banhocduong_duration_adaptation_alert");
      if (alertRaw) {
        try {
          const alertData = JSON.parse(alertRaw);
          setAdaptationAlert(alertData);
          localStorage.removeItem("banhocduong_duration_adaptation_alert");
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#34d399', '#f472b6', '#38bdf8', '#fbbf24']
          });
          syncWithDb();
        } catch (e) {
          console.error(e);
        }
      }
    };
    
    checkAdaptationAlert();
    const interval = setInterval(checkAdaptationAlert, 1500);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleSubTabChange = (tabId) => {
    setActiveSubTab(tabId);
    setPresetTest(null);
  };

  const handleNavigateToTab = (tabId, preset = null) => {
    setActiveSubTab(tabId);
    setPresetTest(preset);
  };

  const getProgressDay = () => {
    if (!healingStartDate) return 1;
    const start = new Date(healingStartDate).getTime();
    const now = new Date().getTime();
    const diffTime = Math.max(0, now - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleCancelHealing = () => {
    const currentDay = getProgressDay();
    const getQualifiedActivitiesCount = (logs) => {
      if (!logs) return 0;
      return logs.filter(log => {
        if (log.type !== "therapy_activity") return false;
        const name = (log.name || "").toLowerCase();
        const desc = (log.desc || "").toLowerCase();
        if (name.includes("đọc sách")) {
          const match = desc.match(/(\d+)\s*phút/);
          return (match ? parseInt(match[1]) : 0) >= 30;
        }
        if (name.includes("tĩnh tâm")) {
          const match = desc.match(/(\d+)\s*phút/);
          return (match ? parseInt(match[1]) : 0) >= 30;
        }
        if (name.includes("hít thở")) {
          const match = desc.match(/(\d+)\s*phút/);
          return (match ? parseInt(match[1]) : 0) >= 10;
        }
        if (name.includes("trầm cảm") || name.includes("cbt")) {
          const match = desc.match(/(\d+)\s*phút/);
          return (match ? parseInt(match[1]) : 0) >= 10;
        }
        return false;
      }).length;
    };

    const qualifiedCount = getQualifiedActivitiesCount(historyLogs);
    const bonusPercent = qualifiedCount * 2;
    const progressPercent = Math.min(100, Math.round((currentDay / healingDuration) * 100) + bonusPercent);

    if (progressPercent < 60) {
      if (showToast) {
        showToast(`Cậu ơi, để dừng lộ trình đồng hành thì tụi mình cần hoàn tất tối thiểu 60% chặng đường nhé (hiện tại cậu đạt: ${progressPercent}%). Hãy kiên trì thêm chút nữa nha, tớ luôn ở bên cạnh tiếp thêm sức mạnh cho cậu! 💪🌸`, 'warning');
      }
      return;
    }
    setShowCancelModal(true);
  };

  const confirmCancelHealing = async () => {
    setShowCancelModal(false);
    await handleUpdateCompanionState({
      healingActive: false,
      healingDuration: 30,
      healingStartDate: null,
      historyLogs: historyLogs // Keep existing history logs!
    });
    if (showToast) {
      showToast('Cậu đã dừng lộ trình chăm sóc tinh thần hiện tại thành công. Lịch sử tiến trình của cậu vẫn được tớ lưu trữ đầy đủ ở Hồ Sơ nhé! 🌸', 'success');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-0 space-y-6 animate-fadeIn pb-12">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}} />

      {/* Sub Utility Header */}
      <SubUtilityHeader
        title="Bạn Học Đường"
        icon="psychology"
        colorClass="text-emerald-500 animate-pulse"
        onBack={onBack}
      />

      {/* Companion Dashboard Card */}
      {healingActive && (
        <CompanionDashboard
          duration={healingDuration}
          startDate={healingStartDate}
          getProgressDay={getProgressDay}
          onCancel={handleCancelHealing}
          historyLogs={historyLogs}
          bio={bio}
        />
      )}

      {/* Workspace Layout */}
      <div className="flex flex-col md:flex-row gap-4 w-full h-[650px]">
        {/* Sidebar Navigation */}
        <div className="md:w-20 lg:w-48 flex-shrink-0 flex md:flex-col items-center lg:items-stretch gap-2 overflow-x-auto md:overflow-y-auto scrollbar-none p-2 rounded-3xl bg-white/40 dark:bg-[#12111a]/60 backdrop-blur-3xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl z-10">
          {[
            { id: "chat", label: "Tâm Sự", icon: MessageSquare, color: "text-[#0071e3]" },
            { id: "therapy", label: "Trị Liệu", icon: Heart, color: "text-rose-500" },
            { id: "sleep", label: "Giấc Ngủ", icon: Clock, color: "text-indigo-500" },
            { id: "evaluation", label: "Đánh Giá", icon: AlertTriangle, color: "text-amber-500" },
            { id: "profile", label: "Hồ Sơ", icon: ShieldCheck, color: "text-emerald-500" },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            const IconComponent = tab.icon;
            return (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={tab.id}
                type="button"
                onClick={() => handleSubTabChange(tab.id)}
                className={`relative flex items-center justify-center lg:justify-start gap-3 p-3.5 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? `bg-white dark:bg-zinc-800/80 shadow-md ${tab.color}`
                    : "text-zinc-500 hover:bg-white/50 dark:hover:bg-zinc-800/40"
                }`}
              >
                <IconComponent className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
                <span className={`text-[11px] font-black uppercase tracking-wider hidden lg:block`}>{tab.label}</span>
                {isActive && (
                  <motion.div layoutId="activeTabIndicator" className="absolute left-0 w-1 h-6 bg-current rounded-r-full hidden lg:block" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white/80 dark:bg-[#12111a]/80 backdrop-blur-2xl rounded-3xl border border-zinc-200/40 dark:border-zinc-800/60 shadow-2xl overflow-hidden flex flex-col relative z-10">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-20 z-0">
             <div className="absolute top-0 -left-1/4 w-2/3 h-2/3 bg-blue-400/40 dark:bg-blue-600/40 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-blob" />
             <div className="absolute top-0 -right-1/4 w-2/3 h-2/3 bg-purple-400/40 dark:bg-purple-600/40 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
             <div className="absolute -bottom-1/4 left-1/4 w-2/3 h-2/3 bg-emerald-400/40 dark:bg-emerald-600/40 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
          </div>

          <div className="relative z-10 flex-1 flex flex-col h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSubTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex-1 flex flex-col justify-between h-full overflow-hidden"
              >
                {activeSubTab === "chat" && (
                  <ChatTab
                    onNavigateToTab={handleNavigateToTab}
                    bio={bio}
                    historyLogs={historyLogs}
                    onUpdateCompanionState={handleUpdateCompanionState}
                    chatMessages={chatMessages}
                    presetTest={presetTest}
                    setPresetTest={setPresetTest}
                    showToast={showToast}
                    healingActive={healingActive}
                    onProfileUpdate={(newFields) => {
                      if (setFormData && handleSave) {
                        setFormData(prev => {
                          const updated = { ...prev, ...newFields };
                          setTimeout(() => handleSave({ preventDefault: () => {} }, updated), 0);
                          return updated;
                        });
                      }
                    }}
                  />
                )}

                {activeSubTab === "therapy" && (
                  <TherapyTab
                    onNavigateToTab={handleNavigateToTab}
                    bio={bio}
                    historyLogs={historyLogs}
                    onUpdateCompanionState={handleUpdateCompanionState}
                    healingActive={healingActive}
                    showToast={showToast}
                  />
                )}

                {activeSubTab === "sleep" && (
                  <div className="flex-1 overflow-y-auto p-4">
                    <SleepTracker bio={bio} />
                  </div>
                )}

                {activeSubTab === "evaluation" && (
                  <EvaluationTab
                    onNavigateToTab={handleNavigateToTab}
                    bio={bio}
                    historyLogs={historyLogs}
                    showToast={showToast}
                  />
                )}

                {activeSubTab === "profile" && (
                  <ProfileTab
                    historyLogs={historyLogs}
                    bio={bio}
                    onNavigateToTab={handleNavigateToTab}
                    showToast={showToast}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Adaptation success popup */}
      <AnimatePresence>
        {adaptationAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-emerald-500/10 via-[#12111a] to-teal-500/15 backdrop-blur-2xl rounded-xl border border-emerald-500/30 p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
              
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-450">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-black text-emerald-450 uppercase tracking-widest">Tiến Triển Tinh Thần Tuyệt Vời</h4>
                <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-bold">Lộ trình đồng hành thích ứng</p>
              </div>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-lg space-y-2 text-left">
                <p className="text-[10.5px] text-zinc-350 leading-relaxed font-medium">
                  Hệ thống ghi nhận: <span className="text-emerald-450 font-bold">{adaptationAlert.improvement}</span>.
                </p>
                <p className="text-[10.5px] text-zinc-350 leading-relaxed font-medium">
                  Thời gian đồng hành được rút ngắn: <span className="text-emerald-450 font-black">-{adaptationAlert.reducedDays} ngày</span>
                </p>
                <div className="flex justify-between items-center pt-2 border-t border-emerald-500/10 text-[10px] font-bold text-zinc-500">
                  <span>Trước: {adaptationAlert.oldDuration} ngày</span>
                  <span className="text-emerald-450 font-black">Mới: {adaptationAlert.newDuration} ngày</span>
                </div>
              </div>

              <p className="text-[10.5px] text-zinc-400 italic">
                "Cậu đang làm rất tốt, hãy tiếp tục chăm sóc bản thân nhé!"
              </p>

              <button
                type="button"
                onClick={() => setAdaptationAlert(null)}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black uppercase tracking-wider rounded-md transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
              >
                Tuyệt vời, tiếp tục thôi!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal to stop companion healing mode */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-red-500/10 via-[#12111a] to-zinc-900/40 backdrop-blur-2xl rounded-xl border border-red-500/30 p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-orange-400 to-red-500" />
              
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500">
                <AlertTriangle className="w-8 h-8 animate-bounce" />
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-black text-red-500 uppercase tracking-widest">Xác Nhận Dừng Đồng Hành</h4>
                <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-bold">Thao tác này không thể hoàn tác</p>
              </div>

              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-lg text-left">
                <p className="text-[10.5px] text-zinc-300 leading-relaxed font-semibold">
                  Cậu có chắc chắn muốn dừng chế độ chăm sóc tinh thần? Toàn bộ nhật ký cảm xúc check-in và lịch sử trắc nghiệm lưu trữ sẽ bị xóa sạch vĩnh viễn bảo mật.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-black uppercase tracking-wider rounded-md transition-all"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={confirmCancelHealing}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-650 hover:to-orange-650 text-white text-xs font-black uppercase tracking-wider rounded-md transition-all shadow-lg shadow-red-500/10 active:scale-[0.98]"
                >
                  Xác nhận xóa
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
