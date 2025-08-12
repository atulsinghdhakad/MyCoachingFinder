// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAvTNh-91WOWEsLVu04lRRshpJlpJ6yMb0",
  authDomain: "coachingfinder-5bd16.firebaseapp.com",
  projectId: "coachingfinder-5bd16",
  storageBucket: "coachingfinder-5bd16.appspot.com", // ✅ Fixed domain typo from .app to .com
  messagingSenderId: "1085122910276",
  appId: "1:1085122910276:web:ce30b697dc8c454f46c411",
  measurementId: "G-10CDNXPFDF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };