import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform, Alert } from "react-native";
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
import { GoogleSignin } from "@react-native-google-signin/google-signin";

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_HADITH_API_BASE_URL
)?.replace(/\/$/, "");

interface BackendProfile {
  id: string;
  name: string;
  email: string;
  profile_image?: string | null;
  email_verified: boolean;
  created_at: string;
  status: "Active" | "Blocked";
  tier: "free" | "premium";
  trial_started_at?: string | null;
  trial_active: boolean;
  trial_ends_at?: string | null;
}

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
  startTrial: () => Promise<void>;
  refreshEntitlements: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function migrateAuthStorage(uid?: string) {
  const pairs: [string, string][] = [
    ["auth_is_guest", "hikmah:auth:guest"],
    ["auth_guest_name", "hikmah:auth:guest_name"],
    ["auth_guest_photo", "hikmah:auth:guest_photo"],
  ];
  if (uid) {
    await AsyncStorage.multiRemove([
      `ruhani:tier:${uid}`,
      `ruhani:trial:${uid}`,
      `hikmah:tier:${uid}`,
      `hikmah:trial:${uid}`,
    ]);
  }
  for (const [legacyKey, newKey] of pairs) {
    const [legacy, current] = await AsyncStorage.multiGet([legacyKey, newKey]);
    if (legacy[1] != null && current[1] == null) await AsyncStorage.setItem(newKey, legacy[1]);
    if (legacy[1] != null) await AsyncStorage.removeItem(legacyKey);
  }
}

function toTimestamp(value?: string | null): number | undefined {
  if (!value) return undefined;
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const timestamp = new Date(hasTimezone ? value : `${value}Z`).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function buildUserProfile(firebaseUser: User, backendProfile?: BackendProfile | null): UserProfile {
  const trialStartedAt = toTimestamp(backendProfile?.trial_started_at);
  const trialEndsAt = toTimestamp(backendProfile?.trial_ends_at);
  const trialActive = backendProfile?.trial_active === true && (!trialEndsAt || trialEndsAt > Date.now());
  const trialDaysLeft = trialActive && trialEndsAt
    ? Math.max(1, Math.ceil((trialEndsAt - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  return {
    uid: firebaseUser.uid,
    name: backendProfile?.name || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
    email: backendProfile?.email || firebaseUser.email || "",
    emailVerified: firebaseUser.emailVerified,
    phoneNumber: firebaseUser.phoneNumber || undefined,
    photoURL: backendProfile?.profile_image || firebaseUser.photoURL || undefined,
    createdAt: toTimestamp(backendProfile?.created_at)
      || (firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).getTime() : Date.now()),
    status: backendProfile?.status || "Active",
    tier: backendProfile?.tier === "premium" ? "premium" : "free",
    trialStartedAt,
    trialActive,
    trialDaysLeft,
  };
}

async function fetchBackendProfile(firebaseUser: User): Promise<BackendProfile | null> {
  if (!API_BASE_URL) return null;
  const token = await firebaseUser.getIdToken();
  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || "Unable to load account entitlements.");
  }
  return response.json();
}

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
      await migrateAuthStorage(firebaseUser?.uid);
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsGuest(false);
        let backendProfile: BackendProfile | null = null;
        try {
          backendProfile = await fetchBackendProfile(firebaseUser);
        } catch (e) {
          // Entitlements fail closed: authentication still works, but the user
          // remains free until the backend can be reached.
          console.warn("Failed to load server entitlements; using free tier:", e);
        }

        setProfile(buildUserProfile(firebaseUser, backendProfile));
      } else {
        const guestRaw = await AsyncStorage.getItem("hikmah:auth:guest");
        if (guestRaw === "true") {
          setIsGuest(true);
          const guestName = await AsyncStorage.getItem("hikmah:auth:guest_name") || "Guest User";
          const guestPhoto = await AsyncStorage.getItem("hikmah:auth:guest_photo") || undefined;
          setProfile({
            uid: "guest-uid",
            name: guestName,
            email: "guest@islamichikmah.app",
            emailVerified: true,
            photoURL: guestPhoto,
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
  }, [user, isGuest, loading, segments, router]);

  // Login
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setIsGuest(false);
      await AsyncStorage.removeItem("hikmah:auth:guest");
      await AsyncStorage.removeItem("hikmah:auth:guest_name");
      await AsyncStorage.removeItem("hikmah:auth:guest_photo");
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
      await AsyncStorage.removeItem("hikmah:auth:guest");
      await AsyncStorage.removeItem("hikmah:auth:guest_name");
      await AsyncStorage.removeItem("hikmah:auth:guest_photo");
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
      await AsyncStorage.setItem("hikmah:auth:guest", "true");
      await AsyncStorage.removeItem("hikmah:auth:guest_name");
      await AsyncStorage.removeItem("hikmah:auth:guest_photo");
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
        await AsyncStorage.removeItem("hikmah:auth:guest");
        await AsyncStorage.removeItem("hikmah:auth:guest_name");
        await AsyncStorage.removeItem("hikmah:auth:guest_photo");
      } else {
        const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
        if (!webClientId) {
          Alert.alert(
          "Google Sign-In Not Configured",
          "Google Sign-In is not yet set up for this build. Please use email/password login or try again later."
        );
          setLoading(false);
          return;
        }

        // Native Google Sign-In
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const userInfo = await GoogleSignin.signIn();
        
        const idToken = (userInfo as any)?.data?.idToken || (userInfo as any)?.idToken;
        if (!idToken) {
          throw new Error("No ID Token returned from Google Sign-In.");
        }

        const credential = GoogleAuthProvider.credential(idToken);
        const cred = await signInWithCredential(auth, credential);
        
        setUser(cred.user);
        setIsGuest(false);
        await AsyncStorage.removeItem("hikmah:auth:guest");
        await AsyncStorage.removeItem("hikmah:auth:guest_name");
        await AsyncStorage.removeItem("hikmah:auth:guest_photo");
      }
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      // Suppress alert if user cancelled the sign-in modal (Google code 12501 or message)
      if (err.code !== "SIGN_IN_CANCELLED" && err.message !== "Sign in action cancelled" && err.code !== "12501") {
        Alert.alert("Sign-In Failed", "Unable to sign in with Google. Please try again.");
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
      await AsyncStorage.removeItem("hikmah:auth:guest");
      await AsyncStorage.removeItem("hikmah:auth:guest_name");
      await AsyncStorage.removeItem("hikmah:auth:guest_photo");
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
      await AsyncStorage.setItem("hikmah:auth:guest_name", name);
      if (photoURL) {
        await AsyncStorage.setItem("hikmah:auth:guest_photo", photoURL);
      } else {
        await AsyncStorage.removeItem("hikmah:auth:guest_photo");
      }
      setProfile({ ...profile, name, photoURL });
      return;
    }
    if (!auth.currentUser) return;
    await firebaseUpdateProfile(auth.currentUser, { displayName: name, photoURL });
    if (API_BASE_URL) {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          ...(photoURL !== undefined ? { profile_image: photoURL } : {}),
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || "Unable to update the server profile.");
      }
    }
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

  const refreshEntitlements = async () => {
    if (!auth.currentUser || isGuest) return;
    const backendProfile = await fetchBackendProfile(auth.currentUser);
    setProfile(buildUserProfile(auth.currentUser, backendProfile));
  };

  // Start the one-time trial on the authoritative backend.
  const startTrial = async () => {
    if (!auth.currentUser || isGuest) {
      throw new Error("Sign in to start a trial.");
    }
    if (!API_BASE_URL) {
      throw new Error("The account service is not configured for this build.");
    }
    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/api/start-trial`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || "Unable to start the trial.");
    }
    setProfile(buildUserProfile(auth.currentUser, payload.profile));
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
        startTrial,
        refreshEntitlements,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
