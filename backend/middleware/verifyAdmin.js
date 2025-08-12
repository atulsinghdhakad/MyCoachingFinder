// backend/middleware/verifyAdmin.js

module.exports = function verifyAdmin(req, res, next) {
  const token = req.headers["x-admin-token"] || req.headers["admin-token"];

  if (!token || token !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "Unauthorized admin access" });
  }

  next();
};
