// !! IMPORTANT: Hardcoding secrets like this is insecure. !!
// !! For demo purposes only. Real apps use environment variables !!
// !! and proper authentication methods (JWT, sessions, etc.). !!
const ADMIN_TOKEN = '12345'; // Choose your secret token

const checkAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization; // Check for 'Authorization' header

  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Extract token if 'Bearer <token>' format is used
    token = authHeader.split(' ')[1];
  }

  // Check if the extracted token matches our secret token
  if (token === ADMIN_TOKEN) {
    // Token is valid, allow request to proceed to the next handler
    next();
  } else {
    // Token is invalid or missing
    console.warn('Auth attempt failed: Invalid or missing token.'); // Log failed attempts
    res.status(401).json({ error: 'Unauthorized: Access denied' });
    // DO NOT call next() here - stop the request chain
  }
};

export default checkAdminToken;