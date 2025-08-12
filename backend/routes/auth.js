// backend/routes/auth.js or routes/loginLogs.js

const express = require('express');
const router = express.Router();
const LoginLog = require('../models/LoginLog');
const AuditLog = require('../models/AuditLog');

// POST /api/auth/log-login
router.post('/log-login', async (req, res) => {
  try {
    const log = new LoginLog(req.body);
    await log.save();

    // Audit log for admin/superadmin/moderator logins
    const { uid, email, role, provider } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'] || null;
    const fingerprint = req.headers['x-device-fingerprint'] || null;
    const adminRoles = ['admin', 'superadmin', 'moderator'];
    if (role && adminRoles.includes(role)) {
      await AuditLog.create({
        action: 'admin-login',
        actor: uid || email,
        target: null,
        metadata: { provider, role, fingerprint },
        ip,
        userAgent,
        fingerprint,
      });
    }

    res.status(201).json({ success: true });
  } catch (err) {
    logger.error('Login log error:', err);
    res.status(500).json({ success: false, message: 'Failed to log login' });
  }
});

// POST /api/auth/logout → Acknowledge client logout or revoke token
router.post('/logout', async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "UID required" });

  try {
    const admin = require('../firebaseAdmin');
    await admin.auth().revokeRefreshTokens(uid);
    res.json({ message: "User sessions invalidated" });
  } catch (err) {
    logger.error("Logout error:", err);
    res.status(500).json({ error: "Failed to revoke tokens" });
  }
});

module.exports = router;