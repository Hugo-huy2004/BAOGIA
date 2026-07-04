import React, { useEffect, useState, useRef } from "react";

function formatJoy(v){ return `${Number(Math.round(v)||0).toLocaleString("vi-VN")} JOY`; }

export default function JoyBalanceCard({ balance, onExchange }){
  const [display, setDisplay] = useState(balance || 0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = display;
    const end = balance || 0;
    const duration = 600;
    const startTime = performance.now();

    cancelAnimationFrame(rafRef.current);
    function step(now){
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = Math.round(start + (end - start) * eased);
      setDisplay(cur);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance]);

  return (
    <section className="joy-balance-card">
      <div className="balance-row">
        <div>
          <div className="balance-label">Số dư hiện tại</div>
          <div className="balance-value" aria-live="polite">{formatJoy(display)}</div>
        </div>
        <div className="balance-actions">
          <button className="btn-outline" onClick={onExchange}>Trao đổi</button>
          <button className="btn-ghost">Nạp</button>
        </div>
      </div>
      <p className="balance-note">JOY là điểm thưởng nội bộ — xem chi tiết trong lịch sử giao dịch.</p>
    </section>
  );
}
