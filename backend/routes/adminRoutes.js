const express = require("express");
const router = express.Router();
const admin = require("../firebaseAdmin");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const { Parser } = require("json2csv");
const AuditLog = require("../models/AuditLog");
const LoginLog = require("../models/LoginLog");

// 🔒 Admin-only: Assign admin role to another user
router.post("/assign-admin", verifyFirebaseToken(true), async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "UID is required" });

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });

    // Log the role change
    const actor = req.user?.uid || "unknown";
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"] || null;

    await AuditLog.create({
      action: "assign_admin",
      actor,
      target: uid,
      metadata: {},
      ip,
      userAgent,
    });

    res.json({ message: "✅ User promoted to admin successfully" });
  } catch (err) {
    logger.error("❌ Failed to assign admin role:", err.message);
    res.status(500).json({ error: "Failed to assign admin role" });
  }
});

// 🔒 Admin-only: Revoke admin role from a user
router.post("/revoke-admin", verifyFirebaseToken(true), async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "UID is required" });

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: false });

    const actor = req.user?.uid || "unknown";
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"] || null;

    await AuditLog.create({
      action: "revoke_admin",
      actor,
      target: uid,
      metadata: {},
      ip,
      userAgent,
    });

    res.json({ message: "✅ Admin role revoked successfully" });
  } catch (err) {
    logger.error("❌ Failed to revoke admin role:", err.message);
    res.status(500).json({ error: "Failed to revoke admin role" });
  }
});

// 🔓 Any authenticated user: Get all users
router.get("/users", verifyFirebaseToken(true), async (req, res) => {
  try {
    const allUsers = await admin.auth().listUsers();
    const formatted = allUsers.users.map((u) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      photoURL: u.photoURL,
      isAdmin: u.customClaims?.admin === true,
      creationTime: u.metadata.creationTime,
      lastSignInTime: u.metadata.lastSignInTime,
    }));
    res.json({ users: formatted });
  } catch (err) {
    logger.error("❌ Failed to list users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// 📝 Export Login Logs as CSV
router.get(
  "/export-login-logs",
  verifyFirebaseToken(true),
  async (req, res) => {
    try {
      const logs = await LoginLog.find().sort({ createdAt: -1 }).limit(1000);

      const fields = [
        { label: "Email/Phone", value: "emailOrPhone" },
        { label: "Provider", value: "provider" },
        { label: "IP", value: "ip" },
        { label: "User Agent", value: "userAgent" },
        { label: "Created At", value: "createdAt" },
      ];

      const parser = new Parser({ fields });
      const csv = parser.parse(logs);

      res.header("Content-Type", "text/csv");
      res.attachment("login_logs.csv");
      return res.send(csv);
    } catch (err) {
      logger.error("❌ Error exporting login logs:", err);
      return res.status(500).json({ error: "Failed to export login logs" });
    }
  }
);

// 🧾 Export audit logs as CSV
router.get(
  "/export-audit-logs",
  verifyFirebaseToken(true),
  async (req, res) => {
    try {
      const logs = await AuditLog.find().lean();
      const fields = [
        "action",
        "actor",
        "target",
        "ip",
        "userAgent",
        "timestamp",
      ];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(logs);

      res.header("Content-Type", "text/csv");
      res.attachment("audit-logs.csv");
      return res.send(csv);
    } catch (err) {
      logger.error("❌ Failed to export audit logs:", err.message);
      res.status(500).json({ error: "Failed to export audit logs" });
    }
  }
);

module.exports = router;
