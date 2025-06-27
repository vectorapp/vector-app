// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD4eclWl_kcUeYCzlk1PEP65efhcKEPxYc",
  authDomain: "vectorfitness-4dcbd.firebaseapp.com",
  projectId: "vectorfitness-4dcbd",
  storageBucket: "vectorfitness-4dcbd.firebasestorage.app",
  messagingSenderId: "256859508531",
  appId: "1:256859508531:web:383065a6cc08cc546a3846",
  measurementId: "G-Y2R8VL93YT"
};

// Prevent re-initialization in Next.js hot reload
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
export default app;
