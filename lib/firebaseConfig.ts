// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJKMTz02h3v891w0XHQLCjgNYvXlmz1dg",
  authDomain: "bc-1-ba9fb.firebaseapp.com",
  projectId: "bc-1-ba9fb",
  storageBucket: "bc-1-ba9fb.firebasestorage.app",
  messagingSenderId: "220730290599",
  appId: "1:220730290599:web:e191eeecaededb2da8c682",
  measurementId: "G-R2JH14MRCH"
};

// Initialize Firebase App
let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

// Configure Auth
export const auth = getAuth(firebaseApp);

// Configure Firestore
export const db = getFirestore(firebaseApp);
