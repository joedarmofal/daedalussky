import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC9_iR3Jxag5HcOplJWGR...", // USE THE LONG KEY FROM PROJECT SETTINGS
  authDomain: "daedalus-sky-prod.firebaseapp.com",
  projectId: "daedalus-sky-prod",
  storageBucket: "daedalus-sky-prod.appspot.com",
  messagingSenderId: "635976516767",
  appId: "1:635976516767:web:e512c3fa..." // USE THE FULL APP ID FROM SETTINGS
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
