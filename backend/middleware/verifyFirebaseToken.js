// backend/middleware/verifyFirebaseToken.js
const admin = require('../firebaseAdmin');

const verifyFirebaseToken = (requireAdmin = false) => {
  return async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    try {
      const decoded = await admin.auth().verifyIdToken(token);

      if (requireAdmin && !decoded.admin) {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
      }

      req.user = decoded;
      next();
    } catch (err) {
      logger.error('❌ Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  };
};

module.exports = verifyFirebaseToken;
