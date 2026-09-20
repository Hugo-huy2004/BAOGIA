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
} from '../../shared/tierFinance.js';
import { limitFor, assess } from '../../shared/joyCredit.js';
import { TRANSFER_MONTHLY_CAP } from '../../shared/joyPrices.js';

let failed = 0;
const check = (ok, label) => { console.log(`${ok ? '✅' : '❌'} ${label}`); if (!ok) failed++; };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
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
check(limitFor(100, 99999, 99999, 'star14') === 0,
  'điểm tuyệt đối + thu nhập khổng lồ, Star-14 VẪN 0 — khoá là khoá');
check(assess({ tier: 'star14', medianDailyIncome: 9999, balance: 99999, accountDays: 999, activeDays: 999, appsUsed: 9, surveysAnswered: 9, loansRepaid: 9 }).limit === 0,
  'đi qua assess() cũng vẫn 0');
check(!isCreditLocked('eco') && !isCreditLocked('star18') && !isCreditLocked('starVip'),
  'ba hạng người lớn đều vay được');

// ── 4. HẠNG LÀ HỆ SỐ NHÂN, KHÔNG PHẢI TRẦN ──────────────────────────────────
// Đây là quyết định sản phẩm: với một cái TRẦN, gần như mọi Star-18 chạm trần
// ngay và không còn lý do gì để dùng đều hay trả đúng hạn.
const at = (tier, income) => limitFor(80, income, 0, tier);
check(at('star18', 500) > at('eco', 500), 'Star-18 được nhiều hơn Eco ở cùng thu nhập');
check(at('starVip', 500) > at('star18', 500), 'Star-VIP được nhiều hơn Star-18');
check(at('eco', 1000) > at('eco', 500),
  'CÙNG một hạng, thu nhập cao hơn → hạn mức cao hơn (nếu không, hệ số đã thành trần)');
check(at('star18', 1000) > at('star18', 500), 'Star-18 cũng vậy — hệ xét hằng tuần còn ý nghĩa');
check(at('eco', 0) === 0, 'không thu nhập → 0 dù hạng nào');

// Trần cứng phải áp SAU khi nhân, nếu không hệ số ×3 vượt qua giới hạn hệ thống.
const { CREDIT } = await import('../../shared/joyCredit.js');
check(limitFor(100, 999999, 999999, 'starVip') <= CREDIT.hardCap,
  `hệ số ×${creditMultiplierOf('starVip')} vẫn không vượt trần cứng ${CREDIT.hardCap}`);

// ── 5. TRẦN THÁNG DÙNG CHUNG ────────────────────────────────────────────────
for (const [tier, f] of Object.entries(TIER_FINANCE)) {
  check(f.dailyTransferCap * 30 > TRANSFER_MONTHLY_CAP,
    `${tier}: trần ngày × 30 vẫn lớn hơn trần tháng — nếu không, trần tháng vô nghĩa`);
}

// ── 6. CHỮ TRÊN MÀN HÌNH PHẢI SINH RA, KHÔNG VIẾT TAY ───────────────────────
// Phần quan trọng nhất của tệp này. Một con số gõ tay quay lại đây là mâu thuẫn
// tái diễn, và lần sau sẽ lại không ai biết cho tới khi người dùng phát hiện.
const privileges = read('src/components/member/wallet/TierPrivilegesSection.jsx');
check(privileges.includes('financeBenefit('),
  'dòng đặc quyền tài chính được SINH từ shared/tierFinance.js');
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
  ['src/components/member/account/memberDocs.js', [
    'không bao giờ phát sinh lãi',
    'Hạn mức theo hạng thẻ',
    '5,000 JOY / ngày',
  ]],
  ['src/components/member/account/memberDocs.en.js', [
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

// Và phải NÓI RÕ điều đang thực sự xảy ra.
const viDocs = read('src/components/member/account/memberDocs.js');
check(/150%/.test(viDocs) && /10%\/năm/.test(viDocs),
  'quy chế tiếng Việt nêu đúng hai trần lãi theo luật');
check(/45 ngày khoá tài khoản|khoá tài khoản 30 ngày/.test(viDocs),
  'quy chế tiếng Việt nói rõ có biện pháp khoá tài khoản');
const enDocs = read('src/components/member/account/memberDocs.en.js');
check(/150%/.test(enDocs) && /10% per year/.test(enDocs), 'quy chế tiếng Anh nêu đúng hai trần lãi');

// ── 8. ĐƯỜNG TIỀN THỰC SỰ ĐỌC HẠNG ─────────────────────────────────────────
// Trước đây `memberTier()` chỉ được dùng để phát quà sinh nhật; mọi lời hứa tài
// chính đều không có nơi nào thi hành.
const routes = read('server/routes/joyRoutes.js');
check(routes.includes('transferFeeRateOf('), 'đường chuyển JOY đọc phí THEO HẠNG');
check(routes.includes('dailyTransferCapOf('), 'đường chuyển JOY đọc trần ngày THEO HẠNG');
check(!/const TRANSFER_FEE_RATE\s*=/.test(routes),
  'hằng số phí dùng chung đã được gỡ khỏi đường chuyển tiền (nếu còn, dễ bị dùng nhầm lại)');
const credit = read('shared/joyCredit.js');
check(credit.includes('creditMultiplierOf('), 'phép tính hạn mức đọc hệ số THEO HẠNG');

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
