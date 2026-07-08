import React, { createContext, useContext, useState, useEffect } from "react";
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
  GoogleAuthProvider
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
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<User>;
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
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const segments = useSegments();

  // Load and watch Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
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
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle route protection redirect logic
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "auth";
    const isLoggedIn = !!user;

    if (!isLoggedIn && !inAuthGroup) {
      // Redirect to welcome screen if not logged in and not in auth screens
      router.replace("/auth/welcome");
    } else if (isLoggedIn && inAuthGroup) {
      // If logged in, check if email needs verification
      if (!user.emailVerified) {
        router.replace("/auth/verify-email");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [user, loading, segments]);

  // Login
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
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
      // Set display name in Firebase
      await firebaseUpdateProfile(cred.user, { displayName: name });
      // Send verification email
      await sendEmailVerification(cred.user);
      return cred.user;
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
      await signOut(auth);
    } finally {
      setLoading(false);
    }
  };

  // Update Profile
  const updateProfileInfo = async (name: string, photoURL?: string) => {
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
        loading,
        login,
        signup,
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
