import AppGlyph from "./AppGlyph";

const SIZE_CLASS = Object.freeze({
  small: "h-10 w-10 rounded-[13px]",
  medium: "h-14 w-14 rounded-[17px]",
  large: "h-16 w-16 rounded-[20px]",
});

// Hình chiếm gần trọn ô, lề do chính cảnh trong AppGlyph chừa ra. Nét đơn sắc
// đặt giữa ô như trước làm mọi app trông giống hệt nhau.
export default function UtilityAppIcon({ app, gradient, size = "medium", className = "" }) {
  return (
    <span
      className={`utility-app-icon inline-flex shrink-0 items-center justify-center bg-gradient-to-br ${gradient} ${SIZE_CLASS[size] || SIZE_CLASS.medium} ${className}`}
      aria-hidden="true"
      data-app-id={app?.id}
    >
      <AppGlyph appId={app?.id} />
    </span>
  );
}
