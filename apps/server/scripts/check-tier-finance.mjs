// Soát đặc quyền tài chính theo hạng. KHÔNG cần DB, KHÔNG cần mạng.
//
// ── BỘ SOÁT NÀY SINH RA TỪ MỘT LỖI THẬT ──────────────────────────────────────
// Ngày 20/09/2026 phát hiện MƯỜI lời hứa sai cùng lúc: bảng đặc quyền hứa
// "Star-VIP miễn phí 0% phí chuyển", "Star-14 tối đa 500 JOY/ngày", "hạn mức vay
// 1.000/5.000/500 JOY"; quy chế ví hứa "tối đa 5.000 JOY/ngày" và "chậm hoàn
// không bao giờ phát sinh lãi, không bị phạt". Không dòng nào đúng, và câu cuối
// còn nói ngược hẳn một hệ thống có lãi quá hạn và khoá tài khoản.
//
// Không ai viết sai cả. Cái sai là CÓ HAI NGUỒN — chữ trên màn hình và hằng số
// trong mã — mà không có gì so chúng với nhau. Tệp này là thứ so chúng.
//
// Chạy: npm run check:tier-finance
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TIER_FINANCE, financeOf, financeFacts,
  creditMultiplierOf, transferFeeRateOf, dailyTransferCapOf, isCreditLocked,
} from '../../../packages/shared/tierFinance.js';
import { TRANSFER_MONTHLY_CAP } from '../../../packages/shared/joyPrices.js';

let failed = 0;
const check = (ok, label) => { console.log(`${ok ? '✅' : '❌'} ${label}`); if (!ok) failed++; };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const TIERS = Object.keys(TIER_FINANCE);

// ── 1. BẢNG HẰNG SỐ LÀNH LẶN ────────────────────────────────────────────────
check(TIERS.length === 4, `đủ bốn hạng (${TIERS.join(', ')})`);
for (const tier of TIERS) {
  const f = TIER_FINANCE[tier];
  check(Number.isFinite(f.creditMultiplier) && f.creditMultiplier >= 0, `${tier}: hệ số vay hợp lệ`);
  check(f.transferFeeRate >= 0 && f.transferFeeRate <= 0.2, `${tier}: phí chuyển trong khoảng hợp lý`);
  check(f.dailyTransferCap > 0, `${tier}: trần chuyển ngày dương`);
}
check(Object.isFrozen(TIER_FINANCE), 'bảng bị đóng băng — không sửa được lúc chạy');

// ── 2. HẠNG LẠ PHẢI RƠI VỀ HẠNG THẤP NHẤT ───────────────────────────────────
// Một lỗi chính tả trong tên hạng không được biến thành miễn phí trọn đời.
check(financeOf('khong_co_that') === TIER_FINANCE.eco, 'hạng lạ → Eco');
check(financeOf(undefined) === TIER_FINANCE.eco && financeOf(null) === TIER_FINANCE.eco,
  'thiếu hạng → Eco, không ném lỗi');
check(transferFeeRateOf('khong_co_that') > 0, 'hạng lạ KHÔNG được miễn phí');
check(creditMultiplierOf('khong_co_that') <= creditMultiplierOf('star18'),
  'hạng lạ KHÔNG được hệ số cao hơn hạng thật');

// ── 3. VỊ THÀNH NIÊN KHÔNG VAY ──────────────────────────────────────────────
check(isCreditLocked('star14'), 'Star-14 bị khoá vay — đây là luật, không phải nấc đặc quyền');
check(TIER_FINANCE.star14.creditMultiplier === 0, 'và hệ số của Star-14 là 0');
check(!isCreditLocked('eco') && !isCreditLocked('star18') && !isCreditLocked('starVip'),
  'ba hạng người lớn đều vay được');

// ── 5. TRẦN THÁNG DÙNG CHUNG ────────────────────────────────────────────────
for (const [tier, f] of Object.entries(TIER_FINANCE)) {
  check(f.dailyTransferCap * 30 > TRANSFER_MONTHLY_CAP,
    `${tier}: trần ngày × 30 vẫn lớn hơn trần tháng — nếu không, trần tháng vô nghĩa`);
}

// ── 6. CHỮ TRÊN MÀN HÌNH PHẢI SINH RA, KHÔNG VIẾT TAY ───────────────────────
// Phần quan trọng nhất của tệp này. Một con số gõ tay quay lại đây là mâu thuẫn
// tái diễn, và lần sau sẽ lại không ai biết cho tới khi người dùng phát hiện.
const privileges = read('apps/web/src/components/member/wallet/TierPrivilegesSection.jsx');
check(privileges.includes('financeBenefit('),
  'dòng đặc quyền tài chính được SINH từ packages/shared/tierFinance.js');
for (const tier of TIERS) {
  check(privileges.includes(`financeBenefit("${tier}")`), `${tier}: dùng hàm sinh, không phải chuỗi gõ tay`);
}

// Những con số cũ đã sai — không dòng nào trong tệp đó được phép chứa lại chúng.
const STALE = ['Hạn mức vay JOYlater 1.000', 'cao nhất 5.000 JOY', 'Hạn mức vay 500 JOY',
  'chuỗi điểm danh 30 ngày', 'ưu đãi 5%'];
for (const phrase of STALE) {
  check(!privileges.includes(phrase), `không còn con số viết tay cũ: "${phrase}"`);
}

// ── 7. QUY CHẾ VÍ KHÔNG ĐƯỢC NÓI NGƯỢC HỆ THỐNG ─────────────────────────────
// Câu "chậm hoàn không bao giờ phát sinh lãi và không bị phạt" từng nằm trong
// văn bản chính sách của cả hai ngôn ngữ, trong khi hệ thống tính lãi quá hạn
// và khoá tài khoản từ ngày 45. Đó là loại sai nguy hiểm nhất: người dùng đọc
// và tin vào nó.
const DOCS = [
  ['apps/web/src/components/member/account/memberDocs.js', [
    'không bao giờ phát sinh lãi',
    'Hạn mức theo hạng thẻ',
    '5,000 JOY / ngày',
  ]],
  ['apps/web/src/components/member/account/memberDocs.en.js', [
    'never incurs financial interest',
    'Tier-based credit allowance',
    'Up to 5,000 JOY / day',
  ]],
];
for (const [file, phrases] of DOCS) {
  const text = read(file);
  for (const phrase of phrases) {
    check(!text.includes(phrase), `${path.basename(file)}: đã gỡ câu sai "${phrase}"`);
  }
}

// JOYlater đã gỡ 31/10/2026: quy chế phải nói rõ là đã chấm dứt và xoá nợ.
check(/xoá|xóa/.test(read('apps/web/src/components/member/account/memberDocs.js')) && /written off/.test(read('apps/web/src/components/member/account/memberDocs.en.js')),
  'quy chế hai ngôn ngữ nói rõ JOYlater đã chấm dứt và xoá nợ');

// ── 8. ĐƯỜNG TIỀN THỰC SỰ ĐỌC HẠNG ─────────────────────────────────────────
// Trước đây `memberTier()` chỉ được dùng để phát quà sinh nhật; mọi lời hứa tài
// chính đều không có nơi nào thi hành.
// Route JOY đã tách theo miền: đọc mục lục + mọi tệp trong apps/server/routes/joy/.
const routes = [read('apps/server/routes/joyRoutes.js'), ...fs.readdirSync(path.join(ROOT, 'apps/server/routes/joy'))
  .filter((f) => f.endsWith('.js')).sort().map((f) => read(`apps/server/routes/joy/${f}`))].join('\n');
check(routes.includes('transferFeeRateOf('), 'đường chuyển JOY đọc phí THEO HẠNG');
check(routes.includes('dailyTransferCapOf('), 'đường chuyển JOY đọc trần ngày THEO HẠNG');
check(!/const TRANSFER_FEE_RATE\s*=/.test(routes),
  'hằng số phí dùng chung đã được gỡ khỏi đường chuyển tiền (nếu còn, dễ bị dùng nhầm lại)');

// ── 9. MẢNH CHỮ SINH RA ĐỌC ĐƯỢC ────────────────────────────────────────────
for (const tier of TIERS) {
  const f = financeFacts(tier);
  check(typeof f.feePercent === 'number' && f.dailyCap > 0, `${tier}: financeFacts trả về đủ mảnh để dựng câu`);
  check(f.feeFree === (transferFeeRateOf(tier) === 0), `${tier}: cờ miễn phí khớp với phí thật`);
  check(f.creditLocked === isCreditLocked(tier), `${tier}: cờ khoá vay khớp với hệ số`);
}

console.log(failed
  ? `\n❌ Đặc quyền tài chính theo hạng: ${failed} mục chưa đạt`
  : '\n✅ Đặc quyền tài chính theo hạng đạt — chữ sinh từ hằng số, đường tiền đọc đúng hạng');
process.exit(failed ? 1 : 0);
