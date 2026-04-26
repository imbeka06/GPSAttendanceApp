import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBlQxg4lg8uirru72KXnPuW6l_vLl7zCeo",
  authDomain: "gpsattendanceapp-2cce7.firebaseapp.com",
  projectId: "gpsattendanceapp-2cce7",
  storageBucket: "gpsattendanceapp-2cce7.firebasestorage.app",
  messagingSenderId: "902073372594",
  appId: "1:902073372594:web:e0560709c17c65c1b1deab",
};

// Prevent re-initialising when the module hot-reloads in dev
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db   = getFirestore(app);
