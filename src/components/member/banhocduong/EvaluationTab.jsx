import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle, Clock, Calendar, TrendingDown, Activity,
  User, Phone, Mail, Calendar as CalendarIcon,
  TrendingUp, Sparkles, ShieldCheck, ChevronDown, ChevronUp,
  Brain, Moon, Compass, Heart, Award, ArrowUpRight, CheckCircle2
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import RadarChart from "./charts/RadarChart";
import LineChart from "./charts/LineChart";
import dataApi from "../../../services/dataApi";

// ── Big Five Radar Chart Component ───────────────────────────────────────────
function BigFiveRadarChart({ traits, maxScore = 5 }) {
  const { t } = useTranslation();
  const size = 160;
  const center = size / 2;
  const radius = center - 20;

  const angles = [
    -Math.PI / 2,                       // 12 o'clock (Cởi mở - Openness)
    -Math.PI / 2 + (2 * Math.PI) / 5,   // ~18 deg (Tận tụy - Conscientiousness)
    -Math.PI / 2 + (4 * Math.PI) / 5,   // ~162 deg (Hướng ngoại - Extraversion)
    -Math.PI / 2 + (6 * Math.PI) / 5,   // ~234 deg (Dễ chịu - Agreeableness)
    -Math.PI / 2 + (8 * Math.PI) / 5,   // ~306 deg (Nhạy cảm - Neuroticism)
  ];

  const getPoint = (score, angle) => {
    const r = (score / maxScore) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const points = [
    getPoint(traits.openness || 3, angles[0]),
    getPoint(traits.conscientiousness || 3, angles[1]),
    getPoint(traits.extraversion || 3, angles[2]),
    getPoint(traits.agreeableness || 3, angles[3]),
    getPoint(traits.neuroticism || 3, angles[4]),
  ];

  const polygonPath = points.map(p => `${p.x},${p.y}`).join(" ");

  const gridPolygons = [0.2, 0.4, 0.6, 0.8, 1.0].map(ratio => {
    return angles.map(angle => {
      const p = getPoint(maxScore * ratio, angle);
      return `${p.x},${p.y}`;
    }).join(" ");
  });

  const labelOffset = 5;
  const getLabelPoint = (angle) => {
    const r = radius + labelOffset;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const labels = [
    { text: t("companion.evaluation.traits.openness", "Cởi mở"), pos: getLabelPoint(angles[0]), anchor: "middle", dy: "-2" },
    { text: t("companion.evaluation.traits.conscientiousness", "Tận tụy"), pos: getLabelPoint(angles[1]), anchor: "start", dy: "2" },
    { text: t("companion.evaluation.traits.extraversion", "H.ngoại"), pos: getLabelPoint(angles[2]), anchor: "start", dy: "8" },
    { text: t("companion.evaluation.traits.agreeableness", "Dễ chịu"), pos: getLabelPoint(angles[3]), anchor: "end", dy: "8" },
    { text: t("companion.evaluation.traits.neuroticism", "Nhạy cảm"), pos: getLabelPoint(angles[4]), anchor: "end", dy: "2" },
  ];

  return (
    <div className="relative flex justify-center items-center w-full my-2">
      <svg width={size} height={size} className="overflow-visible">
        {/* Concentric grids */}
        {gridPolygons.map((pointsStr, idx) => (
          <polygon
            key={idx}
            points={pointsStr}
            fill="none"
            stroke="currentColor"
            className="text-muted-foreground/30 dark:text-muted-foreground/20"
            strokeWidth="0.8"
          />
        ))}
        {/* Axis lines */}
        {angles.map((angle, idx) => {
          const maxPt = getPoint(maxScore, angle);
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={maxPt.x}
              y2={maxPt.y}
              stroke="currentColor"
              className="text-muted-foreground/30 dark:text-muted-foreground/20"
              strokeWidth="0.8"
            />
          );
        })}
        {/* Fill Area */}
        <polygon
          points={polygonPath}
          fill="hsl(var(--primary) / 0.2)"
          stroke="hsl(var(--primary))"
          strokeWidth="1.8"
        />
        {/* Data Vertices */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="3.5"
            className="fill-primary stroke-white dark:stroke-card stroke-1"
          />
        ))}
        {/* Labels text */}
        {labels.map((l, idx) => (
          <text
            key={idx}
            x={l.pos.x}
            y={l.pos.y}
            textAnchor={l.anchor}
            dy={l.dy}
            className="text-[8.5px] font-black fill-muted-foreground uppercase tracking-wider"
          >
            {l.text}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function EvaluationTab({ historyLogs: rawHistoryLogs, bio, onNavigateToTab, showToast }) {
  const { t } = useTranslation();
  const historyLogs = Array.isArray(rawHistoryLogs) ? rawHistoryLogs : [];
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [showPersonalDetails, setShowPersonalDetails] = useState(false);
  
  // Sleep tracker states
  const [sleepLogs, setSleepLogs] = useState([]);
  const [loadingSleep, setLoadingSleep] = useState(false);

  useEffect(() => {
    if (!bio?.email) return;
    setLoadingSleep(true);
    dataApi.get(`/api/sleep?email=${encodeURIComponent(bio.email)}&limit=30`)
      .then(res => {
        setSleepLogs(res.data.logs || []);
      })
      .catch(() => {})
      .finally(() => setLoadingSleep(false));
  }, [bio?.email]);

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
  const bigFiveTests = historyLogs.filter(l => l.test === "bigfive");

  const totalTestsCount = dassTests.length + mmpiTests.length + phq9Tests.length + gad7Tests.length + who5Tests.length + bigFiveTests.length;

  // ── Mood calculations ──────────
  const avgMoodValue = useMemo(() => {
    if (checkins.length === 0) return 3.8; // default baseline
    const sum = checkins.reduce((s, c) => s + (c.mood || 3), 0);
    return parseFloat((sum / checkins.length).toFixed(1));
  }, [checkins]);

  // ── Anomaly detection ──────────
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
      normal:           { label: t("companion.evaluation.severities.normal", "Bình thường"), cls: "bg-success/10 text-success" },
      mild:             { label: t("companion.evaluation.severities.mild", "Nhẹ"),         cls: "bg-info/15 text-info" },
      moderate:         { label: t("companion.evaluation.severities.moderate", "Vừa"),         cls: "bg-warning/10 text-warning" },
      severe:           { label: t("companion.evaluation.severities.severe", "Nặng"),        cls: "bg-destructive/10 text-destructive" },
      extremely_severe: { label: t("companion.evaluation.severities.extremely_severe", "Cực đoan"),    cls: "bg-destructive/20 text-destructive" },
      no_data:          { label: "–",           cls: "bg-muted text-muted-foreground" },
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
    const thresholdsArr = thresholds[type];
    if (!thresholdsArr) return "no_data";
    if (score <= thresholdsArr[1]) return "normal";
    if (score <= thresholdsArr[2]) return "mild";
    if (score <= thresholdsArr[3]) return "moderate";
    if (score <= thresholdsArr[4]) return "severe";
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
    if (d === 0) return <span className="ml-1 text-[9px] font-black text-muted-foreground">±0</span>;
    const pos = d > 0;
    return (
      <span className={`ml-1 text-[9px] font-black ${pos ? "text-destructive" : "text-success"}`}>
        {pos ? `+${d}` : d}
      </span>
    );
  };

  const metricsRows = [
    {
      name: "PHQ-9",
      date: latestPhq9?.date,
      score: latestPhq9 ? `${latestPhq9.score}/27` : null,
      scoreRaw: latestPhq9?.score,
      range: "0–4",
      severity: phq9Severity(latestPhq9?.score),
      delta: deltaBadge(latestPhq9?.score, prevPhq9?.score),
    },
    {
      name: "GAD-7",
      date: latestGad7?.date,
      score: latestGad7 ? `${latestGad7.score}/21` : null,
      scoreRaw: latestGad7?.score,
      range: "0–4",
      severity: gad7Severity(latestGad7?.score),
      delta: null,
    },
    {
      name: "WHO-5",
      date: latestWho5?.date,
      score: latestWho5 ? `${latestWho5.score}/25` : null,
      scoreRaw: latestWho5?.score,
      range: "≥13",
      severity: who5Severity(latestWho5?.score),
      delta: null,
    },
    {
      name: "DASS-D",
      date: latestDass?.date,
      score: latestDass ? `${latestDass.scores?.D ?? "–"}/42` : null,
      scoreRaw: latestDass?.scores?.D,
      range: "0–9",
      severity: dassSeverity(latestDass?.scores?.D, "D"),
      delta: deltaBadge(latestDass?.scores?.D, prevDassD?.scores?.D),
    },
    {
      name: "DASS-A",
      date: latestDass?.date,
      score: latestDass ? `${latestDass.scores?.A ?? "–"}/42` : null,
      scoreRaw: latestDass?.scores?.A,
      range: "0–7",
      severity: dassSeverity(latestDass?.scores?.A, "A"),
      delta: null,
    },
    {
      name: "DASS-S",
      date: latestDass?.date,
      score: latestDass ? `${latestDass.scores?.S ?? "–"}/42` : null,
      scoreRaw: latestDass?.scores?.S,
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

  // Big Five Trait extraction
  const latestBigFiveLog = bigFiveTests.length > 0 ? bigFiveTests[bigFiveTests.length - 1] : null;
  const bigFiveTraits = latestBigFiveLog?.traits || {
    extraversion: 3.5,
    agreeableness: 3.8,
    conscientiousness: 4.0,
    neuroticism: 2.2,
    openness: 4.2
  };

  // Mood Arc variables
  const moodArcLength = Math.PI * 40; // ~125.6
  const moodPct = ((avgMoodValue - 1) / 4) * 100;
  const moodStrokeOffset = moodArcLength - (moodPct / 100) * moodArcLength;

  const getMoodLabel = (val) => {
    if (val >= 4.5) return { text: t("companion.evaluation.moods.veryGood", "Rất tốt"), color: "text-success bg-success/10" };
    if (val >= 3.5) return { text: t("companion.evaluation.moods.good", "Tốt"), color: "text-success bg-success/10" };
    if (val >= 2.5) return { text: t("companion.evaluation.moods.normal", "Bình thường"), color: "text-info bg-info/10" };
    if (val >= 1.5) return { text: t("companion.evaluation.moods.tired", "Mệt mỏi"), color: "text-warning bg-warning/10" };
    return { text: t("companion.evaluation.moods.exhausted", "Kiệt sức"), color: "text-destructive bg-destructive/10" };
  };
  const moodLabel = getMoodLabel(avgMoodValue);

  // Sleep Chart variables
  const sleepChartData = useMemo(() => {
    const last7 = [...sleepLogs].slice(0, 7).reverse();
    if (last7.length === 0) {
      return [
        { date: "Th 2", duration: 7.2, quality: 4, simulated: true },
        { date: "Th 3", duration: 6.5, quality: 3, simulated: true },
        { date: "Th 4", duration: 8.0, quality: 5, simulated: true },
        { date: "Th 5", duration: 5.5, quality: 2, simulated: true },
        { date: "Th 6", duration: 7.0, quality: 4, simulated: true },
        { date: "Th 7", duration: 7.5, quality: 4, simulated: true },
        { date: "CN",   duration: 8.2, quality: 5, simulated: true },
      ];
    }
    return last7.map(log => {
      const d = new Date(log.date);
      const days = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
      return {
        date: days[d.getDay()],
        duration: log.duration || 0,
        quality: log.quality || 3
      };
    });
  }, [sleepLogs]);

  const avgSleep = useMemo(() => {
    if (sleepLogs.length === 0) return 7.1;
    const sum = sleepLogs.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    return parseFloat((sum / sleepLogs.length).toFixed(1));
  }, [sleepLogs]);

  return (
    <div className="p-4 sm:p-6 space-y-6 text-left animate-fadeIn bg-transparent pb-20">

      {/* ── Mobile Compact Header ────────────────────────────────────────────── */}
      <div className="lg:hidden flex items-center gap-3.5 p-4 rounded-2xl border bg-white/60 dark:bg-card/60 backdrop-blur-xl border-border/50 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-md overflow-hidden border-2 border-white dark:border-border">
          {bio?.avatarUrl ? (
            <img src={bio.avatarUrl} alt={bio.displayName || bio.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-black text-sm">
              {(bio?.displayName || bio?.name || "?").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h3 className="text-sm font-black text-foreground leading-tight">{bio?.displayName || bio?.name || t("companion.profile.notSet", "Chưa cập nhật")}</h3>
          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">{bio?.school || bio?.org || t("companion.evaluation.orgFallback", "Trường / Tổ chức")}</p>
        </div>
      </div>

      {/* ── BENTO GRID SYSTEM ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Cell 1: AI Wellness Recommendation (Spans col-span-3) */}
        <div className="col-span-1 md:col-span-3 p-5 rounded-2xl border bg-white/40 dark:bg-card/40 backdrop-blur-xl border-border/50 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <h4 className="text-[11px] font-black uppercase tracking-wider text-foreground">{t("companion.profile.clinicalAlerts", "AI Nhận Định & Lời Khuyên Sức Khỏe")}</h4>
            </div>
            {anomalies.length > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-destructive/10 text-destructive animate-pulse">
                {t("companion.evaluation.anomaliesCount", { count: anomalies.length })}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-success/10 text-success">
                {t("companion.evaluation.stableTitle", "Hoàn thành ổn định")}
              </span>
            )}
          </div>

          <div className="p-4 bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-2xl flex gap-3.5 items-start">
            <div className="p-2 rounded-xl bg-success/10 text-success shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h5 className="text-[9px] font-black uppercase tracking-wider text-success">{t("companion.evaluation.aiAdvice", "Lời khuyên của AI Đồng Hành")}</h5>
              <p className="text-[11.5px] text-foreground/80 font-bold leading-relaxed">{recommendation}</p>
            </div>
          </div>

          {/* Anomalies alerts inline grid */}
          {anomalies.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {anomalies.map((a, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border shadow-sm flex gap-3 items-start transition-all hover:scale-[1.01] ${
                    a.severity === "high"
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : a.severity === "low"
                      ? "border-border/40 bg-muted/50 text-muted-foreground"
                      : "border-warning/20 bg-warning/5 text-warning"
                  }`}
                >
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                    a.severity === "high" ? "text-destructive animate-pulse" : "text-warning"
                  }`} />
                  <div>
                    <span className="text-[9.5px] font-black uppercase tracking-wider block leading-tight">
                      {a.title}
                    </span>
                    <p className="text-[9.5px] opacity-90 leading-relaxed font-semibold mt-0.5">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action shortcuts */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-border/40 mt-1">
            <span className="text-[9.5px] text-muted-foreground font-black uppercase tracking-wider self-center mr-2">{t("companion.evaluation.shortcuts", "Lối tắt nhanh:")}</span>
            <button
              onClick={() => onNavigateToTab("therapy")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary text-[10px] font-black transition-colors"
            >
              <Brain className="w-3.5 h-3.5" />
              {t("companion.evaluation.shortcuts.breathe", "Tập thở 4-7-8")}
            </button>
            <button
              onClick={() => onNavigateToTab("therapy")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/10 hover:bg-success/15 text-success text-[10px] font-black transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t("companion.evaluation.shortcuts.soundscape", "Âm thanh thiên nhiên")}
            </button>
            <button
              onClick={() => onNavigateToTab("chat")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 hover:bg-destructive/15 text-destructive text-[10px] font-black transition-colors"
            >
              <Heart className="w-3.5 h-3.5" />
              {t("companion.evaluation.shortcuts.chat", "Bắt đầu trút giận")}
            </button>
          </div>
        </div>

        {/* Cell 2: Mood Speedometer Gauge (col-span-1) */}
        <div className="col-span-1 p-5 rounded-2xl border bg-white/40 dark:bg-card/40 backdrop-blur-xl border-border/50 shadow-sm flex flex-col justify-between min-h-[260px] group">
          <div>
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5 mb-3">
              <Activity className="w-4 h-4 text-success" />
              <h4 className="text-[10px] font-black uppercase tracking-wider text-foreground">{t("companion.evaluation.moodGauge", "Chỉ số Cảm xúc")}</h4>
            </div>
            <p className="text-[10px] text-muted-foreground font-bold mb-4">{t("companion.evaluation.moodGaugeDesc", "Mức độ cân bằng cảm xúc trung bình gần đây")}</p>
          </div>

          <div className="relative flex flex-col items-center justify-center py-2">
            <svg width="120" height="70" viewBox="0 0 120 70" className="overflow-visible">
              {/* Background Arc */}
              <path
                d="M 20 60 A 40 40 0 0 1 100 60"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className="text-muted/80"
              />
              {/* Active Arc */}
              <motion.path
                d="M 20 60 A 40 40 0 0 1 100 60"
                fill="none"
                stroke="url(#moodGaugeGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={moodArcLength}
                initial={{ strokeDashoffset: moodArcLength }}
                animate={{ strokeDashoffset: moodStrokeOffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="moodGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" />
                  <stop offset="50%" stopColor="hsl(var(--warning))" />
                  <stop offset="100%" stopColor="hsl(var(--success))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute bottom-2 flex flex-col items-center">
              <span className="text-xl font-black text-foreground leading-none">{avgMoodValue}</span>
              <span className="text-[7.5px] uppercase tracking-wider text-muted-foreground font-black mt-1">/ 5.0</span>
            </div>
          </div>

          <div className={`mt-3 p-2 rounded-xl text-center text-[10px] font-black tracking-wide ${moodLabel.color}`}>
            {t("companion.evaluation.moodGaugeState", "Trạng thái: ")} {moodLabel.text}
          </div>
        </div>

        {/* Cell 3: Stress & Anxiety Progress Bars (col-span-1) */}
        <div className="col-span-1 p-5 rounded-2xl border bg-white/40 dark:bg-card/40 backdrop-blur-xl border-border/50 shadow-sm flex flex-col justify-between min-h-[260px]">
          <div>
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5 mb-3">
              <ShieldCheck className="w-4 h-4 text-destructive" />
              <h4 className="text-[10px] font-black uppercase tracking-wider text-foreground">{t("companion.evaluation.clinicalBars", "Chỉ số Lâm Sàng")}</h4>
            </div>
          </div>

          <div className="space-y-3.5 py-1">
            {metricsRows.slice(0, 5).map((row, idx) => {
              const score = row.scoreRaw;
              const max = row.name.includes("PHQ") ? 27 : row.name.includes("GAD") ? 21 : 42;
              const pct = score != null ? Math.min((score / max) * 100, 100) : 0;

              let barColor = "bg-muted";
              if (score != null) {
                if (row.severity === "normal") barColor = "bg-success";
                else if (row.severity === "mild") barColor = "bg-info";
                else if (row.severity === "moderate") barColor = "bg-warning";
                else barColor = "bg-destructive";
              }

              const { label: sevLabel } = getSeverityLabel(row.severity);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-[9.5px] font-black uppercase tracking-wider">
                    <span className="text-muted-foreground">{row.name}</span>
                    <span className="text-foreground">
                      {score != null ? `${score}/${max} (${sevLabel})` : t("companion.evaluation.noData", "Chưa đo")}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    {score != null ? (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.05 }}
                        className={`h-full rounded-full ${barColor}`}
                      />
                    ) : (
                      <div className="h-full w-full bg-muted/50" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => onNavigateToTab("chat")}
            className="w-full mt-3 py-2 rounded-xl bg-muted hover:bg-muted/70 border border-border/50 text-[9px] font-black uppercase tracking-wider text-muted-foreground active:scale-[0.98] transition-all flex items-center justify-center gap-1"
          >
            {t("companion.evaluation.doTestBtn", "Đánh giá kiểm tra thêm")}
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Cell 4: Personality Radar Card (col-span-1) */}
        <div className="col-span-1 p-5 rounded-2xl border bg-white/40 dark:bg-card/40 backdrop-blur-xl border-border/50 shadow-sm flex flex-col justify-between min-h-[260px]">
          <div>
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5 mb-3">
              <Compass className="w-4 h-4 text-primary" />
              <h4 className="text-[10px] font-black uppercase tracking-wider text-foreground">{t("companion.evaluation.personalityRadar", "Tính Cách Big Five")}</h4>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <BigFiveRadarChart traits={bigFiveTraits} />
          </div>

          {!latestBigFiveLog ? (
            <button
              onClick={() => onNavigateToTab("chat")}
              className="w-full mt-3 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/15 hover:to-accent/15 border border-primary/20 text-[9px] font-black uppercase tracking-wider text-primary active:scale-[0.98] transition-all"
            >
              {t("companion.evaluation.doBigFive", "Làm trắc nghiệm nhân cách")}
            </button>
          ) : (
            <div className="text-center text-[9px] font-bold text-muted-foreground tracking-wide mt-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-success inline mr-1 -mt-0.5" />
              {t("companion.evaluation.testCompleted", "Đã cập nhật biểu đồ nhân cách")}
            </div>
          )}
        </div>

        {/* Cell 5: Sleep Duration Tracker (col-span-2) */}
        <div className="col-span-1 md:col-span-2 p-5 rounded-2xl border bg-white/40 dark:bg-card/40 backdrop-blur-xl border-border/50 shadow-sm flex flex-col justify-between min-h-[260px] group">
          <div>
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-info" />
                <h4 className="text-[10px] font-black uppercase tracking-wider text-foreground">{t("companion.evaluation.sleepTracker", "Lịch Sử Giấc Ngủ Thiết Bị")}</h4>
              </div>
              {sleepLogs.length === 0 ? (
                <span className="text-[8px] bg-warning/10 text-warning px-2 py-0.5 rounded font-black uppercase tracking-wider">
                  {t("companion.evaluation.sampleData", "Dữ liệu mẫu")}
                </span>
              ) : (
                <span className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded font-black uppercase tracking-wider">
                  {t("companion.evaluation.connectedState", "Đã kết nối")}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end mt-2">
            {loadingSleep ? (
              <div className="h-28 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="flex gap-2 items-end justify-between h-24 mb-1">
                {sleepChartData.map((bar, idx) => {
                  const heightPercent = Math.min((bar.duration / 10) * 100, 100);
                  const qualityColors = ["bg-muted-foreground/40", "bg-destructive", "bg-warning", "bg-warning/80", "bg-success", "bg-info"];
                  const barColor = qualityColors[bar.quality] || "bg-primary";
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-foreground/90 text-background text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none font-bold">
                        {bar.duration}h · {t("companion.evaluation.sleepQualityLabel", "CL:")} {bar.quality}/5
                      </div>
                      <div className="w-full bg-muted/50 rounded-t-lg h-20 flex items-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercent}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.05 }}
                          className={`w-full rounded-t-lg ${barColor} opacity-85 hover:opacity-100 transition-all cursor-pointer`}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground font-black tracking-wide">{bar.date}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-3.5 mt-2">
            <div className="text-center">
              <span className="text-[8px] text-muted-foreground font-black uppercase tracking-wider block">{t("companion.evaluation.sleepAvg", "Trung bình")}</span>
              <span className="text-xs font-black text-foreground">{avgSleep} {t("companion.evaluation.hours", "giờ")}</span>
            </div>
            <div className="text-center border-x border-border/40">
              <span className="text-[8px] text-muted-foreground font-black uppercase tracking-wider block">{t("companion.evaluation.sleepConsistency", "Ổn định")}</span>
              <span className="text-xs font-black text-foreground">{sleepLogs.length > 0 ? t("companion.evaluation.sleepGood", "Tốt") : t("companion.evaluation.sleepUnverified", "Chưa kiểm chứng")}</span>
            </div>
            <div className="text-center">
              <span className="text-[8px] text-muted-foreground font-black uppercase tracking-wider block">{t("companion.evaluation.sleepWakes", "Thức giấc")}</span>
              <span className="text-xs font-black text-foreground">{sleepLogs.length > 0 ? t("companion.evaluation.sleepLow", "Thấp") : t("companion.evaluation.sleepNone", "–")}</span>
            </div>
          </div>
        </div>

        {/* Cell 6: Stats & Bio Info (col-span-1) */}
        <div className="col-span-1 p-5 rounded-2xl border bg-white/40 dark:bg-card/40 backdrop-blur-xl border-border/50 shadow-sm flex flex-col justify-between min-h-[260px]">
          <div>
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5 mb-3">
              <Award className="w-4 h-4 text-warning" />
              <h4 className="text-[10px] font-black uppercase tracking-wider text-foreground">{t("companion.evaluation.generalOverview", "Tổng Quan Hoạt Động")}</h4>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 py-1">
            <div className="p-3 bg-muted/40 rounded-xl border border-border/30 text-center hover:border-primary/20 transition-all">
              <p className="text-xl font-black text-primary">{totalTestsCount}</p>
              <p className="text-[8.5px] uppercase tracking-wider font-bold text-muted-foreground mt-1">{t("companion.profile.statsTests", "Bài test")}</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl border border-border/30 text-center hover:border-success/20 transition-all">
              <p className="text-xl font-black text-success">{checkins.length}</p>
              <p className="text-[8.5px] uppercase tracking-wider font-bold text-muted-foreground mt-1">{t("companion.profile.statsCheckins", "Check-in")}</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl border border-border/30 text-center hover:border-destructive/20 transition-all">
              <p className="text-xl font-black text-destructive">{anomalies.length}</p>
              <p className="text-[8.5px] uppercase tracking-wider font-bold text-muted-foreground mt-1">{t("companion.profile.statsAnomalies", "Cảnh báo")}</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl border border-border/30 text-center hover:border-warning/20 transition-all">
              <p className="text-xl font-black text-warning">{daysActive}</p>
              <p className="text-[8.5px] uppercase tracking-wider font-bold text-muted-foreground mt-1">{t("companion.evaluation.activeDays", "Ngày sử dụng")}</p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab("sleep")}
            className="w-full mt-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/15 text-[9px] font-black uppercase tracking-wider text-primary active:scale-[0.98] transition-all flex items-center justify-center gap-1"
          >
            {t("companion.evaluation.syncSleepSensors", "Đồng bộ thiết bị")}
            <Moon className="w-3 h-3 text-primary" />
          </button>
        </div>

      </div>

      {/* ── Desktop-only Bio card (repositioned as secondary info) ────────── */}
      <div className="hidden lg:flex p-5 rounded-2xl border bg-white/40 dark:bg-card/40 backdrop-blur-xl border-border/50 shadow-sm items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-md overflow-hidden">
            {bio?.avatarUrl ? (
              <img src={bio.avatarUrl} alt={bio.displayName || bio.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-black text-sm">
                {(bio?.displayName || bio?.name || "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-black text-foreground leading-tight">{bio?.displayName || bio?.name || t("companion.profile.notSet", "Chưa cập nhật")}</h4>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-wider mt-0.5">{bio?.school || bio?.org || t("companion.evaluation.orgFallback", "Trường / Tổ chức")}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/40">
            <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-[10.5px] font-black text-foreground/80 truncate max-w-[180px]">{bio?.email || "–"}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/40">
            <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-[10.5px] font-black text-foreground/80">{bio?.phone || "–"}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/40">
            <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-[10.5px] font-black text-foreground/80">{bio?.dob || "–"}</p>
          </div>
        </div>
      </div>

      {/* ── Deep Analysis Charts (RadarChart + LineChart) ────────────────────── */}
      {totalTestsCount > 0 && (
        <div className="p-5 rounded-2xl border bg-white dark:bg-card border-border/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <TrendingUp className="w-5 h-5 text-info" />
            <h4 className="text-sm font-black uppercase tracking-wider text-foreground">{t("companion.profile.deepAnalysis", "Biểu Đồ Xu Hướng Sức Khỏe")}</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border/60 rounded-xl p-4 bg-white/50 dark:bg-black/20 flex flex-col">
              <h5 className="text-[9px] font-black text-muted-foreground uppercase tracking-wider text-center mb-3">{t("companion.profile.wheelTitle", "Chỉ số Bánh Xe Cuộc Sống (DASS)")}</h5>
              <div className="flex-1 min-h-[170px]">
                <RadarChart scores={latestDass?.scores} />
              </div>
            </div>
            <div className="border border-border/60 rounded-xl p-4 bg-white/50 dark:bg-black/20 flex flex-col">
              <h5 className="text-[9px] font-black text-muted-foreground uppercase tracking-wider text-center mb-3">{t("companion.profile.emotionTitle", "Biến thiên Cảm xúc Check-in")}</h5>
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

      {/* ── Metrics Detailed Dashboard Table ───────────────────────────────── */}
      <div className="p-5 rounded-2xl border bg-white dark:bg-card border-border/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <ShieldCheck className="w-5 h-5 text-info" />
          <h4 className="text-sm font-black uppercase tracking-wider text-foreground">{t("companion.evaluation.tableTitle", "Bảng Chỉ Số Chi Tiết")}</h4>
        </div>

        {/* Desktop Dashboard Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[10.5px] border-collapse">
            <thead>
              <tr className="border-b border-border text-[8.5px] font-black uppercase text-muted-foreground tracking-wider text-left">
                <th className="py-2.5 pr-3 whitespace-nowrap">{t("companion.profile.statsTests", "Test")}</th>
                <th className="py-2.5 pr-3 whitespace-nowrap">{t("companion.evaluation.tableColRecent", "Lần gần nhất")}</th>
                <th className="py-2.5 pr-3 whitespace-nowrap">{t("companion.evaluation.tableColScore", "Điểm")}</th>
                <th className="py-2.5 pr-3 whitespace-nowrap">{t("companion.evaluation.tableColNormal", "Ngưỡng bình thường")}</th>
                <th className="py-2.5 pr-3 whitespace-nowrap">{t("companion.evaluation.tableColAlert", "Mức độ")}</th>
                <th className="py-2.5 whitespace-nowrap">{t("companion.tab.progress", "Tiến trình")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-bold">
              {metricsRows.map((row, idx) => {
                const { label, cls } = getSeverityLabel(row.severity);
                return (
                  <tr key={idx} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 pr-3 font-black text-foreground/90 whitespace-nowrap">{row.name}</td>
                    <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">
                      {row.date ? formatDateTime(row.date) : <span className="text-muted-foreground/60">–</span>}
                    </td>
                    <td className="py-3 pr-3 text-foreground/90 whitespace-nowrap">
                      {row.score ?? <span className="text-muted-foreground/60">–</span>}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">{row.range}</td>
                    <td className="py-3 pr-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${cls}`}>{label}</span>
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      {row.delta ?? <span className="text-muted-foreground/60 text-[9px] font-bold">–</span>}
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
              <div key={idx} className="p-4 rounded-xl border bg-muted/30 border-border/50 shadow-sm flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground/90">{row.name}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${cls}`}>
                    {label}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold border-t border-border/40 pt-2.5 mt-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground font-medium">{t("companion.evaluation.tableColScore", "Điểm")}:</span>{" "}
                    <span className="text-foreground/80 font-black">{row.score ?? "–"}</span>
                    {row.delta && <span className="ml-1 shrink-0">{row.delta}</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground font-medium">{t("companion.evaluation.tableColRecent", "Gần nhất")}:</span>{" "}
                    <span className="text-muted-foreground">{row.date ? formatDateTime(row.date).split(' ')[0] : "–"}</span>
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
          const cls = diff < 0 ? "bg-success/10 text-success"
            : diff > 0 ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground";
          const label = diff < 0 ? t("companion.evaluation.progressImprovement", "Tiến bộ") : diff > 0 ? t("companion.evaluation.progressAnomaly", "Bất thường") : t("companion.evaluation.progressStable", "Ổn định");
          return <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${cls}`}>{label}</span>;
        };

        return (
          <div className="p-5 rounded-2xl border bg-white dark:bg-card border-border/60 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <TrendingDown className="w-5 h-5 text-success" />
              <h4 className="text-sm font-black uppercase tracking-wider text-foreground">{t("companion.evaluation.historyTitle", "Lịch Sử & So Sánh Kết Quả Tham Vấn")}</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10.5px] border-collapse">
                <thead>
                  <tr className="border-b border-border text-[8.5px] font-black uppercase text-muted-foreground tracking-wider text-left">
                    <th className="py-2.5">{t("companion.evaluation.compareColScale", "Thang Đo Lâm Sàng")}</th>
                    <th className="py-2.5">{t("companion.evaluation.compareColInitial", "Chỉ Số Đầu Tiên")}</th>
                    <th className="py-2.5">{t("companion.evaluation.compareColCurrent", "Chỉ Số Hiện Tại")}</th>
                    <th className="py-2.5">{t("companion.evaluation.compareColDelta", "Biến Thiên")}</th>
                    <th className="py-2.5">{t("companion.evaluation.compareColStatus", "Nhận Định Tiến Trình")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-bold">
                  {dassComp && (
                    <tr className="hover:bg-muted/40">
                      <td className="py-3 font-black text-foreground/90">DASS-42: {t("companion.profile.dassDepression", "Trầm Cảm")}</td>
                      <td className="py-3 text-muted-foreground">{dassComp.initial.scores?.D ?? 0} {t("companion.evaluation.points", "điểm")}</td>
                      <td className="py-3 text-foreground/90">{dassComp.current.scores?.D ?? 0} {t("companion.evaluation.points", "điểm")}</td>
                      <td className={`py-3 ${(dassComp.current.scores?.D ?? 0) - (dassComp.initial.scores?.D ?? 0) < 0 ? "text-success" : (dassComp.current.scores?.D ?? 0) - (dassComp.initial.scores?.D ?? 0) > 0 ? "text-destructive" : "text-muted-foreground"}`}>
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
                    <tr className="hover:bg-muted/40">
                      <td className="py-3 font-black text-foreground/90">Mini-MMPI: {t("companion.evaluation.thresholdExceeded", "Vượt ngưỡng")}</td>
                      <td className="py-3 text-muted-foreground">{mmpiComp.initialElev} {t("companion.evaluation.scales", "thang")}</td>
                      <td className="py-3 text-foreground/90">{mmpiComp.currentElev} {t("companion.evaluation.scales", "thang")}</td>
                      <td className={`py-3 ${mmpiComp.currentElev - mmpiComp.initialElev < 0 ? "text-success" : mmpiComp.currentElev - mmpiComp.initialElev > 0 ? "text-destructive" : "text-muted-foreground"}`}>
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
                      <tr className="hover:bg-muted/40">
                        <td className="py-3 font-black text-foreground/90">PHQ-9: {t("companion.profile.dassDepression", "Trầm Cảm")}</td>
                        <td className="py-3 text-muted-foreground">{phq9Comp.initial.score} {t("companion.evaluation.points", "điểm")}</td>
                        <td className="py-3 text-foreground/90">{phq9Comp.current.score} {t("companion.evaluation.points", "điểm")}</td>
                        <td className={`py-3 ${diff < 0 ? "text-success" : diff > 0 ? "text-destructive" : "text-muted-foreground"}`}>
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
      <div className="p-5 rounded-2xl border bg-white dark:bg-card border-border/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h4 className="text-sm font-black uppercase tracking-wider text-foreground">{t("companion.evaluation.timelineTitle", "Lịch Sử Điều Trị & Phân Tích")}</h4>
          </div>
          {historyLogs.length > 4 && (
            <button
              onClick={() => setTimelineExpanded(v => !v)}
              className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-primary hover:text-primary/90 transition-colors"
            >
              {timelineExpanded ? t("companion.evaluation.collapse", "Thu gọn") : t("companion.evaluation.viewAll", "Xem tất cả")}
              {timelineExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {historyLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-[11px] font-bold">
            {t("companion.evaluation.noHistory", "Chưa ghi nhận hoạt động trị liệu hoặc kiểm tra nào.")}
          </div>
        ) : (
          <div
            className={`relative border-l-2 border-border ml-4 space-y-6 py-2 overflow-hidden transition-all duration-300 ${
              timelineExpanded ? "max-h-[9999px]" : "max-h-80"
            }`}
          >
            {[...historyLogs].reverse().map((log, idx) => {
              let title = t("companion.evaluation.therapyActivity", "Hoạt động trị liệu");
              let color = "bg-primary border-primary/30";
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
                color = "bg-success border-success/30";
                desc  = `${t("companion.evaluation.moodAssessment", "Đánh giá tâm trạng")}: ${
                  moodLabels[log.mood] || ""
                }. ${log.note ? `${t("companion.evaluation.note", "Ghi chú")}: "${log.note}"` : ""}`;
              } else if (log.test) {
                title = t("companion.evaluation.takeTest", { name: log.test.toUpperCase() }, "Thực hiện test {{name}}");
                color = "bg-info border-info/30";
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
                color = "bg-warning border-warning/30";
                desc  = log.reason || "";
              }

              return (
                <div key={idx} className="relative pl-8">
                  <div className={`absolute left-[-9px] top-1.5 w-4 h-4 rounded-full border-[3px] ${color} z-10 shadow-sm`} />
                  <div className="space-y-1.5 p-3 rounded-xl border border-border/60 bg-muted/40 hover:border-primary/30 transition-all shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <span className="text-[10px] font-black text-foreground/90 uppercase tracking-wider">{title}</span>
                      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold bg-white dark:bg-card px-2 py-1 rounded-md shadow-sm border border-border/50 w-fit">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDateTime(log.date)}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Collapsible Account/Bio Details for Mobile ────────────────────── */}
      <div className="block lg:hidden p-4 rounded-2xl border bg-white/60 dark:bg-card/60 backdrop-blur-xl border-border/50 shadow-sm">
        <button
          onClick={() => setShowPersonalDetails(v => !v)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <h4 className="text-[10px] font-black uppercase tracking-wider text-foreground">{t("companion.evaluation.accountDetailsTitle", "Chi tiết tài khoản & cá nhân")}</h4>
          </div>
          {showPersonalDetails ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <AnimatePresence>
          {showPersonalDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4 space-y-3 pt-3 border-t border-border/60 text-left"
            >
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/50">
                <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">{t("companion.evaluation.emailLabel", "Email liên hệ")}</p>
                  <p className="text-[10px] font-bold text-foreground/80 truncate">{bio?.email || "–"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/50">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">{t("utilities.vcard.fields.phone", "Số điện thoại")}</p>
                    <p className="text-[10px] font-bold text-foreground/80">{bio?.phone || "–"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/50">
                  <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">{t("companion.profile.birthday", "Ngày sinh")}</p>
                    <p className="text-[10px] font-bold text-foreground/80">{bio?.dob || "–"}</p>
                  </div>
                </div>
              </div>
              {(!bio?.phone || !bio?.dob) && (
                <p className="text-[9px] font-semibold text-warning bg-warning/10 p-2.5 rounded-lg border border-warning/30 mt-2">
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
