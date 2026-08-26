import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import {
  Award, ArrowLeft, Smartphone, CheckCircle, BookOpen,
  Sparkles, ListChecks, Play, ChevronDown, ChevronUp, Lock,
  Terminal, Shield, Zap, Trophy, Cpu, ChevronRight, Target, Library
} from "lucide-react";
import InteractivePuzzles from "./InteractivePuzzles";
import { renderMobileIllustration, renderVisualArtwork } from "./VisualIllustrations";
import FeatureGate from "../shared/FeatureGate";
import { notify } from "../../../lib/notify";
import { STUDY_ALL_STAGES_PRICE } from "../../../../shared/joyPrices.js";
import { joyText } from "../../../lib/joyDisplay";
import { getLessonReading } from "./lessons";

// Giá học tập tính bằng JOY gốc — server tính lại khi trừ ví, đây là số hiện ra.
const ALL_STAGES_PRICE = STUDY_ALL_STAGES_PRICE;
const MAINTENANCE_PRICE = 50;


export default function MobileGuidebook({
  embedded = false,
  onExitLesson,
  activeCourseId,
  bio,
  onBioUpdate,
  onBack,
  completedLessons,
  mobileProgress,
  mobileCourse,
  mobileCompletedCount,
  WEB_COURSES,
  STAGES,
  getStageBenefits,
  setActiveCourseId,
  setMobileStudyMode,
  setVerificationStatus,
  getLessonTierAndAccess,
  handleExchangeSubscription,
  exchangeSubmitting,
  handleBuyLifetimeUnlock,
  handleClaimMilestoneReward,
  mobileStudyMode,
  mobileVisualSet,
  mobileExtra,
  timeLeft,
  verificationStatus,
  mobileRunKey,
  setMobileRunKey,
  mobileDemoCode,
  canPreviewMobileCourse,
  currentMobileCourseIndex,
  handlePrevMobileLesson,
  handleNextMobileLesson,
  onShowCertificate,
  handlePayMaintenance,
  handleBuyAllStagesBundle,
  // Puzzle props
  interactivePassed,
  miniQuizAnswers,
  setMiniQuizAnswers,
  setMiniQuizPassed,
  handleRewardMobileLesson,
  htmlBlocks,
  sqlBlocks,
  moveBlock,
  themeBg,
  setThemeBg,
  themeText,
  setThemeText,
  clickCount,
  setClickCount,
  matchedPairs,
  handlePairMatch,
  blankAnswers,
  setBlankAnswers,
  screenshotFile,
  handleScreenshotSelect,
  isScanning,
  scanProgress,
  scanScore,
  quizQuestions,
  quizCompleted,
  quizScore,
  quizReview,
  quizCurrentIndex,
  setQuizCurrentIndex,
  quizAnswers,
  setQuizAnswers,
  handleRetakeQuiz,
  verifyInteractivePractice
}) {
  const { t } = useTranslation();
  const [expandedPhases, setExpandedPhases] = React.useState({
    basic: true,
    intermediate: false,
    advanced: false,
    security: false,
    project: false,
    devops: false
  });

  const togglePhase = (phaseId) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  const rankTitle = React.useMemo(() => {
    if (mobileCompletedCount < 10) return "Học viên Sơ cấp";
    if (mobileCompletedCount < 25) return "Lập trình viên Sơ cấp";
    if (mobileCompletedCount < 50) return "Lập trình viên Trung cấp";
    if (mobileCompletedCount < 70) return "Kỹ sư Bảo mật & AI";
    if (mobileCompletedCount < 90) return "Kỹ sư Full-Stack Chuyên nghiệp";
    return "Kỹ sư DevOps — Phát hành sản phẩm thật";
  }, [mobileCompletedCount]);

  const phaseMeta = {
    basic: {
      gradient: "from-blue-500/10 via-indigo-500/5 to-transparent border-blue-500/20 dark:border-blue-500/30",
      accentColor: "text-blue-500 dark:text-blue-400 border-blue-500/30",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      barColor: "bg-gradient-to-r from-blue-500 to-indigo-500",
      subtext: "Gõ cho thuộc lòng: HTML, CSS, JS, SQL, PHP",
      icon: <Terminal className="w-4.5 h-4.5 text-blue-500" />
    },
    intermediate: {
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20 dark:border-emerald-500/30",
      accentColor: "text-emerald-500 dark:text-emerald-400 border-emerald-500/30",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      barColor: "bg-gradient-to-r from-emerald-500 to-teal-500",
      subtext: "Tư duy hệ thống: Schema, MVC, REST & chuẩn UI/UX",
      icon: <Cpu className="w-4.5 h-4.5 text-emerald-500" />
    },
    advanced: {
      gradient: "from-violet-500/10 via-purple-500/5 to-transparent border-violet-500/20 dark:border-violet-500/30",
      accentColor: "text-violet-500 dark:text-violet-400 border-violet-500/30",
      badgeColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
      barColor: "bg-gradient-to-r from-violet-500 to-purple-500",
      subtext: "Lõi CS: cấu trúc dữ liệu, giải thuật & mật mã học",
      icon: <BookOpen className="w-4.5 h-4.5 text-violet-500" />
    },
    security: {
      gradient: "from-rose-500/10 via-pink-500/5 to-transparent border-rose-500/20 dark:border-rose-500/30",
      accentColor: "text-rose-500 dark:text-rose-400 border-rose-500/30",
      badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      barColor: "bg-gradient-to-r from-rose-500 to-pink-500",
      subtext: "OWASP, JWT/OAuth2, Gemini AI & quy trình dự án",
      icon: <Shield className="w-4.5 h-4.5 text-rose-500" />
    },
    project: {
      gradient: "from-cyan-500/10 via-sky-500/5 to-transparent border-cyan-500/20 dark:border-cyan-500/30",
      accentColor: "text-cyan-500 dark:text-cyan-400 border-cyan-500/30",
      badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      barColor: "bg-gradient-to-r from-cyan-500 to-sky-500",
      subtext: "Siêu đồ án: Full-Stack + Chat realtime + AI",
      icon: <Zap className="w-4.5 h-4.5 text-cyan-500" />
    },
    devops: {
      gradient: "from-yellow-500/15 via-amber-500/5 to-transparent border-yellow-500/30 dark:border-yellow-500/45",
      accentColor: "text-yellow-500 dark:text-yellow-400 border-yellow-500/30",
      badgeColor: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      barColor: "bg-gradient-to-r from-yellow-500 to-amber-500",
      subtext: "DevOps: VPS, Nginx, SSL & phát hành thật",
      icon: <Trophy className="w-4.5 h-4.5 text-yellow-500" />
    }
  };

  const phases = STAGES.map((stage) => ({
    ...stage,
    lessons: WEB_COURSES.slice(stage.from, stage.to)
  }));

  const guidebookBody = (
      <div className={`bg-[#f8fafc] dark:bg-[#09090b] text-foreground overflow-y-auto ${embedded ? "h-full w-full" : "fixed inset-0 z-50"}`}>
        <style>{`
          @keyframes hugoCodeFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          @keyframes hugoCodeGlow {
            0%, 100% { box-shadow: 0 0 0 rgba(79, 70, 229, 0); }
            50% { box-shadow: 0 16px 35px rgba(79, 70, 229, 0.16); }
          }
          @keyframes hugoCodeSlide {
            0% { transform: translateX(-85%); opacity: .35; }
            50% { opacity: 1; }
            100% { transform: translateX(115%); opacity: .35; }
          }
          @keyframes hugoCodePulse {
            0%, 100% { transform: scaleX(.92); opacity: .55; }
            50% { transform: scaleX(1); opacity: 1; }
          }
        `}</style>
        {!embedded && (
        <header className="sticky top-0 z-20 border-b border-border bg-white/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top,16px)+12px)] backdrop-blur-xl dark:bg-zinc-950/95">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={activeCourseId ? () => {
                setActiveCourseId(null);
                setVerificationStatus(null);
              } : onBack}
              className={`w-11 h-11 rounded-xl border border-border bg-background items-center justify-center text-foreground active:scale-95 transition-all shadow-sm ${
                embedded && !activeCourseId ? "hidden" : "flex"
              }`}
              aria-label={t("hugoCoderLearning.guidebook.quayLai")}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase text-primary">Study with Hugo · Web</p>
              <h2 className="text-sm font-black truncate">
                {activeCourseId && mobileCourse ? mobileCourse.title : t("hugoCoderLearning.guidebook.sachHuongDanLap")}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${mobileProgress}%` }} />
          </div>
        </header>
        )}

        <main className="px-4 py-5 pb-24 space-y-5">
          {!activeCourseId || !mobileCourse ? (
            /* ==========================================================
               1. TABLE OF CONTENTS (MỤC LỤC BÀI HỌC)
               ========================================================== */
            <section className="space-y-6 font-sans animate-fadeIn">
              {/* Premium Progress Summary Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-indigo-950 to-zinc-950 text-white p-6 border border-indigo-500/20 shadow-xl">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[9px] font-black tracking-widest text-indigo-300 uppercase">
                    {rankTitle}
                  </span>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/25">
                    {mobileProgress}{t("hugoCoderLearning.guidebook.hoanThanh")}
                  </span>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-base font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">Web Development Academy</h3>
                  <p className="text-[11px] text-zinc-400 mt-1">{t("hugoCoderLearning.guidebook.daChinhPhuc")} {mobileCompletedCount} {t("hugoCoderLearning.guidebook.trenTongSo")} {WEB_COURSES.length} {t("hugoCoderLearning.guidebook.baiHocThucChien")}</p>
                </div>
                
                <div className="mt-5 space-y-1.5">
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{ width: `${mobileProgress}%` }} />
                  </div>
                </div>

                {/* Maintenance status display */}
                <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-col gap-2">
                  {bio?.hugoCoderAll7Lifetime ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      {t("hugoCoderLearning.guidebook.soHuuTronGoi")}
                    </div>
                  ) : (() => {
                    const expiresAt = bio?.featureSubscriptions?.hugoCoder?.expiresAt;
                    if (!expiresAt) {
                      return (
                        <div className="text-[10px] text-zinc-400">
                          {t("hugoCoderLearning.guidebook.chuaKichHoatPhi")}
                        </div>
                      );
                    }
                    const expTime = new Date(expiresAt).getTime();
                    const now = Date.now();
                    const isExpired = expTime <= now;
                    if (isExpired) {
                      const resetTime = expTime + 90 * 24 * 60 * 60 * 1000;
                      const daysUntilReset = Math.ceil((resetTime - now) / (24 * 60 * 60 * 1000));
                      return (
                        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-2.5 space-y-1.5 text-left text-red-200">
                          <div className="text-[10.5px] font-black flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                            {t("hugoCoderLearning.guidebook.phiBaoTriDa")}
                          </div>
                          <p className="text-[9.5px] text-zinc-300 leading-normal">
                            {t("hugoCoderLearning.guidebook.vuiLongGiaHan")} <strong>{daysUntilReset > 0 ? daysUntilReset : 0} {t("hugoCoderLearning.guidebook.ngay")}</strong> {t("hugoCoderLearning.guidebook.dongPhiTruocKhi")}
                          </p>
                        </div>
                      );
                    } else {
                      const daysLeft = Math.ceil((expTime - now) / (24 * 60 * 60 * 1000));
                      return (
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-zinc-400">{t("hugoCoderLearning.guidebook.phiBaoTriHang")}</span>
                          <span className="font-bold text-emerald-400">{t("hugoCoderLearning.guidebook.daKichHoatCon")} {daysLeft} {t("hugoCoderLearning.guidebook.ngay2")}</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Title & Total Complete Stats */}
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider">{t("hugoCoderLearning.guidebook.mucLucLoTrinh")}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t("hugoCoderLearning.guidebook.vuiLongHocTuan")}</p>
                </div>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">{mobileCompletedCount}/{WEB_COURSES.length} {t("hugoCoderLearning.guidebook.baiDaHoc")}</span>
              </div>
              
              {/* Stages List */}
              <div className="space-y-4">
                {phases.map((phase) => {
                  const completedCount = phase.lessons.filter(l => completedLessons.includes(l.id)).length;
                  const isPhaseCompleted = completedCount === phase.lessons.length;
                  const isExpanded = expandedPhases[phase.id];
                  const globalStartIndex = phase.from;
                  const meta = phaseMeta[phase.id] || phaseMeta.basic;
                  const progressPercent = Math.round((completedCount / phase.lessons.length) * 100) || 0;

                  return (
                    <div key={phase.id} className="border border-border/80 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/40 shadow-sm hover:shadow-md transition-all">
                      {/* Header Card */}
                      <div
                        onClick={() => togglePhase(phase.id)}
                        className={`flex items-center justify-between p-4 bg-gradient-to-br ${meta.gradient} border-b border-border/50 select-none cursor-pointer`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Phase Icon */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${meta.badgeColor}`}>
                            {meta.icon}
                          </div>
                          <div className="text-left min-w-0">
                            <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase">{phase.rangeText}</span>
                            <h4 className="font-black text-xs text-foreground tracking-wide truncate">{phase.title}</h4>
                            <p className="text-[9.5px] text-muted-foreground truncate leading-normal mt-0.5">{meta.subtext}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] font-black text-foreground">{completedCount}/{phase.lessons.length}</span>
                          </div>
                          
                          {isPhaseCompleted ? (
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-success/20 border border-success/40 text-success text-[10px] font-black shadow-sm">
                              ✓
                            </span>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Phase completion percent track line */}
                      <div className="w-full h-[3px] bg-muted relative">
                        <div className={`h-full ${meta.barColor} transition-all duration-500`} style={{ width: `${progressPercent}%` }} />
                      </div>

                      {/* Phase Content */}
                      {isExpanded && (
                        <div className="p-3.5 space-y-3.5 bg-zinc-50/50 dark:bg-zinc-950/20">
                          {/* Giới thiệu chặng: kiến thức — thách thức — hứa hẹn */}
                          {phase.intro && (
                            <div className={`rounded-2xl border bg-gradient-to-br ${meta.gradient} p-3.5 space-y-2.5`}>
                              <p className={`text-[11px] font-black italic ${meta.accentColor.split(" ")[0]}`}>“{phase.intro.tagline}”</p>
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t("hugoCoderLearning.guidebook.banSeHoc")}</span>
                                <div className="flex flex-wrap gap-1">
                                  {phase.intro.learn.map((item, i) => (
                                    <span key={i} className={`text-[9.5px] font-bold px-2 py-1 rounded-full border ${meta.badgeColor}`}>{item}</span>
                                  ))}
                                </div>
                              </div>
                              <p className="text-[10.5px] leading-5 text-muted-foreground"><strong className="text-foreground">{t("hugoCoderLearning.guidebook.thachThuc")}</strong> {phase.intro.challenge}</p>
                              <p className="text-[10.5px] leading-5 text-muted-foreground"><strong className="text-foreground">{t("hugoCoderLearning.guidebook.huaHen")}</strong> {phase.intro.promise}</p>
                            </div>
                          )}

                          {/* Certificate Reward Card if Completed */}
                          {isPhaseCompleted && (
                            <div className="bg-gradient-to-br from-amber-500/15 via-yellow-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 text-center space-y-3 shadow-md animate-fadeIn relative overflow-hidden">
                              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-12 h-12 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                              <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider">
                                <Trophy className="w-4.5 h-4.5 text-amber-400 animate-bounce" />
                                {t("hugoCoderLearning.guidebook.chucMungHoanThanh")} {phase.title}
                              </div>
                              
                              {bio?.slug && (
                                <a
                                  href={`/certificate/${bio.slug}/${phase.phaseNumber}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-full py-2 text-center bg-foreground text-background font-black rounded-xl text-[10px] uppercase tracking-wider transition-all active:scale-[0.98]"
                                >
                                  {t("hugoCoderLearning.guidebook.xemChiaSeGiay")}
                                </a>
                              )}

                              {[3, 4, 5].includes(phase.phaseNumber) && (() => {
                                const claimKeysByPhase = {
                                  3: ["hugoCoderRewardClaimed3"],
                                  4: ["hugoCoderRewardClaimed4", "hugoCoderRewardClaimed5", "hugoCoderRewardClaimed6"],
                                  5: ["hugoCoderRewardClaimed7"]
                                };
                                const hasClaimed = (claimKeysByPhase[phase.phaseNumber] || []).some((k) => !!bio?.[k]);
                                return (
                                  <div className="space-y-2.5">
                                    <p className="text-[10px] text-muted-foreground leading-relaxed font-sans">
                                      {t("hugoCoderLearning.guidebook.banDaHoanThanh")}
                                    </p>
                                    {hasClaimed ? (
                                      <div className="py-2.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-black rounded-xl text-[10px] uppercase tracking-widest shadow-sm">
                                        {t("hugoCoderLearning.guidebook.daNhanThuong800")}
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleClaimMilestoneReward(phase.phaseNumber)}
                                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 font-black rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                                      >
                                        {t("hugoCoderLearning.guidebook.nhanPhanThuong800")}
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}

                              {phase.phaseNumber === 6 && (() => {
                                const status = bio?.hugoCoderProjectStatus || 'idle';
                                const certUrl = bio?.hugoCoderCertificateUrl || '';
                                const adminNote = bio?.hugoCoderProjectAdminNote || '';
                                
                                return (
                                  <div className="space-y-2.5 text-[10px] font-sans text-muted-foreground">
                                    {status === 'idle' && (
                                      <p className="leading-relaxed">
                                        {t("hugoCoderLearning.guidebook.hayHoanThanhDo")} <strong>{t("hugoCoderLearning.guidebook.bai100")}</strong> {t("hugoCoderLearning.guidebook.deNhanDanhGia")}
                                      </p>
                                    )}
                                    {status === 'pending' && (
                                      <div className="p-3 bg-amber-500/15 border border-amber-500/25 rounded-xl text-amber-600 dark:text-amber-400 font-black shadow-sm">
                                        {t("hugoCoderLearning.guidebook.dangChoDuyetDo")}
                                        <p className="text-[9px] font-normal text-muted-foreground mt-1">{t("hugoCoderLearning.guidebook.hugoStudioDangRa")}</p>
                                      </div>
                                    )}
                                    {status === 'rejected' && (
                                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive font-black text-left space-y-1.5 shadow-sm">
                                        <div>{t("hugoCoderLearning.guidebook.doAnChuaDat")}</div>
                                        {adminNote && <p className="text-[9px] font-normal text-zinc-300">{t("hugoCoderLearning.guidebook.phanHoi")} {adminNote}</p>}
                                        <p className="text-[9px] font-normal text-muted-foreground">{t("hugoCoderLearning.guidebook.banCoTheSua")}</p>
                                      </div>
                                    )}
                                    {status === 'approved' && (
                                      <div className="space-y-2.5">
                                        <div className="p-3 bg-emerald-500/15 border border-emerald-500/25 rounded-xl text-emerald-600 dark:text-emerald-400 font-black shadow-sm">
                                          {t("hugoCoderLearning.guidebook.doAnDaDuoc")}
                                          <p className="text-[9px] font-normal text-muted-foreground mt-1">{t("hugoCoderLearning.guidebook.daNhanThuongHoan")}</p>
                                        </div>
                                        {certUrl ? (
                                          <a
                                            href={certUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full py-2.5 text-center bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-zinc-950 font-black rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-md"
                                          >
                                            {t("hugoCoderLearning.guidebook.nhanChungNhanHoan")}
                                          </a>
                                        ) : (
                                          <p className="text-[9px] text-amber-400 font-bold">{t("hugoCoderLearning.guidebook.chungNhanDangDuoc")}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* List of Lessons inside phase */}
                          <div className="space-y-2">
                            {phase.lessons.map((course, idx) => {
                              const index = globalStartIndex + idx;
                              const isActive = mobileCourse?.id === course.id;
                              const isCompleted = completedLessons.includes(course.id);
                              const isLocked = index > 0 && !completedLessons.includes(WEB_COURSES[index - 1].id);

                              return (
                                <div
                                  key={course.id}
                                  onClick={() => {
                                    if (isLocked) {
                                      notify.error(t("hugoCoderLearning.guidebook.vuiLongHoanThanh"));
                                      return;
                                    }
                                    setActiveCourseId(course.id);
                                    setMobileStudyMode("story");
                                    setVerificationStatus(null);
                                  }}
                                  className={`group flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all text-left relative ${
                                    isLocked
                                      ? "opacity-45 bg-zinc-100/10 dark:bg-zinc-800/10 border-transparent cursor-not-allowed"
                                      : isActive
                                        ? "bg-primary/10 border-primary shadow-[0_0_12px_rgba(79,70,229,0.1)] text-primary"
                                        : "bg-white dark:bg-zinc-900 border-border hover:border-primary/45 active:bg-primary/5 cursor-pointer shadow-sm"
                                  }`}
                                >
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    {/* Beautiful index pill */}
                                    <div className={`w-6 h-6 rounded-lg font-mono text-[10px] font-black flex items-center justify-center border shrink-0 ${
                                      isLocked
                                        ? "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground/50 border-zinc-200 dark:border-zinc-700"
                                        : isActive
                                          ? "bg-primary text-white border-primary"
                                          : "bg-muted text-muted-foreground border-border"
                                    }`}>
                                      {String(index + 1).padStart(2, "0")}
                                    </div>
                                    <div className="min-w-0 flex flex-col">
                                      <span className={`text-[12.5px] font-black truncate leading-tight ${
                                        isLocked 
                                          ? "text-muted-foreground/60" 
                                          : isActive
                                            ? "text-primary"
                                            : "text-foreground"
                                      }`}>
                                        {course.title.replace(/^\d+\.\s*/, "")}
                                      </span>
                                      <span className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[200px]">
                                        {course.file || t("hugoCoderLearning.guidebook.thucHanhLyThuyet")}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {isCompleted ? (
                                      <div className="w-5 h-5 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                      </div>
                                    ) : isLocked ? (
                                      <Lock className="w-3.5 h-3.5 text-muted-foreground/45" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                        <Play className="w-2.5 h-2.5 translate-x-[0.5px]" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (() => {
            /* ==========================================================
               2. ACTIVE LESSON PAGE (NỘI DUNG BÀI HỌC CHI TIẾT)
               ========================================================== */
            const tierInfo = getLessonTierAndAccess(mobileCourse?.id);
            if (!tierInfo.hasAccess) {
              const showLifetimeOption = 
                (tierInfo.tier === "intermediate" && completedLessons.includes("lesson25")) ||
                (tierInfo.tier === "advanced" && completedLessons.includes("lesson50")) ||
                (tierInfo.tier === "security" && completedLessons.includes("lesson70")) ||
                (tierInfo.tier === "project" && completedLessons.includes("lesson90")) ||
                (tierInfo.tier === "devops" && (completedLessons.includes("lesson100") || bio?.hugoCoderProjectStatus === 'approved'));

              return (
                <div className="space-y-4 font-sans animate-fadeIn">
                  <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-5 text-center space-y-4 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-2xl animate-pulse">lock</span>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-black text-xs text-foreground uppercase tracking-wider">{mobileCourse.title}</h4>
                      <span className="inline-block px-3 py-1 rounded-full bg-muted border border-border text-[9px] font-bold text-muted-foreground">
                        {tierInfo.tierLabel}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {!tierInfo.lifetime 
                        ? t("hugoCoderLearning.guidebook.noiDungBaiHoc")
                        : t("hugoCoderLearning.guidebook.thueBaoBaoTri")}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Case 1: Stage not yet purchased/unlocked */}
                    {!tierInfo.lifetime && (
                      <>
                        {/* Option 1: Lifetime Stage Unlock */}
                        <div className="border border-border bg-white dark:bg-zinc-900 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-foreground">{t("hugoCoderLearning.guidebook.moKhoaVinhVien")}</span>
                            <span className="font-black text-primary">{joyText(tierInfo.price)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {t("hugoCoderLearning.guidebook.moKhoaVinhVien2")} {tierInfo.tierLabel}.
                          </p>
                          <div className="rounded-xl border border-border bg-background p-3 space-y-1.5 text-left">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">{t("hugoCoderLearning.guidebook.trongGoiNayBan")}</span>
                            {getStageBenefits(tierInfo.tier).map((b, i) => (
                              <p key={i} className="text-[10.5px] leading-5 text-muted-foreground">— {b}</p>
                            ))}
                          </div>
                          <button
                            onClick={() => handleBuyLifetimeUnlock(tierInfo.tier)}
                            disabled={exchangeSubmitting}
                            className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow active:scale-95 disabled:opacity-50"
                          >
                            {t("hugoCoderLearning.guidebook.moKhoaChangVinh")}
                          </button>
                        </div>

                        {/* Option 2: Buy All 6 Stages Bundle */}
                        <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-amber-500 flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-amber-400" />
                              {t("hugoCoderLearning.guidebook.tronGoiVinhVien")}
                            </span>
                            <span className="font-black text-amber-500">{joyText(ALL_STAGES_PRICE)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {t("hugoCoderLearning.guidebook.moKhoaToanBo")} <strong>{t("hugoCoderLearning.guidebook.mienPhiPhiBao")}</strong>.
                          </p>
                          <button
                            onClick={() => handleBuyAllStagesBundle()}
                            disabled={exchangeSubmitting}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow active:scale-95 disabled:opacity-50"
                          >
                            {t("hugoCoderLearning.guidebook.muaTronGoi16k")}
                          </button>
                        </div>
                      </>
                    )}

                    {/* Case 2: Stage unlocked but maintenance expired */}
                    {tierInfo.lifetime && !tierInfo.maintenanceActive && (
                      <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-red-500">{t("hugoCoderLearning.guidebook.giaHanPhiBao")}</span>
                          <span className="font-black text-red-500">{joyText(MAINTENANCE_PRICE)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {t("hugoCoderLearning.guidebook.phiBaoTriCan")}
                        </p>
                        <button
                          onClick={() => handlePayMaintenance()}
                          disabled={exchangeSubmitting}
                          className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow active:scale-95 disabled:opacity-50"
                        >
                          {t("hugoCoderLearning.guidebook.dongPhiBaoTri")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            const isCurrentCompleted = completedLessons.includes(mobileCourse?.id);
            const hasNextLesson = currentMobileCourseIndex < WEB_COURSES.length - 1;
            const lessonSteps = ["story", "guide", "practice", "review"];
            const activeStepIndex = Math.max(0, lessonSteps.indexOf(mobileStudyMode));
            const goToLessonStep = (nextIndex) => {
              if (nextIndex < 0) return;
              if (nextIndex >= lessonSteps.length) {
                if (hasNextLesson) handleNextMobileLesson();
                return;
              }
              if (nextIndex === 3 && !isCurrentCompleted && verificationStatus !== "success") {
                notify.error(t("hugoCoderLearning.lesson.finishPractice"));
                return;
              }
              setMobileStudyMode(lessonSteps[nextIndex]);
              document.querySelector(".hugo-coder-lesson-stepper")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            };

            return (
              <div className="space-y-5 animate-fadeIn">
                <section className="hugo-coder-lesson-stepper sticky top-0 z-10 -mx-4 border-b border-border bg-[#f8fafc]/92 px-4 pb-3 pt-2 backdrop-blur-xl dark:bg-[#09090b]/92">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-primary">
                        {t("hugoCoderLearning.lesson.stepOf", {
                          current: activeStepIndex + 1,
                          total: lessonSteps.length,
                        })}
                      </p>
                      <h3 className="truncate text-[15px] font-bold tracking-[-0.02em] text-foreground">
                        {t(`hugoCoderLearning.lesson.steps.${lessonSteps[activeStepIndex]}`)}
                      </h3>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                      +20 XP
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {lessonSteps.map((step, index) => {
                      const active = index === activeStepIndex;
                      const reached = index <= activeStepIndex;
                      const locked = index === 3 && !isCurrentCompleted && verificationStatus !== "success";
                      return (
                        <button
                          key={step}
                          type="button"
                          onClick={() => !locked && goToLessonStep(index)}
                          disabled={locked}
                          className={`h-2 overflow-hidden rounded-full transition ${
                            reached ? "bg-primary" : "bg-muted"
                          } ${active ? "ring-2 ring-primary/20 ring-offset-2 ring-offset-background" : ""}`}
                          aria-label={t(`hugoCoderLearning.lesson.steps.${step}`)}
                          aria-current={active ? "step" : undefined}
                        />
                      );
                    })}
                  </div>
                </section>

                {mobileStudyMode === "story" && (
                  <>
                {/* 2.1. Theory markdown */}
                <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg overflow-hidden font-sans">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-black leading-tight">{mobileCourse.title}</h3>
                    {mobileCourse.duration && (
                      <span className="ml-auto shrink-0 text-[9px] font-bold text-muted-foreground bg-muted border border-border rounded-full px-2 py-0.5">{mobileCourse.duration}</span>
                    )}
                  </div>
                  <article className="px-4 py-4 text-muted-foreground">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h3: ({node, ...props}) => <h3 className="text-base font-black text-foreground mt-4 mb-2" {...props} />,
                        p: ({node, ...props}) => <p className="text-sm leading-7 mb-3" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-black text-foreground" {...props} />,
                        pre: ({node, ...props}) => <pre className="bg-zinc-950 text-zinc-100 border border-zinc-800 p-3 rounded-lg text-xs font-mono overflow-x-auto mb-4" {...props} />,
                        code: ({node, inline, ...props}) => inline
                          ? <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-primary font-mono" {...props} />
                          : <code className="font-mono text-xs" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1.5 text-sm leading-7" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-sm leading-7" {...props} />,
                        li: ({node, ...props}) => <li {...props} />
                      }}
                    >
                      {mobileCourse.theory}
                    </ReactMarkdown>
                  </article>
                </section>

                {/* 2.3. Visual Artwork Panels */}
                <section className="space-y-3 font-sans">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-muted-foreground">{t("hugoCoderLearning.guidebook.hinhMinhHoaSong")}</h3>
                    <span className="text-[10px] font-bold text-primary">{mobileVisualSet.panels.length} tranh</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                    {mobileVisualSet.panels.map((panel, index) => renderVisualArtwork(panel, index))}
                  </div>
                </section>

                {/* 2.4. Mental Model & Key Ideas */}
                <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-3 font-sans">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-black">{t("hugoCoderLearning.guidebook.tongQuanMucTieu")}</h3>
                    {mobileCourse.duration && <span className="ml-auto text-[9px] font-bold text-muted-foreground bg-muted border border-border rounded-full px-2 py-0.5">{mobileCourse.duration}</span>}
                  </div>
                  {renderMobileIllustration(mobileExtra.visualType, mobileCourse?.id)}
                  <p className="text-sm leading-7 text-muted-foreground">{mobileExtra.mentalModel}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {(mobileExtra.keyIdeas || []).map((idea, index) => (
                      <div key={idea} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                        <span className="mt-0.5 w-5 h-5 rounded-md bg-primary text-white flex items-center justify-center text-[10px] font-black">{index + 1}</span>
                        <p className="text-sm leading-6 text-muted-foreground">{idea}</p>
                      </div>
                    ))}
                  </div>
                </section>
                  </>
                )}

                {mobileStudyMode === "guide" && (
                  <>
                {/* 2.5. Deep Dive Section */}
                <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-3 font-sans">
                  <h3 className="text-sm font-black">{t("hugoCoderLearning.guidebook.thucHanhCodeMau")}</h3>
                  {(mobileExtra.deepDive || []).map((item) => (
                    <div key={item.title} className="rounded-lg border border-border bg-background p-3">
                      <h4 className="text-xs font-black text-foreground">{item.title}</h4>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p>
                    </div>
                  ))}
                </section>

                {/* 2.6. Checklist */}
                <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-3 font-sans">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-black">{t("hugoCoderLearning.guidebook.checklistHieuBai")}</h3>
                  </div>
                  <ul className="space-y-3">
                    {mobileCourse.tasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                        <span className="mt-0.5 w-5 h-5 rounded-md border border-primary/30 bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                  {mobileCourse.challenge && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-sm leading-6 text-muted-foreground"><strong className="text-primary">{t("hugoCoderLearning.guidebook.thuThachMoRong")}</strong> {mobileCourse.challenge}</p>
                    </div>
                  )}
                  {mobileCourse.checklist?.length > 0 && (
                    <div className="rounded-lg border border-border bg-background p-3 space-y-2">
                      <h4 className="text-xs font-black text-foreground">{t("hugoCoderLearning.guidebook.checklistThuocBai")}</h4>
                      {mobileCourse.checklist.map((item, i) => (
                        <label key={i} className="flex items-start gap-2 text-sm leading-6 text-muted-foreground cursor-pointer select-none">
                          <input type="checkbox" className="mt-1 accent-current" />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </section>
                  </>
                )}

                {mobileStudyMode === "practice" && (
                  <>
                {/* 2.7. Interactive Practice (Puzzles) */}
                <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-4 font-sans">
                  <div className="flex items-center gap-2 border-b border-border pb-2.5">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <h3 className="text-sm font-black">{t("hugoCoderLearning.guidebook.thucHanhTuongTac")}</h3>
                  </div>
                  {timeLeft > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-2 justify-center">
                      <span className="material-symbols-outlined text-[14px] animate-spin">history</span>
                      <span>{t("hugoCoderLearning.guidebook.banCanTimHieu")} {Math.floor(timeLeft / 60)} {t("hugoCoderLearning.guidebook.phut")} {timeLeft % 60} {t("hugoCoderLearning.guidebook.giayDeCoThe")}</span>
                    </div>
                  )}
                  {verificationStatus === "success" ? (
                    <div className="bg-success/10 border border-success/20 p-4 rounded-xl text-center space-y-2">
                      <span className="material-symbols-outlined text-4xl text-success animate-bounce">verified</span>
                      <p className="text-sm font-black text-success uppercase tracking-wider">{t("hugoCoderLearning.guidebook.hoanThanhXuatSac")}</p>
                      <p className="text-xs text-muted-foreground font-sans">{t("hugoCoderLearning.guidebook.banDaVuotQua")}</p>
                    </div>
                  ) : (
                    <InteractivePuzzles
                      course={mobileCourse}
                      completedLessons={completedLessons}
                      interactivePassed={interactivePassed}
                      bio={bio}
                      onBioUpdate={onBioUpdate}
                      miniQuizAnswers={miniQuizAnswers}
                      setMiniQuizAnswers={setMiniQuizAnswers}
                      setMiniQuizPassed={setMiniQuizPassed}
                      handleRewardMobileLesson={handleRewardMobileLesson}
                      htmlBlocks={htmlBlocks}
                      sqlBlocks={sqlBlocks}
                      moveBlock={moveBlock}
                      themeBg={themeBg}
                      setThemeBg={setThemeBg}
                      themeText={themeText}
                      setThemeText={setThemeText}
                      clickCount={clickCount}
                      setClickCount={setClickCount}
                      matchedPairs={matchedPairs}
                      handlePairMatch={handlePairMatch}
                      blankAnswers={blankAnswers}
                      setBlankAnswers={setBlankAnswers}
                      screenshotFile={screenshotFile}
                      handleScreenshotSelect={handleScreenshotSelect}
                      isScanning={isScanning}
                      scanProgress={scanProgress}
                      scanScore={scanScore}
                      quizQuestions={quizQuestions}
                      quizCompleted={quizCompleted}
                      quizScore={quizScore}
                      quizReview={quizReview}
                      quizCurrentIndex={quizCurrentIndex}
                      setQuizCurrentIndex={setQuizCurrentIndex}
                      quizAnswers={quizAnswers}
                      setQuizAnswers={setQuizAnswers}
                      handleRetakeQuiz={handleRetakeQuiz}
                      verifyInteractivePractice={verifyInteractivePractice}
                    />
                  )}
                </section>
                  </>
                )}

                {mobileStudyMode === "review" && (
                  <>
                {/* 2.8. Common mistakes / Self-quizzes */}
                <section className="grid grid-cols-1 gap-3 font-sans">
                  <div className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-black">{t("hugoCoderLearning.guidebook.bayLoiCachKhac")}</h3>
                    <ul className="space-y-2">
                      {(mobileExtra.commonMistakes || []).map((mistake) => (
                        <li key={mistake} className="text-sm leading-6 text-muted-foreground border-l-2 border-warning pl-3">{mistake}</li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* 2.8b. Tài liệu học thuật — nguồn chuẩn quốc tế của chặng + bài */}
                {(() => {
                  const num = parseInt(String(mobileCourse.id).replace("lesson", ""), 10);
                  const stage = STAGES.find((s) => num > s.from && num <= s.to);
                  const stageReading = stage?.intro?.reading || [];
                  const lessonReading = getLessonReading(mobileCourse);
                  if (stageReading.length === 0 && lessonReading.length === 0) return null;
                  return (
                    <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-3 font-sans">
                      <div className="flex items-center gap-2">
                        <Library className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-black">{t("hugoCoderLearning.guidebook.taiLieuSachHoc")}</h3>
                      </div>
                      {lessonReading.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("hugoCoderLearning.guidebook.choBaiNay")}</span>
                          {lessonReading.map((r, i) => (
                            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                              <span className="material-symbols-outlined text-base mt-0.5 shrink-0">open_in_new</span>
                              <span><span className="font-bold text-foreground">{r.title}</span>{r.author && ` — ${r.author}`}{r.note && <small className="block text-muted-foreground">{r.note}</small>}</span>
                            </a>
                          ))}
                        </div>
                      )}
                      {stageReading.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("hugoCoderLearning.guidebook.nguonChuanQuocTe")}</span>
                          {stageReading.map((r, i) => (
                            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                              <span className="material-symbols-outlined text-base mt-0.5 shrink-0">menu_book</span>
                              <span><span className="font-bold text-foreground">{r.title}</span> — {r.author}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })()}
                  </>
                )}

                {mobileStudyMode === "guide" && (
                  <>
                {/* 2.9. Code Run Frame */}
                <section className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden text-zinc-100 font-sans">
                  <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase text-emerald-400">{t("hugoCoderLearning.guidebook.chayThuDeXem")}</p>
                      <h3 className="text-sm font-black truncate">{mobileCourse.file}</h3>
                    </div>
                    <button
                      onClick={() => setMobileRunKey(Date.now())}
                      className="shrink-0 h-9 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {t("hugoCoderLearning.guidebook.chay")}
                    </button>
                  </div>
                  <pre className="max-h-56 overflow-auto p-4 text-[11px] leading-5 font-mono text-zinc-300 whitespace-pre-wrap">
                    {mobileDemoCode}
                  </pre>
                  {canPreviewMobileCourse ? (
                    <div className="bg-white border-t border-zinc-800">
                      <iframe
                        key={`${mobileCourse.id}-${mobileRunKey}`}
                        title="Mobile code demo"
                        srcDoc={mobileDemoCode}
                        className="w-full h-72 border-0 bg-white"
                        sandbox="allow-scripts allow-modals"
                      />
                    </div>
                  ) : (
                    <div className="border-t border-zinc-800 p-4 text-xs leading-6 text-zinc-400">
                      {t("hugoCoderLearning.guidebook.baiNayLaDang")}
                    </div>
                  )}
                </section>
                  </>
                )}

                {/* 2.10. Action Buttons (Bài tiếp theo / Quay lại mục lục) */}
                <section className="grid grid-cols-[auto_1fr] gap-2.5 border-t border-border pb-6 pt-4 font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeStepIndex === 0) {
                        setActiveCourseId(null);
                        setVerificationStatus(null);
                        onExitLesson?.();
                        return;
                      }
                      goToLessonStep(activeStepIndex - 1);
                    }}
                    className="min-h-12 rounded-2xl border border-border bg-background px-4 text-xs font-bold text-foreground transition active:scale-95"
                  >
                    {activeStepIndex === 0
                      ? t("hugoCoderLearning.lesson.path")
                      : t("hugoCoderLearning.lesson.previous")}
                  </button>
                  {(activeStepIndex < lessonSteps.length - 1 || hasNextLesson) && (
                    <button
                      type="button"
                      onClick={() => goToLessonStep(activeStepIndex + 1)}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-xs font-bold text-white shadow-md shadow-primary/20 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                      disabled={
                        activeStepIndex === 2
                        && !isCurrentCompleted
                        && verificationStatus !== "success"
                      }
                    >
                      {activeStepIndex === lessonSteps.length - 1
                        ? t("hugoCoderLearning.lesson.nextLesson")
                        : t("hugoCoderLearning.lesson.continue")}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </section>
              </div>
            );
          })()}
        </main>
      </div>
  );

  // Embedded trong Hub: Hub đã lo FeatureGate — trả thẳng body.
  if (embedded) return guidebookBody;

  return (
    <FeatureGate
      bio={bio}
      featureKey="hugoCoder"
      priceJoy={1500}
      icon="terminal"
      title={t("hugoCoderLearning.guidebook.traoDoiJoyDe")}
      description="Đọc sách hướng dẫn, xem demo chạy code và học lập trình ngay trên điện thoại."
      onBioUpdate={onBioUpdate}
      onBack={onBack}
      className="max-w-lg mx-auto mt-10"
    >
      {guidebookBody}
    </FeatureGate>
  );
}
