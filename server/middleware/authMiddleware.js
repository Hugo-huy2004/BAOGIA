import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_SECRET } from '../utils/secrets.js';

const MEMBER_TOKEN_TTL = '14d';

const extractToken = (req, cookieName) => {
  let token = req.cookies?.[cookieName];
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }
  return token;
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
    req.admin = decoded;
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

      // Verify User-Agent device fingerprint if embedded in the token
      if (decoded.uaHash) {
        const currentUa = req.headers['user-agent'] || '';
        const currentUaHash = crypto.createHash('sha256').update(currentUa).digest('hex');
        if (decoded.uaHash !== currentUaHash) {
          return res.status(401).json({ error: 'Thiết bị truy cập không trùng khớp với phiên đăng nhập. Vui lòng đăng nhập lại.' });
        }
      }

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
          const bio = await Bio.findOne({ email: decoded.email }, 'locationAnomaly').lean();
          if (bio && bio.locationAnomaly) {
            return res.status(401).json({
              error: 'PHAT_HIEN_VI_TRI_BAT_THUONG',
              message: 'Phát hiện vị trí truy cập bất thường. Vui lòng xác thực lại bằng mã PIN.'
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
