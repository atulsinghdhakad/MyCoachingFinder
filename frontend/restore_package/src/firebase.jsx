// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAvTNh-91WOWEsLVu04lRRshpJlpJ6yMb0",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "coachingfinder-5bd16.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "coachingfinder-5bd16",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "coachingfinder-5bd16.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1085122910276",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1085122910276:web:ce30b697dc8c454f46c411",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-10CDNXPFDF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Add scopes for better user experience
googleProvider.addScope('email');
googleProvider.addScope('profile');

facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

facebookProvider.setCustomParameters({
  display: 'popup', // 🔁 forces popup instead of redirect
});

export { auth, googleProvider, facebookProvider };
// export const googleProvider = new GoogleAuthProvider();