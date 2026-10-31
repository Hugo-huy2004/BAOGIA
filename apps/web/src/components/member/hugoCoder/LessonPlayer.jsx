import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, BookOpen, Check, ClipboardCopy, GraduationCap, Image, Library, Lightbulb, MessageSquareWarning, RotateCcw, Sparkles, Target, Volume2, VolumeX, Wrench, X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import confetti from "canvas-confetti";
import { notify } from "../../../lib/notify";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import QuizQuestion from "./QuizQuestion";
import LessonBuddy from "./LessonBuddy";
import CodingVisual from "./CodingVisual";
import "../../../styles/hugoCoderLearning.css";
import { CODER_STORAGE_KEYS } from "./workspaceUtils";
import { useEduText } from "../../../education/eduText";

/**
 * Trình phát step — mỗi lần một slide, màn hình cố định.
 *
 * Một step gồm các slide theo bảy phần (giới thiệu, minh hoạ, học thuật, lên ý
 * tưởng, kiến thức chính, áp dụng, trắc nghiệm). Trắc nghiệm cuối step KHÔNG
 * chấm ở đây: đề xuống từ máy chủ đã xáo và không mang đáp án, người học trả lời
 * hết rồi mới nộp, máy chủ chấm và trả lời giải.
 */
const API = import.meta.env.VITE_API_URL || "/api";

// Bước đang học, để tải lại trang không ném người học về đầu bài. Chỉ giữ MỘT
// bài: bỏ dở rồi mở bài khác thì con trỏ cũ vô nghĩa.
const STEP_KEY = "student_ide_lesson_step";
const SOUND_KEY = "coding.sound";

function readStep(lessonId) {
  try {
    const [id, at] = String(localStorage.getItem(STEP_KEY) || "").split(":");
    return id === lessonId ? Math.max(0, Number(at) || 0) : 0;
  } catch {
    return 0;
  }
}

function buildSteps(course, t) {
  if (course.draft) return [];
  const steps = (course.slides || []).map((slide) => ({ kind: slide.section, ...slide }));
  (course.quiz || []).forEach((question, index) => {
    steps.push({ kind: "check", index, title: t("player.question", { n: index + 1, total: course.quiz.length }), question });
  });
  if (course.quiz?.length) steps.push({ kind: "result", title: t("player.resultTitle") });
  return steps;
}

/**
 * Mỗi loại bước một màu và một biểu tượng riêng.
 *
 * Quy ước 'một màu nhấn' của portal áp cho vỏ ứng dụng; trong bài học thì mỗi
 * bước là một CHẾ ĐỘ khác nhau — đang đọc, đang gõ, đang bị nhắc lỗi, đang bị
 * hỏi — và người học cần nhận ra ngay mình đang ở chế độ nào. Vẫn màu đặc,
 * không gradient.
 */
const KIND = {
  intro: { icon: Sparkles, tone: "#0a84ff" },
  visual: { icon: Image, tone: "#30a46c" },
  research: { icon: Library, tone: "#5856d6" },
  ideate: { icon: Lightbulb, tone: "#f76b15" },
  core: { icon: BookOpen, tone: "#0a7ea4" },
  apply: { icon: Wrench, tone: "#12a594" },
  check: { icon: Target, tone: "#8e4ec6" },
  result: { icon: GraduationCap, tone: "#c2410c" },
};

/** Ô góp ý — mở từ icon ở góc, gửi thẳng về Telegram của người vận hành. */
function FeedbackSheet({ course, step, stepIndex, onClose }) {
  const { t } = useEduText();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (message.trim().length < 5 || sending) return;
    setSending(true);
    try {
      const response = await fetch(`${API}/coder-lessons/${course.id}/feedback`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepIndex, stepKind: step.kind, message: message.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || t("player.feedbackFailed"));
      notify.success(t("player.feedbackSent"));
      onClose();
    } catch (error) {
      notify.error(error.message || t("player.feedbackFailed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="lesson-feedback-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="lesson-feedback" onClick={(event) => event.stopPropagation()}>
        <h3>{t("player.feedbackTitle")}</h3>
        <p>{t("player.feedbackBody")}</p>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          maxLength={2000}
          placeholder={t("player.feedbackPlaceholder")}
          autoFocus
        />
        <div className="lesson-feedback-actions">
          <button type="button" className="is-ghost" onClick={onClose}>{t("player.cancel")}</button>
          <button type="button" onClick={send} disabled={message.trim().length < 5 || sending}>
            {sending ? t("player.sending") : t("player.send")}
          </button>
        </div>
      </div>
    </div>
  );
}



/**
 * Card mã mẫu kiểu cửa sổ soạn thảo.
 *
 * Học viên gõ code ở máy mình, nên chỗ này không phải nơi để sửa — nó là khung
 * để NHÌN và CHÉP. Thanh tiêu đề giả lập cửa sổ soạn thảo cho biết đây là mã
 * nguồn chứ không phải một khối chữ; tên tệp lấy từ chính bài học.
 */
function CodeCard({ code, file }) {
  const { t } = useEduText();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      notify.success(t("player.copied"));
    } catch {
      notify.error(t("player.copyFailed"));
    }
  };

  return (
    <div className="lesson-ide">
      <div className="lesson-ide-bar">
        <span className="lesson-ide-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="lesson-ide-file">{file || "starter.js"}</span>
        <button type="button" onClick={copy} aria-label={t("player.copyAria")}>
          <ClipboardCopy aria-hidden="true" />
          <span>{t("player.copy")}</span>
        </button>
      </div>
      <pre className="lesson-ide-code"><code>{code}</code></pre>
    </div>
  );
}

/**
 * Màn chúc mừng sau khi đi hết bài.
 *
 * Hình vẽ bằng SVG nội tuyến chứ không phải tệp ảnh: nó ăn theo màu của chặng,
 * đổi theme là đổi theo, và không tốn thêm một lượt tải nào. Hai lối ra đặt
 * ngang nhau vì cả hai đều hợp lệ — học tiếp hay dừng ở đây là quyền người học,
 * không phải thứ giao diện nên hối thúc.
 */
function LessonDone({ course, stepCount, onExit, onNext }) {
  const { t } = useEduText();
  return (
    <div className="lesson-done">

      <LessonBuddy mood="done" size="lg" seed={stepCount} />

      <h2>{t("player.doneTitle")}</h2>
      <p>{course.title.replace(/^\d+\.\s*/, "")}</p>
      <span className="lesson-done-count">{t("player.doneCount", { n: stepCount })}</span>

      <div className="lesson-done-actions">
        <button type="button" className="is-ghost" onClick={onExit}>{t("player.backToMap")}</button>
        {onNext && <button type="button" onClick={onNext}>{t("player.nextLesson")}<ArrowRight aria-hidden="true" /></button>}
      </div>
    </div>
  );
}

/** Lời giải từng câu sau khi máy chủ chấm. */
function QuizReview({ result, onRetry }) {
  const { t } = useEduText();
  return (
    <div className="lesson-quiz-result">
      <p className={`lesson-quiz-score ${result.passed ? "is-pass" : "is-fail"}`}>
        <b>{result.score}%</b>
        <span>{result.passed
          ? t("player.pass", { correct: result.correct, total: result.total })
          : t("player.fail", { pass: result.passPercent })}</span>
      </p>
      <ol className="lesson-quiz-review">
        {(result.review || []).map((item, index) => (
          <li key={index} className={item.correct ? "is-right" : "is-wrong"}>
            <b>{item.correct ? t("player.right") : t("player.wrongMark")} · {t("player.questionN", { n: index + 1 })}</b>
            {!item.correct && <span>{t("player.answer", { a: item.answer })}</span>}
            {item.why && <span>{item.why}</span>}
          </li>
        ))}
      </ol>
      {!result.passed && (
        <button type="button" className="lesson-quiz-retry" onClick={onRetry}>
          <RotateCcw aria-hidden="true" /> {t("player.retryQuiz")}
        </button>
      )}
    </div>
  );
}

/**
 * Khung phóng to hình trong bài: cuộn chuột / chụm hai ngón để phóng, kéo để di chuyển,
 * bấm đúp để phóng nhanh. Esc hoặc nút X để đóng. Gắn vào body để không bị khung bài cắt.
 */
function MediaZoom({ children, onClose }) {
  const { t } = useEduText();
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const stage = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(0);
  const zoomBy = (factor) => setView((v) => {
    const scale = Math.min(6, Math.max(1, v.scale * factor));
    return scale === 1 ? { scale, x: 0, y: 0 } : { ...v, scale };
  });

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "+" || event.key === "=") zoomBy(1.25);
      if (event.key === "-") zoomBy(0.8);
    };
    // Lắng nghe wheel không-passive để chặn trang phía sau cuộn theo.
    const node = stage.current;
    const onWheel = (event) => { event.preventDefault(); zoomBy(event.deltaY < 0 ? 1.12 : 1 / 1.12); };
    window.addEventListener("keydown", onKey);
    node?.addEventListener("wheel", onWheel, { passive: false });
    return () => { window.removeEventListener("keydown", onKey); node?.removeEventListener("wheel", onWheel); };
  }, [onClose]);

  const down = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    pinch.current = 0;
  };
  const move = (event) => {
    const map = pointers.current;
    const prev = map.get(event.pointerId);
    if (!prev) return;
    map.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (map.size === 2) {
      const [a, b] = [...map.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current) zoomBy(distance / pinch.current);
      pinch.current = distance;
    } else {
      setView((v) => (v.scale === 1 ? v : { ...v, x: v.x + event.clientX - prev.x, y: v.y + event.clientY - prev.y }));
    }
  };
  const up = (event) => { pointers.current.delete(event.pointerId); pinch.current = 0; };

  return createPortal(
    <div className="media-zoom" role="dialog" aria-modal="true" aria-label={t("player.zoom")}>
      <div
        ref={stage}
        className="media-zoom-stage"
        data-lg-off
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onDoubleClick={() => setView((v) => (v.scale > 1 ? { scale: 1, x: 0, y: 0 } : { ...v, scale: 2.5 }))}
      >
        <div className="media-zoom-content" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, cursor: view.scale > 1 ? "grab" : "zoom-in" }}>
          {children}
        </div>
      </div>
      <div className="media-zoom-bar">
        <button type="button" onClick={() => zoomBy(0.8)} aria-label={t("player.zoomOut")} disabled={view.scale <= 1}><ZoomOut aria-hidden="true" /></button>
        <span>{Math.round(view.scale * 100)}%</span>
        <button type="button" onClick={() => zoomBy(1.25)} aria-label={t("player.zoomIn")} disabled={view.scale >= 6}><ZoomIn aria-hidden="true" /></button>
        <button type="button" onClick={() => setView({ scale: 1, x: 0, y: 0 })} aria-label={t("player.zoomReset")}><RotateCcw aria-hidden="true" /></button>
        <button type="button" onClick={onClose} aria-label={t("common.close")}><X aria-hidden="true" /></button>
      </div>
      <p className="media-zoom-hint">{t("player.zoomHint")}</p>
    </div>,
    document.body,
  );
}

/**
 * @param {(answers: unknown[]) => Promise<object>} onSubmitQuiz  nộp câu trả lời,
 *   trả `{ passed, score, correct, total, passPercent, review }` do máy chủ chấm.
 */
export default function LessonPlayer({ course, onExit, onSubmitQuiz, onNextLesson }) {
  const { t, lang } = useEduText();
  const steps = useMemo(() => buildSteps(course, t), [course, lang]); // eslint-disable-line react-hooks/exhaustive-deps -- t đổi theo lang
  const [zoomOpen, setZoomOpen] = useState(false);
  const firstCheck = steps.findIndex((step) => step.kind === "check");
  // Câu trả lời không lưu qua lần tải lại, nên quay về giữa bài trắc nghiệm thì
  // làm lại từ câu đầu — nộp với ô trống chỉ tốn một lượt chấm vô ích.
  const resumeAt = () => {
    const saved = Math.min(readStep(course.id), Math.max(0, steps.length - 1));
    return firstCheck >= 0 && saved > firstCheck ? firstCheck : saved;
  };
  const [index, setIndex] = useState(resumeAt);
  const [answers, setAnswers] = useState({});
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Dùng lại bộ âm của Arcade: tổng hợp bằng Web Audio, không tải tệp nào.
  // Âm thanh tắt được và nhớ lựa chọn trên máy — học ở thư viện, lớp học thì cần im.
  const sound = useArcadeSound();
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem(SOUND_KEY) === "off"; } catch { return false; }
  });
  const sfx = (name) => { if (!muted) sound[name](); };
  const toggleSound = () => setMuted((current) => {
    try { localStorage.setItem(SOUND_KEY, current ? "on" : "off"); } catch { /* chỉ mất lựa chọn */ }
    return !current;
  });

  useEffect(() => {
    setIndex(resumeAt());
    setAnswers({});
    setDone(false);
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ đặt lại khi đổi step
  }, [course.id]);

  // Ghi lại chỗ đang đứng, và step này là step mở gần nhất (bản đồ đọc `lastLesson`).
  useEffect(() => {
    try {
      localStorage.setItem(STEP_KEY, `${course.id}:${index}`);
      localStorage.setItem(CODER_STORAGE_KEYS.lastLesson, course.id);
    } catch {
      /* hết quota: chỉ mất chỗ đang đọc, step vẫn chạy bình thường */
    }
  }, [course.id, index]);

  if (course.draft) {
    return (
      <div className="lesson-player">
        <div className="lesson-done">
          <LessonBuddy mood="learn" size="lg" seed={1} />
          <h2>{t("player.draft")}</h2>
          <p>{course.title.replace(/^\d+\.\s*/, "")}</p>
          <div className="lesson-done-actions">
            <button type="button" onClick={onExit}>{t("player.backToMap")}</button>
          </div>
        </div>
      </div>
    );
  }

  const step = steps[Math.min(index, steps.length - 1)];
  if (!step) return null;
  const last = index >= steps.length - 1;
  const percent = steps.length ? Math.round(((index + 1) / steps.length) * 100) : 0;

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const ordered = course.quiz.map((_, i) => answers[i]);
      const graded = await onSubmitQuiz(ordered);
      setResult(graded);
      if (graded.passed) {
        sfx("playWin");
        confetti({ particleCount: 170, spread: 105, origin: { y: 0.62 }, disableForReducedMotion: true });
      } else {
        sfx("playLose");
      }
    } catch (error) {
      notify.error(error.message || t("player.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    sfx("playBeep");
    if (step.kind === "result") {
      if (result?.passed) setDone(true);
      else if (!result) submitQuiz();
      return;
    }
    // Câu trắc nghiệm cuối cùng: sang màn kết quả là nộp luôn.
    if (steps[index + 1]?.kind === "result") {
      setIndex(index + 1);
      submitQuiz();
      return;
    }
    if (!last) setIndex(index + 1);
  };

  const retry = () => {
    setAnswers({});
    setResult(null);
    setIndex(firstCheck);
  };

  const ready = step.kind === "check"
    ? answers[step.index] !== undefined
    : step.kind === "result" ? !submitting && (result?.passed || !result) : true;
  const kind = KIND[step.kind] || KIND.core;
  const media = step.visual
    ? <CodingVisual name={step.visual} label={step.title} />
    : step.image ? <img className="coding-shot-img" src={step.image.src} alt={step.image.alt} loading="lazy" decoding="async" /> : null;
  const KindIcon = kind.icon;
  const STEP_MOOD = { apply: "practice", check: "exam", result: result?.passed ? "correct" : result ? "wrong" : "exam" };

  if (done) {
    return (
      <div className="lesson-player">
        <LessonDone course={course} stepCount={steps.length} onExit={onExit} onNext={onNextLesson} />
      </div>
    );
  }

  return (
    <div className={`lesson-player is-${step.kind}`} style={{ "--step-tone": kind.tone }}>
      <header className="lesson-player-top">
        <button type="button" onClick={onExit} aria-label={t("player.exit")}>
          <X aria-hidden="true" />
        </button>
        <span className="lesson-player-track" aria-label={`${percent}%`}>
          <i style={{ width: `${percent}%` }} />
        </span>
        <span className="lesson-player-count">{index + 1}/{steps.length}</span>
        <button type="button" className="lesson-player-sound" onClick={toggleSound} aria-label={muted ? t("player.soundOn") : t("player.soundOff")} aria-pressed={!muted}>
          {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
        </button>
        {/* Góp ý ở góc mọi slide: người học nói đúng lúc họ vấp. */}
        <button type="button" className="lesson-player-flag" onClick={() => setFeedbackOpen(true)} aria-label={t("player.flag")}>
          <MessageSquareWarning aria-hidden="true" />
        </button>
      </header>

      <main key={index} className={`lesson-player-body is-${step.kind}`} style={{ "--step-tone": kind.tone }}>
        <div className="lesson-player-head">
          <span className="lesson-player-badge" aria-hidden="true"><KindIcon /></span>
          <span className="lesson-player-kind">{t(`player.kinds.${KIND[step.kind] ? step.kind : "core"}`)}</span>
          {step.title && <h2 className="lesson-player-title">{step.title}</h2>}
        </div>

        <div className={`lesson-player-content${media ? " has-media" : ""}`}>
          {/* Hình minh hoạ / ảnh chụp màn hình: máy tính chia đôi (hình bên trái, chữ bên phải),
              bấm vào để phóng to xem kỹ và làm theo. */}
          {media && (
            <div className="lesson-media">
              <button type="button" className="lesson-media-open" onClick={() => setZoomOpen(true)} aria-label={t("player.zoom")}>
                {media}
                <span className="lesson-media-badge" aria-hidden="true"><Maximize2 /></span>
              </button>
              {step.image?.caption && <p className="lesson-media-caption">{step.image.caption}</p>}
            </div>
          )}

          {step.body && (
            <div className="lesson-player-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.body}</ReactMarkdown>
            </div>
          )}

          {step.code && <CodeCard code={step.code.content} file={step.code.file} />}

          {step.kind === "check" && (
            <QuizQuestion
              question={step.question}
              index={step.index}
              value={answers[step.index]}
              onChange={(answer) => {
                sfx("playMove");
                setAnswers((current) => ({ ...current, [step.index]: answer }));
              }}
              reviewed={false}
            />
          )}

          {step.kind === "result" && (
            result
              ? <QuizReview result={result} onRetry={retry} />
              : <p className="lesson-player-lead">{submitting ? t("player.grading") : t("player.notSubmitted")}</p>
          )}
        </div>

        <LessonBuddy mood={STEP_MOOD[step.kind] || "learn"} seed={index} />
      </main>

      {!(step.kind === "result" && result && !result.passed) && (
        <footer className="lesson-player-foot">
          {/* Quay lại slide trước để đọc lại; màn kết quả thì không (bài đã nộp). */}
          {index > 0 && step.kind !== "result" && (
            <button type="button" className="lesson-player-back" onClick={() => setIndex(index - 1)} aria-label={t("player.prev")}>
              <ArrowLeft aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={next} disabled={!ready}>
            {step.kind === "result"
              ? (result?.passed ? t("player.finish") : t("player.resubmit"))
              : steps[index + 1]?.kind === "result" ? t("player.submit") : step.kind === "check" ? t("player.nextQuestion") : t("player.continue")}
            {step.kind === "check" ? <Check aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
          </button>
        </footer>
      )}

      {zoomOpen && media && <MediaZoom onClose={() => setZoomOpen(false)}>{media}</MediaZoom>}

      {feedbackOpen && (
        <FeedbackSheet course={course} step={step} stepIndex={index} onClose={() => setFeedbackOpen(false)} />
      )}
    </div>
  );
}
