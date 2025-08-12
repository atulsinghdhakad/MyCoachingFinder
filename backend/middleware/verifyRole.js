const User = require("../models/User");
const admin = require("../firebaseAdmin");
const { roleGreaterOrEqual, ROLES } = require("../utils/roles");
const logger = require("../utils/logger");

// verifyRole(minimumRole: string)
const verifyRole = (minimumRole = ROLES.USER) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;

    // Try getting role from DB, fallback to token claims
    const user = await User.findOne({ uid: decodedToken.uid });
    req.user.role = user?.role || decodedToken.role || (decodedToken.admin ? ROLES.ADMIN : ROLES.USER);

    if (!roleGreaterOrEqual(req.user, minimumRole)) {
      return res.status(403).json({ error: `Forbidden: Requires role ${minimumRole} or higher` });
    }

    // Attach metadata for logging if needed
    req.user.ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    req.user.userAgent = req.headers["user-agent"];

    next();
  } catch (err) {
    logger.error("verifyRole middleware error:", err);
    return res.status(500).json({ error: "Role verification failed" });
  }
};

module.exports = verifyRole;
