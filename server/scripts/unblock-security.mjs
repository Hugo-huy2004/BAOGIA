// Gỡ lệnh chặn an ninh đang có hiệu lực.
//
//   node server/scripts/unblock-security.mjs           → chỉ LIỆT KÊ, không sửa
//   node server/scripts/unblock-security.mjs --yes      → gỡ toàn bộ
//   node server/scripts/unblock-security.mjs --yes --type=email
//
// Gỡ ở đây làm ĐÚNG như nút gỡ của admin (`revokeSecurityBlock`): kết thúc hiệu
// lực chứ KHÔNG xoá bản ghi — sổ kiểm toán phải giữ được, người vận hành cần
// biết đã từng có chuyện gì.
//
// Khác một điểm quan trọng: script này còn đưa `lockCount` về 0. Nút gỡ của
// admin không làm việc đó, nên một tài khoản từng bị khoá hai lần vẫn còn
// `lockCount = 2` — chỉ cần một sự cố nữa là leo thẳng lên khoá VĨNH VIỄN dù
// lệnh chặn cũ đã được gỡ. Gỡ mà để lại ngòi nổ thì chưa gọi là gỡ.
import 'dotenv/config';
import mongoose from 'mongoose';
import SecurityBlock from '../models/SecurityBlock.js';

const args = process.argv.slice(2);
const apply = args.includes('--yes');
const typeArg = args.find((a) => a.startsWith('--type='))?.split('=')[1] || '';

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error('Thiếu MONGODB_URI (server/.env).');
  process.exit(1);
}

const active = (block) => block.permanent
  || !block.expiresAt
  || new Date(block.expiresAt).getTime() > Date.now();

await mongoose.connect(MONGODB_URI);

const filter = typeArg ? { subjectType: typeArg } : {};
const all = await SecurityBlock.find(filter).lean();
const live = all.filter(active);

console.log(`Cơ sở dữ liệu: ${mongoose.connection.name}`);
console.log(`Tổng lệnh chặn: ${all.length} · đang có hiệu lực: ${live.length}\n`);

for (const block of live) {
  console.log([
    block.permanent ? 'VĨNH VIỄN' : 'tạm 30 ngày',
    block.subjectType.padEnd(5),
    `hash ${block.subjectHash.slice(0, 12)}…`,
    `lockCount=${block.lockCount}`,
    `lý do=${block.reasonCode}`,
    block.expiresAt ? `hết hạn ${new Date(block.expiresAt).toISOString().slice(0, 16)}` : '',
    block.lastCaseId ? `case ${block.lastCaseId}` : '',
  ].filter(Boolean).join('  '));
}

if (!live.length) {
  console.log('Không có lệnh chặn nào đang có hiệu lực.');
} else if (!apply) {
  console.log('\n(chưa sửa gì — chạy lại kèm --yes để gỡ)');
} else {
  const result = await SecurityBlock.updateMany(
    { _id: { $in: live.map((block) => block._id) } },
    { $set: { permanent: false, expiresAt: new Date(0), lockCount: 0, reasonCode: 'admin_revoked' } },
  );
  console.log(`\nĐã gỡ ${result.modifiedCount} lệnh chặn (giữ nguyên bản ghi để đối soát).`);
  console.log('Server đang chạy có bộ nhớ đệm 30 giây — chờ tới đó là truy cập lại được.');
}

await mongoose.disconnect();
