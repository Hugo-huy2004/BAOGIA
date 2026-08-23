import { useMemo } from "react";

/**
 * Hugo — nhân vật đồng hành trong bài học, vẽ 100% bằng SVG.
 *
 * Bản đầu tôi vẽ hỏng: bàn tay là một hình trôi lơ lửng cạnh đầu mà không có
 * cánh tay nối vào, tóc vẽ hai lớp đè lên mặt, thân áo bắt đầu ở y=82 trong
 * khung cao 104 nên bị cắt cụt. Bản này dựng theo thứ tự giải phẫu và mọi toạ
 * độ đều nằm trong khung:
 *
 *   khung 120×120 · đầu tâm (60,52) bán kính 28 · cổ 74→92 · vai từ y=92
 *
 * Thứ tự vẽ: nền → cổ → thân → đầu → tóc → kính → má → miệng → tay.
 * Cổ vẽ trước thân và đầu nên hai bên tự che hai đầu cổ, không lộ mối nối.
 *
 * Giữ ba nét nhận dạng của mascot đã có: tóc đen dày, kính râm tối màu, miệng
 * cười rộng. Mascot màu là ngoại lệ CÓ CHỦ ĐÍCH của quy ước icon đơn sắc — quy
 * ước đó áp cho biểu tượng chức năng, không áp cho nhân vật.
 */
const MOODS = {
  learn: {
    alt: "Hugo đang học cùng bạn",
    lines: [
      "Từ từ thôi, đọc kỹ hơn nhanh.",
      "Chỗ này quan trọng đấy.",
      "Hiểu rồi thì bước sau nhẹ lắm.",
      "Đọc xong thử tự giải thích lại xem.",
    ],
  },
  practice: {
    alt: "Hugo đang gõ code",
    lines: [
      "Mở máy gõ thật nhé, đừng chỉ đọc.",
      "Sai vài lần là chuyện thường.",
      "Gõ tay vào mới nhớ được.",
      "Làm xong rồi hẵng bấm tiếp.",
    ],
  },
  exam: {
    alt: "Hugo chờ bạn nộp bài thi",
    lines: [
      "Đọc kỹ từng câu, không vội.",
      "Câu nào chắc thì chọn trước.",
      "Sai cũng không sao, thi lại được.",
      "Chọn hết rồi hẵng nộp nhé.",
    ],
  },
  correct: {
    alt: "Hugo giơ ngón tay cái",
    lines: ["Chuẩn luôn!", "Ngon rồi đó.", "Đúng bài!", "Giỏi ghê."],
  },
  wrong: {
    alt: "Hugo động viên bạn thử lại",
    lines: [
      "Chưa đúng, nhưng gần rồi.",
      "Đọc lại phần giải thích chút nha.",
      "Sai chỗ này ai cũng từng sai.",
      "Bình tĩnh, thử lại lần nữa.",
    ],
  },
  done: {
    alt: "Hugo vẫy tay chúc mừng",
    lines: ["Xong một bài rồi!", "Hết bài, giỏi lắm!", "Ghi điểm rồi nha!"],
  },
};

/** Miệng mang biểu cảm — mắt bị kính râm che nên không dùng được. */
function Mouth({ mood }) {
  if (mood === "correct" || mood === "done") {
    return <path className="buddy-mouth-open" d="M49 62 Q60 77 71 62 Q60 68 49 62 Z" />;
  }
  if (mood === "wrong") {
    return <path className="buddy-mouth-line" d="M52 68 Q60 63 68 68" />;
  }
  return <path className="buddy-mouth-line" d="M51 63 Q60 71 69 63" />;
}

/** Cánh tay nối từ vai lên — có vai, có tay, không phải hình trôi lơ lửng. */
function Arm({ mood }) {
  if (mood !== "correct" && mood !== "done") return null;
  const raised = mood === "done";
  return (
    <g className="buddy-arm">
      <path
        className="buddy-sleeve"
        d={raised ? "M92 104 Q104 96 100 76" : "M92 104 Q102 98 99 84"}
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
      />
      <circle className="buddy-hand" cx={raised ? 100 : 99} cy={raised ? 72 : 80} r="8.5" />
      {!raised && <path className="buddy-thumb" d="M99 72 v-7" strokeWidth="5" strokeLinecap="round" />}
    </g>
  );
}

export default function LessonBuddy({ mood = "learn", size = "sm", seed = 0 }) {
  const config = MOODS[mood] || MOODS.learn;
  // Câu nói đổi theo bước để không lặp đúng một câu suốt bài, nhưng ổn định
  // trong một bước — random mỗi lần render thì chữ nhảy khi bấm chọn.
  const line = useMemo(
    () => config.lines[Math.abs(seed) % config.lines.length],
    [config, seed],
  );

  return (
    <div className={`lesson-buddy is-${size} is-${mood}`}>
      <svg className="lesson-buddy-art" viewBox="0 0 120 120" role="img" aria-label={config.alt}>
        <defs>
          {/* Thân cắt theo vòng nền để vai không tràn ra ngoài khung tròn. */}
          <clipPath id="buddy-disc-clip"><circle cx="60" cy="60" r="58" /></clipPath>
        </defs>

        <circle className="buddy-disc" cx="60" cy="60" r="58" />

        <g clipPath="url(#buddy-disc-clip)">
          <rect className="buddy-skin" x="52" y="72" width="16" height="22" rx="7" />
          <path className="buddy-shirt" d="M18 120 Q18 92 60 92 Q102 92 102 120 Z" />
          <path className="buddy-collar" d="M50 93 L60 102 L70 93" fill="none" strokeWidth="3" />

          <circle className="buddy-skin" cx="60" cy="52" r="28" />

          {/* Tóc: một vành mũ ôm nửa trên của đầu, cộng một món tóc phía trước. */}
          <path className="buddy-hair" d="M31 55 A29 29 0 0 1 89 55 Q83 38 60 38 Q37 38 31 55 Z" />
          <path className="buddy-hair" d="M60 38 Q46 39 39 50 Q46 42 60 42 Q74 42 81 50 Q74 39 60 38 Z" />

          <g className="buddy-glasses">
            <rect x="37" y="44" width="20" height="14" rx="6.5" />
            <rect x="63" y="44" width="20" height="14" rx="6.5" />
            <path d="M57 50 h6" strokeWidth="3" />
          </g>

          <circle className="buddy-blush" cx="40" cy="64" r="4.5" />
          <circle className="buddy-blush" cx="80" cy="64" r="4.5" />

          <g className="buddy-mouth"><Mouth mood={mood} /></g>

          <Arm mood={mood} />
        </g>

        {(mood === "correct" || mood === "done") && (
          <g className="buddy-spark">
            <path d="M20 34 v10 M15 39 h10" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M101 30 v8 M97 34 h8" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
      </svg>

      <p className="lesson-buddy-bubble">{line}</p>
    </div>
  );
}
