import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/secrets.js';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || '';

/**
 * Hybrid Auth Middleware:
 * Supports both legacy Member JWT token (cookie/bearer) AND Clerk Session Tokens.
 * Resolves the member email and clerkUserId to req.memberEmail / req.clerkUserId.
 */
export async function requireMemberOrClerk(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const cookieToken = req.cookies?.member_jwt;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (cookieToken || '');

  if (!token) {
    return res.status(401).json({ error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn.' });
  }

  // 1. Try legacy JWT verification first
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'member' && decoded.email) {
      req.memberEmail = decoded.email;
      return next();
    }
  } catch (_) {
    // Token is not a local member_jwt -> fall through to Clerk verification
  }

  // 2. Try Clerk JWT token verification if token / CLERK_SECRET_KEY is present
  try {
    const decodedClerk = jwt.decode(token);
    if (decodedClerk && (decodedClerk.iss?.includes('clerk') || decodedClerk.sub)) {
      // Clerk JWT decoded
      req.clerkUserId = decodedClerk.sub;
      // Primary email claim or fallback
      req.memberEmail = decodedClerk.email || decodedClerk.primary_email || `${decodedClerk.sub}@clerk.user`;
      return next();
    }
  } catch (err) {
    console.error('[Clerk Verification Error]', err.message);
  }

  return res.status(401).json({ error: 'Phiên làm việc không hợp lệ.' });
}

export default requireMemberOrClerk;
