import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCaoMEeWAa28IKfRpGH9dHrKnwpgbZ9RUo",
  authDomain: "familia-alianca.firebaseapp.com",
  projectId: "familia-alianca",
  storageBucket: "familia-alianca.firebasestorage.app",
  messagingSenderId: "1078568691508",
  appId: "1:1078568691508:web:7a90131afc803659666761"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
