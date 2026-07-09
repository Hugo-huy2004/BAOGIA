import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  Award, ArrowLeft, Smartphone, CheckCircle, BookOpen, 
  Sparkles, ListChecks, Play, ChevronDown, ChevronUp, Lock 
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
    advanced: false
  });

  const togglePhase = (phaseId) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  const phases = [
    {
      id: "basic",
      title: "Chặng 1: Nhập Môn Cơ Bản",
      rangeText: "Bài 1 - 10",
      lessons: WEB_COURSES.slice(0, 10),
      certType: null
    },
    {
      id: "intermediate",
      title: "Chặng 2: Lập Trình Trung Cấp",
      rangeText: "Bài 11 - 25",
      lessons: WEB_COURSES.slice(10, 25),
      certType: "intermediate"
    },
    {
      id: "advanced",
      title: "Chặng 3: Chuyên Gia Cao Cấp",
      rangeText: "Bài 26 - 50",
      lessons: WEB_COURSES.slice(25, 50),
      certType: "advanced"
    }
  ];

  return (
    <FeatureGate
      bio={bio}
      featureKey="hugoCoder"
      priceJoy={150}
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
            <section className="space-y-3.5 font-sans animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-muted-foreground">Mục lục bài học</h3>
                <span className="text-[10px] font-bold text-primary">{mobileCompletedCount}/{WEB_COURSES.length} hoàn thành</span>
              </div>
              
              <div className="space-y-3">
                {phases.map((phase) => {
                  const completedCount = phase.lessons.filter(l => completedLessons.includes(l.id)).length;
                  const isPhaseCompleted = completedCount === phase.lessons.length;
                  const isExpanded = expandedPhases[phase.id];
                  const globalStartIndex = phase.id === "basic" ? 0 : phase.id === "intermediate" ? 10 : 25;

                  return (
                    <div key={phase.id} className="border border-border rounded-xl overflow-hidden bg-card/25">
                      {/* Header */}
                      <div
                        onClick={() => togglePhase(phase.id)}
                        className="flex items-center justify-between p-3.5 bg-muted/40 hover:bg-muted/65 transition-all border-b border-border/50 select-none cursor-pointer"
                      >
                        <div className="text-left">
                          <h4 className="font-extrabold text-xs text-foreground tracking-wide">{phase.title}</h4>
                          <span className="text-[9.5px] font-bold text-muted-foreground">{phase.rangeText} • {completedCount}/{phase.lessons.length} bài đã học</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isPhaseCompleted && (
                            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-success/20 border border-success/30 text-success text-[8px] font-bold">
                              ✓
                            </span>
                          )}
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>

                      {/* Phase Content */}
                      {isExpanded && (
                        <div className="p-3 space-y-3 bg-zinc-950/10">
                          {/* Certificate Button if Phase Completed */}
                          {isPhaseCompleted && phase.certType && (
                            <div className="bg-gradient-to-br from-amber-500/10 to-yellow-600/5 border border-amber-500/30 rounded-xl p-3 text-center space-y-2 shadow-sm animate-fadeIn">
                              <div className="flex items-center justify-center gap-1.5 text-amber-500 font-extrabold text-[10.5px] uppercase tracking-wider">
                                <Award className="w-4 h-4 text-amber-400" />
                                Đã Hoàn Thành Chặng
                              </div>
                              <p className="text-[9.5px] text-zinc-400 leading-normal font-sans">
                                Chúc mừng bạn đã hoàn thành xuất sắc toàn bộ các bài học của {phase.title}.
                              </p>
                              <button
                                onClick={() => onShowCertificate(phase.certType)}
                                className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 font-black rounded-lg text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
                              >
                                Xem chứng chỉ & thư mời HugoTeam
                              </button>
                            </div>
                          )}

                          {/* List of lessons */}
                          <div className="divide-y divide-border/30 border border-border/40 rounded-xl overflow-hidden bg-zinc-950/20">
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
                                  className={`flex items-center justify-between px-3.5 py-3 transition-all text-left ${
                                    isLocked
                                      ? "opacity-40 cursor-not-allowed bg-black/5"
                                      : isActive
                                        ? "bg-primary/15 border-l-2 border-primary"
                                        : "cursor-pointer hover:bg-primary/5 active:bg-primary/10"
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="font-mono text-[10px] font-bold text-muted-foreground select-none">
                                      {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <span className={`text-[12px] font-medium truncate ${
                                      isLocked 
                                        ? "text-muted-foreground/60" 
                                        : isActive
                                          ? "text-primary font-bold"
                                          : "text-foreground"
                                    }`}>
                                      {course.title.replace(/^\d+\.\s*/, "")}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2.5 shrink-0">
                                    {isCompleted ? (
                                      <CheckCircle className="w-4 h-4 text-success" />
                                    ) : isLocked ? (
                                      <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
                                    ) : null}
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
                (tierInfo.tier === "advanced" && completedLessons.includes("lesson50"));

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
                      Nội dung bài học này đang bị khóa. Hãy mở khóa chặng học tập này để tiếp tục đọc giáo trình lý thuyết và thực hành.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Option 1: Monthly subscription */}
                    <div className="border border-border bg-white dark:bg-zinc-900 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-foreground">Thuê bao học tập (30 ngày)</span>
                        <span className="font-black text-primary">{tierInfo.price} JOY</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Mở khóa toàn bộ các bài học trong {tierInfo.tierLabel} trong 30 ngày để xem lý thuyết và thực hành.
                      </p>
                      <button
                        onClick={() => handleExchangeSubscription(tierInfo)}
                        disabled={exchangeSubmitting}
                        className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow active:scale-95 disabled:opacity-50"
                      >
                        Kích hoạt thuê bao
                      </button>
                    </div>

                    {/* Option 2: Lifetime permanent unlock */}
                    {showLifetimeOption && (
                      <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-amber-500 flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-amber-400" />
                            Mở khóa vĩnh viễn
                          </span>
                          <span className="font-black text-amber-500">50 JOY</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Hoàn thành chặng! Nhận quyền sở hữu trọn đời học liệu chỉ với một lần trao đổi 50 JOY.
                        </p>
                        <button
                          onClick={() => handleBuyLifetimeUnlock(tierInfo.tier)}
                          disabled={exchangeSubmitting}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow active:scale-95 disabled:opacity-50"
                        >
                          Mở khóa vĩnh viễn trọn đời
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
                  {renderMobileIllustration(mobileExtra.visualType)}
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
