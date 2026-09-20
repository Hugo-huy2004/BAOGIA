/**
 * Thu hồi JOY theo chính sách bình ổn.
 *
 * MẶC ĐỊNH LÀ MÔ PHỎNG. Không có cờ `--execute` thì script này không ghi một bản
 * ghi nào — nó chỉ in ra bảng "ai mất bao nhiêu". Đó là chủ ý: đây là thao tác
 * không hoàn tác được trên tiền của người khác, nên đường mặc định phải là đường
 * an toàn, và chạy thật phải là một hành động có ý thức.
 *
 * Xem trước (theo nguồn — cách nên dùng):
 *   node server/scripts/joy-recall.mjs --sources=stock_sell,stock_dividend \
 *        --offsets=stock_buy --ratio=1
 *
 * Xem trước (cào đều — phạt cả người không liên quan, cân nhắc kỹ):
 *   node server/scripts/joy-recall.mjs --ratio=0.1 --keep=1000
 *
 * Chạy thật:
 *   node server/scripts/joy-recall.mjs --sources=stock_sell --ratio=1 \
 *        --execute --reason="Thu hồi JOY sinh từ sàn ảo đã gỡ"
 */
import mongoose from 'mongoose';
import process from 'node:process';
import readline from 'node:readline/promises';
import { plan, execute } from '../services/joyRecallService.js';
import { JOY_SOURCES } from '../utils/joySources.js';

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};
const has = (name) => process.argv.includes(`--${name}`);

const sources = String(arg('sources', '')).split(',').map((x) => x.trim()).filter(Boolean);
const ratio = Number(arg('ratio', 1));
const keepFloor = Number(arg('keep', 0));
const offsets = String(arg('offsets', '')).split(',').map((x) => x.trim()).filter(Boolean);
const reason = String(arg('reason', ''));
const doExecute = has('execute');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Thiếu MONGODB_URI.');
  process.exit(1);
}

const n = (v) => Number(v || 0).toLocaleString('vi-VN');

await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });

const result = await plan({ sources, ratio, keepFloor, offsets });

console.log('\n' + '='.repeat(72));
console.log('KẾ HOẠCH THU HỒI JOY' + (doExecute ? '' : '  ·  MÔ PHỎNG, CHƯA GHI GÌ'));
console.log('='.repeat(72));
const MODE_LABEL = {
  'by-source-net': 'theo NGUỒN, trừ phần đã bỏ ra (LÃI RÒNG)',
  'by-source-gross': 'theo NGUỒN, tính trên TỔNG THU',
  flat: 'CÀO ĐỀU trên số dư',
};
console.log(`Chế độ:     ${MODE_LABEL[result.mode]}`);
if (result.mode === 'by-source-gross') {
  console.log('            ⚠️  Tính trên tổng thu — nếu hoạt động này có phần người dùng');
  console.log('               BỎ RA (mua vào, đặt cược), hãy thêm --offsets=... để thu');
  console.log('               đúng phần lãi ròng, đừng lấy luôn vốn của họ.');
}
if (offsets.length) {
  console.log('Trừ đối ứng:');
  for (const o of offsets) console.log(`  · ${o.padEnd(24)} ${JOY_SOURCES[o] || '(nguồn lạ!)'}`);
}
if (sources.length) {
  console.log('Nguồn:');
  for (const s of sources) console.log(`  · ${s.padEnd(24)} ${JOY_SOURCES[s] || '(nguồn lạ!)'}`);
}
console.log(`Tỷ lệ:      ${(ratio * 100).toFixed(0)}%`);
console.log(`Chừa lại:   ${n(keepFloor)} JOY mỗi ví`);
console.log('');
console.log(`Số ví bị ảnh hưởng: ${n(result.affected)}`);
console.log(`Tổng thu hồi:       ${n(result.totalRecall)} JOY`);

if (!result.items.length) {
  console.log('\nKhông có ví nào cần thu hồi. Dừng.\n');
  await mongoose.disconnect();
  process.exit(0);
}

console.log('\n' + '-'.repeat(72));
console.log(`  ${'người'.padEnd(26)}${'số dư'.padStart(12)}${'thu hồi'.padStart(12)}${'còn lại'.padStart(12)}`);
console.log('-'.repeat(72));
for (const i of result.items) {
  console.log(`  ${String(i.displayName).slice(0, 24).padEnd(26)}${n(i.balanceBefore).padStart(12)}${('-' + n(i.amount)).padStart(12)}${n(i.balanceAfter).padStart(12)}`);
}
console.log('-'.repeat(72));

if (!doExecute) {
  console.log('\nĐây mới là MÔ PHỎNG — chưa ai bị trừ JOY.');
  console.log('Muốn chạy thật, thêm:  --execute --reason="lý do cụ thể"\n');
  await mongoose.disconnect();
  process.exit(0);
}

if (!reason.trim()) {
  console.error('\n❌ Chạy thật bắt buộc có --reason="…". Lý do được ghi vào từng dòng sổ cái\n' +
                '   và hiện trong thông báo gửi tới người bị trừ.\n');
  await mongoose.disconnect();
  process.exit(1);
}

// Hỏi lại bằng tay. Một cờ `--execute` gõ nhầm trong lịch sử shell không được
// đủ để trừ tiền của người khác.
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log('');
const answer = await rl.question(
  `Gõ đúng chữ  THU HOI  để trừ ${n(result.totalRecall)} JOY của ${n(result.affected)} ví: `,
);
rl.close();

if (answer.trim() !== 'THU HOI') {
  console.log('\nĐã huỷ. Không có gì bị thay đổi.\n');
  await mongoose.disconnect();
  process.exit(0);
}

const done = await execute(result, { confirm: true, reason, by: 'cli' });

console.log('\n' + '='.repeat(72));
console.log(`ĐÃ THU HỒI  ·  mã đợt ${done.code}`);
console.log('='.repeat(72));
console.log(`Thành công: ${n(done.done)} ví, tổng ${n(done.recalled)} JOY`);
if (done.failed.length) {
  console.log(`\nKhông trừ được ${done.failed.length} ví:`);
  for (const f of done.failed) console.log(`  · ${f.email}: ${f.error}`);
}
console.log(`\nTra lại đợt này bất cứ lúc nào bằng mã ${done.code} (refId trong JoyLedger).\n`);

await mongoose.disconnect();
