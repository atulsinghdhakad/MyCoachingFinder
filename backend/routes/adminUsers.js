const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const AuditLog = require('../models/AuditLog'); // ensure this exists and is connected to MongoDB

// Middleware to verify Firebase Admin token
const verifyAdminToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const isAdminSession = decoded?.email && decoded?.email.endsWith('@yourdomain.com'); // Customize logic
    if (!isAdminSession) return res.status(403).json({ message: 'Forbidden' });
    req.user = decoded;
    next();
  } catch (err) {
    logger.error('Token error:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// GET /api/admin/users
router.get('/users', verifyAdminToken, async (req, res) => {
  try {
    const listAllUsers = async (nextPageToken, allUsers = []) => {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      const users = allUsers.concat(result.users.map(u => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName || '',
        photoURL: u.photoURL || '',
        disabled: u.disabled,
      })));
      return result.pageToken ? listAllUsers(result.pageToken, users) : users;
    };

    const users = await listAllUsers();
    res.json({ users });
  } catch (error) {
    logger.error('Error listing users:', error);
    res.status(500).json({ message: 'Failed to list users' });
  }
});

// DELETE /api/admin/users/:uid
router.delete('/users/:uid', verifyAdminToken, async (req, res) => {
  const { uid } = req.params;
  try {
    await admin.auth().deleteUser(uid);

    // Log to AuditLog
    await AuditLog.create({
      action: `Deleted user UID: ${uid}`,
      actor: req.user.email,
      timestamp: new Date(),
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// PUT /api/admin/users/:uid
router.put('/users/:uid', verifyAdminToken, async (req, res) => {
  const { uid } = req.params;
  const { displayName } = req.body;

  if (!displayName) return res.status(400).json({ message: 'Display name is required' });

  try {
    await admin.auth().updateUser(uid, { displayName });

    // Log to AuditLog
    await AuditLog.create({
      action: `Updated name of UID: ${uid} to "${displayName}"`,
      actor: req.user.email,
      timestamp: new Date(),
    });

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

module.exports = router;
