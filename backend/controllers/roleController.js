// backend/controllers/roleController.js
const admin = require('firebase-admin');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { ROLES, ROLE_HIERARCHY } = require('../utils/roles');
const logger = require('../utils/logger');
const { extractRequestInfo } = require('./adminController');

// Only superadmins can set roles
async function setRoles(req, res) {
  const { uid, role } = req.body;
  const actorUID = req.user?.uid;

  if (!uid || typeof uid !== 'string' || uid.length < 10) {
    return res.status(400).json({ error: 'Valid UID is required' });
  }
  if (!role || !ROLE_HIERARCHY.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  if (!req.user || req.user.role !== ROLES.SUPERADMIN) {
    return res.status(403).json({ error: 'Forbidden: Only superadmins can set roles' });
  }

  try {
    const userDoc = await User.findOne({ uid });
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found in DB' });
    }
    // Set custom claims
    const claims = {};
    ROLE_HIERARCHY.forEach(r => { claims[r] = false; });
    claims[role] = true;
    await admin.auth().setCustomUserClaims(uid, claims);
    await User.findOneAndUpdate({ uid }, { $set: { role } });

    const requestInfo = extractRequestInfo(req);
    await AuditLog.create({
      action: 'set-role',
      actor: actorUID,
      target: uid,
      metadata: { newRole: role, method: 'POST /admin/set-roles', fingerprint: requestInfo.fingerprint },
      ip: requestInfo.ip,
      userAgent: requestInfo.userAgent,
    });
    return res.status(200).json({ message: `Role '${role}' assigned to UID: ${uid}` });
  } catch (error) {
    logger.error('❌ Failed to set role:', error.message);
    return res.status(500).json({ error: 'Failed to set role' });
  }
}

module.exports = { setRoles };
