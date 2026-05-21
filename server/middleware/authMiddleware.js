import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hugo-wishpax-super-secret-key-2024';

export const requireAdmin = (req, res, next) => {
  let token = req.cookies?.jwt;

  // Fallback to Authorization header if no cookie
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden - Not an admin role" });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Forbidden - Invalid or expired admin token" });
  }
};
