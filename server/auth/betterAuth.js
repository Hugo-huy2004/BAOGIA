/**
 * Đăng nhập bằng Better Auth — HAI hệ tách hẳn nhau:
 *
 *   memberAuth  /api/auth/*        cookie `hugo.*`        collection user/session/account/verification/passkey
 *   adminAuth   /api/admin-auth/*  cookie `hugo-admin.*`  collection admin_user/admin_session/…
 *
 * Tách vì hai lẽ: một trình duyệt có thể vừa là thành viên vừa là admin (trước
 * đây cũng là hai cookie `member_jwt` / `jwt`), và tài khoản admin không bao giờ
 * được lẫn vào danh sách thành viên.
 *
 * Admin: không mật khẩu, không Telegram — mã 6 số gửi về email RIÊNG của từng
 * admin (emailOTP, cấm tự đăng ký). Quyền là vai trò của plugin admin; một người
 * giữ được nhiều vai trò, phân cách bằng dấu phẩy ("support,finance").
 *
 * Danh tính phía route vẫn là `req.memberEmail` / `req.admin` như cũ — chỉ
 * middleware/authMiddleware.js đổi cách đọc phiên.
 */
import crypto from 'crypto';
import mongoose from 'mongoose';
import { betterAuth, APIError } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { fromNodeHeaders } from 'better-auth/node';
import { admin, bearer, emailOTP } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements, adminAc } from 'better-auth/plugins/admin/access';
import { passkey } from '@better-auth/passkey';
import { ADMIN_PERMISSIONS, ADMIN_ROLES } from '../../shared/adminAccess.js';
import { allowedOrigins } from '../config/cors.js';
import { GOOGLE_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, JWT_SECRET } from '../utils/secrets.js';
import { sendMagicLinkOtp } from '../services/emailService.js';
import { isEduEmail } from '../utils/eduEmail.js';
import { isDeletedMemberAccount } from '../utils/deletedMemberAccount.js';
import { findActiveSecurityBlock } from '../services/securityEnforcement.js';

const isProd = process.env.NODE_ENV === 'production';
const DAY = 24 * 60 * 60;

const trustedOrigins = (request) => {
  const origin = request?.headers?.get?.('origin') || '';
  const local = !isProd && /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin);
  return local ? [...allowedOrigins, origin] : allowedOrigins;
};

const sendOtp = async ({ email, otp }) => {
  const sent = await sendMagicLinkOtp(email, otp);
  // Gửi hỏng thì nói thật — "đã gửi" là bắt người dùng chờ một mã không bao giờ tới.
  if (!sent?.success) throw new APIError('BAD_GATEWAY', { message: 'Chưa gửi được email chứa mã. Vui lòng thử lại sau.' });
};

const shared = (db, client) => ({
  secret: process.env.BETTER_AUTH_SECRET || JWT_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || (isProd ? 'https://www.hugowishpax.studio' : 'http://localhost:3000'),
  // ponytail: transaction tắt vì Mongo local không phải replica set; bật khi mọi môi trường đều là Atlas.
  database: mongodbAdapter(db, { client, transaction: false }),
  trustedOrigins,
  session: { expiresIn: 14 * DAY, updateAge: DAY, cookieCache: { enabled: true, maxAge: 5 * 60 } },
  rateLimit: { enabled: true, window: 60, max: 30, storage: 'memory' },
  advanced: {
    // server.js chép req.ip (IP thật, utils/clientIp.js) vào header này trước khi gọi Better Auth.
    ipAddress: { ipAddressHeaders: ['x-hugo-client-ip'] },
    defaultCookieAttributes: { sameSite: 'lax', secure: isProd, httpOnly: true },
  },
});

// ── Thành viên ────────────────────────────────────────────────────────────────
async function createBio(user) {
  const Bio = (await import('../models/Bio.js')).default;
  const email = user.email.toLowerCase();
  const isStudent = await isEduEmail(email);
  const expiresAt = new Date(Date.now() + (isStudent ? 365 : 7) * DAY * 1000);
  const base = (user.name || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'user';
  await Bio.updateOne({ email }, {
    $setOnInsert: {
      email,
      displayName: user.name || email.split('@')[0],
      slug: `${base}-${crypto.randomBytes(3).toString('hex')}`,
      avatarUrl: user.image || '',
      provider: 'better-auth',
      status: 'active',
      isEduVerified: isStudent,
      trialExpiresAt: isStudent ? null : expiresAt,
      joyBalance: 1000,
      expiresAt,
    },
  }, { upsert: true });
}

// Tài khoản đã xoá hoặc bị khoá thì không được phát phiên mới, dù đăng nhập bằng đường nào.
async function refuseBlockedMember(session, ctx) {
  const user = await ctx?.context?.internalAdapter?.findUserById(session.userId);
  const email = user?.email?.toLowerCase();
  if (!email) return;
  if (await isDeletedMemberAccount(email)) {
    throw new APIError('GONE', { message: 'Tài khoản đã được xóa sau khi hết thời gian dùng thử.', code: 'ACCOUNT_DELETED' });
  }
  if (await findActiveSecurityBlock({ email })) {
    throw new APIError('FORBIDDEN', { message: 'Tài khoản đang bị khoá theo tiêu chuẩn an toàn.', code: 'ACCESS_BLOCKED' });
  }
}

const buildMemberAuth = (base) => betterAuth({
  ...base,
  appName: 'Hugo Studio',
  basePath: '/api/auth',
  advanced: { ...base.advanced, cookiePrefix: 'hugo' },
  socialProviders: {
    // Đăng nhập Google bằng ID token (nút GIS trên web + bản iOS): audience nhận cả hai client.
    google: {
      clientId: [GOOGLE_CLIENT_ID, GOOGLE_IOS_CLIENT_ID].filter(Boolean),
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },
  account: { accountLinking: { enabled: true, trustedProviders: ['google', 'email-otp'] } },
  plugins: [
    emailOTP({ sendVerificationOTP: sendOtp, otpLength: 6, expiresIn: 600, allowedAttempts: 5 }),
    passkey({
      rpID: process.env.PASSKEY_RP_ID || (isProd ? 'hugowishpax.studio' : 'localhost'),
      rpName: 'Hugo Studio',
      origin: isProd ? allowedOrigins.filter((o) => o.startsWith('https://')) : null,
    }),
    // App Capacitor không gửi được cookie khác origin: nhận phiên qua Bearer.
    bearer(),
  ],
  databaseHooks: {
    user: { create: { after: (user) => createBio(user).catch((e) => console.error('[auth] tạo Bio:', e.message)) } },
    session: { create: { before: refuseBlockedMember } },
  },
});

// ── Quản trị ──────────────────────────────────────────────────────────────────
const ac = createAccessControl({ ...defaultStatements, hugo: ADMIN_PERMISSIONS });
export const adminRoles = Object.fromEntries(Object.entries(ADMIN_ROLES).map(([id, role]) => [id,
  id === 'owner'
    ? ac.newRole({ ...adminAc.statements, hugo: ADMIN_PERMISSIONS })
    : ac.newRole({ hugo: role.permissions })]));

const buildAdminAuth = (base) => betterAuth({
  ...base,
  appName: 'Hugo Studio Admin',
  basePath: '/api/admin-auth',
  advanced: { ...base.advanced, cookiePrefix: 'hugo-admin' },
  session: { ...base.session, modelName: 'admin_session' },
  user: { modelName: 'admin_user' },
  account: { modelName: 'admin_account' },
  verification: { modelName: 'admin_verification' },
  plugins: [
    // Chỉ tài khoản owner đã tạo mới nhận được mã — không ai tự đăng ký làm admin.
    emailOTP({ sendVerificationOTP: sendOtp, otpLength: 6, expiresIn: 300, allowedAttempts: 5, disableSignUp: true }),
    admin({ ac, roles: adminRoles, defaultRole: 'viewer', adminRoles: ['owner'] }),
    bearer(),
  ],
});

// Dựng lúc dùng lần đầu: cần mongoose đã có client (connectDatabase chạy trước khi mount).
let memberInstance;
let adminInstance;
const base = () => {
  const client = mongoose.connection.getClient();
  return shared(client.db(), client);
};
export const memberAuth = () => (memberInstance ||= buildMemberAuth(base()));
export const adminAuth = () => (adminInstance ||= buildAdminAuth(base()));

/** Phiên của request (cookie hoặc Bearer). null nếu không có / hết hạn. */
export const readSession = (instance, req) =>
  instance.api.getSession({ headers: fromNodeHeaders(req.headers) }).catch(() => null);

/** Xoá tài khoản đăng nhập của một thành viên (phiên, liên kết Google, passkey). */
export async function deleteMemberLogin(email) {
  const ctx = await memberAuth().$context;
  const user = await ctx.internalAdapter.findUserByEmail(String(email).toLowerCase());
  if (!user?.user) return;
  await ctx.adapter.deleteMany({ model: 'passkey', where: [{ field: 'userId', value: user.user.id }] });
  await ctx.internalAdapter.deleteUser(user.user.id);
}

/** Đăng xuất mọi thiết bị của một thành viên. */
export async function revokeMemberSessions(email) {
  const ctx = await memberAuth().$context;
  const user = await ctx.internalAdapter.findUserByEmail(String(email).toLowerCase());
  if (user?.user) await ctx.internalAdapter.deleteUserSessions(user.user.id);
}

/**
 * Có cookie phiên do CHÍNH máy chủ này ký không — kiểm đồng bộ, không chạm DB.
 * Dành cho lớp chạy trên mọi request (khiên tải, cổng IP): chỉ cần biết "người
 * đã đăng nhập", chưa cần biết là ai. Định dạng là cookie ký của better-call:
 * `${token}.${base64(HMAC-SHA256(secret, token))}`.
 * ponytail: không kiểm hết hạn/thu hồi (requireMember lo việc đó), và Bearer của
 * app native không mang chữ ký nên không tính — native chỉ mất quyền ưu tiên khi quá tải.
 */
export function signedSessionRole(req) {
  const secret = process.env.BETTER_AUTH_SECRET || JWT_SECRET;
  const cookies = req.cookies || {};
  for (const [role, prefix] of [['member', 'hugo'], ['admin', 'hugo-admin']]) {
    const raw = cookies[`__Secure-${prefix}.session_token`] || cookies[`${prefix}.session_token`];
    if (!raw) continue;
    const value = decodeURIComponent(raw);
    const at = value.lastIndexOf('.');
    if (at < 1) continue;
    const expected = crypto.createHmac('sha256', secret).update(value.slice(0, at)).digest('base64');
    const given = value.slice(at + 1);
    if (given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) return role;
  }
  return null;
}
