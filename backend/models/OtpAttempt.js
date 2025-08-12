const mongoose = require('mongoose');





const otpAttemptSchema = new mongoose.Schema({
  phone: { 
    type: String, 
    required: true, 
    unique: true 
  },
  attempts: { 
    type: Number, 
    default: 0 
  },
  lastAttempt: { 
    type: Date, 
    default: null 
  },
  cooldownStart: { 
    type: Date, 
    default: null 
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockUntil: {
    type: Date,
    default: null
  },
  logs: [{
    attemptType: {
      type: String,
      enum: ['initial', 'resend'],
      required: true
    },
    ip: String,
    userAgent: String,
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  }]
}, { 
  timestamps: true 
});

// Index for faster lookups
otpAttemptSchema.index({ phone: 1 });
otpAttemptSchema.index({ lockUntil: 1 }, { expireAfterSeconds: 0 });

// Add a method to check if resend is allowed
otpAttemptSchema.methods.canResendOTP = async function() {
  // If not locked, resend is allowed
  if (!this.isLocked) return { canResend: true };
  
  // If locked but cooldown has passed, reset and allow
  if (this.lockUntil && this.lockUntil <= new Date()) {
    this.isLocked = false;
    this.attempts = 0;
    this.lockUntil = null;
    return this.save().then(() => ({ canResend: true }));
  }
  
  // Calculate remaining time in minutes
  const remainingTime = Math.ceil((this.lockUntil - new Date()) / (1000 * 60));
  return Promise.resolve({ 
    canResend: false, 
    remainingTime,
    message: `Please wait ${remainingTime} minutes before requesting a new OTP.`
  });
};

// Add a method to record an OTP attempt
otpAttemptSchema.methods.recordAttempt = function(ip, userAgent, attemptType = 'initial') {
  this.attempts += 1;
  this.lastAttempt = new Date();
  
  // Add to logs
  this.logs.push({
    attemptType,
    ip,
    userAgent
  });
  
  // If reached max attempts, start cooldown
  if (this.attempts >= 3) {
    this.isLocked = true;
    this.cooldownStart = new Date();
    this.lockUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  }
  
  return this.save();
};

// Add a method to reset attempts
otpAttemptSchema.methods.resetAttempts = function() {
  this.attempts = 0;
  this.isLocked = false;
  this.cooldownStart = null;
  this.lockUntil = null;
  return this.save();
};

module.exports = mongoose.model('OtpAttempt', otpAttemptSchema);