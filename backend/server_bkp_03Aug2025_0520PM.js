const express = require("express");
const logger = require("./utils/logger");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const rateLimiterByRole = require("./middleware/rateLimiter");

require("dotenv").config();

const adminRoutes = require("./routes/adminRoutes");
const otpRoutes =
  require("./routes/api/otp").default || require("./routes/api/otp");
const recaptchaRoutes =
  require("./routes/recaptcha").default || require("./routes/recaptcha");
const adminUsersRoutes = require("./routes/adminUsers");
const verifyAdminToken = require("./middleware/verifyAdminToken");
const verifyRole = require("./middleware/verifyRole");

const Contact = require("./models/Contact");
const User = require("./models/User");
const AuditLog = require("./models/AuditLog");
const logLogin = require("./controllers/logLogin");
const OtpAttempt = require("./models/OtpAttempt");

const app = express();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Tracing.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://maps.googleapis.com"],
        connectSrc: ["'self'", "https://maps.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api/", apiLimiter);

const corsOptions = {
  origin: ["http://localhost:5005", "https://yourfrontend.com"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-admin-token",
    "admin-token",
  ],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info("🗄️ Connected to MongoDB"))
  .catch((err) => logger.error("❌ MongoDB connection error:", err));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
});

app.use("/api/admin", adminRoutes);
app.use(
  "/api/admin",
  verifyAdminToken,
  rateLimiterByRole(),
  require("./routes/admin")
);

app.post(
  "/api/admin/update-status",
  verifyAdminToken,
  rateLimiterByRole(),
  async (req, res) => {
    // update admin status logic
  }
);


app.use("/api/auth", require("./routes/auth"));
app.use("/api/otp", otpRoutes);
app.use("/api/recaptcha", recaptchaRoutes);
app.use("/api/admin", adminUsersRoutes);
app.use("/api/admin/otp-resend", require("./routes/admin/otpResend"));

app.get("/", (req, res) => {
  res.send("✅ Server running");
});

app.use(Sentry.Handlers.errorHandler());

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
});
