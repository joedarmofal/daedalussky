import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Analytics (Client-side only check)
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) analytics = getAnalytics(app);
  });
}

export { app, auth, db, storage, analytics };