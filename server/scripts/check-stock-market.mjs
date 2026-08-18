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
} from '../services/stockMarket.js';
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

console.log('check-stock-market: đạt.');
