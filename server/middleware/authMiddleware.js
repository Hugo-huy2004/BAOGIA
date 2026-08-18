import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_SECRET } from '../utils/secrets.js';
import { findActiveSecurityBlock, sendSecurityBlockResponse } from '../services/securityEnforcement.js';
import { getMemberAge, isAdultAge, isMinorAge, ADULT_AGE } from '../utils/memberAge.js';
import { JOY_DENOMS } from '../../shared/joyCurrency.js';

const MEMBER_TOKEN_TTL = '14d';

// Những route CẦN gọi được khi hồ sơ chưa xong — nếu chặn cả mấy đường này thì
// người dùng không có cách nào hoàn tất hồ sơ để được mở chặn (khoá cửa rồi để
// chìa bên trong).
// So khớp CHÍNH XÁC, không phải theo tiền tố: '/api/bios/me' dạng tiền tố sẽ mở
// luôn mọi '/api/bios/me/*' (sửa hồ sơ, đổi giao diện…) — rộng hơn hẳn mức cần.
const PROFILE_SETUP_ROUTES = [
  '/api/bios/me',              // portal nạp hồ sơ → biết còn thiếu gì
  '/api/bios/me/profile-gaps', // danh sách mục còn thiếu
  '/api/bios/me/onboarding',   // nơi ghi lựa chọn
];
// Riêng đăng nhập/đăng xuất thì theo tiền tố: người dùng phải thoát ra được.
export const isProfileSetupRoute = (url = '') => {
  const path = String(url).split('?')[0].replace(/\/+$/, '') || '/';
  return PROFILE_SETUP_ROUTES.includes(path) || path.startsWith('/api/auth/member');
};

const extractToken = (req, cookieName) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const headerToken = authHeader.split(' ')[1];
    if (headerToken) return headerToken;
  }
  return req.cookies?.[cookieName] || null;
};

export const requireAdmin = (req, res, next) => {
  const token = extractToken(req, 'jwt');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Not an admin role' });
    }

    // UA Fingerprint Binding Verification (if signed into token)
    if (decoded.uaHash) {
      const currentUa = req.headers['user-agent'] || '';
      const currentUaHash = crypto.createHash('sha256').update(currentUa).digest('hex');
      if (decoded.uaHash !== currentUaHash) {
        return res.status(403).json({ error: 'Forbidden - Admin session device fingerprint mismatch' });
      }
    }

    req.admin = decoded;

    // Admin Security Armor Response Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden - Invalid or expired admin token' });
  }
};

// Signs the session token handed to a member after a server-verified login
// (Google ID token exchange or WebAuthn assertion).
export const signMemberToken = (email, req = null) => {
  let uaHash = '';
  if (req) {
    const ua = req.headers['user-agent'] || '';
    uaHash = crypto.createHash('sha256').update(ua).digest('hex');
  }
  return jwt.sign(
    { email: String(email).toLowerCase(), role: 'member', uaHash },
    JWT_SECRET,
    { expiresIn: MEMBER_TOKEN_TTL }
  );
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
export const requireCustomer = (req, res, next) => {
  const token = extractToken(req, 'jwt') || extractToken(req, 'customer_jwt');
  if (!token) {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'admin') {
      req.customerRole = 'admin';
      req.projectId = req.params.id;
      return next();
    }
    if (decoded.role === 'customer' && decoded.projectId) {
      req.customerRole = 'customer';
      req.projectId = decoded.projectId;
      return next();
    }
    return res.status(403).json({ error: 'Forbidden - Invalid role' });
  } catch (error) {
    return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
  }
};

// Member authentication. Identity comes exclusively from the verified token —
// any email the client sends in query/body is ignored for identity purposes.
// Admin tokens are also accepted (admin tools act on behalf of users); in that
// case the client-supplied email is trusted and req.isAdminActor is set.
export const requireMember = async (req, res, next) => {
  const token = extractToken(req, 'member_jwt') || extractToken(req, 'jwt');

  if (!token) {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'member' && decoded.email) {
      req.memberEmail = decoded.email;
      req.member = decoded;

      // JWT validity is not account validity. A permanently blacklisted email
      // must stay blocked even if an old 14-day token is still valid.
      try {
        const securityBlock = await findActiveSecurityBlock({ email: decoded.email });
        if (securityBlock) return sendSecurityBlockResponse(res, securityBlock);
      } catch (securityError) {
        console.error('[member security block check]', securityError.message);
      }

      // Note: User-Agent headers fluctuate dynamically across browser reloads,
      // DevTools toggles, and SW requests. We log req.memberEmail without destroying valid sessions.

      // Check server-side location anomaly block if database is connected
      const bypassRoutes = [
        '/api/bios/me/reset-trusted-location',
        '/api/joy/verify-pin',
        '/api/auth/member/logout'
      ];
      const isBypass = bypassRoutes.some(route => req.originalUrl?.startsWith(route));
      if (!isBypass) {
        const mongoose = (await import('mongoose')).default;
        if (mongoose.connection.readyState === 1) {
          const Bio = (await import('../models/Bio.js')).default;
          // Một truy vấn cho cả hai cổng chặn — đừng tách thành hai lượt đọc.
          const bio = await Bio.findOne({ email: decoded.email }, 'locationAnomaly joyDenom').lean();
          if (bio && bio.locationAnomaly) {
            return res.status(401).json({
              error: 'PHAT_HIEN_VI_TRI_BAT_THUONG',
              message: 'Phát hiện vị trí truy cập bất thường. Vui lòng xác thực lại bằng mã PIN.'
            });
          }
          // Chưa chọn đơn vị JOY thì KHÔNG dùng được hệ thống. Chặn ở server chứ
          // không chỉ ẩn giao diện: mọi số tiền hiện ra đều đã đổi theo đơn vị
          // của tài khoản, nên tài khoản không có đơn vị là mọi màn tiền đang
          // đọc một mặc định mà người dùng chưa từng đồng ý.
          //
          // `bio` rỗng thì bỏ qua: tài khoản chưa có hồ sơ, chưa có gì để chọn.
          if (bio && !JOY_DENOMS[bio.joyDenom] && !isProfileSetupRoute(req.originalUrl)) {
            return res.status(403).json({
              error: 'PROFILE_INCOMPLETE',
              missing: 'joyDenom',
              message: 'Bạn cần chọn đơn vị JOY trước khi dùng Hugo Studio.'
            });
          }
        }
      }

      return next();
    }
    if (decoded.role === 'admin') {
      req.isAdminActor = true;
      req.admin = decoded;
      // Admin acts on the account named by the request payload (may be absent
      // on /:id-style routes where the target is identified by document id).
      req.memberEmail = String(req.body?.email || req.query?.email || '').toLowerCase() || null;
      return next();
    }
    return res.status(403).json({ error: 'Forbidden - Invalid role' });
  } catch (error) {
    return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
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
export const attachMemberAge = async (req, res, next) => {
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
  const token = extractToken(req, 'member_jwt') || extractToken(req, 'jwt');
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'member' || !decoded.email) return next();
    const age = await getMemberAge(decoded.email);
    if (isMinorAge(age)) return ageError(res, age);
  } catch {
    // Token hỏng/hết hạn thì coi như khách vãng lai — route tự lo phần còn lại.
  }
  next();
};
