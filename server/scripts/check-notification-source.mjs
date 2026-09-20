// Soát "thông báo đến từ app nào" — KHÔNG cần DB, KHÔNG cần mạng.
//
// Yêu cầu: mọi thông báo phải cho biết nó phát sinh từ ĐÂU. Cách làm là suy app
// từ `source` của biến động JOY (utils/joySources.js → JOY_SOURCE_APP) thay vì
// bắt 14 nơi gọi notifyMember cùng nhớ truyền thêm một tham số.
//
// Bảng ánh xạ đó nối HAI danh sách sống độc lập nhau — nguồn JOY và danh mục
// app — nên nó là chỗ dễ mục ruỗng nhất: xoá một app hay đổi tên một nguồn là
// nhãn trỏ vào hư không, và hộp thư lặng lẽ hiện tên app không tồn tại.
//
// Chạy: npm run check:notification-source
import { JOY_SOURCES, JOY_SOURCE_KEYS, JOY_SOURCE_APP, appOfJoySource } from '../utils/joySources.js';
import { APP_REGISTRY, RETIRED_APP_IDS } from '../../shared/appRegistry.js';

let failed = 0;
const check = (ok, label) => { console.log(`${ok ? '✅' : '❌'} ${label}`); if (!ok) failed++; };

const liveAppIds = new Set(APP_REGISTRY.map((a) => a.id));
const retired = new Set(RETIRED_APP_IDS);

// ── 1. Mọi KHOÁ trong bảng phải là một nguồn JOY có thật ─────────────────────
const unknownSources = Object.keys(JOY_SOURCE_APP).filter((k) => !JOY_SOURCE_KEYS.includes(k));
check(unknownSources.length === 0,
  `mọi khoá đều là nguồn JOY có thật${unknownSources.length ? ` — sai: ${unknownSources.join(', ')}` : ''}`);

// ── 2. Mọi GIÁ TRỊ phải là một app có thật, chưa nghỉ hưu ────────────────────
const values = [...new Set(Object.values(JOY_SOURCE_APP))];
const unknownApps = values.filter((id) => !liveAppIds.has(id));
check(unknownApps.length === 0,
  `mọi app đích đều có trong appRegistry${unknownApps.length ? ` — sai: ${unknownApps.join(', ')}` : ''}`);

const retiredApps = values.filter((id) => retired.has(id));
check(retiredApps.length === 0,
  `không trỏ tới app đã nghỉ hưu${retiredApps.length ? ` — sai: ${retiredApps.join(', ')}` : ''}`);

// ── 3. Nguồn cấp HỆ THỐNG phải để trống, không gán bừa một app ───────────────
// Điểm danh, quà giới thiệu, admin điều chỉnh, chuyển giữa người dùng: không
// thuộc app nào. Gán đại cho chúng một app là nói dối người đọc về nơi phát sinh.
const SYSTEM_SOURCES = [
  'checkin', 'referral_referrer', 'referral_referee',
  'admin_adjustment', 'admin_direct_add', 'admin_voucher', 'admin_telegram_button',
  'member_transfer_in', 'member_transfer_out', 'joy_gift_sent', 'joy_gift_received',
  'gift_code', 'joy_recall',
];
for (const src of SYSTEM_SOURCES) {
  if (!JOY_SOURCE_KEYS.includes(src)) continue;   // nguồn có thể đã bị gỡ
  check(appOfJoySource(src) === '', `nguồn hệ thống "${src}" để trống nhãn app`);
}

// ── 4. Nguồn của một app CỤ THỂ thì phải có nhãn ─────────────────────────────
// Bắt trường hợp thêm tính năng mới cho app cũ mà quên khai: người dùng nhận JOY
// từ app đó nhưng hộp thư không nói được nó đến từ đâu.
const MUST_HAVE_APP = ['vocab_daily_goal', 'arcade_score', 'companion', 'focus_session', 'ide_learning'];
for (const src of MUST_HAVE_APP) {
  if (!JOY_SOURCE_KEYS.includes(src)) continue;
  check(appOfJoySource(src) !== '', `nguồn của app "${src}" có nhãn (${appOfJoySource(src) || 'TRỐNG'})`);
}

// ── 5. Nguồn lạ không được làm sập ───────────────────────────────────────────
check(appOfJoySource('nguon_khong_ton_tai') === '', 'nguồn lạ → trả chuỗi rỗng, không ném lỗi');
check(appOfJoySource(undefined) === '', 'nguồn undefined → trả chuỗi rỗng');

// ── 6. Báo cáo độ phủ ────────────────────────────────────────────────────────
const tagged = Object.keys(JOY_SOURCE_APP).length;
const total = JOY_SOURCE_KEYS.length;
console.log(`\n   Độ phủ: ${tagged}/${total} nguồn JOY đã gắn app (${Math.round((tagged / total) * 100)}%).`);
console.log('   Phần còn lại là nguồn cấp hệ thống — để trống là ĐÚNG, không phải thiếu sót.');

const untagged = JOY_SOURCE_KEYS.filter((k) => !JOY_SOURCE_APP[k] && !SYSTEM_SOURCES.includes(k));
if (untagged.length) {
  console.log(`\n   Chưa phân loại (${untagged.length}) — xem lại khi thêm tính năng:`);
  for (const k of untagged) console.log(`     · ${k.padEnd(28)} ${JOY_SOURCES[k] || ''}`);
}

console.log(failed
  ? `\n❌ Nhãn nguồn thông báo: ${failed} mục chưa đạt`
  : '\n✅ Nhãn nguồn thông báo đạt');
process.exit(failed ? 1 : 0);
