/**
 * Soát nền kinh tế JOY — CHỈ ĐỌC, không sửa một bản ghi nào.
 *
 * Vì sao phải có bộ này trước mọi thay đổi: đề xuất "thu hồi X%" hay "phát hành
 * Y JOY mỗi tuần" mà không có số liệu thật thì chỉ là con số bịa. Bộ này trả lời
 * bốn câu, và mọi quyết định bình ổn sau đó phải dựa vào chúng:
 *
 *   1. Đang lưu hành bao nhiêu JOY, và nằm trong tay ai?
 *   2. Nguồn nào BƠM nhiều nhất, nguồn nào THU về?
 *   3. Tốc độ phát hành mỗi tuần đang tăng hay giảm?
 *   4. Có dấu hiệu lạm dụng giữa người dùng với nhau không?
 *
 * Chạy:  node server/scripts/joy-audit.mjs
 *        node server/scripts/joy-audit.mjs --weeks=12 --top=30
 *        node server/scripts/joy-audit.mjs --json > audit.json
 */
import mongoose from 'mongoose';
import process from 'node:process';
import JoyLedger from '../models/JoyLedger.js';
import Bio from '../models/Bio.js';
import {
  JOY_INVESTMENT_SOURCES,
  JOY_SOURCES,
  JOY_TRANSFER_SOURCES,
  reconcileJoyTransfers,
} from '../utils/joySources.js';

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};
const WEEKS = Number(arg('weeks', 8));
const TOP = Number(arg('top', 20));
const AS_JSON = process.argv.includes('--json');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Thiếu MONGODB_URI. Chạy: MONGODB_URI=... node server/scripts/joy-audit.mjs');
  process.exit(1);
}

const n = (v) => Number(v || 0).toLocaleString('vi-VN');
const pct = (part, whole) => (whole ? `${((part / whole) * 100).toFixed(1)}%` : '—');

await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });

// ── 1. JOY ĐANG LƯU HÀNH ─────────────────────────────────────────────────────
// Lấy từ Bio.joyBalance (số dư thật) chứ không cộng dồn sổ cái: sổ có thể thiếu
// bản ghi cũ, còn số dư là thứ người dùng đang thực sự cầm.
const [holders, ledgerCount] = await Promise.all([
  Bio.find({ joyBalance: { $gt: 0 } }, 'email displayName joyBalance createdAt').lean(),
  JoyLedger.estimatedDocumentCount(),
]);
const totalMembers = await Bio.estimatedDocumentCount();
const circulating = holders.reduce((s, b) => s + (b.joyBalance || 0), 0);
const sorted = [...holders].sort((a, b) => (b.joyBalance || 0) - (a.joyBalance || 0));

// Phân vị: trung vị nói lên "người bình thường có bao nhiêu", trung bình thì bị
// vài tài khoản khổng lồ kéo lệch.
const at = (p) => sorted.length ? (sorted[Math.floor((sorted.length - 1) * p)]?.joyBalance || 0) : 0;
const median = at(0.5);
const p90 = at(0.1);   // sorted giảm dần → 10% đầu là nhóm giàu nhất
const p99 = at(0.01);

// Mức tập trung: bao nhiêu % JOY nằm trong tay 1% và 10% người giữ nhiều nhất.
const share = (frac) => {
  const k = Math.max(1, Math.ceil(sorted.length * frac));
  return sorted.slice(0, k).reduce((s, b) => s + (b.joyBalance || 0), 0);
};

// ── 2. NGUỒN BƠM / THU ───────────────────────────────────────────────────────
const bySource = await JoyLedger.aggregate([
  { $group: {
    _id: '$source',
    inflow:  { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
    outflow: { $sum: { $cond: [{ $lt: ['$amount', 0] }, '$amount', 0] } },
    count:   { $sum: 1 },
    people:  { $addToSet: '$email' },
  } },
  { $project: { inflow: 1, outflow: 1, count: 1, people: { $size: '$people' } } },
  { $sort: { inflow: -1 } },
]);
const NON_UTILITY_SOURCES = new Set([
  ...JOY_TRANSFER_SOURCES,
  ...JOY_INVESTMENT_SOURCES,
  'admin_adjustment', 'admin_direct_add', 'admin_telegram_button',
  'joy_recall', 'joylater_open',
]);
const utilityBySource = bySource.filter((r) => !NON_UTILITY_SOURCES.has(r._id));
const investmentBySource = bySource.filter((r) => JOY_INVESTMENT_SOURCES.has(r._id));
const totalIn = utilityBySource.reduce((s, r) => s + r.inflow, 0);
const totalOut = utilityBySource.reduce((s, r) => s + Math.abs(r.outflow), 0);
const investmentIn = investmentBySource.reduce((s, r) => s + r.inflow, 0);
const investmentOut = investmentBySource.reduce((s, r) => s + Math.abs(r.outflow), 0);

// ── 3. TỐC ĐỘ PHÁT HÀNH THEO TUẦN ────────────────────────────────────────────
const since = new Date(Date.now() - WEEKS * 7 * 24 * 3600 * 1000);
const weekly = await JoyLedger.aggregate([
  { $match: { createdAt: { $gte: since }, source: { $nin: [...NON_UTILITY_SOURCES] } } },
  { $group: {
    _id: { $dateTrunc: { date: '$createdAt', unit: 'week', startOfWeek: 'monday' } },
    inflow:  { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
    outflow: { $sum: { $cond: [{ $lt: ['$amount', 0] }, '$amount', 0] } },
    actors:  { $addToSet: '$email' },
  } },
  { $project: { inflow: 1, outflow: 1, actors: { $size: '$actors' } } },
  { $sort: { _id: 1 } },
]);

// ── 4. CHUYỂN GIỮA NGƯỜI DÙNG (dấu hiệu lạm dụng) ────────────────────────────
const transfers = await JoyLedger.aggregate([
  { $match: { source: { $in: [...JOY_TRANSFER_SOURCES] }, createdAt: { $gte: since } } },
  { $group: {
    _id: '$email',
    sent:     { $sum: { $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0] } },
    received: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
    moves:    { $sum: 1 },
  } },
  { $sort: { sent: -1 } },
  { $limit: TOP },
]);
const transferPairs = await JoyLedger.aggregate([
  { $match: { source: { $in: [...JOY_TRANSFER_SOURCES] }, createdAt: { $gte: since } } },
  { $group: {
    _id: { $cond: [{ $and: [{ $ne: ['$refId', ''] }, { $ne: ['$refId', null] }] }, '$refId', { $concat: ['legacy:', { $toString: '$_id' }] }] },
    sentGross: { $sum: { $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0] } },
    received: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
    rows: { $sum: 1 },
  } },
]);
const transferCheck = reconcileJoyTransfers(transferPairs);

const report = {
  asOf: new Date().toISOString(),
  windowWeeks: WEEKS,
  circulating,
  totalMembers,
  holders: holders.length,
  ledgerRows: ledgerCount,
  median, p90, p99,
  top1Share: share(0.01),
  top10Share: share(0.10),
  totalIn, totalOut,
  bySource: utilityBySource,
  investment: { inflow: investmentIn, outflow: investmentOut, bySource: investmentBySource },
  weekly,
  transfers,
  transferMoved: transferCheck.moved,
  transferFees: transferCheck.fees,
  transferMismatch: transferCheck.mismatch,
  transferCount: transferPairs.length,
  unmatchedTransfers: transferCheck.unmatched,
  topHolders: sorted.slice(0, TOP).map((b) => ({
    displayName: b.displayName || b.email?.split('@')[0],
    joyBalance: b.joyBalance,
    joinedAt: b.createdAt,
  })),
};

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
  process.exit(0);
}

const line = (c = '─') => console.log(c.repeat(74));

console.log('\nSOÁT NỀN KINH TẾ JOY — chỉ đọc, không sửa gì');
console.log(`Thời điểm: ${new Date().toLocaleString('vi-VN')} · cửa sổ ${WEEKS} tuần\n`);

line('═');
console.log('1. ĐANG LƯU HÀNH');
line();
console.log(`  Tổng JOY trong ví người dùng     ${n(circulating)}`);
console.log(`  Số tài khoản có JOY               ${n(holders.length)} / ${n(totalMembers)} thành viên (${pct(holders.length, totalMembers)})`);
console.log(`  Dòng sổ cái                       ${n(ledgerCount)}`);
console.log('');
console.log(`  Trung vị (người bình thường)      ${n(median)}`);
console.log(`  Ngưỡng nhóm 10% cao nhất          ${n(p90)}`);
console.log(`  Ngưỡng nhóm 1% cao nhất           ${n(p99)}`);
console.log(`  Trung bình                        ${n(Math.round(circulating / (holders.length || 1)))}  ← lệch nếu cách xa trung vị`);
console.log('');
console.log(`  1% giữ nhiều nhất nắm             ${n(report.top1Share)}  (${pct(report.top1Share, circulating)} tổng lưu hành)`);
console.log(`  10% giữ nhiều nhất nắm            ${n(report.top10Share)}  (${pct(report.top10Share, circulating)} tổng lưu hành)`);

console.log(`\n  ${TOP} ví lớn nhất:`);
report.topHolders.forEach((h, i) => {
  console.log(`    ${String(i + 1).padStart(3)}. ${String(h.displayName).slice(0, 28).padEnd(30)} ${n(h.joyBalance).padStart(12)}`);
});

line('═');
console.log('\n2. KINH TẾ TIỆN ÍCH  (đã loại đầu tư ảo, chuyển tay và điều chỉnh admin)');
line();
console.log(`  ${'nguồn'.padEnd(30)}${'bơm vào'.padStart(13)}${'thu về'.padStart(13)}${'lượt'.padStart(8)}${'người'.padStart(7)}`);
line('·');
for (const r of utilityBySource.slice(0, 25)) {
  const label = (JOY_SOURCES[r._id] || r._id).slice(0, 28);
  console.log(`  ${label.padEnd(30)}${n(r.inflow).padStart(13)}${n(Math.abs(r.outflow)).padStart(13)}${n(r.count).padStart(8)}${n(r.people).padStart(7)}`);
}
line('·');
console.log(`  ${'TỔNG'.padEnd(30)}${n(totalIn).padStart(13)}${n(totalOut).padStart(13)}`);
console.log(`\n  Tỷ lệ thu về / bơm vào: ${pct(totalOut, totalIn)}`);
console.log('  → Dưới 100% nghĩa là hệ thống phát ra nhiều hơn thu lại, tức JOY nở ra theo thời gian.');

console.log('\n  ĐẦU TƯ ẢO — chỉ theo dõi, không dùng để quyết định kích cầu tiện ích');
console.log(`  Dòng vào ví từ đầu tư: ${n(investmentIn)} JOY`);
console.log(`  Dòng ra ví vào đầu tư: ${n(investmentOut)} JOY`);

line('═');
console.log(`\n3. TỐC ĐỘ THEO TUẦN (${WEEKS} tuần gần nhất)`);
line();
console.log(`  ${'tuần bắt đầu'.padEnd(16)}${'bơm vào'.padStart(13)}${'thu về'.padStart(13)}${'ròng'.padStart(13)}${'người'.padStart(8)}`);
line('·');
for (const w of weekly) {
  const net = w.inflow + w.outflow;
  const d = new Date(w._id).toLocaleDateString('vi-VN');
  console.log(`  ${d.padEnd(16)}${n(w.inflow).padStart(13)}${n(Math.abs(w.outflow)).padStart(13)}${n(net).padStart(13)}${n(w.actors).padStart(8)}`);
}

line('═');
console.log(`\n4. CHUYỂN GIỮA NGƯỜI DÙNG (${WEEKS} tuần) — chỗ dễ bị lạm dụng nhất`);
line();
console.log(`  Tổng JOY đã chuyển tay: ${n(report.transferMoved)} qua ${n(report.transferCount)} lượt`);
console.log(`  Phí chuyển đã thu: ${n(report.transferFees)} JOY`);
console.log(`  Chênh sổ cần đối soát: ${n(report.transferMismatch)} JOY`);
console.log(`  Chiếm ${pct(report.transferMoved, circulating)} lượng đang lưu hành\n`);
if (report.unmatchedTransfers.length) {
  console.log('  Giao dịch thiếu một vế:');
  for (const pair of report.unmatchedTransfers) {
    console.log(`    ${pair._id}: gửi ${n(pair.sentGross)} · nhận ${n(pair.received)}`);
  }
  console.log('');
}
console.log(`  ${'người gửi'.padEnd(26)}${'đã gửi'.padStart(12)}${'đã nhận'.padStart(12)}${'lượt'.padStart(7)}`);
line('·');
for (const t of transfers) {
  console.log(`  ${String(t._id).split('@')[0].slice(0, 24).padEnd(26)}${n(t.sent).padStart(12)}${n(t.received).padStart(12)}${n(t.moves).padStart(7)}`);
}

line('═');
console.log('\nĐỌC BẢNG NÀY THẾ NÀO');
line();
console.log('  · Trung vị cách xa trung bình  → JOY dồn vào ít người, không phải phân bố đều.');
console.log('  · Thu về / bơm vào dưới 100%   → kinh tế TIỆN ÍCH đang nở; đầu tư ảo không chen vào tỷ lệ này.');
console.log('  · Cột "ròng" theo tuần dương đều → tốc độ phát hành đang vượt tốc độ tiêu.');
console.log('  · Một người gửi lớn hơn hẳn phần còn lại → xem kỹ trước khi kết luận lạm dụng:');
console.log('    có thể là admin, tài khoản thử, hoặc một sự kiện tặng quà.');
console.log(report.transferMismatch > 0
  ? '\n  ĐANG KHÓA KÍCH CẦU: phải đối soát đủ hai vế chuyển thành viên trước.\n'
  : '\n  Sổ chuyển thành viên cân. Có thể dùng báo cáo tiện ích để quyết định kích cầu.\n');

await mongoose.disconnect();
