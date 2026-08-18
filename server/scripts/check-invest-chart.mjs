#!/usr/bin/env node
// Kiểm tra toán nến của biểu đồ sàn ảo.
// Chạy: node server/scripts/check-invest-chart.mjs
//
// Biểu đồ là thứ người học nhìn để ra quyết định mua bán. Một cây nến vẽ sai
// đỉnh/đáy dạy họ đúng cái sai đó, nên toán nến phải kiểm được như toán tiền.
import assert from 'node:assert/strict';
import { buildTicks, priceAt, SEGMENT_SEC } from '../../shared/stockPricing.js';
import {
  CANDLE_FRAMES, candlesFromTicks, candlesFromHistory, movingAverage, volumeOf,
} from '../../src/components/member/invest/candles.js';

// Đường giá thật của một phiên, đúng hàm máy chủ dùng để khớp lệnh.
const ticks = buildTicks({
  symbol: 'HARC', anchor: 60, basePrice: 60, volatility: 0.09,
  seed: 'bí-mật-máy-chủ', startSec: 0, nowSec: 3 * 3600,
});
assert.ok(ticks.prices.length > 60, 'phải có đủ mốc để gộp nến');

for (const frame of CANDLE_FRAMES.filter((f) => f.perCandle)) {
  const candles = candlesFromTicks(ticks, frame.perCandle, SEGMENT_SEC);
  assert.ok(candles.length >= 2, `${frame.label}: phải ra ít nhất hai nến`);

  for (const candle of candles) {
    // Bóng nến phải BAO trọn thân, nếu không cây nến vẽ ra là một hình vô nghĩa.
    assert.ok(candle.high >= Math.max(candle.open, candle.close), 'đỉnh phải ≥ giá mở và giá đóng');
    assert.ok(candle.low <= Math.min(candle.open, candle.close), 'đáy phải ≤ giá mở và giá đóng');

    // Đỉnh/đáy của nến phải là đỉnh/đáy THẬT của đoạn giá đó — dò lại bằng
    // chính priceAt, tức bằng con số máy chủ sẽ khớp lệnh trong từng giây.
    let seenHigh = -Infinity;
    let seenLow = Infinity;
    const from = Math.floor(candle.time / 1000);
    for (let t = from; t <= from + frame.perCandle * SEGMENT_SEC; t += 5) {
      const price = priceAt({ ticks }, t);
      seenHigh = Math.max(seenHigh, price);
      seenLow = Math.min(seenLow, price);
    }
    // Nới 0,3% cho phần nhấp nhô hiển thị ±0,1% trong priceAt.
    assert.ok(seenHigh <= candle.high * 1.003, `đỉnh nến ${candle.high} bỏ sót giá thật ${seenHigh}`);
    assert.ok(seenLow >= candle.low * 0.997, `đáy nến ${candle.low} bỏ sót giá thật ${seenLow}`);
  }

  // Nến phải NỐI NHAU: giá đóng nến này là giá mở nến sau. Cắt rời từng khúc
  // thì giữa hai nến hiện ra một khe trống không có trong đường giá.
  for (let i = 1; i < candles.length; i += 1) {
    assert.equal(candles[i].open, candles[i - 1].close, 'nến sau phải mở đúng chỗ nến trước đóng');
  }

  // Khung càng lớn thì nến càng ít và mỗi nến càng dài.
  assert.ok(candles[0].time < candles[1].time, 'nến phải xếp theo thời gian tăng dần');
}

const fine = candlesFromTicks(ticks, 2, SEGMENT_SEC);
const coarse = candlesFromTicks(ticks, 15, SEGMENT_SEC);
assert.ok(fine.length > coarse.length, 'khung 2 phút phải nhiều nến hơn khung 15 phút');
assert.equal(fine[0].open, coarse[0].open, 'mọi khung đều mở ở cùng một mốc đầu phiên');

// Thiếu dữ liệu thì KHÔNG vẽ gì, chứ không tự bịa một cây nến.
assert.deepEqual(candlesFromTicks(null, 5), []);
assert.deepEqual(candlesFromTicks({ start: 0, step: 60, prices: [10, 11] }, 5), [], 'chưa đủ một nến thì trả mảng rỗng');

// Nến phiên: chỉ có giá chốt nên KHÔNG có bóng.
const history = [
  { at: '2026-08-18T02:00:00Z', price: 100 },
  { at: '2026-08-18T08:00:00Z', price: 104 },
  { at: '2026-08-18T14:00:00Z', price: 99 },
];
const sessions = candlesFromHistory(history);
assert.equal(sessions.length, 2, 'n giá chốt ⇒ n−1 nến');
assert.deepEqual(
  { open: sessions[0].open, close: sessions[0].close, high: sessions[0].high, low: sessions[0].low },
  { open: 100, close: 104, high: 104, low: 100 },
);
assert.ok(sessions.every((c) => c.noWick), 'nến phiên không được vẽ bóng: lịch sử không lưu cao/thấp');
assert.deepEqual(candlesFromHistory([{ at: '2026-08-18T02:00:00Z', price: 100 }]), [], 'một điểm thì chưa thành nến');

// Trung bình động: chưa đủ n nến thì để TRỐNG, không vẽ một đoạn nửa vời.
const ma = movingAverage([1, 2, 3, 4, 5], 3);
assert.deepEqual(ma.slice(0, 2), [null, null], 'hai nến đầu chưa đủ để tính MA3');
assert.equal(ma[2], 2, 'MA3 tại nến thứ ba = (1+2+3)/3');
assert.equal(ma[4], 4, 'MA3 tại nến cuối = (3+4+5)/3');
assert.equal(movingAverage([], 10).length, 0);

// Khối lượng mô phỏng: cùng một nến luôn ra cùng một cột (cột không nhảy múa
// mỗi lần vẽ lại), và nến giật mạnh phải cho cột cao hơn nến đứng im.
const calm = { time: 1_700_000_000_000, open: 100, close: 100, high: 100, low: 100 };
const wild = { time: 1_700_000_000_000, open: 100, close: 106, high: 108, low: 96 };
assert.equal(volumeOf(calm), volumeOf({ ...calm }), 'cùng nến ⇒ cùng khối lượng');
assert.ok(volumeOf(wild) > volumeOf(calm), 'nến biên độ rộng phải có khối lượng lớn hơn');
assert.ok(volumeOf(calm) > 0, 'phiên im ắng vẫn phải có cột, không để trống lỗ chỗ');

console.log('check-invest-chart: đạt.');
