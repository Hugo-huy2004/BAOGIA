import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Calendar, AlertCircle, Trash2, ShieldCheck, MessageSquare, Award, Wind, ScanLine, ClipboardList, AlertTriangle, ChevronDown, ChevronUp, Clock, Sparkles } from "lucide-react";
import SubUtilityHeader from "../SubUtilityHeader";
import ChatTab from "./ChatTab";
import TestTab from "./TestTab";
import UploadAnalyzer from "./UploadAnalyzer";
import BreathTab from "./BreathTab";

function CompanionDashboard({ duration, startDate, getProgressDay, onCancel, historyLogs }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentDay = getProgressDay();
  const progressPercent = Math.min(100, Math.round((currentDay / duration) * 100));

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
      case 5: return "☀️ Rất tốt";
      case 4: return "🌤️ Tốt";
      case 3: return "☁️ Bình thường";
      case 2: return "🌧️ Mỏi mệt";
      case 1: return "⛈️ Kiệt sức";
      default: return "☁️ Không xác định";
    }
  };

  const { anomalies, recommendation } = React.useMemo(() => {
    const anomaliesList = [];
    const checkins = historyLogs.filter(l => l.type === "checkin");
    const dassTests = historyLogs.filter(l => l.test === "dass42");
    const mmpiTests = historyLogs.filter(l => l.test === "mmpi30");
    const chatAnomalies = historyLogs.filter(l => l.type === "chat_anomaly");

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

    // 3. DASS clinical levels
    if (dassTests.length > 0) {
      const latest = dassTests[dassTests.length - 1];
      const elevated = [];
      if (["severe", "extremely_severe"].includes(latest.severities?.D)) elevated.push(`Trầm cảm (${latest.severities.D === "severe" ? "Nặng" : "Cực đoan"})`);
      if (["severe", "extremely_severe"].includes(latest.severities?.A)) elevated.push(`Lo âu (${latest.severities.A === "severe" ? "Nặng" : "Cực đoan"})`);
      if (["severe", "extremely_severe"].includes(latest.severities?.S)) elevated.push(`Căng thẳng (${latest.severities.S === "severe" ? "Nặng" : "Cực đoan"})`);
      
      if (elevated.length > 0) {
        anomaliesList.push({
          title: "Chỉ số lâm sàng DASS vượt ngưỡng",
          desc: `Bài kiểm tra DASS-42 ghi nhận tình trạng ${elevated.join(", ")}.`,
          severity: "high"
        });
      }
    }

    // 4. MMPI clinical scales
    if (mmpiTests.length > 0) {
      const latest = mmpiTests[mmpiTests.length - 1];
      const elevatedScales = latest.clinical ? latest.clinical.filter(c => c.score >= 65) : [];
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

    // 5. Chat anomalies
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
      rec = "Khuyến nghị: Chỉ số sức khỏe tinh thần của cậu đang có dấu hiệu bất ổn lâm sàng nghiêm trọng. Cậu nên giảm bớt cường độ bài vở, thực hành thở sâu 4-7-8 mỗi đêm và trò chuyện thường xuyên hơn với Trợ lý Bạn Học Đường. Nếu cảm xúc này kéo dài liên tục trên 2 tuần, hãy liên hệ trực tiếp với chuyên viên tư vấn tâm lý hoặc phòng y tế trường học để được hỗ trợ kịp thời nhé.";
    } else if (anomaliesList.length > 0) {
      rec = "Khuyến nghị: Hệ thống phát hiện một vài căng thẳng nhẹ và sự mất cân bằng trong sinh hoạt/học tập của cậu. Cậu hãy dành thêm thời gian nghỉ ngơi, ngủ đủ giấc và tiếp tục chia sẻ nỗi lòng cùng Trợ lý mỗi khi mệt mỏi nhé.";
    } else {
      rec = "Khuyến nghị: Cảm xúc và chỉ số sinh hoạt của cậu dạo gần đây cực kỳ tốt và cân bằng ổn định. Hãy tiếp tục duy trì năng lượng tích cực này, hít thở điều hòa và trò chuyện cùng Trợ lý khi cần nhé!";
    }

    return { anomalies: anomaliesList, recommendation: rec };
  }, [historyLogs]);

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-zinc-500/5 dark:from-emerald-550/15 dark:via-zinc-900/40 dark:to-zinc-950/20 backdrop-blur-xl rounded-3xl border border-emerald-500/20 dark:border-emerald-500/10 shadow-lg p-5 space-y-4 animate-scaleUp">
      {/* Journey details */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-250/50 dark:border-zinc-800/40 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider">Hành Trình Chăm Sóc Tinh Thần</h3>
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">
            Ngày {currentDay}/{duration} • Bắt đầu: {startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "Hôm nay"}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 hover:border-red-500 bg-red-500/5 hover:bg-red-500/15 text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Dừng lộ trình
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider pl-0.5">
          <span>Tiến trình hoàn thành</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden p-[2px]">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-550 rounded-full transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Abnormality and clinical analysis report */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <h4 className="text-[11px] font-black uppercase tracking-wider">Báo cáo đánh giá & Khuyến nghị</h4>
        </div>

        {/* List of anomalies */}
        {anomalies.length > 0 ? (
          <div className="space-y-2">
            {anomalies.map((anom, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl flex gap-3 items-start border ${
                  anom.severity === "high"
                    ? "bg-red-550/5 dark:bg-red-950/10 border-red-500/20 text-red-800 dark:text-red-300"
                    : "bg-amber-500/5 dark:bg-amber-955/10 border-amber-500/20 text-amber-800 dark:text-amber-300"
                }`}
              >
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${anom.severity === "high" ? "text-red-500" : "text-amber-500"}`} />
                <div className="space-y-0.5">
                  <h5 className="text-[10.5px] font-black uppercase tracking-wider leading-tight">{anom.title}</h5>
                  <p className="text-[10px] opacity-90 leading-relaxed font-semibold">{anom.desc}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex gap-3 items-center text-emerald-800 dark:text-emerald-350">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-wider">Chưa phát hiện biểu hiện bất thường nào. Tinh thần của cậu đang được bảo vệ rất tốt!</p>
          </div>
        )}

        {/* Recommendation box */}
        <div className="p-3.5 bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl flex gap-3 items-start">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
          <p className="text-[10.5px] text-zinc-650 dark:text-zinc-350 font-semibold leading-relaxed">
            {recommendation}
          </p>
        </div>
      </div>

      {/* History Timeline Panel (Expandable) */}
      <div className="border-t border-zinc-250/50 dark:border-zinc-800/40 pt-3">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-zinc-550 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors py-1"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span className="text-[10.5px] font-black uppercase tracking-wider">Lịch sử đồng hành chi tiết ({historyLogs.length} sự kiện)</span>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mt-3 animate-scaleUp"
            >
              <div className="max-h-60 overflow-y-auto space-y-3.5 pr-1 scrollbar-none pb-2 pl-1.5 border-l border-emerald-500/20 dark:border-emerald-500/10 ml-2">
                {[...historyLogs].reverse().map((log, idx) => {
                  let iconColor = "text-zinc-500 bg-zinc-100 dark:bg-zinc-800";
                  let eventTitle = "";
                  let eventDetails = "";
                  
                  if (log.type === "checkin") {
                    iconColor = "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20";
                    eventTitle = `Đánh giá cảm xúc: ${getMoodEmoji(log.mood)}`;
                    eventDetails = log.note ? `Nỗi lòng: "${log.note}"` : "";
                    if (log.wheelRatings) {
                      const cats = ["Bản thân", "Học tập", "Công việc", "Gia đình", "Mối quan hệ"];
                      const ratingsStr = log.wheelRatings.map((v, i) => `${cats[i]}: ${v}/10`).join(" • ");
                      eventDetails += (eventDetails ? "\n" : "") + `Bánh xe cuộc sống: ${ratingsStr}`;
                    }
                  } else if (log.test === "dass42") {
                    iconColor = "text-[#0071e3] bg-[#0071e3]/10 border border-[#0071e3]/20";
                    eventTitle = "Trắc nghiệm DASS-42 chuẩn lâm sàng";
                    eventDetails = `Depression: ${log.scores.D} (${log.severities.D}) • Anxiety: ${log.scores.A} (${log.severities.A}) • Stress: ${log.scores.S} (${log.severities.S})`;
                  } else if (log.test === "mmpi30") {
                    iconColor = "text-indigo-500 bg-indigo-500/10 border border-indigo-500/20";
                    eventTitle = "Khảo sát lâm sàng Mini-MMPI";
                    eventDetails = `Độ tin cậy: ${log.isReliable ? "Hợp lệ" : "Nghi ngờ"} • Các thang đo: ${log.clinical.map(c => `${c.code}: ${c.score}T`).join(" • ")}`;
                  } else if (log.type === "chat_anomaly") {
                    iconColor = "text-amber-500 bg-amber-500/10 border border-amber-500/20";
                    eventTitle = "Phát hiện bất ổn tâm trạng qua cuộc chat";
                    eventDetails = `Tin nhắn: "${log.text}"\nTừ khóa bất thường: ${log.triggers.join(", ")}`;
                  }

                  return (
                    <div key={idx} className="relative flex gap-3 pl-4">
                      {/* Timeline dot */}
                      <div className="absolute -left-[9.5px] top-1.5 w-4.5 h-4.5 rounded-full bg-emerald-500 border-4 border-white dark:border-[#12111a]" />
                      
                      <div className="flex-1 space-y-1 bg-white/30 dark:bg-zinc-900/25 p-3 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/20 shadow-sm">
                        <div className="flex justify-between items-center text-[8.5px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider pl-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-500/60" />
                            {formatDateTime(log.date)}
                          </span>
                          {log.day && <span>Ngày {log.day}</span>}
                        </div>
                        <h5 className="text-[10.5px] font-black text-zinc-800 dark:text-zinc-150 leading-snug">{eventTitle}</h5>
                        {eventDetails && (
                          <p className="text-[9.5px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-semibold whitespace-pre-wrap mt-0.5">
                            {eventDetails}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function BanhocduongTab({ onBack, defaultSubTab = "chat", defaultPresetTest = null, bio }) {
  const [activeSubTab, setActiveSubTab] = useState(defaultSubTab); // 'chat', 'tests', 'upload', 'breath'
  const [presetTest, setPresetTest] = useState(defaultPresetTest); // 'dass' | 'mmpi' | null

  // Healing Companion Journey States
  const [healingActive, setHealingActive] = useState(() => {
    return localStorage.getItem("banhocduong_healing_mode") === "active";
  });
  const [healingDuration, setHealingDuration] = useState(() => {
    return parseInt(localStorage.getItem("banhocduong_healing_duration") || "30", 10);
  });
  const [healingStartDate, setHealingStartDate] = useState(() => {
    return localStorage.getItem("banhocduong_healing_start_date") || "";
  });

  const [historyLogs, setHistoryLogs] = useState([]);

  // Recommendation info state
  const [recommendation, setRecommendation] = useState({ days: 20, name: "Hành trình Vun đắp Bình yên", reason: "", hasData: false });

  const loadHistory = () => {
    try {
      const raw = localStorage.getItem("banhocduong_history");
      setHistoryLogs(raw ? JSON.parse(raw) : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (defaultSubTab) {
      setActiveSubTab(defaultSubTab);
    }
    if (defaultPresetTest) {
      setPresetTest(defaultPresetTest);
    }
  }, [defaultSubTab, defaultPresetTest]);

  useEffect(() => {
    loadHistory();
  }, [activeSubTab, healingActive]);

  const handleSubTabChange = (tabId) => {
    setActiveSubTab(tabId);
    setPresetTest(null);
  };

  const handleNavigateToTab = (tabId, preset = null) => {
    setActiveSubTab(tabId);
    setPresetTest(preset);
  };

  // Recalculate adaptive journey duration based on history logs
  const calculateRecommendation = () => {
    try {
      const rawHistory = localStorage.getItem("banhocduong_history");
      const history = rawHistory ? JSON.parse(rawHistory) : [];
      
      const dassLogs = history.filter(h => h.test === "dass42");
      const mmpiLogs = history.filter(h => h.test === "mmpi30");
      const chatLogsCount = parseInt(localStorage.getItem("banhocduong_chat_distress_count") || "0", 10);

      let maxSeverity = "normal";
      let reason = "Hệ thống chưa ghi nhận chỉ số bất ổn nào. Lộ trình tối ưu cho cậu là 20 ngày chăm sóc bản thân nhẹ nhàng.";
      let hasData = dassLogs.length > 0 || mmpiLogs.length > 0 || chatLogsCount > 0;

      if (dassLogs.length > 0) {
        const latest = dassLogs[dassLogs.length - 1];
        const scores = latest.scores;
        const maxScore = Math.max(scores.D, scores.A, scores.S);

        const isExtremelySevere = scores.D >= 28 || scores.A >= 20 || scores.S >= 34;
        const isSevere = scores.D >= 21 || scores.A >= 15 || scores.S >= 26;
        const isModerate = scores.D >= 14 || scores.A >= 10 || scores.S >= 19;

        if (isExtremelySevere) {
          maxSeverity = "extremely_severe";
          reason = `Kết quả trắc nghiệm DASS-42 ngày ${new Date(latest.date).toLocaleDateString()} ghi nhận chỉ số trầm cảm/lo âu ở mức Cực kỳ nghiêm trọng.`;
        } else if (isSevere) {
          maxSeverity = "severe";
          reason = `Kết quả trắc nghiệm DASS-42 ngày ${new Date(latest.date).toLocaleDateString()} ghi nhận chỉ số ở mức Nặng.`;
        } else if (isModerate) {
          maxSeverity = "moderate";
          reason = `Kết quả trắc nghiệm DASS-42 ngày ${new Date(latest.date).toLocaleDateString()} ghi nhận các căng thẳng ở mức Vừa phải.`;
        } else {
          maxSeverity = "normal";
          reason = `Kết quả trắc nghiệm DASS-42 gần nhất ghi nhận các chỉ số tâm trạng ở mức Bình thường.`;
        }
      }

      // Check MMPI clinical scales
      if (mmpiLogs.length > 0 && maxSeverity !== "extremely_severe") {
        const latest = mmpiLogs[mmpiLogs.length - 1];
        const elevatedCount = latest.clinical.filter(c => c.score >= 65).length;
        if (elevatedCount >= 5) {
          maxSeverity = "extremely_severe";
          reason = `Bản đồ MMPI ngày ${new Date(latest.date).toLocaleDateString()} phát hiện ${elevatedCount} thang đo nhân cách tăng cao cảnh báo lâm sàng.`;
        } else if (elevatedCount >= 3) {
          if (maxSeverity === "normal" || maxSeverity === "moderate") {
            maxSeverity = "severe";
            reason = `Bản đồ MMPI phát hiện ${elevatedCount} khía cạnh hành vi nhạy cảm tăng cao.`;
          }
        } else if (elevatedCount >= 1) {
          if (maxSeverity === "normal") {
            maxSeverity = "moderate";
            reason = `Bản đồ MMPI ghi nhận một số xu hướng hành vi nhạy cảm nhẹ.`;
          }
        }
      }

      // Check chat logs
      if (dassLogs.length === 0 && mmpiLogs.length === 0 && chatLogsCount > 0) {
        if (chatLogsCount >= 5) {
          maxSeverity = "severe";
          reason = "Bạn Học Đường ghi nhận nhiều tần suất từ khóa căng thẳng thần kinh trong hội thoại.";
        } else if (chatLogsCount >= 2) {
          maxSeverity = "moderate";
          reason = "Cậu đã chia sẻ một vài mệt mỏi, deadline hoặc áp lực học tập trong tin nhắn.";
        }
      }

      let days = 20;
      let name = "Hành trình Vun đắp Bình yên";

      if (maxSeverity === "extremely_severe") {
        days = 90;
        name = "Hành trình Đồng hành Chuyên sâu (Intensive Companion)";
      } else if (maxSeverity === "severe") {
        days = 50;
        name = "Hành trình Phục hồi Thấu cảm (Compassionate Recovery)";
      } else if (maxSeverity === "moderate") {
        days = 30;
        name = "Hành trình Tái tạo Cân bằng (Balance Program)";
      }

      setRecommendation({ days, name, reason, hasData });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    calculateRecommendation();
  }, [healingActive]);

  // Calculate day count
  const getProgressDay = () => {
    if (!healingStartDate) return 1;
    const start = new Date(healingStartDate).getTime();
    const now = new Date().getTime();
    const diffTime = Math.max(0, now - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleActivateHealing = (duration) => {
    localStorage.setItem("banhocduong_healing_mode", "active");
    localStorage.setItem("banhocduong_healing_duration", duration.toString());
    localStorage.setItem("banhocduong_healing_start_date", new Date().toISOString());
    localStorage.setItem("banhocduong_last_checkin_date", "");
    
    if (!localStorage.getItem("banhocduong_history")) {
      localStorage.setItem("banhocduong_history", JSON.stringify([]));
    }

    setHealingActive(true);
    setHealingDuration(duration);
    setHealingStartDate(new Date().toISOString());
  };

  const handleCancelHealing = () => {
    if (window.confirm("Cậu có chắc chắn muốn dừng chế độ chăm sóc tinh thần? Toàn bộ nhật ký cảm xúc check-in và lịch sử trắc nghiệm lưu trữ sẽ bị xóa sạch vĩnh viễn bảo mật.")) {
      localStorage.removeItem("banhocduong_healing_mode");
      localStorage.removeItem("banhocduong_healing_duration");
      localStorage.removeItem("banhocduong_healing_start_date");
      localStorage.removeItem("banhocduong_last_checkin_date");
      localStorage.removeItem("banhocduong_history");
      localStorage.removeItem("banhocduong_last_test_date");
      localStorage.removeItem("banhocduong_chat_distress_count");
      
      setHealingActive(false);
      setHealingDuration(30);
      setHealingStartDate("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-0 space-y-6 animate-fadeIn pb-12">
      {/* Sub Utility Header */}
      <SubUtilityHeader
        title="Bạn Học Đường"
        icon="psychology"
        colorClass="text-emerald-500 animate-pulse"
        onBack={onBack}
      />

      {/* Companion Dashboard Card rendered above subtabs when active */}
      {healingActive && (
        <CompanionDashboard
          duration={healingDuration}
          startDate={healingStartDate}
          getProgressDay={getProgressDay}
          onCancel={handleCancelHealing}
          historyLogs={historyLogs}
        />
      )}

      {/* Segmented subtab headers */}
      <div className="flex items-center justify-start md:justify-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none p-[4px] rounded-2xl bg-zinc-150/60 dark:bg-zinc-900/65 border border-zinc-250/30 dark:border-zinc-800/50 max-w-3xl mx-auto w-full">
        {[
          { id: "chat", label: "Tâm Sự", icon: MessageSquare },
          { id: "tests", label: "Trắc Nghiệm", icon: ClipboardList },
          { id: "upload", label: "Quét Kết Quả", icon: ScanLine },
          { id: "breath", label: "Hít Thở 4-7-8", icon: Wind },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSubTabChange(tab.id)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 shrink-0 ${
                isActive
                  ? "bg-white dark:bg-zinc-800 text-[#0071e3] dark:text-emerald-400 shadow-md scale-[1.02]"
                  : "text-zinc-550 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white/30 dark:hover:bg-white/5"
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main tab wrapper */}
      <div className="bg-white/70 dark:bg-[#12111a]/70 backdrop-blur-2xl rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-xl overflow-hidden min-h-[500px] flex flex-col justify-between transition-all">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex-1 flex flex-col justify-between"
          >
            {activeSubTab === "chat" && (
              <ChatTab onNavigateToTab={handleNavigateToTab} />
            )}
            
            {activeSubTab === "tests" && (
              <TestTab presetTest={presetTest} bio={bio} onNavigateToTab={handleNavigateToTab} />
            )}

            {activeSubTab === "upload" && (
              <UploadAnalyzer />
            )}

            {activeSubTab === "breath" && (
              <BreathTab />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
