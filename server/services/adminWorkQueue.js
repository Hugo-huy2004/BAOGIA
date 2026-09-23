/**
 * Hàng đợi việc chờ người duyệt — TOÀN HỆ THỐNG.
 *
 * Hồ sơ 360° (`adminUserOverview.js`) chỉ trả lời được câu "người NÀY đang chờ
 * gì". Nhưng admin không ngồi mở từng hồ sơ để dò: việc cần một chỗ tự nổi lên.
 * Trước đó đơn kháng nghị mở khoá và giao dịch JOY bị giữ nằm chờ vô thời hạn
 * đơn giản vì không màn hình nào liệt kê chúng.
 *
 * Mỗi mục đều kèm `userId` giải sẵn từ email → Bio, để giao diện gọi thẳng các
 * endpoint `/admin/users/:id/...` đã có mà không phải tra thêm một vòng.
 * Email không còn hồ sơ Bio thì `userId` là null và giao diện chỉ hiện, không
 * cho bấm — thà mất một nút còn hơn bấm nhầm vào người khác.
 *
 * CỐ Ý CHƯA CÓ: lịch hẹn (`Booking`) và dự án khách hàng (`CustomerProject`).
 * Chủ dự án sẽ đổi hẳn cấu trúc hai phần đó (chốt 2026-09-23), nên dựng hàng
 * đợi trên schema sắp bỏ là làm công cốc. Thêm lại = thêm một `section()` ở
 * dưới và một khối trong `AdminWorkQueueTab.jsx`.
 */

const loadModel = async (name) => {
  try {
    return (await import(`../models/${name}.js`)).default;
  } catch {
    return null;
  }
};

async function section(name, run) {
  try {
    return { name, items: await run() };
  } catch (error) {
    return { name, items: [], error: error.message };
  }
}

/** Giải email → _id của Bio cho cả lô, một truy vấn thay vì N truy vấn. */
async function resolveUserIds(Bio, emails) {
  const unique = [...new Set(emails.filter(Boolean).map((e) => String(e).toLowerCase()))];
  if (!Bio || !unique.length) return new Map();
  const bios = await Bio.find({ email: { $in: unique } }).select('_id email').lean();
  return new Map(bios.map((b) => [String(b.email).toLowerCase(), String(b._id)]));
}

const withUser = (rows, idByEmail, emailField = 'email') =>
  rows.map((row) => ({
    ...row,
    userId: idByEmail.get(String(row[emailField] || '').toLowerCase()) || null,
  }));

export async function buildWorkQueue({ limit = 50 } = {}) {
  const [Bio, SecurityAppeal, PendingTransfer, SupportTicket, JoyDefaultRecord] =
    await Promise.all(['Bio', 'SecurityAppeal', 'PendingTransfer', 'SupportTicket',
      'JoyDefaultRecord'].map(loadModel));

  const raw = await Promise.all([
    // Kháng nghị mở khoá: người dùng đã gửi ảnh và vị trí, đang chờ một câu trả lời.
    section('appeals', () => (SecurityAppeal
      ? SecurityAppeal.find({ $or: [{ status: 'pending' }, { status: { $exists: false } }] })
          .sort({ createdAt: 1 }).limit(limit).lean()
      : [])),

    // Giao dịch JOY bị ví giữ lại. Xếp CŨ TRƯỚC: tiền của người ta đang treo.
    section('heldTransfers', () => (PendingTransfer
      ? PendingTransfer.find({ status: { $in: ['pending', 'held', 'review'] } })
          .sort({ createdAt: 1 }).limit(limit).lean()
      : [])),

    // Hồ sơ nợ JOY chờ duyệt CẤM VĨNH VIỄN. Trước đây chỉ hiện trong Telegram —
    // một kênh, một người, không có dấu vết trên bảng điều khiển. Sổ đen khoá
    // theo BĂM email nên KHÔNG tra ngược ra người dùng được; đó là chủ ý, và
    // vì vậy mục này không có nút "mở hồ sơ".
    section('joylater', () => (JoyDefaultRecord
      ? JoyDefaultRecord.find({ stage: 'review', confirmedAt: null, clearedAt: null })
          .sort({ createdAt: 1 }).limit(limit).lean()
      : [])),

    section('tickets', () => (SupportTicket
      ? SupportTicket.find({ status: { $in: ['open', 'pending', 'new'] } })
          .sort({ createdAt: 1 }).limit(limit).lean()
      : [])),
  ]);

  const byName = Object.fromEntries(raw.map((r) => [r.name, r]));
  const emails = raw.flatMap((r) => r.items.flatMap((i) => [i.email, i.fromEmail]));
  const idByEmail = await resolveUserIds(Bio, emails);

  const queue = {
    appeals: withUser(byName.appeals.items, idByEmail),
    heldTransfers: withUser(byName.heldTransfers.items, idByEmail, 'fromEmail'),
    // Không gắn userId: hồ sơ chỉ có băm, không có email thô.
    joylater: byName.joylater.items,
    tickets: withUser(byName.tickets.items, idByEmail),
  };

  const counts = Object.fromEntries(Object.entries(queue).map(([k, v]) => [k, v.length]));
  counts.total = Object.values(counts).reduce((a, b) => a + b, 0);

  const failed = raw.filter((r) => r.error).map((r) => ({ section: r.name, error: r.error }));
  return { queue, counts, failed };
}
