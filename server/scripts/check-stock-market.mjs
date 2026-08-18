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
import { buildTicks, priceAt, MAX_SEGMENT_MOVE, SEGMENT_SEC } from '../../shared/stockPricing.js';
import { CROSS_DENOM_FEE, JOY_DENOMS, BASE_DENOM } from '../../shared/joyCurrency.js';

// ── Bốn công ty, mỗi mã một hồ sơ rủi ro khác nhau ───────────────────────────
assert.equal(COMPANIES.length, 4);
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

// Ví để ở đơn vị KHÁC ⇒ mỗi lệnh là một lần đổi tiền ⇒ chịu phí chuyển đổi.
const buyVi = tradeCosts({ price: 100, quantity: 10, side: 'buy', memberDenom: 'vi' });
assert.equal(buyVi.gross, 1000);
assert.equal(buyVi.brokerage, 5, 'môi giới 0,5%');
assert.equal(buyVi.creativeFee, Math.floor(1000 * CREATIVE_FEE_RATE), 'phí sáng tạo 5%');
assert.equal(buyVi.conversionFee, Math.floor(1000 * CROSS_DENOM_FEE), 'phí chuyển đổi 15%');
assert.equal(buyVi.crossDenom, true);
assert.equal(buyVi.total, 1000 + buyVi.brokerage + buyVi.creativeFee + buyVi.conversionFee, 'mua: trừ ví = giá trị + đủ ba phí');

// Ví ĐÃ ở đơn vị gốc ⇒ không có gì để đổi ⇒ miễn phí chuyển đổi.
const buyEn = tradeCosts({ price: 100, quantity: 10, side: 'buy', memberDenom: 'en' });
assert.equal(buyEn.conversionFee, 0, 'ví Kavo không phải trả phí chuyển đổi');
assert.equal(buyEn.crossDenom, false);
assert.ok(buyEn.total < buyVi.total, 'cùng lệnh, ví đơn vị gốc rẻ hơn ví đơn vị khác');

// Bán: phí TRỪ vào tiền về ví, không cộng thêm.
const sellVi = tradeCosts({ price: 100, quantity: 10, side: 'sell', memberDenom: 'vi' });
assert.equal(sellVi.total, 1000 - sellVi.fees, 'bán: về ví = giá trị − đủ ba phí');
assert.equal(sellVi.fees, buyVi.fees, 'cùng giá trị thì hai chiều chịu phí như nhau');

// Vòng mua-bán ở CÙNG một giá: lỗ đúng bằng hai lần tổng phí. Với ví khác đơn
// vị, riêng phí đã ăn hơn 40% giá trị lệnh — đây là con số app phải nói thẳng.
const roundTripCost = buyVi.fees + sellVi.fees;
assert.equal(roundTripCost, 2 * buyVi.fees);
assert.ok(roundTripCost / buyVi.gross > 0.4, 'phí hai chiều của ví khác đơn vị vượt 40% giá trị lệnh');

// ── Ba phiên một ngày, và đó là đồng hồ CỦA SÀN ──────────────────────────────
// Cổ tức HBANK trả mỗi phiên một lần và kết quả kinh doanh cũng cộng vào giá
// mỗi phiên một lần, nên số phiên/ngày là một con số tiền tệ. Sàn từng mượn
// đồng hồ của bảng tỷ giá JOY: bên đó đổi sang nhịp giờ là sàn trả cổ tức 24
// lần/ngày mà không ai sửa gì trong file này.
assert.deepEqual(SESSION_HOURS_VN, [9, 15, 21]);
const day = '2026-08-18';
// Đếm từ 09:00 tới 08:59 hôm sau — đúng một vòng đời của ba phiên.
const open = new Date(`${day}T09:00:00+07:00`).getTime();
const keys = new Set();
for (let h = 0; h < 24; h += 1) keys.add(sessionKey(new Date(open + h * 3600000)));
assert.equal(keys.size, 3, 'một ngày phải đúng ba phiên');
assert.equal(sessionKey(new Date(`${day}T08:00:00+07:00`)), '2026-08-17-21', 'trước 9h sáng vẫn là phiên tối hôm trước');
assert.equal(sessionStart('2026-08-18-09').toISOString(), '2026-08-18T02:00:00.000Z', '09:00 giờ VN = 02:00 UTC');

// ── Lịch sử phiên: mỗi mốc đúng một điểm ────────────────────────────────────
// Biểu đồ khoá nến theo thời gian, nên hai điểm trùng giờ làm React vẽ trùng
// hoặc bỏ sót nến. Dữ liệu cũ đã có trường hợp đó thật (mốc phiên từng đổi).
const messy = [
  { at: '2026-08-18T14:00:00.000Z', price: 100 },
  { at: '2026-08-18T08:00:00.000Z', price: 90 },
  { at: '2026-08-18T14:00:00.000Z', price: 105 },
];
const tidy = tidyHistory(messy);
assert.equal(tidy.length, 2, 'mốc trùng phải gộp lại một');
assert.equal(tidy[1].price, 105, 'điểm ghi sau thắng');
assert.ok(tidy[0].at < tidy[1].at, 'cũ trước mới sau');
assert.deepEqual(tidyHistory(undefined), [], 'không có lịch sử thì trả mảng rỗng');

// ── Đường giá trong phiên KHÔNG được là máy in JOY ───────────────────────────
// Máy chủ gửi xuống mốc của bước ĐANG chạy để client vẽ mượt, nên bước đó là
// phần duy nhất người dùng biết trước. Một bước phải nhỏ hơn phí khứ hồi rẻ
// nhất (2 × 0,5% + 2 × 5% = 11%), nếu không thì "biết trước" = lời chắc chắn.
const roundTripRate = 2 * (TRADING_FEE_RATE + CREATIVE_FEE_RATE);
assert.ok(MAX_SEGMENT_MOVE < roundTripRate, 'trần một bước phải nhỏ hơn phí khứ hồi');

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
  // Neo về giá cơ bản: cả phiên không được trôi đi mất.
  const far = Math.max(...prices.map((p) => Math.abs(p / company.basePrice - 1)));
  assert.ok(far < 0.5, `${company.symbol}: giá trôi ${(far * 100).toFixed(0)}% khỏi mốc neo`);
}

// Cùng hạt giống ⇒ cùng đường giá (khởi động lại máy chủ không làm giá nhảy).
assert.deepEqual(walk(COMPANIES[0]).prices, walk(COMPANIES[0]).prices);
// Khác hạt giống ⇒ khác đường giá. Đây là toàn bộ lý do sàn không đoán trước
// được: công thức thì ai cũng đọc được trong bundle, hạt giống thì không.
assert.notDeepEqual(walk(COMPANIES[0]).prices, walk(COMPANIES[0], 'hạt-giống-khác').prices);

// Mã biến động mạnh phải đi xa hơn mã ổn định trên cùng một hạt giống.
const spread = (c) => { const { prices } = walk(c); return Math.max(...prices) - Math.min(...prices); };
assert.ok(spread(bySymbol.HARC) / 60 > spread(bySymbol.HBANK) / 80, 'HARC phải dao động mạnh hơn HBANK');

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
