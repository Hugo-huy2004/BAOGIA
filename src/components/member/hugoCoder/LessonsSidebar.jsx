import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Award, CheckCircle, ChevronDown, ChevronUp, Lock, Clock, Target, ListChecks, Bug, Flame, BookOpen, Wrench } from "lucide-react";
import { notify } from "../../../lib/notify";
import { STAGES } from "./lessons";

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

const markdownComponents = {
  h3: (props) => <h3 className="text-[11px] font-black text-foreground mt-3 mb-1.5 uppercase tracking-wide" {...props} />,
  p: (props) => <p className="text-[11px] leading-6 mb-2 text-muted-foreground" {...props} />,
  strong: (props) => <strong className="font-black text-foreground" {...props} />,
  pre: (props) => <pre className="bg-zinc-950 text-zinc-100 border border-zinc-800 p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto mb-2" {...props} />,
  code: ({ inline, ...props }) => inline
    ? <code className="bg-muted px-1 py-0.5 rounded text-[10px] text-primary font-mono" {...props} />
    : <code className="font-mono text-[10px]" {...props} />,
  ul: (props) => <ul className="list-disc pl-4 mb-2 space-y-1 text-[11px] leading-6 text-muted-foreground" {...props} />,
  ol: (props) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-[11px] leading-6 text-muted-foreground" {...props} />,
  blockquote: (props) => <blockquote className="border-l-2 border-primary/40 bg-primary/5 pl-3 py-1.5 rounded-r-lg mb-2 text-[11px] leading-6 text-muted-foreground" {...props} />,
  table: (props) => <div className="overflow-x-auto mb-2"><table className="text-[10px] border-collapse" {...props} /></div>,
  th: (props) => <th className="border border-border px-2 py-1 bg-muted font-bold text-left" {...props} />,
  td: (props) => <td className="border border-border px-2 py-1" {...props} />
};

export default function LessonsSidebar({
  WEB_COURSES,
  completedLessons,
  activeCourseId,
  setActiveCourseId,
  setVerificationStatus,
  getLessonTierAndAccess,
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
  handlePayMaintenance,
  handleBuyAllStagesBundle
}) {
  const [expandedPhases, setExpandedPhases] = useState({ basic: true });
  // Trắc nghiệm chốt bài trên desktop — bắt buộc trước khi Kiểm tra bài học
  const [quizAnswers, setQuizAnswers] = useState({});
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    setQuizAnswers({});
    setCheckedItems({});
  }, [activeCourseId]);

  const togglePhase = (phaseId) => {
    setExpandedPhases((prev) => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  const phases = STAGES.map((stage) => ({
    ...stage,
    lessons: WEB_COURSES.slice(stage.from, stage.to)
  }));

  const onVerifyClick = (course, isCompleted) => {
    if (!isCompleted && course.miniQuiz?.length) {
      const answeredAll = course.miniQuiz.every((q, i) => quizAnswers[i] !== undefined);
      if (!answeredAll) {
        notify.error(`Hãy trả lời đủ ${course.miniQuiz.length} câu trắc nghiệm chốt bài trước!`);
        return;
      }
      const allCorrect = course.miniQuiz.every((q, i) => quizAnswers[i] === q.a);
      if (!allCorrect) {
        notify.error("Một số câu trắc nghiệm chưa đúng — đọc lại Kiến thức cốt lõi và thử lại!");
        return;
      }
    }
    handleVerifyLesson(course);
  };

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
        const course = WEB_COURSES.find((c) => c.id === activeCourseId);
        const isCompleted = completedLessons.includes(course.id);
        const tierInfo = getLessonTierAndAccess(course.id);

        if (!tierInfo.hasAccess) {
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
                  {!tierInfo.lifetime
                    ? "Nội dung bài học này đang bị khóa. Vui lòng mở khóa vĩnh viễn chặng học tập này hoặc sở hữu trọn gói 6 chặng để bắt đầu."
                    : "Thuê bao bảo trì đã hết hạn. Vui lòng gia hạn 50 JOY bảo trì hàng tháng để tiếp tục học tập."}
                </p>
              </div>

              <div className="space-y-3.5">
                {!tierInfo.lifetime && (
                  <>
                    <div className="border border-border bg-card/50 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-bold text-foreground">Mở khóa vĩnh viễn chặng</span>
                        <span className="font-black text-primary">{tierInfo.price} JOY</span>
                      </div>
                      <p className="text-[9.5px] text-muted-foreground leading-relaxed">
                        Mở khóa vĩnh viễn quyền học và thực hành toàn bộ bài học thuộc {tierInfo.tierLabel}.
                      </p>
                      <button
                        onClick={() => handleBuyLifetimeUnlock(tierInfo.tier)}
                        disabled={exchangeSubmitting}
                        className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-black rounded-lg text-[10px] uppercase tracking-wider transition-all shadow active:scale-98 disabled:opacity-50"
                      >
                        Mở khóa chặng vĩnh viễn
                      </button>
                    </div>

                    <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-bold text-amber-500 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          Trọn gói vĩnh viễn 6 chặng
                        </span>
                        <span className="font-black text-amber-500">16.000 JOY</span>
                      </div>
                      <p className="text-[9.5px] text-muted-foreground leading-relaxed">
                        Mở khóa toàn bộ 100 bài học của 6 chặng vĩnh viễn & được <strong>miễn phí phí bảo trì trọn đời</strong>.
                      </p>
                      <button
                        onClick={() => handleBuyAllStagesBundle()}
                        disabled={exchangeSubmitting}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-lg text-[10px] uppercase tracking-wider transition-all shadow active:scale-98 disabled:opacity-50"
                      >
                        Mua trọn gói 16k JOY
                      </button>
                    </div>
                  </>
                )}

                {tierInfo.lifetime && !tierInfo.maintenanceActive && (
                  <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="font-bold text-red-500">Gia hạn phí bảo trì tháng</span>
                      <span className="font-black text-red-500">50 JOY</span>
                    </div>
                    <p className="text-[9.5px] text-muted-foreground leading-relaxed">
                      Phí bảo trì cần đóng hàng tháng để giữ quyền truy cập. Quá hạn 3 tháng sẽ bị reset tiến trình học về 0.
                    </p>
                    <button
                      onClick={() => handlePayMaintenance()}
                      disabled={exchangeSubmitting}
                      className="w-full py-2 bg-red-500 hover:bg-red-600 text-white font-black rounded-lg text-[10px] uppercase tracking-wider transition-all shadow active:scale-98 disabled:opacity-50"
                    >
                      Đóng phí bảo trì 50 JOY
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
              <div className="flex items-center gap-2 flex-wrap">
                {course.duration && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted border border-border text-[9px] font-bold text-muted-foreground">
                    <Clock className="w-3 h-3" /> {course.duration}
                  </span>
                )}
                <code className="bg-muted px-1.5 py-0.5 rounded border border-border text-[9px] font-mono text-primary font-bold">{course.file}</code>
              </div>
            </div>

            {/* 1. Tổng quan & Mục tiêu */}
            {course.overview && (
              <section className="bg-primary/5 border border-primary/15 rounded-xl p-3 space-y-2">
                <span className="text-[9px] font-black uppercase text-primary tracking-wider flex items-center gap-1">
                  <Target className="w-3 h-3" /> 1. Tổng quan & Mục tiêu
                </span>
                <p className="text-[11px] leading-6 text-muted-foreground">{course.overview.description}</p>
                <ul className="space-y-1.5">
                  {(course.overview.outcomes || []).map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10.5px] text-muted-foreground leading-5">
                      <span className="mt-0.5 w-4 h-4 shrink-0 rounded bg-primary/10 text-primary flex items-center justify-center text-[8px] font-black">{i + 1}</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 2. Kiến thức cốt lõi */}
            <section className="space-y-1.5">
              <span className="text-[9px] font-black uppercase text-primary tracking-wider flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> 2. Kiến thức cốt lõi
              </span>
              <div className="border-l-2 border-border pl-3">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {course.theory}
                </ReactMarkdown>
              </div>
            </section>

            {/* 3. Thực hành & Code mẫu */}
            {course.labSteps?.length > 0 && (
              <section className="bg-muted/40 border border-border rounded-xl p-3 space-y-2">
                <span className="text-[9px] font-black uppercase text-primary tracking-wider flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> 3. Thực hành & Code mẫu
                </span>
                <ol className="space-y-2">
                  {course.labSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10.5px] text-muted-foreground leading-5">
                      <span className="mt-0.5 w-4 h-4 shrink-0 rounded-full bg-primary text-white flex items-center justify-center text-[8px] font-black">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* 4. Bẫy lỗi & Cách khắc phục */}
            {course.commonMistakes?.length > 0 && (
              <section className="space-y-2">
                <span className="text-[9px] font-black uppercase text-warning tracking-wider flex items-center gap-1">
                  <Bug className="w-3 h-3" /> 4. Bẫy lỗi & Cách khắc phục
                </span>
                {course.commonMistakes.map((m, i) => (
                  <div key={i} className="border border-warning/20 bg-warning/5 rounded-lg p-2.5 space-y-1">
                    <p className="text-[10.5px] font-bold text-foreground leading-5">{m.symptom}</p>
                    <p className="text-[10px] text-muted-foreground leading-5"><strong className="text-warning">Nguyên nhân:</strong> {m.cause}</p>
                    <p className="text-[10px] text-muted-foreground leading-5"><strong className="text-success">Cách sửa:</strong> {m.fix}</p>
                  </div>
                ))}
              </section>
            )}

            {/* 5. Thử thách & Checklist thuộc bài */}
            <section className="space-y-2">
              <span className="text-[9px] font-black uppercase text-primary tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3" /> 5. Thử thách & Checklist thuộc bài
              </span>
              {course.challenge && (
                <div className="border border-primary/20 bg-primary/5 rounded-lg p-2.5">
                  <p className="text-[10.5px] text-muted-foreground leading-5"><strong className="text-primary">Thử thách mở rộng:</strong> {course.challenge}</p>
                </div>
              )}
              {course.checklist?.length > 0 && (
                <div className="border border-border rounded-lg p-2.5 space-y-1.5">
                  {course.checklist.map((item, i) => (
                    <label key={i} className="flex items-start gap-2 text-[10.5px] text-muted-foreground leading-5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!checkedItems[i]}
                        onChange={() => setCheckedItems((prev) => ({ ...prev, [i]: !prev[i] }))}
                        className="mt-0.5 accent-current"
                      />
                      <span className={checkedItems[i] ? "line-through opacity-60" : ""}>{item}</span>
                    </label>
                  ))}
                </div>
              )}
            </section>

            {/* Yêu cầu hoàn thành (điều kiện chấm code) */}
            {course.tasks?.length > 0 && (
              <div className="bg-muted/40 border border-border rounded-xl p-3 space-y-2">
                <span className="text-[9px] font-black uppercase text-primary tracking-wider flex items-center gap-1">
                  <ListChecks className="w-3 h-3" /> Yêu cầu hoàn thành (hệ thống chấm)
                </span>
                <ul className="space-y-1.5 text-[10.5px] text-muted-foreground">
                  {course.tasks.map((task, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[10px] text-primary select-none mt-0.5">•</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trắc nghiệm chốt bài — bắt buộc trước khi kiểm tra */}
            {!isCompleted && course.miniQuiz?.length > 0 && (
              <div className="border border-border rounded-xl p-3 space-y-3">
                <span className="text-[9px] font-black uppercase text-primary tracking-wider">
                  Trắc nghiệm chốt bài ({course.miniQuiz.length} câu — trả lời đúng hết để qua bài)
                </span>
                {course.miniQuiz.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-1.5">
                    <p className="text-[10.5px] font-bold text-foreground leading-5">
                      <span className="text-primary mr-1">{qIdx + 1}.</span>{q.q}
                    </p>
                    <div className="space-y-1 pl-1">
                      {q.o.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={() => setQuizAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))}
                          className={`w-full text-left px-2 py-1.5 rounded-lg border text-[10px] transition-all active:scale-[0.99] ${
                            quizAnswers[qIdx] === oIdx
                              ? "bg-primary border-primary text-white font-bold"
                              : "bg-background border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => onVerifyClick(course, isCompleted)}
              className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow active:scale-95 ${
                isCompleted
                  ? "bg-success hover:bg-success/90 text-white"
                  : "bg-primary hover:bg-primary/90 text-white"
              }`}
            >
              {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
              {isCompleted ? "Bài học đã hoàn thành" : "Kiểm tra bài học"}
            </button>

            {verificationStatus === "success" && (
              <div className="bg-success/10 border border-success/20 p-3 rounded-xl text-[10.5px] text-success leading-relaxed font-sans">
                🎉 <strong>Tuyệt vời!</strong> Bạn đã hoàn thành xuất sắc các yêu cầu của bài học. Hãy chuyển qua bài học tiếp theo nhé!
              </div>
            )}
            {verificationStatus === "failed" && (
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-xl text-[10.5px] text-destructive leading-relaxed font-sans">
                ❌ <strong>Chưa chính xác!</strong> Mã nguồn trong editor chưa đáp ứng đủ yêu cầu bài học. Hãy đọc lại phần Thực hành & Code mẫu rồi thử lại.
              </div>
            )}
          </div>
        );
      })() : (
        <div className="space-y-4">
          <p className="text-[10px] text-muted-foreground leading-relaxed font-sans">
            Lộ trình 100 bài — 6 chặng: từ phản xạ cú pháp đến kỹ sư Full-Stack phát hành sản phẩm thật:
          </p>

          <div className="space-y-3">
            {phases.map((phase) => {
              const completedCount = phase.lessons.filter((l) => completedLessons.includes(l.id)).length;
              const isPhaseCompleted = completedCount === phase.lessons.length;
              const isExpanded = expandedPhases[phase.id];

              return (
                <div key={phase.id} className="border border-border rounded-xl overflow-hidden bg-card/25">
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

                  {isExpanded && (
                    <div className="p-2.5 space-y-2.5 bg-zinc-950/10">
                      {isPhaseCompleted && (
                        <div className="bg-gradient-to-br from-amber-500/10 to-yellow-600/5 border border-amber-500/30 rounded-xl p-3 text-center space-y-2 shadow-sm animate-fadeIn">
                          <div className="flex items-center justify-center gap-1.5 text-amber-500 font-extrabold text-[10px] uppercase tracking-wider">
                            <Award className="w-4 h-4 text-amber-400" />
                            Hoàn Thành {phase.title}
                          </div>

                          {[3, 4, 5].includes(phase.phaseNumber) && (() => {
                            const claimKeys = { 3: ["hugoCoderRewardClaimed3"], 4: ["hugoCoderRewardClaimed4", "hugoCoderRewardClaimed5", "hugoCoderRewardClaimed6"], 5: ["hugoCoderRewardClaimed7"] };
                            const hasClaimed = (claimKeys[phase.phaseNumber] || []).some((k) => !!bio?.[k]);
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

                          {phase.phaseNumber === 6 && (() => {
                            const status = bio?.hugoCoderProjectStatus || "idle";
                            const certUrl = bio?.hugoCoderCertificateUrl || "";
                            const adminNote = bio?.hugoCoderProjectAdminNote || "";

                            return (
                              <div className="space-y-2 text-[9px] font-sans text-zinc-400">
                                {status === "idle" && (
                                  <p className="leading-normal">
                                    Hãy hoàn thành đồ án kết khóa và nộp đường link dự án của bạn tại <strong>Bài 100</strong> để nhận đánh giá từ Hugo Studio.
                                  </p>
                                )}
                                {status === "pending" && (
                                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 font-bold">
                                    Yêu cầu đang chờ duyệt... ⏳
                                    <p className="text-[8px] font-normal text-zinc-400 mt-1">Hugo Studio đang kiểm tra sản phẩm của bạn.</p>
                                  </div>
                                )}
                                {status === "rejected" && (
                                  <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive font-bold text-left space-y-1">
                                    <div>Dự án chưa đạt yêu cầu ❌</div>
                                    {adminNote && <p className="text-[8px] font-normal text-zinc-300">Phản hồi: {adminNote}</p>}
                                    <p className="text-[8px] font-normal text-zinc-400 mt-1">Bạn có thể sửa đổi code và nộp lại link mới ở Bài 100.</p>
                                  </div>
                                )}
                                {status === "approved" && (
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
                                        Xem chứng nhận hoàn thành
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

                      <div className="divide-y divide-border/30 border border-border/40 rounded-xl overflow-hidden bg-zinc-950/20">
                        {phase.lessons.map((course, idx) => {
                          const index = phase.from + idx;
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
                                const exists = workspaceFiles.some((f) => f.path === course.file);
                                if (!exists) {
                                  const newFile = {
                                    path: course.file,
                                    name: course.file.split("/").pop(),
                                    content: course.starterCode,
                                    language: getLanguageFromExt(course.file.split(".").pop().toLowerCase())
                                  };
                                  setWorkspaceFiles((prev) => [...prev, newFile]);
                                }
                                if (!openTabs.includes(course.file)) {
                                  setOpenTabs((prev) => [...prev, course.file]);
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
