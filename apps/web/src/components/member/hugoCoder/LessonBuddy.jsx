import { useMemo } from "react";
import { isEduHost } from "../../../../../../packages/shared/eduSite";
import { useEduText } from "../../../education/eduText";

/**
 * Hugo — nhân vật đồng hành trong bài học. Mascot màu là ngoại lệ CÓ CHỦ ĐÍCH
 * của quy ước icon đơn sắc — quy ước đó áp cho biểu tượng chức năng, không áp
 * cho nhân vật.
 */
// Câu nói theo tâm trạng nằm trong education/eduCopy.js (buddy.*), đủ ba thứ tiếng.
const MOODS = ["learn", "practice", "exam", "correct", "wrong", "done"];

// Ảnh dựng sẵn bằng DiceBear: scripts/generate-coder-buddy.mjs.
// Education Hugo dùng bộ nhân vật clay màu tươi; Hugo Studio giữ Hugo avataaars.
// Cả hai dựng sẵn bằng scripts/generate-mascots.mjs.
const ART_DIR = typeof window !== "undefined" && isEduHost(window.location.hostname) ? "/edu" : "/coder";
const avatarFor = (mood) => `${ART_DIR}/buddy-${MOODS.includes(mood) ? mood : "learn"}.svg`;

export default function LessonBuddy({ mood = "learn", size = "sm", seed = 0 }) {
  const { t } = useEduText();
  const config = t(`buddy.${MOODS.includes(mood) ? mood : "learn"}`);
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
