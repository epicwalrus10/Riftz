// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Add this for authentication
import { getDatabase } from "firebase/database"; // Add this for Realtime Database
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxjjIQK7QfI_p4Y4j9HBNrrPE-egv199Q",
  authDomain: "riftz-71f84.firebaseapp.com",
  databaseURL: "https://riftz-71f84-default-rtdb.firebaseio.com",
  projectId: "riftz-71f84",
  storageBucket: "riftz-71f84.firebasestorage.app", // Fixed typo: was 'firebasestorage.app'
  messagingSenderId: "188220452619",
  appId: "1:188220452619:web:b9c6876853424e80bc7c0e",
  measurementId: "G-QF5023GFHS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Auth and Database for use in other files
export const auth = getAuth(app);
export const database = getDatabase(app);