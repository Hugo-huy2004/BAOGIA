import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle, Clock, Calendar, TrendingDown, Activity,
  User, Phone, Mail, Calendar as CalendarIcon,
  TrendingUp, Sparkles, ShieldCheck, ChevronDown, ChevronUp
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import RadarChart from "./charts/RadarChart";
import LineChart from "./charts/LineChart";

export default function EvaluationTab({ historyLogs: rawHistoryLogs, bio, onNavigateToTab, showToast }) {
  const { t } = useTranslation();
  const historyLogs = Array.isArray(rawHistoryLogs) ? rawHistoryLogs : [];
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [showPersonalDetails, setShowPersonalDetails] = useState(false);

  const formatDateTime = (isoString) => {
    try {
      const d = new Date(isoString);
      const pad = (n) => n.toString().padStart(2, "0");
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
      return t("companion.evaluation.notSet", "Không xác định");
    }
  };

  const dassTests = historyLogs.filter(l => l.test === "dass42");
  const mmpiTests = historyLogs.filter(l => l.test === "mmpi30");
  const phq9Tests = historyLogs.filter(l => l.test === "phq9");
  const gad7Tests  = historyLogs.filter(l => l.test === "gad7");
  const who5Tests  = historyLogs.filter(l => l.test === "who5");
  const checkins   = historyLogs.filter(l => l.type === "checkin");

  const totalTestsCount = dassTests.length + mmpiTests.length + phq9Tests.length + gad7Tests.length + who5Tests.length;

  // ── Anomaly detection (copied verbatim from original EvaluationTab) ──────────
  const getMedicalEvaluation = useMemo(() => {
    const anomaliesList = [];
    const chatAnomalies    = historyLogs.filter(l => l.type === "anomaly_detected");
    const checkinLogs      = historyLogs.filter(l => l.type === "checkin");
    const dassLogs         = historyLogs.filter(l => l.test === "dass42");
    const mmpiLogs         = historyLogs.filter(l => l.test === "mmpi30");
    const phq9Logs         = historyLogs.filter(l => l.test === "phq9");
    const uploadAnomalies  = historyLogs.filter(l => l.type === "upload_error");

    const lowMoods = checkinLogs.filter(c => c.mood <= 2);
    if (lowMoods.length >= 3) {
      anomaliesList.push({
        title: t("companion.profile.lowMoodTitle", "Tâm trạng suy giảm kéo dài"),
        desc: t("companion.profile.lowMoodDesc", { count: lowMoods.length }),
        severity: "medium"
      });
    }

    const lateNightEvents = historyLogs.filter(l => {
      if (!l.date) return false;
      const d = new Date(l.date);
      const hours = d.getHours();
      return hours >= 23 || hours < 5;
    });
    if (lateNightEvents.length >= 4) {
      anomaliesList.push({
        title: t("companion.evaluation.lateNightTitle", "Hoạt động khuya thường xuyên"),
        desc: t("companion.evaluation.lateNightDesc", { count: lateNightEvents.length }),
        severity: "low"
      });
    }

    if (phq9Logs.length > 0) {
      const latest = phq9Logs[phq9Logs.length - 1];
      if (latest.score >= 15) {
        anomaliesList.push({
          title: t("companion.profile.phq9AlertTitle", "Chỉ số Trầm cảm PHQ-9 cảnh báo"),
          desc: t("companion.profile.phq9AlertDesc", { score: latest.score }),
          severity: "high"
        });
      }
    }

    const unreliableMmpis = mmpiLogs.filter(m => m.isReliable === false);
    if (unreliableMmpis.length > 0) {
      anomaliesList.push({
        title: t("companion.evaluation.mmpiLowReliabilityTitle", "Kiểm định MMPI tin cậy thấp"),
        desc: t("companion.evaluation.mmpiLowReliabilityDesc", { count: unreliableMmpis.length }),
        severity: "medium"
      });
    }

    if (uploadAnomalies.length > 0) {
      anomaliesList.push({
        title: t("companion.evaluation.uploadErrorTitle", "Lỗi tải báo cáo sức khỏe"),
        desc: t("companion.evaluation.uploadErrorDesc", { count: uploadAnomalies.length }),
        severity: "medium"
      });
    }

    if (dassLogs.length > 0) {
      const latest = dassLogs[dassLogs.length - 1];
      const elevated = [];
      if (latest.severities) {
        if (["severe", "extremely_severe"].includes(latest.severities.D)) {
          elevated.push(`${t("companion.profile.dassDepression", "Trầm cảm")} (${latest.severities.D === "severe" ? t("companion.profile.severe", "Nặng") : t("companion.profile.extremelySevere", "Cực đoan")})`);
        }
        if (["severe", "extremely_severe"].includes(latest.severities.A)) {
          elevated.push(`${t("companion.profile.dassAnxiety", "Lo âu")} (${latest.severities.A === "severe" ? t("companion.profile.severe", "Nặng") : t("companion.profile.extremelySevere", "Cực đoan")})`);
        }
        if (["severe", "extremely_severe"].includes(latest.severities.S)) {
          elevated.push(`${t("companion.profile.dassStress", "Căng thẳng")} (${latest.severities.S === "severe" ? t("companion.profile.severe", "Nặng") : t("companion.profile.extremelySevere", "Cực đoan")})`);
        }
      }
      if (elevated.length > 0) {
        anomaliesList.push({
          title: t("companion.profile.dassAlertTitle", "Chỉ số lâm sàng DASS vượt ngưỡng"),
          desc: t("companion.profile.dassAlertDesc", { elevated: elevated.join(", ") }),
          severity: "high"
        });
      }
    }

    if (mmpiLogs.length > 0) {
      const latest = mmpiLogs[mmpiLogs.length - 1];
      const elevatedScales = latest.clinical ? latest.clinical.filter(c => c.score >= 70) : [];
      if (elevatedScales.length > 0) {
        const scaleNames = {
          Hs: t("companion.evaluation.scaleNames.Hs", "Nghi bệnh"),
          D: t("companion.evaluation.scaleNames.D", "Trầm cảm"),
          Hy: t("companion.evaluation.scaleNames.Hy", "Hysteria"),
          Pd: t("companion.evaluation.scaleNames.Pd", "Sai lệch nhân cách"),
          Mf: t("companion.evaluation.scaleNames.Mf", "Nam/Nữ tính"),
          Pa: t("companion.evaluation.scaleNames.Pa", "Hoang tưởng"),
          Pt: t("companion.evaluation.scaleNames.Pt", "Suy nhược tâm thần"),
          Sc: t("companion.evaluation.scaleNames.Sc", "Tâm thần phân liệt"),
          Ma: t("companion.evaluation.scaleNames.Ma", "Hưng cảm nhẹ"),
          Si: t("companion.evaluation.scaleNames.Si", "Hướng ngoại xã hội")
        };
        const list = elevatedScales.map(s => `${scaleNames[s.code] || s.code} (${s.score} T-score)`);
        anomaliesList.push({
          title: t("companion.profile.mmpiAlertTitle", "Xu hướng hành vi MMPI vượt ngưỡng"),
          desc: t("companion.profile.mmpiAlertDesc", { list: list.join(", ") }),
          severity: "high"
        });
      }
    }

    if (chatAnomalies.length > 0) {
      const lastAnomaly = chatAnomalies[chatAnomalies.length - 1];
      anomaliesList.push({
        title: t("companion.profile.chatAlertTitle", "Dấu hiệu bất ổn trong hội thoại"),
        desc: t("companion.evaluation.chatAlertDesc", { text: lastAnomaly.text, triggers: lastAnomaly.triggers ? lastAnomaly.triggers.join(", ") : "stress" }),
        severity: "medium"
      });
    }

    let rec = "";
    if (anomaliesList.some(a => a.severity === "high")) {
      rec = t("companion.evaluation.recHigh", "Chỉ số sức khỏe tinh thần của cậu đang có dấu hiệu bất ổn lâm sàng nghiêm trọng. Tớ khuyến nghị cậu nên giảm bớt cường độ bài vở/công việc, thực hành thở sâu 4-7-8 mỗi đêm và trò chuyện thường xuyên hơn với tớ. Nếu cảm xúc này kéo dài liên tục trên 2 tuần, hãy liên hệ trực tiếp với chuyên viên tư vấn tâm lý hoặc phòng y tế để được hỗ trợ kịp thời nhé.");
    } else if (anomaliesList.length > 0) {
      rec = t("companion.evaluation.recMedium", "Tớ nhận thấy một vài căng thẳng nhẹ và sự mất cân bằng trong sinh hoạt của cậu. Cậu hãy dành thêm thời gian nghỉ ngơi, ngủ đủ giấc và tiếp tục chia sẻ nỗi lòng cùng tớ mỗi khi mệt mỏi nhé.");
    } else {
      rec = t("companion.evaluation.recNormal", "Cảm xúc và chỉ số sinh hoạt của cậu dạo gần đây cực kỳ tốt và cân bằng ổn định. Hãy tiếp tục duy trì năng lượng tích cực này, hít thở điều hòa và trò chuyện cùng tớ khi cần nhé!");
    }

    return { anomalies: anomaliesList, recommendation: rec };
  }, [historyLogs]);

  const { anomalies, recommendation } = getMedicalEvaluation;

  // ── Metrics dashboard helpers ─────────────────────────────────────────────────
  const getSeverityLabel = (level) => {
    const map = {
      normal:           { label: t("companion.evaluation.severities.normal", "Bình thường"), cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
      mild:             { label: t("companion.evaluation.severities.mild", "Nhẹ"),         cls: "bg-yellow-400/15 text-yellow-700 dark:text-yellow-400" },
      moderate:         { label: t("companion.evaluation.severities.moderate", "Vừa"),         cls: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
      severe:           { label: t("companion.evaluation.severities.severe", "Nặng"),        cls: "bg-red-500/10 text-red-600 dark:text-red-400" },
      extremely_severe: { label: t("companion.evaluation.severities.extremely_severe", "Cực đoan"),    cls: "bg-red-700/15 text-red-700 dark:text-red-300" },
      no_data:          { label: "–",           cls: "bg-zinc-100 dark:bg-zinc-800 text-zinc-400" },
    };
    return map[level] || map.no_data;
  };

  const phq9Severity = (score) => {
    if (score == null) return "no_data";
    if (score <= 4)  return "normal";
    if (score <= 9)  return "mild";
    if (score <= 14) return "moderate";
    if (score <= 19) return "severe";
    return "extremely_severe";
  };
  const gad7Severity = (score) => {
    if (score == null) return "no_data";
    if (score <= 4)  return "normal";
    if (score <= 9)  return "mild";
    if (score <= 14) return "moderate";
    return "severe";
  };
  const who5Severity = (score) => {
    if (score == null) return "no_data";
    return score >= 13 ? "normal" : score >= 9 ? "mild" : score >= 5 ? "moderate" : "severe";
  };
  const dassSeverity = (score, type) => {
    if (score == null) return "no_data";
    const thresholds = {
      D: [0, 9,  13, 20, 27],
      A: [0, 7,  9,  14, 19],
      S: [0, 14, 18, 25, 33],
    };
    const t = thresholds[type];
    if (!t) return "no_data";
    if (score <= t[1]) return "normal";
    if (score <= t[2]) return "mild";
    if (score <= t[3]) return "moderate";
    if (score <= t[4]) return "severe";
    return "extremely_severe";
  };

  const latestPhq9  = phq9Tests.length  > 0 ? phq9Tests[phq9Tests.length - 1]   : null;
  const latestGad7  = gad7Tests.length  > 0 ? gad7Tests[gad7Tests.length - 1]   : null;
  const latestWho5  = who5Tests.length  > 0 ? who5Tests[who5Tests.length - 1]   : null;
  const latestDass  = dassTests.length  > 0 ? dassTests[dassTests.length - 1]   : null;
  const latestMmpi  = mmpiTests.length  > 0 ? mmpiTests[mmpiTests.length - 1]   : null;
  const prevPhq9    = phq9Tests.length  > 1 ? phq9Tests[phq9Tests.length - 2]   : null;
  const prevDassD   = dassTests.length  > 1 ? dassTests[dassTests.length - 2]   : null;

  const deltaBadge = (curr, prev) => {
    if (curr == null || prev == null) return null;
    const d = curr - prev;
    if (d === 0) return <span className="ml-1 text-[9px] font-black text-zinc-400">±0</span>;
    const pos = d > 0;
    return (
      <span className={`ml-1 text-[9px] font-black ${pos ? "text-red-500" : "text-emerald-500"}`}>
        {pos ? `+${d}` : d}
      </span>
    );
  };

  const metricsRows = [
    {
      name: "PHQ-9",
      date: latestPhq9?.date,
      score: latestPhq9 ? `${latestPhq9.score}/27` : null,
      range: "0–4",
      severity: phq9Severity(latestPhq9?.score),
      delta: deltaBadge(latestPhq9?.score, prevPhq9?.score),
    },
    {
      name: "GAD-7",
      date: latestGad7?.date,
      score: latestGad7 ? `${latestGad7.score}/21` : null,
      range: "0–4",
      severity: gad7Severity(latestGad7?.score),
      delta: null,
    },
    {
      name: "WHO-5",
      date: latestWho5?.date,
      score: latestWho5 ? `${latestWho5.score}/25` : null,
      range: "≥13",
      severity: who5Severity(latestWho5?.score),
      delta: null,
    },
    {
      name: "DASS-D",
      date: latestDass?.date,
      score: latestDass ? `${latestDass.scores?.D ?? "–"}/42` : null,
      range: "0–9",
      severity: dassSeverity(latestDass?.scores?.D, "D"),
      delta: deltaBadge(latestDass?.scores?.D, prevDassD?.scores?.D),
    },
    {
      name: "DASS-A",
      date: latestDass?.date,
      score: latestDass ? `${latestDass.scores?.A ?? "–"}/42` : null,
      range: "0–7",
      severity: dassSeverity(latestDass?.scores?.A, "A"),
      delta: null,
    },
    {
      name: "DASS-S",
      date: latestDass?.date,
      score: latestDass ? `${latestDass.scores?.S ?? "–"}/42` : null,
      range: "0–14",
      severity: dassSeverity(latestDass?.scores?.S, "S"),
      delta: null,
    },
    {
      name: "Mini-MMPI",
      date: latestMmpi?.date,
      score: latestMmpi ? `${latestMmpi.clinical ? latestMmpi.clinical.filter(c => c.score >= 70).length : 0} ${t("companion.evaluation.scales", "thang")}` : null,
      range: "0–1",
      severity: latestMmpi
        ? (latestMmpi.clinical && latestMmpi.clinical.filter(c => c.score >= 70).length > 2 ? "moderate" : "normal")
        : "no_data",
      delta: null,
    },
  ];

  // Days active
  const daysActive = useMemo(() => {
    if (historyLogs.length === 0) return 0;
    const dates = new Set(historyLogs.map(l => l.date ? new Date(l.date).toDateString() : null).filter(Boolean));
    return dates.size;
  }, [historyLogs]);

  return (
    <div className="p-4 sm:p-6 space-y-6 text-left animate-fadeIn bg-transparent pb-20">

      {/* ── Mobile Compact Header ────────────────────────────────────────────── */}
      <div className="lg:hidden flex items-center gap-3.5 p-4 rounded-2xl border bg-white/60 dark:bg-[#1a1924]/60 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md overflow-hidden border-2 border-white dark:border-zinc-800">
          {bio?.avatarUrl ? (
            <img src={bio.avatarUrl} alt={bio.displayName || bio.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-black text-sm">
              {(bio?.displayName || bio?.name || "?").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-white leading-tight">{bio?.displayName || bio?.name || t("companion.profile.notSet", "Chưa cập nhật")}</h3>
          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">{bio?.school || bio?.org || t("companion.evaluation.orgFallback", "Trường / Tổ chức")}</p>
        </div>
      </div>

      {/* ── SECTION 1: Profile + Summary ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Desktop-only Bio card */}
        <div className="hidden lg:flex col-span-1 p-5 rounded-2xl border bg-white/60 dark:bg-[#1a1924]/60 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
            <User className="w-5 h-5 text-indigo-500" />
            <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">{t("companion.profile.title", "Thông Tin Cá Nhân")}</h4>
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
              {bio?.avatarUrl ? (
                <img src={bio.avatarUrl} alt={bio.displayName || bio.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-sm">
                  {(bio?.displayName || bio?.name || "?").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-black text-zinc-900 dark:text-white leading-tight">{bio?.displayName || bio?.name || t("companion.profile.notSet", "Chưa cập nhật")}</p>
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">{bio?.school || bio?.org || t("companion.evaluation.orgFallback", "Trường / Tổ chức")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50">
              <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 truncate">{bio?.email || "–"}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50">
                <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{bio?.phone || "–"}</p>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50">
                <CalendarIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{bio?.dob || "–"}</p>
              </div>
            </div>
          </div>

          {(!bio?.phone || !bio?.dob) && (
            <p className="text-[9px] font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 mt-auto">
              {t("companion.profile.missingInfo", "* Một số thông tin còn thiếu. Hãy trò chuyện với AI để cập nhật thêm.")}
            </p>
          )}
        </div>

        {/* AI Recommendations, Alerts + Stats Grid */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-4">
          
          {/* AI Center: Recommendation & Clinical Alerts */}
          <div className="p-5 rounded-2xl border bg-white/60 dark:bg-[#1a1924]/60 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">{t("companion.profile.clinicalAlerts", "AI Nhận Định & Cảnh Báo Sức Khỏe")}</h4>
              </div>
              {anomalies.length > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse">
                  {t("companion.evaluation.anomaliesCount", { count: anomalies.length })}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {t("companion.evaluation.stableTitle", "Hoàn thành ổn định")}
                </span>
              )}
            </div>

            {/* Sparkles Recommendation Box */}
            <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-xl flex gap-3 items-start">
              <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-0.5">
                <h5 className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{t("companion.evaluation.aiAdvice", "Lời khuyên của AI Đồng Hành")}</h5>
                <p className="text-[11px] text-zinc-700 dark:text-zinc-350 font-bold leading-relaxed">{recommendation}</p>
              </div>
            </div>

            {/* Anomalies List (if any) */}
            {anomalies.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {anomalies.map((a, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border shadow-sm space-y-1 flex gap-2.5 items-start ${
                      a.severity === "high"
                        ? "border-red-500/30 bg-red-500/10 text-red-850 dark:text-red-300"
                        : a.severity === "low"
                        ? "border-zinc-300/30 bg-zinc-50/50 dark:bg-zinc-900/25 text-zinc-600 dark:text-zinc-400"
                        : "border-amber-500/20 bg-amber-500/5 text-amber-850 dark:text-amber-300"
                    }`}
                  >
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                      a.severity === "high" ? "text-red-500 animate-pulse" : "text-amber-500"
                    }`} />
                    <div>
                      <span className="text-[9.5px] font-black uppercase tracking-wider block">
                        {a.title}
                      </span>
                      <p className="text-[9.5px] opacity-90 leading-relaxed font-semibold mt-0.5">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Summary Grid */}
          <div className="p-5 rounded-2xl border bg-white/60 dark:bg-[#1a1924]/60 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
              <Activity className="w-5 h-5 text-emerald-500" />
              <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">{t("companion.profile.statsTitle", "Thống Kê Tổng Quan")}</h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/50 rounded-xl flex flex-col items-center justify-center border border-transparent hover:border-indigo-500/20 transition-all">
                <p className="text-3xl font-black text-indigo-500">{totalTestsCount}</p>
                <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mt-1">{t("companion.profile.statsTests", "Bài test")}</p>
              </div>
              <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/50 rounded-xl flex flex-col items-center justify-center border border-transparent hover:border-emerald-500/20 transition-all">
                <p className="text-3xl font-black text-emerald-500">{checkins.length}</p>
                <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mt-1">{t("companion.profile.statsCheckins", "Check-in")}</p>
              </div>
              <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/50 rounded-xl flex flex-col items-center justify-center border border-transparent hover:border-rose-500/20 transition-all">
                <p className="text-3xl font-black text-rose-500">{anomalies.length}</p>
                <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mt-1">{t("companion.profile.statsAnomalies", "Cảnh báo")}</p>
              </div>
              <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/50 rounded-xl flex flex-col items-center justify-center border border-transparent hover:border-amber-500/20 transition-all">
                <p className="text-3xl font-black text-amber-500">{daysActive}</p>
                <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 mt-1">{t("companion.evaluation.activeDays", "Ngày sử dụng")}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Charts (RadarChart + LineChart) ───────────────────────────────────── */}
      {totalTestsCount > 0 && (
        <div className="p-5 rounded-xl border bg-white dark:bg-[#1a1924] border-zinc-200/50 dark:border-zinc-800/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">{t("companion.profile.deepAnalysis", "Phân Tích Chuyên Sâu")}</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl p-4 bg-white/50 dark:bg-black/20 flex flex-col">
              <h5 className="text-[9px] font-black text-zinc-500 uppercase tracking-wider text-center mb-3">{t("companion.profile.wheelTitle", "Chỉ số Bánh Xe Cuộc Sống")}</h5>
              <div className="flex-1 min-h-[170px]">
                <RadarChart scores={latestDass?.scores} />
              </div>
            </div>
            <div className="border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl p-4 bg-white/50 dark:bg-black/20 flex flex-col">
              <h5 className="text-[9px] font-black text-zinc-500 uppercase tracking-wider text-center mb-3">{t("companion.profile.emotionTitle", "Biến thiên Cảm xúc")}</h5>
              <div className="flex-1 min-h-[170px]">
                <LineChart 
                  data={historyLogs.filter(l => l.type === "checkin").map(c => ({ value: c.mood }))} 
                  maxScore={5} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2: Metrics Dashboard ─────────────────────────────────────── */}
      <div className="p-5 rounded-xl border bg-white dark:bg-[#1a1924] border-zinc-200/50 dark:border-zinc-800/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
          <ShieldCheck className="w-5 h-5 text-blue-500" />
          <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">{t("companion.evaluation.tableTitle", "Bảng Chỉ Số Sức Khỏe Tâm Thần")}</h4>
        </div>

        {/* Desktop Dashboard Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[10.5px] border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[8.5px] font-black uppercase text-zinc-400 tracking-wider text-left">
                <th className="py-2.5 pr-3 whitespace-nowrap">{t("companion.profile.statsTests", "Test")}</th>
                <th className="py-2.5 pr-3 whitespace-nowrap">{t("companion.evaluation.tableColRecent", "Lần gần nhất")}</th>
                <th className="py-2.5 pr-3 whitespace-nowrap">{t("companion.evaluation.tableColScore", "Điểm")}</th>
                <th className="py-2.5 pr-3 whitespace-nowrap">{t("companion.evaluation.tableColNormal", "Ngưỡng bình thường")}</th>
                <th className="py-2.5 pr-3 whitespace-nowrap">{t("companion.evaluation.tableColAlert", "Mức độ")}</th>
                <th className="py-2.5 whitespace-nowrap">{t("companion.tab.progress", "Tiến trình")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 font-bold">
              {metricsRows.map((row, idx) => {
                const { label, cls } = getSeverityLabel(row.severity);
                return (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                    <td className="py-3 pr-3 font-black text-zinc-800 dark:text-zinc-200 whitespace-nowrap">{row.name}</td>
                    <td className="py-3 pr-3 text-zinc-400 whitespace-nowrap">
                      {row.date ? formatDateTime(row.date) : <span className="text-zinc-300 dark:text-zinc-600">–</span>}
                    </td>
                    <td className="py-3 pr-3 text-zinc-800 dark:text-zinc-100 whitespace-nowrap">
                      {row.score ?? <span className="text-zinc-300 dark:text-zinc-600">–</span>}
                    </td>
                    <td className="py-3 pr-3 text-zinc-400 whitespace-nowrap">{row.range}</td>
                    <td className="py-3 pr-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${cls}`}>{label}</span>
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      {row.delta ?? <span className="text-zinc-300 dark:text-zinc-600 text-[9px] font-bold">–</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Visual Cards Stack */}
        <div className="block md:hidden space-y-3">
          {metricsRows.map((row, idx) => {
            const { label, cls } = getSeverityLabel(row.severity);
            return (
              <div key={idx} className="p-4 rounded-xl border bg-zinc-50/30 dark:bg-black/10 border-zinc-200/50 dark:border-zinc-800/40 shadow-sm flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">{row.name}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${cls}`}>
                    {label}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold border-t border-zinc-150/40 dark:border-zinc-800/30 pt-2.5 mt-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-400 font-medium">{t("companion.evaluation.tableColScore", "Điểm")}:</span>{" "}
                    <span className="text-zinc-700 dark:text-zinc-250 font-black">{row.score ?? "–"}</span>
                    {row.delta && <span className="ml-1 shrink-0">{row.delta}</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-400 font-medium">{t("companion.evaluation.tableColRecent", "Gần nhất")}:</span>{" "}
                    <span className="text-zinc-600 dark:text-zinc-350">{row.date ? formatDateTime(row.date).split(' ')[0] : "–"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Comparative progress table (only when >1 test of same type) ─────────────────────── */}
      {(() => {
        const dassComp = dassTests.length >= 2
          ? { initial: dassTests[0], current: dassTests[dassTests.length - 1] }
          : null;
        const mmpiComp = mmpiTests.length >= 2
          ? {
              initialElev: mmpiTests[0].clinical ? mmpiTests[0].clinical.filter(c => c.score >= 70).length : 0,
              currentElev: mmpiTests[mmpiTests.length - 1].clinical ? mmpiTests[mmpiTests.length - 1].clinical.filter(c => c.score >= 70).length : 0,
            }
          : null;
        const phq9Comp = phq9Tests.length >= 2
          ? { initial: phq9Tests[0], current: phq9Tests[phq9Tests.length - 1] }
          : null;

        if (!dassComp && !mmpiComp && !phq9Comp) return null;

        const progressBadge = (diff) => {
          const cls = diff < 0 ? "bg-emerald-500/10 text-emerald-600"
            : diff > 0 ? "bg-red-500/10 text-red-600"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500";
          const label = diff < 0 ? t("companion.evaluation.progressImprovement", "Tiến bộ") : diff > 0 ? t("companion.evaluation.progressAnomaly", "Bất thường") : t("companion.evaluation.progressStable", "Ổn định");
          return <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${cls}`}>{label}</span>;
        };

        return (
          <div className="p-5 rounded-xl border bg-white dark:bg-[#1a1924] border-zinc-200/50 dark:border-zinc-800/60 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
              <TrendingDown className="w-5 h-5 text-emerald-500" />
              <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">{t("companion.evaluation.historyTitle", "Lịch Sử & So Sánh Kết Quả Tham Vấn")}</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10.5px] border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[8.5px] font-black uppercase text-zinc-400 tracking-wider text-left">
                    <th className="py-2.5">{t("companion.evaluation.compareColScale", "Thang Đo Lâm Sàng")}</th>
                    <th className="py-2.5">{t("companion.evaluation.compareColInitial", "Chỉ Số Đầu Tiên")}</th>
                    <th className="py-2.5">{t("companion.evaluation.compareColCurrent", "Chỉ Số Hiện Tại")}</th>
                    <th className="py-2.5">{t("companion.evaluation.compareColDelta", "Biến Thiên")}</th>
                    <th className="py-2.5">{t("companion.evaluation.compareColStatus", "Nhận Định Tiến Trình")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 font-bold">
                  {dassComp && (
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-3 font-black text-zinc-800 dark:text-zinc-200">DASS-42: {t("companion.profile.dassDepression", "Trầm Cảm")}</td>
                      <td className="py-3 text-zinc-500">{dassComp.initial.scores?.D ?? 0} {t("companion.evaluation.points", "điểm")}</td>
                      <td className="py-3 text-zinc-800 dark:text-zinc-100">{dassComp.current.scores?.D ?? 0} {t("companion.evaluation.points", "điểm")}</td>
                      <td className={`py-3 ${(dassComp.current.scores?.D ?? 0) - (dassComp.initial.scores?.D ?? 0) < 0 ? "text-emerald-500" : (dassComp.current.scores?.D ?? 0) - (dassComp.initial.scores?.D ?? 0) > 0 ? "text-red-500" : "text-zinc-500"}`}>
                        {(dassComp.current.scores?.D ?? 0) - (dassComp.initial.scores?.D ?? 0) < 0
                          ? `${(dassComp.current.scores?.D ?? 0) - (dassComp.initial.scores?.D ?? 0)}${t("companion.evaluation.pointsShort", "đ")}`
                          : (dassComp.current.scores?.D ?? 0) - (dassComp.initial.scores?.D ?? 0) > 0
                          ? `+${(dassComp.current.scores?.D ?? 0) - (dassComp.initial.scores?.D ?? 0)}${t("companion.evaluation.pointsShort", "đ")}`
                          : `0${t("companion.evaluation.pointsShort", "đ")}`}
                      </td>
                      <td className="py-3">{progressBadge((dassComp.current.scores?.D ?? 0) - (dassComp.initial.scores?.D ?? 0))}</td>
                    </tr>
                  )}
                  {mmpiComp && (
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-3 font-black text-zinc-800 dark:text-zinc-200">Mini-MMPI: {t("companion.evaluation.thresholdExceeded", "Vượt ngưỡng")}</td>
                      <td className="py-3 text-zinc-500">{mmpiComp.initialElev} {t("companion.evaluation.scales", "thang")}</td>
                      <td className="py-3 text-zinc-800 dark:text-zinc-100">{mmpiComp.currentElev} {t("companion.evaluation.scales", "thang")}</td>
                      <td className={`py-3 ${mmpiComp.currentElev - mmpiComp.initialElev < 0 ? "text-emerald-500" : mmpiComp.currentElev - mmpiComp.initialElev > 0 ? "text-red-500" : "text-zinc-500"}`}>
                        {mmpiComp.currentElev - mmpiComp.initialElev < 0
                          ? `${mmpiComp.currentElev - mmpiComp.initialElev}`
                          : mmpiComp.currentElev - mmpiComp.initialElev > 0
                          ? `+${mmpiComp.currentElev - mmpiComp.initialElev}`
                          : "0"}
                      </td>
                      <td className="py-3">{progressBadge(mmpiComp.currentElev - mmpiComp.initialElev)}</td>
                    </tr>
                  )}
                  {phq9Comp && (() => {
                    const diff = phq9Comp.current.score - phq9Comp.initial.score;
                    return (
                      <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                        <td className="py-3 font-black text-zinc-800 dark:text-zinc-200">PHQ-9: {t("companion.profile.dassDepression", "Trầm Cảm")}</td>
                        <td className="py-3 text-zinc-500">{phq9Comp.initial.score} {t("companion.evaluation.points", "điểm")}</td>
                        <td className="py-3 text-zinc-800 dark:text-zinc-100">{phq9Comp.current.score} {t("companion.evaluation.points", "điểm")}</td>
                        <td className={`py-3 ${diff < 0 ? "text-emerald-500" : diff > 0 ? "text-red-500" : "text-zinc-500"}`}>
                          {diff < 0 ? `${diff}${t("companion.evaluation.pointsShort", "đ")}` : diff > 0 ? `+${diff}${t("companion.evaluation.pointsShort", "đ")}` : `0${t("companion.evaluation.pointsShort", "đ")}`}
                        </td>
                        <td className="py-3">{progressBadge(diff)}</td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Chronological timeline */}
      <div className="p-5 rounded-xl border bg-white dark:bg-[#1a1924] border-zinc-200/50 dark:border-zinc-800/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">{t("companion.evaluation.timelineTitle", "Lịch Sử Điều Trị & Phân Tích")}</h4>
          </div>
          {historyLogs.length > 4 && (
            <button
              onClick={() => setTimelineExpanded(v => !v)}
              className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-indigo-500 hover:text-indigo-600 transition-colors"
            >
              {timelineExpanded ? t("companion.evaluation.collapse", "Thu gọn") : t("companion.evaluation.viewAll", "Xem tất cả")}
              {timelineExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {historyLogs.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-[11px] font-bold">
            {t("companion.evaluation.noHistory", "Chưa ghi nhận hoạt động trị liệu hoặc kiểm tra nào.")}
          </div>
        ) : (
          <div
            className={`relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 space-y-6 py-2 overflow-hidden transition-all duration-300 ${
              timelineExpanded ? "max-h-[9999px]" : "max-h-80"
            }`}
          >
            {[...historyLogs].reverse().map((log, idx) => {
              let title = t("companion.evaluation.therapyActivity", "Hoạt động trị liệu");
              let color = "bg-indigo-500 border-indigo-200";
              let desc  = log.reason || log.desc || "";

              const moodLabels = {
                5: t("companion.evaluation.moods.veryGood", "Rất tốt"),
                4: t("companion.evaluation.moods.good", "Tốt"),
                3: t("companion.evaluation.moods.normal", "Bình thường"),
                2: t("companion.evaluation.moods.tired", "Mỏi mệt"),
                1: t("companion.evaluation.moods.exhausted", "Kiệt sức")
              };

              const getSeverityName = (severityCode) => {
                if (!severityCode) return t("companion.evaluation.unknown", "Không rõ");
                return t(`companion.evaluation.severities.${severityCode}`, severityCode);
              };

              if (log.type === "checkin") {
                title = t("companion.evaluation.moodCheckin", "Check-in cảm xúc");
                color = "bg-emerald-500 border-emerald-200";
                desc  = `${t("companion.evaluation.moodAssessment", "Đánh giá tâm trạng")}: ${
                  moodLabels[log.mood] || ""
                }. ${log.note ? `${t("companion.evaluation.note", "Ghi chú")}: "${log.note}"` : ""}`;
              } else if (log.test) {
                title = t("companion.evaluation.takeTest", { name: log.test.toUpperCase() }, "Thực hiện test {{name}}");
                color = "bg-blue-500 border-blue-200";
                if (log.test === "dass42") {
                  desc = `${t("companion.evaluation.result", "Kết quả")}: ${t("companion.profile.dassDepression", "Trầm cảm")} ${log.scores?.D ?? 0}/42, ${t("companion.profile.dassAnxiety", "Lo âu")} ${log.scores?.A ?? 0}/42, ${t("companion.profile.dassStress", "Căng thẳng")} ${log.scores?.S ?? 0}/42. ${t("companion.evaluation.tableColAlert", "Đánh giá")}: ${getSeverityName(log.severities?.D)}`;
                } else if (log.test === "mmpi30") {
                  const elev = log.clinical ? log.clinical.filter(c => c.score >= 70).length : 0;
                  desc = t("companion.evaluation.mmpiResultDesc", { count: elev }, "Kiểm tra Mini-MMPI: {{count}}/10 thang đo vượt ngưỡng thích ứng lâm sàng.");
                } else {
                  desc = `${t("companion.evaluation.assessmentScore", "Điểm số đánh giá")}: ${log.score} ${t("companion.evaluation.points", "điểm")}.`;
                }
              } else if (log.type === "duration_change") {
                title = t("companion.evaluation.activateCompanion", "Kích hoạt Đồng Hành");
                color = "bg-amber-500 border-amber-200";
                desc  = log.reason || "";
              }

              return (
                <div key={idx} className="relative pl-8">
                  <div className={`absolute left-[-9px] top-1.5 w-4 h-4 rounded-full border-[3px] ${color} z-10 shadow-sm`} />
                  <div className="space-y-1.5 p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-black/20 hover:border-indigo-500/30 transition-all shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">{title}</span>
                      <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 font-bold bg-white dark:bg-zinc-900 px-2 py-1 rounded-md shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 w-fit">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDateTime(log.date)}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-350 font-bold leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Collapsible Account/Bio Details for Mobile ────────────────────── */}
      <div className="block lg:hidden p-4 rounded-2xl border bg-white/60 dark:bg-[#1a1924]/60 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
        <button
          onClick={() => setShowPersonalDetails(v => !v)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">{t("companion.evaluation.accountDetailsTitle", "Chi tiết tài khoản & cá nhân")}</h4>
          </div>
          {showPersonalDetails ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </button>
        <AnimatePresence>
          {showPersonalDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4 space-y-3 pt-3 border-t border-zinc-150 dark:border-zinc-800/60 text-left"
            >
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50">
                <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] text-zinc-450 font-bold uppercase tracking-wider">{t("companion.evaluation.emailLabel", "Email liên hệ")}</p>
                  <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 truncate">{bio?.email || "–"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50">
                  <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-[8px] text-zinc-450 font-bold uppercase tracking-wider">{t("utilities.vcard.fields.phone", "Số điện thoại")}</p>
                    <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{bio?.phone || "–"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/50">
                  <CalendarIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-[8px] text-zinc-450 font-bold uppercase tracking-wider">{t("companion.profile.birthday", "Ngày sinh")}</p>
                    <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{bio?.dob || "–"}</p>
                  </div>
                </div>
              </div>
              {(!bio?.phone || !bio?.dob) && (
                <p className="text-[9px] font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 mt-2">
                  {t("companion.profile.missingInfo", "* Một số thông tin còn thiếu. Hãy trò chuyện với AI để cập nhật thêm.")}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
