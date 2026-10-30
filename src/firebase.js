import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD-4gRvVI1Tx8VLADJRifzYN190_FqBbJa",
  authDomain: "spct-avengers-65de1.firebaseapp.com",
  projectId: "spct-avengers-65de1",
  storageBucket: "spct-avengers-65de1.appspot.com",
  messagingSenderId: "1085189203233",
  appId: "1:1085189203233:web:c568f971709a4c7846ca60",
  measurementId: "G-WJ3P8YTDZD"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  // Messaging fallback
}

export { messaging };
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { signInWithPopup, signOut };
