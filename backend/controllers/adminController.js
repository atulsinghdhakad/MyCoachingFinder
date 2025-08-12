// backend/controllers/adminController.js
const admin = require("firebase-admin");
const User = require("../models/User"); // Add this line

const logger = require("../utils/logger");


const AuditLog = require("../models/AuditLog"); // You'll need to create this model if not already present

const extractRequestInfo = (req) => {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    null;

  const userAgent = req.headers['user-agent'] || null;
  const fingerprint = req.headers['x-device-fingerprint'] || null;

  return { ip, userAgent, fingerprint };
};

const assignAdminRole = async (req, res) => {
  const { uid } = req.body;
  const actorUID = req.user?.uid;

  if (!uid || typeof uid !== "string" || uid.length < 10) {
    return res.status(400).json({ error: "Valid UID is required" });
  }

  if (!req.user || req.user.superadmin !== true) {
    return res.status(403).json({ error: "Forbidden: Only superadmins can assign roles" });
  }

  try {
    const userDoc = await User.findOne({ uid });
    if (!userDoc) {
      return res.status(404).json({ error: "User not found in DB" });
    }

    await admin.auth().setCustomUserClaims(uid, { admin: true });
    await User.findOneAndUpdate({ uid }, { $set: { role: "admin" } });

    const requestInfo = extractRequestInfo(req);
    await AuditLog.create({
      action: "assign-admin",
      actor: actorUID,
      target: uid,
      metadata: {
        method: "POST /assign-admin",
        fingerprint: requestInfo.fingerprint,
      },
      ip: requestInfo.ip,
      userAgent: requestInfo.userAgent,
    });

    return res.status(200).json({ message: `Admin role assigned to UID: ${uid}` });
  } catch (error) {
    logger.error("❌ Failed to assign admin role:", error.message);
    return res.status(500).json({ error: "Failed to assign admin role" });
  }
};

const revokeAdminRole = async (req, res) => {
  const { uid } = req.body;
  const actorUID = req.user?.uid;

  if (!uid || typeof uid !== "string" || uid.length < 10) {
    return res.status(400).json({ error: "Valid UID is required" });
  }

  if (!req.user || req.user.superadmin !== true) {
    return res.status(403).json({ error: "Forbidden: Only superadmins can revoke roles" });
  }

  try {
    const userDoc = await User.findOne({ uid });
    if (!userDoc) {
      return res.status(404).json({ error: "User not found in DB" });
    }

    await admin.auth().setCustomUserClaims(uid, { admin: false });
    await User.findOneAndUpdate({ uid }, { $set: { role: "user" } });

    const requestInfo = extractRequestInfo(req);
    await AuditLog.create({
      action: "revoke-admin",
      actor: actorUID,
      target: uid,
      metadata: {
        reason: "Manual revocation by superadmin",
        method: "POST /revoke-admin",
        fingerprint: requestInfo.fingerprint,
      },
      ip: requestInfo.ip,
      userAgent: requestInfo.userAgent,
    });

    return res.status(200).json({ message: `Admin role revoked for UID: ${uid}` });
  } catch (error) {
    logger.error("❌ Failed to revoke admin role:", error.message);
    return res.status(500).json({ error: "Failed to revoke admin role" });
  }
};

// Fetches the activity feed (audit logs) with pagination
const getActivityFeed = async (req, res) => {
  const page = parseInt(req.query.page || "1");
  const limit = parseInt(req.query.limit || "20");

  try {
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await AuditLog.countDocuments();

    res.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("❌ Failed to fetch activity feed:", error.message);
    res.status(500).json({ error: "Failed to fetch activity feed" });
  }
};

module.exports = {
  assignAdminRole,
  revokeAdminRole,
  getActivityFeed,
};

module.exports.extractRequestInfo = extractRequestInfo;
