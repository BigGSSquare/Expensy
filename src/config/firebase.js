// Fix firebase.js to use environment variables correctly
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBTbRyIaR3l-bqM70pvy86gkpS8kWF0FX8",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "expensy-forge.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "expensy-forge",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "expensy-forge.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "763967536539",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:763967536539:web:2c380eb30bd4e4a9a5b53e",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-CQY4M9MDC1"
};

console.log("Initializing Firebase with config:", JSON.stringify(firebaseConfig));
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log("Firebase initialization complete");

export default app;