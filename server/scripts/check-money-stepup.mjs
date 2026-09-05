// Soát cổng xác thực 2 lớp cho tiền — KHÔNG cần DB, KHÔNG cần mạng.
//
// Đây là biên chặn giữa "ai đó cầm được phiên đăng nhập" và "ví bị rút sạch".
// Một nhánh sai ở đây là một lỗ hổng tiền thật, nên nó phải có test chạy được
// đứng một mình trước mỗi lần đụng vào moneyStepUp.js.
import bcrypt from 'bcryptjs';
import { checkMoneyStepUp, stepUpThreshold } from '../services/moneyStepUp.js';
import { holdDecision } from '../services/transferHold.js';

let failed = 0;
const check = (ok, label) => { console.log(`${ok ? '✅' : '❌'} ${label}`); if (!ok) failed++; };

const PIN = '135790';
const pinHash = bcrypt.hashSync(PIN, 8);
const T = stepUpThreshold();
const bioNoPin = (email = 'a@x.vn') => ({ email, transactionPin: null });
const bioPin = (email = 'a@x.vn') => ({ email, transactionPin: pinHash });

// Dưới ngưỡng: chưa cài PIN thì cho qua (giữ hành vi cũ).
check((await checkMoneyStepUp({ senderBio: bioNoPin(), amountBaseJoy: T - 1 })).ok,
  `dưới ngưỡng + không PIN → cho qua`);
// Dưới ngưỡng: đã cài PIN thì vẫn phải đúng PIN.
check((await checkMoneyStepUp({ senderBio: bioPin(), amountBaseJoy: T - 1, pin: 'x' })).code === 'PIN_WRONG',
  `dưới ngưỡng + PIN sai → PIN_WRONG`);
check((await checkMoneyStepUp({ senderBio: bioPin(), amountBaseJoy: T - 1, pin: PIN })).ok,
  `dưới ngưỡng + PIN đúng → cho qua`);

// Từ ngưỡng lên: chưa cài PIN → buộc cài.
check((await checkMoneyStepUp({ senderBio: bioNoPin('b@x.vn'), amountBaseJoy: T })).code === 'PIN_SETUP_REQUIRED',
  `≥ ngưỡng + chưa có PIN → PIN_SETUP_REQUIRED`);
// Từ ngưỡng lên: có PIN nhưng không nhập → đòi PIN.
check((await checkMoneyStepUp({ senderBio: bioPin('c@x.vn'), amountBaseJoy: T })).code === 'PIN_REQUIRED',
  `≥ ngưỡng + thiếu PIN → PIN_REQUIRED`);

// Khoá thử-sai: 5 lần sai liên tiếp → PIN_LOCKED (chống dò PIN 6 số).
const victim = 'lock@x.vn';
for (let i = 0; i < 5; i++) await checkMoneyStepUp({ senderBio: bioPin(victim), amountBaseJoy: T, pin: 'wrong' });
check((await checkMoneyStepUp({ senderBio: bioPin(victim), amountBaseJoy: T, pin: PIN })).code === 'PIN_LOCKED',
  `≥ ngưỡng + sai PIN 5 lần → PIN_LOCKED (kể cả sau đó nhập đúng)`);

// Email KHÔNG gửi được (SendGrid tắt): bỏ qua OTP, PIN đúng là xong.
delete process.env.SENDGRID_API_KEY;
check((await checkMoneyStepUp({ senderBio: bioPin('d@x.vn'), amountBaseJoy: T, pin: PIN })).ok,
  `≥ ngưỡng + PIN đúng + email TẮT → cho qua (không treo chờ OTP)`);

// Email GỬI ĐƯỢC: PIN đúng nhưng chưa có OTP → OTP_SENT; nhập đúng OTP → qua.
process.env.SENDGRID_API_KEY = 'SG.real-key-for-test';
let captured = '';
const sendOtp = async (_email, code) => { captured = code; };
const r1 = await checkMoneyStepUp({ senderBio: bioPin('e@x.vn'), amountBaseJoy: T, pin: PIN, sendOtp });
check(r1.code === 'OTP_SENT', `≥ ngưỡng + PIN đúng + email BẬT → OTP_SENT`);
check(/^\d{6}$/.test(captured), `OTP là mã 6 số đã gửi đi (${captured})`);
const r2 = await checkMoneyStepUp({ senderBio: bioPin('e@x.vn'), amountBaseJoy: T, pin: PIN, otp: captured, sendOtp });
check(r2.ok, `≥ ngưỡng + PIN đúng + OTP đúng → cho qua`);
const r3 = await checkMoneyStepUp({ senderBio: bioPin('f@x.vn'), amountBaseJoy: T, pin: PIN, otp: '000000', sendOtp });
check(r3.code === 'OTP_WRONG', `≥ ngưỡng + OTP sai → OTP_WRONG`);

// ─── Giữ giao dịch đáng ngờ (quyết định thuần, không cần DB) ──────────────────
const H = 20000; // ngưỡng giữ mặc định
check(holdDecision(H - 1, 999999, { threshold: H }).hold === false, 'giữ: dưới ngưỡng → không giữ dù lạ');
check(holdDecision(H, 0, { threshold: H }).hold === true, 'giữ: ≥ ngưỡng + lần đầu chuyển lớn (chưa có lịch sử) → giữ');
check(holdDecision(H * 5, 30000, { threshold: H, spike: 3 }).hold === true, 'giữ: ≥ ngưỡng + gấp >3× mức cũ → giữ');
check(holdDecision(H, 50000, { threshold: H, spike: 3 }).hold === false, 'giữ: ≥ ngưỡng nhưng vẫn trong tầm quen thuộc → cho đi');
check(holdDecision(H, 10000, { threshold: 0 }).hold === false, 'giữ: tắt bằng ngưỡng 0 → không bao giờ giữ');

console.log(failed ? `\n❌ ${failed} mục KHÔNG đạt` : `\n✅ Cổng xác thực tiền đạt (ngưỡng ${T} JOY)`);
process.exit(failed ? 1 : 0);
