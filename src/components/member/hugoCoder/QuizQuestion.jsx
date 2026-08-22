import { quizKind, quizAnswerText } from "../../../../shared/quizKinds";

/**
 * Hiển thị một câu hỏi, đủ tám dạng.
 *
 * Dùng chung cho bảng bên cạnh (máy tính) và sổ tay (điện thoại): trước đây hai
 * nơi mỗi nơi tự dựng trắc nghiệm, nên thêm một dạng câu hỏi là phải sửa hai
 * chỗ và chúng chắc chắn sẽ lệch nhau.
 *
 * Thành phần có điều khiển: `value` là câu trả lời hiện tại, `onChange` nhận
 * câu trả lời mới. Hình dạng của `value` tuỳ dạng câu hỏi — xem quizKinds.js.
 *
 * ponytail: sắp xếp bằng nút lên/xuống và nối cặp bằng thẻ select của trình
 * duyệt, không kéo thả. Kéo thả cần thư viện, hỏng trên trình đọc màn hình, và
 * khó dùng bằng bàn phím — trong khi thứ đang kiểm tra là kiến thức, không phải
 * độ khéo tay.
 */
const OPTION_BASE =
  "w-full text-left p-2.5 rounded-lg border text-xs transition-all active:scale-[0.98]";
const OPTION_IDLE = "bg-background border-border text-foreground hover:bg-muted";
const OPTION_ON = "bg-primary border-primary text-white shadow-sm font-bold";
const FIELD =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary";

function Code({ children }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-muted/60 p-3 text-[11px] leading-relaxed text-foreground">
      <code>{children}</code>
    </pre>
  );
}

export default function QuizQuestion({ question, index, value, onChange, reviewed }) {
  const kind = quizKind(question);
  const correct = reviewed && quizAnswerText(question);

  const body = () => {
    switch (kind) {
      case "multi": {
        const picked = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2 pl-2">
            <p className="text-[11px] text-muted-foreground">Chọn tất cả đáp án đúng.</p>
            {question.o.map((option, optionIndex) => {
              const on = picked.includes(optionIndex);
              return (
                <button
                  key={optionIndex}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange(
                    on ? picked.filter((i) => i !== optionIndex) : [...picked, optionIndex],
                  )}
                  className={`${OPTION_BASE} ${on ? OPTION_ON : OPTION_IDLE}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        );
      }

      case "truefalse":
        return (
          <div className="flex gap-2 pl-2">
            {[true, false].map((option) => (
              <button
                key={String(option)}
                type="button"
                aria-pressed={value === option}
                onClick={() => onChange(option)}
                className={`${OPTION_BASE} flex-1 text-center ${value === option ? OPTION_ON : OPTION_IDLE}`}
              >
                {option ? "Đúng" : "Sai"}
              </button>
            ))}
          </div>
        );

      case "blank":
        return (
          <div className="space-y-2 pl-2">
            <Code>{question.code}</Code>
            <input
              type="text"
              value={value ?? ""}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Điền vào chỗ ___"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className={`${FIELD} font-mono`}
            />
          </div>
        );

      case "order": {
        // `value` là thứ tự hiện tại của các chỉ số. Chưa đụng tới thì giữ
        // nguyên thứ tự đề bài — đề bài đã được xáo sẵn khi soạn.
        const order = Array.isArray(value) ? value : question.items.map((_, i) => i);
        const move = (position, delta) => {
          const next = [...order];
          const target = position + delta;
          if (target < 0 || target >= next.length) return;
          [next[position], next[target]] = [next[target], next[position]];
          onChange(next);
        };
        return (
          <div className="space-y-2 pl-2">
            <p className="text-[11px] text-muted-foreground">Sắp xếp các bước cho đúng thứ tự.</p>
            {order.map((itemIndex, position) => (
              <div
                key={itemIndex}
                className="flex items-center gap-2 rounded-lg border border-border bg-background p-2"
              >
                <span className="w-5 shrink-0 text-center text-[11px] font-bold text-primary">
                  {position + 1}
                </span>
                <span className="min-w-0 flex-1 text-xs text-foreground">{question.items[itemIndex]}</span>
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => move(position, -1)}
                    disabled={position === 0}
                    aria-label={`Đưa bước ${position + 1} lên trên`}
                    className="grid h-7 w-7 place-items-center rounded-md bg-muted text-foreground disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_upward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => move(position, 1)}
                    disabled={position === order.length - 1}
                    aria-label={`Đưa bước ${position + 1} xuống dưới`}
                    className="grid h-7 w-7 place-items-center rounded-md bg-muted text-foreground disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_downward</span>
                  </button>
                </span>
              </div>
            ))}
          </div>
        );
      }

      case "match": {
        // Vế phải hiển thị theo thứ tự đã xáo để đáp án không nằm ngay hàng
        // ngang với vế trái của nó.
        const rights = question.pairs.map(([, right], i) => ({ right, i }));
        const shuffled = [...rights].sort((a, b) => (a.right > b.right ? 1 : -1));
        return (
          <div className="space-y-2 pl-2">
            <p className="text-[11px] text-muted-foreground">Nối mỗi mục bên trái với mục đúng bên phải.</p>
            {question.pairs.map(([left], leftIndex) => (
              <div key={left} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 text-xs font-medium text-foreground">{left}</span>
                <span className="material-symbols-outlined shrink-0 text-[16px] text-muted-foreground" aria-hidden="true">
                  arrow_forward
                </span>
                <select
                  value={value?.[leftIndex] ?? ""}
                  onChange={(event) => onChange({ ...(value || {}), [leftIndex]: Number(event.target.value) })}
                  aria-label={`Nối cho ${left}`}
                  className={`${FIELD} flex-1`}
                >
                  <option value="" disabled>Chọn…</option>
                  {shuffled.map(({ right, i }) => (
                    <option key={i} value={i}>{right}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        );
      }

      case "bug":
        return (
          <div className="space-y-2 pl-2">
            <p className="text-[11px] text-muted-foreground">Chạm vào dòng có lỗi.</p>
            <div className="overflow-hidden rounded-lg border border-border">
              {question.lines.map((line, lineIndex) => (
                <button
                  key={lineIndex}
                  type="button"
                  aria-pressed={value === lineIndex}
                  onClick={() => onChange(lineIndex)}
                  className={`flex w-full items-start gap-2 border-b border-border/60 p-2 text-left font-mono text-[11px] last:border-0 transition-colors ${
                    value === lineIndex ? "bg-primary text-white" : "bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  <span className={value === lineIndex ? "text-white/70" : "text-muted-foreground"}>
                    {lineIndex + 1}
                  </span>
                  <span className="whitespace-pre-wrap break-all">{line}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "output":
        return (
          <div className="space-y-2 pl-2">
            <Code>{question.code}</Code>
            <p className="text-[11px] text-muted-foreground">Đoạn mã trên in ra gì?</p>
            {question.o.map((option, optionIndex) => (
              <button
                key={optionIndex}
                type="button"
                aria-pressed={value === optionIndex}
                onClick={() => onChange(optionIndex)}
                className={`${OPTION_BASE} font-mono ${value === optionIndex ? OPTION_ON : OPTION_IDLE}`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      default:
        return (
          <div className="space-y-2 pl-2">
            {question.o.map((option, optionIndex) => (
              <button
                key={optionIndex}
                type="button"
                aria-pressed={value === optionIndex}
                onClick={() => onChange(optionIndex)}
                className={`${OPTION_BASE} ${value === optionIndex ? OPTION_ON : OPTION_IDLE}`}
              >
                {option}
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-black leading-relaxed text-foreground">
        <span className="mr-1 text-primary">{index + 1}.</span>
        {question.q}
      </p>
      {body()}
      {reviewed && (
        <p className="text-[11px] font-bold text-success">
          Đáp án đúng: {correct}
          {question.why ? ` — ${question.why}` : ""}
        </p>
      )}
    </div>
  );
}
