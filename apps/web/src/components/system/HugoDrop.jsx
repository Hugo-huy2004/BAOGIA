import { useId } from "react";
import "./systemStatus.css";

// Cùng path với HugoLogo (dựng bằng compa — đừng vẽ lại bằng tay).
const DROP = "M47.43 8.25 A3 3 0 0 1 52.57 8.25 L75.68 46.48 A30 30 0 1 1 24.32 46.48 Z";
// Một chu kỳ sóng rộng gấp đôi khung để trượt ngang liền mạch.
const WAVE = "M0 0 Q 15.5 -5 31 0 T 62 0 T 93 0 T 124 0 V 100 H 0 Z";

/**
 * Giọt nước Hugo Studio có trạng thái — trung tâm của mọi màn chờ, cập nhật, lỗi.
 *
 *   fill    nước dâng và hạ trong giọt (đang tải / đang cập nhật)
 *   rest    nước đứng yên ở mức thấp, gợn rơi bên dưới (lỗi, mất kết nối)
 *
 * Màu theo `hugo-mark` như logo; prefers-reduced-motion tắt mọi chuyển động.
 */
export default function HugoDrop({ mode = "fill", className = "h-20 w-20", label = "Hugo Studio" }) {
  const clip = useId();
  return (
    <svg viewBox="14 2 72 100" role="img" aria-label={label} className={`hugo-mark hs-drop hs-drop--${mode} ${className}`}>
      <defs>
        <clipPath id={clip}><path d={DROP} /></clipPath>
      </defs>
      <path d={DROP} className="hs-drop__shell" />
      <g clipPath={`url(#${clip})`}>
        <g className="hs-drop__level">
          <g transform="translate(19 -1)"><path d={WAVE} className="hs-drop__wave hs-drop__wave--back" /></g>
          <g transform="translate(19 1)"><path d={WAVE} className="hs-drop__wave" /></g>
        </g>
      </g>
      {mode === "rest" && (
        <g className="hs-drop__ripples" aria-hidden="true">
          <ellipse cx="50" cy="97" rx="10" ry="2" />
          <ellipse cx="50" cy="97" rx="10" ry="2" />
        </g>
      )}
    </svg>
  );
}
