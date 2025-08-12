const mongoose = require("mongoose");

const otpLogSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  timestamp: { type: Date, required: true }, // always required, set by controller
  userAgent: { type: String, required: true },
  ip: { type: String, required: true },
});

module.exports = mongoose.model("OtpLog", otpLogSchema);
