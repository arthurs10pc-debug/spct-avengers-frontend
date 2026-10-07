import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyD-4gRvVI1Tx8VLADJRifzYN190_FqBbJa",
  authDomain: "spct-avengers-65de1.firebaseapp.com",
  projectId: "spct-avengers-65de1",
  storageBucket: "spct-avengers-65de1.appspot.com",
  messagingSenderId: "1085189203233",
  appId: "1:1085189203233:web:c568f971709a4c7846ca60",
  measurementId: "G-WJ3P8YTDZD"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);