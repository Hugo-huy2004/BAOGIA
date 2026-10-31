// Kỷ lục cá nhân từng game, giữ trong máy.
//
// Server đã có bestScore trong profile arcade, nhưng nó về theo nhịp mạng và
// chỉ dùng để bày bảng xếp hạng. Thứ cần ở đây khác hẳn: HUD phải biết kỷ lục
// NGAY từ khung hình đầu tiên của ván, và màn kết thúc phải so sánh được trong
// cùng một nhịp. Một lượt fetch không kịp cho việc đó, nên kỷ lục đọc từ máy —
// server vẫn là nguồn cho bảng xếp hạng, còn đây là nguồn cho cảm giác chơi.

const KEY = "hugo.arcade.best.v1";

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function getBest(gameId) {
  const value = readAll()[gameId];
  return typeof value === "number" ? value : 0;
}

/**
 * Ghi kỷ lục mới nếu điểm vừa rồi cao hơn.
 * Trả về `true` khi thật sự phá kỷ lục — để nơi gọi biết có nên ăn mừng không.
 */
export function recordBest(gameId, score) {
  if (typeof score !== "number" || !Number.isFinite(score) || score <= 0) return false;
  const all = readAll();
  if (score <= (all[gameId] || 0)) return false;
  all[gameId] = score;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Hết dung lượng hoặc chế độ riêng tư: mất kỷ lục còn hơn mất ván chơi.
  }
  return true;
}

/**
 * Ván này hụt kỷ lục trong gang tấc?
 *
 * Đây là toàn bộ lý do file này tồn tại. "Thua" là một câu kết; "thiếu 37 điểm
 * nữa thôi" là một lời mời chơi lại. Ngưỡng 15% đủ rộng để hay gặp, đủ hẹp để
 * không nói dối người chơi khi họ thua cách biệt.
 *
 * Trả về số điểm còn thiếu, hoặc 0 nếu không tính là hụt gang tấc.
 */
export function nearMissGap(gameId, score, best = getBest(gameId)) {
  if (!best || score >= best) return 0;
  const gap = best - score;
  return gap <= Math.max(3, best * 0.15) ? gap : 0;
}
