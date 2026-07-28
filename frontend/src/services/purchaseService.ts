import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/src/apiBaseUrl";
import { auth } from "@/src/firebase";

// RevenueCat SDK is lazy-loaded so builds/Expo Go without the native module do not crash.
let Purchases: any = null;
try {
  Purchases = require("react-native-purchases").default;
} catch {
  Purchases = null;
}

const REVENUECAT_KEYS = {
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "",
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "",
};

let isInitialized = false;

export async function initPurchaseService(uid?: string): Promise<boolean> {
  if (isInitialized || !Purchases) return isInitialized;

  const apiKey = Platform.OS === "ios" ? REVENUECAT_KEYS.ios : REVENUECAT_KEYS.android;
  if (!apiKey) {
    if (__DEV__) console.log("[PurchaseService] RevenueCat API Key not provided. Using fallback UPI flow.");
    return false;
  }

  try {
    await Purchases.configure({ apiKey, appUserID: uid });
    isInitialized = true;
    if (__DEV__) console.log("[PurchaseService] RevenueCat configured successfully for user:", uid);
    return true;
  } catch (err) {
    if (__DEV__) console.warn("[PurchaseService] RevenueCat init failed:", err);
    return false;
  }
}

export type PurchaseResult = {
  success: boolean;
  requiresManualUpi?: boolean;
  error?: string;
  tier?: "free" | "premium";
};

export async function purchasePlan(
  planId: "monthly" | "yearly" | "lifetime",
  userEmail?: string
): Promise<PurchaseResult> {
  const uid = auth.currentUser?.uid;
  
  // If native RevenueCat is configured, attempt native store purchase first
  if (Purchases && isInitialized) {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        const pkg = offerings.current.availablePackages.find(
          (p: any) => p.identifier === planId || p.packageType?.toLowerCase() === planId
        ) || offerings.current.availablePackages[0];

        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const isPro = customerInfo.entitlements.active["pro"] !== undefined;

        if (isPro && uid) {
          // Sync native receipt with backend server entitlement
          await syncIapReceiptWithBackend(uid, customerInfo);
          return { success: true, tier: "premium" };
        }
      }
    } catch (err: any) {
      if (err.userCancelled) return { success: false, error: "Purchase cancelled by user." };
      if (__DEV__) console.warn("[PurchaseService] Native purchase failed, offering UPI fallback:", err);
    }
  }

  // Fallback to UPI flow for India / builds without native store keys
  return { success: false, requiresManualUpi: true };
}

export async function restorePurchases(): Promise<PurchaseResult> {
  if (!Purchases || !isInitialized) {
    return { success: false, error: "Native store billing is not active on this device." };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPro = customerInfo.entitlements.active["pro"] !== undefined;
    const uid = auth.currentUser?.uid;

    if (isPro && uid) {
      await syncIapReceiptWithBackend(uid, customerInfo);
      return { success: true, tier: "premium" };
    }
    return { success: false, error: "No active subscription found to restore." };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to restore purchases." };
  }
}

async function syncIapReceiptWithBackend(uid: string, customerInfo: any): Promise<void> {
  if (!API_BASE_URL) return;
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return;

    await fetch(`${API_BASE_URL}/api/v1/auth/entitlements/verify-iap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        uid,
        entitlements: customerInfo.entitlements.active,
        originalAppUserId: customerInfo.originalAppUserId,
      }),
    });
  } catch (e) {
    if (__DEV__) console.warn("[PurchaseService] Failed to sync IAP receipt with backend:", e);
  }
}
