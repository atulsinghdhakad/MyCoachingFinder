// scripts/seedOtpLogs.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const OtpAttempt = require("../models/OtpAttempt"); // adjust path if needed

const dummyAttempts = [
  { phone: "+919876543210", attemptCount: 5, ipAddress: "103.24.99.10" },
  { phone: "+919812345678", attemptCount: 3, ipAddress: "103.24.99.20" },
  { phone: "+919911223344", attemptCount: 1, ipAddress: "103.24.99.30" },
  { phone: "+918800112233", attemptCount: 6, ipAddress: "103.24.99.40" },
  { phone: "+917700998877", attemptCount: 2, ipAddress: "103.24.99.50" },
];

const run = async () => {
  try {
    await OtpAttempt.deleteMany({});
    await OtpAttempt.insertMany(
      dummyAttempts.map((a) => ({ ...a, createdAt: new Date() }))
    );
    logger.info("✅ Dummy OTP logs inserted.");
    process.exit(0);
  } catch (err) {
    logger.error("❌ Failed to seed OTP logs:", err);
    process.exit(1);
  }
};

run();
