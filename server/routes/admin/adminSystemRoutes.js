// Hệ thống: tổng quan, nhật ký, bảo mật, hàng đợi, AI — router con của /api/admin (mount trong routes/adminRoutes.js).
import express from 'express';
import { buildWorkQueue } from '../../services/adminWorkQueue.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';
import path from 'path';
import mongoose from 'mongoose';
import Bio from '../../models/Bio.js';
import { getQuotaStatus, generate } from '../../services/aiGateway.js';
import ErrorLog from '../../models/ErrorLog.js';
import { getDirSize, localFallbackInterpret, logAdminAuditAction, __dirname } from './adminShared.js';

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

// POST /admin/interpret-command (admin) - Sử dụng AI để hiểu câu lệnh tự nhiên của Admin
router.post('/interpret-command', requireAdmin, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Nội dung câu lệnh trống' });
    }

    // Try local rule engine first to get instantaneous response (0ms) and save API quota
    const localResult = localFallbackInterpret(text);
    if (localResult && localResult.intent !== 'unknown') {
      return res.json(localResult);
    }

    const systemInstruction = `You are a command parser AI for the Hugo Studio Admin Panel.
Given a natural language input or command from the administrator, analyze their intent and extract the relevant arguments.
Analyze the input text to map it to one of these intents:
- "create-joy-voucher": to create a JOY gift card. Examples: "tạo voucher 1000", "tạo mã joy card 500".
- "send-joy-direct": to send/award JOY points directly to a user's account by email. Examples: "gửi 500 joy trực tiếp đến phucphgcs230327@fpt.edu.vn", "gửi trực tiếp 2000 joy cho test@gmail.com".
- "create-payment": to generate a PayOS checkout link. Examples: "tạo link thanh toán 50k", "tạo mã qr thanh toán 100000 cho phucphgcs230327@fpt.edu.vn", "tạo yêu cầu chuyển khoản đến phucphgcs230327@fpt.edu.vn 50k".
- "create-package-template": to create a new service package template. Examples: "tạo gói dịch vụ VIP 30 ngày", "tạo gói mới Sinh Viên 12 tháng".
- "send-package-user": to assign/send a service package to a user's Bio. Examples: "gửi gói VIP 30 ngày cho phucphgcs230327@fpt.edu.vn", "giao gói Premium 12 tháng đến test@gmail.com".
- "delete-user": to delete a member profile. Examples: "xóa tài khoản phucphgcs230327@fpt.edu.vn", "xóa user phucphgcs230327@fpt.edu.vn".
- "delete-package-template": to delete a service package template. Examples: "xóa gói dịch vụ VIP", "xóa gói VIP".
- "delete-voucher": to delete a JOY voucher card. Examples: "xóa voucher BDAY-07-XYZ", "hủy voucher JOY-XYZ".
- "delete-user-package": to remove an assigned package from a user. Examples: "xóa gói của user phucphgcs230327@fpt.edu.vn", "xóa gói VIP khỏi test@gmail.com".
- "stats": to view system stats. Examples: "xem thông số", "stats", "thống kê hệ thống".
- "users": to list or search users. Examples: "danh sách user", "tìm thành viên alice", "users".
- "lock": to lock a member. Examples: "khóa tài khoản member@test.com", "lock phucphgcs230327@fpt.edu.vn".
- "unlock": to unlock a member. Examples: "mở khóa tài khoản member@test.com", "unlock phucphgcs230327@fpt.edu.vn".
- "clean-logs": to clear server-cached errors. Examples: "clean logs", "dọn dẹp logs", "xóa log sự cố".
- "clear": to clear the terminal screen. Examples: "clear", "xóa màn hình".
- "help": to view help. Examples: "help", "trợ giúp", "hướng dẫn".

Return ONLY a valid JSON object matching the following structure (no markdown formatting, no code block tick marks):
{
  "intent": "create-joy-voucher" | "send-joy-direct" | "create-payment" | "create-package-template" | "send-package-user" | "delete-user" | "delete-package-template" | "delete-voucher" | "delete-user-package" | "stats" | "users" | "lock" | "unlock" | "bot" | "clean-logs" | "clear" | "help" | "unknown",
  "amount": number, // (optional) extracted amount, value, or duration (in days or months) as integer. If "50k", convert to 50000. If "12 tháng", convert to 12. If "30 ngày", convert to 30.
  "durationUnit": "days" | "months", // (optional) unit for package duration (default "days" if "ngày", "months" if "tháng")
  "recipient": "string", // (optional) email, phone, slug or "All". Extract email address or phone or slug.
  "reason": "string", // (optional) note, reason, or message for payment/voucher
  "botState": "on" | "off", // (optional) state for bot
  "query": "string" // (optional) search query, package name, or code to delete
}

Be smart:
- For input "/create-joy-voucher1000/for-phucphgcs230327@fpt.edu.vn", intent is "create-joy-voucher", amount is 1000, recipient is "phucphgcs230327@fpt.edu.vn", reason is "Tạo cho phucphgcs230327@fpt.edu.vn".
- For input "tạo voucher 1000", amount is 1000.
- For input "gửi 500 joy trực tiếp đến phucphgcs230327@fpt.edu.vn", intent is "send-joy-direct", amount is 500, recipient is "phucphgcs230327@fpt.edu.vn".
- For input "tạo gói dịch vụ VIP 30 ngày", intent is "create-package-template", query is "VIP", amount is 30, durationUnit is "days".
- For input "gửi gói VIP 30 ngày cho phucphgcs230327@fpt.edu.vn", intent is "send-package-user", query is "VIP", amount is 30, recipient is "phucphgcs230327@fpt.edu.vn".
- For input "xóa tài khoản test@gmail.com", intent is "delete-user", recipient is "test@gmail.com".
- If you cannot recognize the intent, return "intent": "unknown".`;

    let responseText;
    try {
      responseText = await generate(text, {
        systemInstruction,
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });
    } catch (aiErr) {
      console.warn('[AI CLI] Gemini call failed, falling back to local regex parser:', aiErr.message);
    }

    if (!responseText) {
      // If AI fails and we haven't already returned the local result, return it now
      console.log('[AI CLI Fallback] Result:', localResult);
      return res.json(localResult);
    }

    const parsed = JSON.parse(responseText.trim());
    res.json(parsed);
  } catch (error) {
    console.error('Interpret command error:', error);
    try {
      const fallbackResult = localFallbackInterpret(req.body.text);
      console.log('[AI CLI Fallback after catch] Result:', fallbackResult);
      return res.json(fallbackResult);
    } catch {
      res.status(500).json({ error: error.message });
    }
  }
});

// GET /admin/iot/devices (admin) - Danh sách thiết bị IoT
router.get('/iot/devices', requireAdmin, async (req, res) => {
  try {
    const IoTDevice = (await import('../models/IoTDevice.js')).default;
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
    const IoTDevice = (await import('../models/IoTDevice.js')).default;
    const dev = await IoTDevice.findOne({ deviceId });
    if (!dev) return res.status(404).json({ error: 'Không tìm thấy thiết bị IoT' });
    dev.isActive = !dev.isActive;
    await dev.save();
    res.json({ success: true, message: `Thiết bị ${dev.deviceName} đã được ${dev.isActive ? 'Kích hoạt' : 'Hủy kích hoạt'}`, device: dev });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

// GET /admin/audit-logs - Lấy danh sách nhật ký kiểm toán hành động quản trị
router.get('/audit-logs', requireAdmin, async (req, res) => {
  try {
    const AdminAuditLog = (await import('../models/AdminAuditLog.js')).default;
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const logs = await AdminAuditLog.find().sort({ timestamp: -1 }).limit(limit).lean();
    res.json({ success: true, logs });
  } catch (err) {
    console.error('Error fetching admin audit logs:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/brain/auto-moderator/scan - AI Quét tự động rủi ro an ninh & biến động JOY
router.get('/brain/auto-moderator/scan', requireAdmin, async (req, res) => {
  try {
    const { runAutoModerationScan } = await import('../services/adminBrainService.js');
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
    const Bio = (await import('../models/Bio.js')).default;
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
    const { getPendingBriefing } = await import('../services/aiSupportAdminService.js');
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
    const { markBriefingReported } = await import('../services/aiSupportAdminService.js');
    const { logIds } = req.body || {};
    await markBriefingReported(logIds);
    res.json({ success: true, message: 'Đã đánh dấu đã đọc báo cáo AI thành công' });
  } catch (err) {
    console.error('Error marking AI briefing read:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── BOT SECURITY SENTINEL TELEMETRY ROUTES ──────────────────────────────────
router.get('/security/sentinel-summary', requireAdmin, async (req, res) => {
  try {
    const SecurityModeration = (await import('../models/SecurityModeration.js')).default;
    const SecurityBlock = (await import('../models/SecurityBlock.js')).default;
    const SecurityEvent = (await import('../models/SecurityEvent.js')).default;

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [pendingCount, activeBlocksCount, events24hCount, pendingModerations, activeBlocks, recentEvents] = await Promise.all([
      SecurityModeration.countDocuments({ status: 'pending' }),
      SecurityBlock.countDocuments(),
      SecurityEvent.countDocuments({ createdAt: { $gte: since24h } }),
      SecurityModeration.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(20).lean(),
      SecurityBlock.find().sort({ createdAt: -1 }).limit(50).lean(),
      SecurityEvent.find().sort({ createdAt: -1 }).limit(30).lean(),
    ]);

    res.json({
      success: true,
      pendingCount,
      activeBlocksCount,
      events24hCount,
      pendingModerations,
      activeBlocks,
      recentEvents,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/security/resolve-moderation', requireAdmin, async (req, res) => {
  try {
    const { caseId, action } = req.body || {};
    if (!caseId || !['approve', 'dismiss'].includes(action)) {
      return res.status(400).json({ error: 'Yêu cầu không hợp lệ' });
    }

    const SecurityModeration = (await import('../models/SecurityModeration.js')).default;
    const mod = await SecurityModeration.findOne({ caseId });
    if (!mod) return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });

    if (action === 'approve') {
      const { applyActorBlock } = await import('../services/securityEnforcement.js');
      await applyActorBlock({ ip: mod.ip, email: mod.email, phone: mod.phone, caseId: mod.caseId, reasonCode: mod.category });
      mod.status = 'approved';
    } else {
      mod.status = 'dismissed';
    }
    mod.decidedBy = req.admin?.username || 'Admin_Panel';
    mod.decidedAt = new Date();
    await mod.save();

    res.json({ success: true, message: action === 'approve' ? 'Đã thực thi khóa 24h' : 'Đã bỏ qua ca vi phạm' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/security/unblock-actor', requireAdmin, async (req, res) => {
  try {
    const { blockId, actorKey } = req.body || {};
    const SecurityBlock = (await import('../models/SecurityBlock.js')).default;

    let query = {};
    if (blockId) query = { _id: blockId };
    else if (actorKey) query = { actorKey };
    else return res.status(400).json({ error: 'Thiếu thông tin unblock' });

    const deleted = await SecurityBlock.deleteMany(query);
    res.json({ success: true, deletedCount: deleted.deletedCount, message: 'Đã giải khóa thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
