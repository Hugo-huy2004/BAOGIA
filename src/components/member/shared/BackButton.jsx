
/**
 * Nút đóng/thoát tiện ích chuẩn hoá duy nhất — hình tròn đỏ icon 'x' (macOS close standard).
 * Đồng bộ tất cả button thoát ứng dụng về một mẫu duy nhất.
 */
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
