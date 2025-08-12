// models/AuditLog.js
const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    actor: {
      type: String,
      required: true, // UID or email of actor
      trim: true,
    },
    target: {
      type: String,
      default: null, // UID or ID of affected user/entity
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}, // Additional info (e.g., payload, before/after values)
    },
    ip: {
      type: String,
      default: null, // Captured IP address
      trim: true,
    },
    userAgent: {
      type: String,
      default: null, // Captured User-Agent string
      trim: true,
    },
    fingerprint: {
      type: String,
      default: null, // Device fingerprint/hash if available
      trim: true,
    },
    schemaVersion: {
      type: Number,
      default: 1, // For future migrations/changes
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Index for querying by timestamp
AuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
