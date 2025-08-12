// utils/extractRequestInfo.js
module.exports = function extractRequestInfo(req) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    null;

  const userAgent = req.headers["user-agent"] || null;

  // Optional: look for custom fingerprint header
  const fingerprint =
    req.headers["x-device-fingerprint"] ||
    req.headers["x-fingerprint-id"] ||
    null;

  return {
    ip,
    userAgent,
    fingerprint,
  };
};
