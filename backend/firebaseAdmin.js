// backend/firebaseAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Replace with your service key file path

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
//   });
// }

// module.exports = admin;


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;

