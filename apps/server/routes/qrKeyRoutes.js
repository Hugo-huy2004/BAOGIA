// API-m — một key Hugo Studio dùng cho mọi dịch vụ API của Hugo (QR Hugo, Link Hugo).
//
// Thành viên (đã đăng nhập) — app "API-m" trong trang ứng dụng:
//   GET  /api/qr-key/me/live     SSE: báo "có thay đổi" ngay khi key của mình được dùng (app tự tải lại)
//   GET  /api/qr-key/me          trạng thái, chu kỳ, lượt dùng theo dịch vụ, biểu đồ 30 ngày, log, thứ đã tạo
//   POST /api/qr-key/me/key      tạo key (lần đầu) hoặc tạo lại key (key cũ mất hiệu lực ngay)
//
// Máy chủ dịch vụ gọi (header X-Service-Secret = QR_SERVICE_SECRET, giống hệt bên máy chủ dịch vụ):
//   POST /api/qr-key/connect     người dùng dán key vào web dịch vụ → đánh dấu đã kết nối, bắt đầu chu kỳ 30 ngày
//   POST /api/qr-key/use         mỗi lần gọi API → kiểm tra key + trừ một lượt; body { key, service: 'qr'|'link', item? }
//   POST /api/qr-key/log         dịch vụ báo lỗi phía nó (vượt giới hạn phút/ngày)
//
// Admin (quyền "users"):
//   GET  /api/qr-key/admin/live         SSE: báo mỗi khi bất kỳ key nào thay đổi
//   GET  /api/qr-key/admin              tổng quan + danh sách key
//   GET  /api/qr-key/admin/:code        chi tiết một key (log, thứ đã tạo, biểu đồ, app đang dùng)
//   POST /api/qr-key/admin/:code        { disabled?: bool, resetPeriod?: true }
//   POST /api/qr-key/admin/:code/item-delete  { ref } xoá một link ngắn bên Link Hugo
//
// Mỗi chu kỳ 30 ngày có perPeriod lượt (mọi dịch vụ cộng chung); hết 30 ngày tự reset một lần.
import express from 'express';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { requireAdmin, requireMember } from '../middleware/authMiddleware.js';
import Bio from '../models/Bio.js';
import QrApiLink, { API_SERVICES } from '../models/QrApiLink.js';
import ApiUsageDay from '../models/ApiUsageDay.js';

const router = express.Router();
export const QR_LIMITS = Object.freeze({ perMinute: 30, perDay: 500, perPeriod: 3000, periodDays: 30 });
const PERIOD_MS = QR_LIMITS.periodDays * 86_400_000;
const KEY_RE = /^HS-([A-Z0-9]{3,32})-([A-Za-z0-9_-]{32})$/;
const CODE_RE = /^[A-Z0-9]{3,32}$/;
const SERVICE_NAME = { qr: 'QR Hugo', link: 'Link Hugo' };
const LINK_HUGO = process.env.LINK_HUGO_URL || 'https://link.hugowishpax.studio';

// Realtime: mọi thay đổi phát sự kiện 'change' kèm mã key; SSE đẩy xuống trình duyệt, trình duyệt tự tải lại dữ liệu.
// ponytail: bus trong RAM một tiến trình — chạy nhiều instance thì đổi sang Redis pub/sub / MongoDB change stream.
const bus = new EventEmitter();
bus.setMaxListeners(0);
const changed = (code) => code && bus.emit('change', code);

/** Mở luồng SSE; chỉ gửi mã key (không gửi dữ liệu), trình duyệt tự gọi lại API có kiểm quyền. */
function live(req, res, wants) {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  res.write('retry: 3000\n\n');
  const send = (code) => { if (wants(code)) { res.write(`data: ${code}\n\n`); res.flush?.(); } };
  const ping = setInterval(() => { res.write(': ping\n\n'); res.flush?.(); }, 25_000);
  bus.on('change', send);
  req.on('close', () => { clearInterval(ping); bus.off('change', send); });
}

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const safeEq = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const log = (level, msg, service) => ({ $push: { logs: { $each: [{ at: new Date(), level, msg, ...(service ? { service } : {}) }], $slice: -50 } } });
const vnDay = (t = Date.now()) => new Date(t + 7 * 3_600_000).toISOString().slice(0, 10);
const lastDays = (n) => Array.from({ length: n }, (_, i) => vnDay(Date.now() - (n - 1 - i) * 86_400_000));

/** Biểu đồ N ngày: [{ day, qr, link }], đủ cả ngày không có lượt nào. */
async function series(match, n = 30) {
  const days = lastDays(n);
  const rows = await ApiUsageDay.aggregate([
    { $match: { ...match, day: { $gte: days[0] } } },
    { $group: { _id: '$day', qr: { $sum: '$qr' }, link: { $sum: '$link' } } },
  ]);
  const by = Object.fromEntries(rows.map((r) => [r._id, r]));
  return days.map((day) => ({ day, qr: by[day]?.qr || 0, link: by[day]?.link || 0 }));
}

const view = (l) => ({
  hasKey: Boolean(l),
  code: l?.code || null,
  disabled: Boolean(l?.disabled),
  connected: Boolean(l?.connectedAt),
  connectedAt: l?.connectedAt || null,
  periodStart: l?.periodStart || null,
  periodEnd: l?.periodEnd || null,
  used: l?.periodEnd && l.periodEnd < new Date() ? 0 : l?.used || 0, // chu kỳ đã qua: sẽ reset ở lượt gọi tới
  totalUsed: l?.totalUsed || 0,
  usage: { qr: l?.usage?.qr || 0, link: l?.usage?.link || 0 },
  lastUsedAt: l?.lastUsedAt || null,
  logs: (l?.logs || []).slice().reverse(),
  items: (l?.items || []).slice().reverse(),
  limits: QR_LIMITS,
});

// ── Thành viên ──────────────────────────────────────────────────────────────
router.get('/me/live', requireMember, async (req, res) => {
  const link = await QrApiLink.findOne({ email: req.memberEmail }).select('code').lean().catch(() => null);
  let code = link?.code;
  live(req, res, (c) => c === code || (!code && c === `@${req.memberEmail}`));
  if (!code) bus.once(`key:${req.memberEmail}`, (c) => { code = c; });
});

router.get('/me', requireMember, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const link = await QrApiLink.findOne({ email: req.memberEmail }).lean();
    res.json({ ...view(link), daily: link ? await series({ code: link.code }) : [] });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/me/key', requireMember, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const bio = await Bio.findOne({ email: req.memberEmail }).select('referralCode').lean();
    const code = String(bio?.referralCode || '').toUpperCase();
    if (!CODE_RE.test(code)) return res.status(409).json({ error: 'Tài khoản chưa có mã thành viên. Hãy hoàn tất hồ sơ trước.' });
    const secret = crypto.randomBytes(24).toString('base64url'); // 32 ký tự
    const existed = await QrApiLink.exists({ email: req.memberEmail });
    const link = await QrApiLink.findOneAndUpdate(
      { email: req.memberEmail },
      { $set: { code, secretHash: sha(secret) }, ...log('info', existed ? 'Đã tạo lại key — key cũ hết hiệu lực.' : 'Đã tạo key.') },
      { upsert: true, new: true, lean: true },
    );
    bus.emit(`key:${req.memberEmail}`, code);
    changed(code);
    res.json({ key: `HS-${code}-${secret}`, ...view(link) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ── Máy chủ dịch vụ ─────────────────────────────────────────────────────────
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
const DISABLED = 'Key đã bị quản trị viên tạm khoá. Liên hệ contact@hugowishpax.studio.';

router.post('/connect', requireService, async (req, res) => {
  try {
    const link = await findByKey(req.body?.key);
    if (!link) return res.status(401).json({ error: 'API key không đúng. Lấy key trong app API-m tại Hugo Studio.' });
    if (link.disabled) return res.status(403).json({ error: DISABLED });
    if (!link.connectedAt) {
      const now = new Date();
      const service = API_SERVICES.includes(req.body?.service) ? req.body.service : 'qr';
      await QrApiLink.updateOne({ _id: link._id, connectedAt: null }, {
        $set: { connectedAt: now, periodStart: now, periodEnd: new Date(+now + PERIOD_MS), used: 0 },
        ...log('info', `${SERVICE_NAME[service]} đã kết nối. Bắt đầu chu kỳ 30 ngày.`, service),
      });
    }
    changed(link.code);
    res.json(view(await QrApiLink.findById(link._id).lean()));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/use', requireService, async (req, res) => {
  try {
    const service = API_SERVICES.includes(req.body?.service) ? req.body.service : 'qr';
    const link = await findByKey(req.body?.key);
    if (!link) return res.status(401).json({ error: 'API key không đúng hoặc đã bị tạo lại.' });
    if (link.disabled) return res.status(403).json({ error: DISABLED });
    if (!link.connectedAt) return res.status(403).json({ error: 'Key chưa được kết nối. Nhập key vào mục API trên qr.hugowishpax.studio hoặc link.hugowishpax.studio trước.' });

    const now = new Date();
    if (link.periodEnd < now) {
      // Hết 30 ngày: reset một lần, sang chu kỳ mới. Điều kiện periodEnd giữ cho hai request đồng thời không reset hai lần.
      await QrApiLink.updateOne({ _id: link._id, periodEnd: link.periodEnd }, {
        $set: { periodStart: now, periodEnd: new Date(+now + PERIOD_MS), used: 0 },
        ...log('info', 'Hết chu kỳ 30 ngày — lượt dùng đã được reset.'),
      });
    }
    // Chỉ Link Hugo gửi item (mã ngắn + link gốc) để thành viên và admin thấy link đã tạo.
    const item = service === 'link' && req.body?.item
      ? { at: now, service, ref: String(req.body.item.ref || '').slice(0, 64), target: String(req.body.item.target || '').slice(0, 300) }
      : null;
    // Trừ lượt nguyên tử: chỉ khớp khi còn lượt.
    const updated = await QrApiLink.findOneAndUpdate(
      { _id: link._id, used: { $lt: QR_LIMITS.perPeriod } },
      {
        $inc: { used: 1, totalUsed: 1, [`usage.${service}`]: 1 },
        $set: { lastUsedAt: now },
        ...(item ? { $push: { items: { $each: [item], $slice: -100 } } } : {}),
      },
      { new: true, lean: true, projection: { used: 1, periodEnd: 1, code: 1 } },
    );
    if (!updated) {
      const fresh = await QrApiLink.findById(link._id).select('periodEnd logs').lean();
      const msg = `Đã dùng hết ${QR_LIMITS.perPeriod} lượt của chu kỳ. Tự reset vào ${fresh.periodEnd.toLocaleDateString('vi-VN')}.`;
      // Ghi log tối đa một lần mỗi giờ để log không bị lấp bởi cùng một lỗi.
      const last = fresh.logs?.at(-1);
      if (!(last?.level === 'error' && now - last.at < 3_600_000)) await QrApiLink.updateOne({ _id: link._id }, log('error', `${SERVICE_NAME[service]} từ chối: ${msg}`, service));
      changed(link.code);
      return res.status(429).json({ error: msg, periodEnd: fresh.periodEnd });
    }
    ApiUsageDay.updateOne({ code: updated.code, day: vnDay() }, { $inc: { [service]: 1 }, $setOnInsert: { at: now } }, { upsert: true })
      .catch(() => {}) // biểu đồ thiếu một lượt còn hơn làm hỏng request
      .finally(() => changed(updated.code));
    res.json({ ok: true, id: updated.code, left: QR_LIMITS.perPeriod - updated.used, periodEnd: updated.periodEnd, limits: QR_LIMITS });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/log', requireService, async (req, res) => {
  try {
    const m = KEY_RE.exec(String(req.body?.key || ''));
    const msg = String(req.body?.msg || '').slice(0, 200);
    const service = API_SERVICES.includes(req.body?.service) ? req.body.service : 'qr';
    if (m && msg) { await QrApiLink.updateOne({ code: m[1] }, log('error', msg, service)); changed(m[1]); }
    res.json({ ok: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ── Admin ───────────────────────────────────────────────────────────────────
const adminView = (l) => ({
  code: l.code, email: l.email, disabled: Boolean(l.disabled), connected: Boolean(l.connectedAt),
  connectedAt: l.connectedAt, periodEnd: l.periodEnd, used: l.periodEnd && l.periodEnd < new Date() ? 0 : l.used || 0,
  totalUsed: l.totalUsed || 0, usage: { qr: l.usage?.qr || 0, link: l.usage?.link || 0 },
  lastUsedAt: l.lastUsedAt, createdAt: l.createdAt, items: l.itemCount ?? (l.items || []).length,
  lastError: (l.logs || []).filter((x) => x.level === 'error').at(-1) || null,
});

router.get('/admin/live', requireAdmin, (req, res) => live(req, res, () => true));

router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const [links, daily, today] = await Promise.all([
      QrApiLink.find().select('-secretHash -items -logs').sort({ lastUsedAt: -1, createdAt: -1 }).limit(500).lean(),
      series({}),
      ApiUsageDay.find({ day: vnDay() }).select('code').lean(),
    ]);
    // Lỗi gần nhất + số item cho từng key (lấy riêng để danh sách không kéo theo toàn bộ log).
    const extra = await QrApiLink.aggregate([
      { $project: { code: 1, itemCount: { $size: { $ifNull: ['$items', []] } }, logs: { $slice: [{ $filter: { input: { $ifNull: ['$logs', []] }, cond: { $eq: ['$$this.level', 'error'] } } }, -1] } } },
    ]);
    const byCode = Object.fromEntries(extra.map((e) => [e.code, e]));
    const rows = links.map((l) => adminView({ ...l, ...byCode[l.code] }));
    const sum = (k) => rows.reduce((n, r) => n + r.usage[k], 0);
    res.json({
      stats: {
        keys: rows.length, connected: rows.filter((r) => r.connected).length, disabled: rows.filter((r) => r.disabled).length,
        activeToday: today.length, usage: { qr: sum('qr'), link: sum('link') },
        today: daily.at(-1), last30: daily.reduce((n, d) => n + d.qr + d.link, 0),
      },
      daily, rows, limits: QR_LIMITS, updatedAt: new Date(),
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/admin/:code', requireAdmin, async (req, res) => {
  try {
    const code = String(req.params.code).toUpperCase();
    if (!CODE_RE.test(code)) return res.status(400).json({ error: 'Mã không hợp lệ.' });
    const link = await QrApiLink.findOne({ code }).select('-secretHash').lean();
    if (!link) return res.status(404).json({ error: 'Không tìm thấy key.' });
    const bio = await Bio.findOne({ email: link.email }).select('name avatar installedUtilities homeScreenUtilities status expiresAt createdAt').lean();
    res.json({
      ...view(link), email: link.email, createdAt: link.createdAt,
      daily: await series({ code }),
      member: bio ? { name: bio.name, avatar: bio.avatar, status: bio.status, expiresAt: bio.expiresAt, joinedAt: bio.createdAt, apps: bio.installedUtilities || [], home: bio.homeScreenUtilities || [] } : null,
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/admin/:code', requireAdmin, async (req, res) => {
  try {
    const code = String(req.params.code).toUpperCase();
    if (!CODE_RE.test(code)) return res.status(400).json({ error: 'Mã không hợp lệ.' });
    const set = {}; const msgs = [];
    if (typeof req.body?.disabled === 'boolean') { set.disabled = req.body.disabled; msgs.push(req.body.disabled ? 'Quản trị viên đã tạm khoá key.' : 'Quản trị viên đã mở khoá key.'); }
    if (req.body?.resetPeriod === true) { const now = new Date(); Object.assign(set, { used: 0, periodStart: now, periodEnd: new Date(+now + PERIOD_MS) }); msgs.push('Quản trị viên đã reset lượt dùng, bắt đầu chu kỳ mới.'); }
    if (!msgs.length) return res.status(400).json({ error: 'Không có thay đổi.' });
    const link = await QrApiLink.findOneAndUpdate(
      { code },
      { $set: set, $push: { logs: { $each: msgs.map((msg) => ({ at: new Date(), level: 'info', msg })), $slice: -50 } } },
      { new: true, lean: true, projection: { secretHash: 0 } },
    );
    if (!link) return res.status(404).json({ error: 'Không tìm thấy key.' });
    changed(code);
    res.json({ ok: true, ...adminView(link) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/admin/:code/item-delete', requireAdmin, async (req, res) => {
  try {
    const code = String(req.params.code).toUpperCase();
    const ref = String(req.body?.ref || '');
    if (!CODE_RE.test(code) || !/^[A-Za-z0-9_-]{3,40}$/.test(ref)) return res.status(400).json({ error: 'Dữ liệu không hợp lệ.' });
    if (!process.env.QR_SERVICE_SECRET) return res.status(503).json({ error: 'Chưa cấu hình QR_SERVICE_SECRET.' });
    const r = await fetch(`${LINK_HUGO}/api/admin/links/${encodeURIComponent(ref)}`, {
      method: 'DELETE', headers: { 'X-Service-Secret': process.env.QR_SERVICE_SECRET }, signal: AbortSignal.timeout(8000),
    });
    if (!r.ok && r.status !== 404) return res.status(502).json({ error: `Link Hugo trả lỗi ${r.status}.` });
    await QrApiLink.updateOne({ code }, {
      $pull: { items: { service: 'link', ref } },
      ...log('info', `Quản trị viên đã xoá link ngắn /${ref}.`, 'link'),
    });
    changed(code);
    res.json({ ok: true, existed: r.status !== 404 });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
