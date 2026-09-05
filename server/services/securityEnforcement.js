import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import dns from 'node:dns/promises';
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

async function applySubjectBlock(type, value, { caseId, reasonCode, permanent = false, countLock = true, durationMs = BLOCK_MS }) {
  const hash = securityHash(type, value);
  if (!hash) return null;
  const key = actorKey(type, hash);
  const expiresAt = new Date(Date.now() + durationMs);
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

// Chống lụt thẻ duyệt trên Telegram: 1 thẻ / (đối tượng + nhóm vi phạm) / giờ.
// Máy quét internet nện hàng chục đường dẫn (`/api/.git/config`, `/@fs/etc/passwd`…)
// trong đúng một giây; mỗi đường dẫn một tin là Boss nhận 10+ tin/ngày cho CÙNG
// một con bot, và hàng chờ duyệt đầy case không ai bấm. SecurityEvent vẫn ghi
// đủ từng lần nên không mất dấu vết để tra.
// ponytail: bộ nhớ trong tiến trình — restart Render thì cùng lắm thừa một tin;
// cần chính xác xuyên nhiều instance thì chuyển sang Redis (redisClient.js).
const CARD_THROTTLE_MS = 60 * 60 * 1000;
const cardSentAt = new Map();

function shouldSendModerationCard(key) {
  const now = Date.now();
  for (const [k, at] of cardSentAt) if (now - at > CARD_THROTTLE_MS) cardSentAt.delete(k);
  if (cardSentAt.has(key)) return false;
  cardSentAt.set(key, now);
  return true;
}

// `durationMs` + `escalate` để nút "Khóa 24h" trên Telegram nói đúng việc nó làm.
//
// Trước đây nút ghi 24 GIỜ nhưng gọi thẳng vào đây, tức khoá 30 NGÀY — và vì
// email có đếm `lockCount`, bấm lần thứ hai là khoá VĨNH VIỄN. Boss tưởng đang
// phạt nguội một ngày, thực tế đang xoá sổ một tài khoản. Phạt nguội thì không
// được đếm vào bậc thang khoá vĩnh viễn: `escalate: false`.
export async function applyActorBlock({ ip, email, phone, caseId, reasonCode, durationMs = BLOCK_MS, escalate = true }) {
  if (NETWORK_ONLY_CATEGORIES.has(reasonCode)) {
    return applySubjectBlock('ip', ip, { caseId, reasonCode, countLock: false, durationMs });
  }

  const [ipBlock, emailBlock] = await Promise.all([
    applySubjectBlock('ip', ip, { caseId, reasonCode, countLock: false, durationMs }),
    applySubjectBlock('email', email, { caseId, reasonCode, countLock: escalate, durationMs }),
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
  notify = true,
  network = '',
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

  // `threshold` = "lần đầu từ chối và ghi sổ, lần thứ hai trong 24 giờ mới
  // chặn". Luật này được ghi trong chú thích ngay dưới PSY_RULES từ đầu, nhưng
  // CHƯA BAO GIỜ ĐƯỢC VIẾT: `shouldBlock` chỉ nhìn `immediate`, nên mọi luật
  // threshold (đánh sập hệ thống, trộm JOY, moi system prompt, hướng dẫn bạo
  // lực, bão request) tái phạm bao nhiêu lần cũng không tự khoá ai.
  // `CONTENT_STRIKE_WINDOW_MS` khai báo rồi bỏ không chính là mảnh còn sót lại
  // của luật đó — cái cảnh báo lint duy nhất trong tệp này.
  //
  // Đếm theo email nếu biết là ai, không thì theo IP. Sự kiện lần này chưa ghi
  // vào sổ ở thời điểm này, nên `>= 1` đúng nghĩa "đây là lần thứ hai".
  if (!shouldBlock && enforcement === 'threshold') {
    const subject = emailHash ? { emailHash } : (ipHash ? { ipHash } : null);
    if (subject) {
      const priors = await SecurityEvent.countDocuments({
        ...subject,
        category,
        createdAt: { $gte: new Date(Date.now() - CONTENT_STRIKE_WINDOW_MS) },
      });
      if (priors >= 1) shouldBlock = true;
    }
  }

  let block = null;
  if (shouldBlock) {
    block = await applyActorBlock({ ip, email, phone, caseId, reasonCode: category });
  } else if (notify && shouldSendModerationCard(`${email || ip}:${category}`)) {
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
    network,
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

  if (notify) sendAlert('Security policy enforcement', {
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

// Ai đang gõ cửa? — phải XÁC MINH chữ ký, không được nhìn hình dạng.
//
// Bản cũ coi là "người dùng hợp lệ" khi header chỉ cần bắt đầu bằng "Bearer "
// và dài hơn 15 ký tự, hoặc có cookie `hugo_member_token`/`hugo_admin_token`.
// Hai lỗi nặng:
//   1. `Authorization: Bearer aaaaaaaaaaaaaaaa` — mười sáu chữ a — là đủ để đi
//      thẳng qua `securityIpGate`. Nghĩa là MỌI lệnh khoá theo IP đều gỡ được
//      bằng một dòng header bịa, kể cả khoá 30 ngày vừa ban ra.
//   2. Hai tên cookie đó không tồn tại ở đâu trong repo — cookie thật là
//      `member_jwt` / `jwt` / `customer_jwt`. Nhánh cookie chưa từng chạy đúng.
// Giờ giải mã thật: có chữ ký của mình mới tính là người, và biết luôn là ai.
const ACTOR_COOKIES = ['member_jwt', 'jwt', 'customer_jwt'];

export function verifiedActor(req) {
  const authHeader = String(req.headers?.authorization || '');
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cookies = req.cookies || {};
  for (const token of [bearer, ...ACTOR_COOKIES.map((name) => cookies[name])]) {
    if (!token) continue;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { email: decoded.email || '', role: decoded.role || '' };
    } catch {
      // chữ ký sai / hết hạn → thử nguồn tiếp theo, cuối cùng coi là khách lạ
    }
  }
  return null;
}

export async function securityIpGate(req, res, next) {
  try {
    if (isMachineWebhook(req) || verifiedActor(req)) return next();
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

// Kẻ tấn công đến từ mạng nào? — tra tên miền ngược của IP.
//
// Đây là thứ biến "một IP lạ" thành "máy quét của Censys", "VPS DigitalOcean ở
// Đức", "AWS us-east". Log của server ta, không cần ai cho phép, và là câu trả
// lời thật cho "ai đang xâm phạm" — khác hẳn ảnh chụp mặt mà trình duyệt không
// bao giờ cho lấy lén.
//
// Có TTL cache vì một đợt quét là hàng chục request cùng IP trong một giây;
// tra DNS lại từng cái là tự tay làm chậm mình. Timeout ngắn: không có PTR thì
// bản thân điều đó đã là tín hiệu (hosting/VPS thường trần trụi không tên).
const netCache = new Map();
const NET_CACHE_MS = 60 * 60 * 1000;

export async function resolveNetwork(rawIp) {
  const ip = String(rawIp || '').replace(/^::ffff:/, '');
  if (!ip || ip === '127.0.0.1' || ip === '::1') return '';
  const hit = netCache.get(ip);
  if (hit && hit.until > Date.now()) return hit.value;

  // Hai nguồn, chạy song song: tên miền ngược (DNS builtin, luôn có) và
  // geo/ASN (ip-api free, không cần key). Nhãn cuối ghép "Nhà mạng · Thành phố,
  // Nước · AS####" — đúng thứ Boss cần: "23 vụ từ DigitalOcean, Frankfurt".
  const [rdns, geo] = await Promise.all([reverseDomain(ip), geoAsn(ip)]);
  const label = [geo?.org || rdns, geo?.place, geo?.asn].filter(Boolean).join(' · ')
    || 'không rõ nguồn (hosting/VPS trần)';

  if (netCache.size >= 2000) netCache.delete(netCache.keys().next().value);
  netCache.set(ip, { value: label, until: Date.now() + NET_CACHE_MS });
  return label;
}

async function reverseDomain(ip) {
  try {
    const names = await Promise.race([
      dns.reverse(ip),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 800)),
    ]);
    if (!names?.length) return '';
    // "scan-99.sub.censys.io" → "censys.io"; "ec2-x.compute-1.amazonaws.com"
    // → "amazonaws.com". Gộp mọi máy con của cùng một mạng về một nhãn.
    const parts = names[0].replace(/\.$/, '').split('.').filter(Boolean);
    return parts.slice(-2).join('.');
  } catch {
    return '';
  }
}

// Geo + ASN. ip-api.com free: không key, 45 req/phút — thừa sức cho vài IP mỗi
// bản tổng kết. Đặt IPINFO_TOKEN thì tự chuyển sang ipinfo.io (HTTPS, hạn mức
// cao hơn) mà không đổi nơi gọi.
async function geoAsn(ip) {
  try {
    const withTimeout = (p) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1200))]);
    if (process.env.IPINFO_TOKEN) {
      const d = await withTimeout(fetch(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`).then((r) => r.json()));
      const place = [d.city, d.country].filter(Boolean).join(', ');
      const asn = (d.org || '').match(/^AS\d+/)?.[0] || '';
      const org = (d.org || '').replace(/^AS\d+\s*/, '');
      return { org, place, asn };
    }
    const d = await withTimeout(
      fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp,org,as`).then((r) => r.json()),
    );
    if (d.status !== 'success') return null;
    return {
      org: d.org || d.isp || '',
      place: [d.city, d.country].filter(Boolean).join(', '),
      asn: (d.as || '').match(/^AS\d+/)?.[0] || '',
    };
  } catch {
    return null;
  }
}

const BOT_PROBE_REGEX = /^\/(\.git|\.env|wp-admin|phpmyadmin|admin\.php|\.well-known\/.*\.php|actuator|console|config\.json|xmlrpc\.php)/i;

// Chặn một IP tái phạm — ngưỡng đếm theo giờ, chỉnh bằng ENV
// SECURITY_AUTOBLOCK (mặc định 8). Đặt 0 để tắt hẳn tự chặn.
// Dedup bằng cache: một đợt quét là hàng chục request, không thể mỗi cái lại
// gọi Cloudflare và báo Telegram một lần.
const autoBlocked = new Map();
async function maybeAutoBlock(req, network) {
  const threshold = process.env.SECURITY_AUTOBLOCK != null ? Number(process.env.SECURITY_AUTOBLOCK) : 8;
  if (!threshold || threshold < 1) return;
  const ip = String(req.ip || '').replace(/^::ffff:/, '');
  if (!ip) return;

  const now = Date.now();
  for (const [k, at] of autoBlocked) if (now - at > 60 * 60 * 1000) autoBlocked.delete(k);
  if (autoBlocked.has(ip)) return;

  const ipHash = securityHash('ip', ip);
  const priors = await SecurityEvent.countDocuments({
    ipHash,
    category: 'intrusion',
    createdAt: { $gte: new Date(now - 60 * 60 * 1000) },
  });
  if (priors < threshold) return;
  autoBlocked.set(ip, now);

  const caseId = makeCaseId();
  const note = `Hugo auto-block: ${priors} lượt dò/giờ · ${network}`;
  const { blockIpAtEdge } = await import('./cloudflareFirewall.js');
  const edge = await blockIpAtEdge(ip, note);
  // Luôn ghi thêm lệnh chặn tầng ứng dụng: nó là lưới đỡ khi CF chưa cấu hình,
  // và là bản ghi (dạng băm) để bản tổng kết đếm được "đã tự chặn N".
  await applySubjectBlock('ip', ip, { caseId, reasonCode: 'auto_probe_block', countLock: false, durationMs: 7 * 24 * 60 * 60 * 1000 });
  await SecurityBlock.updateOne(
    { actorKey: actorKey('ip', ipHash) },
    { $set: { edgeIp: ip, edgeRuleId: edge.ruleId || '' } },
  ).catch(() => {});

  import('./telegramService.js').then(({ sendTelegramAlert }) => {
    sendTelegramAlert(
      `🧱 <b>[TỰ CHẶN KẺ DÒ QUÉT]</b>\n\n`
      + `🌐 <b>${network}</b>\n`
      + `📊 <b>${priors}</b> lượt dò trong 1 giờ\n`
      + `🛡️ Chặn tại: <b>${edge.edge ? 'Tường lửa Cloudflare (ngoài cổng)' : 'Tầng ứng dụng'}</b>\n`
      + `📌 Case: <code>${caseId}</code>`,
      'HTML',
      { inline_keyboard: [[{ text: '🔓 Gỡ chặn (bấm nếu nhầm)', callback_data: `cb_unblock_ip:${caseId}` }]] },
    ).catch(() => {});
  }).catch(() => {});
}

// Cổng này chỉ nhìn thấy KHÁCH LẠ (chưa đăng nhập). Mà khách lạ gõ vào
// `/api/.git/config` hay `/@fs/etc/passwd` thì gần như luôn là máy quét dạo
// khắp internet, không phải người: nó không có tài khoản để khoá, không có
// email để cảnh cáo, và ngày mai đổi IP. Hỏi Boss "có khoá con bot này không?"
// là hỏi một câu không ai trả lời khác đi được — trong khi mỗi lần quét là hàng
// chục đường dẫn trong một giây, tức hàng chục tin nhắn cho đúng một con bot.
//
// Nên: trả 404, GHI SỔ đầy đủ (SecurityEvent), và im lặng. Bản tổng kết 24h
// dưới `securityDigest()` nói lại toàn bộ trong một tin duy nhất mỗi sáng.
//
// Thông báo tức thời để dành cho nơi có NGƯỜI THẬT sau lưng hành vi — chat của
// thành viên (aiProxyRoutes), kiểm tra thông tin định kỳ (bioRoutes), bão
// request từ một IP (rate limiter). Ở đó nút "Khoá / Bỏ qua" mới có nghĩa.
export async function requestThreatGuard(req, res, next) {
  try {
    const pathOnly = String(req.originalUrl || '').split('?')[0];
    if (BOT_PROBE_REGEX.test(pathOnly)) {
      return res.status(404).send('Not Found');
    }

    if (isMachineWebhook(req) || verifiedActor(req)) return next();
    const threat = assessRequestThreat(req);
    if (!threat) return next();

    // `observe`: ghi sổ, không chặn, không báo. Máy quét dạo đến từ IP dùng
    // chung sau NAT của cả nhà mạng — khoá theo hai lần mò là khoá nhầm người
    // thật, mà chặn được nó cũng chẳng để làm gì: 404 đã là câu trả lời đủ.
    // Kèm nhãn MẠNG để bản tổng kết nói được "chúng đến từ đâu".
    const network = await resolveNetwork(req.ip);
    await recordSecurityViolation({ req, ...threat, enforcement: 'observe', notify: false, network });

    // Nhưng một IP nện nhiều lần thì KHÔNG còn là "cả nhà mạng dùng chung" —
    // một bà nội trợ sau NAT không gõ /etc/passwd tám lần. Vượt ngưỡng thì
    // chặn thẳng, ưu tiên đẩy ra tường lửa Cloudflare (kẻ tấn công bị dập
    // ngoài cổng, không tốn băng thông Render). Chạy nền: đừng để tra CF làm
    // chậm cú 404 trả về cho con bot.
    maybeAutoBlock(req, network).catch((e) => console.error('[auto-block]', e.message));
    return res.status(404).send('Not Found');
  } catch (error) {
    console.error('[request threat guard]', error.message);
    return next();
  }
}

// Một tin mỗi sáng thay cho hàng chục tin mỗi ngày: nói rõ đêm qua có gì, cái
// gì máy tự xử, cái gì còn chờ người. Vẫn gửi khi yên tĩnh — biết bộ canh còn
// sống mới là thứ làm người ta an tâm, im lặng thì không phân biệt được "không
// có gì" với "hỏng mà không ai hay".
export async function securityDigest(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const SecurityModeration = (await import('../models/SecurityModeration.js')).default;
  const [events, pending, autoBlocks] = await Promise.all([
    SecurityEvent.find({ createdAt: { $gte: since } }, 'category action path ipHash emailHash network').lean(),
    SecurityModeration.countDocuments({ status: 'pending' }),
    SecurityBlock.countDocuments({ reasonCode: 'auto_probe_block', lastLockedAt: { $gte: since } }),
  ]);

  if (!events.length && !pending && !autoBlocks) {
    return `🛡️ <b>[BOT SECURITY: BÁO CÁO ${hours}H]</b>\n\n✅ Yên tĩnh. Không có sự kiện nào, không có ca nào chờ duyệt.`;
  }

  const ips = new Set(events.map((e) => e.ipHash).filter(Boolean));
  const scanners = events.filter((e) => !e.emailHash);
  const humans = events.filter((e) => e.emailHash);
  const blocked = events.filter((e) => e.action !== 'rejected');

  const tally = (rows, key) => {
    const m = new Map();
    for (const r of rows) { const v = r[key]; if (v) m.set(v, (m.get(v) || 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  };
  const topPaths = tally(scanners, 'path').map(([p, n]) => `   • <code>${p}</code> ×${n}`).join('\n');
  const netRank = tally(scanners, 'network');
  const topNets = netRank.map(([net, n]) => `   • <b>${net}</b> ×${n}`).join('\n');

  // Gợi ý (KHÔNG tự bấm cò): một mạng ôm phần lớn lượt dò và có ASN rõ thì mách
  // Boss lệnh chặn cả ASN. Quyết định chặn diện rộng luôn là của con người.
  let suggest = '';
  const [topNet, topCount] = netRank[0] || [];
  if (topNet && scanners.length >= 10 && topCount >= scanners.length * 0.5) {
    const asn = String(topNet).match(/AS\d+/)?.[0];
    if (asn) suggest = `\n\n💡 <i>${topNet} chiếm ${Math.round((topCount / scanners.length) * 100)}% lượt dò. Cân nhắc:</i> <code>Chặn ASN ${asn}</code>`;
  }

  return [
    `🛡️ <b>[BOT SECURITY: BÁO CÁO ${hours}H]</b>`,
    '',
    `📊 <b>${events.length}</b> sự kiện từ <b>${ips.size}</b> IP`,
    `🤖 <b>${scanners.length}</b> lượt máy quét dạo — đã trả 404, không ảnh hưởng ai`,
    `👤 <b>${humans.length}</b> sự kiện từ tài khoản đã đăng nhập`,
    `🚫 <b>${blocked.length}</b> lượt khoá theo luật`,
    `🧱 <b>${autoBlocks}</b> IP dò quét bị tự chặn ở tường lửa`,
    `📋 <b>${pending}</b> ca đang chờ Boss duyệt`,
    topNets ? `\n🌐 <b>Kẻ xâm phạm đến từ đâu:</b>\n${topNets}` : null,
    topPaths ? `\n🔎 <b>Đường dẫn bị mò nhiều nhất:</b>\n${topPaths}` : null,
    suggest || null,
  ].filter((line) => line !== null).join('\n');
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
