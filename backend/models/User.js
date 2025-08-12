// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true, // Firebase UID
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  name: {
    type: String,
    default: "",
  },
  photoURL: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  provider: {
    type: String,
    enum: ["google", "facebook", "email", "phone", "apple"],
    default: "email",
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ["active", "disabled"],
    default: "active",
  },
});

module.exports = mongoose.model("User", UserSchema);
