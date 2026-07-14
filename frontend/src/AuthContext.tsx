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
import { auth } from "./firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useSegments } from "expo-router";

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
        // Load tier details from local storage for local persistence override
        const localTier = await AsyncStorage.getItem(`ruhani:tier:${firebaseUser.uid}`);
        
        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email || "",
          emailVerified: firebaseUser.emailVerified,
          phoneNumber: firebaseUser.phoneNumber || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          createdAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).getTime() : Date.now(),
          status: "Active",
          tier: (localTier as "free" | "premium") || "free"
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
            tier: "free"
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
        tier: "free"
      });
    } finally {
      setLoading(false);
    }
  };

  // Login with Google (Web Support + Native Fallback Alert)
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
        alert("Google Sign-In on native apps requires Expo Dev Client configuration. Please use web for now or sign in with email.");
      }
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      alert("Failed to sign in with Google: " + err.message);
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
      await signOut(auth);
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
    if (profile) {
      setProfile({
        ...profile,
        tier: nextTier
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
        togglePremiumTier
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
