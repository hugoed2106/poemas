import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, increment, collection, getDocs, query, where, getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, sendEmailVerification }
    from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, doc, addDoc, setDoc, deleteDoc, writeBatch }
    from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCM8fjWstKNjL4l4AbG3Z16xiYVl6s-XAA",
    authDomain: "poemas-jg.firebaseapp.com",
    projectId: "poemas-jg",
    storageBucket: "poemas-jg.firebasestorage.app",
    messagingSenderId: "619654028698",
    appId: "1:619654028698:web:2d59e97d07a7efd643ee23",
    measurementId: "G-QHE41GVRSH"
};

const db = getFirestore(initializeApp(firebaseConfig), "default") || getFirestore(app, "default");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const ADMIN_HASHES = [
    "3653a6f0d32bea8e7d2cd9cc3f3367794dccf198477932bf823b97ec9b45e731",
    "8d9f2a2da2c92f7bae013a2318bb982589e8667536b30d8a192f606892f5a6d2",
    "89b371f3721a815d6db8ada95989cf1ca1808c92b248f2e7dfefd03c390e74e7",
    "1cdf38a5cec7b70d77ff015a51ae51ff1833648b76af813bfb501ffe5f605606"
];