import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowRight, BookOpen, Check, ClipboardCopy, GraduationCap, Image, Library, Lightbulb, MessageSquareWarning, RotateCcw, Sparkles, Target, Volume2, VolumeX, Wrench, X } from "lucide-react";
import confetti from "canvas-confetti";
import { notify } from "../../../lib/notify";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import QuizQuestion from "./QuizQuestion";
import LessonBuddy from "./LessonBuddy";
import CodingVisual from "./CodingVisual";
import "../../../styles/hugoCoderLearning.css";
import { CODER_STORAGE_KEYS } from "./workspaceUtils";

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

function buildSteps(course) {
  if (course.draft) return [];
  const steps = (course.slides || []).map((slide) => ({ kind: slide.section, ...slide }));
  (course.quiz || []).forEach((question, index) => {
    steps.push({ kind: "check", index, title: `Câu ${index + 1}/${course.quiz.length}`, question });
  });
  if (course.quiz?.length) steps.push({ kind: "result", title: "Kết quả trắc nghiệm" });
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
  intro: { label: "Giới thiệu", icon: Sparkles, tone: "#0a84ff" },
  visual: { label: "Minh hoạ", icon: Image, tone: "#30a46c" },
  research: { label: "Học thuật & nghiên cứu", icon: Library, tone: "#5856d6" },
  ideate: { label: "Lên ý tưởng", icon: Lightbulb, tone: "#f76b15" },
  core: { label: "Kiến thức chính", icon: BookOpen, tone: "#0a7ea4" },
  apply: { label: "Áp dụng vào dự án", icon: Wrench, tone: "#12a594" },
  check: { label: "Trắc nghiệm", icon: Target, tone: "#8e4ec6" },
  result: { label: "Kết quả", icon: GraduationCap, tone: "#c2410c" },
};

/** Ô góp ý — mở từ icon ở góc, gửi thẳng về Telegram của người vận hành. */
function FeedbackSheet({ course, step, stepIndex, onClose }) {
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
      if (!response.ok) throw new Error(data.error || "Chưa gửi được góp ý.");
      notify.success("Đã gửi góp ý. Cảm ơn bạn.");
      onClose();
    } catch (error) {
      notify.error(error.message || "Chưa gửi được góp ý.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="lesson-feedback-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="lesson-feedback" onClick={(event) => event.stopPropagation()}>
        <h3>Góp ý cho bước này</h3>
        <p>Chỗ nào khó hiểu, sai, hoặc thiếu? Góp ý đi thẳng tới người soạn bài.</p>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Ví dụ: đoạn này chưa giải thích vì sao phải dùng…"
          autoFocus
        />
        <div className="lesson-feedback-actions">
          <button type="button" className="is-ghost" onClick={onClose}>Huỷ</button>
          <button type="button" onClick={send} disabled={message.trim().length < 5 || sending}>
            {sending ? "Đang gửi…" : "Gửi góp ý"}
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
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      notify.success("Đã chép. Dán vào trình soạn thảo của bạn.");
    } catch {
      notify.error("Chưa chép được — hãy bôi đen và chép tay.");
    }
  };

  return (
    <div className="lesson-ide">
      <div className="lesson-ide-bar">
        <span className="lesson-ide-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="lesson-ide-file">{file || "starter.js"}</span>
        <button type="button" onClick={copy} aria-label="Chép mã mẫu">
          <ClipboardCopy aria-hidden="true" />
          <span>Chép</span>
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
  return (
    <div className="lesson-done">

      <LessonBuddy mood="done" size="lg" seed={stepCount} />

      <h2>Hoàn thành bài</h2>
      <p>{course.title.replace(/^\d+\.\s*/, "")}</p>
      <span className="lesson-done-count">{stepCount} slide đã đi qua</span>

      <div className="lesson-done-actions">
        <button type="button" className="is-ghost" onClick={onExit}>Trở về bản đồ</button>
        {onNext && <button type="button" onClick={onNext}>Bài tiếp<ArrowRight aria-hidden="true" /></button>}
      </div>
    </div>
  );
}

/** Lời giải từng câu sau khi máy chủ chấm. */
function QuizReview({ result, onRetry }) {
  return (
    <div className="lesson-quiz-result">
      <p className={`lesson-quiz-score ${result.passed ? "is-pass" : "is-fail"}`}>
        <b>{result.score}%</b>
        <span>{result.passed
          ? `Đạt — đúng ${result.correct}/${result.total} câu.`
          : `Chưa đạt — cần từ ${result.passPercent}%. Đọc lời giải rồi làm lại.`}</span>
      </p>
      <ol className="lesson-quiz-review">
        {(result.review || []).map((item, index) => (
          <li key={index} className={item.correct ? "is-right" : "is-wrong"}>
            <b>{item.correct ? "Đúng" : "Sai"} · Câu {index + 1}</b>
            {!item.correct && <span>Đáp án: {item.answer}</span>}
            {item.why && <span>{item.why}</span>}
          </li>
        ))}
      </ol>
      {!result.passed && (
        <button type="button" className="lesson-quiz-retry" onClick={onRetry}>
          <RotateCcw aria-hidden="true" /> Làm lại trắc nghiệm
        </button>
      )}
    </div>
  );
}

/**
 * @param {(answers: unknown[]) => Promise<object>} onSubmitQuiz  nộp câu trả lời,
 *   trả `{ passed, score, correct, total, passPercent, review }` do máy chủ chấm.
 */
export default function LessonPlayer({ course, onExit, onSubmitQuiz, onNextLesson }) {
  const steps = useMemo(() => buildSteps(course), [course]);
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
          <h2>Bài này đang được soạn</h2>
          <p>{course.title.replace(/^\d+\.\s*/, "")}</p>
          <div className="lesson-done-actions">
            <button type="button" onClick={onExit}>Trở về bản đồ</button>
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
      notify.error(error.message || "Chưa nộp được bài, hãy thử lại.");
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
        <button type="button" onClick={onExit} aria-label="Thoát step">
          <X aria-hidden="true" />
        </button>
        <span className="lesson-player-track" aria-label={`${percent}%`}>
          <i style={{ width: `${percent}%` }} />
        </span>
        <span className="lesson-player-count">{index + 1}/{steps.length}</span>
        <button type="button" className="lesson-player-sound" onClick={toggleSound} aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"} aria-pressed={!muted}>
          {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
        </button>
        {/* Góp ý ở góc mọi slide: người học nói đúng lúc họ vấp. */}
        <button type="button" className="lesson-player-flag" onClick={() => setFeedbackOpen(true)} aria-label="Góp ý cho slide này">
          <MessageSquareWarning aria-hidden="true" />
        </button>
      </header>

      <main key={index} className={`lesson-player-body is-${step.kind}`} style={{ "--step-tone": kind.tone }}>
        <div className="lesson-player-head">
          <span className="lesson-player-badge" aria-hidden="true"><KindIcon /></span>
          <span className="lesson-player-kind">{kind.label}</span>
          {step.title && <h2 className="lesson-player-title">{step.title}</h2>}
        </div>

        <div className="lesson-player-content">
          {step.visual && <CodingVisual name={step.visual} label={step.title} />}

          {/* Ảnh chụp màn hình thật cho các slide dạy thao tác (phpMyAdmin, hosting…). */}
          {step.image && (
            <figure className="coding-shot">
              <img src={step.image.src} alt={step.image.alt} loading="lazy" decoding="async" />
              {step.image.caption && <figcaption>{step.image.caption}</figcaption>}
            </figure>
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
              : <p className="lesson-player-lead">{submitting ? "Máy chủ đang chấm bài…" : "Chưa nộp được bài."}</p>
          )}
        </div>

        <LessonBuddy mood={STEP_MOOD[step.kind] || "learn"} seed={index} />
      </main>

      {!(step.kind === "result" && result && !result.passed) && (
        <footer className="lesson-player-foot">
          <button type="button" onClick={next} disabled={!ready}>
            {step.kind === "result"
              ? (result?.passed ? "Hoàn thành bài" : "Nộp lại")
              : steps[index + 1]?.kind === "result" ? "Nộp bài" : step.kind === "check" ? "Câu tiếp" : "Tiếp tục"}
            {step.kind === "check" ? <Check aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
          </button>
        </footer>
      )}

      {feedbackOpen && (
        <FeedbackSheet course={course} step={step} stepIndex={index} onClose={() => setFeedbackOpen(false)} />
      )}
    </div>
  );
}
