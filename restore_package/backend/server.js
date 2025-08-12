const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Import routes and models
const adminRoutes = require('./routes/admin');
const Contact = require('./models/Contact');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://coachingfinder1.vercel.app'],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token', 'admin-token'],
  credentials: true
}));

app.options('*', cors()); // Enable pre-flight across the board

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('🗄️ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB Error:', err));

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  }
});

// User Registration/Login Handler
app.post('/api/users/register', async (req, res) => {
  try {
    const { uid, email, name, photoURL } = req.body;
    
    if (!uid || !email) {
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
        console.log('👤 User updated in MongoDB:', user.email);
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
      console.log('👤 New user inserted in MongoDB:', user.email);
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
  } catch (error) {
    console.error('❌ User Registration Error:', error);
    res.status(500).json({ error: 'Server error' });
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
    console.error('❌ Get User Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update User Settings
app.post('/api/users/settings', async (req, res) => {
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

    console.log('⚙️ User settings updated in MongoDB:', user.email);
    res.json({ message: 'Settings updated successfully', settings: user.settings });
  } catch (error) {
    console.error('❌ Update Settings Error:', error);
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

    console.log('👤 User profile updated in MongoDB:', user.email);
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
    console.error('❌ Update Profile Error:', error);
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

    console.log('🔐 Admin access requested by user:', user.email);
    res.json({ message: 'Admin access requested successfully' });
  } catch (error) {
    console.error('❌ Request Admin Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get All Users (Admin only)
app.get('/api/admin/users', async (req, res) => {
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
    console.error('❌ Get Users Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Admin Requests (Admin only)
app.get('/api/admin/requests', async (req, res) => {
  try {
    const requests = await User.find(
      { requestedAdmin: true },
      { uid: 1, email: 1, name: 1, photoURL: 1 }
    );

    res.json({ requests });
  } catch (error) {
    console.error('❌ Get Admin Requests Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Admin Status (Admin only)
app.post('/api/admin/update-status', async (req, res) => {
  try {
    const { uid, status } = req.body;
    
    if (!uid || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid input' });
    }

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

    console.log(`🔐 Admin request ${status} for user:`, user.email);
    res.json({ message: `Admin request ${status} successfully` });
  } catch (error) {
    console.error('❌ Update Admin Status Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Contact Form Handler
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newContact = new Contact({ name, email, message });
    await newContact.save();

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
        console.log('✅ Email notification sent');
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError.message);
        // Continue with the response even if email fails
      }
    }

    res.status(201).json({ message: 'Form saved successfully' });
  } catch (error) {
    console.error('❌ Contact Form Error:', error);
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
    console.error('❌ Places API Error:', error.message);
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
    console.error('❌ Check Contacts Error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Admin routes
app.use('/api/admin', adminRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});