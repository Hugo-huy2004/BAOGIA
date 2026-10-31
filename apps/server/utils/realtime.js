// Đẩy một payload JSON tới mọi WebSocket mà một thành viên đang mở.
// Dùng để trạng thái portal (số dư JOY, duyệt xác minh…) đổi ngay trên màn hình
// mà không phải tải lại trang.
//
// ponytail: chỉ gửi tại chỗ — Render free chạy một tiến trình nên mọi socket ở
// đây. Tách nhiều tiến trình thì cần một kênh loan tin (đã gỡ Redis 31/10/2026).
export function broadcastToEmail(email, payload) {
  const clients = global.wsClients?.[email];
  if (!clients || clients.size === 0) return 0;
  const message = JSON.stringify(payload);
  let sent = 0;
  for (const client of clients) {
    if (client.readyState === 1) { client.send(message); sent += 1; }
  }
  return sent;
}
