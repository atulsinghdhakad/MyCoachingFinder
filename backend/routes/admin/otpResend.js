// routes/admin/otpResend.js
const express = require("express");
const router = express.Router();
const OtpAttempt = require("../../models/OtpAttempt");
const adminMiddleware = require("../../middleware/verifyAdmin");

router.post("/", adminMiddleware, async (req, res) => {
  const { phone } = req.body;

  if (!phone)
    return res.status(400).json({ error: "Phone number is required" });

  try {
    // Log the resend trigger by admin
    await OtpAttempt.create({
      phone,
      ipAddress: "admin-resend",
      attemptCount: 1,
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `OTP resend logged for ${phone}. Please ask user to request it again.`,
    });
  } catch (err) {
    logger.error("OTP resend error:", err);
    return res.status(500).json({ error: "Failed to log OTP resend." });
  }
});

module.exports = router;
