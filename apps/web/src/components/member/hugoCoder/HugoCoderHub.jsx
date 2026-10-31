import { useEffect, useMemo, useRef, useState } from "react";
import { Award, Braces, ChevronLeft, FileText, GraduationCap, MonitorPlay, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { notify } from "../../../lib/notify";
import { useCoderLessons } from "../../../hooks/useCoderLessons";
import { STAGE_THEME } from "./stageThemes";
import { CODER_STORAGE_KEYS } from "./workspaceUtils";
import CoderLearningJourney from "./CoderLearningJourney";
import { ResourcePreview } from "../../admin/AdminCoderResourcesTab";
import { getMemberSession } from "../../../services/api/core/authSession";
import { hugoCoderApi } from "../../../services/api/modules/hugoCoderApi";
import LessonPlayer from "./LessonPlayer";
import { joyText } from "../../../lib/joyDisplay";
import "../../../styles/hugoCoderLearning.css";
import "../study/study-course-ios17.css";


function percentage(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

// Thẻ skeleton — dùng khi đang tải HOẶC chưa có học liệu nào (giữ layout không trống trải)
function ResourceSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
      <div className="w-full aspect-video bg-muted animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 w-4/5 rounded bg-muted animate-pulse" />
        <div className="h-2.5 w-2/5 rounded bg-muted animate-pulse" />
        <div className="h-2.5 w-full rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

// ====== Tab Video / Tài liệu — học liệu admin đăng, có preview trực quan ======
function ResourceGrid({ type, stages }) {
  const [items, setItems] = useState(null);
  const [stage, setStage] = useState("all");
  const apiBase = import.meta.env.VITE_API_URL || "/api";
  const stageFilters = [
    { id: "all", label: "Tất cả" },
    ...stages.map((item) => ({ id: item.id, label: `Chặng ${item.phaseNumber}` })),
  ];
  const stageLabels = Object.fromEntries(
    stages.map((item) => [item.id, `Chặng ${item.phaseNumber}`]),
  );

  useEffect(() => {
    let alive = true;
    setItems(null);
    fetch(`${apiBase}/coder-resources?type=${type}&stage=${stage}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { items: [] }))   // endpoint chưa sẵn / 404 → rỗng, không ném lỗi
      .then((d) => alive && setItems(d.items || []))
      .catch(() => alive && setItems([]));
    return () => { alive = false; };
  }, [type, stage]);

  const loading = items === null;
  const empty = items?.length === 0;

  return (
    <div className="space-y-4">
      {/* Bộ lọc chặng — màu theo chặng, đồng bộ với bản đồ & trang Quản lý */}
      <div className="flex gap-1.5 flex-wrap">
        {stageFilters.map((f) => {
          const active = stage === f.id;
          const th = STAGE_THEME[f.id];
          return (
            <button
              key={f.id}
              onClick={() => setStage(f.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-black border transition-all active:scale-95 ${
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-muted text-muted-foreground border-border hover:bg-muted/70"
              }`}
            >
              {th && <span className={`w-2 h-2 rounded-full ${active ? "bg-background" : th.dot}`} />}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Đang tải HOẶC chưa có học liệu → skeleton (không để trống trải) */}
      {(loading || empty) && (
        <>
          {empty && (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2.5">
              <span className="material-symbols-outlined text-lg text-muted-foreground">{type === "video" ? "smart_display" : "menu_book"}</span>
              <p className="text-[13px] text-muted-foreground leading-4">
                {type === "video" ? "Video bài học đang được biên soạn" : "Tài liệu học thuật đang được tuyển chọn"} — Hugo Studio sẽ đăng dần theo từng chặng.
              </p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => <ResourceSkeleton key={i} />)}
          </div>
        </>
      )}

      {/* Có học liệu */}
      {!loading && !empty && (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((item) => {
            const th = STAGE_THEME[item.stageId];
            return (
              <div key={item._id} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
                <ResourcePreview type={item.type} url={item.url} className="w-full aspect-video" />
                <div className="p-3 space-y-1.5 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] font-black uppercase tracking-wide border ${th ? th.chip : "bg-muted text-muted-foreground border-border"}`}>
                      {th && <span className={`w-1.5 h-1.5 rounded-full ${th.dot}`} />}
                      {stageLabels[item.stageId] || "Mọi chặng"}
                    </span>
                  </div>
                  <p className="text-sm font-black text-foreground leading-snug">{item.title}</p>
                  {item.source && <p className="text-[13px] font-bold text-muted-foreground">Nguồn: {item.source}</p>}
                  {item.description && <p className="text-[13px] text-muted-foreground leading-5 line-clamp-3">{item.description}</p>}
                  <div className="pt-1">
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[13px] font-black uppercase tracking-wider text-foreground underline underline-offset-2">
                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                      Mở {item.type === "video" ? "video" : "tài liệu"}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LearningResources({ stages }) {
  const { t } = useTranslation();
  const [type, setType] = useState("video");

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-[-0.03em] text-foreground">
          {t("hugoCoderLearning.resources.title")}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {t("hugoCoderLearning.resources.description")}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-muted/60 p-1">
        <button
          type="button"
          onClick={() => setType("video")}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition ${
            type === "video" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
          }`}
        >
          <MonitorPlay className="h-4 w-4" />
          {t("hugoCoderLearning.resources.video")}
        </button>
        <button
          type="button"
          onClick={() => setType("document")}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition ${
            type === "document" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          {t("hugoCoderLearning.resources.documents")}
        </button>
      </div>
      <ResourceGrid type={type} stages={stages} />
    </div>
  );
}

// ====== Tiến độ — danh hiệu, chặng, điểm trắc nghiệm (Education Hugo dùng lại) ======
export function ManageTab({ bio, courses, stages }) {
  const completed = useMemo(
    () => (bio?.completedLessons || []).filter((id) => courses.some((c) => c.id === id)),
    [bio?.completedLessons, courses]
  );
  const stageEarned = (stage) => {
    const lastId = `step${stage.to}`;
    if (stage.phaseNumber === 6) return completed.includes(lastId) || bio?.hugoCoderProjectStatus === "approved";
    return completed.includes(lastId);
  };

  const scores = bio?.hugoCoderExamScores || {};
  const scoredSteps = courses.filter((course) => scores[course.id]);
  const earnedCount = stages.filter(stageEarned).length;
  // Danh hiệu theo chặng đã đi qua (6 / 11 / 15 / 19 / 22 step).
  const rank =
    completed.length >= 22 ? "Kỹ sư Full-Stack"
    : completed.length >= 19 ? "Kỹ sư Bảo mật Web"
    : completed.length >= 15 ? "Lập trình viên CRUD"
    : completed.length >= 11 ? "Lập trình viên PHP & SQL"
    : completed.length >= 6 ? "Lập trình viên Web nền tảng"
    : "Học viên Nhập môn";

  const pct = percentage(completed.length, courses.length);

  return (
    <div className="space-y-5">
      {/* HERO — danh hiệu + vòng tiến độ */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-5 text-white shadow-lg">
        <div className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          {/* Vòng tiến độ SVG */}
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3.5" />
              <circle
                cx="18" cy="18" r="15.9" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray={`${pct} ${100 - pct}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black leading-none">{pct}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-black uppercase tracking-widest text-white/70">Danh hiệu hiện tại</p>
            <h3 className="text-lg font-black leading-tight truncate">{rank}</h3>
            <p className="text-[13px] text-white/80 mt-0.5">{completed.length}/{courses.length} step • {earnedCount}/{stages.length} chặng hoàn thành</p>
          </div>
        </div>
      </section>

      {/* Điểm trắc nghiệm do máy chủ chấm — lần đầu và tốt nhất. */}
      {scoredSteps.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-[13px] font-black text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center"><GraduationCap className="w-3.5 h-3.5 text-foreground" /></span>
            Điểm trắc nghiệm
          </h3>
          <div className="space-y-1.5">
            {scoredSteps.map((step) => {
              const entry = scores[step.id];
              return (
                <div key={step.id} className="flex items-center justify-between gap-2 text-[13px] py-2 border-b border-border/40 last:border-0">
                  <span className="text-foreground/80 truncate">{step.title}</span>
                  <span className="shrink-0 text-[13px] font-black text-muted-foreground">
                    lần đầu {entry.firstTry}% · cao nhất {entry.best}%
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}

// ====== Vỏ toàn màn hình của khoá Coding ======
// Hai màn: BẢN ĐỒ khoá học và TRÌNH PHÁT step; địa chỉ quyết định đang ở màn nào.
// `framed`: bản đồ nằm trong khung AppFrame của app Coding — chỉ vẽ nội dung,
// không dựng vỏ toàn màn và thanh đầu riêng. Bảng Tiến độ khi đó do khung điều
// khiển qua `progressOpen`/`onProgressChange`.
export default function HugoCoderHub({ onBack, bio, onBioUpdate, urlLessonId, basePath = "/member/utilities/study/coding", framed = false, progressOpen: controlledProgress, onProgressChange, program = "coding", programProgress = null, maxSteps = null, onProgramProgress, onLessonChange }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ownProgress, setOwnProgress] = useState(false);
  const progressOpen = controlledProgress ?? ownProgress;
  const setProgressOpen = onProgressChange ?? setOwnProgress;
  // Step đang mở đọc THẲNG từ địa chỉ (`basePath/stepN`): tải lại trang là ở
  // nguyên chỗ đang học.
  const selectedLessonId = urlLessonId || null;
  const { courses: allCourses, stages, loading, detailReady, detailError } = useCoderLessons(selectedLessonId, { program });
  const courses = maxSteps ? allCourses.slice(0, maxSteps) : allCourses;
  const progressBio = program === "hugoteam" ? { ...bio, completedLessons: programProgress || [] } : bio;
  const onBioUpdateRef = useRef(onBioUpdate);

  useEffect(() => {
    onBioUpdateRef.current = onBioUpdate;
  }, [onBioUpdate]);

  useEffect(() => {
    if (!getMemberSession()?.email) return undefined;
    let active = true;
    hugoCoderApi.getAccessSnapshot()
      .then(({ bio: accessBio }) => {
        if (!active || !accessBio) return;
        onBioUpdateRef.current?.(accessBio);
      })
      .catch(() => {
        // Hồ sơ đã lưu vẫn dùng được khi mất mạng.
      });
    return () => {
      active = false;
    };
  }, []);

  const openLesson = (lessonId) => onLessonChange ? onLessonChange(lessonId) : navigate(`${basePath}/${lessonId}`);
  // Thoát step thì về BẢN ĐỒ khoá học, không văng ra ngoài app.
  const exitLesson = () => onLessonChange ? onLessonChange(null) : navigate(basePath);

  // Quyền đọc step do MÁY CHỦ quyết định; client không tự đoán.
  const lessonLocked = [401, 403].includes(detailError?.status);

  // Khoá học miễn phí: bị từ chối chỉ còn hai lẽ — chưa đăng nhập (401) hoặc
  // mở từ Hugo Team khi không còn ở giai đoạn Coding (403).
  const lockedNotice = (
    <div className="max-w-lg mx-auto mt-10 rounded-2xl border border-border bg-card p-6 text-center space-y-3">
      <p className="text-[15px] font-black text-foreground">
        {detailError?.status === 401 ? "Đăng nhập để học tiếp" : "Chưa mở được step này"}
      </p>
      <p className="text-[14px] text-muted-foreground">{detailError?.message || "Khoá Coding miễn phí, chỉ cần đăng nhập để lưu tiến độ."}</p>
      <div className="flex justify-center gap-2">
        {detailError?.status === 401 && (
          <a href="/login" className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-[14px] font-black">Đăng nhập</a>
        )}
        <button type="button" onClick={exitLesson} className="px-4 py-2.5 rounded-xl bg-muted text-foreground text-[14px] font-black">Về bản đồ</button>
      </div>
    </div>
  );

  const apiBase = import.meta.env.VITE_API_URL || "/api";

  /**
   * Nộp trắc nghiệm cuối step. Thành viên nộp qua award-learning: máy chủ chấm,
   * ghi điểm, kiểm thứ tự step và quyền, đạt thì ghi tiến độ. Khách học thử chỉ
   * được chấm (không lưu) ở 6 step đầu.
   */
  const submitQuiz = async (course, answers) => {
    const member = Boolean(getMemberSession()?.email);
    const response = await fetch(member ? `${apiBase}/joy/award-learning` : `${apiBase}/coder-lessons/${course.id}/grade`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member ? { lessonId: course.id, evidence: { answers }, program } : { answers }),
    });
    const data = await response.json().catch(() => ({}));
    // Chưa đạt vẫn là kết quả hợp lệ kèm lời giải, không phải lỗi mạng.
    if (!response.ok && data.code !== "QUIZ_BELOW_PASS") {
      throw new Error(data.error || "Chưa nộp được bài, hãy thử lại.");
    }
    if (member && data.passed && !data.alreadyCompleted) {
      try {
        const key = CODER_STORAGE_KEYS.progress;
        const done = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(done) && !done.includes(course.id)) {
          localStorage.setItem(key, JSON.stringify([...done, course.id]));
        }
      } catch {
        /* hết quota: bản đồ tự đúng lại ở lần tải sau */
      }
      onBioUpdate?.({
        ...bio,
        completedLessons: [...new Set([...(bio?.completedLessons || []), course.id])],
        hugoCoderExamScores: { ...(bio?.hugoCoderExamScores || {}), [course.id]: (({ best, firstTry } = bio?.hugoCoderExamScores?.[course.id] || {}) => ({ best: Math.max(Number(best) || 0, data.score), firstTry: firstTry ?? data.score }))() },
        ...(Number.isFinite(data.balance) ? { joyBalance: data.balance } : {}),
      });
      // Qua step lần đầu: +5 JOY mỗi câu đúng (máy chủ tính, xem award-learning).
      if (data.joyEarned > 0) notify.success(`+${joyText(data.joyEarned)} · ${data.correct}/${data.total} câu đúng`);
      if (program === "hugoteam") onProgramProgress?.(data);
    }
    if (member && program === "hugoteam" && data.alreadyCompleted) onProgramProgress?.(data);
    if (!member && data.passed) notify.info("Đăng nhập để lưu tiến độ học tập.");
    return data;
  };

  const currentCourse = courses.find((course) => course.id === selectedLessonId) || null;
  // Step kế tiếp theo đúng thứ tự lộ trình; step cuối thì không có nút "Step tiếp".
  const nextLessonId = (() => {
    const at = courses.findIndex((course) => course.id === selectedLessonId);
    return at >= 0 ? courses[at + 1]?.id || null : null;
  })();
  const playable = currentCourse && !lessonLocked && (currentCourse.draft || detailReady);

  const progressSheet = progressOpen && (
    <div className="cmap-sheet-backdrop" role="presentation" onClick={() => setProgressOpen(false)}>
      <div className="cmap-sheet coder-progress-sheet" role="dialog" aria-modal="true" aria-label="Tiến độ" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="cmap-sheet-close" onClick={() => setProgressOpen(false)} aria-label="Đóng"><X aria-hidden="true" /></button>
        <ManageTab bio={bio} courses={courses} stages={stages} />
      </div>
    </div>
  );

  if (framed) {
    return (
      <>
        <CoderLearningJourney bio={progressBio} courses={courses} stages={stages} loading={loading} onOpenLesson={openLesson} includeLocalProgress={program !== "hugoteam"} />
        {progressSheet}
      </>
    );
  }

  return (
    <div className="hugo-coder-shell fixed inset-0 z-50 flex flex-col text-foreground">
      {playable ? (
        <LessonPlayer
          course={currentCourse}
          onExit={exitLesson}
          onSubmitQuiz={(answers) => submitQuiz(currentCourse, answers)}
          onNextLesson={nextLessonId ? () => openLesson(nextLessonId) : undefined}
        />
      ) : (
        <>
          <header className="coder-hub-header shrink-0">
            <div className="coder-hub-titlebar">
              <button onClick={currentCourse ? exitLesson : onBack} className="coder-hub-back" aria-label={t("hugoCoderLearning.back")}>
                <ChevronLeft />
                <span>{t("hugoCoderLearning.back")}</span>
              </button>
              <div className="coder-hub-brand">
                <span><Braces /></span>
                <h2>Coding</h2>
              </div>
              {/* Tiến độ, giấy chứng nhận và gói đã sở hữu — gom vào một nút. */}
              <button type="button" className="coder-hub-progress" onClick={() => setProgressOpen(true)} aria-label="Tiến độ và giấy chứng nhận">
                <Award aria-hidden="true" />
                <span>Tiến độ</span>
              </button>
            </div>
          </header>

          <div className="flex-1 min-h-0">
            {lessonLocked ? (
              <div className="h-full overflow-y-auto px-4">
                {lockedNotice}
              </div>
            ) : (
              <div className="h-full overflow-x-hidden overflow-y-auto overscroll-y-contain">
                <CoderLearningJourney
                  bio={progressBio}
                  courses={courses}
                  stages={stages}
                  loading={loading || Boolean(currentCourse && !detailError)}
                  onOpenLesson={openLesson}
                  includeLocalProgress={program !== "hugoteam"}
                />
              </div>
            )}
          </div>
        </>
      )}

      {progressSheet}
    </div>
  );
}
