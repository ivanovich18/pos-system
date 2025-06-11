// pos-backend/middleware/verifyToken.js
import jwt from 'jsonwebtoken';
import 'dotenv/config'; // Ensure .env is loaded

const verifyToken = (req, res, next) => {
  // Get token from Authorization header (Bearer <token>)
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Extract token part

  if (!token) {
    // No token provided
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
      console.error("JWT_SECRET not set for verification!");
      return res.status(500).json({error: "Internal server configuration error"});
  }

  // Verify the token
  jwt.verify(token, secret, (err, decodedPayload) => {
    if (err) {
      // Token is invalid (e.g., expired, wrong signature)
      console.warn("JWT Verification failed:", err.message);
      // Use 403 Forbidden generally for invalid/expired tokens
      return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    }

    // Token is valid, attach payload to request object
    // This makes user info (like userId, username) available in subsequent route handlers
    req.user = decodedPayload;
    console.log('Token verified successfully for user:', req.user.username); // Optional log
    next(); // Proceed to the next middleware or route handler
  });
};

export default verifyToken;