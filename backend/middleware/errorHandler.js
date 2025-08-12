// middlewares/errorHandler.js

const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  // Log the error details
  logger.error("🔥 Global Error", {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    user: req.user?.uid || "Unauthenticated",
  });

  // Respond with JSON error message
  res.status(err.statusCode || 500).json({
    error: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
