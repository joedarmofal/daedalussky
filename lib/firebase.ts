import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// HARDCODED MISSION DATA - NO PROCESS.ENV ALLOWED
const firebaseConfig = {
  apiKey: "AIzaSyC9_iR3JxaaG5HcOpLJWG_X6-JWer7HM4",
  authDomain: "daedalus-sky.firebaseapp.com",
  projectId: "daedalus-sky",
  storageBucket: "daedalus-sky.firebasestorage.app",
  messagingSenderId: "635976516767",
  appId: "1:635976516767:web:e512c3faebf15532760eaa",
  measurementId: "G-L9TWX8SJZ4"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics helper
export const initAnalytics = async () => {
  if (typeof window !== 'undefined') {
    const supported = await isSupported();
    if (supported) return getAnalytics(app);
  }
  return null;
};

// Simple Provider to keep your layout from breaking
export function FirebaseConfigProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}