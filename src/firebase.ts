import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8hSO0GO9EnRq5DA_uCI9YTd7aVEG1kDU",
  authDomain: "lfd-website-9295e.firebaseapp.com",
  projectId: "lfd-website-9295e",
  storageBucket: "lfd-website-9295e.firebasestorage.app",
  messagingSenderId: "458968745132",
  appId: "1:458968745132:web:4a472e49acc89ba9cfcb09"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
