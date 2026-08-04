
/**
 * Nút quay lại dùng chung cho mọi ứng dụng trong portal.
 *
 * Trước đây mỗi app tự vẽ một kiểu: pill viền tròn, nút tròn 36px, chữ trần,
 * icon-only... — mỗi màn một cỡ chạm khác nhau. Ở đây gom về một hình khối duy
 * nhất, cao 44px đúng ngưỡng chạm tối thiểu, nền chỉ hiện khi tương tác.
 *
 * `tone="onDark"` dành cho nền tối đặc (game, overlay) nơi token `muted` của
 * theme sáng sẽ chìm mất.
 */
export default function BackButton({
  onClick,
  label = "Quay lại",
  tone = "default",
  iconOnly = false,
  className = "",
}) {
  const palette = tone === "onDark"
    ? "text-white hover:bg-white/12 active:bg-white/20"
    : "text-foreground hover:bg-muted active:bg-muted";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex h-11 shrink-0 items-center gap-1 rounded-xl transition-colors ${
        iconOnly ? "w-11 justify-center" : "pl-2 pr-3.5"
      } ${palette} ${className}`}
    >
      <span className="material-symbols-outlined text-[22px]">arrow_back</span>
      {!iconOnly && <span className="text-[15px] font-medium">{label}</span>}
    </button>
  );
}
