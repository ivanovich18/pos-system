// pos-backend/middleware/verifyAdmin.js
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("CRITICAL: JWT_SECRET not set for verification!");
    return res.status(500).json({ error: "Internal server configuration error" });
  }

  jwt.verify(token, secret, (err, decodedPayload) => {
    if (err) {
      console.warn("JWT Verification failed:", err.message);
      return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    }

    if (decodedPayload && decodedPayload.role === 'admin') {
      req.user = decodedPayload;
      console.log('Admin access granted for user:', req.user.username);
      next();
    } else {
      console.warn('Forbidden: Non-admin user attempted admin action:', decodedPayload?.username || 'Unknown user');
      return res.status(403).json({ error: 'Forbidden: Admin privileges required' });
    }
  });
};

export default verifyAdmin;