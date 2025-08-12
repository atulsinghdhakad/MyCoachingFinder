const rateLimit = require("express-rate-limit");

// Role-based limits
const limits = {
  user: { windowMs: 15 * 60 * 1000, max: 50 },
  admin: { windowMs: 15 * 60 * 1000, max: 100 },
  superadmin: { windowMs: 15 * 60 * 1000, max: 200 },
};

function rateLimiterByRole() {
  return (req, res, next) => {
    const role = req.user?.role || "user";
    const { windowMs, max } = limits[role] || limits["user"];

    return rateLimit({
      windowMs,
      max,
      message: `Too many requests. Try again later.`,
      standardHeaders: true,
      legacyHeaders: false,
    })(req, res, next);
  };
}

module.exports = rateLimiterByRole;
