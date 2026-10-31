import UserProfile from '../models/UserProfile.js';
import MemberActivity from '../models/MemberActivity.js';

/**
 * "Đang online" = có nhịp tim trong 90 giây qua (client gửi ~45s/lần khi tab
 * đang mở). Giữ trong RAM của tiến trình — Render free chạy một tiến trình.
 * Số người dùng theo ngày lấy từ MemberActivity.days (memberActivity.js ghi).
 * ponytail: tách nhiều instance thì online chỉ thấy người cắm vào instance đó.
 */
const PRESENCE_MS = 90 * 1000;
const lastBeat = new Map();

setInterval(() => {
  const cutoff = Date.now() - PRESENCE_MS;
  for (const [email, at] of lastBeat) if (at < cutoff) lastBeat.delete(email);
}, 60 * 1000).unref();

// Ngày theo giờ VN, khớp MemberActivity.days.
export function todayStr() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function recordHeartbeat(email) {
  lastBeat.set(email, Date.now());
  // Chỉ cần biết ngày hoạt động gần nhất cho lifecycle mail; ghi tối đa một
  // lần mỗi ngày để heartbeat không thành tải MongoDB.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await UserProfile.updateOne(
    { email, $or: [{ lastSignalAt: { $lt: today } }, { lastSignalAt: { $exists: false } }] },
    { $set: { lastSignalAt: new Date() } },
  ).catch((e) => console.error('[presence] activity tracking error:', e.message));
}

export async function isOnline(email) {
  return Date.now() - (lastBeat.get(email) || 0) < PRESENCE_MS;
}

export async function getOnlineStatuses(emails) {
  return Object.fromEntries(await Promise.all(emails.map(async (e) => [e, await isOnline(e)])));
}

/** Số thành viên có mở app trong một ngày (YYYY-MM-DD giờ VN, mặc định hôm nay). */
export async function getDailyActiveCount(dateStr) {
  return MemberActivity.countDocuments({ days: dateStr || todayStr() });
}
