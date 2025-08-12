const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { checkOtpEligibility, recordOtpAttempt, getOtpStatus } = require('../controllers/otpController');
const auth = require('../middleware/auth');

// @route   POST api/otp/status
// @desc    Check OTP status and eligibility
// @access  Public
router.post('/status', [
  check('phone', 'Phone number is required').not().isEmpty()
], checkOtpEligibility);

// @route   POST api/otp/record-attempt
// @desc    Record an OTP attempt
// @access  Public
router.post('/record-attempt', [
  [
    check('phone', 'Phone number is required').not().isEmpty(),
    check('attemptType', 'Attempt type must be either "initial" or "resend"').isIn(['initial', 'resend'])
  ]
], async (req, res) => {
  try {
    const { phone, attemptType } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await recordOtpAttempt(phone, ip, userAgent, attemptType);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/otp/status/:phone
// @desc    Get OTP attempt status for a phone number
// @access  Public
router.get('/status/:phone', async (req, res) => {
  try {
    const status = await getOtpStatus(req.params.phone);
    res.json(status);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
