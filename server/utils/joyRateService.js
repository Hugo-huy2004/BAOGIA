import JoyRate from '../models/JoyRate.js';
import JoyLedger from '../models/JoyLedger.js';
import Bio from '../models/Bio.js';
import { JOY_DENOMS, DEFAULT_DENOM, denomKey } from '../../shared/joyCurrency.js';

/**
 * Thị trường JOY — mỗi GIỜ tính lại hệ số của từng đơn vị.
 *
 * ĐIỀU PHẢI HIỂU TRƯỚC: đây là LỚP HIỂN THỊ, không phải sàn giao dịch. Mọi giá
 * trong app niêm yết bằng JOY gốc, nên tỷ giá lên xuống KHÔNG làm ai mua được
 * nhiều hay ít đi — nó đổi cách VIẾT con số. Vì vậy thả nổi được mà không mở ra
 * kẽ hở nào: không thể đợi đơn vị "rẻ" rồi mua hàng, vì hàng không tính bằng
 * đơn vị.
 *
 * Hệ số = hệ số nền × (1 + phần thu nhập + phần vàng), rồi làm mượt với điểm
 * liền trước để đường tỷ giá đi mềm chứ không nhảy giật.
 *
 *   1. PHẦN THU NHẬP — thu nhập JOY trung bình một ngày của một người, tính
 *      riêng theo từng đơn vị rồi so với mức chung. Nhóm nào kiếm nhiều hơn mặt
 *      bằng thì đơn vị của nhóm đó "loãng" ra: cần nhiều đơn vị hơn cho cùng
 *      một JOY, đúng như tiền in nhiều thì mất giá.
 *
 *   2. PHẦN VÀNG — giá vàng quốc tế so với trung bình 30 ngày. Vàng lên thì mọi
 *      đơn vị cùng yếu đi một nhịp; đây là thứ làm cả bảng nhúc nhích mỗi ngày
 *      kể cả khi cộng đồng không đổi gì.
 *
 * Hỏng ở đâu cũng phải trở về hệ số nền chứ không được trả số rác: số dư hiển
 * thị sai còn tệ hơn số dư đứng yên.
 */

// Sức nặng của từng phần. Cố ý nhỏ: đây là gia vị cho con số, không phải một
// canh bạc — 10% biên đã đủ để thấy hôm nay khác hôm qua.
const INCOME_WEIGHT = 0.10;
const GOLD_WEIGHT = 0.05;
const MAX_DRIFT = 0.15;      // hệ số không bao giờ lệch quá 15% so với nền
// Nhịp GIỜ nên làm mượt mạnh hơn: 0.92 mỗi giờ ⇒ sau một ngày đi được ~86% quãng
// đường tới mức mới. Đường vẫn mềm mà vẫn thấy nhúc nhích trong ngày.
const SMOOTHING = 0.92;
const INCOME_WINDOW_DAYS = 7;

const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));
/** Khoá của điểm hiện tại: YYYY-MM-DDTHH theo UTC. */
const tickKey = (date = new Date()) => date.toISOString().slice(0, 13);
const tickStart = (key) => new Date(`${key}:00:00.000Z`);

/**
 * Giá vàng quốc tế (USD/oz). Nguồn miễn phí, không cần khoá; hỏng thì trả null
 * và nơi gọi dùng lại giá đã lưu hôm trước.
 */
async function fetchGoldPrice() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('https://api.gold-api.com/price/XAU', { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const price = Number(data?.price);
    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
}

/**
 * Thu nhập JOY trung bình một ngày của một người, tách theo đơn vị.
 *
 * Chỉ tính khoản CỘNG (amount > 0): đây là "JOY mới bơm vào", còn khoản chi là
 * JOY quay lại hệ thống nên không làm loãng gì cả. JoyLedger bị dọn sau 14 ngày
 * (cronJobs.js) nên cửa sổ 7 ngày luôn nằm trong tầm dữ liệu.
 */
async function incomeByDenom() {
  const since = new Date(Date.now() - INCOME_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const rows = await JoyLedger.aggregate([
    { $match: { createdAt: { $gte: since }, amount: { $gt: 0 } } },
    { $group: { _id: '$email', earned: { $sum: '$amount' } } },
  ]);
  if (!rows.length) return { overall: 0, byDenom: {}, members: 0 };

  const emails = rows.map((row) => row._id);
  const bios = await Bio.find({ email: { $in: emails } }).select('email joyDenom').lean();
  const denomOfEmail = new Map(bios.map((bio) => [bio.email, denomKey(bio.joyDenom)]));

  const buckets = new Map();
  let total = 0;
  for (const row of rows) {
    const key = denomOfEmail.get(row._id) || DEFAULT_DENOM;
    const perDay = row.earned / INCOME_WINDOW_DAYS;
    const bucket = buckets.get(key) || { sum: 0, people: 0 };
    bucket.sum += perDay;
    bucket.people += 1;
    buckets.set(key, bucket);
    total += perDay;
  }

  const byDenom = {};
  for (const [key, bucket] of buckets) byDenom[key] = bucket.sum / bucket.people;
  return { overall: total / rows.length, byDenom, members: rows.length };
}

/** Điểm tỷ giá liền trước (để làm mượt). */
async function previousRate(key) {
  return JoyRate.findOne({ key: { $lt: key } }).sort({ key: -1 }).lean();
}

/** Điểm gần nhất cách đây ít nhất `hours` giờ — mốc để tính % thay đổi. */
async function rateBefore(hours) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return JoyRate.findOne({ at: { $lte: cutoff } }).sort({ at: -1 }).lean();
}

/** Tính (hoặc đọc lại) điểm tỷ giá của giờ hiện tại. */
export async function computeRates({ force = false } = {}) {
  const key = tickKey();
  if (!force) {
    const existing = await JoyRate.findOne({ key }).lean();
    if (existing) return existing;
  }

  const previous = await previousRate(key);

  // ── Phần vàng ──
  const fetched = await fetchGoldPrice();
  const price = fetched ?? Number(previous?.gold?.price) ?? 0;
  // Trung bình 30 ngày ⇒ 30×24 điểm giờ.
  const history = await JoyRate.find({ key: { $lt: key } })
    .sort({ key: -1 }).limit(30 * 24).select('gold.price').lean();
  const prices = [...history.map((row) => Number(row?.gold?.price)).filter(Boolean), price].filter(Boolean);
  const average = prices.length ? prices.reduce((sum, value) => sum + value, 0) / prices.length : price;
  // Dưới một ngày dữ liệu thì trung bình chưa nói lên điều gì — coi như đứng yên.
  const goldDrift = (prices.length >= 24 && average > 0) ? clamp(price / average - 1, 0.25) : 0;

  // ── Phần thu nhập ──
  const income = await incomeByDenom();

  const factors = {};
  for (const [lang, denom] of Object.entries(JOY_DENOMS)) {
    const mine = income.byDenom[lang];
    const incomeDrift = (mine && income.overall > 0)
      ? clamp(mine / income.overall - 1, 0.6)
      : 0;

    const target = denom.factor * (1 + INCOME_WEIGHT * incomeDrift + GOLD_WEIGHT * goldDrift);
    const last = Number(previous?.factors?.[lang]) || denom.factor;
    const smoothed = SMOOTHING * last + (1 - SMOOTHING) * target;

    // Chốt chặn cuối: dù đầu vào có điên rồ thế nào, hệ số vẫn quanh nền.
    const low = denom.factor * (1 - MAX_DRIFT);
    const high = denom.factor * (1 + MAX_DRIFT);
    factors[lang] = Math.round(Math.min(high, Math.max(low, smoothed)) * 1e4) / 1e4;
  }

  const doc = {
    key,
    at: tickStart(key),
    factors,
    income: { overall: income.overall, byDenom: income.byDenom, members: income.members },
    gold: { price, average, drift: goldDrift, stale: fetched === null },
  };
  await JoyRate.findOneAndUpdate({ key }, doc, { upsert: true, new: true });
  return doc;
}

/**
 * Chuỗi điểm tỷ giá để vẽ biểu đồ.
 *
 * Gộp bớt điểm ngay ở server: khung 30 ngày có 720 điểm giờ, gửi hết xuống chỉ
 * để vẽ một đường rộng 300px là phí băng thông của Render lẫn pin của máy. Lấy
 * đều tối đa `points` mốc, luôn giữ điểm mới nhất.
 */
export async function getRateHistory({ hours = 24, points = 120 } = {}) {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const rows = await JoyRate.find({ at: { $gte: since } })
      .sort({ at: 1 }).select('at factors').lean();
    if (rows.length <= points) return rows.map(shapePoint);

    const step = (rows.length - 1) / (points - 1);
    const picked = [];
    for (let i = 0; i < points; i += 1) picked.push(rows[Math.round(i * step)]);
    return picked.map(shapePoint);
  } catch (error) {
    console.error('[JOY-RATE] Không đọc được lịch sử tỷ giá:', error.message);
    return [];
  }
}

const shapePoint = (row) => ({
  at: row.at,
  factors: row.factors instanceof Map ? Object.fromEntries(row.factors) : { ...row.factors },
});

/**
 * Bảng tỷ giá cho client: hệ số hiện tại + mức thay đổi so với 24 giờ trước.
 *
 * Không bao giờ ném lỗi ra ngoài: mất tỷ giá thì app chạy bằng hệ số nền, chứ
 * không được vì thế mà không mở được ví.
 */
export async function getRates() {
  const base = Object.fromEntries(
    Object.entries(JOY_DENOMS).map(([key, denom]) => [key, denom.factor]),
  );
  try {
    const now = await computeRates();
    // % thay đổi so với 24 GIỜ trước, không phải so với giờ liền kề: người dùng
    // muốn biết "hôm nay so với hôm qua", còn chênh lệch một giờ chỉ là nhiễu.
    const yesterday = await rateBefore(24);
    const factors = now.factors instanceof Map
      ? Object.fromEntries(now.factors)
      : { ...now.factors };

    const change = {};
    for (const key of Object.keys(JOY_DENOMS)) {
      const value = Number(factors[key]) || base[key];
      const before = Number(yesterday?.factors?.[key]) || value;
      change[key] = before ? (value - before) / before : 0;
    }
    return {
      at: now.at,
      factors,
      change,
      base,
      gold: now.gold,
      dailyIncome: Math.round(now.income?.overall || 0),
    };
  } catch (error) {
    console.error('[JOY-RATE] Không tính được tỷ giá, dùng hệ số nền:', error.message);
    return { at: new Date(), factors: base, change: {}, base, gold: null, dailyIncome: 0 };
  }
}
