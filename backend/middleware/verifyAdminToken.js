// backend/middleware/verifyAdminToken.js

const admin = require("firebase-admin");

const verifyAdminToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("🚫 No token provided in Authorization header.");
    return res.status(401).json({ error: "No token provided" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (decodedToken.admin === true) {
      req.user = decodedToken;
      // Attach request context for audit logging
      req.user.context = {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      };
      console.info(`✅ Admin access granted: UID=${decodedToken.uid}`);
      return next();
    } else {
      console.warn(`⚠️ Forbidden access attempt by UID=${decodedToken.uid}`);
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }
  } catch (err) {
    logger.error("❌ verifyAdminToken error:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = verifyAdminToken;
