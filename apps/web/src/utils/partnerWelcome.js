// Đánh dấu "đã qua màn chào mừng của chiến dịch partner" trên máy này.
// App cài từ partner.hugowishpax.studio mở ở start_url /member/today; lần đầu
// (chưa có dấu) App.jsx đưa về trang nhận quà thay vì khu thành viên.
// iOS cấp cho app đã cài một kho lưu trữ riêng, nên dấu từ Safari không theo
// sang — đúng ý: lần đầu mở app luôn thấy trang nhận quà.
const key = (slug) => `partner_welcomed_${slug}`;

export function markPartnerWelcomed(slug) {
  try { localStorage.setItem(key(slug), "1"); } catch { /* storage bị chặn */ }
}

export function isPartnerWelcomed(slug) {
  try { return localStorage.getItem(key(slug)) === "1"; } catch { return false; }
}
