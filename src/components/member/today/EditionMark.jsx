import ChinaEditionMark from "../ChinaEditionMark";
import { EDITION_OUTLINES } from "./editionOutlines";
import { EDITION_FLAGS, EDITION_IDENTITY } from "./editionFlags";
import { ENGLISH_COUNTRIES, ENGLISH_WORLD } from "./englishCountries";

/**
 * Dấu ấn bản của tab TODAY: hình đất nước người đọc, tô bằng quốc kỳ của họ.
 *
 * Bản đồ sinh từ Natural Earth (phạm vi công cộng) — xem
 * scripts/generate-edition-outlines.mjs. Trung Quốc giữ component riêng vì
 * đường viền của họ được vẽ tay có chủ đích (xem ChinaEditionMark).
 */
export default function EditionMark({ language }) {
  if (language === "zh") return <ChinaEditionMark />;
  if (language === "en") return <EnglishEditionMark />;

  const outline = EDITION_OUTLINES[language];
  const flag = EDITION_FLAGS[language];
  const identity = EDITION_IDENTITY[language];
  if (!outline || !flag || !identity) return null;

  const [, , width, height] = outline.viewBox.split(" ").map(Number);
  const clipId = `edition-clip-${language}`;
  const sheenId = `edition-sheen-${language}`;

  return (
    <figure className="today-edition-mark" style={{ "--edition-accent": identity.accent }}>
      <svg viewBox={outline.viewBox} role="img" aria-label={identity.name}>
        <defs>
          <clipPath id={clipId}>
            <path d={outline.d} />
          </clipPath>
          {/* Ánh sáng nhẹ để mảng cờ không đọc ra như hình in phẳng. Phải tan
              về 0, nếu không sẽ thấy một vệt cung vắt ngang bản đồ. */}
          <radialGradient id={sheenId} cx="0.3" cy="0.22" r="0.72">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          {flag(width, height)}
          <rect x="0" y="0" width={width} height={height} fill={`url(#${sheenId})`} />
        </g>
        {/* Viền theo màu nhấn của cờ: tách hình khỏi nền mà không cần khung. */}
        <path
          d={outline.d}
          fill="none"
          stroke={identity.accent}
          strokeWidth={Math.max(width, height) * 0.004}
          strokeLinejoin="round"
          opacity="0.45"
        />
      </svg>
      <figcaption lang={identity.lang}>{identity.name}</figcaption>
    </figure>
  );
}

/**
 * Ấn bản tiếng Anh KHÔNG có cờ và không lấy một nước nào ra đại diện.
 *
 * Tiếng Anh là ngôn ngữ chính thức ở 59 quốc gia; Mỹ chỉ tình cờ là nơi ấn bản
 * này lấy nguồn tin, nên treo cờ Mỹ lên là nói sai về ngôn ngữ đó. Thay vào đó:
 * bản đồ thế giới chỉ tô những nước nói tiếng Anh, tô bằng đúng màu nhấn của
 * giao diện chứ không phải màu cờ nào, kèm băng chuyền tên đủ 59 nước.
 */
function EnglishEditionMark() {
  return (
    <figure className="today-edition-mark today-edition-mark--world">
      <svg viewBox={ENGLISH_WORLD.viewBox} role="img" aria-label="English-speaking countries">
        <path d={ENGLISH_WORLD.d} fill="currentColor" />
      </svg>
      {/* Ghi rõ UK — nơi tiếng Anh sinh ra — rồi đến số nước cùng dùng chung.
          Số đếm lấy từ chính danh sách nên không bao giờ lệch với băng chữ. */}
      <figcaption lang="en">
        United Kingdom &amp; {ENGLISH_COUNTRIES.length - 1} countries sharing English
      </figcaption>
      <EnglishCountriesRibbon />
    </figure>
  );
}

/**
 * Danh sách nhân đôi để vòng lặp không có mối nối; bản thứ hai ẩn khỏi trình
 * đọc màn hình. Ai tắt hiệu ứng chuyển động thì băng đứng yên và cuộn tay được.
 */
function EnglishCountriesRibbon() {
  return (
    <div className="today-edition-ribbon">
      <p className="sr-only">
        {`English is an official language in ${ENGLISH_COUNTRIES.length} countries: ${ENGLISH_COUNTRIES.join(", ")}.`}
      </p>
      <div className="today-edition-ribbon__track" aria-hidden="true">
        {[0, 1].map((copy) => (
          <span className="today-edition-ribbon__run" key={copy}>
            {ENGLISH_COUNTRIES.map((country) => (
              <span className="today-edition-ribbon__item" key={country}>{country}</span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
