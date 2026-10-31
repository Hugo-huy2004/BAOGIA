// Xác thực 2 lớp cho hành động tiền của thành viên.
//
// Luật, một cổng cho MỌI đường chuyển tiền:
//   • Dưới ngưỡng  → PIN nếu người dùng đã cài, hoặc Face ID/Google vừa xong.
//   • Từ ngưỡng lên → PIN BẮT BUỘC + "xác nhận đây là bạn" như Apple Pay: phiên
//     phải vừa mở bằng Face ID / vân tay (passkey) hoặc Google trong 5 phút
//     (requireRecentAuth). Thay cho OTP email từ 31/10/2026: mã email đi chậm,
//     hay vào thư rác, và ai đọc được hòm thư là qua — Face ID thì không.
//
// Ngưỡng theo JOY gốc, chỉnh bằng ENV MONEY_STEPUP_THRESHOLD (mặc định 2000).
import bcrypt from 'bcryptjs';

export const stepUpThreshold = () =>
  process.env.MONEY_STEPUP_THRESHOLD != null ? Number(process.env.MONEY_STEPUP_THRESHOLD) : 2000;
// Khoá thử sai PIN: 5 lần sai trong 15 phút thì tạm chặn hành động tiền của
// tài khoản đó. Đây là biên an ninh (chống dò PIN 4-6 số), KHÔNG được lược bỏ.
const pinFails = new Map();
const PIN_MAX = 5;
const PIN_WINDOW_MS = 15 * 60 * 1000;

function pinLocked(email) {
  const e = pinFails.get(email);
  if (!e) return false;
  if (Date.now() - e.first > PIN_WINDOW_MS) { pinFails.delete(email); return false; }
  return e.count >= PIN_MAX;
}
function notePinFail(email) {
  const e = pinFails.get(email);
  if (!e || Date.now() - e.first > PIN_WINDOW_MS) pinFails.set(email, { count: 1, first: Date.now() });
  else e.count += 1;
}
function clearPinFails(email) { pinFails.delete(email); }

/**
 * @returns {ok:true} khi được phép tiếp tục, hoặc
 *          {ok:false, status, code, error} để route trả thẳng cho client.
 * `code`: PIN_SETUP_REQUIRED | PIN_REQUIRED | PIN_WRONG | PIN_LOCKED | REAUTH_REQUIRED
 * `verified`: recentlyVerified(req) của route.
 */
export async function checkMoneyStepUp({ senderBio, amountBaseJoy, pin = '', verified = false }) {
  const email = String(senderBio?.email || '').toLowerCase();
  const amount = Math.abs(Number(amountBaseJoy) || 0);

  // Dưới ngưỡng: PIN nếu đã cài — hoặc Face ID/vân tay vừa xong, như Apple Pay.
  if (amount < stepUpThreshold()) {
    if (senderBio?.transactionPin && !verified) {
      if (!pin) return { ok: false, status: 400, code: 'PIN_REQUIRED', error: 'Vui lòng nhập mã PIN giao dịch.' };
      if (!(await bcrypt.compare(String(pin), senderBio.transactionPin))) {
        return { ok: false, status: 400, code: 'PIN_WRONG', error: 'Mã PIN giao dịch không chính xác.' };
      }
    }
    return { ok: true };
  }

  // Từ ngưỡng lên: PIN bắt buộc.
  if (pinLocked(email)) {
    return { ok: false, status: 429, code: 'PIN_LOCKED', error: 'Nhập sai PIN quá nhiều lần. Vui lòng thử lại sau 15 phút.' };
  }
  if (!senderBio?.transactionPin) {
    return { ok: false, status: 428, code: 'PIN_SETUP_REQUIRED', error: 'Giao dịch lớn cần mã PIN. Vui lòng cài mã PIN giao dịch trước.' };
  }
  if (!pin) return { ok: false, status: 428, code: 'PIN_REQUIRED', error: 'Giao dịch lớn cần mã PIN.' };
  if (!(await bcrypt.compare(String(pin), senderBio.transactionPin))) {
    notePinFail(email);
    return { ok: false, status: 400, code: 'PIN_WRONG', error: 'Mã PIN giao dịch không chính xác.' };
  }
  clearPinFails(email);

  // Lớp 2: chính chủ vừa mở khoá bằng Face ID / Google.
  if (!verified) {
    return { ok: false, status: 428, code: 'REAUTH_REQUIRED', error: 'Giao dịch lớn cần xác nhận đây là bạn bằng Face ID, vân tay hoặc Google.' };
  }

  return { ok: true };
}
