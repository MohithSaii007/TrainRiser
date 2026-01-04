import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD864z6ENbIMpf7a5EMVqbV8bi4XNmxGdY",
  authDomain: "train-ticketing-9ebe7.firebaseapp.com",
  projectId: "train-ticketing-9ebe7",
  storageBucket: "train-ticketing-9ebe7.firebasestorage.app",
  messagingSenderId: "205744212",
  appId: "1:205744212:web:48e39b4936c35f72fe25c1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
