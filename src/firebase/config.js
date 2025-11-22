// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfaVfpgWBP0l1xnt0s91mR2C6mSWAam6U",
  authDomain: "luo-city-spa-club-836bf.firebaseapp.com",
  projectId: "luo-city-spa-club-836bf",
  storageBucket: "luo-city-spa-club-836bf.firebasestorage.app",
  messagingSenderId: "25443267460",
  appId: "1:25443267460:web:d345d5227187b6716da3d1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;