// QR Hugo ↔ Hugo Studio.
//
// Thành viên (đã đăng nhập) — app "QR Hugo" trong trang ứng dụng:
//   GET  /api/qr-key/me          trạng thái: đã kết nối chưa, chu kỳ, lượt dùng, log
//   POST /api/qr-key/me/key      tạo key (lần đầu) hoặc tạo lại key (key cũ mất hiệu lực ngay)
//
// Máy chủ QR Hugo gọi (header X-Service-Secret = QR_SERVICE_SECRET, giống hệt bên Vercel QR Hugo):
//   POST /api/qr-key/connect     người dùng dán key vào web QR Hugo → đánh dấu đã kết nối, bắt đầu chu kỳ 30 ngày
//   POST /api/qr-key/use         mỗi lần gọi API tạo QR → kiểm tra key + trừ một lượt của chu kỳ
//
// Mỗi chu kỳ 30 ngày có MONTHLY_QUOTA lượt; hết 30 ngày tự reset một lần, sang chu kỳ mới.
// Hết lượt → QR Hugo từ chối tạo QR và lỗi được ghi vào log để thành viên thấy trong app.
import express from 'express';
import crypto from 'node:crypto';
import { requireMember } from '../middleware/authMiddleware.js';
import Bio from '../models/Bio.js';
import QrApiLink from '../models/QrApiLink.js';

const router = express.Router();
export const QR_LIMITS = Object.freeze({ perMinute: 30, perDay: 500, perPeriod: 3000, periodDays: 30 });
const PERIOD_MS = QR_LIMITS.periodDays * 86_400_000;
const KEY_RE = /^HS-([A-Z0-9]{3,32})-([A-Za-z0-9_-]{32})$/;

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const safeEq = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const log = (level, msg) => ({ $push: { logs: { $each: [{ at: new Date(), level, msg }], $slice: -50 } } });

const view = (l) => ({
  hasKey: Boolean(l),
  code: l?.code || null,
  connected: Boolean(l?.connectedAt),
  connectedAt: l?.connectedAt || null,
  periodStart: l?.periodStart || null,
  periodEnd: l?.periodEnd || null,
  used: l?.periodEnd && l.periodEnd < new Date() ? 0 : l?.used || 0, // chu kỳ đã qua: sẽ reset ở lượt gọi tới
  totalUsed: l?.totalUsed || 0,
  lastUsedAt: l?.lastUsedAt || null,
  logs: (l?.logs || []).slice().reverse(),
  limits: QR_LIMITS,
});

// ── Thành viên ──────────────────────────────────────────────────────────────
router.get('/me', requireMember, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.json(view(await QrApiLink.findOne({ email: req.memberEmail }).lean()));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/me/key', requireMember, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const bio = await Bio.findOne({ email: req.memberEmail }).select('referralCode').lean();
    const code = String(bio?.referralCode || '').toUpperCase();
    if (!/^[A-Z0-9]{3,32}$/.test(code)) return res.status(409).json({ error: 'Tài khoản chưa có mã thành viên. Hãy hoàn tất hồ sơ trước.' });
    const secret = crypto.randomBytes(24).toString('base64url'); // 32 ký tự
    const existed = await QrApiLink.exists({ email: req.memberEmail });
    const link = await QrApiLink.findOneAndUpdate(
      { email: req.memberEmail },
      { $set: { code, secretHash: sha(secret) }, ...log('info', existed ? 'Đã tạo lại key — key cũ hết hiệu lực.' : 'Đã tạo key.') },
      { upsert: true, new: true, lean: true },
    );
    res.json({ key: `HS-${code}-${secret}`, ...view(link) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ── Máy chủ QR Hugo ─────────────────────────────────────────────────────────
const requireService = (req, res, next) => {
  const secret = process.env.QR_SERVICE_SECRET;
  if (!secret) return res.status(503).json({ error: 'Chưa cấu hình QR_SERVICE_SECRET.' });
  if (!safeEq(req.get('x-service-secret') || '', secret)) return res.status(403).json({ error: 'Forbidden' });
  res.set('Cache-Control', 'no-store');
  next();
};

/** Tìm liên kết theo key, so phần bí mật bằng so sánh hằng thời gian. */
async function findByKey(key) {
  const m = KEY_RE.exec(String(key || ''));
  if (!m) return null;
  const link = await QrApiLink.findOne({ code: m[1] }).lean();
  return link && safeEq(link.secretHash, sha(m[2])) ? link : null;
}

router.post('/connect', requireService, async (req, res) => {
  try {
    const link = await findByKey(req.body?.key);
    if (!link) return res.status(401).json({ error: 'API key không đúng. Lấy key trong app QR Hugo tại Hugo Studio.' });
    if (!link.connectedAt) {
      const now = new Date();
      await QrApiLink.updateOne({ _id: link._id, connectedAt: null }, {
        $set: { connectedAt: now, periodStart: now, periodEnd: new Date(+now + PERIOD_MS), used: 0 },
        ...log('info', 'QR Hugo đã kết nối. Bắt đầu chu kỳ 30 ngày.'),
      });
    }
    res.json(view(await QrApiLink.findById(link._id).lean()));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/use', requireService, async (req, res) => {
  try {
    const link = await findByKey(req.body?.key);
    if (!link) return res.status(401).json({ error: 'API key không đúng hoặc đã bị tạo lại.' });
    if (!link.connectedAt) return res.status(403).json({ error: 'Key chưa được kết nối. Nhập key vào mục API trên qr.hugowishpax.studio trước.' });

    const now = new Date();
    if (link.periodEnd < now) {
      // Hết 30 ngày: reset một lần, sang chu kỳ mới. Điều kiện periodEnd giữ cho hai request đồng thời không reset hai lần.
      await QrApiLink.updateOne({ _id: link._id, periodEnd: link.periodEnd }, {
        $set: { periodStart: now, periodEnd: new Date(+now + PERIOD_MS), used: 0 },
        ...log('info', 'Hết chu kỳ 30 ngày — lượt dùng đã được reset.'),
      });
    }
    // Trừ lượt nguyên tử: chỉ khớp khi còn lượt.
    const updated = await QrApiLink.findOneAndUpdate(
      { _id: link._id, used: { $lt: QR_LIMITS.perPeriod } },
      { $inc: { used: 1, totalUsed: 1 }, $set: { lastUsedAt: now } },
      { new: true, lean: true, projection: { used: 1, periodEnd: 1, code: 1 } },
    );
    if (!updated) {
      const fresh = await QrApiLink.findById(link._id).select('periodEnd logs').lean();
      const msg = `Đã dùng hết ${QR_LIMITS.perPeriod} lượt của chu kỳ. Tự reset vào ${fresh.periodEnd.toLocaleDateString('vi-VN')}.`;
      // Ghi log tối đa một lần mỗi giờ để log không bị lấp bởi cùng một lỗi.
      const last = fresh.logs?.at(-1);
      if (!(last?.level === 'error' && now - last.at < 3_600_000)) await QrApiLink.updateOne({ _id: link._id }, log('error', `Từ chối tạo QR: ${msg}`));
      return res.status(429).json({ error: msg, periodEnd: fresh.periodEnd });
    }
    res.json({ ok: true, id: updated.code, left: QR_LIMITS.perPeriod - updated.used, periodEnd: updated.periodEnd, limits: QR_LIMITS });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

/** QR Hugo báo lỗi phía nó (vượt giới hạn phút/ngày) để hiện trong log của thành viên. */
router.post('/log', requireService, async (req, res) => {
  try {
    const m = KEY_RE.exec(String(req.body?.key || ''));
    const msg = String(req.body?.msg || '').slice(0, 200);
    if (m && msg) await QrApiLink.updateOne({ code: m[1] }, log('error', msg));
    res.json({ ok: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
