// src/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth,
  setPersistence,
  browserLocalPersistence,
  RecaptchaVerifier
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAvTNh-91WOWEsLVu04lRRshpJlpJ6yMb0",
  authDomain: "coachingfinder-5bd16.firebaseapp.com",
  projectId: "coachingfinder-5bd16",
  storageBucket: "coachingfinder-5bd16.appspot.com",
  messagingSenderId: "1085122910276",
  appId: "1:1085122910276:web:ce30b697dc8c454f46c411",
  measurementId: "G-10CDNXPFDF"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Set persistence
(async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log('Firebase initialized with local persistence');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
})();

export { app, auth, db };