import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardCopy, ListChecks, TriangleAlert } from "lucide-react";
import { notify } from "../../../lib/notify";

/**
 * Phần thực hành khi KHÔNG có trình soạn thảo trong bài.
 *
 * Học viên gõ code trong công cụ thật của mình (VS Code, terminal, trình duyệt)
 * — đúng như khi đi làm — rồi quay lại đây đánh dấu từng bước đã làm. Bài chỉ
 * mở phần câu hỏi chốt khi mọi bước đã được đánh dấu.
 *
 * Điều này KHÔNG kém trung thực hơn bản cũ. Bản cũ trên điện thoại chỉ hỏi
 * "Tôi đã hoàn thành yêu cầu thực hành / Bỏ qua bài này" — một nút tự khai duy
 * nhất cho cả 88 bài. Ở đây ít nhất người học phải đọc và xác nhận từng bước,
 * và phần chấm thật nằm ở bộ câu hỏi chốt bài phía sau.
 *
 * ponytail: tiến độ đánh dấu giữ trong máy theo từng bài, không đẩy lên server.
 * Đây là giấy nháp của người học, không phải bằng chứng hoàn thành — bằng chứng
 * là `completedLessons` do máy chủ ghi sau khi chấm câu hỏi.
 */
const storageKey = (lessonId) => `coder_practice_steps_${lessonId}`;

const readTicked = (lessonId) => {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(lessonId)) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export default function PracticeSteps({ course, onAllStepsDone }) {
  const steps = useMemo(
    () => (course.labSteps || []).map((step) => (typeof step === "string" ? step : String(step))),
    [course.labSteps],
  );
  const [ticked, setTicked] = useState(() => readTicked(course.id));

  useEffect(() => { setTicked(readTicked(course.id)); }, [course.id]);

  const toggle = (index) => {
    const next = ticked.includes(index)
      ? ticked.filter((item) => item !== index)
      : [...ticked, index];
    setTicked(next);
    try {
      localStorage.setItem(storageKey(course.id), JSON.stringify(next));
    } catch {
      /* hết quota hoặc chế độ riêng tư: mất dấu tích không đáng làm vỡ bài học */
    }
  };

  const allDone = steps.length > 0 && ticked.length === steps.length;

  const copyStarter = async () => {
    try {
      await navigator.clipboard.writeText(course.starterCode || "");
      notify.success("Đã chép mã khởi đầu. Dán vào trình soạn thảo của bạn.");
    } catch {
      notify.error("Chưa chép được. Hãy bôi đen và chép thủ công.");
    }
  };

  return (
    <div className="space-y-5 font-sans">
      <div className="rounded-xl border border-border bg-muted/40 p-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Làm bài trong trình soạn thảo của chính bạn — đó là công cụ bạn sẽ dùng khi đi làm.
          Đánh dấu từng bước đã xong để mở phần câu hỏi chốt bài.
        </p>
      </div>

      {course.starterCode && (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Mã khởi đầu
            </h4>
            <button
              type="button"
              onClick={copyStarter}
              className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-[10px] font-bold text-foreground transition-colors hover:bg-muted/70"
            >
              <ClipboardCopy className="h-3 w-3" aria-hidden="true" /> Chép
            </button>
          </div>
          <pre className="max-h-56 overflow-auto rounded-xl bg-muted/60 p-3 text-[11px] leading-relaxed text-foreground">
            <code>{course.starterCode}</code>
          </pre>
        </section>
      )}

      <section className="space-y-2">
        <h4 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
          Các bước thực hành ({ticked.length}/{steps.length})
        </h4>
        <ul className="space-y-2">
          {steps.map((step, index) => {
            const on = ticked.includes(index);
            return (
              <li key={step}>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  aria-pressed={on}
                  className={`flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                    on ? "border-success/40 bg-success/10" : "border-border bg-background hover:bg-muted/50"
                  }`}
                >
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${
                      on ? "border-success bg-success text-white" : "border-border"
                    }`}
                  >
                    {on && <Check className="h-3 w-3" aria-hidden="true" />}
                  </span>
                  <span className="text-[12px] leading-relaxed text-foreground">{step}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {course.commonMistakes?.length > 0 && (
        <section className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
          <h4 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Lỗi hay gặp
          </h4>
          <ul className="mt-2 space-y-1.5">
            {course.commonMistakes.map((mistake) => (
              <li key={mistake.symptom || mistake} className="text-[11px] leading-relaxed text-muted-foreground">
                {typeof mistake === "string" ? mistake : (
                  <>
                    <b className="text-foreground">{mistake.symptom}</b>
                    {mistake.fix && <> — {mistake.fix}</>}
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <button
        type="button"
        onClick={onAllStepsDone}
        disabled={!allDone}
        className="w-full rounded-xl bg-primary py-3 text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
      >
        {allDone ? "Sang câu hỏi chốt bài" : `Còn ${steps.length - ticked.length} bước chưa đánh dấu`}
      </button>
    </div>
  );
}
