import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowRight, BookOpen, Check, ClipboardCopy, GraduationCap, MessageSquareWarning, PenLine, Target, TriangleAlert, Wrench, X } from "lucide-react";
import confetti from "canvas-confetti";
import { notify } from "../../../lib/notify";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import QuizQuestion from "./QuizQuestion";
import LessonBuddy from "./LessonBuddy";
import LessonExam from "./LessonExam";
import { buildOfficeSteps } from "../hugoSO/officeLessonSteps";
import { practiceEvidence, isPracticeDone } from "../hugoSO/officeLessonSteps";
// Biểu định kiểu đi kèm component: trình học giờ dùng chung cho cả khoá Năng
// suất, mà app đó không nạp CSS của khoá Web.
import "../../../styles/hugoCoderLearning.css";
import { isQuizAnswerCorrect, shuffleQuizOptions } from "../../../../shared/quizKinds";
import { CODER_STORAGE_KEYS } from "./workspaceUtils";

/**
 * Trình phát bài học — mỗi lần một bước, màn hình cố định.
 *
 * Trước đây cả bài đổ ra một trang dài; người học phải tự cuộn tìm chỗ mình
 * đang ở và không biết còn bao nhiêu nữa mới xong. Ở đây bài cắt thành các bước
 * nhỏ, mỗi bước chiếm trọn màn, chỉ một nút tiếp tục.
 *
 * ponytail: các bước cắt từ nội dung ĐÃ CÓ (`theory` theo tiêu đề, `labSteps`,
 * `commonMistakes`, `miniQuiz`) — giáo trình không phải sửa dòng nào.
 */
const API = import.meta.env.VITE_API_URL || "/api";

// Bước đang học, để tải lại trang không ném người học về đầu bài. Chỉ giữ MỘT
// bài: bỏ dở rồi mở bài khác thì con trỏ cũ vô nghĩa.
const STEP_KEY = "student_ide_lesson_step";

function readStep(lessonId) {
  try {
    const [id, at] = String(localStorage.getItem(STEP_KEY) || "").split(":");
    return id === lessonId ? Math.max(0, Number(at) || 0) : 0;
  } catch {
    return 0;
  }
}

/**
 * Cắt lý thuyết thành các bước đọc, và TÁCH tiêu đề khỏi thân.
 *
 * Giáo trình dùng `###` (105 chỗ) và `#`, KHÔNG dùng `##` — bản đầu của hàm
 * này chỉ khớp `##` nên không tách được tiêu đề nào, và mọi tiêu đề nằm lại
 * trong thân bài dưới dạng một dòng chữ hoa giữa đoạn văn.
 *
 * Một tiêu đề mỗi bài nghĩa là cả phần lý thuyết dồn vào MỘT bước — dày đặc.
 * Nên chunk nào còn dài thì cắt tiếp theo dòng trống, gom lại quanh
 * `SOFT_LIMIT` ký tự để mỗi màn đọc được mà không phải cuộn.
 */
const SOFT_LIMIT = 520;

function packParagraphs(body) {
  const paragraphs = body.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const packs = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (current && (current.length + paragraph.length) > SOFT_LIMIT) {
      packs.push(current);
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }
  if (current) packs.push(current);
  return packs.length ? packs : [body];
}

function splitTheory(theory) {
  const text = String(theory || "").trim();
  if (!text) return [];
  const chunks = text.split(/\n(?=#{1,3}\s)/).map((chunk) => chunk.trim()).filter(Boolean);

  return (chunks.length ? chunks : [text]).flatMap((chunk) => {
    const match = /^(#{1,3})\s+(.+?)\n([\s\S]*)$/.exec(chunk);
    const title = match ? match[2].trim() : "";
    const body = (match ? match[3] : chunk).trim();
    return packParagraphs(body).map((part, partIndex) => ({
      // Tiêu đề chỉ gắn cho mảnh đầu; các mảnh sau là phần tiếp của cùng mục.
      title: partIndex === 0 ? title : "",
      body: part,
    }));
  });
}

function buildSteps(course) {
  const steps = [];

  for (const chunk of splitTheory(course.theory)) {
    steps.push({ kind: "read", title: chunk.title, body: chunk.body });
  }

  (course.labSteps || []).forEach((step, index) => {
    steps.push({
      kind: "do",
      index,
      title: `Bước ${index + 1}`,
      body: typeof step === "string" ? step : String(step),
      code: course.starterCode || "",
    });
  });

  if (course.commonMistakes?.length) {
    // Mỗi lỗi là một object {symptom, cause, fix} — `String(...)` trước đây biến
    // cả trăm bài thành một danh sách "[object Object]". Giữ nguyên ba trường,
    // vì đúng ba trường đó mới dạy được: thấy gì, vì sao, sửa ra sao.
    steps.push({
      kind: "warn",
      title: "Tránh mấy lỗi này",
      items: course.commonMistakes.map((item) => (
        typeof item === "string" ? { symptom: item } : item
      )),
    });
  }

  (course.miniQuiz || []).forEach((question, index) => {
    // Xáo phương án mỗi lượt học: 93% đáp án trong giáo trình nằm ở vị trí B,
    // nên không xáo thì bấm B là qua mà chẳng cần đọc.
    steps.push({ kind: "quiz", index, title: "Kiểm tra hiểu bài", question: shuffleQuizOptions(question) });
  });

  // Bài kiểm tra cuối chặng: đề và điểm đều ở máy chủ. Tự chấm tại đây thì
  // `award-learning` từ chối (400) và mọi bài sau kẹt thứ tự (409).
  if (course.practiceType === "quiz") {
    steps.push({ kind: "exam", title: "Bài kiểm tra cuối chặng" });
  }

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
  read: { label: "Đọc hiểu", icon: BookOpen, tone: "#0a84ff" },
  code: { label: "Chép về máy", icon: ClipboardCopy, tone: "#5856d6" },
  do: { label: "Thực hành", icon: Wrench, tone: "#12a594" },
  warn: { label: "Lỗi hay gặp", icon: TriangleAlert, tone: "#f76b15" },
  quiz: { label: "Kiểm tra", icon: Target, tone: "#8e4ec6" },
  exam: { label: "Thi cuối chặng", icon: GraduationCap, tone: "#c2410c" },
  submit: { label: "Nộp bằng chứng", icon: PenLine, tone: "#0a7ea4" },
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

      <h2>Hoàn thành bài học</h2>
      <p>{course.title.replace(/^\d+\.\s*/, "")}</p>
      <span className="lesson-done-count">{stepCount} bước đã đi qua</span>

      <div className="lesson-done-actions">
        <button type="button" className="is-ghost" onClick={onExit}>Trở về bản đồ</button>
        {onNext && <button type="button" onClick={onNext}>Bài tiếp<ArrowRight aria-hidden="true" /></button>}
      </div>
    </div>
  );
}

/**
 * @param {object[]} [buildSteps] Bước dựng sẵn, dùng cho giáo trình có cấu trúc
 * khác (các học phần Năng suất). Bỏ trống thì tự cắt bước từ bài Web như cũ —
 * một trình học duy nhất cho mọi khoá, thay vì mỗi khoá một giao diện.
 */
export default function LessonPlayer({ course, steps: givenSteps, onExit, onFinished, onNextLesson, certificateUrl }) {
  const steps = useMemo(
    () => givenSteps || (course._officeLesson ? buildOfficeSteps(course._officeLesson) : buildSteps(course)),
    [course, givenSteps],
  );
  const [index, setIndex] = useState(() => Math.min(readStep(course.id), Math.max(0, steps.length - 1)));
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [done, setDone] = useState(false);
  // null = chưa chấm; false = vừa sai. Đúng thì đi tiếp ngay nên không cần giữ.
  const [lastWrong, setLastWrong] = useState(false);
  // Trả lời đúng thì dừng một nhịp để Hugo kịp khen rồi mới sang bước sau.
  const [cheering, setCheering] = useState(false);
  // Bài nộp của bước "nộp bằng chứng"; xoá khi sang bước khác.
  const [submission, setSubmission] = useState("");
  // Dùng lại bộ âm của Arcade thay vì thêm thư viện: nó tổng hợp bằng
  // Web Audio nên không tải tệp nào, và cả hai chỗ nghe giống nhau là đúng —
  // cùng một hệ thì cùng một tiếng.
  const { playWin, playLose, playBeep } = useArcadeSound();
  // Hẹn giờ đọc hàm mới nhất qua ref, nếu không nó đóng gói mất `index` cũ và
  // luôn nhảy về cùng một bước.
  const advanceRef = useRef(() => {});

  useEffect(() => {
    setIndex(readStep(course.id));
    setAnswers({});
    setChecked(false);
    setDone(false);
    setLastWrong(false);
    setCheering(false);
  }, [course.id]);

  // Ghi lại chỗ đang đứng: bước hiện tại, và bài này là bài mở gần nhất (bản đồ
  // đọc `lastLesson` để đặt con trỏ "đang học").
  useEffect(() => {
    try {
      localStorage.setItem(STEP_KEY, `${course.id}:${index}`);
      localStorage.setItem(CODER_STORAGE_KEYS.lastLesson, course.id);
    } catch {
      /* hết quota: chỉ mất chỗ đang đọc, bài học vẫn chạy bình thường */
    }
  }, [course.id, index]);

  useEffect(() => {
    if (!cheering) return undefined;
    const timer = setTimeout(() => {
      setCheering(false);
      advanceRef.current();
    }, 850);
    return () => clearTimeout(timer);
  }, [cheering]);

  const step = steps[index];
  const last = index === steps.length - 1;
  const percent = steps.length ? Math.round(((index + 1) / steps.length) * 100) : 0;

  if (!step) return null;

  // `silent` khi vừa phát tiếng thắng cho câu trả lời đúng — nếu không thì
  // một lần bấm kêu hai tiếng, và bước cuối bắn pháo hoa hai lần.
  const advance = (silent = false) => {
    if (!silent) playBeep();
    setChecked(false);
    setLastWrong(false);
    setSubmission("");
    if (!last) {
      setIndex((current) => current + 1);
      return;
    }
    playWin();
    confetti({ particleCount: 170, spread: 105, origin: { y: 0.62 }, disableForReducedMotion: true });
    // Ghi nhận hoàn thành ngay, nhưng KHÔNG rời màn — người học còn phải chọn
    // trở về hay học tiếp.
    onFinished?.();
    setDone(true);
  };

  const submit = () => {
    if (step.kind !== "quiz") {
      advance();
      return;
    }
    // Sai thì hiện đáp án đúng NGAY tại bước đó, không dồn xuống cuối bài —
    // học viên sửa hiểu lầm lúc còn nhớ câu hỏi.
    if (isQuizAnswerCorrect(step.question, answers[step.index])) {
      playWin();
      confetti({ particleCount: 70, spread: 62, origin: { y: 0.7 }, disableForReducedMotion: true });
      setCheering(true);
    } else {
      playLose();
      setLastWrong(true);
      setChecked(true);
      notify.error("Chưa đúng — đọc lại phần giải thích rồi thử lại.");
    }
  };

  advanceRef.current = () => advance(true);

  const answered = step.kind === "submit"
    ? isPracticeDone(step, submission)
    : step.kind !== "quiz" || answers[step.index] !== undefined;
  const kind = KIND[step.kind] || KIND.read;
  const KindIcon = kind.icon;
  // Hugo nói theo việc đang làm: sai thì động viên, còn lại thì nhắc đúng
  // kiểu bước — đọc thì nhắc đọc kỹ, thực hành thì nhắc mở máy gõ.
  const STEP_MOOD = { do: "practice", exam: "exam" };
  const buddyMood = cheering
    ? "correct"
    : lastWrong ? "wrong" : (STEP_MOOD[step.kind] || "learn");

  if (done) {
    return (
      <div className="lesson-player">
        <LessonDone
          course={course}
          stepCount={steps.length}
          onExit={onExit}
          onNext={onNextLesson}
        />
      </div>
    );
  }

  return (
    <div className="lesson-player">
      <header className="lesson-player-top">
        <button type="button" onClick={onExit} aria-label="Thoát bài học">
          <X aria-hidden="true" />
        </button>
        <span className="lesson-player-track" aria-label={`${percent}%`}>
          <i style={{ width: `${percent}%` }} />
        </span>
        <span className="lesson-player-count">{index + 1}/{steps.length}</span>
        {/* Góp ý ở góc mọi bước: người học nói đúng lúc họ vấp, không phải đợi
            hết bài rồi mới nhớ ra chỗ nào khó hiểu. */}
        <button
          type="button"
          className="lesson-player-flag"
          onClick={() => setFeedbackOpen(true)}
          aria-label="Góp ý cho bước này"
        >
          <MessageSquareWarning aria-hidden="true" />
        </button>
      </header>

      {/* Vùng nội dung KHÔNG cuộn: mỗi bước phải vừa một màn. */}
      <main
        key={index}
        className={`lesson-player-body is-${step.kind}${lastWrong ? " is-wrong" : ""}`}
        style={{ "--step-tone": kind.tone }}
      >
        <div className="lesson-player-head">
          <span className="lesson-player-badge" aria-hidden="true">
            <KindIcon />
          </span>
          <span className="lesson-player-kind">{kind.label}</span>
          {step.title && <h2 className="lesson-player-title">{step.title}</h2>}
        </div>

        <div className="lesson-player-content">
          {step.kind === "read" && (
            <div className="lesson-player-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.body}</ReactMarkdown>
            </div>
          )}

          {step.kind === "do" && (
            <>
              <p className="lesson-player-do">{step.body}</p>
              {step.checkpoint && (
                <p className="lesson-player-checkpoint">
                  <Check aria-hidden="true" />
                  {step.checkpoint}
                </p>
              )}
              {step.code && <CodeCard code={step.code} file={course.file} />}
            </>
          )}

          {step.kind === "warn" && (
            <ul className="lesson-player-warn">
              {step.items.map((item) => (
                <li key={item.symptom}>
                  <b>{item.symptom}</b>
                  {item.cause && <span className="warn-cause">{item.cause}</span>}
                  {item.fix && <span className="warn-fix">{item.fix}</span>}
                </li>
              ))}
            </ul>
          )}

          {step.kind === "quiz" && (
            <QuizQuestion
              question={step.question}
              index={step.index}
              value={answers[step.index]}
              onChange={(answer) => {
                setChecked(false);
                setAnswers((current) => ({ ...current, [step.index]: answer }));
              }}
              reviewed={checked}
            />
          )}

          {step.kind === "exam" && (
            <LessonExam course={course} onPassed={() => advance(true)} certificateUrl={certificateUrl} />
          )}

          {step.kind === "submit" && (
            <>
              <p className="lesson-player-do">{step.body}</p>
              <textarea
                className="lesson-player-submit"
                rows={5}
                value={submission}
                onChange={(event) => setSubmission(event.target.value)}
                placeholder={step.placeholder}
              />
              {/* Thanh bằng chứng: người học thấy còn thiếu ý nào, thay vì bị
                  chặn bởi một nút mờ không nói lý do. */}
              <ul className="lesson-player-evidence">
                {practiceEvidence(step, submission).map((item) => (
                  <li key={item.keyword} className={item.matched ? "is-matched" : ""}>
                    {item.matched && <Check aria-hidden="true" />}
                    {item.label}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <LessonBuddy
          mood={buddyMood}
          seed={index}
        />
      </main>

      {/* Bước thi tự có nút nộp và nút nhận đề mới — thêm "Tiếp tục" ở đây thì
          người học bấm qua được bài thi mà không nộp. */}
      {step.kind !== "exam" && (
        <footer className="lesson-player-foot">
          <button type="button" onClick={submit} disabled={!answered || cheering}>
            {step.kind === "quiz" ? "Kiểm tra" : last ? "Hoàn thành bài" : "Tiếp tục"}
            {step.kind === "quiz" ? <Check aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
          </button>
        </footer>
      )}

      {feedbackOpen && (
        <FeedbackSheet
          course={course}
          step={step}
          stepIndex={index}
          onClose={() => setFeedbackOpen(false)}
        />
      )}
    </div>
  );
}
