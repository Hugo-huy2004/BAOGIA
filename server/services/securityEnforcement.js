import crypto from 'node:crypto';
import SecurityBlock from '../models/SecurityBlock.js';
import SecurityEvent from '../models/SecurityEvent.js';
import { JWT_SECRET } from '../utils/secrets.js';
import { sendAlert } from '../utils/alert.js';

export const SECURITY_BLOCK_DAYS = 30;
const BLOCK_MS = SECURITY_BLOCK_DAYS * 24 * 60 * 60 * 1000;
const CONTENT_STRIKE_WINDOW_MS = 24 * 60 * 60 * 1000;
const CACHE_MS = 30 * 1000;
const CACHE_MAX = 5000;
const blockCache = new Map();

const HASH_SECRET = process.env.SECURITY_HASH_SECRET || JWT_SECRET;

function normalizeSubject(type, value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (type === 'email') return text.toLowerCase();
  if (type === 'phone') {
    let digits = text.replace(/\D/g, '');
    if (digits.startsWith('0084')) digits = digits.slice(2);
    if (digits.startsWith('0') && digits.length >= 9) digits = `84${digits.slice(1)}`;
    return digits;
  }
  return text.toLowerCase().replace(/^::ffff:/, '');
}

export function securityHash(type, value) {
  const normalized = normalizeSubject(type, value);
  if (!normalized) return '';
  return crypto.createHmac('sha256', HASH_SECRET).update(`${type}:${normalized}`).digest('hex');
}

export function serverAiUserId(email) {
  return securityHash('email', email);
}

function actorKey(type, hash) {
  return hash ? `${type}:${hash}` : '';
}

function compactPath(value) {
  return String(value || '').split('?')[0].slice(0, 220);
}

function evidenceDigest(value) {
  const compact = String(value || '').replace(/\s+/g, ' ').trim().slice(0, 4000);
  return compact ? crypto.createHash('sha256').update(compact).digest('hex') : '';
}

function makeCaseId() {
  return `SEC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function cacheSet(key, value) {
  if (blockCache.size >= CACHE_MAX) {
    const first = blockCache.keys().next().value;
    if (first) blockCache.delete(first);
  }
  blockCache.set(key, { value, until: Date.now() + CACHE_MS });
}

function cacheGet(key) {
  const entry = blockCache.get(key);
  if (!entry) return undefined;
  if (entry.until <= Date.now()) {
    blockCache.delete(key);
    return undefined;
  }
  return entry.value;
}

function invalidate(type, hash) {
  if (hash) blockCache.delete(actorKey(type, hash));
}

function isActive(block) {
  return Boolean(block && (block.permanent || (block.expiresAt && new Date(block.expiresAt).getTime() > Date.now())));
}

async function findBySubject(type, value) {
  const hash = securityHash(type, value);
  if (!hash) return null;
  const key = actorKey(type, hash);
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;
  const block = await SecurityBlock.findOne({ actorKey: key }).lean();
  const active = isActive(block) ? block : null;
  cacheSet(key, active);
  return active;
}

export async function findActiveSecurityBlock({ ip = '', email = '', phone = '' } = {}) {
  // Account/phone blocks win over an IP block so the response accurately says
  // permanent when a banned account arrives from an already-blocked network.
  for (const [type, value] of [['email', email], ['phone', phone], ['ip', ip]]) {
    const block = await findBySubject(type, value);
    if (block) return block;
  }
  return null;
}

export async function revokeSecurityBlock(id) {
  const block = await SecurityBlock.findByIdAndUpdate(
    id,
    { $set: { permanent: false, expiresAt: new Date(0), reasonCode: 'admin_revoked' } },
    { new: true },
  );
  if (block) invalidate(block.subjectType, block.subjectHash);
  return block;
}

export function securityBlockPayload(block) {
  return {
    error: 'ACCESS_BLOCKED',
    message: block?.permanent
      ? 'Tài khoản này đã bị khóa vĩnh viễn theo tiêu chuẩn an toàn và an ninh hệ thống.'
      : 'Truy cập đã bị tạm khóa 30 ngày theo tiêu chuẩn an toàn và an ninh hệ thống.',
    reason: block?.reasonCode || 'security_policy',
    caseId: block?.lastCaseId || '',
    permanent: Boolean(block?.permanent),
    blockedUntil: block?.permanent ? null : block?.expiresAt || null,
    appealPath: 'mailto:contact@hugowishpax.studio',
  };
}

export function sendSecurityBlockResponse(res, block) {
  const payload = securityBlockPayload(block);
  res.set('Cache-Control', 'private, no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  if (block?.expiresAt && !block.permanent) {
    const seconds = Math.max(1, Math.ceil((new Date(block.expiresAt).getTime() - Date.now()) / 1000));
    res.set('Retry-After', String(seconds));
  }
  return res.status(403).json(payload);
}

async function applySubjectBlock(type, value, { caseId, reasonCode, permanent = false, countLock = true }) {
  const hash = securityHash(type, value);
  if (!hash) return null;
  const key = actorKey(type, hash);
  const expiresAt = new Date(Date.now() + BLOCK_MS);
  const $set = {
    subjectType: type,
    subjectHash: hash,
    reasonCode,
    lastCaseId: caseId,
    lastLockedAt: new Date(),
    ...(permanent ? { permanent: true, expiresAt: null } : { expiresAt }),
  };
  const $inc = countLock ? { lockCount: 1 } : null;

  // MongoDB từ chối NGUYÊN CẢ LỆNH nếu một trường xuất hiện ở hai toán tử
  // ("would create a conflict at '<field>'"). Giá trị mồi lúc chèn mới chỉ có
  // nghĩa với trường mà $set/$inc không đụng tới, nên lọc ở đây một lần thay vì
  // mỗi lần thêm trường lại phải nhớ luật này — đã trượt hai lần với
  // `lockCount` (khoá tài khoản) và `permanent` (khoá vĩnh viễn), cả hai đều
  // ném lỗi thay vì khoá, và lỗi ẩn được lâu vì khoá theo IP không dùng $inc.
  const defaults = { actorKey: key, permanent: false, lockCount: 0 };
  const $setOnInsert = Object.fromEntries(
    Object.entries(defaults).filter(([field]) => !(field in $set) && !(field in ($inc || {}))),
  );

  const update = { $set, $setOnInsert, ...($inc ? { $inc } : {}) };
  let block = await SecurityBlock.findOneAndUpdate({ actorKey: key }, update, { upsert: true, new: true });

  // Only accounts escalate after two distinct lock decisions. IPs remain a
  // recoverable 30-day control because carrier/VPN/NAT addresses are shared.
  if (type === 'email' && !block.permanent && block.lockCount >= 2) {
    block = await SecurityBlock.findOneAndUpdate(
      { actorKey: key },
      { $set: { permanent: true, expiresAt: null, reasonCode, lastCaseId: caseId } },
      { new: true },
    );
  }
  invalidate(type, hash);
  return block?.toObject ? block.toObject() : block;
}

async function resolvePhone(email, suppliedPhone) {
  if (suppliedPhone || !email) return suppliedPhone || '';
  try {
    const Bio = (await import('../models/Bio.js')).default;
    const bio = await Bio.findOne({ $or: [{ email: String(email).toLowerCase() }, { contactEmail: String(email).toLowerCase() }] }, 'phone verificationRequest.phoneZalo').lean();
    return bio?.phone || bio?.verificationRequest?.phoneZalo || '';
  } catch {
    return '';
  }
}

// Nhóm vi phạm chỉ chặn MẠNG, không đụng tới tài khoản.
//
// Vỡ hạn mức lưu lượng là sự cố của đường truyền chứ không phải hành vi của một
// con người: một tab chạy loạn, một đợt deploy làm mọi tab tải lại cùng lúc, hay
// đơn giản là cả nhà mạng dùng chung một IP sau NAT. Trước đây một sự cố như vậy
// khoá luôn email 30 ngày, và lần thứ hai là khoá VĨNH VIỄN — chính chủ mất tài
// khoản vì trình duyệt của mình bấm nhiều quá. Chặn IP đã đủ dập lưu lượng;
// khoá tài khoản để dành cho vi phạm nội dung/xâm nhập, nơi có chủ ý thật.
const NETWORK_ONLY_CATEGORIES = new Set(['availability_attack']);

async function applyActorBlock({ ip, email, phone, caseId, reasonCode }) {
  if (NETWORK_ONLY_CATEGORIES.has(reasonCode)) {
    return applySubjectBlock('ip', ip, { caseId, reasonCode, countLock: false });
  }

  const [ipBlock, emailBlock] = await Promise.all([
    applySubjectBlock('ip', ip, { caseId, reasonCode, countLock: false }),
    applySubjectBlock('email', email, { caseId, reasonCode }),
  ]);
  const accountPermanent = Boolean(emailBlock?.permanent);
  const resolvedPhone = accountPermanent ? await resolvePhone(email, phone) : '';
  const phoneBlock = resolvedPhone
    ? await applySubjectBlock('phone', resolvedPhone, { caseId, reasonCode, permanent: true, countLock: false })
    : null;
  return emailBlock || phoneBlock || ipBlock;
}

export async function recordSecurityViolation({
  req,
  email = '',
  phone = '',
  category,
  severity = 'high',
  ruleId,
  evidence = '',
  enforcement = 'immediate',
}) {
  const caseId = makeCaseId();
  const ip = req?.ip || '';
  const ipHash = securityHash('ip', ip);
  const emailHash = securityHash('email', email);
  const phoneHash = securityHash('phone', phone);
  // 'identity_fraud': trượt đợt kiểm tra thông tin định kỳ. Khoá thẳng chứ
  // không đưa vào hàng chờ duyệt — thông tin khai man là thứ chỉ chính chủ mới
  // đính chính được, và đường kháng nghị qua email đã nằm sẵn trong màn khoá.
  const isEmergency = severity === 'critical' && ['intrusion', 'violent_facilitation', 'identity_fraud'].includes(category);
  let shouldBlock = isEmergency && enforcement === 'immediate';

  let block = null;
  if (shouldBlock) {
    block = await applyActorBlock({ ip, email, phone, caseId, reasonCode: category });
  } else {
    // Normal / Suspicious case -> Create SecurityModeration request and send Telegram Moderation Card to Boss
    try {
      const SecurityModeration = (await import('../models/SecurityModeration.js')).default;
      await SecurityModeration.create({
        caseId,
        subjectType: email ? 'email' : 'ip',
        subjectValue: email || ip,
        ip,
        email,
        phone,
        category,
        severity,
        ruleId,
        evidence: String(evidence || '').slice(0, 1000),
        path: compactPath(req?.originalUrl),
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      import('./telegramService.js').then(({ sendTelegramAlert }) => {
        const modMsg = `
🛡️ <b>[BOT SECURITY: BÁO CÁO VI PHẠM KHẢ NGHI]</b>

📌 <b>Case ID:</b> <code>${caseId}</code>
👤 <b>Đối tượng:</b> <code>${email || ip}</code>
🌐 <b>IP Address:</b> <code>${ip}</code>
⚠️ <b>Hành vi:</b> <code>${category} (${ruleId})</code>
📍 <b>Đường dẫn:</b> <code>${compactPath(req?.originalUrl)}</code>
💡 <b>Đánh giá BOT Security:</b> Vi phạm mức độ <b>${severity.toUpperCase()}</b>. Đã giữ nguyên truy cập, chờ chỉ thị của Boss:
        `.trim();
        const inlineButtons = {
          inline_keyboard: [
            [
              { text: '🚫 Đồng Ý Khóa 24h', callback_data: `cb_sec_approve:${caseId}` },
              { text: '🟢 Bỏ Qua & Cho Phép', callback_data: `cb_sec_dismiss:${caseId}` }
            ]
          ]
        };
        sendTelegramAlert(modMsg, 'HTML', inlineButtons).catch(() => {});
      }).catch(() => {});
    } catch (e) {
      console.error('[BOT Security Moderation Error]', e.message);
    }
  }

  const action = block?.permanent
    ? 'permanent_block'
    : shouldBlock
      ? 'temporary_block'
      : 'rejected';

  await SecurityEvent.create({
    caseId,
    category,
    severity,
    action,
    ruleId,
    method: String(req?.method || '').slice(0, 12),
    path: compactPath(req?.originalUrl),
    ipHash,
    emailHash,
    phoneHash,
    evidenceHash: evidenceDigest(evidence),
  });

  if (shouldBlock && block) {
    import('./telegramService.js').then(({ sendTelegramAlert }) => {
      const alertMsg = `
🚨 <b>[BOT SECURITY: NGUY CẤP - ĐÃ KHÓA KHẨN CẤP]</b>
⚠️ <b>Case ID:</b> <code>${caseId}</code>
📌 <b>Lý do:</b> <code>${category} (${ruleId})</code>
🌐 <b>IP Address:</b> <code>${ip}</code>
📍 <b>Đường dẫn:</b> <code>${compactPath(req?.originalUrl)}</code>
💡 <i>Nếu đây là thao tác của Boss hoặc nhầm lẫn, hãy nhấn nút dưới đây để giải khóa ngay 1-Click:</i>
      `.trim();
      const inlineButtons = {
        inline_keyboard: [
          [
            // callback_data tối đa 64 byte. Nhét mã băm 64 KÝ TỰ vào là 78 byte,
            // Telegram từ chối NGUYÊN CẢ TIN (BUTTON_DATA_INVALID) — nên cảnh báo
            // khoá khẩn cấp không bao giờ tới được Boss, im lặng, suốt thời gian
            // qua. Case ID ngắn và tra ngược được đúng bản ghi.
            { text: `🔓 1-Click Giải Khóa IP (${ip})`, callback_data: `cb_unblock_ip:${caseId}` }
          ]
        ]
      };
      sendTelegramAlert(alertMsg, 'HTML', inlineButtons).catch(() => {});
    }).catch(() => {});
  }

  sendAlert('Security policy enforcement', {
    source: 'security',
    caseId,
    category,
    severity,
    action,
    ruleId,
    path: compactPath(req?.originalUrl),
    ipHash: ipHash.slice(0, 16),
    emailHash: emailHash.slice(0, 16),
  });

  return { caseId, action, block };
}

function collectKeys(value, keys = new Set(), depth = 0) {
  if (!value || typeof value !== 'object' || depth > 8) return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.add(String(key));
    collectKeys(child, keys, depth + 1);
  }
  return keys;
}

function collectStrings(value, strings = [], depth = 0) {
  if (strings.join('').length > 12000 || depth > 8) return strings;
  if (typeof value === 'string') strings.push(value.slice(0, 4000));
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, strings, depth + 1));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectStrings(item, strings, depth + 1));
  return strings;
}

const REQUEST_RULES = [
  ['path_traversal', /(?:\.\.[/\\]|%2e%2e|%00|\/etc\/passwd|\/proc\/self\/environ|\.git\/(?:config|head))/i],
  ['script_injection', /(?:<script\b[^>]*>|javascript\s*:|\$\{jndi\s*:(?:ldap|rmi))/i],
  ['database_injection', /(?:\bunion\s+(?:all\s+)?select\b.{0,160}\bfrom\b|;\s*(?:drop|truncate)\s+(?:table|database)\b|\binformation_schema\b)/i],
  ['command_injection', /(?:\b(?:curl|wget)\b.{0,100}(?:\|\s*(?:sh|bash)|-o\s+\/tmp)|\brm\s+-rf\b|\bchmod\s+\+x\b)/i],
];

const MALICIOUS_KEYS = new Set(['__proto__', 'prototype', 'constructor', '$where', '$function', '$accumulator']);
const SERVER_OWNED_JOY_KEYS = new Set(['joyBalance', 'balanceAfter', 'bonusChatTokens', 'bonusCallTokens', 'joyAwardedToday', 'completedLessons']);

export function assessRequestThreat({ originalUrl = '', body = {}, query = {} } = {}) {
  const keys = collectKeys({ body, query });
  for (const key of keys) {
    if (MALICIOUS_KEYS.has(key) || key.startsWith('$')) {
      return { category: 'intrusion', severity: 'critical', ruleId: 'nosql_operator_injection', evidence: key };
    }
  }

  const pathOnly = String(originalUrl || '').slice(0, 2000);
  // These authenticated authoring routes legitimately carry runnable examples.
  // Continue scanning their path/query and object keys, but do not mistake an
  // educational <script> snippet for an exploit sent to the application.
  const bodyAllowsCode = /^\/api\/(?:coder-lessons|admin\/interpret-command)(?:\/|$)/.test(pathOnly);
  const stringsToScan = bodyAllowsCode ? { query } : { body, query };
  const joined = `${pathOnly}\n${collectStrings(stringsToScan).join('\n')}`;
  for (const [ruleId, pattern] of REQUEST_RULES) {
    if (pattern.test(joined)) {
      return { category: 'intrusion', severity: 'critical', ruleId, evidence: joined };
    }
  }

  if (/^\/api\/bios(?:\/|$)/.test(pathOnly)) {
    for (const key of keys) {
      if (SERVER_OWNED_JOY_KEYS.has(key)) {
        return { category: 'joy_abuse', severity: 'critical', ruleId: 'joy_owned_field_tamper', evidence: key };
      }
    }
  }
  return null;
}

// ── MỨC XỬ LÝ ──────────────────────────────────────────────────────
// `immediate` = chặn ngay từ câu đầu tiên. Chỉ để dành cho đe doạ bạo lực có
// thật, nơi chờ tới lần thứ hai là quá muộn.
//
// Mọi luật còn lại dùng `threshold`: lần đầu TỪ CHỐI câu đó và ghi vào sổ, lần
// thứ hai trong 24 giờ mới chặn. Lý do: đây là app sức khoẻ tinh thần, người
// dùng gõ đủ thứ câu tò mò; khoá 30 ngày cả mạng truy cập ngay ở câu đầu là
// hình phạt không tương xứng với một câu chat — và một lần khoá nhầm là mất
// người dùng thật.
const PSY_RULES = [
  {
    category: 'system_attack',
    severity: 'critical',
    ruleId: 'targeted_system_attack',
    enforcement: 'threshold',
    pattern: /(?:đánh\s*sập|phá(?:\s+hoại)?|xâm\s*nhập|hack|ddos|dos)\s+(?:website|trang\s*web|hệ\s*thống|server|máy\s*chủ|hugopsy|hugo)|(?:hack|ddos|take\s+down|destroy)\s+(?:the\s+)?(?:site|website|system|server|hugopsy|hugo)/i,
  },
  {
    category: 'joy_abuse',
    severity: 'critical',
    ruleId: 'joy_theft_or_forgery',
    enforcement: 'threshold',
    pattern: /(?:(?:hack|ăn\s*cắp|chiếm|làm\s*giả|sửa|tăng)\s+(?:điểm\s+)?joy|(?:steal|forge|hack|increase)\s+(?:the\s+)?joy)/i,
  },
  {
    category: 'intrusion',
    severity: 'critical',
    ruleId: 'credential_or_prompt_exfiltration',
    enforcement: 'threshold',
    // Chỉ khớp khi nhắm vào BÍ MẬT CỦA HỆ THỐNG. Bản cũ bắt cả chữ "mật khẩu"
    // và "secret" trần, nên "tôi quên mật khẩu, đưa tôi cách lấy lại" hay "show
    // me the secret santa idea" là chặn 30 ngày — và đó chính là thứ đã khoá
    // nhầm. Tương tự, "bypass ... bảo mật" bắt luôn câu hỏi lập trình bình
    // thường ("làm sao bypass lỗi bảo mật CORS"), nên `bypass` giờ phải nhắm
    // vào bộ lọc/kiểm duyệt của chính hệ thống này.
    pattern: /(?:(?:ignore|bỏ\s*qua).{0,40}(?:previous|trước|system).{0,80}(?:prompt|instruction|chỉ\s*dẫn)|(?:reveal|show|đưa|tiết\s*lộ).{0,50}(?:system\s*prompt|prompt\s*hệ\s*thống|api\s*key|khoá\s*api|token\s*hệ\s*thống|biến\s*môi\s*trường|(?:mật\s*khẩu|password)\s*(?:quản\s*trị|admin|hệ\s*thống))|jailbreak|bypass.{0,50}(?:guard\s*rail|guardrail|safety|content\s*filter|bộ\s*lọc|kiểm\s*duyệt))/i,
  },
  {
    category: 'violent_facilitation',
    severity: 'critical',
    ruleId: 'credible_violent_threat',
    enforcement: 'immediate',
    pattern: /(?:(?:tôi|tao|mình)\s+sẽ\s+(?:giết|đánh\s*bom|tấn\s*công|ám\s*sát)|\bi\s+will\s+(?:kill|bomb|attack|assassinate)\b).{0,100}(?:người|trường|cơ\s*quan|chính\s*phủ|nhà\s*nước|government|school|office|people|person|hugo)/i,
  },
  {
    category: 'violent_facilitation',
    severity: 'high',
    ruleId: 'violent_instructions',
    enforcement: 'threshold',
    pattern: /(?:(?:cách|hướng\s*dẫn|chỉ\s+tôi|lập\s+kế\s*hoạch).{0,60}(?:chế\s*bom|làm\s*bom|ám\s*sát|tấn\s*công|gây\s*chiến\s*tranh)|(?:how\s+to|instructions?\s+to|plan\s+to).{0,60}(?:make\s+(?:a\s+)?bomb|assassinate|attack|start\s+(?:a\s+)?war))/i,
  },
];

export function assessHugoPsyContent(text) {
  const value = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 12000);
  if (!value) return null;
  for (const rule of PSY_RULES) {
    if (rule.pattern.test(value)) return { ...rule, evidence: value, pattern: undefined };
  }
  return null;
}

// Webhook máy-với-máy: mỗi cái có cách tự xác thực riêng (Telegram gửi kèm
// secret token, PayOS ký checksum) và IP gọi tới là hạ tầng dùng chung của họ.
// Body ở đây là TIN NHẮN được chuyển tiếp, không phải tham số API — quét thấy
// chữ "tăng joy" trong tin của Boss rồi khoá IP là khoá luôn máy chủ Telegram,
// đúng nghĩa tự bắn vào chân: bot câm lặng 30 ngày mà không ai hiểu vì sao.
const MACHINE_WEBHOOK_PATHS = new Set([
  '/api/telegram/webhook',
  '/api/payos/webhook',
]);
const isMachineWebhook = (req) => MACHINE_WEBHOOK_PATHS.has(req.path);

const LOCALHOST_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost']);
const isDevMode = process.env.NODE_ENV !== 'production';

function hasValidUserToken(req) {
  const authHeader = String(req.headers?.authorization || '');
  const cookies = req.cookies || {};
  return Boolean(
    (authHeader.startsWith('Bearer ') && authHeader.length > 15) ||
    cookies.hugo_member_token ||
    cookies.hugo_admin_token
  );
}

export async function securityIpGate(req, res, next) {
  try {
    if (isMachineWebhook(req) || hasValidUserToken(req)) return next();
    const ip = String(req.ip || '').replace(/^::ffff:/, '');
    if (isDevMode || LOCALHOST_IPS.has(ip) || ip.startsWith('192.168.') || ip.startsWith('10.') || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)) {
      return next();
    }
    const block = await findActiveSecurityBlock({ ip: req.ip });
    if (block) return sendSecurityBlockResponse(res, block);
  } catch (error) {
    console.error('[security gate]', error.message);
  }
  return next();
}

const BOT_PROBE_REGEX = /^\/(\.git|\.env|wp-admin|phpmyadmin|admin\.php|\.well-known\/.*\.php|actuator|console|config\.json|xmlrpc\.php)/i;

export async function requestThreatGuard(req, res, next) {
  try {
    const pathOnly = String(req.originalUrl || '').split('?')[0];
    if (BOT_PROBE_REGEX.test(pathOnly)) {
      return res.status(404).send('Not Found');
    }

    if (isMachineWebhook(req) || hasValidUserToken(req)) return next();
    const threat = assessRequestThreat(req);
    if (!threat) return next();

    // In Zero Auto-Block Mode: record moderation event and report to Telegram for Boss approval (no auto IP ban)
    await recordSecurityViolation({ req, ...threat, enforcement: 'threshold' });
    return next();
  } catch (error) {
    console.error('[request threat guard]', error.message);
    return next();
  }
}

export function safeServerErrors(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    if (res.statusCode >= 500 && payload && typeof payload === 'object') {
      const safe = { ...payload, error: 'Đã xảy ra lỗi máy chủ.' };
      delete safe.stack;
      delete safe.detail;
      return originalJson(safe);
    }
    if (
      payload
      && typeof payload === 'object'
      && typeof payload.error === 'string'
      && /(?:Cast to|ValidationError|Mongo(?:Server)?Error|ENOENT|EACCES|node_modules|[A-Z]:\\|\/Users\/|\/home\/|\/var\/)/i.test(payload.error)
    ) {
      return originalJson({ ...payload, error: 'Yêu cầu không hợp lệ.' });
    }
    return originalJson(payload);
  };
  next();
}
