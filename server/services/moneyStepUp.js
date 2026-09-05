// Xác thực 2 lớp cho hành động tiền của thành viên.
//
// Trước đây một giao dịch chuyển JOY chỉ dựa vào JWT: ai cầm được phiên đăng
// nhập là chuyển được sạch ví. PIN giao dịch có tồn tại nhưng LÀ TUỲ CHỌN và
// không phân biệt số tiền — và endpoint /transfer-p2p thì không kiểm gì cả.
//
// Luật mới, một cổng cho MỌI đường chuyển tiền:
//   • Dưới ngưỡng  → giữ nguyên hành vi cũ (PIN nếu người dùng đã cài).
//   • Từ ngưỡng lên → PIN BẮT BUỘC, cộng thêm OTP email KHI email gửi được.
//
// Ngưỡng theo JOY gốc, chỉnh bằng ENV MONEY_STEPUP_THRESHOLD (mặc định 2000).
import bcrypt from 'bcryptjs';
import { verifyEmailOtp, issueEmailOtp, hasLiveEmailOtp } from '../utils/emailOtp.js';

const OTP_SCOPE = 'money';
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
 * `code`: PIN_SETUP_REQUIRED | PIN_REQUIRED | PIN_WRONG | PIN_LOCKED |
 *         OTP_SENT | OTP_WRONG
 */
export async function checkMoneyStepUp({ senderBio, amountBaseJoy, pin = '', otp = '', sendOtp = null }) {
  const email = String(senderBio?.email || '').toLowerCase();
  const amount = Math.abs(Number(amountBaseJoy) || 0);

  // Dưới ngưỡng: hành vi cũ — PIN chỉ khi người dùng đã cài đặt.
  if (amount < stepUpThreshold()) {
    if (senderBio?.transactionPin) {
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

  // Lớp 2: OTP email — chỉ khi email THẬT SỰ gửi được. Nếu SendGrid chưa bật,
  // bỏ qua bước này thay vì bắt người dùng chờ một mã không bao giờ tới.
  const { isEmailDeliverable } = await import('./emailService.js');
  if (isEmailDeliverable()) {
    if (!otp) {
      if (!hasLiveEmailOtp(email, OTP_SCOPE)) {
        const code = issueEmailOtp(email, OTP_SCOPE);
        if (sendOtp) await sendOtp(email, code).catch(() => {});
      }
      return { ok: false, status: 428, code: 'OTP_SENT', error: 'Đã gửi mã xác nhận tới email của bạn. Nhập mã để hoàn tất.' };
    }
    const v = verifyEmailOtp(email, otp, OTP_SCOPE);
    if (!v.ok) return { ok: false, status: 400, code: 'OTP_WRONG', error: 'Mã xác nhận sai hoặc đã hết hạn.' };
  }

  return { ok: true };
}

// Gửi OTP tiền qua email (dùng làm callback sendOtp ở trên).
export async function sendMoneyOtpEmail(email, code) {
  const { sendCustomEmail } = await import('./emailService.js');
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
    <h2 style="margin:0 0 8px">Mã xác nhận giao dịch</h2>
    <p>Bạn đang thực hiện một giao dịch JOY lớn. Nhập mã sau để xác nhận (hết hạn 10 phút):</p>
    <p style="font-size:30px;font-weight:800;letter-spacing:6px;margin:16px 0">${code}</p>
    <p style="color:#64748b;font-size:13px">Nếu không phải bạn, hãy đổi mật khẩu và không chia sẻ mã này cho bất kỳ ai.</p>
  </div>`;
  return sendCustomEmail(email, 'Mã xác nhận giao dịch JOY', html);
}
