import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle, Clock, TrendingDown, Activity,
  User, Phone, Mail, Calendar,
  TrendingUp, Sparkles, ShieldCheck, ChevronDown, ChevronUp,
  Brain, Moon, Compass, Heart, Award, ArrowUpRight, CheckCircle2,
  FileText, Download, Zap, RefreshCw, Layers, LayoutGrid, Flame
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AuraMoodMap from "./charts/AuraMoodMap";
import { loadSecureMemory } from "./utils/secureMemory";
import { computeWeeklyDigest, checkPeriodicAssessmentDue } from "./utils/weeklyDigestHelper";

// ── Big Five Radar Chart Component ───────────────────────────────────────────
function BigFiveRadarChart({ traits, maxScore = 5 }) {
  const size = 170;
  const center = size / 2;
  const radius = center - 24;

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

  const labels = [
    { text: "Cởi mở", ...getPoint(maxScore + 0.85, angles[0]) },
    { text: "Tận tụy", ...getPoint(maxScore + 0.85, angles[1]) },
    { text: "Hướng ngoại", ...getPoint(maxScore + 0.85, angles[2]) },
    { text: "Dễ chịu", ...getPoint(maxScore + 0.85, angles[3]) },
    { text: "Nhạy cảm", ...getPoint(maxScore + 0.85, angles[4]) },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center p-2">
      <svg width={size} height={size} className="overflow-visible">
        {gridPolygons.map((poly, idx) => (
          <polygon
            key={idx}
            points={poly}
            fill="none"
            className="stroke-border/40"
            strokeWidth="1"
          />
        ))}
        {angles.map((angle, idx) => {
          const outer = getPoint(maxScore, angle);
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={outer.x}
              y2={outer.y}
              className="stroke-border/40"
              strokeWidth="1"
            />
          );
        })}
        <polygon
          points={polygonPath}
          className="fill-primary/25 stroke-primary"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="3.5"
            className="fill-primary stroke-background"
            strokeWidth="1.5"
          />
        ))}
        {labels.map((lbl, idx) => (
          <text
            key={idx}
            x={lbl.x}
            y={lbl.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[9px] font-black fill-foreground/90 tracking-tight"
          >
            {lbl.text}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ── Main EvaluationTab Component ─────────────────────────────────────────────
export default function EvaluationTab({
  historyLogs = [],
  sleepLogs = [],
  loadingSleep = false,
  onNavigateToTab = () => {},
  bio = {}
}) {
  const { t } = useTranslation();
  const [activeTabSection, setActiveTabSection] = useState("overview"); // overview, aura, psych, history
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [showDigestModal, setShowDigestModal] = useState(false);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "Không xác định";
    try {
      const d = new Date(dateStr);
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "Không xác định";
    }
  };

  // Filter clinical tests
  const dassTests = useMemo(() => historyLogs.filter(l => l.test === "dass42" || (l.type === "clinical_test" && l.test === "dass42")), [historyLogs]);
  const mmpiTests = useMemo(() => historyLogs.filter(l => l.test === "mmpi30" || (l.type === "clinical_test" && l.test === "mmpi30")), [historyLogs]);
  const phq9Tests = useMemo(() => historyLogs.filter(l => l.test === "phq9" || (l.type === "clinical_test" && l.test === "phq9")), [historyLogs]);
  const gad7Tests  = useMemo(() => historyLogs.filter(l => l.test === "gad7" || (l.type === "clinical_test" && l.test === "gad7")), [historyLogs]);
  const who5Tests  = useMemo(() => historyLogs.filter(l => l.test === "who5" || (l.type === "clinical_test" && l.test === "who5")), [historyLogs]);
  const checkins   = useMemo(() => historyLogs.filter(l => l.type === "checkin"), [historyLogs]);
  const bigFiveTests = useMemo(() => historyLogs.filter(l => l.test === "bigfive" || (l.type === "clinical_test" && l.test === "bigfive")), [historyLogs]);

  // Secure Memory & Traits
  const secureMemoryData = useMemo(() => loadSecureMemory(bio), [bio]);
  const personalityInsights = useMemo(() => {
    const TRIGGER_LABELS = {
      family: "Áp lực gia đình", studies: "Áp lực học tập", peers: "Áp lực bạn bè",
      love: "Áp lực tình cảm", health: "Áp lực giấc ngủ/sức khỏe"
    };
    const TRAIT_LABELS = {
      overthinking: "Xu hướng suy nghĩ nhiều (Overthinking)",
      perfectionism: "Xu hướng cầu toàn & sợ sai",
      introverted_preference: "Phong cách hướng nội / Cần khoảng không riêng",
      emotional_sensitivity: "Nhạy cảm cảm xúc"
    };

    const triggers = (secureMemoryData?.stressTriggers || []).map(t => TRIGGER_LABELS[t]).filter(Boolean);
    const traits = (secureMemoryData?.personalityTraits || []).map(p => TRAIT_LABELS[p]).filter(Boolean);
    const relationshipMap = {
      single_recently_broken_up: "Vừa chia tay gần đây",
      in_relationship: "Đang trong mối quan hệ",
      has_crush: "Đang có crush"
    };
    const relationship = secureMemoryData?.relationshipStatus ? relationshipMap[secureMemoryData.relationshipStatus] : null;

    return { triggers, traits, relationship };
  }, [secureMemoryData]);

  // Digest & Periodic assessment
  const weeklyDigest = useMemo(() => computeWeeklyDigest(historyLogs, bio, secureMemoryData), [historyLogs, bio, secureMemoryData]);
  const periodicAssessment = useMemo(() => checkPeriodicAssessmentDue(historyLogs), [historyLogs]);

  // Big Five Trait extraction
  const latestBigFiveLog = bigFiveTests.length > 0 ? bigFiveTests[bigFiveTests.length - 1] : null;
  const bigFiveTraits = latestBigFiveLog?.traits || bio?.testScores?.bigfive || {
    extraversion: 3.5, agreeableness: 3.8, conscientiousness: 4.0, neuroticism: 2.2, openness: 4.2
  };

  // Clinical metrics evaluation
  const getSeverityLabel = (sev) => {
    if (!sev) return { label: "Bình thường", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
    const map = {
      normal: { label: "Bình thường", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
      mild: { label: "Nhẹ", cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
      moderate: { label: "Vừa phải", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
      severe: { label: "Nặng", cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
      extremely_severe: { label: "Rất nặng", cls: "bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black" }
    };
    return map[sev] || { label: sev, cls: "bg-muted text-muted-foreground" };
  };

  const metricsRows = [
    { name: "PHQ-9 (Trầm Cảm)", scoreRaw: phq9Tests.length > 0 ? phq9Tests[phq9Tests.length - 1].score : null, severity: phq9Tests.length > 0 ? phq9Tests[phq9Tests.length - 1].severity : null, max: 27 },
    { name: "GAD-7 (Lo Âụ)", scoreRaw: gad7Tests.length > 0 ? gad7Tests[gad7Tests.length - 1].score : null, severity: gad7Tests.length > 0 ? gad7Tests[gad7Tests.length - 1].severity : null, max: 21 },
    { name: "WHO-5 (Hạnh Phúc)", scoreRaw: who5Tests.length > 0 ? who5Tests[who5Tests.length - 1].score : null, severity: who5Tests.length > 0 ? (who5Tests[who5Tests.length - 1].score * 4 >= 50 ? "normal" : "mild") : null, max: 25 },
    { name: "DASS-42 (Trầm Cảm)", scoreRaw: dassTests.length > 0 ? dassTests[dassTests.length - 1].scores?.D : null, severity: dassTests.length > 0 ? (dassTests[dassTests.length - 1].scores?.D > 13 ? "moderate" : "normal") : null, max: 42 },
    { name: "DASS-42 (Lo Âụ)", scoreRaw: dassTests.length > 0 ? dassTests[dassTests.length - 1].scores?.A : null, severity: dassTests.length > 0 ? (dassTests[dassTests.length - 1].scores?.A > 9 ? "moderate" : "normal") : null, max: 42 },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 text-left animate-fadeIn bg-transparent pb-28 max-w-7xl mx-auto">

      {/* ── SMART SEGMENTED TAB SWITCHER ──────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-muted/60 border border-border/60 shadow-inner overflow-x-auto">
        <button
          onClick={() => setActiveTabSection("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTabSection === "overview"
              ? "bg-white dark:bg-card text-primary shadow-sm border border-border/50 scale-[1.02]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Tổng Quan</span>
        </button>

        <button
          onClick={() => setActiveTabSection("aura")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTabSection === "aura"
              ? "bg-white dark:bg-card text-teal-600 dark:text-teal-400 shadow-sm border border-border/50 scale-[1.02]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hào Quang Cảm Xúc</span>
        </button>

        <button
          onClick={() => setActiveTabSection("psych")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTabSection === "psych"
              ? "bg-white dark:bg-card text-violet-600 dark:text-violet-400 shadow-sm border border-border/50 scale-[1.02]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Hồ Sơ Tâm Lý & Big Five</span>
        </button>

        <button
          onClick={() => setActiveTabSection("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTabSection === "history"
              ? "bg-white dark:bg-card text-accent shadow-sm border border-border/50 scale-[1.02]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Lịch Sử & Tiến Trình</span>
        </button>
      </div>

      {/* ── TAB SECTION 1: OVERVIEW ────────────────────────────────────────── */}
      {activeTabSection === "overview" && (
        <div className="space-y-6 animate-fadeIn">
          {/* HERO RECOVERY SCORE CARD */}
          <div className="p-6 rounded-3xl border bg-gradient-to-r from-primary/10 via-accent/5 to-primary/5 dark:from-primary/20 dark:via-card/40 dark:to-card/20 backdrop-blur-2xl border-primary/20 shadow-lg relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary/15 text-primary border border-primary/20">
                    ⭐ Thang Điểm Phục Hồi Thích Ứng
                  </span>
                  {periodicAssessment.isDue && (
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                      ⏰ Đến Hạn Tái Đánh Giá 7 Ngày
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground leading-tight">
                  Đánh Giá Sức Khỏe Tinh Thần Tổng Quan
                </h2>
                <p className="text-xs sm:text-sm text-foreground/80 font-bold leading-relaxed">
                  {weeklyDigest.weeklyAiEncouragement}
                </p>
              </div>

              {/* Gauge Score Ring */}
              <div className="flex items-center gap-4 shrink-0 bg-white/80 dark:bg-card/80 backdrop-blur-xl p-4 rounded-2xl border border-border/60 shadow-md">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="stroke-muted"
                      strokeWidth="3.5"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="stroke-primary transition-all duration-1000 ease-out"
                      strokeDasharray={`${weeklyDigest.overallRecoveryScore}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-sm font-black text-primary">
                    {weeklyDigest.overallRecoveryScore}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Điểm Phục Hồi</p>
                  <p className="text-xs font-black text-foreground">{weeklyDigest.overallRecoveryScore >= 75 ? "Phục hồi rất tốt" : "Duy trì ổn định"}</p>
                  <button
                    onClick={() => onNavigateToTab("chat")}
                    className="mt-1.5 flex items-center gap-1 text-[9.5px] font-black text-primary hover:underline"
                  >
                    Trò chuyện AI ngay <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* BENTO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* WEEKLY DIGEST CARD */}
            <div className="col-span-1 md:col-span-2 p-5 rounded-2xl border bg-white/70 dark:bg-card/70 backdrop-blur-xl border-border/60 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Báo Cáo Nhật Ký Chữa Lành Hàng Tuần (Weekly Digest)
                  </h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                  7 ngày gần nhất
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-center">
                  <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Streak Check-in</p>
                  <p className="text-base font-black text-primary mt-0.5">{weeklyDigest.checkinDaysCount}/7 ngày</p>
                </div>
                <div className="p-3 rounded-xl bg-accent/5 border border-accent/15 text-center">
                  <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Bài Tập Hoàn Thành</p>
                  <p className="text-base font-black text-accent mt-0.5">{weeklyDigest.activityCount} lượt</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center">
                  <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Biến Thiên PHQ-9</p>
                  <p className={`text-base font-black mt-0.5 ${weeklyDigest.phq9Delta < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                    {weeklyDigest.phq9Delta < 0 ? `${weeklyDigest.phq9Delta}đ (Giảm)` : "Ổn định"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <p className="text-[9.5px] font-bold text-muted-foreground">Tổng ghi nhận: {weeklyDigest.totalLogsCount} hoạt động</p>
                <button
                  onClick={() => setShowDigestModal(true)}
                  className="flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  Xem chi tiết báo cáo
                </button>
              </div>
            </div>

            {/* 7-DAY ASSESSMENT TRACKER */}
            <div className="col-span-1 p-5 rounded-2xl border bg-white/70 dark:bg-card/70 backdrop-blur-xl border-border/60 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-accent" />
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-foreground">
                    Tái Đánh Giá Định Kỳ 7 Ngày
                  </h4>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-muted-foreground">Chu kỳ:</span>
                  <span className="text-foreground font-black">7 ngày / lượt</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-muted-foreground">Lần test gần nhất:</span>
                  <span className="text-primary font-black">{periodicAssessment.daysElapsed} ngày trước</span>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-[9.5px] font-bold leading-relaxed text-foreground/80">
                  {periodicAssessment.isDue
                    ? "⚠️ Đã đến hạn tái đánh giá định kỳ 7 ngày! Hãy thực hiện một bài test ngắn bên dưới để AI cập nhật lộ trình."
                    : `✅ Chỉ số đang duy trì theo dõi tốt (${periodicAssessment.daysElapsed} ngày kể từ bài test gần nhất).`}
                </div>
              </div>

              <button
                onClick={() => onNavigateToTab("chat")}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent/15 to-primary/15 border border-accent/30 text-[9.5px] font-black uppercase tracking-wider text-accent active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                {periodicAssessment.isDue ? "Thực hiện tái đánh giá" : "Làm lại bài test"}
              </button>
            </div>
          </div>

          {/* CLINICAL PROGRESS BARS */}
          <div className="p-5 rounded-2xl border bg-white/70 dark:bg-card/70 backdrop-blur-xl border-border/60 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Bảng Chỉ Số Khám Lâm Sàng</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metricsRows.map((row, idx) => {
                const score = row.scoreRaw;
                const pct = score != null ? Math.min((score / row.max) * 100, 100) : 0;
                const { label: sevLabel, cls: sevCls } = getSeverityLabel(row.severity);

                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                      <span className="text-foreground">{row.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold ${sevCls}`}>
                        {score != null ? `${score}/${row.max} (${sevLabel})` : "Chưa đo"}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      {score != null && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full rounded-full bg-primary"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB SECTION 2: AURA MOOD MAP ────────────────────────────────────── */}
      {activeTabSection === "aura" && (
        <div className="space-y-6 animate-fadeIn">
          <AuraMoodMap historyLogs={historyLogs} />
        </div>
      )}

      {/* ── TAB SECTION 3: PSYCH PROFILE & BIG FIVE ─────────────────────────── */}
      {activeTabSection === "psych" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-5 rounded-2xl border bg-white/70 dark:bg-card/70 backdrop-blur-xl border-border/60 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                <h4 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Hồ Sơ Tâm Lý & Nhân Cách Cá Nhân Hóa
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-violet-500/10 text-violet-600 dark:text-violet-400">
                Ghi nhận hội thoại
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Radar Chart */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/20 border border-border/50">
                <h5 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">Biểu Đồ Nét Tính Cách Big Five</h5>
                <BigFiveRadarChart traits={bigFiveTraits} />
              </div>

              {/* Stress Triggers & Traits */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-primary">
                    <AlertTriangle className="w-4 h-4" />
                    <h5 className="text-[10px] font-black uppercase tracking-wider">Chủ Đề Áp Lực Hay Gặp</h5>
                  </div>
                  {personalityInsights.triggers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {personalityInsights.triggers.map((trig, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold">
                          {trig}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10.5px] text-muted-foreground font-semibold pt-1">Chưa có chủ đề đặc thù.</p>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-accent">
                    <Compass className="w-4 h-4" />
                    <h5 className="text-[10px] font-black uppercase tracking-wider">Xu Hướng Nét Tâm Lý</h5>
                  </div>
                  {personalityInsights.traits.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {personalityInsights.traits.map((tr, i) => (
                        <p key={i} className="text-[10.5px] font-bold text-foreground/90 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                          {tr}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10.5px] text-muted-foreground font-semibold pt-1">Đang tự động phân tích qua hội thoại...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB SECTION 4: HISTORY & PROGRESS ─────────────────────────────── */}
      {activeTabSection === "history" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-5 rounded-2xl border bg-white dark:bg-card border-border/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h4 className="text-sm font-black uppercase tracking-wider text-foreground">Lịch Sử Điều Trị & Phân Tích</h4>
              </div>
              {historyLogs.length > 4 && (
                <button
                  onClick={() => setTimelineExpanded(v => !v)}
                  className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-primary hover:underline"
                >
                  {timelineExpanded ? "Thu gọn" : "Xem tất cả"}
                </button>
              )}
            </div>

            {historyLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-[11px] font-bold">
                Chưa ghi nhận hoạt động trị liệu hoặc kiểm tra nào.
              </div>
            ) : (
              <div className={`relative border-l-2 border-border ml-4 space-y-6 py-2 overflow-hidden transition-all duration-300 ${timelineExpanded ? "max-h-[9999px]" : "max-h-80"}`}>
                {[...historyLogs].reverse().map((log, idx) => {
                  let title = "Hoạt động trị liệu";
                  let color = "bg-primary border-primary/30";
                  let desc  = log.reason || log.desc || "";

                  const moodLabels = { 5: "Rất tốt", 4: "Tốt", 3: "Bình thường", 2: "Mỏi mệt", 1: "Kiệt sức" };

                  if (log.type === "checkin") {
                    title = "Check-in cảm xúc";
                    color = "bg-emerald-500 border-emerald-500/30";
                    desc  = `Đánh giá tâm trạng: ${moodLabels[log.mood] || ""}. ${log.note ? `Ghi chú: "${log.note}"` : ""}`;
                  } else if (log.test) {
                    title = `Thực hiện test ${log.test.toUpperCase()}`;
                    color = "bg-sky-500 border-sky-500/30";
                    if (log.test === "dass42") {
                      desc = `Kết quả: Trầm cảm ${log.scores?.D ?? 0}/42, Lo âu ${log.scores?.A ?? 0}/42, Căng thẳng ${log.scores?.S ?? 0}/42.`;
                    } else {
                      desc = `Điểm số đánh giá: ${log.score} điểm.`;
                    }
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
        </div>
      )}

      {/* ── WEEKLY HEALING DIGEST MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {showDigestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border/60 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-left relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-black text-foreground">Báo Cáo Nhật Ký Chữa Lành Hàng Tuần</h3>
                </div>
                <button
                  onClick={() => setShowDigestModal(false)}
                  className="p-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs font-bold text-foreground/90">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-primary">Điểm Phục Hồi Tinh Thần Hàng Tuần</p>
                  <p className="text-2xl font-black text-primary">{weeklyDigest.overallRecoveryScore}/100 Điểm</p>
                  <p className="text-[10.5px] text-foreground/80 leading-relaxed">{weeklyDigest.weeklyAiEncouragement}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                    <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Streak Check-in Cảm Xúc</p>
                    <p className="text-base font-black text-foreground mt-0.5">{weeklyDigest.checkinDaysCount} / 7 ngày</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                    <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Hoạt Động Trị Liệu</p>
                    <p className="text-base font-black text-foreground mt-0.5">{weeklyDigest.activityCount} lượt hoàn thành</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDigestModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md"
                >
                  Đóng Báo Cáo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
