// Bot tự gọi Boss khi có chuyện, thay vì chờ được hỏi.
//
// Bản tổng kết 08:00 là ẢNH CHỤP: nó nói đêm qua thế nào, không nói "ngay lúc
// này đang có chuyện". Ba tín hiệu dưới đây là những thứ mà biết muộn 8 tiếng
// thì đã mất tiền hoặc mất khách.
//
// NGƯỠNG là phỏng đoán ban đầu, cố tình đặt thưa để những tuần đầu không hú
// oan — hú oan vài lần là Boss tắt thông báo, và thế là mất luôn cái chuông.
// Chỉnh bằng biến môi trường, không phải sửa code:
//   ANOMALY_JOY_FACTOR (mặc định 3)   — gấp mấy lần mức trung bình thì coi là vọt
//   ANOMALY_JOY_FLOOR  (mặc định 50000) — dưới mức này thì im, hệ thống đang vắng
//   ANOMALY_ERROR_BURST (mặc định 10) — số lỗi trong 15 phút
import JoyLedger from '../models/JoyLedger.js';
import ErrorLog from '../models/ErrorLog.js';
import { sendTelegramAlert } from './telegramService.js';

const HOUR_MS = 60 * 60 * 1000;
const num = (name, fallback) => Number(process.env[name]) || fallback;

// Một tín hiệu chỉ hú một lần mỗi giờ. Sự cố kéo dài 40 phút mà nhắn 3 lần thì
// lần thứ ba đã là tiếng ồn, và tiếng ồn là thứ giết chết mọi hệ thống cảnh báo.
const lastFired = new Map();
function shouldFire(signal) {
  const now = Date.now();
  if (now - (lastFired.get(signal) || 0) < HOUR_MS) return false;
  lastFired.set(signal, now);
  return true;
}

async function joySignals() {
  const now = Date.now();
  const [lastHour, prior7d] = await Promise.all([
    JoyLedger.aggregate([
      { $match: { createdAt: { $gte: new Date(now - HOUR_MS) }, amount: { $gt: 0 } } },
      { $group: { _id: '$email', total: { $sum: '$amount' } } },
    ]),
    JoyLedger.aggregate([
      { $match: { createdAt: { $gte: new Date(now - 7 * 24 * HOUR_MS), $lt: new Date(now - HOUR_MS) }, amount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const issued = lastHour.reduce((sum, r) => sum + r.total, 0);
  const hourlyAvg = (prior7d[0]?.total || 0) / (7 * 24);
  const factor = num('ANOMALY_JOY_FACTOR', 3);
  const floor = num('ANOMALY_JOY_FLOOR', 50000);
  const out = [];

  if (issued > floor && hourlyAvg > 0 && issued > hourlyAvg * factor) {
    out.push({
      signal: 'joy_spike',
      text: `💸 <b>JOY phát ra vọt bất thường</b>\n\nGiờ qua: <b>${issued.toLocaleString('vi-VN')} JOY</b>`
        + `\nTrung bình 7 ngày: <b>${Math.round(hourlyAvg).toLocaleString('vi-VN')} JOY/giờ</b>`
        + `\n→ gấp <b>${(issued / hourlyAvg).toFixed(1)}×</b>`,
    });
  }

  // Một người ôm phần lớn số JOY vừa phát ra: hoặc là lỗi thưởng lặp, hoặc là
  // ai đó tìm ra cách bơm điểm. Cả hai đều cần biết trong giờ, không phải sáng mai.
  const top = lastHour.sort((a, b) => b.total - a.total)[0];
  if (top && issued > floor && top.total > issued * 0.3) {
    out.push({
      signal: `joy_whale:${top._id}`,
      text: `🐋 <b>Một tài khoản hút phần lớn JOY vừa phát</b>\n\n<code>${top._id}</code>`
        + `\nNhận <b>${top.total.toLocaleString('vi-VN')} JOY</b> trong 1 giờ`
        + ` (<b>${Math.round((top.total / issued) * 100)}%</b> tổng phát ra)`,
    });
  }
  return out;
}

async function errorSignals() {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const count = await ErrorLog.countDocuments({ createdAt: { $gte: since }, level: 'error' });
  if (count < num('ANOMALY_ERROR_BURST', 10)) return [];

  const top = await ErrorLog.aggregate([
    { $match: { createdAt: { $gte: since }, level: 'error' } },
    { $group: { _id: '$message', n: { $sum: 1 } } },
    { $sort: { n: -1 } },
    { $limit: 3 },
  ]);
  return [{
    signal: 'error_burst',
    text: `🔥 <b>Lỗi máy chủ dồn dập</b>\n\n<b>${count}</b> lỗi trong 15 phút qua:\n`
      + top.map((r) => `• <b>×${r.n}</b> <code>${String(r._id).slice(0, 100)}</code>`).join('\n'),
  }];
}

// Gọi từ cron mỗi 15 phút. Trả về số tín hiệu đã bắn, để script kiểm chạy được.
export async function runAnomalyWatch({ send = true } = {}) {
  const signals = [...await joySignals(), ...await errorSignals()];
  const fired = signals.filter((s) => shouldFire(s.signal));
  if (send) {
    for (const s of fired) {
      await sendTelegramAlert(`🔔 <b>[BOT CHỦ ĐỘNG BÁO]</b>\n\n${s.text}`).catch(() => {});
    }
  }
  return { checked: signals.length, fired: fired.length, signals: fired.map((s) => s.signal) };
}
