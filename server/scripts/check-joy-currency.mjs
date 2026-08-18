#!/usr/bin/env node
// Kiểm tra toán tiền của lớp đơn vị JOY. Chạy: node server/scripts/check-joy-currency.mjs
//
// Đây là đường tiền: sai một hệ số là ví trừ khác màn hình. Bài kiểm tra bám
// đúng ba luật đã chốt:
//   1. Kavo (bản tiếng Anh) là ĐƠN VỊ CHUẨN — mọi tỷ giá quy về nó;
//   2. quy đổi luôn đi vòng qua JOY gốc, không nhân chéo hệ số đã làm tròn;
//   3. hoá đơn chuyển JOY phải mang theo tỷ giá đang chạy, và tổng trừ ví phải
//      khớp từng đồng với các khoản cộng lại.
import assert from 'node:assert/strict';
import {
  BASE_DENOM, JOY_DENOMS, CROSS_DENOM_FEE,
  setLiveFactors, factorOf, rateAgainstBase, convertDenom, toDenom, fromDenom, transferBreakdown,
} from '../../shared/joyCurrency.js';

// ── 1. Đơn vị chuẩn ──────────────────────────────────────────────────────────
setLiveFactors(null);
assert.equal(BASE_DENOM, 'en', 'đơn vị chuẩn là bản tiếng Anh');
assert.equal(JOY_DENOMS[BASE_DENOM].factor, 1, '1 Kavo = 1 JOY gốc');
assert.equal(rateAgainstBase(BASE_DENOM), 1, 'tỷ giá của chính đơn vị chuẩn luôn bằng 1');
assert.equal(rateAgainstBase('vi'), 25, '1 Kavo = 25 Mira theo hệ số nền');
assert.equal(rateAgainstBase('ko'), 1350, '1 Kavo = 1350 Luno theo hệ số nền');
for (const key of Object.keys(JOY_DENOMS)) {
  assert.ok(rateAgainstBase(key) >= 1, `mọi đơn vị phải niêm yết ≥ 1 so với đơn vị chuẩn (${key})`);
}

// ── 2. Tỷ giá sống thay được hệ số nền ───────────────────────────────────────
setLiveFactors({ en: 1, vi: 27.5, ko: 1300 });
assert.equal(factorOf('vi'), 27.5, 'hệ số sống được ưu tiên hơn hệ số nền');
assert.equal(rateAgainstBase('vi'), 27.5, 'bảng niêm yết chạy theo tỷ giá sống');
assert.equal(factorOf('ja'), JOY_DENOMS.ja.factor, 'đơn vị không có trong bảng sống thì về hệ số nền');

// 100 Mira ở tỷ giá 27.5 ≈ 3.64 JOY gốc → làm tròn 4 JOY → 4 Kavo.
assert.equal(fromDenom(100, 'vi'), 4);
assert.equal(convertDenom(100, 'vi', 'en'), 4);
assert.equal(convertDenom(1, 'en', 'vi'), 28, '1 Kavo quy về Mira theo tỷ giá sống (làm tròn)');

// ── 3. Hoá đơn chuyển JOY ────────────────────────────────────────────────────
const cross = transferBreakdown(1000, 'vi', 'ko', 0.05);
assert.equal(cross.sent, 1000);
assert.equal(cross.received, 1000, 'người nhận luôn nhận đủ số JOY gốc đã gửi');
assert.equal(cross.creativeFee, 50, 'phí sáng tạo 5% cộng thêm vào phần người gửi trả');
assert.equal(cross.conversionFee, Math.floor(1000 * CROSS_DENOM_FEE), 'phí đổi đơn vị khi khác đơn vị');
assert.equal(cross.totalDeducted, 1000 + 50 + 150, 'tổng trừ ví = gửi + phí sáng tạo + phí đổi');
assert.equal(cross.totalDeducted, cross.sent + cross.creativeFee + cross.conversionFee, 'không có đồng nào rơi ngoài hoá đơn');
assert.equal(cross.rate.base, JOY_DENOMS[BASE_DENOM].code, 'hoá đơn ghi rõ đơn vị chuẩn');
assert.equal(cross.rate.fromPerBase, 27.5, 'hoá đơn mang theo tỷ giá ĐANG CHẠY của bên gửi');
assert.equal(cross.rate.toPerBase, 1300, 'và của bên nhận');
assert.equal(cross.sentDisplay, toDenom(1000, 'vi').amount, 'số bên gửi nhìn thấy');
assert.equal(cross.receivedDisplay, toDenom(1000, 'ko').amount, 'số bên nhận nhìn thấy');

// Cùng đơn vị thì KHÔNG có phí đổi (es và fr dùng chung một mã nên cũng vậy).
const same = transferBreakdown(1000, 'es', 'fr', 0.05);
assert.equal(same.crossDenom, false, 'es và fr chung mã JOYve nên không tính là đổi đơn vị');
assert.equal(same.conversionFee, 0);
assert.equal(same.totalDeducted, 1050);

// Số âm hay rác không được biến thành tiền.
assert.equal(transferBreakdown(-500, 'vi', 'en', 0.05).sent, 0);
assert.equal(transferBreakdown('abc', 'vi', 'en', 0.05).totalDeducted, 0);

// ── 4. Luật biến động tỷ giá (hàm thuần, không chạm database) ────────────────
const { nextFactors, sessionKey, sessionStart, SESSION_EVERY_HOURS } = await import('../utils/joyRateService.js');

const baselines = Object.fromEntries(Object.entries(JOY_DENOMS).map(([k, d]) => [k, d.factor]));
const run = (opts) => nextFactors({ baselines, baseKey: BASE_DENOM, feeRate: CROSS_DENOM_FEE, ...opts });

// Đơn vị chuẩn KHÔNG BAO GIỜ trôi — nó là cái mốc đo mọi đồng còn lại.
const strong = run({ incomeByDenom: { vi: 1000, ko: 10, ja: 10, en: 10 }, feeShare: 0.4, netFlow: -0.3 });
assert.equal(strong.factors[BASE_DENOM], baselines[BASE_DENOM], 'hệ số đơn vị chuẩn luôn đứng yên');
assert.equal(strong.signals[BASE_DENOM].movement, 0, 'đơn vị chuẩn không nhận phần phí 15%');

// Luật 1: ví nhóm nào thu về nhiều JOY hơn thì đồng đó LÊN GIÁ = cần ít đơn vị
// hơn cho một JOY = hệ số GIẢM.
assert.ok(strong.factors.vi < baselines.vi, 'đồng có thu nhập cao phải lên giá (hệ số giảm)');
assert.ok(strong.signals.vi.income > 0, 'tín hiệu thu nhập của đồng đó phải dương');

// Luật 1b: tỷ lệ nghịch — một đồng mạnh lên thì các đồng khác yếu đi.
assert.ok(strong.signals.ko.income < 0, 'đồng thu nhập dưới trung bình phải yếu đi');
const incomeSum = Object.keys(baselines).reduce((sum, k) => sum + strong.signals[k].income, 0);
assert.ok(Math.abs(incomeSum) < 1e-9, `tổng tín hiệu thu nhập phải bằng 0, đang là ${incomeSum}`);

// Luật 2 + 3: lãi vay/phí và dòng JOY ra-vào đẩy TOÀN BỘ hệ số cùng chiều.
const calm = run({ incomeByDenom: {}, feeShare: 0, netFlow: 0 });
const feeHeavy = run({ incomeByDenom: {}, feeShare: 0.9, netFlow: 0 });
const inflowHeavy = run({ incomeByDenom: {}, feeShare: 0, netFlow: 0.9 });
for (const key of Object.keys(baselines)) {
  if (key === BASE_DENOM) continue;
  assert.ok(feeHeavy.factors[key] < calm.factors[key], `lãi vay + phí cao phải làm ${key} lên giá`);
  assert.ok(inflowHeavy.factors[key] < calm.factors[key], `bơm JOY vào nhiều phải kéo hệ số ${key}`);
}

// Luật 4: phần phí đổi 15% được cộng vào biến động của đồng KHÔNG phải đơn vị
// chuẩn. Lấy tín hiệu vừa phải để trần ±15% chưa cắt vào, mới thấy đúng công thức.
const mild = run({ incomeByDenom: {}, feeShare: 0.2, netFlow: 0 });
const expected = Math.round((((0 + 0.2 * 0.3 + 0) / 3) * (1 + CROSS_DENOM_FEE)) * 1e4) / 1e4;
assert.equal(mild.signals.vi.movement, expected, 'biến động = trung bình ba tín hiệu × (1 + 15%)');
// Còn tín hiệu cực đoan thì phải bị trần cắt đúng ở 15%.
const maxed = run({ incomeByDenom: { vi: 1e9, ko: 1 }, feeShare: 1, netFlow: 1 });
assert.equal(maxed.signals.vi.movement, 0.15, 'biến động một phiên không vượt trần ±15%');

// Trần biên độ ±15% quanh hệ số nền, dù tín hiệu có cực đoan tới đâu.
const extreme = run({ incomeByDenom: { vi: 1e9, ko: 1 }, feeShare: 1, netFlow: 1, previous: { vi: 1 } });
for (const key of Object.keys(baselines)) {
  assert.ok(extreme.factors[key] >= baselines[key] * 0.85 - 1e-9, `${key} không được rơi quá 15%`);
  assert.ok(extreme.factors[key] <= baselines[key] * 1.15 + 1e-9, `${key} không được vọt quá 15%`);
}

// ── 5. Mỗi giờ một phiên, mốc theo giờ Việt Nam ──────────────────────────────
assert.equal(SESSION_EVERY_HOURS, 1);
const at = (iso) => sessionKey(new Date(iso));
assert.equal(at('2026-08-18T02:30:00Z'), '2026-08-18-09', '09:30 giờ VN thuộc phiên 09:00');
assert.equal(at('2026-08-18T02:59:59Z'), '2026-08-18-09', 'còn trong giờ thì vẫn một phiên');
assert.equal(at('2026-08-18T03:00:00Z'), '2026-08-18-10', 'sang giờ mới là sang phiên mới');
assert.equal(at('2026-08-18T16:30:00Z'), '2026-08-18-23', '23:30 giờ VN');
// Qua nửa đêm giờ VN phải sang NGÀY MỚI, không được lùi về hôm trước.
assert.equal(at('2026-08-18T17:00:00Z'), '2026-08-19-00', '00:00 giờ VN 19/8 = 17:00 UTC 18/8');
assert.equal(at('2026-08-18T18:15:00Z'), '2026-08-19-01', '01:15 giờ VN 19/8');

// 24 phiên khác nhau trong một ngày — đây là mục đích của lần đổi này.
const keys = new Set();
for (let h = 0; h < 24; h += 1) keys.add(at(`2026-08-18T${String(h).padStart(2, '0')}:00:00Z`));
assert.equal(keys.size, 24, 'một ngày phải có đúng 24 phiên tỷ giá');

// Mốc bắt đầu phiên quy ngược về UTC đúng bằng −7 giờ.
assert.equal(sessionStart('2026-08-18-09').toISOString(), '2026-08-18T02:00:00.000Z', 'phiên 09:00 VN = 02:00 UTC');
assert.equal(sessionStart('2026-08-19-00').toISOString(), '2026-08-18T17:00:00.000Z', 'phiên 00:00 VN = 17:00 UTC hôm trước');
// Khoá phiên và mốc phiên phải là hai chiều của cùng một phép tính, nếu không
// biểu đồ tỷ giá vẽ mỗi điểm lệch một giờ so với lúc nó thật sự được chốt.
for (const key of ['2026-08-18-00', '2026-08-18-09', '2026-08-18-23']) {
  assert.equal(sessionKey(sessionStart(key)), key, `${key}: khoá ⇄ mốc phải khớp`);
}

setLiveFactors(null);
console.log('check-joy-currency: đạt.');
