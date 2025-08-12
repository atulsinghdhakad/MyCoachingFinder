const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/verify", async (req, res) => {
  try {
    const { token } = req.body;
    const secretKey = process.env.RECAPTCHA_SECRET;

    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: secretKey,
          response: token,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    logger.error("❌ reCAPTCHA verify error:", error.message);
    res.status(500).json({ success: false, error: "Verification failed" });
  }
});

module.exports = router;
