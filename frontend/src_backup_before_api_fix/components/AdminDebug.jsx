// import React from 'react';
// import { useAuth } from '../context/AuthContext';

// const AdminDebug = () => {
//   const { currentUser, isAdmin, ADMIN_EMAILS } = useAuth();

//   return (
//     <div style={{
//       position: 'fixed',
//       bottom: '10px',
//       right: '10px',
//       background: 'rgba(0,0,0,0.7)',
//       color: 'white',
//       padding: '8px',
//       borderRadius: '5px',
//       fontSize: '10px',
//       zIndex: 9999,
//       maxWidth: '200px',
//       minWidth: '150px',
//       backdropFilter: 'blur(5px)',
//       border: '1px solid rgba(255,255,255,0.2)'
//     }}>
//       <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🔍 Admin Debug:</div>
//       <div style={{ fontSize: '9px', lineHeight: '1.2' }}>
//         <div>User: {currentUser?.email ? currentUser.email.substring(0, 20) + '...' : 'No user'}</div>
//         <div>Admin: {isAdmin ? '✅ YES' : '❌ NO'}</div>
//         <div>Match: {currentUser?.email && ADMIN_EMAILS.includes(currentUser.email) ? '✅' : '❌'}</div>
//       </div>
      
//       {isAdmin && (
//         <div style={{ marginTop: '6px' }}>
//           <a 
//             href="/adminlogin" 
//             style={{
//               background: 'red',
//               color: 'white',
//               padding: '3px 6px',
//               borderRadius: '3px',
//               textDecoration: 'none',
//               display: 'inline-block',
//               fontSize: '9px',
//               fontWeight: 'bold'
//             }}
//           >
//             🛡️ ADMIN
//           </a>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdminDebug; 