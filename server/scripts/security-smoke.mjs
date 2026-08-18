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
import SecurityBlock from '../models/SecurityBlock.js';
import SecurityEvent from '../models/SecurityEvent.js';
import {
  recordSecurityViolation,
  findActiveSecurityBlock,
  revokeSecurityBlock,
} from '../services/securityEnforcement.js';

const EMAIL = 'security-smoke@example.invalid';
const IP = '203.0.113.77'; // dải TEST-NET-3, không thuộc về ai
const req = { ip: IP, originalUrl: '/api/security-smoke', headers: {} };

let failed = 0;
const check = (ok, label) => {
  console.log(`${ok ? '✅' : '❌'} ${label}`);
  if (!ok) failed++;
};

async function cleanup() {
  await SecurityBlock.deleteMany({ reasonCode: 'security_smoke' });
  await SecurityEvent.deleteMany({ email: EMAIL });
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
    phone: '0900000000',
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

  await cleanup();
  const leftovers = await SecurityBlock.countDocuments({ reasonCode: 'security_smoke' });
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
