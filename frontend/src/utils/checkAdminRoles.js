// // src/utils/checkAdminRole.js
// import axios from 'axios';

// export const checkAdminRole = async (idToken) => {
//   try {
//     const res = await axios.post(
//       `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/admin/check-admin-role`,
//       {},
//       {
//         headers: {
//           Authorization: `Bearer ${idToken}`
//         }
//       }
//     );
//     return res.data.isAdmin === true;
//   } catch (error) {
//     console.error('❌ Error checking admin role:', error.message);
//     return false;
//   }
// };


export const checkAdminRole = async (idToken) => {
  try {
    const res = await fetch('/api/check-admin-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });
    const data = await res.json();
    return data.isAdmin;
  } catch (err) {
    console.error('Admin check failed:', err);
    return false;
  }
};