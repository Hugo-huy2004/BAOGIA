import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Admin from '../models/Admin.js';
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
  '/api/bios/me/profile-options/ethnicities',
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

/**
 * Bộ nhớ đệm cho hai cổng chặn mà `requireMember` đọc từ Bio.
 *
 * VÌ SAO: mỗi request đã xác thực tốn MỘT round-trip tới Atlas chỉ để đọc hai
 * trường bé xíu. Đo thật (Atlas Singapore): /health không chạm DB là 0ms,
 * /joy/balance là 153ms cho 2 truy vấn — tức riêng cổng chặn này ăn khoảng một
 * nửa độ trễ của endpoint đã-xác-thực rẻ nhất.
 *
 * VÌ SAO ĐỆM ĐƯỢC: `joyDenom` chốt một lần lúc onboarding rồi khoá.
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

/** Xoá bản đệm của một email. Gọi ở MỌI nơi ghi locationAnomaly hoặc joyDenom. */
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
  const bio = await Bio.findOne({ email }, 'locationAnomaly joyDenom countryCode adminArea locality exactAddress verifiedLatitude verifiedLongitude locationVerifiedAt religion ethnicity').lean();
  const value = bio ? {
    locationAnomaly: !!bio.locationAnomaly,
    joyDenom: bio.joyDenom,
    profileIncomplete: !bio.countryCode || !bio.adminArea || !bio.locality || !bio.exactAddress
      || !bio.verifiedLatitude || !bio.verifiedLongitude || !bio.locationVerifiedAt
      || !bio.religion || !bio.ethnicity,
  } : null;

  if (gateCache.size >= GATE_CACHE_MAX) {
    const oldest = gateCache.keys().next().value;
    if (oldest) gateCache.delete(oldest);
  }
  gateCache.set(key, { value, until: Date.now() + GATE_CACHE_MS });
  return value;
}

export const requireAdmin = async (req, res, next) => {
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

    // Thu hồi phiên. JWT tự nó không rút lại được, nên đăng xuất chỉ xoá cookie
    // ở trình duyệt — token đã bị chép ra vẫn sống hết 14 ngày. Đối chiếu thời
    // điểm phát token (iat) với mốc sessionsValidFrom trên bản ghi Admin: đăng
    // xuất hoặc đổi mật khẩu đẩy mốc lên, mọi token cũ chết ngay.
    //
    // ponytail: đọc thẳng DB, không đệm. Lưu lượng admin là một người và vài
    // dashboard 15 giây/lần — vài chục truy vấn mỗi phút. Đệm ở đây chỉ đổi
    // lấy một cửa sổ mà token đã thu hồi vẫn dùng được, không đáng.
    const admin = await Admin.findById(decoded.id).select({ sessionsValidFrom: 1 }).lean();
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden - Admin account no longer exists' });
    }
    // So theo GIÂY, không theo mili-giây: `iat` của JWT chỉ có độ phân giải một
    // giây. Đăng xuất lúc 12:00:00.700 rồi đăng nhập lại lúc 12:00:00.900 sẽ
    // sinh token có iat = 12:00:00.000 — so bằng mili-giây thì token vừa phát
    // bị coi là cũ hơn mốc và người dùng bị đá ra ngay sau khi đăng nhập.
    // Đổi lại: token phát trong CÙNG GIÂY với lúc đăng xuất thì sống sót. Cửa
    // sổ đó tối đa một giây, và đây là cách thu hồi theo iat vẫn thường làm.
    if (admin.sessionsValidFrom) {
      const revokedAtSec = Math.floor(new Date(admin.sessionsValidFrom).getTime() / 1000);
      if (decoded.iat < revokedAtSec) {
        return res.status(403).json({ error: 'Forbidden - Admin session has been revoked' });
      }
    }

    req.admin = decoded;

    // Admin Security Armor Response Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    next();
  } catch {
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

// OAuth consent chỉ cần biết người đang đăng nhập là ai. Không dùng
// requireMember ở đây vì cổng hồ sơ/đơn vị JOY không liên quan đến việc một
// người cho phép app khác đọc tên/email của họ. Middleware này vẫn kiểm JWT và
// danh sách khoá vĩnh viễn, đồng thời tuyệt đối không cho token admin giả làm
// một thành viên.
export const requireMemberSession = async (req, res, next) => {
  // Cookie member thắng Authorization header để một Bearer admin cũ do client
  // interceptor gắn vào không che mất phiên member hợp lệ trên consent page.
  const token = req.cookies?.member_jwt || extractToken(req, 'member_jwt');
  if (!token) {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'member' || !decoded.email) {
      return res.status(403).json({ error: 'Forbidden - Invalid member role' });
    }
    const securityBlock = await findActiveSecurityBlock({ email: decoded.email });
    if (securityBlock) return sendSecurityBlockResponse(res, securityBlock);
    req.memberEmail = decoded.email;
    req.member = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
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
  } catch {
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
          const bio = await readMemberGate(decoded.email);
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
          if (bio && (!JOY_DENOMS[bio.joyDenom] || bio.profileIncomplete) && !isProfileSetupRoute(req.originalUrl)) {
            return res.status(403).json({
              error: 'PROFILE_INCOMPLETE',
              message: 'Bạn cần hoàn tất thông tin hồ sơ bắt buộc trước khi dùng Hugo Studio.'
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
  } catch {
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
