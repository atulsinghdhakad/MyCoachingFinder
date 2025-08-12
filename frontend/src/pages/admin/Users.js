// 🧾 Feature: Revoke Admin UI
// 📁 File: src/pages/admin/Users.js

import axios from 'axios';

const revokeAdmin = async (uid) => {
  try {
    await axios.post("/api/admin/revoke-admin", { uid });
    alert("Admin role revoked");
  } catch (err) {
    console.error("Failed to revoke admin role:", err);
  }
};

// Add revoke button next to user in admin users table
// Example usage: <button onClick={() => revokeAdmin(user.uid)}>Revoke</button>

// ✅ Feature: IP/device fingerprint display
// 📁 File: src/pages/admin/LoginLogs.js (add columns)
// Just map additional columns from `ip`, `userAgent`, `fingerprint` if provided from backend

// ✅ Accessibility Tips (optional)
// Ensure all buttons have aria-labels
// Ensure color contrast for accessibility (tailwind supports contrast plugins)
// Use semantic elements (e.g., <main>, <header>, <nav>, etc.)

// ✅ E2E Testing: recommend Cypress (in cypress/e2e/login.spec.js, dashboard.spec.js, etc.)
