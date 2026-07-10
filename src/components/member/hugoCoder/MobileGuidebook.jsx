import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  Award, ArrowLeft, Smartphone, CheckCircle, BookOpen, 
  Sparkles, ListChecks, Play, ChevronDown, ChevronUp, Lock,
  Terminal, Shield, Zap, Trophy, Cpu, ChevronRight
} from "lucide-react";
import InteractivePuzzles from "./InteractivePuzzles";
import { renderMobileIllustration, renderVisualArtwork, renderStudyModePanel } from "./VisualIllustrations";
import FeatureGate from "../shared/FeatureGate";
import { notify } from "../../../lib/notify";

export default function MobileGuidebook({
  activeCourseId,
  bio,
  onBioUpdate,
  onBack,
  completedLessons,
  mobileProgress,
  mobileCourse,
  mobileCompletedCount,
  WEB_COURSES,
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
  quizCurrentIndex,
  setQuizCurrentIndex,
  quizAnswers,
  setQuizAnswers,
  handleRetakeQuiz,
  mobilePuzzleAnswer,
  setMobilePuzzleAnswer,
  verifyInteractivePractice
}) {
  const [expandedPhases, setExpandedPhases] = React.useState({
    basic: true,
    intermediate: false,
    advanced: false,
    security: false,
    exam: false,
    optimize: false,
    ultimate: false
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
    if (mobileCompletedCount < 70) return "Lập trình viên Cao cấp";
    if (mobileCompletedCount < 90) return "Kỹ sư Phần mềm Chuyên nghiệp";
    return "Chuyên gia Kiến trúc Hệ thống Web";
  }, [mobileCompletedCount]);

  const phaseMeta = {
    basic: {
      gradient: "from-blue-500/10 via-indigo-500/5 to-transparent border-blue-500/20 dark:border-blue-500/30",
      accentColor: "text-blue-500 dark:text-blue-400 border-blue-500/30",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      barColor: "bg-gradient-to-r from-blue-500 to-indigo-500",
      subtext: "HTML, CSS cơ bản & Cây cấu trúc DOM",
      icon: <Terminal className="w-4.5 h-4.5 text-blue-500" />
    },
    intermediate: {
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20 dark:border-emerald-500/30",
      accentColor: "text-emerald-500 dark:text-emerald-400 border-emerald-500/30",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      barColor: "bg-gradient-to-r from-emerald-500 to-teal-500",
      subtext: "Làm chủ JavaScript & Xử lý sự kiện động",
      icon: <Cpu className="w-4.5 h-4.5 text-emerald-500" />
    },
    advanced: {
      gradient: "from-violet-500/10 via-purple-500/5 to-transparent border-violet-500/20 dark:border-violet-500/30",
      accentColor: "text-violet-500 dark:text-violet-400 border-violet-500/30",
      badgeColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
      barColor: "bg-gradient-to-r from-violet-500 to-purple-500",
      subtext: "SQL, PHP Backend & Tích hợp API dữ liệu",
      icon: <BookOpen className="w-4.5 h-4.5 text-violet-500" />
    },
    security: {
      gradient: "from-rose-500/10 via-pink-500/5 to-transparent border-rose-500/20 dark:border-rose-500/30",
      accentColor: "text-rose-500 dark:text-rose-400 border-rose-500/30",
      badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      barColor: "bg-gradient-to-r from-rose-500 to-pink-500",
      subtext: "Bảo mật CIA, chuẩn đặt tên & tổ chức file",
      icon: <Shield className="w-4.5 h-4.5 text-rose-500" />
    },
    exam: {
      gradient: "from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/20 dark:border-amber-500/30",
      accentColor: "text-amber-500 dark:text-amber-400 border-amber-500/30",
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      barColor: "bg-gradient-to-r from-amber-500 to-orange-500",
      subtext: "Kiểm tra trắc nghiệm tổng hợp 2 chặng",
      icon: <Award className="w-4.5 h-4.5 text-amber-500" />
    },
    optimize: {
      gradient: "from-cyan-500/10 via-sky-500/5 to-transparent border-cyan-500/20 dark:border-cyan-500/30",
      accentColor: "text-cyan-500 dark:text-cyan-400 border-cyan-500/30",
      badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      barColor: "bg-gradient-to-r from-cyan-500 to-sky-500",
      subtext: "Clean Code DRY, tối ưu code & Prompt AI/LLM",
      icon: <Zap className="w-4.5 h-4.5 text-cyan-500" />
    },
    ultimate: {
      gradient: "from-yellow-500/15 via-amber-500/5 to-transparent border-yellow-500/30 dark:border-yellow-500/45",
      accentColor: "text-yellow-500 dark:text-yellow-400 border-yellow-500/30",
      badgeColor: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      barColor: "bg-gradient-to-r from-yellow-500 to-amber-500",
      subtext: "Đồ án kết khóa: Làm web fullstack hoàn chỉnh",
      icon: <Trophy className="w-4.5 h-4.5 text-yellow-500" />
    }
  };

  const phases = [
    {
      id: "basic",
      phaseNumber: 1,
      title: "Chặng 1: Nhập Môn Cơ Bản",
      rangeText: "Bài 1 - 10",
      lessons: WEB_COURSES.slice(0, 10)
    },
    {
      id: "intermediate",
      phaseNumber: 2,
      title: "Chặng 2: Lập Trình Trung Cấp",
      rangeText: "Bài 11 - 25",
      lessons: WEB_COURSES.slice(10, 25)
    },
    {
      id: "advanced",
      phaseNumber: 3,
      title: "Chặng 3: Chuyên Gia Cao Cấp",
      rangeText: "Bài 26 - 50",
      lessons: WEB_COURSES.slice(25, 50)
    },
    {
      id: "security",
      phaseNumber: 4,
      title: "Chặng 4: Bảo Mật & Quy Tắc",
      rangeText: "Bài 51 - 60",
      lessons: WEB_COURSES.slice(50, 60)
    },
    {
      id: "exam",
      phaseNumber: 5,
      title: "Chặng 5: Kiểm Tra Tổng Hợp",
      rangeText: "Bài 61 - 62",
      lessons: WEB_COURSES.slice(60, 62)
    },
    {
      id: "optimize",
      phaseNumber: 6,
      title: "Chặng 6: Tối Ưu Code & AI",
      rangeText: "Bài 63 - 70",
      lessons: WEB_COURSES.slice(62, 70)
    },
    {
      id: "ultimate",
      phaseNumber: 7,
      title: "Chặng 7: Lập Trình Web Nâng Cao",
      rangeText: "Bài 71 - 100",
      lessons: WEB_COURSES.slice(70, 100)
    }
  ];

  return (
    <FeatureGate
      bio={bio}
      featureKey="hugoCoder"
      priceJoy={1500}
      icon="terminal"
      title="Trao đổi JOY để mở khóa HugoCoder"
      description="Đọc sách hướng dẫn, xem demo chạy code và học lập trình ngay trên điện thoại."
      onBioUpdate={onBioUpdate}
      onBack={onBack}
      className="max-w-lg mx-auto mt-10"
    >
      <div className="fixed inset-0 z-50 bg-[#f8fafc] dark:bg-[#09090b] text-foreground overflow-y-auto">
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
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-border px-4 pt-[calc(env(safe-area-inset-top,16px)+12px)] pb-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={activeCourseId ? () => {
                setActiveCourseId(null);
                setVerificationStatus(null);
              } : onBack}
              className="w-11 h-11 rounded-xl border border-border bg-background flex items-center justify-center text-foreground active:scale-95 transition-all shadow-sm"
              aria-label="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase text-primary">HugoCoder Mobile</p>
              <h2 className="text-sm font-black truncate">
                {activeCourseId && mobileCourse ? mobileCourse.title : "Sách hướng dẫn lập trình"}
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
                    {mobileProgress}% Hoàn thành
                  </span>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-base font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">HugoCoder Mobile Academy</h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Đã chinh phục {mobileCompletedCount} trên tổng số {WEB_COURSES.length} bài học thực chiến</p>
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
                      Sở hữu Trọn gói Vĩnh viễn (Miễn phí bảo trì trọn đời)
                    </div>
                  ) : (() => {
                    const expiresAt = bio?.featureSubscriptions?.hugoCoder?.expiresAt;
                    if (!expiresAt) {
                      return (
                        <div className="text-[10px] text-zinc-400">
                          Chưa kích hoạt phí bảo trì hàng tháng (50 JOY)
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
                            Phí bảo trì đã Hết Hạn!
                          </div>
                          <p className="text-[9.5px] text-zinc-300 leading-normal">
                            Vui lòng gia hạn 50 JOY bảo trì hàng tháng để tiếp tục học. Còn <strong>{daysUntilReset > 0 ? daysUntilReset : 0} ngày</strong> đóng phí trước khi tiến trình học bị reset hoàn toàn về 0.
                          </p>
                        </div>
                      );
                    } else {
                      const daysLeft = Math.ceil((expTime - now) / (24 * 60 * 60 * 1000));
                      return (
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-zinc-400">Phí bảo trì hàng tháng:</span>
                          <span className="font-bold text-emerald-400">Đã kích hoạt (Còn {daysLeft} ngày)</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Title & Total Complete Stats */}
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Mục lục lộ trình</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Vui lòng học tuần tự để mở khóa các bài tiếp theo</p>
                </div>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">{mobileCompletedCount}/{WEB_COURSES.length} Bài đã học</span>
              </div>
              
              {/* Stages List */}
              <div className="space-y-4">
                {phases.map((phase) => {
                  const completedCount = phase.lessons.filter(l => completedLessons.includes(l.id)).length;
                  const isPhaseCompleted = completedCount === phase.lessons.length;
                  const isExpanded = expandedPhases[phase.id];
                  const globalStartIndex = 
                    phase.id === "basic" ? 0 :
                    phase.id === "intermediate" ? 10 :
                    phase.id === "advanced" ? 25 :
                    phase.id === "security" ? 50 :
                    phase.id === "exam" ? 60 :
                    phase.id === "optimize" ? 62 :
                    phase.id === "ultimate" ? 70 : 0;
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
                          {/* Certificate Reward Card if Completed */}
                          {isPhaseCompleted && (
                            <div className="bg-gradient-to-br from-amber-500/15 via-yellow-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 text-center space-y-3 shadow-md animate-fadeIn relative overflow-hidden">
                              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-12 h-12 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                              <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider">
                                <Trophy className="w-4.5 h-4.5 text-amber-400 animate-bounce" />
                                Chúc mừng hoàn thành {phase.title}
                              </div>
                              
                              {[3, 4, 5, 6].includes(phase.phaseNumber) && (() => {
                                const claimKey = `hugoCoderRewardClaimed${phase.phaseNumber}`;
                                const hasClaimed = !!bio?.[claimKey];
                                return (
                                  <div className="space-y-2.5">
                                    <p className="text-[10px] text-muted-foreground leading-relaxed font-sans">
                                      Bạn đã hoàn thành xuất sắc toàn bộ thử thách của chặng này! Hãy nhận phần thưởng vinh danh.
                                    </p>
                                    {hasClaimed ? (
                                      <div className="py-2.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-black rounded-xl text-[10px] uppercase tracking-widest shadow-sm">
                                        Đã nhận thưởng +800 JOY ✓
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleClaimMilestoneReward(phase.phaseNumber)}
                                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 font-black rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                                      >
                                        Nhận phần thưởng (+800 JOY)
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}

                              {phase.phaseNumber === 7 && (() => {
                                const status = bio?.hugoCoderProjectStatus || 'idle';
                                const certUrl = bio?.hugoCoderCertificateUrl || '';
                                const adminNote = bio?.hugoCoderProjectAdminNote || '';
                                
                                return (
                                  <div className="space-y-2.5 text-[10px] font-sans text-muted-foreground">
                                    {status === 'idle' && (
                                      <p className="leading-relaxed">
                                        Hãy hoàn thành đồ án kết khóa và nộp đường link dự án của bạn tại <strong>Bài 100</strong> để nhận đánh giá từ Hugo Studio.
                                      </p>
                                    )}
                                    {status === 'pending' && (
                                      <div className="p-3 bg-amber-500/15 border border-amber-500/25 rounded-xl text-amber-600 dark:text-amber-400 font-black shadow-sm">
                                        Đang chờ duyệt đồ án kết khóa... ⏳
                                        <p className="text-[9px] font-normal text-muted-foreground mt-1">Hugo Studio đang rà soát dự án và mã nguồn của bạn.</p>
                                      </div>
                                    )}
                                    {status === 'rejected' && (
                                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive font-black text-left space-y-1.5 shadow-sm">
                                        <div>Đồ án chưa đạt yêu cầu ❌</div>
                                        {adminNote && <p className="text-[9px] font-normal text-zinc-300">Phản hồi: {adminNote}</p>}
                                        <p className="text-[9px] font-normal text-muted-foreground">Bạn có thể sửa đổi và nộp lại link mới ở Bài 100.</p>
                                      </div>
                                    )}
                                    {status === 'approved' && (
                                      <div className="space-y-2.5">
                                        <div className="p-3 bg-emerald-500/15 border border-emerald-500/25 rounded-xl text-emerald-600 dark:text-emerald-400 font-black shadow-sm">
                                          Đồ án đã được duyệt thành công! 🎉
                                          <p className="text-[9px] font-normal text-muted-foreground mt-1">Đã nhận thưởng hoàn thành khóa học 4,000 JOY & phần quà VVIP.</p>
                                        </div>
                                        {certUrl ? (
                                          <a
                                            href={certUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full py-2.5 text-center bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-zinc-950 font-black rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-md"
                                          >
                                            Nhận chứng nhận hoàn thành
                                          </a>
                                        ) : (
                                          <p className="text-[9px] text-amber-400 font-bold">Chứng nhận đang được chuẩn bị bởi Admin...</p>
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
                                      notify.error("Vui lòng hoàn thành bài học trước để mở khóa bài này!");
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
                                        {course.file || "Thực hành lý thuyết"}
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
                (tierInfo.tier === "security" && completedLessons.includes("lesson60")) ||
                (tierInfo.tier === "exam" && completedLessons.includes("lesson62")) ||
                (tierInfo.tier === "optimize" && completedLessons.includes("lesson70")) ||
                (tierInfo.tier === "ultimate" && (completedLessons.includes("lesson100") || bio?.hugoCoderProjectStatus === 'approved'));

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
                        ? "Nội dung bài học này đang bị khóa. Vui lòng mở khóa vĩnh viễn chặng học tập này hoặc sở hữu trọn gói 7 chặng để bắt đầu học."
                        : "Thuê bao bảo trì đã hết hạn. Vui lòng gia hạn 50 JOY bảo trì hàng tháng để tiếp tục học tập."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Case 1: Stage not yet purchased/unlocked */}
                    {!tierInfo.lifetime && (
                      <>
                        {/* Option 1: Lifetime Stage Unlock */}
                        <div className="border border-border bg-white dark:bg-zinc-900 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-foreground">Mở khóa vĩnh viễn chặng</span>
                            <span className="font-black text-primary">{tierInfo.price} JOY</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Mở khóa vĩnh viễn quyền học và thực hành toàn bộ bài học thuộc {tierInfo.tierLabel}.
                          </p>
                          <button
                            onClick={() => handleBuyLifetimeUnlock(tierInfo.tier)}
                            disabled={exchangeSubmitting}
                            className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow active:scale-95 disabled:opacity-50"
                          >
                            Mở khóa chặng vĩnh viễn
                          </button>
                        </div>

                        {/* Option 2: Buy All 7 Stages Bundle */}
                        <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-amber-500 flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-amber-400" />
                              Trọn gói vĩnh viễn 7 chặng
                            </span>
                            <span className="font-black text-amber-500">16.000 JOY</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Mở khóa toàn bộ 100 bài học của 7 chặng vĩnh viễn & được <strong>miễn phí phí bảo trì trọn đời</strong>.
                          </p>
                          <button
                            onClick={() => handleBuyAllStagesBundle()}
                            disabled={exchangeSubmitting}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow active:scale-95 disabled:opacity-50"
                          >
                            Mua trọn gói 16k JOY
                          </button>
                        </div>
                      </>
                    )}

                    {/* Case 2: Stage unlocked but maintenance expired */}
                    {tierInfo.lifetime && !tierInfo.maintenanceActive && (
                      <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-red-500">Gia hạn phí bảo trì tháng</span>
                          <span className="font-black text-red-500">50 JOY</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Phí bảo trì cần đóng hàng tháng để giữ quyền truy cập. Quá hạn 3 tháng sẽ bị reset tiến trình học về 0.
                        </p>
                        <button
                          onClick={() => handlePayMaintenance()}
                          disabled={exchangeSubmitting}
                          className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow active:scale-95 disabled:opacity-50"
                        >
                          Đóng phí bảo trì 50 JOY
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            const isCurrentCompleted = completedLessons.includes(mobileCourse?.id);
            const hasNextLesson = currentMobileCourseIndex < WEB_COURSES.length - 1;

            return (
              <div className="space-y-5 animate-fadeIn">
                {/* 2.1. Theory markdown */}
                <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg overflow-hidden font-sans">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-black leading-tight">{mobileCourse.title}</h3>
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

                {/* 2.2. Interactive study modes */}
                <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-4 font-sans">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-primary">Đa dạng cách học</span>
                      <h3 className="text-sm font-black">{mobileVisualSet.title}</h3>
                    </div>
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {mobileVisualSet.modes.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setMobileStudyMode(mode.id)}
                        className={`h-9 rounded-lg border text-[11px] font-black transition-all active:scale-95 ${
                          mobileStudyMode === mode.id
                            ? "bg-primary text-white border-primary"
                            : "bg-background text-muted-foreground border-border"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                  {renderStudyModePanel(mobileVisualSet, mobileStudyMode)}
                </section>

                {/* 2.3. Visual Artwork Panels */}
                <section className="space-y-3 font-sans">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-muted-foreground">Hình minh họa sống động</h3>
                    <span className="text-[10px] font-bold text-primary">{mobileVisualSet.panels.length} tranh</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
                    {mobileVisualSet.panels.map((panel, index) => renderVisualArtwork(panel, index))}
                  </div>
                </section>

                {/* 2.4. Mental Model & Key Ideas */}
                <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-4 font-sans">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-black">Mô hình tư duy</h3>
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

                {/* 2.5. Deep Dive Section */}
                <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-3 font-sans">
                  <h3 className="text-sm font-black">Đào sâu kiến thức</h3>
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
                    <h3 className="text-sm font-black">Checklist hiểu bài</h3>
                  </div>
                  <ul className="space-y-3">
                    {mobileCourse.tasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                        <span className="mt-0.5 w-5 h-5 rounded-md border border-primary/30 bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* 2.7. Interactive Practice (Puzzles) */}
                <section className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-4 font-sans">
                  <div className="flex items-center gap-2 border-b border-border pb-2.5">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <h3 className="text-sm font-black">Thực hành tương tác</h3>
                  </div>
                  {timeLeft > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-2 justify-center">
                      <span className="material-symbols-outlined text-[14px] animate-spin">history</span>
                      <span>Bạn cần tìm hiểu thêm: {Math.floor(timeLeft / 60)} phút {timeLeft % 60} giây để có thể kiểm tra.</span>
                    </div>
                  )}
                  {verificationStatus === "success" ? (
                    <div className="bg-success/10 border border-success/20 p-4 rounded-xl text-center space-y-2">
                      <span className="material-symbols-outlined text-4xl text-success animate-bounce">verified</span>
                      <p className="text-sm font-black text-success uppercase tracking-wider">Hoàn thành xuất sắc!</p>
                      <p className="text-xs text-muted-foreground font-sans">Bạn đã vượt qua các thử thách của bài học này và nhận phần thưởng JOY.</p>
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
                      quizCurrentIndex={quizCurrentIndex}
                      setQuizCurrentIndex={setQuizCurrentIndex}
                      quizAnswers={quizAnswers}
                      setQuizAnswers={setQuizAnswers}
                      handleRetakeQuiz={handleRetakeQuiz}
                      mobilePuzzleAnswer={mobilePuzzleAnswer}
                      setMobilePuzzleAnswer={setMobilePuzzleAnswer}
                      verifyInteractivePractice={verifyInteractivePractice}
                    />
                  )}
                </section>

                {/* 2.8. Common mistakes / Self-quizzes */}
                <section className="grid grid-cols-1 gap-3 font-sans">
                  <div className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-black">Lỗi hay gặp</h3>
                    <ul className="space-y-2">
                      {(mobileExtra.commonMistakes || []).map((mistake) => (
                        <li key={mistake} className="text-sm leading-6 text-muted-foreground border-l-2 border-warning pl-3">{mistake}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-border rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-black">Tự hỏi nhanh</h3>
                    <ul className="space-y-2">
                      {(mobileExtra.quiz || []).map((question) => (
                        <li key={question} className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm leading-6 text-primary font-semibold">{question}</li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* 2.9. Code Run Frame */}
                <section className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden text-zinc-100 font-sans">
                  <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase text-emerald-400">Chạy thử để xem</p>
                      <h3 className="text-sm font-black truncate">{mobileCourse.file}</h3>
                    </div>
                    <button
                      onClick={() => setMobileRunKey(Date.now())}
                      className="shrink-0 h-9 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Chạy
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
                      Bài này là dạng truy vấn hoặc backend nên điện thoại sẽ hiển thị code mẫu và hướng dẫn chạy. Khi mở trên desktop, HugoCoder sẽ chuyển về IDE đầy đủ.
                    </div>
                  )}
                </section>

                {/* 2.10. Action Buttons (Bài tiếp theo / Quay lại mục lục) */}
                <section className="flex flex-col gap-3 pt-4 border-t border-border pb-6 font-sans">
                  {hasNextLesson && (
                    <button
                      onClick={handleNextMobileLesson}
                      className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                        isCurrentCompleted
                          ? "bg-primary text-white hover:bg-primary/95"
                          : "bg-zinc-200 dark:bg-zinc-800 text-muted-foreground/60 cursor-not-allowed opacity-55"
                      }`}
                    >
                      Bài học tiếp theo
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveCourseId(null);
                      setVerificationStatus(null);
                    }}
                    className="w-full py-3.5 bg-background hover:bg-muted border border-border text-foreground rounded-xl text-xs font-black uppercase active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Quay lại mục lục
                  </button>
                </section>
              </div>
            );
          })()}
        </main>
      </div>
    </FeatureGate>
  );
}
