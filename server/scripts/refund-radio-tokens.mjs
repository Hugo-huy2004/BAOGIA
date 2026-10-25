// Hoàn JOY cho token HugoRadio đã mua mà chưa nghe hết.
//
//   node server/scripts/refund-radio-tokens.mjs        → chỉ LIỆT KÊ, không sửa
//   node server/scripts/refund-radio-tokens.mjs --yes  → hoàn thật
//
// Radio miễn phí từ 25/10/2026 (gộp vào app Chuyên Chú), nên phần phút đã mua
// còn lại trong `Bio.radioTokens.purchasedMinutes` không còn dùng vào đâu. Hoàn
// đúng giá lúc mua: 1 token = 10 phút = JOY_SINK_PRICES.utility, cộng cả 10% phí
// sáng tạo đã thu (calcExchangeTotal), tính theo tỉ lệ phút còn lại.
//
// Chạy lại không hoàn hai lần: số phút được đưa về 0 bằng lệnh có điều kiện
// TRƯỚC khi cộng JOY. Nếu bước cộng lỗi, script in email để admin cộng tay.
import 'dotenv/config';
import mongoose from 'mongoose';
import Bio from '../models/Bio.js';
import { awardJoy } from '../utils/joyService.js';
import { calcExchangeTotal } from '../utils/featureSubscriptionService.js';
import { JOY_SINK_PRICES } from '../../shared/joyPrices.js';

const MINUTES_PER_TOKEN = 10;
const apply = process.argv.includes('--yes');

const refundFor = (minutes) => (minutes > 0
  ? calcExchangeTotal(Math.round((minutes / MINUTES_PER_TOKEN) * JOY_SINK_PRICES.utility)).total
  : 0);

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error('Thiếu MONGODB_URI (server/.env).');
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);

const holders = await Bio.find({ 'radioTokens.purchasedMinutes': { $gt: 0 } })
  .select('email radioTokens.purchasedMinutes')
  .lean();

let total = 0;
console.log(`Cơ sở dữ liệu: ${mongoose.connection.name}`);
console.log(`Người còn token đã mua: ${holders.length}\n`);
for (const bio of holders) {
  const minutes = bio.radioTokens.purchasedMinutes;
  const joy = refundFor(minutes);
  total += joy;
  console.log(`${bio.email.padEnd(36)} ${String(minutes).padStart(7)} phút  →  ${joy} JOY`);
}
console.log(`\nTổng hoàn: ${total} JOY`);

if (!holders.length || !apply) {
  if (holders.length) console.log('(chưa sửa gì — chạy lại kèm --yes để hoàn)');
} else {
  const failed = [];
  for (const bio of holders) {
    const minutes = bio.radioTokens.purchasedMinutes;
    const claimed = await Bio.updateOne(
      { _id: bio._id, 'radioTokens.purchasedMinutes': minutes },
      { $set: { 'radioTokens.purchasedMinutes': 0 } },
    );
    if (!claimed.modifiedCount) continue;
    try {
      await awardJoy(
        bio.email,
        refundFor(minutes),
        'admin_adjustment',
        `Hoàn ${minutes} phút HugoRadio đã mua — Radio nay miễn phí trong app Chuyên Chú`,
        { rawAmount: true },
      );
    } catch (error) {
      failed.push(`${bio.email} (${refundFor(minutes)} JOY): ${error.message}`);
    }
  }
  console.log(failed.length ? `\nLỖI — cộng tay cho:\n${failed.join('\n')}` : '\nĐã hoàn xong.');
}

await mongoose.disconnect();
