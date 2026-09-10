import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDlOA8NbU9Ba81TW_RDbtg1uprxMj9fds4",
  authDomain: "huravitalis-pilates.firebaseapp.com",
  projectId: "huravitalis-pilates",
  storageBucket: "huravitalis-pilates.firebasestorage.app",
  messagingSenderId: "1080755197036",
  appId: "1:1080755197036:web:47c974442585bf69127449"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
