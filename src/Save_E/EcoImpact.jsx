/**
 * Phần giải thích "bật lên thì tiết kiệm cái gì", kèm hình minh hoạ.
 *
 * Mọi hình đều là SVG vẽ thẳng trong mã: không tải một tệp ảnh nào — đúng tinh
 * thần của chính tính năng này (một trang có ảnh minh hoạ nặng vài trăm KB để
 * quảng cáo chuyện tiết kiệm thì tự mâu thuẫn).
 *
 * Số liệu chia làm hai nhóm và ghi rõ nhóm nào là nhóm nào:
 *  - Đo được từ chính mã nguồn này (số lượt gọi, số bài tải về).
 *  - Trích từ nghiên cứu/báo cáo đã công bố, có tên nguồn và năm ở cuối.
 */

import { useTranslation } from "react-i18next";
import EcoBadge from "./EcoBadge";

const REFERENCES = [
  {
    id: 1,
    text: "Dash & Hu — “How Much Battery Does Dark Mode Save?”, hội nghị ACM MobiSys 2021. "
      + "Đo trên điện thoại OLED: ở độ sáng 100%, nền tối tiết kiệm khoảng 39–47% điện màn hình; "
      + "ở mức sáng thường dùng 30–50% thì chỉ còn khoảng 3–9%.",
    site: "dl.acm.org",
  },
  {
    id: 2,
    text: "IEA — báo cáo “Electricity 2024”. Trung tâm dữ liệu, AI và tiền mã hoá tiêu thụ khoảng 460 TWh "
      + "điện năm 2022 và có thể tăng gấp đôi vào 2026. Báo cáo cũng dẫn ước tính một câu hỏi cho ChatGPT "
      + "tốn khoảng 2,9 Wh, so với 0,3 Wh của một lượt tìm kiếm web.",
    site: "iea.org",
  },
  {
    id: 3,
    text: "UNITAR & ITU — “Global E-waste Monitor 2024”. Thế giới thải 62 triệu tấn rác điện tử năm 2022, "
      + "chỉ 22,3% được thu gom và tái chế đúng cách. Kéo dài tuổi thọ thiết bị là cách giảm rác điện tử "
      + "trực tiếp nhất.",
    site: "ewastemonitor.info",
  },
  {
    id: 4,
    text: "Aslan và cộng sự — “Electricity Intensity of Internet Data Transmission”, Journal of Industrial "
      + "Ecology 2018. Ước tính khoảng 0,06 kWh cho mỗi GB truyền qua mạng cố định (năm 2015) và con số này "
      + "giảm khoảng một nửa sau mỗi hai năm.",
    site: "onlinelibrary.wiley.com",
  },
];

/* ── Logo: chiếc lá trong vòng tuần hoàn. Tự vẽ, không mượn biểu trưng của bất
   kỳ tổ chức nào — gắn logo của tổ chức thật vào đây là mạo danh họ. ── */
function EcoLogo({ size = 44 }) {
  const { t } = useTranslation();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={t("saveE.impact.bieuTrungCheDo")}>
      <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <path
        d="M24 34c-6 0-10-4-10-9 0-6 5-11 16-13 1 12-2 22-11 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M24 36c0-7 2-12 6-16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/* ── Hình 1: màn sáng -> màn đen ── */
function FigureScreens() {
  const { t } = useTranslation();
  const Phone = ({ x, dark, label }) => (
    <g transform={`translate(${x} 0)`}>
      <rect x="0" y="0" width="66" height="118" rx="12" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
      <rect x="5" y="10" width="56" height="98" rx="6" fill={dark ? "#000" : "#dbeafe"} />
      {[0, 1, 2, 3].map((row) => (
        <rect
          key={row}
          x="11"
          y={20 + row * 16}
          width={row === 3 ? 24 : 44}
          height="7"
          rx="3.5"
          fill={dark ? "#ffffff" : "#1e3a8a"}
          opacity={dark ? 0.92 : 0.75}
        />
      ))}
      <text x="33" y="132" textAnchor="middle" fontSize="9.5" fill="currentColor" opacity="0.8">{label}</text>
    </g>
  );

  return (
    <svg viewBox="0 0 210 140" width="100%" height="140" role="img"
      aria-label={t("saveE.impact.dienThoaiNenSang")}>
      <Phone x={4} dark={false} label={t("saveE.impact.nenSang")} />
      <path d="M84 60 h40 m-9 -6 l9 6 l-9 6" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <Phone x={138} dark label={t("saveE.impact.nenDen")} />
    </svg>
  );
}

/* ── Hình 2: sơ đồ cột so sánh lượng bài tải về trong một giờ ── */
function FigureRequests() {
  const { t } = useTranslation();
  return (
    <svg viewBox="0 0 210 128" width="100%" height="128" role="img"
      aria-label={t("saveE.impact.cotSoSanh720")}>
      <line x1="8" y1="96" x2="202" y2="96" stroke="currentColor" strokeWidth="1" opacity="0.35" />

      <rect x="26" y="16" width="46" height="80" rx="4" fill="currentColor" opacity="0.28" />
      <text x="49" y="12" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.85">{t("saveE.impact.720Bai")}</text>
      <text x="49" y="110" textAnchor="middle" fontSize="9.5" fill="currentColor" opacity="0.7">{t("saveE.impact.cheDoThuong")}</text>
      <text x="49" y="121" textAnchor="middle" fontSize="8.5" fill="currentColor" opacity="0.5">{t("saveE.impact.6Luot120Bai")}</text>

      <rect x="138" y="93" width="46" height="3" rx="1.5" fill="currentColor" />
      <text x="161" y="86" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.85">{t("saveE.impact.24Bai")}</text>
      <text x="161" y="110" textAnchor="middle" fontSize="9.5" fill="currentColor" opacity="0.7">{t("saveE.impact.cheDoTietKiem")}</text>
      <text x="161" y="121" textAnchor="middle" fontSize="8.5" fill="currentColor" opacity="0.5">{t("saveE.impact.1Luot24Bai")}</text>
    </svg>
  );
}

/* ── Hình 3: điểm ảnh OLED bật/tắt ── */
function FigurePixels() {
  const { t } = useTranslation();
  const cells = Array.from({ length: 24 }, (_, index) => index);
  return (
    <svg viewBox="0 0 210 96" width="100%" height="96" role="img"
      aria-label={t("saveE.impact.luoiDiemAnhNen")}>
      {cells.map((index) => (
        <rect key={`on-${index}`} x={8 + (index % 8) * 12} y={14 + Math.floor(index / 8) * 12}
          width="9" height="9" rx="2" fill="currentColor" opacity="0.85" />
      ))}
      <text x="56" y="76" textAnchor="middle" fontSize="9.5" fill="currentColor" opacity="0.7">{t("saveE.impact.2424DiemAnh")}</text>

      {cells.map((index) => (
        <rect key={`off-${index}`} x={120 + (index % 8) * 12} y={14 + Math.floor(index / 8) * 12}
          width="9" height="9" rx="2"
          fill="currentColor"
          opacity={[2, 9, 17].includes(index) ? 0.85 : 0.12} />
      ))}
      <text x="168" y="76" textAnchor="middle" fontSize="9.5" fill="currentColor" opacity="0.7">{t("saveE.impact.324DiemAnh")}</text>
    </svg>
  );
}

const FIGURES = [
  {
    key: "screens",
    Figure: FigureScreens,
    title: "Nền đen trên màn OLED",
    body:
      "Điểm ảnh OLED màu đen là điểm ảnh tắt hẳn, không tiêu điện — khác màn LCD vốn luôn phải bật đèn nền. "
      + "Mức tiết kiệm phụ thuộc độ sáng: nghiên cứu đo được khoảng 3–9% ở độ sáng thường dùng và lên tới "
      + "39–47% khi để sáng tối đa.",
    ref: 1,
  },
  {
    key: "requests",
    Figure: FigureRequests,
    title: "Giảm 30 lần lượng dữ liệu tải về mỗi giờ",
    body:
      "Con số này đo từ chính mã nguồn: chế độ thường tải 120 bài rồi tự làm mới mỗi 10 phút (720 bài/giờ); "
      + "chế độ tiết kiệm tải 24 bài đúng một lượt khi mở. Ít dữ liệu truyền đi là ít điện cho cả máy chủ lẫn "
      + "hạ tầng mạng — ước tính khoảng 0,06 kWh mỗi GB.",
    ref: 4,
  },
  {
    key: "pixels",
    Figure: FigurePixels,
    title: "Không AI, không hiệu ứng động",
    body:
      "Mỗi câu trả lời của mô hình ngôn ngữ tốn điện gấp khoảng 10 lần một lượt tìm kiếm web (2,9 Wh so với "
      + "0,3 Wh), và cả nhóm trung tâm dữ liệu + AI đã dùng khoảng 460 TWh năm 2022. Chế độ này bỏ hẳn AI, "
      + "đồng thời chặn animation để GPU không phải vẽ lại màn hình liên tục.",
    ref: 2,
  },
];

export default function EcoImpact() {
  const { t } = useTranslation();
  return (
    <div>
      <div style={{ padding: "14px 0 8px" }}>
        <EcoBadge />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <span style={{ color: "hsl(var(--primary))", display: "inline-flex" }}>
            <EcoLogo />
          </span>
          <div>
            <strong style={{ display: "block", fontSize: 15 }}>{t("saveE.impact.viSaoCheDo")}</strong>
            <span style={{ fontSize: 13, color: "hsl(var(--muted-foreground))" }}>
              {t("saveE.impact.soLieuDoTu")}
            </span>
          </div>
        </div>
      </div>

      {FIGURES.map(({ key, Figure, title, body, ref }) => (
        <figure key={key} style={{ margin: 0, padding: "14px 0", borderTop: "1px solid hsl(var(--border) / 0.6)" }}>
          <div style={{ color: "hsl(var(--foreground))", opacity: 0.9 }}>
            <Figure />
          </div>
          <figcaption>
            <strong style={{ display: "block", fontSize: 14.5, lineHeight: 1.4, marginTop: 6 }}>{title}</strong>
            <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "hsl(var(--muted-foreground))" }}>
              {body} <sup>[{ref}]</sup>
            </p>
          </figcaption>
        </figure>
      ))}

      <div style={{ padding: "14px 0 0", borderTop: "1px solid hsl(var(--border) / 0.6)" }}>
        <strong style={{ display: "block", fontSize: 13.5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {t("saveE.impact.nguonThamKhao")}
        </strong>
        <ol style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12.5, lineHeight: 1.65, color: "hsl(var(--muted-foreground))" }}>
          {REFERENCES.map((item) => (
            <li key={item.id} style={{ marginBottom: 6 }}>
              {item.text} <em style={{ opacity: 0.75 }}>({item.site})</em>
            </li>
          ))}
        </ol>
        <p style={{ margin: "10px 0 0", fontSize: 12.5, lineHeight: 1.6, color: "hsl(var(--muted-foreground))" }}>
          {t("saveE.impact.cacConSoTren")}
        </p>
      </div>
    </div>
  );
}
