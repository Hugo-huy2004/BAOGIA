import { useCallback, useEffect, useState } from "react";
import { Award, RefreshCw, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { notify } from "../../../lib/notify";
import { getMemberSession } from "../../../services/authSession";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import { EXAM_BLUEPRINT, EXAM_GROUPS, matchesSlot } from "../../../../shared/examBlueprint";

/**
 * Bài kiểm tra cuối chặng, chấm tại MÁY CHỦ.
 *
 * Năm bài `practiceType: "quiz"` (6, 25, 50, 57, 58) không được tự chấm ở máy
 * người học: `award-learning` đòi một "vé đậu" chỉ cấp sau khi
 * `coder-exam/submit` chấm xong. Trình học mới chưa có bước này nên năm bài đó
 * đi hết các bước rồi vẫn 400, và mọi bài sau đó 409 vì thứ tự chưa mở.
 *
 * Máy chủ ra đề và GIỮ đáp án; client chỉ gửi lựa chọn. Khách chưa đăng nhập
 * vẫn thi được bằng đề trong máy — làm để biết mình hiểu tới đâu, không có
 * thưởng và không ghi tiến độ.
 */
const API = import.meta.env.VITE_API_URL || "/api";
const PASS_PERCENT = 60;

function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Đề luyện tập khi không có máy chủ.
 *
 * Vẫn ra theo đúng bản thiết kế và vẫn xáo phương án — nếu không thì bản luyện
 * tập dễ hơn hẳn bản thi thật, và đáp án đúng luôn nằm ở vị trí đầu.
 */
function localExam(course) {
  const pool = course.quizPool || [];
  const size = Math.min(course.quizSize || pool.length, pool.length);

  const byBlueprint = EXAM_BLUEPRINT.flatMap((slot) => (
    shuffled(pool.filter((question) => matchesSlot(question, slot))).slice(0, slot.count)
  ));
  const picked = byBlueprint.length === size ? shuffled(byBlueprint) : shuffled(pool).slice(0, size);

  return picked.map((question) => {
    const order = shuffled(question.o.map((_, index) => index));
    return {
      ...question,
      o: order.map((index) => question.o[index]),
      a: order.indexOf(question.a),
    };
  });
}

/**
 * @param {boolean} [serverGraded] Máy chủ ra đề và chấm. Chỉ đúng với 5 bài thi
 * của khoá Web; bài kiểm tra của học phần Năng suất chấm tại chỗ, vì máy chủ
 * không biết id `calendar-04b` và sẽ trả 400.
 */
export default function LessonExam({ course, onPassed, certificateUrl, serverGraded = true }) {
  const { playWin, playLose } = useArcadeSound();
  const [state, setState] = useState({ status: "loading" });
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);

  const start = useCallback(async (confirmRetake = false) => {
    setAnswers({});
    setResult(null);
    setState({ status: "loading" });

    if (!serverGraded || !getMemberSession()?.email) {
      setState({ status: "local", questions: localExam(course) });
      return;
    }

    try {
      const res = await fetch(`${API}/joy/coder-exam/start`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: course.id, confirmRetake }),
      });
      const data = await res.json().catch(() => ({}));

      // Lượt thi trong gói đã dùng: hỏi trước khi trừ JOY, không trừ âm thầm.
      if (res.status === 402 && data.requiresFee) {
        const ok = await notify.confirm({
          title: "Thi lại bài kiểm tra",
          message: `Lượt thi trong gói đã dùng (đã nộp ${data.attemptsUsed} lần). Thi lại tốn ${data.requiresFee} JOY — đồng ý trừ và nhận đề mới?`,
          confirmText: `Trừ ${data.requiresFee} JOY & thi lại`,
          danger: true,
        });
        if (ok) return start(true);
        setState({ status: "error", message: "Chưa nhận đề mới." });
        return;
      }

      if (!res.ok) {
        setState({ status: "error", message: data.error || "Chưa lấy được đề thi." });
        return;
      }

      if (data.charged > 0) notify.info(`Đã trừ ${data.charged} JOY cho lượt thi lại.`);
      setState({ status: "server", examId: data.examId, questions: data.questions });
    } catch {
      // Mất mạng thì vẫn học được — nhưng nói rõ là bản luyện tập.
      notify.warning("Không nối được máy chủ chấm thi — đây là đề luyện tập, chưa tính tiến độ.");
      setState({ status: "local", questions: localExam(course) });
    }
    return undefined;
  }, [course, serverGraded]);

  useEffect(() => { start(); }, [start]);

  const questions = state.questions || [];
  const allAnswered = questions.length > 0
    && questions.every((_, index) => answers[index] !== undefined);

  const finish = (score, passed, review) => {
    setResult({ score, passed, review });
    if (passed) {
      playWin();
      confetti({ particleCount: 180, spread: 110, origin: { y: 0.6 }, disableForReducedMotion: true });
    } else {
      playLose();
    }
  };

  const submit = async () => {
    if (state.status === "local") {
      const correct = questions.filter((q, index) => answers[index] === q.a).length;
      const score = Math.round((correct / questions.length) * 100);
      finish(score, score >= PASS_PERCENT, questions.map((q, index) => ({
        questionIndex: index,
        correct: answers[index] === q.a,
        correctText: q.o?.[q.a] || "",
      })));
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API}/joy/coder-exam/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: state.examId,
          answers: questions.map((_, index) => answers[index] ?? -1),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify.error(data.error || "Không nộp được bài thi — hãy đổi đề và thử lại.");
        return;
      }
      finish(data.score, data.passed, data.review || []);
    } catch {
      notify.error("Mất kết nối máy chủ chấm thi, hãy thử lại.");
    } finally {
      setSending(false);
    }
  };

  if (state.status === "loading") {
    return <div className="lesson-exam is-loading" aria-live="polite"><span /><p>Máy chủ đang ra đề…</p></div>;
  }

  if (state.status === "error") {
    return (
      <div className="lesson-exam is-error">
        <p>{state.message}</p>
        <button type="button" onClick={() => start()}><RefreshCw aria-hidden="true" />Thử lại</button>
      </div>
    );
  }

  if (result) {
    return (
      <div className={`lesson-exam-result ${result.passed ? "is-pass" : "is-fail"}`}>
        <Award aria-hidden="true" />
        <strong>{result.score}%</strong>
        <p>
          {result.passed
            ? "Đạt — bài học đã được ghi nhận."
            : `Chưa đạt, cần tối thiểu ${PASS_PERCENT}%. Xem lại các câu sai rồi thi lại.`}
        </p>

        <ul className="lesson-exam-review">
          {(result.review || []).map((item) => (
            <li key={item.questionIndex} className={item.correct ? "is-right" : "is-wrong"}>
              <b>Câu {item.questionIndex + 1}</b>
              <span>{item.correct ? "Đúng" : `Đáp án đúng: ${item.correctText}`}</span>
            </li>
          ))}
        </ul>

        {result.passed
          ? (
            <div className="lesson-exam-pass-actions">
              <button type="button" onClick={onPassed}>Hoàn tất bài học</button>
              {certificateUrl && (
                <a
                  href={certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lesson-exam-cert-link"
                >
                  <Award aria-hidden="true" /> Xem chứng nhận
                </a>
              )}
            </div>
          )
          : <button type="button" onClick={() => start()}><RefreshCw aria-hidden="true" />Nhận đề mới</button>}
      </div>
    );
  }

  return (
    <div className="lesson-exam">
      <p className="lesson-exam-note">
        <ShieldCheck aria-hidden="true" />
        {/* Ba trường hợp khác nhau, đừng gộp: máy chủ chấm; học phần Năng suất
            chấm tại chỗ nhưng VẪN tính; và bản luyện tập khi mất kết nối hoặc
            chưa đăng nhập thì không tính. Nói \"chưa tính tiến độ\" cho trường
            hợp giữa là nói sai với người học. */}
        {state.status === "server"
          ? `Đề do máy chủ ra và chấm · ${questions.length} câu · đạt từ ${PASS_PERCENT}%`
          : serverGraded
            ? `Đề luyện tập trong máy · ${questions.length} câu · chưa tính tiến độ`
            : `Đề tổng hợp cuối học phần · ${questions.length} câu · đạt từ ${PASS_PERCENT}%`}
      </p>

      <ol className="lesson-exam-questions">
        {questions.map((question, index) => (
          <li key={question.q}>
            {question.group && <span className="lesson-exam-group">{EXAM_GROUPS[question.group]}</span>}
            <p>{question.q}</p>
            {/* Câu đọc–điền code: đoạn mã là đề bài, không phải minh hoạ. */}
            {question.code && <pre className="lesson-exam-code"><code>{question.code}</code></pre>}
            <div>
              {(question.o || []).map((option, optionIndex) => (
                <button
                  key={option}
                  type="button"
                  className={answers[index] === optionIndex ? "is-picked" : ""}
                  onClick={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))}
                >
                  {option}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="lesson-exam-submit"
        onClick={submit}
        disabled={!allAnswered || sending}
      >
        {sending ? "Đang nộp…" : allAnswered ? "Nộp bài" : `Còn ${questions.length - Object.keys(answers).length} câu chưa chọn`}
      </button>
    </div>
  );
}
