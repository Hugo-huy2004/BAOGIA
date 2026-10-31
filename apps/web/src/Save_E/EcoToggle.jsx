import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { notify } from "../lib/notify";
import { canUseEco, getEcoMode, setEcoMode, isEcoOn } from "./ecoMode";
import { autoReason } from "./ecoSignals";
import EcoImpact from "./EcoImpact";

// Chỉ liệt kê những khoản CHÍNH MÃ NGUỒN NÀY quyết định, kèm con số đối chiếu
// giữa hai chế độ. Không nêu số liệu chung chung về "tiết kiệm bao nhiêu phần
// trăm pin" vì điều đó phụ thuộc máy và độ sáng của từng người.
const SAVINGS = [
  {
    icon: "cloud_off",
    title: "Lượt gọi máy chủ giảm khoảng 30 lần mỗi giờ",
    detail:
      "Chế độ thường tải 120 bài rồi tự làm mới mỗi 10 phút — mở app một giờ là 6 lượt × 120 bài. "
      + "Chế độ này tải 24 bài đúng một lượt lúc mở, không hẹn giờ làm mới, không tải lại khi bạn quay lại tab.",
  },
  {
    icon: "smartphone",
    title: "Nền đen tuyền cho màn OLED",
    detail:
      "Điểm ảnh OLED màu đen là điểm ảnh TẮT — không tiêu điện. Vì vậy chế độ này dùng #000 thay vì xám đậm "
      + "(xám vẫn phải sáng), và chỉ để màu sáng ở chữ với viền mảnh, không tô mảng lớn.",
  },
  {
    icon: "memory",
    title: "Không một lượt gọi AI nào",
    detail:
      "Trợ lý AI, tóm tắt bằng AI, gợi ý cá nhân hoá đều tắt. Mỗi câu trả lời của mô hình ngôn ngữ là điện và "
      + "nước làm mát ở trung tâm dữ liệu; phần tóm tắt tin lấy sapo do chính toà soạn viết nên tốn 0 token.",
  },
  {
    icon: "animation",
    title: "Không hiệu ứng động, không đổ bóng, không làm mờ nền",
    detail:
      "Mọi animation và transition bị chặn cứng. Mỗi khung hình động là một lần GPU vẽ lại toàn màn — thứ ngốn "
      + "pin âm thầm nhất trên điện thoại.",
  },
  {
    icon: "apps",
    title: "Gộp các trang tài khoản về 1, mở ra mới gọi",
    detail:
      "Thẻ thành viên, chuyển JOY, mã QR, điểm danh, lịch sử, radio, trò chơi và cài đặt nằm chung một trang. "
      + "Mã QR, điểm danh và lịch sử để gập lại — không mở thì không tốn lượt gọi nào, mở ra thì đúng một lượt.",
  },
  {
    icon: "recycling",
    title: "Mở lại app trong 6 tiếng: 0 lượt gọi bản tin",
    detail:
      "Bản tin tải về được giữ trong máy, mở lại là dùng lại — kể cả sau khi đóng hẳn app. Bài bạn bấm “Giữ lại” "
      + "đọc được cả khi mất mạng, và chỉ giữ phần chữ (bỏ ảnh) nên nhẹ hơn hàng chục lần.",
  },
  {
    icon: "battery_saver",
    title: "Mức tự động: máy tự quyết",
    detail:
      "Đặt “Tự động” thì chế độ chỉ bật khi thực sự cần — pin dưới 30% mà chưa cắm sạc, mạng 2G, hoặc bạn đã bật "
      + "Tiết kiệm dữ liệu trong hệ điều hành. Cắm sạc vào là tự trả lại portal đầy đủ.",
  },
  {
    icon: "wifi_off",
    title: "Radio gọn nhất có thể, trò chơi không chạm máy chủ",
    detail:
      "Radio chỉ gọi máy chủ trong lúc đang phát (để trừ giờ nghe như thường lệ), không tải danh mục hay ảnh bìa. "
      + "Hai trò chơi chạy hoàn toàn trong máy: không gửi điểm, không vòng lặp vẽ 60 hình/giây như khu trò chơi thường.",
  },
];

const KEPT = "Giữ nguyên: bản tin đầy đủ, đọc toàn văn bài báo, Hugo Radio, chuyển JOY, thẻ thành viên.";

/**
 * Ô bật/tắt chế độ Bảo vệ môi trường, đặt cuối trang Cài đặt.
 *
 * Chỉ bật được khi chạy dạng ứng dụng đã cài: trong tab trình duyệt, thanh địa
 * chỉ và khung trình duyệt vẫn sáng nên phần tiết kiệm pin gần như mất hết.
 */
const MODE_LABELS = { off: "Tắt", on: "Luôn bật", auto: "Tự động" };

export default function EcoToggle() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(getEcoMode);
  const [open, setOpen] = useState(false);
  const usable = canUseEco();

  // Ba mức xoay vòng trên đúng một nút: tắt → tự động → luôn bật → tắt.
  const cycle = () => {
    const next = mode === "off" ? "auto" : mode === "auto" ? "on" : "off";
    setEcoMode(next);
    setMode(next);
    if (isEcoOn()) navigate("/member/eco");
    else if (next === "auto") notify.success(`Đã đặt tự động — ${autoReason().toLowerCase()}.`);
    else notify.success("Đã tắt chế độ Bảo vệ môi trường.");
  };

  // Web/desktop: không hiện gì cả. Bày một ô bấm không được chỉ tổ gây khó chịu.
  if (!usable) return null;

  return (
    <section className="portal-card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ color: "hsl(var(--primary))", display: "inline-flex", flexShrink: 0 }}>
          <svg width="30" height="30" viewBox="0 0 48 48" role="img" aria-label="Biểu trưng bảo vệ môi trường">
            <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
            <path d="M24 34c-6 0-10-4-10-9 0-6 5-11 16-13 1 12-2 22-11 24" fill="none" stroke="currentColor"
              strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: "block", fontSize: 16 }}>Chế độ Bảo vệ môi trường</strong>
          <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.55, color: "hsl(var(--muted-foreground))" }}>
            Portal rút gọn còn bốn mục: Bản tin, Đọc lại (offline), Ví và Xanh. Nền đen tuyền, chữ
            to cố định, tắt toàn bộ tính năng AI và gọi máy chủ ở mức tối thiểu.
          </p>
          {mode === "auto" ? (
            <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "hsl(var(--primary))" }}>
              Tự động — {autoReason().toLowerCase()}.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="portal-card"
          aria-label={`Chế độ Bảo vệ môi trường: ${MODE_LABELS[mode]}. Bấm để đổi mức.`}
          onClick={cycle}
          style={{ minWidth: 96, minHeight: 44, padding: "0 16px", fontWeight: 700 }}
        >
          {MODE_LABELS[mode]}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          minHeight: 44,
          marginTop: 4,
          color: "hsl(var(--primary))",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {open ? "Thu gọn" : "Bật lên thì tiết kiệm những gì?"}
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18 }}>
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open ? (
        <div style={{ marginTop: 4 }}>
          {SAVINGS.map((item) => (
            <div
              key={item.title}
              style={{ display: "flex", gap: 10, padding: "12px 0", borderTop: "1px solid hsl(var(--border) / 0.6)" }}
            >
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 20, color: "hsl(var(--muted-foreground))" }}>
                {item.icon}
              </span>
              <div style={{ minWidth: 0 }}>
                <strong style={{ display: "block", fontSize: 14.5, lineHeight: 1.4 }}>{item.title}</strong>
                <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "hsl(var(--muted-foreground))" }}>
                  {item.detail}
                </p>
              </div>
            </div>
          ))}

          <p style={{ margin: "12px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "hsl(var(--muted-foreground))" }}>
            {KEPT}
          </p>

          <EcoImpact />

        </div>
      ) : null}
    </section>
  );
}
