import { useRef } from "react";

/** Ngón tay xê dịch quá ngần này thì đó là vuốt, không phải chạm chọn. */
const SLOP = 10;

/**
 * Phân biệt vuốt với chạm trong một vùng cuộn.
 *
 * Trên di động, thả tay sau khi vuốt (nhất là khi vuốt để dừng đà cuộn) vẫn
 * sinh ra `click` — người dùng chỉ định cuộn mà lại mở nhầm app hoặc mở nhầm
 * phiếu mua. Gắn props này lên CHÍNH vùng cuộn: `onClickCapture` chạy ở pha
 * bắt, trước mọi onClick con, nên một chỗ gắn là cả cây con được bảo vệ.
 */
export function useTapGuard(threshold = SLOP) {
  const start = useRef(null);

  return {
    onPointerDown: (e) => { start.current = { x: e.clientX, y: e.clientY }; },
    onClickCapture: (e) => {
      const from = start.current;
      start.current = null;
      // Click bằng bàn phím/trợ năng không có toạ độ thật — đừng chặn nhầm.
      if (!from || (e.clientX === 0 && e.clientY === 0)) return;
      if (Math.hypot(e.clientX - from.x, e.clientY - from.y) > threshold) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };
}
