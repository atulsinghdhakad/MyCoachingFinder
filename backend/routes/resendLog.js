const express = require("express");
const router = express.Router();

// Cooldown tracking per phone number (in-memory; replace with DB for production)
const cooldowns = new Map();
const MAX_ATTEMPTS = 3;
const COOLDOWN_SECONDS = 600; // 10 minutes

router.post("/resend-log", (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res
      .status(400)
      .json({ success: false, message: "Phone number required" });
  }

  const now = Date.now();
  const entry = cooldowns.get(phone) || { count: 0, firstAttemptTime: now };

  // Reset if cooldown passed
  if (now - entry.firstAttemptTime > COOLDOWN_SECONDS * 1000) {
    entry.count = 0;
    entry.firstAttemptTime = now;
  }

  entry.count += 1;

  if (entry.count > MAX_ATTEMPTS) {
    const timeLeft =
      COOLDOWN_SECONDS - Math.floor((now - entry.firstAttemptTime) / 1000);
    cooldowns.set(phone, entry);
    return res.status(429).json({
      success: false,
      message: `Too many attempts. Try again in ${timeLeft}s`,
      cooldownSeconds: timeLeft,
    });
  }

  cooldowns.set(phone, entry);
  return res.json({ success: true });
});

module.exports = router;
