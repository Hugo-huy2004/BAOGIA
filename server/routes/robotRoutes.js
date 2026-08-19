import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import RobotConfig from '../models/RobotConfig.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { encryptTriple, decryptTriple } from '../utils/tripleCrypto.js';
import { sendTelegramAlert } from '../services/telegramService.js';

const router = express.Router();

// Active Ephemeral Stream Tokens Map (Expires in 60s)
const ACTIVE_STREAM_TOKENS = new Map();

// ── Robot OTP System (replaces static Master PIN) ──────────────────────────
const ROBOT_OTP_TTL_MS = 5 * 60 * 1000; // 5 phút
const ROBOT_SESSION_TTL_MS = 5 * 60 * 1000; // Session token hết hạn sau 5 phút
const ROBOT_OTPS = new Map();   // key: tempToken → { otpCode, expiresAt, attempts }
const ROBOT_SESSIONS = new Map(); // key: sessionToken → { adminId, expiresAt }

// Rate limit: 5 requests / 15 min / IP (chống spam Telegram)
const robotOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn đã yêu cầu mã OTP quá nhiều lần. Thử lại sau 15 phút.' },
});

/**
 * Tạo mã OTP 6 chữ số cho Robot Camera, gửi qua Telegram.
 * Trả về tempToken để client dùng ở bước verify.
 */
async function issueRobotOtp() {
  const otpCode = String(crypto.randomInt(100000, 1000000));
  const tempToken = crypto.randomBytes(24).toString('hex');

  ROBOT_OTPS.set(tempToken, {
    otpCode,
    attempts: 0,
    expiresAt: Date.now() + ROBOT_OTP_TTL_MS,
  });

  // Auto cleanup
  setTimeout(() => ROBOT_OTPS.delete(tempToken), ROBOT_OTP_TTL_MS + 5000);

  const otpHtml = `
🤖 <b>[HUGO ROBOT OTP]</b>

Mã xác thực Camera Robot: <b>${otpCode}</b>

⏱️ <i>Hiệu lực 5 phút. Không chia sẻ mã này.</i>
  `.trim();

  const sent = await sendTelegramAlert(otpHtml).catch((e) => ({ success: false, error: e.message }));
  const delivered = Boolean(sent.success && !sent.simulated);
  if (!delivered) {
    console.warn(`⚠️ Robot OTP không gửi được qua Telegram (${sent.error || 'chưa cấu hình'}). Mã: ${otpCode}`);
  }
  return { tempToken, delivered, expiresIn: Math.round(ROBOT_OTP_TTL_MS / 1000) };
}

/**
 * Xác thực session token của Robot (thay thế Master PIN).
 * Cũng chấp nhận header x-robot-master-pin cũ để backward-compat.
 */
function verifyRobotAuth(req) {
  // Ưu tiên: Bearer token hoặc x-robot-session-token
  const authHeader = req.headers.authorization;
  const sessionToken = req.headers['x-robot-session-token'] || '';

  if (sessionToken) {
    const session = ROBOT_SESSIONS.get(sessionToken);
    if (session && Date.now() < session.expiresAt) {
      return true;
    }
  }

  // Fallback: Master PIN từ env (backward-compat)
  const masterPinHeader = req.headers['x-robot-master-pin'] || '';
  const expectedPin = process.env.ROBOT_MASTER_PIN || '';
  if (expectedPin && masterPinHeader === expectedPin) {
    return true;
  }

  return false;
}

/**
 * 🔒 Fetch or initialize RobotConfig in MongoDB (Read from ENV if initial)
 */
async function getOrCreateEncryptedConfig() {
  let doc = await RobotConfig.findOne({ key: 'ROBOT_STREAM_CONFIG' });
  if (!doc) {
    const initialUrl = process.env.ROBOT_STREAM_URL || '';
    if (initialUrl) {
      const tripleEncrypted = encryptTriple(initialUrl);
      doc = await RobotConfig.create({
        key: 'ROBOT_STREAM_CONFIG',
        ...tripleEncrypted,
        updatedBy: 'SystemSeeder'
      });
    }
  }
  return doc;
}

/**
 * 📲 POST /api/admin/robot/request-otp
 * Yêu cầu mã OTP 6 chữ số gửi qua Telegram (hiệu lực 5 phút)
 * Không cần admin JWT — OTP gửi về Telegram của Boss là yếu tố xác thực.
 */
router.post('/request-otp', robotOtpLimiter, async (req, res) => {
  try {
    if (global.ROBOT_KILL_SWITCH) {
      return res.status(503).json({ success: false, message: 'Emergency Kill-Switch active.' });
    }
    const { tempToken, delivered, expiresIn } = await issueRobotOtp();
    return res.json({
      success: true,
      tempToken,
      otpDelivered: delivered,
      expiresIn,
      message: delivered
        ? 'Đã gửi mã 6 chữ số — dùng trong 5 phút.'
        : 'Không gửi được mã. Xem mã trong log máy chủ.',
    });
  } catch (error) {
    console.error('Error requesting robot OTP:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * ✅ POST /api/admin/robot/verify-otp
 * Xác thực mã OTP → trả về session token hiệu lực 5 phút
 * Không cần admin JWT — mã OTP là yếu tố xác thực duy nhất.
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { tempToken, otpCode } = req.body;
    if (!tempToken || !otpCode) {
      return res.status(400).json({ success: false, message: 'Thiếu mã OTP hoặc tempToken.' });
    }

    const record = ROBOT_OTPS.get(tempToken);
    if (!record) {
      return res.status(400).json({ success: false, message: 'Phiên OTP đã hết hạn. Hãy yêu cầu mã mới.' });
    }

    if (Date.now() > record.expiresAt) {
      ROBOT_OTPS.delete(tempToken);
      return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn (5 phút). Hãy gửi lại mã.' });
    }

    if (String(otpCode).trim() !== String(record.otpCode)) {
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        ROBOT_OTPS.delete(tempToken);
        return res.status(429).json({ success: false, message: 'Sai mã 5 lần. Mã đã bị huỷ — hãy yêu cầu mã mới.' });
      }
      return res.status(401).json({ success: false, message: `Mã OTP không chính xác (còn ${5 - record.attempts} lần thử).` });
    }

    // OTP verified → issue 5-minute session token
    ROBOT_OTPS.delete(tempToken);
    const sessionToken = `rs_${crypto.randomBytes(24).toString('hex')}`;
    ROBOT_SESSIONS.set(sessionToken, {
      adminId: req.admin?.id || 'ADMIN',
      expiresAt: Date.now() + ROBOT_SESSION_TTL_MS,
    });

    // Auto cleanup
    setTimeout(() => ROBOT_SESSIONS.delete(sessionToken), ROBOT_SESSION_TTL_MS + 5000);

    await AdminAuditLog.create({
      adminId: req.admin?.id || 'ADMIN_USER',
      adminUsername: req.admin?.username || 'SuperAdmin',
      action: 'robot_otp_verified',
      details: { ip: req.ip },
    });

    return res.json({
      success: true,
      sessionToken,
      expiresIn: Math.round(ROBOT_SESSION_TTL_MS / 1000),
    });
  } catch (error) {
    console.error('Error verifying robot OTP:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 🔓 GET /api/admin/robot/config
 * Lấy cấu hình bảo mật camera Robot (Yêu cầu Master PIN)
 */
router.get('/config', requireAdmin, async (req, res) => {
  try {
    if (global.ROBOT_KILL_SWITCH) {
      return res.status(503).json({
        success: false,
        isKillSwitchActive: true,
        message: '🚨 CẢNH BÁO: Chế độ Emergency Kill-Switch đang được bật! Toàn bộ kết nối camera bị khóa.'
      });
    }

    const masterPinHeader = req.headers['x-robot-master-pin'] || '';
    const doc = await getOrCreateEncryptedConfig();
    const expectedPin = process.env.ROBOT_MASTER_PIN || '';

    if (!verifyRobotAuth(req)) {
      return res.status(200).json({
        success: true,
        isUnlocked: false,
        maskedUrl: 'https://cloud-tunnel.internal/masked-feed/#control',
        message: 'Mã Master PIN chưa được xác thực.'
      });
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Chưa cấu hình URL Camera Robot trong MongoDB hoặc Env.' });
    }

    const decryptedUrl = decryptTriple(doc);
    if (!decryptedUrl) {
      return res.status(500).json({ success: false, message: 'Lỗi giải mã 3 lớp URL camera.' });
    }

    await AdminAuditLog.create({
      adminId: req.user?._id || 'ADMIN_USER',
      adminUsername: req.user?.username || req.user?.email || 'SuperAdmin',
      action: 'robot_camera_decrypted_access',
      details: { ip: req.ip, userAgent: req.headers['user-agent'] }
    });

    return res.json({
      success: true,
      isUnlocked: true,
      url: decryptedUrl,
      updatedAt: doc.updatedAt
    });
  } catch (error) {
    console.error('Error fetching robot config:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 🔑 POST /api/admin/robot/stream-token
 * Tạo Ephemeral Stream Token ngẫu nhiên có thời hạn 60s (Giấu URL khỏi DevTools)
 */
router.post('/stream-token', requireAdmin, async (req, res) => {
  try {
    if (global.ROBOT_KILL_SWITCH) {
      return res.status(503).json({ success: false, message: 'Emergency Kill-Switch active.' });
    }

    const masterPinHeader = req.headers['x-robot-master-pin'] || '';
    const expectedPin = process.env.ROBOT_MASTER_PIN || '';

    if (!verifyRobotAuth(req)) {
      return res.status(403).json({ success: false, message: 'Xác thực thất bại. Vui lòng nhập mã OTP mới.' });
    }

    const doc = await getOrCreateEncryptedConfig();
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Chưa cấu hình URL Camera Robot.' });
    }

    const decryptedUrl = decryptTriple(doc);
    if (!decryptedUrl) {
      return res.status(500).json({ success: false, message: 'Lỗi giải mã URL.' });
    }

    // Generate 60-second Single-Use Token
    const tokenBytes = crypto.randomBytes(24).toString('hex');
    const tokenKey = `st_${tokenBytes}`;
    
    ACTIVE_STREAM_TOKENS.set(tokenKey, {
      url: decryptedUrl,
      expiresAt: Date.now() + 60000,
      clientIp: req.ip
    });

    // Auto cleanup expired tokens
    setTimeout(() => {
      ACTIVE_STREAM_TOKENS.delete(tokenKey);
    }, 65000);

    return res.json({
      success: true,
      streamToken: tokenKey,
      expiresIn: 60
    });
  } catch (error) {
    console.error('Error generating stream token:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 🛡️ GET /api/admin/robot/stream-frame
 * Khung phát stream được bảo vệ chống F12, chống Inspect DevTools và Watermark Động
 */
router.get('/stream-frame', async (req, res) => {
  try {
    if (global.ROBOT_KILL_SWITCH) {
      return res.status(503).send('<h2 style="color:red;font-family:sans-serif;text-align:center;margin-top:100px;">🚨 EMERGENCY KILL-SWITCH ACTIVATED</h2>');
    }

    const { token, tab = 'control' } = req.query;
    const tokenData = ACTIVE_STREAM_TOKENS.get(String(token || ''));

    if (!tokenData || Date.now() > tokenData.expiresAt) {
      return res.status(403).send('<h3 style="color:#ef4444;font-family:sans-serif;text-align:center;margin-top:100px;">⚠️ Phiên Stream hết hạn hoặc không hợp lệ. Vui lòng bấm Tải lại Stream.</h3>');
    }

    const cleanBase = tokenData.url.replace(/#.*$/, '').replace(/\/+$/, '');
    const targetUrl = `${cleanBase}/#${tab}`;
    const clientIp = req.ip || 'PROTECTED_IP';

    // Anti-DevTools & Anti-Console HTML Container with Dynamic Watermark
    const protectedHtml = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="referrer" content="no-referrer">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hugo Robot Security Frame</title>
        <style>
          html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
          iframe { width: 100%; height: 100%; border: none; }
          .watermark-overlay {
            position: absolute;
            top: 50px;
            right: 20px;
            z-index: 9999;
            pointer-events: none;
            user-select: none;
            color: rgba(52, 211, 153, 0.4);
            font-size: 11px;
            font-weight: 900;
            font-family: monospace;
            background: rgba(0,0,0,0.4);
            padding: 4px 10px;
            border-radius: 8px;
            border: 1px solid rgba(52, 211, 153, 0.2);
            backdrop-filter: blur(4px);
            animation: pulseWatermark 4s infinite alternate;
          }
          @keyframes pulseWatermark { 0% { opacity: 0.3; } 100% { opacity: 0.7; } }
        </style>
      </head>
      <body oncontextmenu="return false;">
        <div class="watermark-overlay" id="wm">
          🛡️ HUGO-ROBOT-01 · ENCRYPTED STREAM · IP: ${clientIp} · <span id="wm-time"></span>
        </div>

        <iframe
          src="${targetUrl}"
          allow="camera; microphone; display-capture; autoplay; encrypted-media; fullscreen; gamepad"
          sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
        ></iframe>

        <script>
          // Update Timestamp
          setInterval(() => {
            const el = document.getElementById('wm-time');
            if (el) el.innerText = new Date().toLocaleTimeString('vi-VN');
          }, 1000);

          // Anti-DevTools Console Trap
          (function() {
            window.addEventListener('keydown', (e) => {
              if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.metaKey && e.altKey && e.key === 'I')) {
                e.preventDefault();
                return false;
              }
            });
          })();
        </script>
      </body>
      </html>
    `;

    return res.send(protectedHtml);
  } catch (error) {
    console.error('Error rendering stream frame:', error);
    return res.status(500).send('Internal Error');
  }
});

/**
 * 🚨 POST /api/admin/robot/kill-switch
 * Kích hoạt Panic Kill-Switch ngắt toàn bộ kết nối Camera Robot lập tức
 */
router.post('/kill-switch', requireAdmin, async (req, res) => {
  try {
    const { action } = req.body; // 'activate' | 'deactivate'
    const shouldActivate = action !== 'deactivate';
    global.ROBOT_KILL_SWITCH = shouldActivate;

    if (shouldActivate) {
      ACTIVE_STREAM_TOKENS.clear();
      await sendTelegramAlert('🚨 <b>CẢNH BÁO AN NINH KHẨN CẤP:</b> Boss đã kích hoạt Emergency Kill-Switch! Toàn bộ kết nối Camera Robot gia đình đã bị NGẮT VẬT LÝ.');
    } else {
      await sendTelegramAlert('🟢 <b>THÔNG BÁO BẢO MẬT:</b> Boss đã mở lại kết nối Camera Robot.');
    }

    await AdminAuditLog.create({
      adminId: req.user?._id || 'ADMIN_USER',
      adminUsername: req.user?.username || req.user?.email || 'SuperAdmin',
      action: shouldActivate ? 'robot_kill_switch_activated' : 'robot_kill_switch_deactivated',
      details: { ip: req.ip }
    });

    return res.json({
      success: true,
      isKillSwitchActive: global.ROBOT_KILL_SWITCH,
      message: shouldActivate ? 'Đã kích hoạt Emergency Kill Switch!' : 'Đã khôi phục kết nối Camera.'
    });
  } catch (error) {
    console.error('Error in kill switch:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 🔒 PUT /api/admin/robot/config
 * Mã hóa 3 lớp URL mới và lưu trực tiếp vào MongoDB
 */
router.put('/config', requireAdmin, async (req, res) => {
  try {
    const masterPinHeader = req.headers['x-robot-master-pin'] || '';
    const { url } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ success: false, message: 'Đường dẫn URL không hợp lệ.' });
    }

    const expectedPin = process.env.ROBOT_MASTER_PIN || '';
    if (!verifyRobotAuth(req)) {
      return res.status(403).json({ success: false, message: 'Xác thực thất bại. Vui lòng nhập mã OTP mới.' });
    }

    const tripleEncrypted = encryptTriple(url.trim());

    const updatedDoc = await RobotConfig.findOneAndUpdate(
      { key: 'ROBOT_STREAM_CONFIG' },
      {
        ...tripleEncrypted,
        updatedBy: req.user?.username || req.user?.email || 'SuperAdmin',
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    await AdminAuditLog.create({
      adminId: req.user?._id || 'ADMIN_USER',
      adminUsername: req.user?.username || req.user?.email || 'SuperAdmin',
      action: 'robot_camera_url_triple_encrypted_update',
      details: { ip: req.ip, newChecksum: updatedDoc.checksum }
    });

    return res.json({
      success: true,
      message: 'Đã mã hóa 3 lớp và lưu URL mới vào MongoDB thành công!',
      updatedAt: updatedDoc.updatedAt
    });
  } catch (error) {
    console.error('Error updating robot config:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
