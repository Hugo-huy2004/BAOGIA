// Hệ thống: tổng quan, nhật ký, bảo mật, hàng đợi, AI — router con của /api/admin (mount trong routes/adminRoutes.js).
import express from 'express';
import { buildWorkQueue } from '../../services/adminWorkQueue.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';
import path from 'path';
import mongoose from 'mongoose';
import Bio from '../../models/Bio.js';
import { getQuotaStatus } from '../../services/aiGateway.js';
import ErrorLog from '../../models/ErrorLog.js';
import { getDirSize, logAdminAuditAction, __dirname } from './adminShared.js';

const router = express.Router();

router.get('/system-storage', requireAdmin, async (req, res) => {
  try {
    const publicPath = path.resolve(__dirname, '../../public');
    const publicSize = await getDirSize(publicPath);

    let dbSize = 0;
    try {
      if (mongoose.connection && mongoose.connection.db) {
        const stats = await mongoose.connection.db.stats();
        dbSize = stats.dataSize + stats.indexSize;
      }
    } catch (e) {
      console.error("MongoDB stats error:", e);
    }

    res.json({
      success: true,
      data: {
        publicFiles: publicSize,
        database: dbSize,
        total: publicSize + dbSize
      }
    });
  } catch (error) {
    console.error('System storage error:', error);
    res.status(500).json({ error: 'Lỗi khi tính toán dung lượng' });
  }
});

// GET /admin/error-logs?level=&source=&limit= - persisted errors for the dashboard.
router.get('/error-logs', requireAdmin, async (req, res) => {
  try {
    const { level, source } = req.query;
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const q = {};
    if (level && ['error', 'warn', 'info'].includes(level)) q.level = level;
    if (source) q.source = source;
    const logs = await ErrorLog.find(q).sort({ createdAt: -1 }).limit(limit).lean();
    const counts = await ErrorLog.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
      { $group: { _id: '$level', n: { $sum: 1 } } },
    ]);
    const last24h = counts.reduce((a, c) => ({ ...a, [c._id]: c.n }), { error: 0, warn: 0, info: 0 });
    res.json({ success: true, logs, last24h });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /admin/error-logs?level= - clear logs (all, or a single level).
router.delete('/error-logs', requireAdmin, async (req, res) => {
  try {
    const { level } = req.query;
    const q = level && ['error', 'warn', 'info'].includes(level) ? { level } : {};
    const r = await ErrorLog.deleteMany(q);
    res.json({ success: true, deleted: r.deletedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/system-overview - one-shot vitals for the System dashboard.
router.get('/system-overview', requireAdmin, async (req, res) => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [users, joyAgg, errors24h, newUsers24h] = await Promise.all([
      Bio.countDocuments({}),
      Bio.aggregate([{ $group: { _id: null, total: { $sum: '$joyBalance' } } }]),
      ErrorLog.countDocuments({ level: 'error', createdAt: { $gte: dayAgo } }),
      Bio.countDocuments({ createdAt: { $gte: dayAgo } }),
    ]);
    res.json({
      success: true,
      users,
      newUsers24h,
      joyCirculating: joyAgg?.[0]?.total || 0,
      errors24h,
      quota: getQuotaStatus(),
      uptimeSec: Math.round(process.uptime()),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET /admin/iot/devices (admin) - Danh sách thiết bị IoT
router.get('/iot/devices', requireAdmin, async (req, res) => {
  try {
    const IoTDevice = (await import('../../models/IoTDevice.js')).default;
    const devices = await IoTDevice.find({}).sort({ lastSeen: -1 });
    res.json({ success: true, devices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/iot/toggle (admin) - Bật/tắt hoạt động thiết bị IoT
router.post('/iot/toggle', requireAdmin, async (req, res) => {
  try {
    const { deviceId } = req.body;
    const IoTDevice = (await import('../../models/IoTDevice.js')).default;
    const dev = await IoTDevice.findOne({ deviceId });
    if (!dev) return res.status(404).json({ error: 'Không tìm thấy thiết bị IoT' });
    dev.isActive = !dev.isActive;
    await dev.save();
    res.json({ success: true, message: `Thiết bị ${dev.deviceName} đã được ${dev.isActive ? 'Kích hoạt' : 'Hủy kích hoạt'}`, device: dev });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/brief — bản tin một màn bằng câu thường (services/adminBrief.js).
router.get('/brief', requireAdmin, async (req, res, next) => {
  try {
    const { buildAdminBrief } = await import('../../services/adminBrief.js');
    res.json(await buildAdminBrief());
  } catch (err) { next(err); }
});

// GET /admin/queue — mọi việc đang chờ người duyệt, toàn hệ thống.
// Xếp CŨ TRƯỚC trong từng mảng: thứ chờ lâu nhất là thứ đáng lo nhất.
router.get('/queue', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    res.json({ success: true, ...(await buildWorkQueue({ limit })) });
  } catch (err) {
    console.error('[admin] work queue:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/brain/auto-moderator/scan - AI Quét tự động rủi ro an ninh & biến động JOY
router.get('/brain/auto-moderator/scan', requireAdmin, async (req, res) => {
  try {
    const { runAutoModerationScan } = await import('../../services/adminBrainService.js');
    const result = await runAutoModerationScan();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error running auto moderation scan:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/brain/auto-moderator/resolve - Xử lý / Giải quyết rủi ro an ninh AI
router.post('/brain/auto-moderator/resolve', requireAdmin, async (req, res) => {
  try {
    const { userId, freezeWallet = false, action = 'DISMISS' } = req.body;
    const Bio = (await import('../../models/Bio.js')).default;
    const bio = await Bio.findById(userId);
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    if (freezeWallet) {
      bio.isJoyWalletFrozen = true;
      bio.history.push({
        type: 'security',
        icon: 'ac_unit',
        title: 'Ví JOY bị đóng băng bởi AI Auto-Moderator',
        detail: 'Hệ thống AI đã đóng băng Ví khẩn cấp để ngăn chặn gian lận.',
        timestamp: new Date()
      });
    } else if (action === 'UNFREEZE') {
      bio.isJoyWalletFrozen = false;
    }

    await bio.save();

    logAdminAuditAction(req, 'RESOLVE_AI_RISK', bio._id, bio.email, `Xử lý cảnh báo AI risk: ${action} (Freeze: ${freezeWallet})`);

    res.json({
      success: true,
      message: `Đã xử lý cảnh báo rủi ro an ninh cho ${bio.displayName}`
    });
  } catch (err) {
    console.error('Error resolving auto moderation risk:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/ai-support/briefing - Báo cáo chủ động các việc AI Support Admin đã tự động làm
router.get('/ai-support/briefing', requireAdmin, async (req, res) => {
  try {
    const { getPendingBriefing } = await import('../../services/aiSupportAdminService.js');
    const briefingData = await getPendingBriefing();
    res.json({ success: true, ...briefingData });
  } catch (err) {
    console.error('Error fetching AI Support briefing:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/ai-support/mark-read - Đánh dấu đã xem báo cáo của AI
router.post('/ai-support/mark-read', requireAdmin, async (req, res) => {
  try {
    const { markBriefingReported } = await import('../../services/aiSupportAdminService.js');
    const { logIds } = req.body || {};
    await markBriefingReported(logIds);
    res.json({ success: true, message: 'Đã đánh dấu đã đọc báo cáo AI thành công' });
  } catch (err) {
    console.error('Error marking AI briefing read:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── TRUNG TÂM ĐIỀU KHIỂN ─────────────────────────────────────────────────────
// Một lần gọi cho cả màn: khách thật (bản đồ), sức khoẻ, an ninh, lỗi, thao tác
// admin, công tắc — và danh sách "cần để ý" suy ra từ chính các số đó.
const DAY_MS = 24 * 60 * 60 * 1000;

router.get('/control', requireAdmin, async (req, res, next) => {
  try {
    const [
      { visitorSnapshot }, { securityHash }, { getSystemSettings, SWITCHES }, { edgeFirewallEnabled },
      SecurityModeration, SecurityBlock, SecurityEvent, AdminAuditLog,
    ] = await Promise.all([
      import('../../services/visitorTracker.js'), import('../../services/securityEnforcement.js'),
      import('../../utils/systemSettings.js'), import('../../services/cloudflareFirewall.js'),
      ...['SecurityModeration', 'SecurityBlock', 'SecurityEvent', 'AdminAuditLog'].map((m) => import(`../../models/${m}.js`).then((x) => x.default)),
    ]);
    const now = new Date();
    const dayAgo = new Date(Date.now() - DAY_MS);
    const activeBlock = { $or: [{ permanent: true }, { expiresAt: { $gt: now } }] };
    const [users, newUsers24h, errors24h, pending, blocks, events24h, recentEvents, hotIps, errors, audit, settings] = await Promise.all([
      Bio.estimatedDocumentCount(),
      Bio.countDocuments({ createdAt: { $gte: dayAgo } }),
      ErrorLog.countDocuments({ level: 'error', createdAt: { $gte: dayAgo } }),
      SecurityModeration.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(20).lean(),
      SecurityBlock.find(activeBlock).sort({ updatedAt: -1 }).limit(50).lean(),
      SecurityEvent.countDocuments({ createdAt: { $gte: dayAgo } }),
      SecurityEvent.find().sort({ createdAt: -1 }).limit(15).lean(),
      SecurityEvent.distinct('ipHash', { createdAt: { $gte: dayAgo } }),
      ErrorLog.find({ level: 'error' }).sort({ createdAt: -1 }).limit(8).lean(),
      AdminAuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
      getSystemSettings(),
    ]);

    // Nối khách với an ninh: IP đang bị chặn / vừa gây sự kiện trong 24h.
    const blockedIps = new Set(blocks.filter((b) => b.subjectType === 'ip').map((b) => b.subjectHash));
    const flagged = new Set(hotIps);
    const visitors = visitorSnapshot();
    visitors.visitors = visitors.visitors.map((v) => {
      const hash = securityHash('ip', v.ip);
      return { ...v, blocked: blockedIps.has(hash), flagged: flagged.has(hash) };
    });

    const quota = getQuotaStatus();
    const attention = [];
    const oldPending = pending.filter((p) => Date.now() - new Date(p.createdAt) > 60 * 60 * 1000).length;
    if (pending.length) attention.push({ level: oldPending ? 'high' : 'medium', target: 'security', text: `${pending.length} ca an ninh chờ duyệt${oldPending ? `, ${oldPending} ca đã chờ quá 1 giờ` : ''}.` });
    if (errors24h >= 20) attention.push({ level: 'high', target: 'errors', text: `${errors24h} lỗi máy chủ trong 24 giờ — xem lỗi lặp lại nhiều nhất.` });
    else if (errors24h) attention.push({ level: 'low', target: 'errors', text: `${errors24h} lỗi máy chủ trong 24 giờ.` });
    if ((quota?.level || 0) >= 0.8) attention.push({ level: 'high', target: 'health', text: `AI đã dùng ${Math.round(quota.level * 100)}% hạn mức hôm nay; chạm trần là tự dừng.` });
    const flaggedOnline = visitors.visitors.filter((v) => v.online && v.flagged && !v.blocked).length;
    if (flaggedOnline) attention.push({ level: 'high', target: 'visitors', text: `${flaggedOnline} khách đang online từng gây sự kiện an ninh hôm nay — cân nhắc chặn.` });
    if (visitors.bots > visitors.total / 2 && visitors.total > 20) attention.push({ level: 'medium', target: 'visitors', text: `Hơn nửa lượt truy cập 24h là bot / máy chủ thuê (${visitors.bots}/${visitors.total}).` });
    if (settings.maintenanceMode) attention.push({ level: 'medium', target: 'switches', text: 'Chế độ bảo trì đang BẬT — người dùng không vào được app.' });
    const rssMb = Math.round(process.memoryUsage().rss / 1048576);
    if (rssMb > 420) attention.push({ level: 'high', target: 'health', text: `Máy chủ dùng ${rssMb} MB RAM — gần trần 512 MB của Render free.` });

    res.json({
      success: true,
      attention,
      visitors,
      health: {
        users, newUsers24h, errors24h, quota,
        uptimeSec: Math.round(process.uptime()),
        rssMb,
        db: ['ngắt', 'ổn', 'đang nối', 'đang ngắt'][mongoose.connection.readyState] || 'không rõ',
      },
      security: {
        pending,
        events24h,
        recentEvents,
        blocks: blocks.map((b) => ({ id: b._id, subjectType: b.subjectType, reasonCode: b.reasonCode, permanent: b.permanent, expiresAt: b.expiresAt, lockCount: b.lockCount, edgeIp: b.edgeIp, caseId: b.lastCaseId, updatedAt: b.updatedAt })),
        edgeFirewall: edgeFirewallEnabled(),
      },
      errors,
      audit,
      switches: Object.fromEntries(SWITCHES.map((k) => [k, k.startsWith('allow') ? settings[k] !== false : Boolean(settings[k])])),
    });
  } catch (err) { next(err); }
});

router.post('/control/switches', requireAdmin, async (req, res, next) => {
  try {
    const { setSystemSwitches } = await import('../../utils/systemSettings.js');
    const result = await setSystemSwitches(req.body || {});
    if (!result) return res.status(400).json({ error: 'Không có công tắc hợp lệ.' });
    await logAdminAuditAction(req, 'switch_system', null, '', result.changed.map((k) => `${k}=${req.body[k]}`).join(', '));
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// Thử thách Cloudflare cho mọi người lạ mở trang (rule khẩn cấp, cloudflareFirewall.js).
router.post('/control/emergency', requireAdmin, async (req, res, next) => {
  try {
    const { setEmergencyChallenge } = await import('../../services/cloudflareFirewall.js');
    const on = Boolean(req.body?.on);
    const result = await setEmergencyChallenge(on);
    if (!result.edge) return res.status(409).json({ error: result.error || 'Chưa cấu hình Cloudflare (token cần quyền Config Rules: Edit).' });
    await logAdminAuditAction(req, 'emergency_challenge', null, '', on ? 'bật' : 'tắt');
    res.json({ success: true, on });
  } catch (err) { next(err); }
});

// Chặn một IP từ bản đồ khách: tầng ứng dụng + tường lửa Cloudflare nếu có token.
router.post('/security/block-ip', requireAdmin, async (req, res, next) => {
  try {
    const ip = String(req.body?.ip || '').trim().replace(/^::ffff:/, '');
    const days = [1, 7, 30].includes(Number(req.body?.days)) ? Number(req.body.days) : 7;
    if (!/^[\d.:a-f]{3,45}$/i.test(ip)) return res.status(400).json({ error: 'IP không hợp lệ.' });
    const { applyActorBlock } = await import('../../services/securityEnforcement.js');
    const { blockIpAtEdge } = await import('../../services/cloudflareFirewall.js');
    const SecurityBlock = (await import('../../models/SecurityBlock.js')).default;
    const caseId = `ADM-${Date.now().toString(36).toUpperCase()}`;
    const block = await applyActorBlock({ ip, caseId, reasonCode: 'admin_manual', durationMs: days * DAY_MS, escalate: false });
    const edge = await blockIpAtEdge(ip, `Hugo admin ${req.admin.email}: ${caseId}`);
    if (block && edge.edge) await SecurityBlock.updateOne({ _id: block._id }, { $set: { edgeIp: ip, edgeRuleId: edge.ruleId || '' } });
    await logAdminAuditAction(req, 'block_ip', null, '', `${ip} · ${days} ngày${edge.edge ? ' · Cloudflare' : ''}`);
    res.json({ success: true, edge: Boolean(edge.edge), message: `Đã chặn ${ip} ${days} ngày${edge.edge ? ' (cả tường lửa Cloudflare)' : ''}.` });
  } catch (err) { next(err); }
});

router.post('/security/resolve-moderation', requireAdmin, async (req, res) => {
  try {
    const { caseId, action } = req.body || {};
    if (!caseId || !['approve', 'dismiss'].includes(action)) {
      return res.status(400).json({ error: 'Yêu cầu không hợp lệ' });
    }

    const SecurityModeration = (await import('../../models/SecurityModeration.js')).default;
    const mod = await SecurityModeration.findOne({ caseId });
    if (!mod) return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });

    if (action === 'approve') {
      const { applyActorBlock } = await import('../../services/securityEnforcement.js');
      await applyActorBlock({ ip: mod.ip, email: mod.email, phone: mod.phone, caseId: mod.caseId, reasonCode: mod.category });
      mod.status = 'approved';
    } else {
      mod.status = 'dismissed';
    }
    mod.decidedBy = req.admin?.email || 'Admin_Panel';
    mod.decidedAt = new Date();
    await mod.save();
    await logAdminAuditAction(req, action === 'approve' ? 'security_approve' : 'security_dismiss', null, mod.email || '', `${mod.caseId} · ${mod.category}`);

    res.json({ success: true, message: action === 'approve' ? 'Đã thực thi khóa 24h' : 'Đã bỏ qua ca vi phạm' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/security/unblock-actor', requireAdmin, async (req, res, next) => {
  try {
    const { blockId } = req.body || {};
    if (!mongoose.isValidObjectId(blockId)) return res.status(400).json({ error: 'Thiếu mã lệnh chặn.' });
    const { revokeSecurityBlock } = await import('../../services/securityEnforcement.js');
    const block = await revokeSecurityBlock(blockId);
    if (!block) return res.status(404).json({ error: 'Không tìm thấy lệnh chặn.' });
    if (block.edgeIp || block.edgeRuleId) {
      const { unblockIpAtEdge } = await import('../../services/cloudflareFirewall.js');
      await unblockIpAtEdge({ ip: block.edgeIp, ruleId: block.edgeRuleId });
    }
    await logAdminAuditAction(req, 'unblock', blockId, '', `${block.subjectType} · ${block.reasonCode}`);
    res.json({ success: true, message: 'Đã gỡ chặn.' });
  } catch (err) { next(err); }
});

export default router;
