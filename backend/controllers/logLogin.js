// backend/controllers/logLogin.js
const LoginLog = require('../models/LoginLog'); // Optional: if you're logging to DB

module.exports = async function logLogin({ uid, email, provider, req }) {
  logger.info(`✅ [LoginLog] ${email} logged in via ${provider}`);

  // Optional: Save to MongoDB
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const fingerprint = req.headers['x-device-fingerprint'] || 'unknown';

    await LoginLog.create({
      uid,
      email,
      provider,
      ip,
      userAgent,
      fingerprint,
      timestamp: new Date()
    });
  } catch (err) {
    logger.error('❌ Failed to save login log:', err);
  }
};