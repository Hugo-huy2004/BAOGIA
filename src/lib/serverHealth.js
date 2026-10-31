// Tình trạng máy chủ theo góc nhìn trình duyệt. Chỉ phát sự kiện khi ĐỔI trạng
// thái, nên 20 request cùng hỏng lúc Render free đang ngủ chỉ bật banner một lần.
let down = false;

export function noteServer(ok, status = 0) {
  if (ok !== down) return;
  down = !ok;
  window.dispatchEvent(new CustomEvent("hugo:server-health", { detail: { ok, status } }));
}

export const serverIsDown = () => down;
