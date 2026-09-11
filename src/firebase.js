import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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
export const auth = getAuth(app);
// Garante explicitamente que a sessão de login fica guardada no aparelho entre uma abertura e outra do app
setPersistence(auth, browserLocalPersistence).catch(() => {});
export const messaging = getMessaging(app);

export const VAPID_KEY = "BNRkgzkFeohms1qA5kiDQcXSPLQlpuD8mHyA4lF--hIJHO8lWed-RzZTS4lCCzQLuvozAwxUtGvagi3kCSa9Ee4";

export const solicitarPermissaoNotificacao = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token;
  } catch (err) {
    console.error("Erro ao obter token FCM:", err);
    return null;
  }
};

export { onMessage };
