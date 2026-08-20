import JoyRate from '../models/JoyRate.js';
import JoyLedger from '../models/JoyLedger.js';
import Bio from '../models/Bio.js';
import { JOY_DENOMS, DEFAULT_DENOM, denomKey, setLiveFactors, BASE_DENOM, CROSS_DENOM_FEE } from '../../shared/joyCurrency.js';

/**
 * Thị trường Tỷ giá Ảo JOY (Hugo Studio System Dynamics)
 *
 * NGUYÊN TẮC TỐI CAO:
 * 100% ĐƠN VỊ ẢO HUGO STUDIO — KHÔNG DÙNG BẤT KỲ ĐỒNG TIỀN THẬT NÀO (VND, USD, EUR, JPY...)
 * KHÔNG DÙNG GIÁ VÀNG THẬT.
 *
 * Mọi biến động tỷ giá dựa 100% vào nhịp lưu thông nội bộ của hệ thống Hugo:
 * 1. Tốc độ thu nhập & giao dịch thực tế trên JoyLedger.
 * 2. Tỷ lệ lựa chọn đơn vị hiển thị của thành viên.
 * 3. Gia tốc hoạt động quy đổi & Arcade Rewards.
 */

/**
 * ── LUẬT BIẾN ĐỘNG (chốt 18/8/2026, đổi sang mỗi giờ 19/8/2026) ──────────────
 *
 * Giá cập nhật MỖI GIỜ MỘT PHIÊN, đúng đầu giờ theo giờ Việt Nam. Ba phiên một
 * ngày làm bảng tỷ giá gần như đứng yên: tín hiệu đo trên cửa sổ 7 ngày nên
 * giữa hai phiên cách nhau 6 tiếng nó gần như không kịp đổi, và người dùng mở
 * ví ba lần trong ngày thì thấy đúng một con số. Mỗi giờ một phiên cho 24 mốc
 * mỗi ngày: cùng một luật, cùng trần ±15%, nhưng đường tỷ giá có hình.
 *
 * Ngoài đầu giờ không có phép tính nào chạy — mọi lượt xem đều đọc lại bản ghi
 * của phiên gần nhất, nên bảng tỷ giá không thêm một chút tải nào cho máy chủ
 * dù bao nhiêu người mở ví cùng lúc.
 *
 * Mỗi phiên, hệ số của từng đơn vị (trừ đơn vị chuẩn) đổi theo TRUNG BÌNH của
 * ba tín hiệu, rồi nhân thêm phần phí đổi đơn vị:
 *
 *   1. THU NHẬP THEO ĐƠN VỊ (riêng từng đồng, tổng bằng 0)
 *      Ví của nhóm dùng đồng nào nhận về nhiều JOY hơn mức trung bình thì đồng
 *      đó LÊN GIÁ. Lên giá nghĩa là cần ÍT đơn vị hơn cho một JOY gốc, tức hệ
 *      số giảm. Vì tín hiệu được trừ đi trung bình cộng nên tổng luôn bằng 0:
 *      một đồng mạnh lên thì các đồng còn lại yếu đi theo đúng tỷ lệ nghịch.
 *
 *   2. LÃI VAY & PHÍ ĐỔI (chung cho mọi đồng)
 *      Phần JOY rời ví vì lãi JOYlater và phí quy đổi, so với tổng JOY chi ra.
 *      Càng nhiều JOY bị phí và lãi rút khỏi lưu thông thì JOY càng khan, các
 *      đơn vị hiển thị càng yếu đi so với nó.
 *
 *   3. JOY RA/VÀO HỆ THỐNG (chung cho mọi đồng)
 *      Chênh lệch giữa JOY chi ra và JOY nhận về trong cửa sổ quan sát. Bơm
 *      vào nhiều hơn rút ra thì hệ số nhích lên, ngược lại thì hạ.
 *
 *   4. CỘNG PHÍ ĐỔI 15%
 *      Trung bình ba tín hiệu trên được nhân (1 + 15%) — đúng mức phí đổi đơn
 *      vị đang thu. ĐƠN VỊ CHUẨN (bản tiếng Anh) KHÔNG áp phần này và cũng
 *      không bao giờ đổi hệ số: nó là cái mốc để đo mọi đồng còn lại, mốc mà
 *      trôi thì cả bảng vô nghĩa.
 *
 * Toàn bộ phép tính nằm trong `nextFactors()` — hàm THUẦN, không chạm database,
 * để kiểm chứng bằng server/scripts/check-joy-currency.mjs.
 */

// Trọng số của tín hiệu thu nhập trước khi vào trung bình cộng.
const INCOME_WEIGHT = 0.15;
// Trọng số hai tín hiệu chung (lãi vay, dòng JOY ra/vào).
const RATE_WEIGHT = 0.3;
const FLOW_WEIGHT = 0.3;
// Biên độ lệch tối đa ±15% quanh hệ số nền: thị trường có điên thì ví vẫn không loạn.
const MAX_DRIFT = 0.15;
// Giữ lại bao nhiêu phần của phiên trước. 0.6 mỗi giờ ⇒ tỷ giá bám theo tín
// hiệu trong khoảng ba tiếng. Bản cũ để 0.92 theo giờ và bảng đứng yên gần như
// cả ngày; đừng nâng lại lên đó.
const SMOOTHING = 0.6;
const INCOME_WINDOW_DAYS = 7;

// Mỗi giờ một phiên, mốc tính theo giờ Việt Nam (UTC+7).
export const SESSION_EVERY_HOURS = 1;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

/**
 * Khoá phiên của một thời điểm: "2026-08-18-09" = giờ thứ 09 ngày 18/8 giờ VN.
 * Cắt tròn xuống đầu giờ, nên mọi thời điểm trong cùng một giờ dùng chung một
 * bảng tỷ giá — đó là thứ giữ cho ví và màn hình không lệch nhau.
 */
export function sessionKey(date = new Date()) {
  const vn = new Date(date.getTime() + VN_OFFSET_MS);
  return `${vn.toISOString().slice(0, 10)}-${String(vn.getUTCHours()).padStart(2, '0')}`;
}

/** Mốc bắt đầu (UTC) của một phiên, để lưu và vẽ biểu đồ. */
export function sessionStart(key) {
  const [date, hour] = [key.slice(0, 10), Number(key.slice(11, 13))];
  return new Date(new Date(`${date}T00:00:00.000Z`).getTime() + hour * 3600000 - VN_OFFSET_MS);
}

const tickKey = sessionKey;
const tickStart = sessionStart;

/**
 * Hệ số của phiên kế tiếp — HÀM THUẦN.
 *
 * @param {object} input
 *   baselines  { [key]: hệ số nền }
 *   previous   { [key]: hệ số phiên trước } (thiếu thì lấy hệ số nền)
 *   incomeByDenom { [key]: thu nhập bình quân đầu người của nhóm dùng đơn vị đó }
 *   feeShare   phần JOY chi ra là lãi vay + phí đổi (0…1)
 *   netFlow    (JOY vào − JOY ra) / tổng lưu thông (−1…1)
 *   baseKey    đơn vị chuẩn — luôn giữ nguyên hệ số nền
 *   feeRate    phí đổi đơn vị (0.15)
 */
export function nextFactors({ baselines, previous = {}, incomeByDenom = {}, feeShare = 0, netFlow = 0, baseKey, feeRate = 0 }) {
  const keys = Object.keys(baselines);

  // ── Tín hiệu 1: thu nhập theo đơn vị, chuẩn hoá về tổng 0 ──
  const incomes = keys.map((key) => Number(incomeByDenom[key]) || 0);
  const earning = incomes.filter((value) => value > 0);
  const meanIncome = earning.length ? earning.reduce((a, b) => a + b, 0) / earning.length : 0;

  const rawIncomeSignal = {};
  for (const key of keys) {
    const mine = Number(incomeByDenom[key]) || 0;
    rawIncomeSignal[key] = meanIncome > 0 && mine > 0 ? clamp(mine / meanIncome - 1, 1) : 0;
  }
  // Trừ đi trung bình cộng ⇒ tổng bằng 0 ⇒ một đồng lên thì phần còn lại xuống.
  //
  // Trung bình chỉ tính trên những đồng THẬT SỰ DI CHUYỂN, tức bỏ đơn vị chuẩn
  // ra: nó bị neo cứng nên tín hiệu của nó không bao giờ được thi hành, mà vẫn
  // đưa vào mẫu số thì phần dư của nó đọng lại trong các đồng còn lại và tổng
  // không về 0 nữa — lúc đó "tỷ lệ nghịch" chỉ còn đúng một nửa.
  const movingKeys = keys.filter((key) => key !== baseKey);
  const signalMean = movingKeys.length
    ? movingKeys.reduce((sum, key) => sum + rawIncomeSignal[key], 0) / movingKeys.length
    : 0;

  const factors = {};
  const signals = {};
  for (const key of keys) {
    if (key === baseKey) {
      factors[key] = baselines[key];
      signals[key] = { income: 0, feeShare: 0, netFlow: 0, movement: 0 };
      continue;
    }

    const income = (rawIncomeSignal[key] - signalMean) * INCOME_WEIGHT;
    const rate = feeShare * RATE_WEIGHT;
    const flow = netFlow * FLOW_WEIGHT;
    // Trung bình ba tín hiệu, rồi cộng phần phí đổi đơn vị.
    const average = (income + rate + flow) / 3;
    const movement = clamp(average * (1 + feeRate), MAX_DRIFT);

    // Thu nhập cao ⇒ đồng LÊN GIÁ ⇒ cần ít đơn vị hơn cho một JOY ⇒ hệ số GIẢM.
    const target = baselines[key] * (1 - movement);
    const last = Number(previous[key]) || baselines[key];
    const smoothed = SMOOTHING * last + (1 - SMOOTHING) * target;

    const low = baselines[key] * (1 - MAX_DRIFT);
    const high = baselines[key] * (1 + MAX_DRIFT);
    factors[key] = Math.round(Math.min(high, Math.max(low, smoothed)) * 1e4) / 1e4;
    signals[key] = {
      income: Math.round(income * 1e4) / 1e4,
      feeShare: Math.round(rate * 1e4) / 1e4,
      netFlow: Math.round(flow * 1e4) / 1e4,
      movement: Math.round(movement * 1e4) / 1e4,
    };
  }

  return { factors, signals };
}

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

/**
 * Hai tín hiệu chung cho mọi đơn vị, đo bằng MỘT lượt aggregate:
 *   feeShare — phần JOY rời ví vì lãi JOYlater và phí đổi/giao dịch;
 *   netFlow  — (JOY vào − JOY ra) / tổng lưu thông.
 * Nguồn phí lấy theo danh mục nguồn JOY, không đoán theo tên.
 */
const FEE_SOURCES = new Set(['joylater_repay', 'joylater_open']);

async function systemFlows() {
  const since = new Date(Date.now() - INCOME_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const rows = await JoyLedger.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: '$source', total: { $sum: '$amount' } } },
  ]);

  let inflow = 0;
  let outflow = 0;
  let feeFlow = 0;
  for (const row of rows) {
    const total = Number(row.total) || 0;
    if (total >= 0) inflow += total;
    else {
      outflow += -total;
      if (FEE_SOURCES.has(row._id)) feeFlow += -total;
    }
  }

  const circulation = inflow + outflow;
  return {
    inflow,
    outflow,
    feeFlow,
    // Càng nhiều JOY bị lãi và phí rút khỏi lưu thông ⇒ tín hiệu càng dương.
    feeShare: outflow > 0 ? clamp(feeFlow / outflow, 1) : 0,
    // Bơm vào nhiều hơn rút ra ⇒ dương ⇒ hệ số nhích lên (đơn vị yếu đi).
    netFlow: circulation > 0 ? clamp((inflow - outflow) / circulation, 1) : 0,
  };
}

async function previousRate(key) {
  return JoyRate.findOne({ key: { $lt: key } }).sort({ key: -1 }).lean();
}

async function rateBefore(hours) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return JoyRate.findOne({ at: { $lte: cutoff } }).sort({ at: -1 }).lean();
}

let legacyIndexesCleaned = false;

export async function cleanupJoyRateIndexes() {
  if (legacyIndexesCleaned) return;
  try {
    const collection = JoyRate.collection;
    const indexes = await collection.indexes();
    for (const idx of indexes) {
      if (idx.name === 'date_1' || idx.key?.date) {
        console.log(`[JoyRate] Dropping legacy MongoDB index: ${idx.name}`);
        await collection.dropIndex(idx.name);
      }
    }
    legacyIndexesCleaned = true;
  } catch (err) {
    // Ignore if collection doesn't exist yet or index already dropped
  }
}

export async function computeRates({ force = false } = {}) {
  const key = tickKey();
  if (!force) {
    const existing = await JoyRate.findOne({ key }).lean();
    if (existing) {
      // Phải nạp cả ở nhánh này. Bản trước chỉ nạp ở cuối hàm, mà hàm gần như
      // luôn thoát sớm tại đây (bản ghi của giờ hiện tại đã có sẵn) — nên
      // setLiveFactors thực tế không bao giờ chạy trên server.
      setLiveFactors(existing.factors instanceof Map ? Object.fromEntries(existing.factors) : existing.factors);
      return existing;
    }
  }

  await cleanupJoyRateIndexes();

  const previous = await previousRate(key);
  const income = await incomeByDenom();
  const flows = await systemFlows();

  const baselines = Object.fromEntries(
    Object.entries(JOY_DENOMS).map(([lang, denom]) => [lang, denom.factor]),
  );
  const previousFactors = previous?.factors instanceof Map
    ? Object.fromEntries(previous.factors)
    : (previous?.factors || {});

  const { factors, signals } = nextFactors({
    baselines,
    previous: previousFactors,
    incomeByDenom: income.byDenom,
    feeShare: flows.feeShare,
    netFlow: flows.netFlow,
    baseKey: BASE_DENOM,
    feeRate: CROSS_DENOM_FEE,
  });

  const doc = {
    key,
    at: tickStart(key),
    factors,
    signals,
    income: { overall: income.overall, byDenom: income.byDenom, members: income.members },
    flows: { inflow: flows.inflow, outflow: flows.outflow, feeFlow: flows.feeFlow, feeShare: flows.feeShare, netFlow: flows.netFlow },
  };

  try {
    await JoyRate.findOneAndUpdate({ key }, doc, { upsert: true, new: true });
  } catch (err) {
    if (err.code === 11000 || err.message?.includes('E11000')) {
      console.warn('⚠️ JoyRate E11000 detected, dropping legacy index date_1...');
      await JoyRate.collection.dropIndex('date_1').catch(() => {});
      await JoyRate.findOneAndUpdate({ key }, doc, { upsert: true, new: true });
    } else {
      throw err;
    }
  }

  // Máy chủ cũng phải tính tiền bằng ĐÚNG bảng vừa tính ra. Trước đây chỉ có
  // client gọi setLiveFactors, nên client quy đổi theo tỷ giá ngày còn server
  // quy đổi theo hệ số nền — hai bên ra hai con số khác nhau cho cùng một lần
  // gửi JOY, và bên đúng luôn là bên trừ ví.
  setLiveFactors(factors);
  ratesCache = { key: null, payload: null };
  historyCache = new Map();

  return doc;
}

/**
 * Bảo đảm tiến trình đang cầm bảng tỷ giá của giờ hiện tại trước khi tính tiền.
 * Gọi mỗi lần chuyển JOY và một lần lúc khởi động; trong cùng một giờ thì chỉ
 * đọc lại từ bộ nhớ, không đụng MongoDB.
 */
let liveTickKey = null;
export async function ensureLiveFactors() {
  const key = tickKey();
  if (liveTickKey === key) return;
  try {
    await computeRates();
    liveTickKey = key;
  } catch (error) {
    // Thị trường hỏng không được phép làm hỏng ví: rơi về hệ số nền.
    console.error('[JOY-RATE] Không nạp được tỷ giá sống:', error.message);
  }
}

export async function getRateHistory({ hours = 24, points = 120 } = {}) {
  const cacheKey = `${sessionKey()}|${hours}|${points}`;
  if (historyCache.has(cacheKey)) return historyCache.get(cacheKey);

  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    let rows = await JoyRate.find({ at: { $gte: since } })
      .sort({ at: 1 }).select('at factors').lean();

    // Chỉ trả về TICK CÓ THẬT. Bản trước, khi chưa đủ hai bản ghi, tự sinh một
    // chuỗi bước nhảy ngẫu nhiên (Math.random + mean reversion) rồi vẽ lên
    // biểu đồ y như dữ liệu thật — người xem không có cách nào biết mình đang
    // nhìn một đường giá được bịa ra. Thà biểu đồ trống một hôm.
    if (!rows || !rows.length) {
      const current = await computeRates();
      rows = [current];
    }

    const remember = (list) => {
      // Một khoá cho mỗi phiên: sang giờ mới thì khoá cũ không ai hỏi nữa,
      // xoá sạch cho khỏi phình.
      if (historyCache.size > 12) historyCache = new Map();
      historyCache.set(cacheKey, list);
      return list;
    };

    if (rows.length <= points) return remember(rows.map(shapePoint));

    const step = (rows.length - 1) / (points - 1);
    const picked = [];
    for (let i = 0; i < points; i += 1) picked.push(rows[Math.round(i * step)]);
    return remember(picked.map(shapePoint));
  } catch (error) {
    console.error('[JOY-RATE] Không đọc được lịch sử tỷ giá:', error.message);
    return [];
  }
}

const shapePoint = (row) => {
  const f = row.factors instanceof Map ? Object.fromEntries(row.factors) : { ...row.factors };
  const baseEn = f.en || 1.0;

  // 100% ĐƠN VỊ ẢO HUGO STUDIO — KHÔNG DÙNG TIỀN THẬT NÀO (VND, USD, EUR...)
  f.JOY = baseEn;
  f.kJOY = baseEn * 1000;
  f.MJOY = baseEn * 1000000;
  f.JOYka = f.en || 1;
  f.JOYve = f.es || 5;
  f.JOYra = f.zh || 10;
  f.JOYse = f.id || 16;
  f.JOYmi = f.vi || 25;
  f.JOYti = f.th || 50;
  f.JOYzo = f.ja || 150;
  f.JOYlu = f.ko || 1350;

  return {
    at: row.at,
    factors: f,
  };
};

/**
 * Bảng tỷ giá chỉ đổi mỗi giờ một lần, nên giữ nguyên câu trả lời trong bộ nhớ
 * tiến trình cho tới phiên sau. Không có lớp này thì mỗi lần một người mở ví là
 * hai lượt đọc MongoDB cho một con số cả hệ thống dùng chung.
 */
let ratesCache = { key: null, payload: null };
let historyCache = new Map();

export async function getRates() {
  const cacheKey = sessionKey();
  if (ratesCache.key === cacheKey && ratesCache.payload) return ratesCache.payload;
  const base = Object.fromEntries(
    Object.entries(JOY_DENOMS).map(([key, denom]) => [key, denom.factor]),
  );
  try {
    const now = await computeRates();
    const yesterday = await rateBefore(24);
    const factors = now.factors instanceof Map
      ? Object.fromEntries(now.factors)
      : { ...now.factors };

    const change = {};
    for (const key of Object.keys(JOY_DENOMS)) {
      const current = factors[key];
      const past = Number(yesterday?.factors?.[key]) || JOY_DENOMS[key].factor;
      change[key] = past ? Math.round(((current - past) / past) * 1e4) / 1e4 : 0;
    }

    // Bảng niêm yết: mỗi đơn vị quy về ĐƠN VỊ CHUẨN (Kavo/tiếng Anh), kèm mức
    // đổi trong 24 giờ — đúng bộ số một bảng tỷ giá quốc tế bày ra.
    const baseFactor = Number(factors[BASE_DENOM]) || JOY_DENOMS[BASE_DENOM].factor;
    const pastBase = Number(yesterday?.factors?.[BASE_DENOM]) || JOY_DENOMS[BASE_DENOM].factor;

    const board = [];
    for (const [key, denom] of Object.entries(JOY_DENOMS)) {
      // Một MÃ một dòng: es và fr dùng chung JOYve, in hai dòng giống hệt nhau
      // thì bảng trông như lỗi hiển thị.
      if (board.some((row) => row.code === denom.code)) continue;

      const perBase = (Number(factors[key]) || denom.factor) / baseFactor;
      const pastPerBase = (Number(yesterday?.factors?.[key]) || denom.factor) / pastBase;

      board.push({
        key,
        code: denom.code,
        name: denom.name,
        // "1 Kavo = perBase <đơn vị này>"
        perBase: Math.round(perBase * 1e4) / 1e4,
        baseline: denom.factor / JOY_DENOMS[BASE_DENOM].factor,
        // % đổi phải tính TRÊN CHÍNH CON SỐ ĐANG BÀY. Lấy % của hệ số thô thì
        // bảng nói "-7%" cạnh một tỷ giá không hề đổi — vì cả hai vế cùng trôi.
        change24h: pastPerBase ? Math.round(((perBase - pastPerBase) / pastPerBase) * 1e4) / 1e4 : 0,
        isBase: key === BASE_DENOM,
      });
    }
    board.sort((a, b) => a.perBase - b.perBase);

    const payload = {
      updatedAt: now.at,
      factors,
      change,
      dailyIncome: now.income?.overall || 0,
      base,
      baseDenom: BASE_DENOM,
      baseCode: JOY_DENOMS[BASE_DENOM].code,
      board,
      sessionKey: cacheKey,
      sessionEveryHours: SESSION_EVERY_HOURS,
    };
    ratesCache = { key: cacheKey, payload };
    return payload;
  } catch (error) {
    console.error('[JOY-RATE] Lỗi đọc bảng tỷ giá:', error.message);
    return { updatedAt: new Date(), factors: base, change: {}, dailyIncome: 0, base };
  }
}
