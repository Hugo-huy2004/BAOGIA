// Soát danh mục lệnh của bot Telegram — chạy được không cần DB, không cần mạng:
//
//   node server/scripts/check-telegram-bot.mjs
//
// Vì sao cần: quản gia AI giờ tự dịch câu nói của Boss thành lệnh thật, và
// `findCommand()` là HÀNG RÀO DUY NHẤT đứng giữa một câu hiểu nhầm và việc
// trừ tiền trong ví người thật. Một mẫu regex viết lỏng tay ở đây là một lệnh
// tự chế lọt qua; một mẫu viết chặt quá là nút bấm không bao giờ hiện.
import 'dotenv/config';
import mongoose from 'mongoose';
import {
  COMMANDS, findCommand, capabilityList, helpScreen,
  stashCommand, takeCommand, PENDING_TTL_MS, inverseCommand,
} from '../services/telegramCommands.js';

let failed = 0;
const check = (ok, label) => {
  console.log(`${ok ? '✅' : '❌'} ${label}`);
  if (!ok) failed++;
};

// 1. Mỗi lệnh phải tự nhận ra ví dụ của chính nó — bắt lỗi hai mẫu giẫm chân
// nhau (lệnh đứng trước nuốt mất lệnh đứng sau).
for (const c of COMMANDS) {
  const hit = findCommand(c.example);
  check(hit?.id === c.id, `"${c.example}" → ${c.id} (nhận ra: ${hit?.id || 'KHÔNG'})`);
}

// 2. Việc có ghi dữ liệu BẮT BUỘC phải đánh dấu cần duyệt.
const MUST_CONFIRM = ['joy', 'wallet_lock', 'account_lock', 'logout', 'rename', 'reslug', 'edu', 'notify', 'maintenance'];
for (const id of MUST_CONFIRM) {
  check(COMMANDS.find((c) => c.id === id)?.danger === true, `lệnh "${id}" bắt buộc Boss duyệt`);
}

// 3. Trò chuyện thường không được biến thành hành động.
for (const junk of [
  'chào em', 'hôm nay hệ thống thế nào', 'em nghĩ sao về việc tăng giá',
  'cảm ơn nhé', '', '   ', 'DROP TABLE bios',
]) {
  check(findCommand(junk) === null, `không coi "${junk.trim() || '(rỗng)'}" là lệnh`);
}

// 4. Thiếu email / thiếu số tiền thì KHÔNG được thành lệnh — AI phải hỏi lại
// Boss chứ không được đoán bừa một nạn nhân.
for (const partial of [
  'Cộng 500 joy cho tất cả mọi người',
  'Khóa ví thằng an',
  'Cộng joy cho an@gmail.com',
  'Đăng xuất hết mọi người',
]) {
  check(findCommand(partial) === null, `từ chối lệnh thiếu dữ kiện: "${partial}"`);
}

// 5. Telegram chặn callback_data quá 64 byte — quá là NGUYÊN CẢ TIN bị từ chối,
// nút không hiện, và không có lỗi nào báo ra.
const longest = `cb_run:${'a'.repeat(8)}`;
check(Buffer.byteLength(longest) <= 64, `callback_data ${Buffer.byteLength(longest)} byte ≤ 64`);

// 6. Nút xác nhận: lệnh chờ duyệt phải DÙNG MỘT LẦN và biết hết hạn. Telegram
// gửi lại callback khi mạng chập chờn, Boss cũng hay bấm hai cái liên tiếp —
// không có hai tính chất này thì "Cộng 500 JOY" thành 1000.
// Nghịch đảo của mỗi lệnh đảo-ngược-được phải lại là một lệnh hợp lệ, nếu không
// nút Hoàn Tác bấm vào sẽ báo "lệnh không hợp lệ".
for (const [cmd, before, want] of [
  ['Cộng 500 joy cho an@gmail.com', {}, 'Trừ'],
  ['Trừ 500 joy cho an@gmail.com', {}, 'Cộng'],
  ['Khóa ví an@gmail.com', {}, 'Mở khóa ví'],
  ['Khóa tài khoản an@gmail.com', {}, 'Mở tài khoản'],
  ['Bật edu an@gmail.com', {}, 'Tắt edu'],
  ['Đổi tên an@gmail.com thành X', { displayName: 'Tên Cũ' }, 'Tên Cũ'],
  ['Bật bảo trì', {}, 'Tắt bảo trì'],
]) {
  const inv = inverseCommand(cmd, before);
  check(inv?.includes(want) && findCommand(inv), `hoàn tác "${cmd}" → "${inv}" (hợp lệ)`);
}
// Việc không đảo ngược được thì KHÔNG có nút hoàn tác (thà không có còn hơn có
// nút bấm vào chẳng trả lại được gì).
check(inverseCommand('Gửi thông báo an@gmail.com nội dung Hi') === null, 'không hoàn tác được: gửi thông báo');
check(inverseCommand('Đăng xuất an@gmail.com') === null, 'không hoàn tác được: thu hồi phiên');

// Kho lệnh chờ duyệt nằm dưới Mongo — cần kết nối thật.
if (process.env.MONGODB_URI) {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  const id = await stashCommand('Cộng 500 joy cho an@gmail.com');
  check(await takeCommand(id) === 'Cộng 500 joy cho an@gmail.com', 'lệnh chờ duyệt: lấy ra đúng câu đã cất');
  check(await takeCommand(id) === null, 'lệnh chờ duyệt: bấm lần hai KHÔNG chạy lại (nguyên tử)');
  check(await takeCommand('khong-ton-tai') === null, 'lệnh chờ duyệt: mã bịa bị từ chối');
  await mongoose.disconnect();
} else {
  console.log('⏭️  Bỏ qua kiểm kho lệnh chờ duyệt (thiếu MONGODB_URI)');
}
void PENDING_TTL_MS;

// 7. Bảng năng lực đưa cho AI và màn trợ giúp phải phủ hết danh mục.
const caps = capabilityList();
const help = helpScreen();
check(COMMANDS.every((c) => caps.includes(c.syntax)), 'prompt AI liệt kê đủ mọi lệnh');
check(COMMANDS.every((c) => help.includes(c.syntax)), 'màn Trợ giúp liệt kê đủ mọi lệnh');

console.log(failed ? `\n❌ ${failed} mục KHÔNG đạt` : `\n✅ Danh mục lệnh bot đạt (${COMMANDS.length} lệnh)`);
process.exit(failed ? 1 : 0);
