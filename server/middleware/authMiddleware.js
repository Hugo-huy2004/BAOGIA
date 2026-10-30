import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/secrets.js';
import { findActiveSecurityBlock, sendSecurityBlockResponse } from '../services/securityEnforcement.js';
import { getMemberAge, isAdultAge, isMinorAge, ADULT_AGE } from '../utils/memberAge.js';
import { isDeletedMemberAccount } from '../utils/deletedMemberAccount.js';
import { missingProfileFields } from '../utils/profileRequirements.js';
import { deleteExpiredMemberAccount } from '../services/memberAccountLifecycle.js';
import { hasAdminPermission, resolveAdminPermissions } from '../../shared/adminAccess.js';
import { memberAuth, adminAuth, readSession, carriesSession } from '../auth/betterAuth.js';
import { touchActivity } from '../services/memberActivity.js';

const MEMBER_TOKEN_TTL = '14d';
const invalidSession = (res, authRole = 'member', error = 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.') =>
  res.status(401).json({ code: 'AUTH_SESSION_INVALID', authRole, error });

// Database/availability failures must not tell clients to destroy valid sessions.
const sendAuthFailure = (res, error, authRole = 'member') => {
  if (error instanceof jwt.JsonWebTokenError) {
    return invalidSession(res, authRole, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }
  console.error('[auth availability]', error.message);
  return res.status(503).json({ code: 'AUTH_UNAVAILABLE', error: 'Máy chủ tạm thời không thể xác thực. Vui lòng thử lại.' });
};

const SELF_ADMIN_ROUTES = /^\/api\/admin\/verify-session(?:\/|$)/;
const ADMIN_PERMISSION_RULES = [
  [/^\/api\/admin\/accounts(?:\/|$)/, 'access'],
  // Từng bảng tự kiểm quyền riêng trong adminDataRoutes.js.
  [/^\/api\/admin\/data(?:\/|$)/, 'overview'],
  [/^\/api\/admin\/(?:queue|joylater)(?:\/|$)/, 'queue'],
  [/^\/api\/admin\/ai-support(?:\/|$)/, 'support'],
  [/^\/api\/admin\/users(?:\/|$)/, 'users'],
  [/^\/api\/admin\/(?:coder-submissions|learners|verify-graduation-project)(?:\/|$)/, 'learning'],
  [/^\/api\/admin\/(?:store|orders)(?:\/|$)/, 'commerce'],
  [/^\/api\/admin\/(?:audit-logs)(?:\/|$)/, 'audit'],
  [/^\/api\/admin\/(?:security|brain\/auto-moderator)(?:\/|$)/, 'security'],
  [/^\/api\/admin\/(?:system-overview|brief)(?:\/|$)/, 'overview'],
  [/^\/api\/admin\/(?:system-storage|error-logs|iot|send-ai-notification)(?:\/|$)/, 'system'],
  [/^\/api\/hugoteam\/admin(?:\/|$)/, 'hugoteam'],
  [/^\/api\/(?:coder-resources|coder-lessons)(?:\/|$)/, 'learning'],
  [/^\/api\/(?:support|bookings)(?:\/|$)/, 'support'],
  [/^\/api\/(?:customer-projects|customer)(?:\/|$)/, 'projects'],
  [/^\/api\/(?:packages|utility-store|store|promos)(?:\/|$)/, 'commerce'],
  [/^\/api\/(?:bios|profiles)(?:\/|$)/, 'users'],
  [/^\/api\/(?:security|companion\/admin|ops|presence)(?:\/|$)/, 'security'],
  [/^\/api\/(?:joy|payos|gift-cards)(?:\/|$)/, 'commerce'],
  [/^\/api\/(?:data|notifications\/admin)(?:\/|$)/, 'system'],
];

const permissionForAdminRequest = (req) => {
  const path = String(req.originalUrl || '').split('?')[0];
  if (SELF_ADMIN_ROUTES.test(path)) return null;
  return ADMIN_PERMISSION_RULES.find(([pattern]) => pattern.test(path))?.[1] || 'access';
};

// Quyền = hợp các vai trò (Better Auth admin plugin lưu "support,finance").
const loadAdminClaims = (user, req) => {
  if (!user || user.banned) return null;
  const roles = String(user.role || 'viewer').split(',').map((r) => r.trim()).filter(Boolean);
  const permissions = roles.includes('owner')
    ? ['*']
    : [...new Set(roles.flatMap((role) => resolveAdminPermissions(role)))];
  const needed = permissionForAdminRequest(req);
  if (needed && !hasAdminPermission(permissions, needed)) return { forbidden: true };
  return {
    id: user.id,
    email: user.email,
    username: user.email,
    adminRole: roles.includes('owner') ? 'owner' : roles[0],
    roles,
    displayName: user.name || 'Quản trị viên',
    permissions,
  };
};

/** Admin của request, hoặc null / { forbidden }. */
const adminFromRequest = async (req) => (carriesSession(req, 'hugo-admin')
  ? loadAdminClaims((await readSession(adminAuth(), req))?.user, req)
  : null);

/** Email thành viên của request (đã viết thường), hoặc null. */
export const memberEmailFromRequest = async (req) => {
  if (!carriesSession(req, 'hugo')) return null;
  const email = (await readSession(memberAuth(), req))?.user?.email;
  return email ? email.toLowerCase() : null;
};

// Những route CẦN gọi được khi hồ sơ chưa xong — nếu chặn cả mấy đường này thì
// người dùng không có cách nào hoàn tất hồ sơ để được mở chặn (khoá cửa rồi để
// chìa bên trong).
// So khớp CHÍNH XÁC, không phải theo tiền tố: '/api/bios/me' dạng tiền tố sẽ mở
// luôn mọi '/api/bios/me/*' (sửa hồ sơ, đổi giao diện…) — rộng hơn hẳn mức cần.
const PROFILE_SETUP_ROUTES = [
  '/api/bios/me',              // portal nạp hồ sơ → biết còn thiếu gì
  '/api/bios/me/bootstrap',    // portal nạp hồ sơ thiếu để mở onboarding
  '/api/bios/me/profile-gaps', // danh sách mục còn thiếu
  '/api/bios/me/onboarding',   // nơi ghi lựa chọn
  '/api/bios/me/phone-available', // form kiểm số điện thoại ngay ở bước nhập
  '/api/bios/me/location-check',  // form đối chiếu điểm ghim với bản đồ
  '/api/bios/me/profile-options/ethnicities',
  '/api/bios/me/verification',
];
// Riêng đăng nhập/đăng xuất thì theo tiền tố: người dùng phải thoát ra được.
const isProfileSetupRoute = (url = '') => {
  const path = String(url).split('?')[0].replace(/\/+$/, '') || '/';
  return PROFILE_SETUP_ROUTES.includes(path) || path.startsWith('/api/auth/');
};

const extractToken = (req, cookieName) => {
  // Same-origin web sessions use an HttpOnly cookie. Prefer the cookie so a
  // stale token from another role cannot shadow the valid server session.
  if (req.cookies?.[cookieName]) return req.cookies[cookieName];
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const headerToken = authHeader.split(' ')[1];
    if (headerToken) return headerToken;
  }
  return null;
};

/**
 * Bộ nhớ đệm cho hai cổng chặn mà `requireMember` đọc từ Bio.
 *
 * VÌ SAO: mỗi request đã xác thực tốn MỘT round-trip tới Atlas chỉ để đọc hai
 * trường bé xíu. Đo thật (Atlas Singapore): /health không chạm DB là 0ms,
 * /joy/balance là 153ms cho 2 truy vấn — tức riêng cổng chặn này ăn khoảng một
 * nửa độ trễ của endpoint đã-xác-thực rẻ nhất.
 *
 * VÌ SAO ĐỆM ĐƯỢC: các trường hồ sơ bắt buộc chốt một lần rồi ít đổi.
 * `locationAnomaly` là cờ bảo mật, nên đệm có rủi ro — bù lại (a) TTL 30 giây,
 * đúng bằng TTL mà securityEnforcement.js đã dùng cho chính quyết định chặn
 * tài khoản, và (b) mọi nơi ghi cờ đều gọi `invalidateMemberGate()`. Cửa sổ xấu
 * nhất là 30s, và chỉ khi việc vô hiệu hoá thất bại.
 *
 * ponytail: Map + TTL, sao chép đúng khuôn của securityEnforcement.js thay vì
 * thêm Redis. Đệm theo TỪNG PROCESS, và như vậy là ĐỦ kể cả khi tách nhiều
 * process: mỗi process tự đọc một lần mỗi 30 giây cho mỗi người, còn cửa sổ dữ
 * liệu cũ vẫn là 30 giây y như bây giờ — không xấu đi. Khác với socket
 * (utils/realtime.js) vốn BẮT BUỘC phải loan tin qua Redis, chỗ này không cần.
 */
const GATE_CACHE_MS = 30 * 1000;
const GATE_CACHE_MAX = 5000;
const gateCache = new Map();

/** Xoá bản đệm của một email. Gọi ở MỌI nơi ghi locationAnomaly hoặc trường hồ sơ bắt buộc. */
export function invalidateMemberGate(email) {
  if (email) gateCache.delete(String(email).toLowerCase());
}

async function readMemberGate(email) {
  const key = String(email).toLowerCase();
  const cached = gateCache.get(key);
  if (cached && cached.until > Date.now()) return cached.value;

  const Bio = (await import('../models/Bio.js')).default;
  // Một truy vấn cho mọi cổng chặn — chỉ cần biết các trường có giá trị hay chưa,
  // không giải mã nội dung nhạy cảm ở middleware.
  const [bio, deletedAccount] = await Promise.all([
    Bio.findOne(
    { email },
      'locationAnomaly language birthDay birthMonth birthYear guardianConsentAt phone countryCode adminArea locality exactAddress isEduVerified trialExpiresAt expiresAt',
    ).select('+deletionStartedAt').lean(),
    isDeletedMemberAccount(email),
  ]);
  const value = deletedAccount
    ? { deletedAccount: true }
    : bio ? {
      locationAnomaly: !!bio.locationAnomaly,
      isEduVerified: !!bio.isEduVerified,
      accessExpiresAt: bio.isEduVerified || !bio.trialExpiresAt ? bio.expiresAt : bio.trialExpiresAt,
      // CÙNG một luật với form hồ sơ (utils/profileRequirements.js). Bản cũ tự
      // liệt kê và bắt cả toạ độ, tôn giáo, dân tộc — những mục form cho bỏ
      // trống. Kết quả: cổng trả 403, modal hỏi /profile-gaps thấy "không thiếu
      // gì" nên tự đóng, app gọi lại, 403 lần nữa… vòng lặp tới khi chạm giới
      // hạn và bị bot an ninh báo nhầm là tấn công (28/10/2026).
      profileIncomplete: missingProfileFields(bio).length > 0,
    } : null;

  if (gateCache.size >= GATE_CACHE_MAX) {
    const oldest = gateCache.keys().next().value;
    if (oldest) gateCache.delete(oldest);
  }
  gateCache.set(key, { value, until: Date.now() + GATE_CACHE_MS });
  return value;
}

export const requireAdmin = async (req, res, next) => {
  try {
    const admin = await adminFromRequest(req);
    if (!admin) return invalidSession(res, 'admin');
    if (admin.forbidden) {
      return res.status(403).json({ code: 'ADMIN_PERMISSION_DENIED', error: 'Tài khoản quản trị không có quyền thực hiện thao tác này.' });
    }
    req.admin = admin;
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    next();
  } catch (error) {
    return sendAuthFailure(res, error, 'admin');
  }
};

// OAuth consent chỉ cần biết người đang đăng nhập là ai. Không dùng
// requireMember ở đây vì cổng hồ sơ/đơn vị JOY không liên quan đến việc một
// người cho phép app khác đọc tên/email của họ. Middleware này vẫn kiểm phiên và
// danh sách khoá vĩnh viễn, đồng thời tuyệt đối không cho token admin giả làm
// một thành viên.
export const requireMemberSession = async (req, res, next) => {
  try {
    const email = await memberEmailFromRequest(req);
    if (!email) return invalidSession(res, 'member');
    const securityBlock = await findActiveSecurityBlock({ email });
    if (securityBlock) return sendSecurityBlockResponse(res, securityBlock);
    req.memberEmail = email;
    req.member = { email, role: 'member' };
    return next();
  } catch (error) {
    return sendAuthFailure(res, error, 'member');
  }
};

// Customer portal session — issued only after a valid loginCode exchange.
// The token pins the holder to exactly one project; identity is the token's
// projectId, NEVER a client-supplied :id. So knowing another customer's
// ObjectId grants nothing — that closes the portal's IDOR surface.
export const signCustomerToken = (projectId) =>
  jwt.sign({ projectId: String(projectId), role: 'customer' }, JWT_SECRET, { expiresIn: MEMBER_TOKEN_TTL });

// Guards every customer-portal data route. Sets req.projectId (the only id the
// route may touch) and req.customerRole ('customer' | 'admin'). Studio admins
// are accepted too and act on the project named in the URL.
export const requireCustomer = async (req, res, next) => {
  try {
    const admin = await adminFromRequest(req);
    if (admin?.forbidden) {
      return res.status(403).json({ code: 'ADMIN_PERMISSION_DENIED', error: 'Tài khoản quản trị không có quyền truy cập dự án này.' });
    }
    if (admin) {
      req.customerRole = 'admin';
      req.admin = admin;
      req.projectId = req.params.id;
      return next();
    }
    const token = extractToken(req, 'customer_jwt');
    if (!token) return invalidSession(res, 'customer');
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'customer' && decoded.projectId) {
      req.customerRole = 'customer';
      req.projectId = decoded.projectId;
      return next();
    }
    return res.status(403).json({ error: 'Forbidden - Invalid role' });
  } catch (error) {
    return sendAuthFailure(res, error, 'customer');
  }
};

// Member authentication. Identity comes exclusively from the verified token —
// any email the client sends in query/body is ignored for identity purposes.
// Admin tokens are also accepted (admin tools act on behalf of users); in that
// case the client-supplied email is trusted and req.isAdminActor is set.
export const requireMember = async (req, res, next) => {
  try {
    const email = await memberEmailFromRequest(req);
    if (email) {
      req.memberEmail = email;
      req.member = { email, role: 'member' };

      // Phiên còn hạn chưa chắc tài khoản còn được phép: sổ đen vĩnh viễn vẫn chặn.
      const securityBlock = await findActiveSecurityBlock({ email });
      if (securityBlock) return sendSecurityBlockResponse(res, securityBlock);
      touchActivity(email, req.originalUrl);
      const memberState = await readMemberGate(email);

      // Note: User-Agent headers fluctuate dynamically across browser reloads,
      // DevTools toggles, and SW requests. We log req.memberEmail without destroying valid sessions.

      // Check server-side location anomaly block if database is connected
      const bypassRoutes = [
        '/api/bios/me/reset-trusted-location',
        '/api/joy/verify-pin',
        '/api/auth/sign-out'
      ];
      const isBypass = bypassRoutes.some(route => req.originalUrl?.startsWith(route));
      if (!isBypass) {
        const mongoose = (await import('mongoose')).default;
        if (mongoose.connection.readyState === 1) {
          let bio = memberState;
          if (bio?.deletedAccount) {
            return res.status(410).json({
              code: 'ACCOUNT_DELETED',
              error: 'Tài khoản đã được xóa sau khi hết thời gian dùng thử.',
            });
          }
          if (bio?.accessExpiresAt && new Date(bio.accessExpiresAt).getTime() <= Date.now()) {
            if (!bio.isEduVerified) {
              let deleted = false;
              try {
                deleted = await deleteExpiredMemberAccount(email);
                invalidateMemberGate(email);
              } catch (error) {
                console.error('[member account expiry deletion]', error.message);
                return res.status(503).json({
                  code: 'ACCOUNT_CLEANUP_UNAVAILABLE',
                  error: 'Chưa thể hoàn tất việc xử lý tài khoản. Vui lòng thử lại.',
                });
              }
              if (deleted) {
                return res.status(410).json({
                  code: 'ACCOUNT_DELETED',
                  error: 'Tài khoản đã được xóa sau khi hết thời gian dùng thử.',
                });
              }
              bio = await readMemberGate(email);
              if (!bio || bio.deletedAccount) {
                return res.status(410).json({
                  code: 'ACCOUNT_DELETED',
                  error: 'Tài khoản đã được xóa sau khi hết thời gian dùng thử.',
                });
              }
              if (!bio.isEduVerified && bio.accessExpiresAt && new Date(bio.accessExpiresAt).getTime() <= Date.now()) {
                return res.status(410).json({
                  code: 'ACCOUNT_DELETED',
                  error: 'Tài khoản đã hết thời gian dùng thử.',
                });
              }
            }
            if (!isProfileSetupRoute(req.originalUrl)) {
              return res.status(403).json({
                code: 'ACCOUNT_EXPIRED',
                error: 'Thời hạn sử dụng tài khoản đã kết thúc.',
              });
            }
          }
          if (bio && bio.locationAnomaly) {
            return res.status(403).json({
              error: 'PHAT_HIEN_VI_TRI_BAT_THUONG',
              message: 'Phát hiện vị trí truy cập bất thường. Vui lòng xác thực lại bằng mã PIN.'
            });
          }
          // JOY chỉ còn MỘT đơn vị duy nhất nên không còn gì để người dùng chọn —
          // cổng `joyDenom` cũ đã bị bỏ. Nó so `JOY_DENOMS[bio.joyDenom]` với
          // bảng chỉ có khoá theo mã ngôn ngữ (en/vi…), trong khi hồ sơ ghi
          // 'JOY' và schema mặc định là '', nên MỌI thành viên đều rơi vào 403
          // trên MỌI route member — và onboarding không bao giờ hỏi để thoát ra.
          //
          // `bio` rỗng thì bỏ qua: tài khoản chưa có hồ sơ, chưa có gì để chặn.
          if (bio?.isEduVerified && bio.profileIncomplete && !isProfileSetupRoute(req.originalUrl)) {
            return res.status(403).json({
              error: 'PROFILE_INCOMPLETE',
              message: 'Bạn cần hoàn tất thông tin hồ sơ bắt buộc trước khi dùng Hugo Studio.'
            });
          }
        }
      }

      return next();
    }
    const admin = await adminFromRequest(req);
    if (!admin) return invalidSession(res, 'member');
    if (admin.forbidden) {
      return res.status(403).json({ code: 'ADMIN_PERMISSION_DENIED', error: 'Tài khoản quản trị không có quyền thực hiện thao tác này.' });
    }
    req.isAdminActor = true;
    req.admin = admin;
    // Admin thao tác thay thành viên được nêu trong payload (có thể trống ở route /:id).
    req.memberEmail = String(req.body?.email || req.query?.email || '').toLowerCase() || null;
    return next();
  } catch (error) {
    return sendAuthFailure(res, error);
  }
};

// ─── Cổng độ tuổi ────────────────────────────────────────────────────────────
// Ẩn nút trên giao diện là chưa đủ: mọi route 18+ phải tự kiểm ở server vì
// client gọi thẳng được. req.memberAge để route nào cần thì siết thêm.

const ageError = (res, age) => {
  if (age === null) {
    return res.status(403).json({
      error: 'AGE_UNKNOWN',
      message: 'Tính năng này cần biết tháng/năm sinh của bạn. Vui lòng bổ sung trong Hồ sơ.',
    });
  }
  return res.status(403).json({
    error: 'AGE_RESTRICTED',
    message: `Tính năng này chỉ dành cho thành viên từ ${ADULT_AGE} tuổi.`,
    minAge: ADULT_AGE,
  });
};

/** Gắn req.memberAge (null nếu chưa khai sinh nhật). Không chặn ai. */
const attachMemberAge = async (req, res, next) => {
  try {
    req.memberAge = req.isAdminActor ? ADULT_AGE : await getMemberAge(req.memberEmail);
  } catch (error) {
    console.error('[member age]', error.message);
    req.memberAge = null;
  }
  next();
};

/** Chỉ cho thành viên đủ 18. Dùng: router.post('/x', requireAdultMember, ...) */
export const requireAdultMember = [
  requireMember,
  attachMemberAge,
  (req, res, next) => (isAdultAge(req.memberAge) ? next() : ageError(res, req.memberAge)),
];

/** Tiện ích cho route công khai (donate…): chặn nếu người gọi ĐANG đăng nhập
 *  bằng tài khoản vị thành niên. Khách vãng lai không đăng nhập vẫn qua. */
export const rejectMinorActor = async (req, res, next) => {
  try {
    const email = await memberEmailFromRequest(req);
    if (email) {
      const age = await getMemberAge(email);
      if (isMinorAge(age)) return ageError(res, age);
    }
  } catch {
    // Không đọc được phiên thì coi như khách vãng lai — route tự lo phần còn lại.
  }
  next();
};
