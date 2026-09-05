// Chạy thử module an ninh trên dữ liệu thật — bằng một email giả rồi dọn sạch.
//
//   node server/scripts/security-smoke.mjs
//
// Vì sao cần: lỗi "$setOnInsert trùng trường" từng ẩn mình qua HAI lần sửa
// (`lockCount`, rồi `permanent`). Cả hai đều làm MongoDB từ chối nguyên lệnh,
// nghĩa là khoá TÀI KHOẢN và khoá VĨNH VIỄN ném 500 chứ chưa từng khoá được ai
// — mà không ai phát hiện, vì khoá theo IP đi nhánh khác nên vẫn chạy ngon.
// Repo không có bộ test tự động; đây là một lần chạy thật, chạy trước mỗi lần
// đụng vào securityEnforcement.js.
import 'dotenv/config';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import SecurityBlock from '../models/SecurityBlock.js';
import SecurityEvent from '../models/SecurityEvent.js';
import SecurityModeration from '../models/SecurityModeration.js';
import {
  recordSecurityViolation,
  findActiveSecurityBlock,
  revokeSecurityBlock,
  securityHash,
  verifiedActor,
  securityDigest,
} from '../services/securityEnforcement.js';

const EMAIL = 'security-smoke@example.invalid';
const IP = '203.0.113.77'; // dải TEST-NET-3, không thuộc về ai
const PHONE = '0900000000';
const req = { ip: IP, originalUrl: '/api/security-smoke', headers: {} };

let failed = 0;
const check = (ok, label) => {
  console.log(`${ok ? '✅' : '❌'} ${label}`);
  if (!ok) failed++;
};

// Dọn theo ĐÚNG khoá băm của đối tượng thử. Bản cũ xoá theo
// `reasonCode: 'security_smoke'` và `email: EMAIL` — hai trường mà
// recordSecurityViolation không bao giờ ghi (reasonCode = category, còn
// SecurityEvent chỉ lưu bản băm), nên mỗi lần chạy để lại rác: lockCount cộng
// dồn qua các lần và ba mục kiểm tra đầu tiên sai từ lần chạy thứ hai trở đi.
const SMOKE_KEYS = () => [
  `email:${securityHash('email', EMAIL)}`,
  `phone:${securityHash('phone', PHONE)}`,
  `ip:${securityHash('ip', IP)}`,
];

async function cleanup() {
  await SecurityBlock.deleteMany({ actorKey: { $in: SMOKE_KEYS() } });
  await SecurityEvent.deleteMany({ ruleId: 'security_smoke' });
  await SecurityModeration.deleteMany({ ruleId: 'security_smoke' });
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('Thiếu MONGODB_URI (server/.env).');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  await cleanup(); // lần chạy trước có thể đã chết giữa chừng

  const violation = {
    req,
    email: EMAIL,
    phone: PHONE,
    category: 'identity_fraud',
    severity: 'critical',
    ruleId: 'security_smoke',
    evidence: 'chạy thử tự động',
    enforcement: 'immediate',
  };

  // 1. Khoá tài khoản — nhánh countLock:true, nơi lỗi $inc từng ẩn.
  await recordSecurityViolation({ ...violation, reasonCode: 'security_smoke' });
  const first = await findActiveSecurityBlock({ email: EMAIL });
  check(Boolean(first), 'khoá tài khoản: tạo được lệnh chặn');
  check(first?.lockCount === 1, `khoá tài khoản: lockCount = 1 (thực tế ${first?.lockCount})`);
  check(Boolean(first?.expiresAt) && !first?.permanent, 'khoá tài khoản: có hạn 30 ngày, chưa vĩnh viễn');

  // 2. Khoá lần hai phải leo thang thành vĩnh viễn — nhánh `permanent` từng lỗi.
  await recordSecurityViolation({ ...violation, reasonCode: 'security_smoke' });
  const second = await findActiveSecurityBlock({ email: EMAIL });
  check(second?.permanent === true, 'tái phạm: leo thang thành khoá vĩnh viễn');
  check(second?.expiresAt == null, 'tái phạm: bỏ hạn 30 ngày');

  // 3. IP cũng phải bị chặn, và đây là nhánh countLock:false.
  const ipBlock = await findActiveSecurityBlock({ ip: IP });
  check(Boolean(ipBlock), 'khoá theo IP: tạo được lệnh chặn');

  // 4. Gỡ khoá phải thực sự mở lại đường vào.
  if (second?._id) await revokeSecurityBlock(second._id);
  const afterRevoke = await findActiveSecurityBlock({ email: EMAIL });
  check(!afterRevoke, 'gỡ khoá: tài khoản vào lại được');

  // 5. Vi phạm KHÔNG khoá ngay (nhánh chờ duyệt): 3 lần liên tiếp cùng đối
  // tượng chỉ được đẻ ĐÚNG MỘT thẻ duyệt + một tin Telegram. Máy quét internet
  // nện hàng chục đường dẫn/giây, không có chốt này là Boss ngập thông báo.
  for (let i = 0; i < 3; i++) {
    await recordSecurityViolation({
      ...violation,
      category: 'intrusion',
      ruleId: 'security_smoke',
      enforcement: 'threshold',
      req: { ...req, originalUrl: `/api/security-smoke/${i}` },
    });
  }
  const cards = await SecurityModeration.countDocuments({ ruleId: 'security_smoke' });
  const events = await SecurityEvent.countDocuments({ ruleId: 'security_smoke', category: 'intrusion' });
  check(cards === 1, `chống lụt: 3 vi phạm → 1 thẻ duyệt (thực tế ${cards})`);
  check(events === 3, `chống lụt: sổ SecurityEvent vẫn ghi đủ 3 lần (thực tế ${events})`);

  // 6. Khách lạ mò đường dẫn (máy quét dạo): ghi sổ nhưng TUYỆT ĐỐI không mở
  // thẻ duyệt — đây là 100% lượng tin rác Boss nhận trước đây.
  const before = await SecurityModeration.countDocuments({});
  await recordSecurityViolation({
    ...violation,
    email: '',
    phone: '',
    category: 'intrusion',
    ruleId: 'security_smoke',
    enforcement: 'threshold',
    notify: false,
    req: { ...req, originalUrl: '/api/security-smoke/.git/config' },
  });
  const silentEvent = await SecurityEvent.countDocuments({ ruleId: 'security_smoke', path: /\.git/ });
  check(silentEvent === 1, `khách lạ: vẫn ghi sổ đủ (thực tế ${silentEvent})`);
  check(
    (await SecurityModeration.countDocuments({})) === before,
    'khách lạ: KHÔNG mở thẻ duyệt, không bắn Telegram',
  );

  // 7. Token bịa không được coi là người đã đăng nhập — trước đây chuỗi
  // "Bearer " + 16 ký tự bất kỳ là đủ để đi vòng qua lệnh khoá IP.
  check(
    verifiedActor({ headers: { authorization: 'Bearer aaaaaaaaaaaaaaaaaaaa' } }) === null,
    'token bịa: bị từ chối, không gỡ được khoá IP',
  );
  const realToken = jwt.sign({ email: EMAIL, role: 'member' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  check(
    verifiedActor({ headers: { authorization: `Bearer ${realToken}` } })?.email === EMAIL,
    'token thật: nhận đúng danh tính',
  );
  check(
    verifiedActor({ headers: {}, cookies: { member_jwt: realToken } })?.email === EMAIL,
    'cookie member_jwt: nhận đúng danh tính',
  );

  console.log(`\n--- Thử bản tổng kết 24h gửi Telegram mỗi sáng ---\n${await securityDigest(24)}\n---`);

  await cleanup();
  const leftovers = await SecurityBlock.countDocuments({ actorKey: { $in: SMOKE_KEYS() } });
  check(leftovers === 0, 'dọn dẹp: không để lại bản ghi thử nghiệm');

  await mongoose.disconnect();
  console.log(failed ? `\n❌ ${failed} mục KHÔNG đạt` : '\n✅ Module an ninh chạy đúng');
  process.exit(failed ? 1 : 0);
}

main().catch(async (err) => {
  console.error('❌ Chạy thử đổ vỡ:', err.message);
  await cleanup().catch(() => {});
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
