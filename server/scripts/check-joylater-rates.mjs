// Soát bộ máy lãi + hạn mức JOYlater. KHÔNG cần DB, KHÔNG cần mạng.
//
// Đây là tiền thật của người dùng trong một hệ có thật, và hai con số trong đây
// là TRẦN THEO LUẬT chứ không phải tham số tuỳ chỉnh. Loại hằng số đó vài tháng
// sau sẽ có người "chỉnh lên một chút" mà không nhớ vì sao nó ở đó — nên nó
// phải có một bài kiểm gọi đúng tên nó.
//
// Chạy: npm run check:joylater-rates
import {
  RATES, CYCLE_DAYS, weeklyRate, dailyRate, overdueDailyRate, lateInterestDailyRate,
  accrueStep, quote, cycleSchedule, clampCycles, garnish,
} from '../../shared/joyLaterRates.js';
import { WEIGHTS, CREDIT, scoreOf, limitFor, canApply, assess } from '../../shared/joyCredit.js';
import { splitPrincipal, allocate } from '../services/joyLaterAccrual.js';

let failed = 0;
const check = (ok, label) => { console.log(`${ok ? '✅' : '❌'} ${label}`); if (!ok) failed++; };

// ── 1. HAI TRẦN LUẬT ─────────────────────────────────────────────────────────
check(RATES.overdueMultiplier <= 1.5,
  `lãi quá hạn ≤ 150% lãi trong hạn (đang ${RATES.overdueMultiplier * 100}%) — BLDS 2015 đ.466`);
check(RATES.lateInterestAnnual <= 0.10,
  `lãi chậm trả lãi ≤ 10%/năm (đang ${RATES.lateInterestAnnual * 100}%) — BLDS 2015 đ.466`);
check(overdueDailyRate(0.02) === dailyRate(0.02) * 1.5, 'lãi quá hạn đúng bằng 150% lãi trong hạn');
check(Math.abs(lateInterestDailyRate() * 365 - 0.10) < 1e-9, 'lãi chậm trả quy năm đúng 10%');
check(CYCLE_DAYS === 7, 'một chu kỳ là một TUẦN');

// ── 2. LÃI TRONG HẠN CHẠY THEO SỨC KHOẺ ĐỒNG JOY ─────────────────────────────
check(weeklyRate(0.8) === RATES.weeklyBase, 'vùng cân bằng (thu hồi 80%) → mốc chuẩn');
check(weeklyRate(0.6) === RATES.weeklyBase && weeklyRate(1.1) === RATES.weeklyBase,
  'đúng hai biên 60% và 110% → vẫn mốc chuẩn, không nhích theo nhiễu');
check(weeklyRate(0.2) > RATES.weeklyBase, 'JOY đang nở → lãi TĂNG (hãm vay, kéo JOY về kho)');
check(weeklyRate(1.8) < RATES.weeklyBase, 'JOY đang co → lãi GIẢM');
check(weeklyRate(0) <= RATES.weeklyCeil && weeklyRate(99) >= RATES.weeklyFloor,
  'mọi đầu vào cực đoan vẫn nằm trong sàn–trần');
check(weeklyRate(null) === RATES.weeklyBase && weeklyRate(undefined) === RATES.weeklyBase,
  'chưa đủ dữ liệu → mốc chuẩn, KHÔNG đoán');
check(weeklyRate(NaN) === RATES.weeklyBase, 'NaN → mốc chuẩn, không ra NaN');
// Đơn điệu: JOY càng nở lãi càng cao, không có chỗ nào đảo chiều.
let prev = Infinity;
for (let r = 0; r <= 0.6; r += 0.05) {
  const rate = weeklyRate(r);
  if (rate > prev + 1e-9) { check(false, `thu hồi ${r.toFixed(2)} làm lãi đảo chiều`); break; }
  prev = rate;
}
check(true, 'lãi giảm đều khi tỷ lệ thu hồi tăng, không có bậc nhảy');

// ── 3. CỘNG LÃI BA TẦNG TÁCH RỜI ─────────────────────────────────────────────
const step = accrueStep({ principalInTerm: 7000, principalOverdue: 0, interestUnpaid: 0, days: 7, weekly: 0.02 });
check(step.inTerm === 140, 'gốc 7000 trong hạn, 1 tuần, lãi 2%/tuần → 140 (đúng 2%)');
check(step.overdue === 0 && step.onInterest === 0, 'không quá hạn → hai tầng phạt bằng 0');

const overdueStep = accrueStep({ principalInTerm: 0, principalOverdue: 7000, days: 7, weekly: 0.02 });
check(overdueStep.overdue === 210, 'gốc 7000 QUÁ HẠN, 1 tuần → 210 (đúng 150% của 140)');

const mixed = accrueStep({ principalInTerm: 1000, principalOverdue: 1000, interestUnpaid: 1000, days: 30, weekly: 0.02 });
check(mixed.total === mixed.inTerm + mixed.overdue + mixed.onInterest,
  'tổng đúng bằng ba tầng cộng lại, không có phần nào tính hai lần');
check(mixed.onInterest === Math.floor(1000 * (0.10 / 365) * 30),
  'lãi chậm trả tính trên LÃI chưa trả, theo đúng 10%/năm');

// Đây là bài kiểm chống lãi chồng lãi: nếu ai đó gộp cơ sở tính lại thành một,
// con số sẽ vọt lên và bài này bắt được.
const naive = Math.floor((1000 + 1000 + 1000) * dailyRate(0.02) * 1.5 * 30);
check(mixed.total < naive, 'KHÔNG gộp ba cơ sở rồi nhân một lần (đó là lãi chồng lãi)');

check(accrueStep({ days: 0, principalInTerm: 9999 }).total === 0, '0 ngày → không cộng gì');
check(accrueStep({ days: -5, principalInTerm: 9999 }).total === 0, 'số ngày âm → không cộng gì');
check(accrueStep({ principalInTerm: 0, principalOverdue: 0, interestUnpaid: 0, days: 999 }).total === 0,
  'không còn dư nợ → không sinh lãi dù bao lâu');
// Làm tròn phải nghiêng về phía người vay.
const tiny = accrueStep({ principalInTerm: 10, days: 1, weekly: 0.02 });
check(tiny.total === 0, 'lãi lẻ dưới 1 JOY → làm tròn XUỐNG, không thu khống của người vay');

// ── 4. BÁO GIÁ: TRẢ DẦN THÌ LÃI PHẢI GIẢM DẦN ────────────────────────────────
const q1 = quote(4000, 1, 0.02);
const q4 = quote(4000, 4, 0.02);
check(q1.interest === 80, 'vay 4000 trả 1 tuần → lãi 80');
check(q4.interest < q1.interest * 4,
  'chia 4 tuần KHÔNG phải trả gấp 4 lãi — gốc giảm dần thì lãi giảm theo');
check(q4.perCycle[0].interest > q4.perCycle[3].interest,
  'kỳ đầu lãi cao nhất, kỳ cuối thấp nhất (lãi bám vào gốc còn lại)');
check(q4.perCycle.reduce((s, c) => s + c.principal, 0) === 4000,
  'cộng gốc các kỳ lại đúng bằng số vay, không rơi rụng vì làm tròn');
check(q4.perCycle.reduce((s, c) => s + c.interest, 0) === q4.interest, 'cộng lãi các kỳ đúng bằng tổng lãi');
check(q4.weeklyPayment === q4.perCycle[0].total,
  'con số hiện lên là KỲ ĐẦU (kỳ nặng nhất), không phải trung bình cho dễ nhìn');
check(quote(0, 4, 0.02).total === 0, 'vay 0 → không lãi, không lỗi');
check(quote(100, 99, 0.02).cycles === 8, 'số kỳ lạ → quy về lựa chọn gần nhất');
check(clampCycles(3) === 2 || clampCycles(3) === 4, '3 kỳ → về lựa chọn gần nhất có thật');
check(RATES.cycleOptions.every((c) => clampCycles(c) === c), 'mọi lựa chọn hợp lệ giữ nguyên');

// ── 5. LỊCH KỲ CÁCH NHAU ĐÚNG MỘT TUẦN ───────────────────────────────────────
const opened = new Date('2026-09-20T10:00:00Z');
const sched = cycleSchedule(opened, 4);
check(sched.length === 4, 'chia 4 kỳ → 4 mốc');
check((sched[0] - opened) / 86400000 === 7, 'kỳ đầu đúng 7 ngày sau khi mở');
check((sched[3] - sched[2]) / 86400000 === 7, 'các kỳ cách nhau đúng 7 ngày');

// ── 6. TÁCH GỐC TRONG HẠN / QUÁ HẠN ──────────────────────────────────────────
const NOW = Date.UTC(2026, 8, 20);
const ago = (d) => new Date(NOW - d * 86400000);
const ahead = (d) => new Date(NOW + d * 86400000);

const loan = { principal: 4000, principalPaid: 0, dueAt: [ago(7), ahead(0), ahead(7), ahead(14)] };
const split = splitPrincipal(loan, NOW);
check(split.overdue === 1000, 'một kỳ trễ → đúng 1000 gốc quá hạn, không phải cả 4000');
check(split.inTerm === 3000,
  'các kỳ CHƯA tới lượt vẫn trong hạn — không phạt cả phần chưa đến hạn vì một kỳ trễ');
check(split.inTerm + split.overdue === split.remaining, 'hai phần cộng lại đúng bằng dư nợ gốc');

check(splitPrincipal({ ...loan, principalPaid: 1000 }, NOW).overdue === 0,
  'đã trả đủ kỳ trễ → hết quá hạn');
check(splitPrincipal({ ...loan, principalPaid: 4000 }, NOW).remaining === 0, 'trả hết gốc → không còn gì');
check(splitPrincipal({ principal: 1000, principalPaid: 0, dueAt: [] }, NOW).inTerm === 1000,
  'chưa có lịch kỳ → coi như trong hạn, không phạt oan');

// ── 7. CẤN LÃI TRƯỚC, GỐC SAU ────────────────────────────────────────────────
const owing = { principal: 1000, principalPaid: 0, interestAccrued: 120, interestPaid: 0 };
check(allocate(50, owing).toInterest === 50 && allocate(50, owing).toPrincipal === 0,
  'hoàn ít hơn lãi → vào lãi hết, gốc chưa giảm');
check(allocate(200, owing).toInterest === 120 && allocate(200, owing).toPrincipal === 80,
  'hoàn nhiều hơn lãi → phủ hết lãi rồi mới tới gốc');
check(allocate(99999, owing).applied === 1120, 'hoàn thừa → chỉ cấn đúng số đang nợ, không nhận dư');
check(allocate(0, owing).applied === 0, 'hoàn 0 → không cấn gì');
check(allocate(-50, owing).applied === 0, 'số âm → không cấn gì, không đảo dấu');

// ── 8. GIỮ LẠI TỪ THU NHẬP ───────────────────────────────────────────────────
check(garnish(100, 1000) === 40, `giữ ${RATES.garnishRate * 100}% mỗi lần nhận JOY`);
check(garnish(100, 10) === 10, 'không bao giờ giữ quá số còn nợ');
check(garnish(100, 0) === 0 && garnish(0, 100) === 0, 'không nợ hoặc không thu nhập → không giữ');
check(RATES.garnishRate < 0.5, 'giữ dưới một nửa — trả nợ không được biến thành chơi mà không nhận gì');

// ── 9. HẠN MỨC ───────────────────────────────────────────────────────────────
check(Object.values(WEIGHTS).reduce((a, b) => a + b, 0) === 100, 'bốn cột điểm cộng lại đúng 100');

const rich = { accountDays: 200, activeDays: 90, appsUsed: 7, surveysAnswered: 6,
  medianDailyIncome: 250, medianDailySpend: 50, balance: 6000, loansRepaid: 3 };
check(assess(rich).approved, 'người chơi đều, để dành, đã trả xong 3 lượt → được duyệt');

// Đây là điểm mấu chốt của cả bộ chấm: thu nhập GỘP lớn nhưng tiêu gần hết thì
// khả năng trả nợ gần bằng 0, và bản cũ ("5 ngày thu nhập") cấp hạn mức rất cao
// cho đúng người này.
const churner = { ...rich, medianDailyIncome: 250, medianDailySpend: 245, balance: 0, loansRepaid: 0 };
check(!assess(churner).approved,
  'kiếm nhiều nhưng tiêu gần hết → KHÔNG duyệt (thu nhập RÒNG mới là nguồn trả)');

check(!assess({ ...rich, loansDefaulted: 1 }).approved,
  'đã từng quỵt → chặn cứng, không mua lại được bằng thu nhập cao');
check(assess({ ...rich, loansDefaulted: 1 }).reasons.includes('defaulted'), 'và nói rõ lý do');

check(limitFor(CREDIT.approveAt - 1, 500) === 0, 'dưới ngưỡng duyệt → hạn mức 0');
check(limitFor(100, 1000) <= CREDIT.hardCap, 'không vượt trần cứng dù điểm tuyệt đối');
check(limitFor(100, 500) > limitFor(CREDIT.approveAt, 500), 'điểm cao hơn → được vay nhiều ngày thu nhập hơn');
check(limitFor(100, 0, 0) === 0, 'điểm tuyệt đối mà KHÔNG có thu nhập → vẫn 0 (neo vào khả năng trả)');
check(limitFor(80, 1) === 0, `hạn mức dưới ${CREDIT.minUsefulLimit} → cấp 0, không cấp một hạn mức vô dụng`);
check(limitFor(80, 500) % CREDIT.roundTo === 0, `hạn mức luôn tròn ${CREDIT.roundTo}`);

check(!canApply({ isAdult: false, accountDays: 999, lifetimeEarned: 99999 }).ok, 'chưa đủ 18 tuổi → không nộp được');
check(canApply({ isAdult: true, accountDays: 999, lifetimeEarned: 99999 }).ok, 'đủ điều kiện → nộp được');
check(canApply({ isAdult: true, accountDays: 1, lifetimeEarned: 99999 }).reasons.includes('accountAge'),
  'tài khoản quá mới → nêu đúng lý do, không nói chung chung');

check(scoreOf({}).total === 0, 'hồ sơ rỗng → 0 điểm, không lỗi');
check(assess({}).limit === 0, 'hồ sơ rỗng → hạn mức 0');

console.log(failed
  ? `\n❌ Lãi & hạn mức JOYlater: ${failed} mục chưa đạt`
  : '\n✅ Lãi & hạn mức JOYlater đạt — ba tầng tách rời, hai trần luật còn nguyên');
process.exit(failed ? 1 : 0);
