const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const verifyRole = require('../middleware/verifyRole');
const rateLimiter = require('../middleware/rateLimiter');
const LoginLog = require('../models/LoginLog');
const { assignAdminRole, revokeAdminRole, getActivityFeed } = require('../controllers/adminController');
const { setRoles } = require('../controllers/roleController');
const { Parser } = require('json2csv');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

// Apply rate limiting globally
router.use(rateLimiter());

// Get all contacts
router.get('/contacts', verifyRole('admin'), async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    logger.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Error fetching contacts' });
  }
});

// Delete a single contact
router.delete('/contact/:id', verifyRole('admin'), async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    logger.error('Error deleting contact:', error);
    res.status(500).json({ message: 'Error deleting contact' });
  }
});

// Bulk delete contacts
router.delete('/contacts/bulk', verifyRole('admin'), async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty contact IDs' });
    }

    const result = await Contact.deleteMany({ _id: { $in: ids } });

    res.json({
      message: 'Contacts deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    logger.error('Error bulk deleting contacts:', error);
    res.status(500).json({ message: 'Error deleting contacts' });
  }
});

// Get contact statistics
router.get('/stats', verifyRole('admin'), async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayContacts = await Contact.countDocuments({
      createdAt: { $gte: today }
    });

    res.json({
      totalContacts,
      todayContacts
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// GET /api/admin/login-logs?page=1&limit=10&search=&provider=&startDate=&endDate=
router.get('/login-logs', verifyRole('admin'), async (req, res) => {
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '10');
  const search = req.query.search || '';
  const provider = req.query.provider || '';
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  const query = {};

  if (search) {
    query.$or = [
      { emailOrPhone: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } }
    ];
  }

  if (provider) {
    query.provider = provider;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      query.createdAt.$lte = end;
    }
  }

  try {
    const logs = await LoginLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await LoginLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    logger.error('Failed to fetch login logs:', err);
    res.status(500).json({ error: 'Failed to fetch login logs' });
  }
});

// GET /api/admin/login-log-stats
router.get('/login-log-stats', verifyRole('admin'), async (req, res) => {
  try {
    const totalLogins = await LoginLog.countDocuments();
    const lastLogin = await LoginLog.findOne().sort({ createdAt: -1 });

    const providerCounts = await LoginLog.aggregate([
      {
        $group: {
          _id: "$provider",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalLogins,
      lastLogin,
      providerCounts
    });
  } catch (error) {
    logger.error('Error fetching login log stats:', error);
    res.status(500).json({ message: 'Error fetching login log stats' });
  }
});

// GET /api/admin/login-logs/recent - latest 100 logs
router.get('/login-logs/recent', verifyRole('admin'), async (req, res) => {
  try {
    const logs = await LoginLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    logger.error('❌ Failed to fetch recent login logs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export login logs with pagination
router.get('/export-login-logs', verifyRole('admin'), async (req, res) => {
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '1000');

  try {
    const logs = await LoginLog.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

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
    res.attachment(`login_logs_page${page}.csv`);
    return res.send(csv);
  } catch (err) {
    logger.error("❌ Error exporting login logs:", err);
    return res.status(500).json({ error: "Failed to export login logs" });
  }
});

// Export audit logs with pagination
router.get('/export-audit-logs', verifyRole('admin'), async (req, res) => {
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '1000');

  try {
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

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
    res.attachment(`audit_logs_page${page}.csv`);
    return res.send(csv);
  } catch (err) {
    logger.error("❌ Failed to export audit logs:", err.message);
    res.status(500).json({ error: "Failed to export audit logs" });
  }
});

// General role assignment endpoint (RBAC)
router.post('/set-roles', verifyRole('superadmin'), setRoles);

// Assign admin role to a user
router.post('/assign-admin', verifyRole('superadmin'), assignAdminRole);

// Revoke admin role from a user
router.post('/revoke-admin', verifyRole('superadmin'), revokeAdminRole);

// Admin activity feed for superadmin monitoring
router.get('/activity-feed', verifyRole('superadmin'), getActivityFeed);

module.exports = router;