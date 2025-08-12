const adminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check for Bearer token authentication
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const adminSecret = process.env.ADMIN_SECRET;
      
      if (!adminSecret) {
        console.error('ADMIN_SECRET not configured');
        return res.status(500).json({ message: 'Server configuration error' });
      }
      
      if (token === adminSecret) {
        return next();
      }
    }
    
    // Check for session-based admin authentication (for frontend compatibility)
    const adminToken = req.headers['x-admin-token'] || req.headers['admin-token'];
    if (adminToken === 'true') {
      return next();
    }
    
    // If neither authentication method works, deny access
    return res.status(401).json({ message: 'Access denied. Admin authentication required.' });
    
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

module.exports = adminAuth; 