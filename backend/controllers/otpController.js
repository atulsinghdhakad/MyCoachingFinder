const OtpAttempt = require('../models/OtpAttempt');
const { validationResult } = require('express-validator');

// Check if OTP can be sent
const checkOtpEligibility = async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Input validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find or create OTP attempt record
    let otpAttempt = await OtpAttempt.findOne({ phone });
    
    // If no record exists, user can request OTP
    if (!otpAttempt) {
      return res.json({ 
        canSend: true,
        remainingAttempts: 3,
        isFirstAttempt: true
      });
    }

    // Check if user is in cooldown
    const canResend = otpAttempt.canResendOTP();
    
    if (canResend.canResend) {
      return res.json({
        canSend: true,
        remainingAttempts: 3 - otpAttempt.attempts,
        isFirstAttempt: false
      });
    } else {
      return res.status(429).json({
        canSend: false,
        message: canResend.message,
        remainingTime: canResend.remainingTime,
        retryAfter: otpAttempt.lockUntil
      });
    }
  } catch (error) {
    console.error('Error checking OTP eligibility:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Record OTP attempt
const recordOtpAttempt = async (phone, ip, userAgent, attemptType = 'initial') => {
  try {
    let otpAttempt = await OtpAttempt.findOne({ phone });
    
    if (!otpAttempt) {
      otpAttempt = new OtpAttempt({ phone });
    }
    
    // Record the attempt
    await otpAttempt.recordAttempt(ip, userAgent, attemptType);
    
    return {
      success: true,
      attempts: otpAttempt.attempts,
      isLocked: otpAttempt.isLocked,
      lockUntil: otpAttempt.lockUntil
    };
  } catch (error) {
    console.error('Error recording OTP attempt:', error);
    throw error;
  }
};

// Reset OTP attempts (for successful verification)
const resetOtpAttempts = async (phone) => {
  try {
    const otpAttempt = await OtpAttempt.findOne({ phone });
    
    if (otpAttempt) {
      await otpAttempt.resetAttempts();
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error resetting OTP attempts:', error);
    throw error;
  }
};

// Get OTP attempt status
const getOtpStatus = async (phone) => {
  try {
    const otpAttempt = await OtpAttempt.findOne({ phone });
    
    if (!otpAttempt) {
      return {
        attempts: 0,
        isLocked: false,
        remainingAttempts: 3,
        lastAttempt: null,
        lockUntil: null
      };
    }
    
    const canResend = otpAttempt.canResendOTP();
    
    return {
      attempts: otpAttempt.attempts,
      isLocked: !canResend.canResend,
      remainingAttempts: Math.max(0, 3 - otpAttempt.attempts),
      lastAttempt: otpAttempt.lastAttempt,
      lockUntil: otpAttempt.lockUntil,
      remainingTime: canResend.remainingTime || 0
    };
  } catch (error) {
    console.error('Error getting OTP status:', error);
    throw error;
  }
};

module.exports = {
  checkOtpEligibility,
  recordOtpAttempt,
  resetOtpAttempts,
  getOtpStatus
};
