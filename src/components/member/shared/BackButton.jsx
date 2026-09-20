
/**
 * Nút đóng/thoát tiện ích chuẩn hoá duy nhất — hình tròn đỏ icon 'x' (macOS close standard).
 * Đồng bộ tất cả button thoát ứng dụng về một mẫu duy nhất.
 */

/**
 * Hình học của nút X, khai Ở ĐÂY vì đây là nơi sở hữu kích thước nút.
 *
 * Nút này do portal đặt `fixed` ở góc trên-phải và nằm ĐÈ lên vỏ của app, nên
 * `AppFrame` phải chừa đúng ngần này chỗ cho khe `actions` của thanh tiêu đề.
 * Trước đây hai bên tự đoán số: nút chiếm 14 + 36 = 50px tính từ mép phải, còn
 * khung chừa `mr-10` = 40px — thiếu 10px nên nút "Tải app" và nút X chạm nhau.
 * Một nguồn số thì không lệch được nữa.
 */
export const CLOSE_BUTTON_EDGE = 14;   // px, khoảng cách tới mép màn (khớp `right` ở MemberUtilitiesTab)
export const CLOSE_BUTTON_SIZE = 36;   // px, bề ngang lớn nhất (h-9 w-9 từ breakpoint sm)
export const CLOSE_BUTTON_GAP = 10;    // px, khoảng thở giữa nút X và thứ đứng cạnh nó

/** Bề ngang mà thanh tiêu đề phải chừa trống bên phải để không đụng nút X. */
export const CLOSE_BUTTON_RESERVE =
  `calc(max(${CLOSE_BUTTON_EDGE}px, env(safe-area-inset-right, 0px)) + ${CLOSE_BUTTON_SIZE + CLOSE_BUTTON_GAP}px)`;
export default function BackButton({
  onClick,
  label = "Đóng",
  className = "",
  style = {},
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={style}
      className={`group relative inline-flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-[#ff5f57] text-[#700000] border border-[#d63d35]/40 shadow-md shadow-red-500/20 transition-all duration-150 hover:bg-[#e0443e] hover:scale-110 active:scale-95 cursor-pointer select-none ${className}`}
    >
      <span className="material-symbols-outlined text-[17px] sm:text-[19px] font-black leading-none">
        close
      </span>
    </button>
  );
}
