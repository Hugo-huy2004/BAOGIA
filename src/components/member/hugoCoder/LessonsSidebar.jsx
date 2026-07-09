import React, { useState } from "react";
import { Sparkles, Award, CheckCircle, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { notify } from "../../../lib/notify";

// Helper to resolve language from file extension
const getLanguageFromExt = (ext) => {
  switch (ext) {
    case "py": return "python";
    case "js": return "javascript";
    case "cs": return "csharp";
    case "cpp": case "c": return "cpp";
    case "html": return "html";
    case "css": return "css";
    case "php": return "php";
    case "md": return "markdown";
    case "json": return "json";
    default: return "plaintext";
  }
};

export default function LessonsSidebar({
  WEB_COURSES,
  completedLessons,
  activeCourseId,
  setActiveCourseId,
  setVerificationStatus,
  getLessonTierAndAccess,
  handleExchangeSubscription,
  exchangeSubmitting,
  handleBuyLifetimeUnlock,
  handleClaimMilestoneReward,
  bio,
  workspaceFiles,
  setWorkspaceFiles,
  openTabs,
  setOpenTabs,
  setActiveTabPath,
  handleVerifyLesson,
  verificationStatus,
  onShowCertificate
}) {
  const [expandedPhases, setExpandedPhases] = useState({
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
    <div className="p-4 flex-1 flex flex-col overflow-y-auto space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-1">
        <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Bài học tương tác
        </span>
        {activeCourseId && (
          <button
            onClick={() => {
              setActiveCourseId(null);
              setVerificationStatus(null);
            }}
            className="text-[10px] text-primary hover:text-primary/80 font-bold transition-all"
          >
            Quay lại
          </button>
        )}
      </div>

      {activeCourseId ? (() => {
        const course = WEB_COURSES.find(c => c.id === activeCourseId);
        const isCompleted = completedLessons.includes(course.id);
        const tierInfo = getLessonTierAndAccess(course.id);

        if (!tierInfo.hasAccess) {
          const showLifetimeOption = 
            (tierInfo.tier === "intermediate" && completedLessons.includes("lesson25")) ||
            (tierInfo.tier === "advanced" && completedLessons.includes("lesson50")) ||
            (tierInfo.tier === "security" && completedLessons.includes("lesson60")) ||
            (tierInfo.tier === "exam" && completedLessons.includes("lesson62")) ||
            (tierInfo.tier === "optimize" && completedLessons.includes("lesson70")) ||
            (tierInfo.tier === "ultimate" && (completedLessons.includes("lesson100") || bio?.hugoCoderProjectStatus === 'approved'));

          return (
            <div className="space-y-5 py-2">
              <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-4 text-center space-y-3.5 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center mx-auto">
                  <Lock className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-xs text-foreground uppercase tracking-wider">{course.title}</h4>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-muted border border-border text-[9px] font-bold text-muted-foreground">
                    {tierInfo.tierLabel}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Nội dung bài học này đang bị khóa. Hãy mở khóa chặng học tập này để tiếp tục học tập và thực hành lập trình thực tế.
                </p>
              </div>

              <div className="space-y-3.5">
                {/* Option 1: Monthly subscription */}
                <div className="border border-border bg-card/50 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="font-bold text-foreground">Thuê bao học tập (30 ngày)</span>
                    <span className="font-black text-primary">{tierInfo.price} JOY</span>
                  </div>
                  <p className="text-[9.5px] text-muted-foreground leading-relaxed">
                    Mở khóa đầy đủ toàn bộ các bài học trong gói {tierInfo.tierLabel} trong 30 ngày để học tập và code trực tiếp trên IDE.
                  </p>
                  <button
                    onClick={() => handleExchangeSubscription(tierInfo)}
                    disabled={exchangeSubmitting}
                    className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-black rounded-lg text-[10px] uppercase tracking-wider transition-all shadow active:scale-98 disabled:opacity-50"
                  >
                    Kích hoạt thuê bao
                  </button>
                </div>

                {/* Option 2: Lifetime permanent unlock */}
                {showLifetimeOption && (
                  <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="font-bold text-amber-500 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        Mở khóa vĩnh viễn
                      </span>
                      <span className="font-black text-amber-500">50 JOY</span>
                    </div>
                    <p className="text-[9.5px] text-muted-foreground leading-relaxed">
                      Hoàn thành chặng! Nhận quyền sở hữu trọn đời học liệu chỉ với một lần trao đổi 50 JOY.
                    </p>
                    <button
                      onClick={() => handleBuyLifetimeUnlock(tierInfo.tier)}
                      disabled={exchangeSubmitting}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-lg text-[10px] uppercase tracking-wider transition-all shadow active:scale-98 disabled:opacity-50"
                    >
                      Mở khóa vĩnh viễn
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <h3 className="font-black text-sm text-foreground">{course.title}</h3>
              <p className="text-[10px] leading-relaxed text-muted-foreground italic">
                File thực hành: <code className="bg-muted px-1.5 py-0.5 rounded border border-border text-[9.5px] font-mono text-primary font-bold">{course.file}</code>
              </p>
            </div>

            <div className="space-y-4">
              <div className="prose prose-sm dark:prose-invert max-w-none text-[11px] leading-6 text-muted-foreground border-l-2 border-border pl-3 space-y-2">
                <p className="whitespace-pre-line leading-relaxed">{course.theory}</p>
              </div>

              {/* Task list / checklist for specific task instructions */}
              {course.tasks && course.tasks.length > 0 && (
                <div className="bg-muted/40 border border-border rounded-xl p-3.5 space-y-2.5 font-sans text-left">
                  <span className="text-[9px] font-black uppercase text-primary tracking-wider block">Yêu cầu hoàn thành:</span>
                  <ul className="space-y-2 text-[10.5px] text-muted-foreground">
                    {course.tasks.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[10px] text-primary select-none mt-0.5">•</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => handleVerifyLesson(course)}
                className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow active:scale-95 ${
                  isCompleted
                    ? "bg-success hover:bg-success/90 text-white"
                    : "bg-primary hover:bg-primary/90 text-white"
                }`}
              >
                {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
                {isCompleted ? "Bài học đã hoàn thành" : "Kiểm tra bài học"}
              </button>
            </div>

            {verificationStatus === "success" && (
              <div className="bg-success/10 border border-success/20 p-3 rounded-xl text-[10.5px] text-success leading-relaxed font-sans">
                🎉 <strong>Tuyệt vời!</strong> Bạn đã hoàn thành xuất sắc các yêu cầu của bài học. Hãy chuyển qua bài học tiếp theo nhé!
              </div>
            )}
            {verificationStatus === "failed" && (
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-xl text-[10.5px] text-destructive leading-relaxed font-sans">
                ❌ <strong>Chưa chính xác!</strong> Mã nguồn trong editor chưa đáp ứng đủ yêu cầu bài học. Hãy đọc lại hướng dẫn và thử lại.
              </div>
            )}
          </div>
        );
      })() : (
        <div className="space-y-4">
          <p className="text-[10px] text-muted-foreground leading-relaxed font-sans">
            Hoàn thành các bài học thực chiến để nắm vững nền tảng Web Development:
          </p>
          
          <div className="space-y-3">
            {phases.map((phase) => {
              const completedCount = phase.lessons.filter(l => completedLessons.includes(l.id)).length;
              const isPhaseCompleted = completedCount === phase.lessons.length;
              const isExpanded = expandedPhases[phase.id];
              const globalStartIndex = phase.id === "basic" ? 0 : phase.id === "intermediate" ? 10 : 25;

              return (
                <div key={phase.id} className="border border-border rounded-xl overflow-hidden bg-card/25">
                  {/* Phase Header */}
                  <div
                    onClick={() => togglePhase(phase.id)}
                    className="flex items-center justify-between p-3 bg-muted/40 hover:bg-muted/65 cursor-pointer transition-all border-b border-border/50 select-none"
                  >
                    <div className="text-left">
                      <h4 className="font-extrabold text-[11px] text-foreground tracking-wide">{phase.title}</h4>
                      <span className="text-[9px] font-bold text-muted-foreground">{phase.rangeText} • {completedCount}/{phase.lessons.length} bài đã học</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isPhaseCompleted && (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-success/20 border border-success/30 text-success text-[8px] font-bold">
                          ✓
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Phase Content */}
                  {isExpanded && (
                    <div className="p-2.5 space-y-2.5 bg-zinc-950/10">
                      
                      {/* Phase completion certificate invitation */}
                      {isPhaseCompleted && (
                        <div className="bg-gradient-to-br from-amber-500/10 to-yellow-600/5 border border-amber-500/30 rounded-xl p-3 text-center space-y-2 shadow-sm animate-fadeIn">
                          <div className="flex items-center justify-center gap-1.5 text-amber-500 font-extrabold text-[10px] uppercase tracking-wider">
                            <Award className="w-4 h-4 text-amber-400" />
                            Hoàn Thành {phase.title}
                          </div>
                          
                          {/* Phase 3, 4, 5, 6: milestone rewards */}
                          {[3, 4, 5, 6].includes(phase.phaseNumber) && (() => {
                            const claimKey = `hugoCoderRewardClaimed${phase.phaseNumber}`;
                            const hasClaimed = !!bio?.[claimKey];
                            return (
                              <div className="space-y-1.5">
                                <p className="text-[9px] text-zinc-400 leading-normal font-sans">
                                  Chúc mừng bạn đã hoàn thành xuất sắc toàn bộ bài học của chặng này!
                                </p>
                                {hasClaimed ? (
                                  <div className="py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold rounded-lg text-[9px] uppercase tracking-wider">
                                    Đã nhận thưởng +800 JOY ✓
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleClaimMilestoneReward(phase.phaseNumber)}
                                    className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 font-black rounded-lg text-[9px] uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
                                  >
                                    Nhận thưởng chặng (+800 JOY)
                                  </button>
                                )}
                              </div>
                            );
                          })()}

                          {/* Phase 7: project submission status */}
                          {phase.phaseNumber === 7 && (() => {
                            const status = bio?.hugoCoderProjectStatus || 'idle';
                            const certUrl = bio?.hugoCoderCertificateUrl || '';
                            const adminNote = bio?.hugoCoderProjectAdminNote || '';
                            
                            return (
                              <div className="space-y-2 text-[9px] font-sans text-zinc-400">
                                {status === 'idle' && (
                                  <p className="leading-normal">
                                    Hãy hoàn thành đề án tốt nghiệp và nộp đường link dự án của bạn tại <strong>Bài 100</strong> để nhận đánh giá từ Hugo Studio.
                                  </p>
                                )}
                                {status === 'pending' && (
                                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 font-bold">
                                    Yêu cầu đang chờ duyệt... ⏳
                                    <p className="text-[8px] font-normal text-zinc-400 mt-1">Hugo Studio đang kiểm tra sản phẩm của bạn.</p>
                                  </div>
                                )}
                                {status === 'rejected' && (
                                  <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive font-bold text-left space-y-1">
                                    <div>Dự án chưa đạt yêu cầu ❌</div>
                                    {adminNote && <p className="text-[8px] font-normal text-zinc-300">Phản hồi: {adminNote}</p>}
                                    <p className="text-[8px] font-normal text-zinc-400 mt-1">Bạn có thể sửa đổi code và nộp lại link mới ở Bài 100.</p>
                                  </div>
                                )}
                                {status === 'approved' && (
                                  <div className="space-y-2">
                                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 font-bold">
                                      Dự án đã được duyệt thành công! 🎉
                                      <p className="text-[8px] font-normal text-zinc-400 mt-1">Đã nhận thưởng 4,000 JOY & phần quà VVIP.</p>
                                    </div>
                                    {certUrl ? (
                                      <a
                                        href={certUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full py-1.5 text-center bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-zinc-950 font-black rounded-lg text-[9px] uppercase tracking-wider transition-all shadow-md"
                                      >
                                        Xem chứng nhận tốt nghiệp 🎓
                                      </a>
                                    ) : (
                                      <p className="text-[8px] text-amber-400 font-bold">Chứng nhận đang được đẩy lên Drive bởi Admin...</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Lessons inside Phase (Minimalist List) */}
                      <div className="divide-y divide-border/30 border border-border/40 rounded-xl overflow-hidden bg-zinc-950/20">
                        {phase.lessons.map((course, idx) => {
                          const index = globalStartIndex + idx;
                          const isCompleted = completedLessons.includes(course.id);
                          const isLocked = index > 0 && !completedLessons.includes(WEB_COURSES[index - 1].id);

                          return (
                            <div
                              key={course.id}
                              className={`flex items-center justify-between px-3 py-2.5 transition-all text-left ${
                                isLocked
                                  ? "opacity-40 cursor-not-allowed bg-black/5"
                                  : "cursor-pointer hover:bg-primary/5 active:bg-primary/10"
                              }`}
                              onClick={() => {
                                if (isLocked) {
                                  notify.error("Vui lòng hoàn thành bài học trước để mở khóa bài này!");
                                  return;
                                }
                                setActiveCourseId(course.id);
                                setVerificationStatus(null);
                                const exists = workspaceFiles.some(f => f.path === course.file);
                                if (!exists) {
                                  const newFile = {
                                    path: course.file,
                                    name: course.file.split("/").pop(),
                                    content: course.starterCode,
                                    language: getLanguageFromExt(course.file.split(".").pop().toLowerCase())
                                  };
                                  setWorkspaceFiles(prev => [...prev, newFile]);
                                }
                                if (!openTabs.includes(course.file)) {
                                  setOpenTabs(prev => [...prev, course.file]);
                                }
                                setActiveTabPath(course.file);
                              }}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="font-mono text-[9px] font-bold text-muted-foreground select-none">
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                                <span className={`text-[11px] font-medium truncate ${isLocked ? "text-muted-foreground/60" : "text-foreground"}`}>
                                  {course.title.replace(/^\d+\.\s*/, "")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isCompleted ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-success" />
                                ) : isLocked ? (
                                  <Lock className="w-3 h-3 text-muted-foreground/40" />
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
        </div>
      )}
    </div>
  );
}
