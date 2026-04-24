import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyC9_iR3Jxag5HcOplJWGR...",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "daedalus-sky.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "daedalus-sky",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "daedalus-sky.firebasestorage.app",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "635976516767",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:635976516767:web:e512c3fa...",
  },
};

export default nextConfig;
//force rebuild
