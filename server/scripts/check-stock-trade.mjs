#!/usr/bin/env node
// Kiểm tra ĐƯỜNG TIỀN của sàn ảo trên một database TẠM rồi xoá.
// Chạy: node server/scripts/check-stock-trade.mjs  (cần MongoDB ở localhost)
//
// check-stock-market.mjs lo phần công thức; file này lo phần mà công thức đúng
// vẫn hỏng được: hai lệnh chạy song song, ví trừ một đằng hoá đơn ghi một nẻo,
// hạt giống đường giá lọt xuống client. Toàn bộ là những lỗi từng có thật.
import mongoose from 'mongoose';
import assert from 'node:assert/strict';
import express from 'express';

process.env.JWT_SECRET = 'e2e-secret';
const DB = process.env.MONGO_CHECK_URI || 'mongodb://localhost:27017/hugo_stock_check_tmp';
try {
  await mongoose.connect(DB, { serverSelectionTimeoutMS: 1500 });
} catch {
  // CI không có MongoDB — bỏ qua chứ đừng báo đỏ một thứ không chạy được ở đó.
  console.log('check-stock-trade: bỏ qua (không kết nối được MongoDB).');
  process.exit(0);
}
await mongoose.connection.dropDatabase();

const Bio = (await import('../models/Bio.js')).default;
const StockPosition = (await import('../models/StockPosition.js')).default;
const StockCompany = (await import('../models/StockCompany.js')).default;
const JoyLedger = (await import('../models/JoyLedger.js')).default;

// requireMember giả: chỉ gắn email, phần auth thật đã có middleware riêng.
const EMAIL = 'e2e@hugo.test';
const jwt = (await import('jsonwebtoken')).default;
const TOKEN = jwt.sign({ email: EMAIL, role: 'member' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const AUTH = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` };

await Bio.create({ email: EMAIL, slug: 'e2e', displayName: 'E2E', joyBalance: 1_000_000, joyDenom: 'vi' });

const routes = (await import('../routes/stockRoutes.js')).default;
const app = express();
app.use(express.json());
app.use('/api/stock', routes);
const server = app.listen(4599);
const api = (p, opts = {}) => fetch(`http://localhost:4599/api/stock${p}`, { ...opts, headers: { ...AUTH, ...(opts.headers || {}) } }).then((r) => r.json().then((j) => ({ status: r.status, ...j })));

// ── bảng giá ────────────────────────────────────────────────────────────────
const market = await api('/market');
assert.ok(market.success, market.message);
assert.equal(market.companies.length, 4);
const hfilm = market.companies.find((c) => c.symbol === 'HFILM');
assert.ok(hfilm.ticks?.prices?.length >= 2, 'phải gửi đường giá xuống client');
assert.ok(!JSON.stringify(market).includes('e2e-secret'), 'HẠT GIỐNG KHÔNG ĐƯỢC LỘ RA CLIENT');
console.log('bảng giá:', hfilm.symbol, hfilm.price, 'neo', hfilm.sessionPrice, '·', hfilm.ticks.prices.length, 'mốc');

// client nội suy phải ra CÙNG giá với máy chủ
const { priceAt } = await import('../../shared/stockPricing.js');
const clientPrice = priceAt(hfilm, Math.floor(market.serverTime / 1000));
assert.ok(Math.abs(clientPrice - hfilm.price) < 0.01, `client ${clientPrice} vs server ${hfilm.price}`);

// ── mua ─────────────────────────────────────────────────────────────────────
const buy = await api('/trade', { method: 'POST',   body: JSON.stringify({ symbol: 'HFILM', side: 'buy', quantity: 10, expectedPrice: hfilm.price }) });
assert.ok(buy.success, buy.message);
const r = buy.receipt;
assert.equal(r.fees, r.brokerage + r.creativeFee + r.conversionFee, 'tổng phí = ba khoản');
assert.equal(r.total, r.gross + r.fees, 'mua: trừ ví = giá trị + phí');
assert.ok(r.conversionFee > 0, 'ví Mira phải chịu phí đổi đơn vị');
assert.equal(r.balanceAfter, 1_000_000 - r.total, 'ví trừ đúng con số trên hoá đơn');
assert.equal((await Bio.findOne({ email: EMAIL })).joyBalance, r.balanceAfter);
console.log('mua :', JSON.stringify(r));

// ── giá lệch quá 3% ⇒ từ chối ───────────────────────────────────────────────
const stale = await api('/trade', { method: 'POST',   body: JSON.stringify({ symbol: 'HFILM', side: 'buy', quantity: 1, expectedPrice: hfilm.price * 0.5 }) });
assert.equal(stale.status, 409, 'giá cũ phải bị từ chối');

// ── bán song song: KHÔNG được bán quá số đang nắm ───────────────────────────
const parallel = await Promise.all([1, 2, 3].map(() => api('/trade', {
  method: 'POST',   body: JSON.stringify({ symbol: 'HFILM', side: 'sell', quantity: 10 }) })));
const ok = parallel.filter((p) => p.success);
assert.equal(ok.length, 1, `3 lệnh bán song song 10 cổ nhưng chỉ nắm 10: khớp ${ok.length} lệnh`);
const pos = await StockPosition.findOne({ email: EMAIL, symbol: 'HFILM' });
assert.equal(pos.quantity, 0, 'không được âm cổ phiếu');
assert.equal(pos.avgCost, 0, 'bán hết thì giá vốn về 0');
console.log('bán :', JSON.stringify(ok[0].receipt));

// ── mua nhiều lần song song: giá vốn bình quân phải đúng ────────────────────
await Promise.all([1, 2, 3, 4].map(() => api('/trade', { method: 'POST',   body: JSON.stringify({ symbol: 'HBANK', side: 'buy', quantity: 5 }) })));
const bank = await StockPosition.findOne({ email: EMAIL, symbol: 'HBANK' });
assert.equal(bank.quantity, 20, '4 lệnh × 5 cổ = 20, không lệnh nào bị ghi đè');
const paid = (await JoyLedger.find({ email: EMAIL, source: 'stock_buy', refId: 'HBANK' })).reduce((s, l) => s + Math.abs(l.amount), 0);
const basis = bank.avgCost * bank.quantity;
assert.ok(basis > 0 && basis < paid, 'giá vốn phải nằm dưới tổng đã trả (phí không tính vào vốn)');
console.log('giá vốn HBANK:', bank.avgCost, '· đã trả', paid);

// ── sổ ví khớp số dư ────────────────────────────────────────────────────────
const ledger = await JoyLedger.find({ email: EMAIL });
const sum = ledger.reduce((s, l) => s + l.amount, 0);
assert.equal((await Bio.findOne({ email: EMAIL })).joyBalance, 1_000_000 + sum, 'sổ ví phải khớp số dư');

// ── danh mục ────────────────────────────────────────────────────────────────
const pf = await api('/portfolio');
assert.equal(pf.walletCode, 'JOYmi');
assert.equal(pf.crossDenom, true);
assert.equal(pf.holdings.length, 1);
assert.ok(pf.trades.every((t) => t.walletCode === 'JOYmi' && t.session), 'mỗi lệnh phải lưu đơn vị ví + phiên');
assert.ok(pf.trades.some((t) => t.brokerage > 0), 'sổ lệnh phải tách được phí');
console.log('danh mục:', pf.holdings.length, 'mã ·', pf.trades.length, 'lệnh · lãi chốt', pf.realized);

await mongoose.connection.dropDatabase();
server.close();
await mongoose.disconnect();
console.log('check-stock-trade: đạt.');
