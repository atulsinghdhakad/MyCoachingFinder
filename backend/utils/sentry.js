const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN, // your DSN from Sentry dashboard
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 1.0, // Adjust in prod for performance
  // Optionally set release, debug, etc.
});

module.exports = Sentry;
