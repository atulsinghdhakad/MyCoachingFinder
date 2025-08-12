// backend/models/LoginLog.js

const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  email: String,
  phoneNumber: String,
  provider: { type: String, required: true },
  displayName: String,
  photoURL: String,
  createdAt: Date,
  lastLoginAt: Date,
  ip: { type: String, default: null },
  userAgent: { type: String, default: null },
  fingerprint: { type: String, default: null },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('LoginLog', loginLogSchema);