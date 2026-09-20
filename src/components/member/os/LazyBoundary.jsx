import { Component } from "react";
import { useTranslation } from "react-i18next";

/**
 * HugoOS — ranh giới lỗi cho phần nạp lazy, dùng chung cho mọi app.
 *
 * Vì sao cần: `Suspense` chỉ lo lúc ĐANG tải. Chunk tải THẤT BẠI thì lỗi vọt
 * lên trên và làm trắng cả portal, không chỉ cái app đó. Hai tình huống xảy ra
 * thật, không phải giả định:
 *
 *   1. Mất mạng giữa lúc tải chunk (rất thường trên 3G/4G yếu).
 *   2. Deploy bản mới trong khi tab cũ đang mở: tệp chunk mà tab đó sắp xin đã
 *      bị thay tên, máy chủ trả 404. Đây là lý do phổ biến nhất của "tự nhiên
 *      trắng trang sau khi các anh deploy".
 *
 * Chống tình huống 2 là ưu tiên: nút chính là TẢI LẠI TRANG, vì thử lại cùng
 * một chunk đã biến mất thì không bao giờ thành công. Nút phụ mới là quay ra.
 *
 * ponytail: một bản dùng chung thay vì mỗi app tự viết một class. Phải là class
 * — React chưa có hook nào bắt được lỗi render của cây con.
 */
class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // Chỉ console: đây là lỗi tải tệp ở phía máy người dùng, không phải sự cố
    // máy chủ, và một số app (bản public) chạy khi chưa đăng nhập nên không có
    // kênh báo lỗi nào chắc chắn tồn tại.
    console.error("[HugoOS] phần nội dung tải lỗi:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const { t, message, onBack, backLabel } = this.props;
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <span className="material-symbols-outlined text-[36px]" style={{ color: "var(--ios-label-2, currentColor)" }}>
          cloud_off
        </span>
        <p className="mt-3 max-w-[40ch] text-[15px] leading-snug" style={{ color: "var(--ios-label-2, currentColor)" }}>
          {message || t("os.lazyFailed")}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-[44px] items-center rounded-full px-5 text-[15px] font-semibold"
            style={{ background: "var(--ax, currentColor)", color: "#fff" }}
          >
            {t("os.reload")}
          </button>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[44px] items-center rounded-full px-5 text-[15px] font-semibold"
              style={{ background: "var(--ios-fill, transparent)", color: "var(--ax, currentColor)" }}
            >
              {backLabel || t("os.goBack")}
            </button>
          )}
        </div>
      </div>
    );
  }
}

/**
 * `message` — câu giải thích riêng của app (không truyền thì dùng câu chung).
 * `onBack`  — có thì hiện thêm nút quay ra khỏi phần bị lỗi.
 * `resetKey`— đổi giá trị này là dựng lại ranh giới, để một phần lỗi không khoá
 *             luôn phần tiếp theo người dùng mở.
 */
export default function LazyBoundary({ message, onBack, backLabel, resetKey, children }) {
  const { t } = useTranslation();
  return (
    <Boundary key={resetKey} t={t} message={message} onBack={onBack} backLabel={backLabel}>
      {children}
    </Boundary>
  );
}
