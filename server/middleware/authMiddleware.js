import jwt from 'jsonwebtoken';
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
export const signMemberToken = (email) =>
  jwt.sign({ email: String(email).toLowerCase(), role: 'member' }, JWT_SECRET, { expiresIn: MEMBER_TOKEN_TTL });

// Member authentication. Identity comes exclusively from the verified token —
// any email the client sends in query/body is ignored for identity purposes.
// Admin tokens are also accepted (admin tools act on behalf of users); in that
// case the client-supplied email is trusted and req.isAdminActor is set.
export const requireMember = (req, res, next) => {
  const token = extractToken(req, 'member_jwt') || extractToken(req, 'jwt');

  if (!token) {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'member' && decoded.email) {
      req.memberEmail = decoded.email;
      req.member = decoded;
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
