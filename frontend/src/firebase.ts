import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
// @ts-ignore
import { getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDPGixIirWmgnN2MdALY7sf5SlLMgmpodw",
  authDomain: "islamic-hikmah.firebaseapp.com",
  projectId: "islamic-hikmah",
  storageBucket: "islamic-hikmah.firebasestorage.app",
  messagingSenderId: "1091861582168",
  appId: "1:1091861582168:web:4e47acd93213b588aa152d"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with React Native persistence to persist user session securely
const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
})();

export { app, auth };
