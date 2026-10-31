import { useEffect, useRef } from "react";

/**
 * Gọi `callback` mỗi `intervalMs`, NHƯNG chỉ khi tab đang hiện.
 *
 * Vì sao cần: `setInterval` trần vẫn chạy lúc người dùng chuyển sang app khác.
 * Một người mở tab rồi bỏ đó vẫn nện server suốt ngày — nhân với số người
 * đang mở là đủ làm sập. Trình duyệt có bóp nhịp tab ẩn, nhưng không dừng hẳn,
 * và mức bóp mỗi trình duyệt một kiểu nên không dựa vào đó được.
 *
 * Quay lại tab thì gọi NGAY rồi mới chạy lại nhịp — nên dữ liệu còn tươi hơn
 * bản poll liên tục, mà tốn ít request hơn hẳn.
 *
 * `enabled=false` để tắt hẳn (chưa mở màn, đã xong việc, giao dịch đã chốt).
 */
export default function useVisiblePoll(callback, intervalMs, enabled = true) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (!enabled || !intervalMs) return undefined;

    let timer = null;
    const run = () => savedCallback.current();
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => { stop(); timer = setInterval(run, intervalMs); };

    const onVisibility = () => {
      if (document.hidden) stop();
      else { run(); start(); }
    };

    run();
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, enabled]);
}
