import { useMemo } from "react";

/**
 * Hugo — nhân vật đồng hành trong bài học. Mascot màu là ngoại lệ CÓ CHỦ ĐÍCH
 * của quy ước icon đơn sắc — quy ước đó áp cho biểu tượng chức năng, không áp
 * cho nhân vật.
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

// Ảnh dựng sẵn bằng DiceBear: scripts/generate-coder-buddy.mjs.
const avatarFor = (mood) => `/coder/buddy-${MOODS[mood] ? mood : "learn"}.svg`;

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
      <img className="lesson-buddy-art" src={avatarFor(mood)} alt={config.alt} draggable="false" />

      <p className="lesson-buddy-bubble">{line}</p>
    </div>
  );
}
