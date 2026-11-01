import mongoose from 'mongoose';

/**
 * Ngân sách thư — khớp gói miễn phí Resend (3000 thư/tháng, 100 thư/ngày): hết suất
 * thì THÔI GỬI chứ không tính tiền, không để nhà cung cấp chặn cả tài khoản giữa tháng.
 *
 * Chia 100 thư/ngày (≈ 3000/30) thành hai hạng:
 *  - essential: OTP admin, bảo mật, tài khoản sắp hết hạn, hồ sơ, thư Ban Quản trị → dùng hết trần.
 *  - extra: thư Edu "cho vui" (chào mừng, mốc lửa, lửa đóng băng, lời mời kết bạn) → chỉ tới 60%,
 *    40% còn lại luôn để dành cho thư quan trọng. Thư extra bị cắt thì push + hộp thư vẫn tới.
 * Đếm trong Mongo (collection mail_quota) vì Render free khởi động lại là mất RAM.
 */
const CAP = { month: 3000, day: 100 };
const SHARE = { essential: 1, extra: 0.6 };

const quota = () => mongoose.connection.collection('mail_quota');

async function take(id, cap) {
  try {
    // Lọc n < trần + upsert: chạm trần thì upsert đụng _id trùng → E11000 = hết suất (nguyên tử, nhiều request cùng lúc không vượt).
    await quota().updateOne({ _id: id, n: { $lt: cap } }, { $inc: { n: 1 }, $setOnInsert: { at: new Date() } }, { upsert: true });
    return true;
  } catch (error) {
    if (error?.code === 11000) return false;
    throw error;
  }
}

/** Giữ một suất gửi; false = hết suất hạng này hôm nay/tháng này. ponytail: mỗi lần gửi tính 1 suất, kể cả có cc. */
export async function takeMailSlot(tier = 'essential') {
  const share = SHARE[tier] ?? SHARE.essential;
  const now = new Date().toISOString();
  const month = `${tier}:${now.slice(0, 7)}`;
  const day = `${tier}:${now.slice(0, 10)}`;
  // Hạng essential đếm TỔNG (cả extra) để trần chung không bao giờ vượt; extra đếm riêng phần của nó.
  const ids = tier === 'extra'
    ? [[month, CAP.month * share], [day, CAP.day * share], [`all:${now.slice(0, 7)}`, CAP.month], [`all:${now.slice(0, 10)}`, CAP.day]]
    : [[`all:${now.slice(0, 7)}`, CAP.month], [`all:${now.slice(0, 10)}`, CAP.day]];
  const taken = [];
  for (const [id, cap] of ids) {
    if (!(await take(id, Math.floor(cap)))) {
      // Trả lại suất đã giữ ở bước trước để bộ đếm không lệch.
      await Promise.all(taken.map((done) => quota().updateOne({ _id: done }, { $inc: { n: -1 } })));
      return false;
    }
    taken.push(id);
  }
  return true;
}
