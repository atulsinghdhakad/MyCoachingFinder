const logger = require('./utils/logger');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { body, validationResult } = require('express-validator');

// Import routes and models
const adminRoutes = require('./routes/adminRoutes'); // ✅ Keep only this one
const otpRoutes = require("./routes/api/otp").default || require("./routes/api/otp");
const Contact = require('./models/Contact');
const User = require('./models/User');
const AuditLog = require('./models/AuditLog');
const logLogin = require('./controllers/logLogin');
const OtpAttempt = require("./models/OtpAttempt");
const verifyAdminToken = require('./middleware/verifyAdminToken');

const verifyRole = require("../middleware/verifyRole");
const Sentry = require("./utils/sentry");

const errorHandler = require("./middlewares/errorHandler");

// Your routes (example)
app.use("/api/admin", require("./routes/admin"));
app.use("/api/auth", require("./routes/auth"));

// 👇 Add this after all route declarations
app.use(errorHandler);

app.use(Sentry.Handlers.requestHandler());
// ...your routes
app.use(Sentry.Handlers.errorHandler());



const PORT = process.env.PORT || 5001;

const app = express();

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", "data:", 'https://maps.googleapis.com'],
      connectSrc: ["'self'", 'https://maps.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

app.use('/api/', apiLimiter);

const corsOptions = {
  origin: ['http://localhost:5005', 'https://yourfrontend.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token', 'admin-token'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

const recaptchaRoutes = require("./routes/recaptcha").default || require("./routes/recaptcha");
app.use("/api/recaptcha", recaptchaRoutes);
app.use("/api/otp", otpRoutes);

require('dotenv').config();
app.use(express.json());



// your existing routes...


// const adminRoutes = require('./routes/adminRoutes');
// 

const adminUsersRoutes = require('./routes/adminUsers');
app.use('/api/admin', adminUsersRoutes);
app.use("/api/admin/otp-resend", require("./routes/admin/otpResend"));
app.use('/api', adminRoutes);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));

router.post(
  "/something",
  verifyAdminToken,
  verifyRole(["admin", "superadmin"]),
  handlerFn
);


// ✅ In production, secure your MongoDB URI via strong passwords & IP whitelist
// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => logger.info('🗄️ Connected to MongoDB'))
.catch((err) => logger.error('❌ MongoDB Error:', err));

// ✅ Secure your Firebase Admin SDK: do NOT commit serviceAccount.json; use env vars

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  }
});

// User Registration/Login Handler
app.post('/api/users/register', [
  body('uid').notEmpty().withMessage('UID is required'),
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { uid, email, name, photoURL } = req.body;
    logger.info('📝 [User Registration] Attempt:', { uid, email, name });
    
    if (!uid || !email) {
      logger.info('❌ [User Registration] Missing UID or email:', { uid, email });
      return res.status(400).json({ error: 'UID and email are required' });
    }

    // Check if user already exists
    let user = await User.findOne({ uid });
    
    if (user) {
      // Update existing user's information
      const updates = {};
      if (user.email !== email) updates.email = email;
      if (user.name !== name && name) updates.name = name;
      if (user.photoURL !== photoURL && photoURL) updates.photoURL = photoURL;
      updates.lastLogin = new Date();

      if (Object.keys(updates).length > 0) {
        user = await User.findOneAndUpdate(
          { uid },
          { $set: updates },
          { new: true }
        );
        logger.info('👤 [User Registration] User updated in MongoDB:', user.email);
      }
    } else {
      // Create new user
      user = new User({
        uid,
        email,
        name: name || 'Unnamed',
        photoURL: photoURL || '',
        role: 'user',
        requestedAdmin: false,
        enable2FA: false,
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      await user.save();
      logger.info('👤 [User Registration] New user inserted in MongoDB:', user.email);
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        requestedAdmin: user.requestedAdmin,
        enable2FA: user.enable2FA,
        photoURL: user.photoURL,
        settings: user.settings
      }
    });

    // Log the login
    await logLogin({
      uid: user.uid,
      email: user.email,
      provider: req.body.provider || 'unknown'
    });
  } catch (error) {
    logger.error('❌ [User Registration] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Store email for UID (fallback for social login without email)
app.post('/api/store-user-email', [
  body('uid').notEmpty().withMessage('UID is required'),
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { uid, email } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ error: 'UID and email are required.' });
  }

  const ADMIN_EMAILS = [
    'admin@coachingfinder.com',
    'atulsinghdhakad15@gmail.com',
    'test@test.com',
    'kuwai@gmail.com'
  ];

  try {
    let user = await User.findOne({ uid });

    if (user) {
      user.email = email;

      if (ADMIN_EMAILS.includes(email)) {
        user.role = 'admin';
        logger.info(`🛡️ Auto-assigned admin role to: ${email}`);
      }

      await user.save();
    } else {
      const newUser = {
        uid,
        email,
        role: ADMIN_EMAILS.includes(email) ? 'admin' : 'user',
        requestedAdmin: false,
        enable2FA: false,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      user = await User.create(newUser);
      if (newUser.role === 'admin') {
        logger.info(`🛡️ Auto-created admin user: ${email}`);
      }
    }

    logger.info(`✅ Stored email for UID ${uid}: ${email}`);
    res.status(200).json({ message: 'Email stored successfully.' });
  } catch (err) {
    logger.error('❌ Store Email Error:', err);
    res.status(500).json({ error: 'Failed to store email.' });
  }
});

// Get User Profile
app.get('/api/users/me', async (req, res) => {
  try {
    const { uid } = req.query;
    
    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }

    const user = await User.findOne({ uid });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      uid: user.uid,
      email: user.email,
      name: user.name,
      role: user.role,
      requestedAdmin: user.requestedAdmin,
      enable2FA: user.enable2FA,
      photoURL: user.photoURL,
      settings: user.settings
    });
  } catch (error) {
    logger.error('❌ Get User Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update User Settings
app.post('/api/users/settings', [
  body('uid').notEmpty().withMessage('UID is required'),
  body('settings').notEmpty().withMessage('Settings are required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { uid, settings } = req.body;
    
    if (!uid || !settings) {
      return res.status(400).json({ error: 'UID and settings are required' });
    }

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: { settings } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info('⚙️ User settings updated in MongoDB:', user.email);
    res.json({ message: 'Settings updated successfully', settings: user.settings });
  } catch (error) {
    logger.error('❌ Update Settings Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update User Profile
app.post('/api/users/profile', async (req, res) => {
  try {
    const { uid, name, photoURL } = req.body;
    
    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (photoURL) updates.photoURL = photoURL;

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: updates },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info('👤 User profile updated in MongoDB:', user.email);
    res.json({
      message: 'Profile updated successfully',
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        photoURL: user.photoURL
      }
    });
  } catch (error) {
    logger.error('❌ Update Profile Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Request Admin Access
app.post('/api/users/request-admin', async (req, res) => {
  try {
    const { uid } = req.body;
    
    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }

    const user = await User.findOne({ uid });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Already admin' });
    }

    if (user.requestedAdmin) {
      return res.status(400).json({ error: 'Already requested admin access' });
    }

    await User.findOneAndUpdate(
      { uid },
      { $set: { requestedAdmin: true } }
    );

    logger.info('🔐 Admin access requested by user:', user.email);
    res.json({ message: 'Admin access requested successfully' });
  } catch (error) {
    logger.error('❌ Request Admin Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get All Users (Admin only)
app.get('/api/admin/users', verifyAdminToken, async (req, res) => {
  try {
    const users = await User.find({}, {
      uid: 1,
      email: 1,
      name: 1,
      role: 1,
      requestedAdmin: 1,
      enable2FA: 1,
      photoURL: 1,
      createdAt: 1,
      lastLogin: 1
    }).sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    logger.error('❌ Get Users Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Admin Requests (Admin only)
app.get('/api/admin/requests', verifyAdminToken, async (req, res) => {
  try {
    const requests = await User.find(
      { requestedAdmin: true },
      { uid: 1, email: 1, name: 1, photoURL: 1 }
    );

    res.json({ requests });
  } catch (error) {
    logger.error('❌ Get Admin Requests Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Admin Status (Admin only)
app.post('/api/admin/update-status', [
  verifyAdminToken,
  body('uid').notEmpty().withMessage('UID is required'),
  body('status').isIn(['approved', 'rejected']).withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { uid, status } = req.body;
    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await User.findOneAndUpdate(
      { uid },
      {
        $set: {
          role: status === 'approved' ? 'admin' : 'user',
          requestedAdmin: false
        }
      }
    );
    // Audit logging
    await AuditLog.create({
      action: `Admin status ${status}`,
      actor: req.user?.uid || 'unknown',
      target: uid,
      metadata: { status },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    });
    logger.info(`🔐 Admin request ${status} for user:`, user.email);
    res.json({ message: `Admin request ${status} successfully` });
  } catch (error) {
    logger.error('❌ Update Admin Status Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export Audit Logs (Admin only)
app.get('/api/admin/export-audit-logs', verifyAdminToken, async (req, res) => {
  try {
    const logs = await AuditLog.find();
    const csv = logs.map(log =>
      `${log.timestamp},${log.action},${log.actor},${log.target || ''},${JSON.stringify(log.metadata)}`
    ).join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment('audit-logs.csv');
    res.send(csv);
  } catch (err) {
    logger.error('❌ Export Logs Error:', err);
    res.status(500).json({ error: 'Failed to export logs' });
  }
});

// Revoke Admin Route (Admin only)
app.post('/api/admin/revoke-admin', verifyAdminToken, async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: 'UID is required' });

  try {
    const user = await User.findOneAndUpdate({ uid }, { role: 'user' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await AuditLog.create({
      action: 'Revoke Admin',
      actor: req.user.uid,
      target: uid,
      metadata: {
        reason: 'manual revoke',
        actorEmail: req.user.email || '',
      },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    });

    res.json({ message: 'Admin rights revoked' });
  } catch (err) {
    logger.error('❌ Revoke Admin Error:', err);
    res.status(500).json({ error: 'Failed to revoke admin' });
  }
});

// Contact Form Handler
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    logger.info('📩 [Contact Form] Submission received:', { name, email, message });
    if (!name || !email || !message) {
      logger.info('❌ [Contact Form] Missing fields:', { name, email, message });
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newContact = new Contact({ name, email, message });
    await newContact.save();
    logger.info('✅ [Contact Form] Saved to MongoDB:', { name, email });

    // Send Email Notification
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASS) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_EMAIL,
          to: process.env.SMTP_EMAIL,
          subject: '📩 New Contact Submission - Coaching Finder',
          html: `
            <h3>New Message</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong><br>${message}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          `,
        });
        logger.info('✅ [Contact Form] Email notification sent to:', process.env.SMTP_EMAIL);
      } catch (emailError) {
        logger.error('❌ [Contact Form] Email sending failed:', emailError.message);
      }
    } else {
      console.warn('⚠️ [Contact Form] SMTP_EMAIL or SMTP_PASS not set. Email not sent.');
    }

    res.status(201).json({ message: 'Form saved successfully' });
  } catch (error) {
    logger.error('❌ [Contact Form] Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Google Places API
app.get('/api/places', async (req, res) => {
  const { lat, lng } = req.query;
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=establishment&keyword=coaching&key=${process.env.GOOGLE_API_KEY}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    logger.error('❌ Places API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

// Simple endpoint to check contacts (for testing)
app.get('/api/check-contacts', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ 
      count: contacts.length, 
      contacts: contacts 
    });
  } catch (error) {
    logger.error('❌ Check Contacts Error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Admin routes
// (app.use('/api/admin', adminRoutes);) // Removed duplicate, already used above



// Middleware
// for parsing application/json

// Routes
// app.use('/api/otp', otpRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('✅ Server running');
});

// ✅ OTP Attempt Meta (for resend logic)
app.get('/api/otp/attempt-meta', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const attempt = await OtpAttempt.findOne({ phone }).sort({ createdAt: -1 });

    if (!attempt) {
      return res.status(404).json({ error: 'No OTP attempt found for this number' });
    }

    res.json({ attempt });
  } catch (error) {
    logger.error('❌ OTP Attempt Meta Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('❌ Global Error Handler:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// app.listen(PORT, () => {
//   logger.info(`🚀 Server running at http://localhost:${PORT}`);
// });


// Start Server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
});