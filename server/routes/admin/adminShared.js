/**
 * Phần dùng chung của các route admin (hàm phụ, limiter, hằng số). Tách từ
 * adminRoutes.js cũ — mỗi thứ chỉ có MỘT bản ở đây nên các router con dùng chung
 * trạng thái (bộ đếm limiter, cache) như khi còn chung một tệp.
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import fs from 'fs/promises';
import path from 'path';
import AdminAuditLog from '../../models/AdminAuditLog.js';
import { resolveAdminPermissions } from '../../../shared/adminAccess.js';
import { CODER_STAGE_SEQUENCE } from '../../../shared/coderProgression.js';
import { fileURLToPath } from 'url';


// Thư mục của adminRoutes.js gốc: đường dẫn tương đối cũ ('../../public') giữ nguyên nghĩa.
export const __dirname = path.dirname(fileURLToPath(new URL('../adminRoutes.js', import.meta.url)));

// Username is hashed only as a lookup key (not a secret). Passwords used to be
// unsalted SHA-256 — fast and brute-forceable if the DB ever leaked. They're now
// bcrypt; verifyAndUpgrade() checks either scheme and transparently re-hashes a
// legacy SHA-256 record to bcrypt the first time its owner logs in.
export const sha256 = (message) => crypto.createHash('sha256').update(message).digest('hex');

export const isBcrypt = (h) => typeof h === 'string' && h.startsWith('$2');

// Exported so password migration logic stays reusable across admin flows.
// Mã băm bcrypt (cost 12) của một chuỗi vô nghĩa — chỉ để so khớp cho có khi
// không tìm thấy tài khoản, giữ thời gian phản hồi bằng nhánh có tài khoản.
export const TIMING_PAD_HASH = '$2b$12$qKHZeAUGgUCfhfemMzSrwu3B39G8u8eZgiJNYAKuVpouztnWBw9Yu';

export async function verifyAndUpgrade(admin, plainPassword) {
  if (isBcrypt(admin.password)) {
    return bcrypt.compare(plainPassword, admin.password);
  }
  // Legacy unsalted SHA-256 hex — constant-time compare, then upgrade on success.
  const legacy = sha256(plainPassword);
  const stored = admin.password || '';
  const ok = legacy.length === stored.length &&
    crypto.timingSafeEqual(Buffer.from(legacy), Buffer.from(stored));
  if (ok) {
    admin.password = await bcrypt.hash(plainPassword, 12);
    await admin.save();
  }
  return ok;
}

// Admin login is directly brute-forceable (unlike Google login) — cap attempts
// per IP. Kept loose in dev where the Vite proxy collapses every request to one IP.
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.' }
});

// Trần đoán OTP. Trước đây /verify-otp không có limiter nào: chặn duy nhất là
// bộ đếm 5 lần/token, nên chỉ cần xin token mới là đoán tiếp. Limiter này chặn
// luôn ở tầng IP để một máy không thể vừa xin token vừa đoán liên tục.
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều lần nhập mã. Vui lòng thử lại sau 15 phút.' }
});

/**
 * Phát một mã OTP mới cho tài khoản quản trị và gửi qua Telegram.
 *
 * Mã 6 chữ số (trước là 4): từ khi bỏ bước mật khẩu, OTP là lớp bảo vệ DUY
 * NHẤT, nên không gian đoán phải đủ rộng. Kèm theo đó là `attempts`: sai 5 lần
 * là huỷ mã, để không ai dò hết 10^6 khả năng trong 5 phút.
 */
export const OTP_TTL_MS = 30 * 1000;

export async function issueAdminOtp(admin) {
  const otpCode = String(crypto.randomInt(100000, 1000000));
  const tempToken = crypto.randomBytes(24).toString('hex');

  if (!global.ADMIN_2FA_OTPS) global.ADMIN_2FA_OTPS = new Map();
  // Quét rác trước khi thêm: mã hết hạn mà không ai gọi verify-otp thì nằm lại
  // trong Map vĩnh viễn. Trên máy 512MB của Render free đó là rò bộ nhớ chậm.
  const nowMs = Date.now();
  for (const [key, entry] of global.ADMIN_2FA_OTPS) {
    if (entry.expiresAt <= nowMs) global.ADMIN_2FA_OTPS.delete(key);
  }
  global.ADMIN_2FA_OTPS.set(tempToken, {
    adminId: admin._id,
    adminUsername: admin.username || 'admin',
    otpCode,
    attempts: 0,
    // 30 giây theo yêu cầu của chủ hệ thống: mã bị đọc lỏm trên màn hình khoá
    // điện thoại thì gần như không kịp dùng lại. Đổi số ở ĐÂY thôi — client đọc
    // hạn dùng từ `expiresIn` máy chủ trả về, không tự chép hằng số.
    expiresAt: Date.now() + OTP_TTL_MS,
  });

  const { sendTelegramAlert } = await import('../services/telegramService.js');
  const otpHtml = `
🔑 <b>[HUGO ADMIN OTP]</b>

Mã đăng nhập Admin Dashboard: <b>${otpCode}</b>

⏱️ <i>Hiệu lực 30 giây. Không chia sẻ mã này cho bất kỳ ai. Nếu không phải bạn yêu cầu, hãy bỏ qua.</i>
  `.trim();

  // ponytail: không nuốt lỗi — Telegram hỏng mà vẫn báo "đã gửi" thì Boss ngồi
  // chờ mã không bao giờ tới. Mã vẫn nằm trong log server để cứu hộ.
  const sent = await sendTelegramAlert(otpHtml).catch((e) => ({ success: false, error: e.message }));
  const delivered = Boolean(sent.success && !sent.simulated);
  if (!delivered) {
    console.warn(`⚠️ Admin OTP không gửi được qua Telegram (${sent.error || 'chưa cấu hình TELEGRAM_BOT_TOKEN/CHAT_ID'}). Mã: ${otpCode}`);
  }
  return { tempToken, delivered, expiresIn: Math.round(OTP_TTL_MS / 1000) };
}

export const ownerOnly = (req, res, next) => req.admin?.adminRole === 'owner'
  ? next()
  : res.status(403).json({ code: 'ADMIN_OWNER_REQUIRED', error: 'Chỉ Chủ hệ thống được quản lý tài khoản quản trị.' });

export const publicAdmin = (admin) => ({
  id: admin._id,
  displayName: admin.displayName || 'Quản trị viên',
  role: admin.role || 'owner',
  permissions: resolveAdminPermissions(admin.role || 'owner', admin.permissions || []),
  customPermissions: admin.permissions || [],
  active: admin.active !== false,
  createdAt: admin.createdAt,
  updatedAt: admin.updatedAt,
});

export const auditAdminAccount = (req, action, target) => AdminAuditLog.create({
  adminId: String(req.admin.id),
  adminUsername: req.admin.displayName || req.admin.id,
  action,
  targetEmail: String(target || ''),
  ipAddress: req.ip || '',
  userAgent: req.headers['user-agent'] || '',
}).catch((error) => console.error('[admin account audit]', error.message));

export async function getDirSize(dirPath) {
  let size = 0;
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        size += await getDirSize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        size += stats.size;
      }
    }
  } catch {
    // Ignore errors for missing directories
  }
  return size;
}

export const CODER_STEP_COUNT = CODER_STAGE_SEQUENCE.at(-1).to;

export function localFallbackInterpret(text) {
  const clean = text.toLowerCase().trim()
    .replace(/(\d+)([a-zA-Z]+)/g, "$1 $2")
    .replace(/([a-zA-Z]+)(\d+)/g, "$1 $2");

  const normalizedClean = clean.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
  const normalized = " " + normalizedClean.replace(/[^a-z0-9]/g, " ") + " ";

  const hasWord = (words) => {
    return words.some(w => {
      const normalizedWord = w.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
      return normalized.includes(` ${normalizedWord} `);
    });
  };

  let intent = "unknown";
  let amount = undefined;
  let recipient = undefined;
  let reason = undefined;
  let query = undefined;
  let botState = undefined;
  let durationUnit = undefined;

  // LOCK/UNLOCK
  if (hasWord(["khoa", "lock", "chan", "block", "dinh chi"])) {
    const match = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|0\d{9,10})/);
    if (match) recipient = match[0];
    
    if (hasWord(["dev", "lap trinh vien", "hugo team"])) {
      intent = "hugo-team";
      reason = "block-dev";
    } else {
      intent = hasWord(["mo", "unlock"]) ? "unlock" : "lock";
    }
  }
  // DELETIONS
  else if (hasWord(["xoa", "huy", "delete", "thu hoi", "remove", "go"])) {
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|0\d{9,10})/);
    if (matchEmail) {
      recipient = matchEmail[0];
      if (hasWord(["dev", "lap trinh vien", "hugo team"])) {
        intent = "hugo-team";
        reason = "delete-dev";
      } else {
        intent = hasWord(["goi", "package"]) ? "delete-user-package" : "delete-user";
        const pkgNames = ["vip", "premium", "gold", "silver", "basic", "trial", "sinh vien"];
        for (const name of pkgNames) {
          if (hasWord([name])) {
            query = name;
            break;
          }
        }
      }
    } else {
      if (hasWord(["goi", "package"])) {
        intent = "delete-package-template";
        const pkgNames = ["vip", "premium", "gold", "silver", "basic", "trial", "sinh vien"];
        for (const name of pkgNames) {
          if (hasWord([name])) {
            query = name;
            break;
          }
        }
      } else if (hasWord(["voucher", "ma", "code"])) {
        intent = "delete-voucher";
        const matchCode = text.match(/([a-zA-Z0-9-]{6,})/);
        if (matchCode) query = matchCode[0];
      }
    }
  }
  // HUGO TEAM DEV MANAGEMENT
  else if (hasWord(["hugo team", "dev team", "approve dev", "reject dev", "duyet dev", "tu choi dev", "cv dev", "ung vien dev", "ung vien", "devs", "dev", "lap trinh vien"])) {
    intent = "hugo-team";
    const isApprove = hasWord(["approve", "duyet", "nhan", "accept"]);
    const isReject = hasWord(["reject", "tu choi", "loai", "deny"]);
    const isDelete = hasWord(["xoa", "delete", "remove", "go", "huy", "gỡ"]);
    const isBlock = hasWord(["chan", "block", "khoa", "suspend", "dinh chi"]);
    
    if (isDelete) {
      reason = "delete-dev";
    } else if (isBlock) {
      reason = "block-dev";
    } else if (isApprove) {
      reason = "approve";
    } else if (isReject) {
      reason = "reject";
    } else {
      reason = "list";
    }
    
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (matchEmail) recipient = matchEmail[0];
  }
  // SUPPORT TICKETS MANAGEMENT
  else if (hasWord(["ticket", "tickets", "ho tro", "resolve ticket", "giai quyet ticket", "yeu cau ho tro"])) {
    intent = "tickets";
    const isResolve = hasWord(["resolve", "giai quyet", "dong", "close", "hoan thanh"]);
    reason = isResolve ? "resolve" : "list";
    const matchId = text.match(/([a-fA-F0-9]{24})/);
    if (matchId) query = matchId[0];
  }
  // IOT DEVICE CONTROL
  else if (hasWord(["iot", "thiet bi", "den", "dieu hoa", "toggle den", "toggle device", "quat"])) {
    intent = "iot";
    const isToggle = hasWord(["bat", "tat", "toggle", "switch", "turn on", "turn off"]);
    reason = isToggle ? "toggle" : "list";
    const deviceNames = ["den-studio", "dieu-hoa", "quat-thong-gio", "den", "dieu hoa", "quat"];
    for (const name of deviceNames) {
      if (hasWord([name])) {
        query = name;
        break;
      }
    }
  }
  // UTILITY STORE ORDERS MANAGEMENT
  else if (hasWord(["don hang", "orders", "order", "don mua"])) {
    intent = "orders";
    const isComplete = hasWord(["complete", "hoan thanh", "ship", "giao xong"]);
    const isCancel = hasWord(["cancel", "huy", "delete-order"]);
    reason = isComplete ? "complete" : (isCancel ? "cancel" : "list");
    const matchId = text.match(/([a-fA-F0-9]{24})/);
    if (matchId) query = matchId[0];
  }
  // SEND AI NOTIFICATION
  else if (hasWord(["gui tin nhan", "gui mail", "gui email", "gui thong bao", "send mail", "send notification", "send message", "thong bao"])) {
    intent = "send-ai-notification";
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|0\d{9,10})/);
    if (matchEmail) {
      recipient = matchEmail[0];
    } else if (normalized.includes(" tat ca ") || normalized.includes(" all ")) {
      recipient = "All";
    }

    let promptText = text.replace(/gửi tin nhắn/gi, "")
                        .replace(/gửi email/gi, "")
                        .replace(/gửi mail/gi, "")
                        .replace(/gửi thông báo/gi, "")
                        .replace(/send mail/gi, "")
                        .replace(/send notification/gi, "")
                        .replace(/send message/gi, "")
                        .replace(/đến tất cả người dùng và mail của người dùng/gi, "")
                        .replace(/đến tất cả người dùng/gi, "")
                        .replace(/đến tất cả/gi, "")
                        .replace(/cho tất cả/gi, "")
                        .replace(/cho/gi, "")
                        .replace(/đến/gi, "")
                        .replace(/to all/gi, "")
                        .replace(new RegExp(recipient || "All", 'gi'), "")
                        .replace(/và mail của người dùng/gi, "")
                        .replace(/và email/gi, "")
                        .trim();
    query = promptText || "Thông báo từ quản trị viên";
  }
  // STATS
  else if (hasWord(["thong ke", "stats", "thong so"])) {
    intent = "stats";
  }
  // CLEAN LOGS
  else if (hasWord(["clean-logs", "don logs", "xoa log"])) {
    intent = "clean-logs";
  }
  // CLEAR
  else if (hasWord(["clear", "xoa man hinh"])) {
    intent = "clear";
  }
  // HELP
  else if (hasWord(["help", "tro giup", "huong dan"])) {
    intent = "help";
  }
  // BOT
  else if (hasWord(["bot"])) {
    intent = "bot";
    botState = hasWord(["bat", "on"]) ? "on" : "off";
  }
  // USERS
  else if (hasWord(["danh sach user", "tim user", "users", "tim thanh vien"])) {
    intent = "users";
    const match = normalized.match(/(?:user|thanh vien|tim)\s+([a-zA-Z0-9_@.-]+)/);
    if (match) query = match[1];
  }
  // CREATE JOY VOUCHER
  else if (hasWord(["voucher", "qua tang", "ma joy"])) {
    intent = "create-joy-voucher";
    const matchAmt = clean.match(/(\d+)/);
    if (matchAmt) amount = Number(matchAmt[1]);
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (matchEmail) recipient = matchEmail[0];
  }
  // GỬI JOY TRỰC TIẾP
  else if (
    hasWord(["gui joy", "cong joy", "transfer joy", "chuyen joy", "chuyenjoy", "transferjoy", "transfer", "add joy", "tang joy", "plus joy", "give joy", "tao joy", "add", "plus", "tang", "cong", "give", "bonus"]) ||
    (hasWord(["chuyen"]) && hasWord(["joy"])) ||
    (hasWord(["gui"]) && hasWord(["joy"])) ||
    (hasWord(["tang"]) && hasWord(["joy"])) ||
    (hasWord(["cong"]) && hasWord(["joy"])) ||
    (hasWord(["add"]) && hasWord(["joy"])) ||
    (hasWord(["tao"]) && hasWord(["joy"])) ||
    (hasWord(["plus"]) && hasWord(["joy"]))
  ) {
    intent = "send-joy-direct";
    const matchAmt = clean.match(/(\d+)/);
    if (matchAmt) amount = Number(matchAmt[1]);
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|0\d{9,10})/);
    if (matchEmail) recipient = matchEmail[0];
  }
  // CREATE PAYMENT
  else if (hasWord(["thanh toan", "chuyen khoan", "payment", "hoa don"])) {
    intent = "create-payment";
    const matchAmt = clean.match(/(\d+)/);
    if (matchAmt) amount = Number(matchAmt[1]);
    if ((normalized.includes(" k ") || clean.includes("k")) && amount && amount < 1000) {
      const kMatch = clean.match(/(\d+)\s*k/);
      if (kMatch) amount = Number(kMatch[1]) * 1000;
    }
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|0\d{9,10})/);
    if (matchEmail) recipient = matchEmail[0];
  }
  // CREATE PACKAGE TEMPLATE OR SEND PACKAGE
  else if (hasWord(["goi"])) {
    const isSend = hasWord(["gui", "giao", "gan", "cho"]);
    intent = isSend ? "send-package-user" : "create-package-template";
    const pkgNames = ["vip", "premium", "gold", "silver", "basic", "trial", "sinh vien"];
    for (const name of pkgNames) {
      if (hasWord([name])) {
        query = name;
        break;
      }
    }
    const matchAmt = clean.match(/(\d+)/);
    if (matchAmt) amount = Number(matchAmt[1]);
    durationUnit = hasWord(["thang", "month"]) ? "months" : "days";
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|0\d{9,10})/);
    if (matchEmail) recipient = matchEmail[0];
  }

  // Double check /chuyen 2000 0798020513 or similar
  if (intent === "unknown" && (hasWord(["chuyen", "gui", "transfer"]))) {
    const matchAmt = clean.match(/(\d+)/);
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|0\d{9,10})/);
    if (matchAmt && matchEmail) {
      intent = "send-joy-direct";
      amount = Number(matchAmt[1]);
      recipient = matchEmail[0];
    }
  }

  return { intent, amount, recipient, reason, query, botState, durationUnit };
}

/**
 * Ghi một dòng nhật ký kiểm toán quản trị.
 *
 * LỖI ĐÃ SỬA 2026-09-23: hàm này từng ghi `adminEmail`, `targetUserId`,
 * `targetUserEmail` và `metadata` — KHÔNG trường nào trong số đó có trong
 * `AdminAuditLog` schema. Mongoose ở chế độ strict vứt lặng lẽ trường lạ, nên
 * mọi dòng nhật ký do 15 chỗ gọi sinh ra đều có `targetEmail` RỖNG: sổ kiểm
 * toán ghi được "ai làm gì" nhưng mất sạch "làm lên ai". Nay ánh xạ đúng tên
 * trường, và phần dư (targetUserId, metadata) gộp vào `details` thay vì rơi
 * xuống đất.
 *
 * Đổi chữ ký thì phải đổi cả `AdminAuditLog.js`, đừng thêm trường mới ở đây rồi
 * tưởng nó được lưu.
 */
export async function logAdminAuditAction(req, action, targetUserId, targetUserEmail, details, metadata = {}) {
  try {
    const AdminAuditLog = (await import('../models/AdminAuditLog.js')).default;
    await AdminAuditLog.create({
      adminId: String(req.admin?.id || 'admin'),
      adminUsername: req.admin?.id || 'admin',
      action,
      targetEmail: targetUserEmail || '',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      details: { note: details, targetUserId: targetUserId ? String(targetUserId) : undefined, ...metadata },
    });
  } catch (err) {
    console.error('Failed to log admin audit action:', err);
  }
}
