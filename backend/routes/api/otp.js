const express = require("express");
const router = express.Router();
const admin = require('../../firebaseAdmin');
const { getAuth } = require('firebase-admin/auth');
const OtpAttempt = require("../../models/OtpAttempt");
const logger = require("../../utils/logger");

// Get the Firebase Auth instance
const auth = getAuth();
if (!auth) {
  logger.error('Firebase Auth not initialized');
  throw new Error('Firebase Auth not initialized');
}

logger.info('Firebase Admin SDK initialized successfully in OTP routes');

// Check if a phone number is registered in Firebase
router.post("/is-firebase-registered", async (req, res) => {
  try {
    logger.info('Received request to /api/otp/is-firebase-registered', { body: req.body });
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    if (!auth) {
      logger.error('Firebase Auth not initialized');
      return res.status(500).json({ 
        error: 'Authentication service unavailable',
        details: 'Firebase Auth not initialized'
      });
    }

    // Format phone number to E.164 format if needed
    const phoneNumber = phone.startsWith('+') ? phone : `+${phone}`;
    
    try {
      logger.info(`Checking if phone number is registered: ${phoneNumber}`);
      const userRecord = await auth.getUserByPhoneNumber(phoneNumber);
      logger.info(`User found: ${!!userRecord}`);
      return res.json({ 
        success: true,
        registered: true,
        message: 'User found in Firebase Auth'
      });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        logger.info(`User not found for phone: ${phoneNumber}`);
        return res.json({ 
          success: true,
          registered: false,
          message: 'User not found in Firebase Auth'
        });
      }
      
      logger.error('Error checking user registration:', {
        error: error.message,
        code: error.code,
        phone: phoneNumber,
        stack: error.stack
      });
      
      return res.status(500).json({ 
        error: 'Failed to check user registration',
        code: error.code,
        details: error.message
      });
    }
  } catch (error) {
    logger.error('Error checking Firebase registration:', error);
    res.status(500).json({ error: 'Failed to check user registration' });
  }
});

// Get OTP attempt metadata
router.post("/attempt-meta", async (req, res) => {
  try {
    logger.info('Received request to /api/otp/attempt-meta', { body: req.body });
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Find the most recent OTP attempt for this phone number
    const attempt = await OtpAttempt.findOne({ phone })
      .sort({ timestamp: -1 })
      .lean();

    if (!attempt) {
      return res.json({ count: 0, cooldownStart: null });
    }

    // Check if cooldown is active (last 10 minutes)
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const isInCooldown = attempt.timestamp > tenMinutesAgo;
    
    // Count attempts in the last 10 minutes
    const recentAttempts = await OtpAttempt.countDocuments({
      phone,
      timestamp: { $gte: tenMinutesAgo }
    });

    res.json({
      count: recentAttempts,
      cooldownStart: isInCooldown ? attempt.timestamp : null
    });
  } catch (error) {
    logger.error('Error getting OTP attempt meta:', error);
    res.status(500).json({ error: 'Failed to get OTP attempt metadata' });
  }
});

// Log OTP resend attempts
// Log OTP resend attempts with cooldown logic
router.post("/resend-log", async (req, res) => {
  const { phone, timestamp, userAgent } = req.body;

  logger.info(`📤 OTP resend attempt: ${phone}, UA: ${userAgent}`);

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  const recentAttempts = await OtpAttempt.find({
    phone,
    timestamp: { $gte: tenMinutesAgo }
  }).sort({ timestamp: -1 });

  if (recentAttempts.length >= 3) {
    const lastAttempt = recentAttempts[0];
    const cooldownEnd = new Date(lastAttempt.timestamp.getTime() + 10 * 60 * 1000);
    const cooldownRemaining = Math.ceil((cooldownEnd - now) / 1000); // in seconds

    logger.warn(`⚠️ OTP resend blocked for ${phone} - cooldown in effect`);

    return res.status(429).json({
      success: false,
      error: "Too many attempts. Please wait before trying again.",
      cooldownSeconds: cooldownRemaining
    });
  }

  // Save the new OTP attempt
  const otpAttempt = new OtpAttempt({
    phone,
    userAgent,
    timestamp: timestamp || now
  });

  otpAttempt.save().catch(err => {
    logger.error("Failed to save OTP attempt:", err);
  });

  res.json({ success: true });
});

module.exports = router;
