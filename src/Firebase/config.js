// src/Firebase/config.js
import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBY5O1xB45ucajpHS-nW1P35F95kYnvuP0",
  authDomain: "firestoreelection.firebaseapp.com",
  projectId: "firestoreelection",
  storageBucket: "firestoreelection.firebasestorage.app",
  messagingSenderId: "911675409780",
  appId: "1:911675409780:web:876e453f92f40fe188d821"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence and long polling
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true, // better for low-speed networks
  useFetchStreams: false,
});

export { db };
