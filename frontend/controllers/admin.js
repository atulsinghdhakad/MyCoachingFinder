// Example: routes/auth.js or controllers/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/check-admin-role', async (req, res) => {
const { uid } = req.body;
try {
    const user = await User.findOne({ uid });
    if (user?.role === 'admin') {
    res.json({ isAdmin: true, user });
    } else {
    res.status(403).json({ isAdmin: false });
    }
} catch (err) {
    res.status(500).json({ error: 'Server error' });
}
});
