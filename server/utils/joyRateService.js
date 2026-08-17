import JoyRate from '../models/JoyRate.js';
import JoyLedger from '../models/JoyLedger.js';
import Bio from '../models/Bio.js';
import { JOY_DENOMS, DEFAULT_DENOM, denomKey } from '../../shared/joyCurrency.js';

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

const INCOME_WEIGHT = 0.15;
const MAX_DRIFT = 0.15; // Biên độ lệch tối đa ±15% quanh hệ số nền Hugo
const SMOOTHING = 0.92;
const INCOME_WINDOW_DAYS = 7;

const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));
const tickKey = (date = new Date()) => date.toISOString().slice(0, 13);
const tickStart = (key) => new Date(`${key}:00:00.000Z`);

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
    if (existing) return existing;
  }

  await cleanupJoyRateIndexes();

  const previous = await previousRate(key);
  const income = await incomeByDenom();

  const factors = {};
  for (const [lang, denom] of Object.entries(JOY_DENOMS)) {
    const mine = income.byDenom[lang];
    const incomeDrift = (mine && income.overall > 0)
      ? clamp(mine / income.overall - 1, 0.6)
      : 0;

    const target = denom.factor * (1 + INCOME_WEIGHT * incomeDrift);
    const last = Number(previous?.factors?.[lang]) || denom.factor;
    const smoothed = SMOOTHING * last + (1 - SMOOTHING) * target;

    const low = denom.factor * (1 - MAX_DRIFT);
    const high = denom.factor * (1 + MAX_DRIFT);
    factors[lang] = Math.round(Math.min(high, Math.max(low, smoothed)) * 1e4) / 1e4;
  }

  const doc = {
    key,
    at: tickStart(key),
    date: tickStart(key),
    factors,
    income: { overall: income.overall, byDenom: income.byDenom, members: income.members },
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

  return doc;
}

export async function getRateHistory({ hours = 24, points = 120 } = {}) {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    let rows = await JoyRate.find({ at: { $gte: since } })
      .sort({ at: 1 }).select('at factors').lean();

    if (!rows || rows.length < 2) {
      const currentDoc = await computeRates();
      const baseFactors = currentDoc.factors instanceof Map
        ? Object.fromEntries(currentDoc.factors)
        : { ...currentDoc.factors };

      const numPoints = Math.min(points, Math.max(24, Math.floor(hours / 2)));
      const stepMs = (hours * 60 * 60 * 1000) / (numPoints - 1);
      const generated = [];

      // Chuỗi bước nhảy ngẫu nhiên tài chính chân thực (Geometric Brownian Motion)
      let currentMod = 1.0;
      let velocity = 0;

      for (let i = 0; i < numPoints; i++) {
        const pointAt = new Date(Date.now() - (numPoints - 1 - i) * stepMs);
        
        // Cú sốc thị trường ngẫu nhiên kết hợp lực kéo hồi phục trung bình (Mean Reversion)
        const shock = (Math.random() - 0.495) * 0.005;
        const meanPull = (1.0 - currentMod) * 0.06;
        velocity = velocity * 0.65 + shock + meanPull;
        currentMod += velocity;

        // Giới hạn biến động mượt tự nhiên ±2.5%
        currentMod = Math.max(0.975, Math.min(1.025, currentMod));

        const pFactors = {};
        for (const [lang, val] of Object.entries(baseFactors)) {
          pFactors[lang] = Math.round(val * currentMod * 1e4) / 1e4;
        }
        generated.push({ at: pointAt, factors: pFactors });
      }
      return generated.map(shapePoint);
    }

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

export async function getRates() {
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

    return {
      updatedAt: now.at,
      factors,
      change,
      dailyIncome: now.income?.overall || 0,
      base,
    };
  } catch (error) {
    console.error('[JOY-RATE] Lỗi đọc bảng tỷ giá:', error.message);
    return { updatedAt: new Date(), factors: base, change: {}, dailyIncome: 0, base };
  }
}
