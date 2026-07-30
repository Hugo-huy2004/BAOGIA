import React, { useEffect, useRef, useState } from "react";
import { levelFor, levelProgress, maxLevel } from "./arcadeProgression";

// HUD dùng chung cho mọi game. Trước đây mỗi game tự dựng thẻ điểm với màu
// hardcode (tetris cyan/tím, survivor hồng, wordguess xanh lá…) nên cùng một
// arcade mà mỗi màn một tông. Giờ tất cả đọc bảng màu `--intro-*` của chính
// game đó, và cùng hiện một thứ: điểm, cấp độ tự động, combo.

const fmt = (n) => (typeof n === "number" ? n.toLocaleString("vi-VN") : n);

/**
 * @param {string} gameId    id game (để tra đường cong độ khó)
 * @param {number} score     điểm hiện tại
 * @param {number} combo     số nhịp combo liên tiếp (0 = không hiện)
 * @param {number} multiplier hệ số nhân đang áp dụng
 * @param {Array}  stats     [{ label, value }] các ô phụ riêng của từng game
 * @param {string} notice    thông báo tạm thời (lên cấp, nhận vật phẩm…)
 */
export default function ArcadeHud({ gameId, score = 0, combo = 0, multiplier = 1, stats = [], notice = "" }) {
  const level = levelFor(gameId, score);
  const top = maxLevel(gameId);
  const progress = levelProgress(gameId, score);
  const capped = level >= top;
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const toastSequenceRef = useRef(0);

  // Combo/x2 và thông báo chặng là overlay tạm thời, không còn là một card
  // nằm trong document flow. Vì vậy chúng có thể xuất hiện liên tục mà không
  // làm HUD cao/thấp thất thường hoặc đẩy bàn chơi trên iPhone.
  useEffect(() => {
    if (combo < 2) return undefined;
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastSequenceRef.current += 1;
    setToast({
      id: toastSequenceRef.current,
      icon: "bolt",
      title: `${combo}× liên hoàn`,
      detail: `Hệ số x${multiplier.toFixed(2).replace(/\.?0+$/, "")}`,
      kind: "combo",
    });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 1350);
    return undefined;
  }, [combo, multiplier]);

  useEffect(() => {
    if (!notice) return undefined;
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastSequenceRef.current += 1;
    setToast({
      id: toastSequenceRef.current,
      icon: "auto_awesome",
      title: notice,
      detail: "",
      kind: "notice",
    });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 1650);
    return undefined;
  }, [notice]);

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);

  return (
    <div className="ahud">
      <div className="ahud__row">
        <div className="ahud__score">
          <small>Điểm</small>
          <strong>{fmt(score)}</strong>
        </div>

        {stats.map((s) => (
          <div key={s.label} className="ahud__stat">
            <small>{s.label}</small>
            <strong>{fmt(s.value)}</strong>
          </div>
        ))}

        <div className={`ahud__level${capped ? " is-max" : ""}`}>
          <small>Cấp</small>
          <strong>{level}</strong>
        </div>
      </div>

      <div className="ahud__rail" aria-hidden="true">
        <span style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      <div className="ahud__toast-region" aria-live="polite" aria-atomic="true">
        {toast && (
          <div className="ahud__toast" data-kind={toast.kind} key={toast.id}>
            <span className="material-symbols-outlined">{toast.icon}</span>
            <span>
              <b>{toast.title}</b>
              {toast.detail && <small>{toast.detail}</small>}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
