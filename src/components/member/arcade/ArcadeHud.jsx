import React from "react";
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

      {combo >= 2 && (
        <div className="ahud__combo" key={combo}>
          <span className="material-symbols-outlined">bolt</span>
          <b>{combo}× liên hoàn</b>
          <em>x{multiplier.toFixed(2).replace(/\.?0+$/, "")}</em>
        </div>
      )}

      {notice && <p className="ahud__notice">{notice}</p>}
    </div>
  );
}
