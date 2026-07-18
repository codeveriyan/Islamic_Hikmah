import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import { 
  User,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  signInWithCredential,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useSegments } from "expo-router";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// If on native, configure Google Sign-In dynamically using Web Client ID
if (Platform.OS !== "web") {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (webClientId) {
    GoogleSignin.configure({
      webClientId,
      offlineAccess: true,
    });
  }
}


export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: number;
  status: "Active" | "Blocked";
  tier: "free" | "premium";
  premiumUntil?: number;
  // Trial fields
  trialStartedAt?: number;   // unix ms when trial began (undefined = never started)
  trialActive: boolean;      // true if trial started AND not expired
  trialDaysLeft: number;     // 0–7 days remaining (0 = expired or not started)
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isGuest: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  loginAsGuest: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendResetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileInfo: (name: string, photoURL?: string) => Promise<void>;
  reloadUser: () => Promise<void>;
  togglePremiumTier: () => Promise<void>;
  startTrial: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const segments = useSegments();

  // Load and watch Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsGuest(false);
        // Load tier details from local storage and Firestore
        let localTier = await AsyncStorage.getItem(`ruhani:tier:${firebaseUser.uid}`);
        let finalTier: "free" | "premium" = (localTier as "free" | "premium") || "free";
        
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data?.tier === "premium" || data?.tier === "free") {
              finalTier = data.tier;
              await AsyncStorage.setItem(`ruhani:tier:${firebaseUser.uid}`, finalTier);
            }
          } else {
            // First time login/signup: create document with default tier
            await setDoc(doc(db, "users", firebaseUser.uid), {
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
              email: firebaseUser.email || "",
              tier: finalTier,
              createdAt: Date.now()
            }, { merge: true });
          }
        } catch (e) {
          console.warn("Failed to sync tier with Firestore:", e);
        }

        // ── Trial computation ──────────────────────────────────────────────
        let trialStartedAt: number | undefined = undefined;
        let trialActive = false;
        let trialDaysLeft = 0;
        try {
          const trialRaw = await AsyncStorage.getItem(`ruhani:trial:${firebaseUser.uid}`);
          if (trialRaw) {
            trialStartedAt = parseInt(trialRaw, 10);
          } else {
            // Try loading from Firestore
            const userDoc2 = await getDoc(doc(db, "users", firebaseUser.uid));
            if (userDoc2.exists() && userDoc2.data()?.trialStartedAt) {
              trialStartedAt = userDoc2.data().trialStartedAt;
              await AsyncStorage.setItem(`ruhani:trial:${firebaseUser.uid}`, String(trialStartedAt));
            }
          }
          if (trialStartedAt) {
            const TRIAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
            const elapsed = Date.now() - trialStartedAt;
            trialActive = elapsed < TRIAL_MS;
            trialDaysLeft = trialActive ? Math.ceil((TRIAL_MS - elapsed) / (24 * 60 * 60 * 1000)) : 0;
          }
        } catch (e) {
          console.warn("Failed to load trial state:", e);
        }

        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email || "",
          emailVerified: firebaseUser.emailVerified,
          phoneNumber: firebaseUser.phoneNumber || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          createdAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).getTime() : Date.now(),
          status: "Active",
          tier: finalTier,
          trialStartedAt,
          trialActive,
          trialDaysLeft,
        };
        setProfile(userProfile);
      } else {
        const guestRaw = await AsyncStorage.getItem("auth_is_guest");
        if (guestRaw === "true") {
          setIsGuest(true);
          const guestName = await AsyncStorage.getItem("auth_guest_name") || "Guest User";
          setProfile({
            uid: "guest-uid",
            name: guestName,
            email: "guest@islamichikmah.app",
            emailVerified: true,
            createdAt: Date.now(),
            status: "Active",
            tier: "free",
            trialActive: false,
            trialDaysLeft: 0,
          });
        } else {
          setUser(null);
          setProfile(null);
          setIsGuest(false);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle route protection redirect logic
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "auth";
    const isLoggedIn = !!user || isGuest;

    if (!isLoggedIn && !inAuthGroup) {
      // Redirect to welcome screen if not logged in and not in auth screens
      router.replace("/auth/welcome");
    } else if (isLoggedIn && inAuthGroup) {
      if (isGuest) {
        router.replace("/(tabs)");
      } else if (user && !user.emailVerified) {
        router.replace("/auth/verify-email");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [user, isGuest, loading, segments]);

  // Login
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setIsGuest(false);
      await AsyncStorage.removeItem("auth_is_guest");
      await AsyncStorage.removeItem("auth_guest_name");
      return cred.user;
    } finally {
      setLoading(false);
    }
  };

  // Sign up
  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      setIsGuest(false);
      await AsyncStorage.removeItem("auth_is_guest");
      await AsyncStorage.removeItem("auth_guest_name");
      // Set display name in Firebase
      await firebaseUpdateProfile(cred.user, { displayName: name });
      // Send verification email
      await sendEmailVerification(cred.user);
      return cred.user;
    } finally {
      setLoading(false);
    }
  };

  // Login as Guest
  const loginAsGuest = async () => {
    setLoading(true);
    try {
      setIsGuest(true);
      await AsyncStorage.setItem("auth_is_guest", "true");
      await AsyncStorage.removeItem("auth_guest_name");
      setProfile({
        uid: "guest-uid",
        name: "Guest User",
        email: "guest@islamichikmah.app",
        emailVerified: true,
        createdAt: Date.now(),
        status: "Active",
        tier: "free",
        trialActive: false,
        trialDaysLeft: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Login with Google (Web Support + Native Integration)
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      if (Platform.OS === "web") {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        setUser(cred.user);
        setIsGuest(false);
        await AsyncStorage.removeItem("auth_is_guest");
        await AsyncStorage.removeItem("auth_guest_name");
      } else {
        const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
        if (!webClientId) {
          alert("Google Sign-In is not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file, register your SHA-1 in the Firebase console, and rebuild.");
          setLoading(false);
          return;
        }

        // Native Google Sign-In
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const userInfo = await GoogleSignin.signIn();
        
        const idToken = userInfo.data?.idToken || userInfo.idToken;
        if (!idToken) {
          throw new Error("No ID Token returned from Google Sign-In.");
        }

        const credential = GoogleAuthProvider.credential(idToken);
        const cred = await signInWithCredential(auth, credential);
        
        setUser(cred.user);
        setIsGuest(false);
        await AsyncStorage.removeItem("auth_is_guest");
        await AsyncStorage.removeItem("auth_guest_name");
      }
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      // Suppress alert if user cancelled the sign-in modal (Google code 12501 or message)
      if (err.code !== "SIGN_IN_CANCELLED" && err.message !== "Sign in action cancelled" && err.code !== "12501") {
        alert("Failed to sign in with Google: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Password Reset
  const sendResetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    try {
      setIsGuest(false);
      await AsyncStorage.removeItem("auth_is_guest");
      await AsyncStorage.removeItem("auth_guest_name");
      try {
        await signOut(auth);
      } catch (err) {
        console.warn("Firebase signOut error (ignoring):", err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Update Profile
  const updateProfileInfo = async (name: string, photoURL?: string) => {
    if (isGuest && profile) {
      setProfile({ ...profile, name, photoURL });
      return;
    }
    if (!auth.currentUser) return;
    await firebaseUpdateProfile(auth.currentUser, { displayName: name, photoURL });
    // Update local profile state
    if (profile) {
      setProfile({
        ...profile,
        name,
        photoURL
      });
    }
  };

  // Reload user state
  const reloadUser = async () => {
    if (isGuest) return;
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setUser(auth.currentUser);
    if (profile) {
      setProfile({
        ...profile,
        emailVerified: auth.currentUser.emailVerified
      });
    }
  };

  // Toggle premium tier (dev bypass / subscription simulation)
  const togglePremiumTier = async () => {
    if (isGuest && profile) {
      const nextTier = profile.tier === "premium" ? "free" : "premium";
      setProfile({ ...profile, tier: nextTier });
      return;
    }
    if (!user) return;
    const nextTier = profile?.tier === "premium" ? "free" : "premium";
    await AsyncStorage.setItem(`ruhani:tier:${user.uid}`, nextTier);
    
    try {
      await setDoc(doc(db, "users", user.uid), { tier: nextTier }, { merge: true });
    } catch (e) {
      console.warn("Failed to save premium tier change to Firestore:", e);
    }

    if (profile) {
      setProfile({
        ...profile,
        tier: nextTier
      });
    }
  };

  // Start 7-day free trial (requires real login, not guest)
  const startTrial = async () => {
    if (!user || isGuest) return;
    const now = Date.now();
    const TRIAL_MS = 7 * 24 * 60 * 60 * 1000;
    await AsyncStorage.setItem(`ruhani:trial:${user.uid}`, String(now));
    try {
      await setDoc(doc(db, "users", user.uid), { trialStartedAt: now }, { merge: true });
    } catch (e) {
      console.warn("Failed to save trial start to Firestore:", e);
    }
    if (profile) {
      setProfile({
        ...profile,
        trialStartedAt: now,
        trialActive: true,
        trialDaysLeft: 7,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isGuest,
        loading,
        login,
        signup,
        loginAsGuest,
        loginWithGoogle,
        sendResetPassword,
        logout,
        updateProfileInfo,
        reloadUser,
        togglePremiumTier,
        startTrial,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
