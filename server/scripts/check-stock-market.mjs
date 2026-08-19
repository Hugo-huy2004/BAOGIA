#!/usr/bin/env node
// Kiểm tra toán tiền của sàn ảo. Chạy: node server/scripts/check-stock-market.mjs
//
// Đây là app DẠY đầu tư: nếu con số lãi/lỗ trên màn hình sai thì người học sẽ
// mang cái sai đó ra sàn thật. Bài kiểm tra bám đúng những công thức được dạy
// trong app.
import assert from 'node:assert/strict';
import {
  COMPANIES, TRADING_FEE_RATE, MIN_FEE, CREATIVE_FEE_RATE, STOCK_QUOTE_CODE,
  tradingFee, nextPrice, positionPL, applyBuy, applySell, tradeCosts,
  sessionKey, sessionStart, SESSION_HOURS_VN, tidyHistory,
} from '../services/stockMarket.js';
import { buildTicks, priceAt, breakEvenPct, MAX_SEGMENT_MOVE, SEGMENT_SEC } from '../../shared/stockPricing.js';
import { CROSS_DENOM_FEE, JOY_DENOMS, BASE_DENOM } from '../../shared/joyCurrency.js';

// ── Bốn công ty, mỗi mã một hồ sơ rủi ro khác nhau ───────────────────────────
assert.equal(COMPANIES.length, 8);
const bySymbol = Object.fromEntries(COMPANIES.map((c) => [c.symbol, c]));
assert.ok(bySymbol.HARC.volatility > bySymbol.HFILM.volatility, 'Arcade phải biến động mạnh hơn Film');
assert.ok(bySymbol.HBANK.volatility < bySymbol.HFILM.volatility, 'Bank phải là mã ổn định nhất');
assert.ok(bySymbol.HBANK.dividendRate > 0, 'chỉ Bank trả cổ tức');
assert.equal(bySymbol.HARC.dividendRate, 0);

// ── Phí giao dịch ────────────────────────────────────────────────────────────
assert.equal(tradingFee(10000), 50, '0,5% của 10.000 JOY');
assert.equal(tradingFee(50), MIN_FEE, 'lệnh nhỏ vẫn chịu phí tối thiểu');
assert.equal(TRADING_FEE_RATE, 0.005);

// ── Giá chạy theo "làm tốt hơn kỳ vọng", không phải theo may rủi ─────────────
const flat = nextPrice({ price: 100, basePrice: 100, volatility: 0.05, activity: 100, average: 100 });
assert.equal(flat.price, 100, 'hoạt động đúng bằng kỳ vọng thì giá đứng yên');
assert.equal(flat.surprise, 0);

const good = nextPrice({ price: 100, basePrice: 100, volatility: 0.05, activity: 150, average: 100 });
assert.ok(good.price > 100, 'làm tốt hơn kỳ vọng thì giá lên');
assert.equal(good.surprise, 0.5);
assert.equal(good.price, 102.5, 'lên đúng surprise × volatility = 50% × 5% = 2,5%');

const bad = nextPrice({ price: 100, basePrice: 100, volatility: 0.05, activity: 50, average: 100 });
assert.ok(bad.price < 100, 'kém hơn kỳ vọng thì giá xuống');
assert.equal(bad.price, 97.5);

// Cùng một tin tốt, mã biến động mạnh chạy xa hơn — đúng bài học rủi ro/lợi nhuận.
const wild = nextPrice({ price: 100, basePrice: 100, volatility: 0.09, activity: 150, average: 100 });
assert.ok(wild.price > good.price, 'cùng tin tốt, mã beta cao phải chạy mạnh hơn');

// Trần ±10% một phiên và sàn giá tuyệt đối.
const crazy = nextPrice({ price: 100, basePrice: 100, volatility: 5, activity: 1e9, average: 1 });
assert.ok(crazy.price <= 110.0001, 'một phiên không vượt +10%');
const crash = nextPrice({ price: 21, basePrice: 100, volatility: 5, activity: 0, average: 1000 });
assert.ok(crash.price >= 20, 'giá không rơi dưới 20% giá niêm yết đầu');

// ── Giá vốn bình quân ────────────────────────────────────────────────────────
let position = { quantity: 0, avgCost: 0 };
position = { ...position, ...applyBuy(position, 10, 100) };
assert.deepEqual(position, { quantity: 10, avgCost: 100 });
position = { ...position, ...applyBuy(position, 10, 200) };
assert.equal(position.avgCost, 150, 'mua 10 giá 100 rồi 10 giá 200 ⇒ giá vốn 150');

// ── Lãi/lỗ đang nắm giữ ──────────────────────────────────────────────────────
const up = positionPL(position, 180);
assert.equal(up.cost, 3000);
assert.equal(up.value, 3600);
assert.equal(up.unrealized, 600, 'lãi = (180 − 150) × 20');
assert.equal(up.unrealizedPct, 0.2, 'lãi 20% so với vốn bỏ ra');

const down = positionPL(position, 120);
assert.equal(down.unrealized, -600);
assert.equal(down.unrealizedPct, -0.2);

// ── Bán và lãi/lỗ đã chốt ────────────────────────────────────────────────────
const fee = tradingFee(180 * 10);
const sold = applySell(position, 10, 180, fee);
assert.equal(sold.quantity, 10, 'bán 10 trong 20 thì còn 10');
assert.equal(sold.avgCost, 150, 'giá vốn phần còn lại không đổi khi bán bớt');
assert.equal(sold.realizedPL, 300 - fee, 'lãi chốt = (180 − 150) × 10 trừ phí');
assert.equal(sold.proceeds, 1800 - fee, 'tiền về ví = giá bán × số lượng trừ phí');

// Bán hết thì giá vốn về 0 để lần mua sau bắt đầu lại từ đầu.
const cleared = applySell({ quantity: 10, avgCost: 150 }, 10, 120, tradingFee(1200));
assert.equal(cleared.quantity, 0);
assert.equal(cleared.avgCost, 0);
assert.ok(cleared.realizedPL < 0, 'bán dưới giá vốn là lỗ đã chốt');

// Mua rồi bán ngay ở CÙNG một giá vẫn lỗ đúng bằng hai lần phí — bài học đắt
// nhất của người mới lướt sóng.
const buyFee = tradingFee(100 * 10);
const roundTrip = applySell({ quantity: 10, avgCost: 100 }, 10, 100, tradingFee(100 * 10));
assert.equal(roundTrip.realizedPL, -buyFee, 'mua bán cùng giá thì lỗ đúng bằng phí');

// ── Niêm yết bằng đơn vị gốc tiếng Anh + ba loại phí ─────────────────────────
assert.equal(STOCK_QUOTE_CODE, JOY_DENOMS[BASE_DENOM].code, 'sàn niêm yết bằng đơn vị gốc (Kavo)');

// SÀN CHỈ THU PHÍ MÔI GIỚI. Hai khoản từng chồng lên mỗi lệnh đã bỏ: phí sáng
// tạo 5% (phí CHUYỂN JOY giữa hai người — mua cổ phiếu không chuyển cho ai) và
// phí đổi đơn vị 15% (thu cho một lần đổi tiền không hề xảy ra: đơn vị JOY chỉ
// là lớp hiển thị, sổ cái ghi JOY gốc từ đầu tới cuối). Hai khoản đó đẩy mốc
// hoà vốn của ví khác đơn vị lên 51,6% — sàn khi ấy dạy "đừng giao dịch".
assert.equal(CREATIVE_FEE_RATE, 0, 'lệnh cổ phiếu không phải một lần chuyển JOY');

const buyVi = tradeCosts({ price: 100, quantity: 10, side: 'buy', memberDenom: 'vi' });
const buyEn = tradeCosts({ price: 100, quantity: 10, side: 'buy', memberDenom: 'en' });
assert.equal(buyVi.gross, 1000);
assert.equal(buyVi.brokerage, 5, 'môi giới 0,5%');
assert.equal(buyVi.creativeFee, 0);
assert.equal(buyVi.conversionFee, 0, 'không đổi đơn vị nào cả thì không thu phí đổi');
assert.equal(buyVi.total, 1005, 'mua: trừ ví = giá trị + môi giới');

// ĐƠN VỊ VÍ KHÔNG CÒN LÀM LỆCH GIÁ. Trước đây cùng một lệnh, ví Luno trả 1205
// còn ví Kavo trả 1055 — cùng một cổ phiếu, hai cái giá, chỉ vì người dùng chọn
// đơn vị hiển thị khác. Đây là bài kiểm giữ cho chuyện đó không quay lại.
assert.equal(buyVi.total, buyEn.total, 'ví đơn vị nào cũng trả đúng một giá');
assert.equal(buyVi.fees, buyEn.fees);

// Bán: phí TRỪ vào tiền về ví, không cộng thêm.
const sellVi = tradeCosts({ price: 100, quantity: 10, side: 'sell', memberDenom: 'vi' });
assert.equal(sellVi.total, 1000 - sellVi.fees, 'bán: về ví = giá trị − phí');
assert.equal(sellVi.fees, buyVi.fees, 'cùng giá trị thì hai chiều chịu phí như nhau');

// MỐC HOÀ VỐN: mua trả gross×(1+f), bán nhận gross×(1−f) ⇒ giá phải tăng
// (1+f)/(1−f) − 1, KHÔNG phải "bằng tổng phí". Với f = 0,5% là ~1,01%.
const breakEven = breakEvenPct(false);
assert.ok(Math.abs(breakEven - 0.0101) < 0.0002, `mốc hoà vốn phải ~1,01%, đang là ${(breakEven * 100).toFixed(2)}%`);
assert.equal(breakEvenPct(true), breakEvenPct(false), 'mốc hoà vốn không được phụ thuộc đơn vị ví');
assert.ok(breakEven > 2 * TRADING_FEE_RATE, 'hoà vốn luôn cao hơn tổng phí thuần: bán ở giá vốn vẫn lỗ');

// Mua rồi bán ngay ở CÙNG một giá vẫn lỗ đúng hai lần phí — bài học lướt sóng.
assert.equal(sellVi.total - buyVi.total, -(buyVi.fees + sellVi.fees));

// ── Mỗi mã phải gắn một tín hiệu CÓ THẬT, không trùng nhau ──────────────────
const signals = COMPANIES.map((c) => c.signal);
assert.equal(new Set(signals).size, signals.length, 'hai công ty dùng chung một tín hiệu là hai công ty giả');
assert.equal(new Set(COMPANIES.map((c) => c.symbol)).size, COMPANIES.length);

// ── Biên độ phải ĐỦ MẠNH, và lâu lâu phải có phiên siêu ─────────────────────
// Bản trước dao động quá yếu: đo 500 phiên không ra nổi một phiên nào đỉnh
// vượt +30%, nên với phí giao dịch thì gần như không có cơ hội nào đáng học.
// Bài kiểm này canh cả HAI đầu: đủ sống động, mà mã "ổn định nhất" vẫn ổn định.
function sessionStats(company, sessions = 400) {
  const steps = 6 * 3600; // một phiên 6 giờ
  let big = 0; let deep = 0; const ranges = [];
  for (let i = 0; i < sessions; i += 1) {
    const { prices } = buildTicks({
      symbol: company.symbol, anchor: company.basePrice, basePrice: company.basePrice,
      volatility: company.volatility, seed: `kiemtra-${i}`, startSec: 0, nowSec: steps, limit: 1e6,
    });
    const hi = Math.max(...prices); const lo = Math.min(...prices);
    ranges.push((hi - lo) / lo);
    if (hi / company.basePrice - 1 >= 0.6) big += 1;
    if (lo / company.basePrice - 1 <= -0.4) deep += 1;
  }
  ranges.sort((a, b) => a - b);
  return { median: ranges[Math.floor(ranges.length / 2)], big: big / sessions, deep: deep / sessions };
}

const arc = sessionStats(bySymbol.HARC);
assert.ok(arc.median > 0.2, `HARC: biên độ phiên trung vị ${(arc.median * 100).toFixed(0)}% quá yếu`);
assert.ok(arc.big > 0.02, `HARC: phiên bùng nổ (đỉnh ≥ +60%) chỉ ${(arc.big * 100).toFixed(1)}% — quá hiếm`);
assert.ok(arc.deep > 0.02, `HARC: phiên sụp đổ (đáy ≤ −40%) chỉ ${(arc.deep * 100).toFixed(1)}% — quá hiếm`);
assert.ok(arc.big < 0.30 && arc.deep < 0.30, 'phiên siêu mà xảy ra suốt thì không còn là phiên siêu');

const bank = sessionStats(bySymbol.HBANK);
assert.ok(bank.median < arc.median, 'HBANK phải êm hơn HARC');
assert.equal(bank.big, 0, 'mã ngân hàng không được có phiên bùng nổ +60%');

// ── Đường giá trong phiên KHÔNG được là máy in JOY ───────────────────────────
// Máy chủ gửi xuống mốc của bước ĐANG chạy để client vẽ mượt, nên bước đó là
// phần duy nhất người dùng biết trước. Một bước phải nhỏ hơn phí khứ hồi rẻ
// nhất (2 × 0,5% + 2 × 5% = 11%), nếu không thì "biết trước" = lời chắc chắn.
const roundTripRate = 2 * (TRADING_FEE_RATE + CREATIVE_FEE_RATE);
assert.ok(
  MAX_SEGMENT_MOVE < roundTripRate,
  `trần một bước ${(MAX_SEGMENT_MOVE * 100).toFixed(2)}% phải nhỏ hơn phí khứ hồi ${(roundTripRate * 100).toFixed(2)}%`,
);
// Hạ phí thì PHẢI hạ trần một bước theo. Bỏ phí sáng tạo 5% mà quên chỗ này là
// lộ ra một cú tăng biết trước lớn hơn phí ⇒ mua-bán ăn chắc, in JOY.
assert.ok(MAX_SEGMENT_MOVE < roundTripRate * 0.75, 'trần một bước phải có biên an toàn dưới phí khứ hồi');

const walk = (over, seed = 'bí-mật-máy-chủ') => buildTicks({
  symbol: over.symbol, anchor: over.basePrice, basePrice: over.basePrice,
  volatility: over.volatility, seed, startSec: 0, nowSec: 8 * 3600, limit: 10000,
});

for (const company of COMPANIES) {
  const { prices } = walk(company);
  for (let i = 1; i < prices.length; i += 1) {
    const step = Math.abs(prices[i] - prices[i - 1]) / prices[i - 1];
    assert.ok(
      // +0,05%: giá làm tròn tới hai số lẻ nên bước sát trần lệch một chút.
      step <= MAX_SEGMENT_MOVE + 5e-4,
      `${company.symbol}: một bước nhảy ${(step * 100).toFixed(2)}% vượt trần ${(MAX_SEGMENT_MOVE * 100).toFixed(1)}%`,
    );
  }
  // Sàn/trần TUYỆT ĐỐI: công ty không phá sản và không hoá thành mặt trời.
  // Biên độ trong phiên thì cố ý rộng (xem "phiên siêu" ở trên), nhưng giá
  // không bao giờ được ra ngoài khoảng 0,2× – 5× giá niêm yết ban đầu.
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  assert.ok(lowest >= company.basePrice * 0.2 - 0.01, `${company.symbol}: thủng sàn giá`);
  assert.ok(highest <= company.basePrice * 5 + 0.01, `${company.symbol}: vượt trần giá`);
}

// Cùng hạt giống ⇒ cùng đường giá (khởi động lại máy chủ không làm giá nhảy).
assert.deepEqual(walk(COMPANIES[0]).prices, walk(COMPANIES[0]).prices);
// Khác hạt giống ⇒ khác đường giá. Đây là toàn bộ lý do sàn không đoán trước
// được: công thức thì ai cũng đọc được trong bundle, hạt giống thì không.
assert.notDeepEqual(walk(COMPANIES[0]).prices, walk(COMPANIES[0], 'hạt-giống-khác').prices);

// Mã biến động mạnh phải đi xa hơn mã ổn định — so trên NHIỀU hạt giống, đừng
// so trên một. Từ khi có "tâm trạng cả phiên", đúng một hạt giống có thể ném
// cho HBANK một phiên hoảng loạn và cho HARC một phiên đi ngang; so một mẫu là
// bài kiểm tra thỉnh thoảng đỏ mà không có gì hỏng cả.
const meanSpread = (c) => {
  let total = 0;
  for (let i = 0; i < 60; i += 1) {
    const { prices } = walk(c, `mau-${i}`);
    total += (Math.max(...prices) - Math.min(...prices)) / c.basePrice;
  }
  return total / 60;
};
assert.ok(meanSpread(bySymbol.HARC) > meanSpread(bySymbol.HBANK) * 1.5, 'HARC phải dao động mạnh hơn hẳn HBANK');
assert.ok(meanSpread(bySymbol.HSTYLE) > meanSpread(bySymbol.HARC), 'HSTYLE là mã đầu cơ mạnh nhất sàn');

// ── Giá nội suy: client và máy chủ đọc CÙNG một con số ───────────────────────
const ticks = { step: SEGMENT_SEC, start: 1000, prices: [100, 110] };
assert.ok(Math.abs(priceAt({ ticks }, 1000) - 100) < 0.2, 'đầu bước là mốc đầu');
assert.ok(Math.abs(priceAt({ ticks }, 1000 + SEGMENT_SEC / 2) - 105) < 0.2, 'giữa bước là trung điểm');
// Không có mốc nào thì rơi về giá chốt phiên, KHÔNG tự bịa một đường giá.
assert.equal(priceAt({ sessionPrice: 42 }, 1000), 42);

// ── Bán lệnh bé: tiền về ví không bao giờ ÂM ─────────────────────────────────
// Phí tối thiểu 1 JOY + 5% + 15% có thể vượt giá trị một lệnh vài JOY. Số âm ở
// đây đi thẳng vào awardJoy và TRỪ ví người vừa bán.
const dust = tradeCosts({ price: 1, quantity: 1, side: 'sell', memberDenom: 'vi' });
assert.ok(dust.total >= 0, 'bán lệnh bé không được trả về số tiền âm');

console.log('check-stock-market: đạt.');
