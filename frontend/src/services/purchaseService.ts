import { Platform } from "react-native";
import { API_BASE_URL } from "@/src/apiBaseUrl";
import { auth } from "@/src/firebase";

// Expo Go does not contain the native billing module. Keeping the require
// guarded so the app can show a clear billing-configuration error before it
// is installed as a Google Play development/production build.
let Purchases: any = null;
try {
  Purchases = require("react-native-purchases").default;
} catch {
  Purchases = null;
}

const REVENUECAT_KEYS = {
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "",
};
const REVENUECAT_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || "pro";

let isInitialized = false;
let configuredUserId: string | undefined;

export type PremiumPlan = "monthly" | "yearly" | "lifetime";

export type PlanOffering = {
  plan: PremiumPlan;
  identifier: string;
  priceString: string;
};

export async function initPurchaseService(uid?: string): Promise<boolean> {
  if (Platform.OS !== "android" || !Purchases) return false;

  const apiKey = REVENUECAT_KEYS.android;
  if (!apiKey) {
    if (__DEV__) console.log("[PurchaseService] Android RevenueCat key is not configured.");
    return false;
  }

  try {
    if (!isInitialized) {
      await Purchases.configure({ apiKey, appUserID: uid });
      isInitialized = true;
      configuredUserId = uid;
    } else if (uid && configuredUserId !== uid) {
      // Prevent one signed-in account's store identity from leaking into the
      // next account in the same app process.
      await Purchases.logIn(uid);
      configuredUserId = uid;
    } else if (!uid && configuredUserId) {
      await Purchases.logOut();
      configuredUserId = undefined;
    }
    if (__DEV__) console.log("[PurchaseService] RevenueCat configured for user:", uid);
    return true;
  } catch (err) {
    if (__DEV__) console.warn("[PurchaseService] RevenueCat init failed:", err);
    return false;
  }
}

export type PurchaseResult = {
  success: boolean;
  error?: string;
  tier?: "free" | "premium";
};

const PACKAGE_TYPE_ALIASES: Record<string, string[]> = {
  monthly: ["monthly"],
  yearly: ["yearly", "annual"],
  lifetime: ["lifetime"],
};

function packageMatchesPlan(pkg: any, planId: keyof typeof PACKAGE_TYPE_ALIASES): boolean {
  const aliases = PACKAGE_TYPE_ALIASES[planId];
  const packageType = String(pkg?.packageType || "").toLowerCase();
  const identifier = String(pkg?.identifier || "").toLowerCase();
  const productIdentifier = String(pkg?.product?.identifier || "").toLowerCase();
  return aliases.some((alias) =>
    packageType === alias || identifier.includes(alias) || productIdentifier.includes(alias)
  );
}

function hasActivePremiumEntitlement(customerInfo: any): boolean {
  return Boolean(customerInfo?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_ID]);
}

export async function purchasePlan(
  planId: PremiumPlan,
  _userEmail?: string,
): Promise<PurchaseResult> {
  const uid = auth.currentUser?.uid;

  if (Platform.OS !== "android") {
    return { success: false, error: "Google Play billing is available only on Android." };
  }

  if (!uid) {
    return { success: false, error: "Sign in before starting a Google Play purchase." };
  }

  const configured = await initPurchaseService(uid);
  if (configured && Purchases && isInitialized) {
    try {
      const offerings = await Purchases.getOfferings();
      const packages = offerings?.current?.availablePackages || [];
      const pkg = packages.find((candidate: any) => packageMatchesPlan(candidate, planId));

      if (pkg) {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        if (!hasActivePremiumEntitlement(customerInfo) || !uid) {
          return {
            success: false,
            error: "The store purchase did not return an active premium entitlement.",
          };
        }

        const synced = await syncIapReceiptWithBackend(uid);
        if (!synced) {
          return {
            success: false,
            error: "Purchase completed with the store, but server verification failed. Please try Restore Purchases later.",
          };
        }
        return { success: true, tier: "premium" };
      }

      if (packages.length > 0) {
        return {
          success: false,
          error: `The ${planId} plan is not configured in the billing provider.`,
        };
      }
    } catch (err: any) {
      if (err?.userCancelled) return { success: false, error: "Purchase cancelled by user." };
      if (__DEV__) console.warn("[PurchaseService] Google Play purchase failed:", err);
      return {
        success: false,
        error: err?.message || "Google Play purchase failed. Please try again.",
      };
    }
  }

  return {
    success: false,
    error: "Google Play billing is not available in this build. Install the Google Play version and try again.",
  };
}

export async function restorePurchases(): Promise<PurchaseResult> {
  if (Platform.OS !== "android" || !Purchases) {
    return { success: false, error: "Google Play billing is not active on this device." };
  }

  try {
    const uid = auth.currentUser?.uid;
    if (!uid || !(await initPurchaseService(uid))) {
      return { success: false, error: "Sign in before restoring Google Play purchases." };
    }

    const customerInfo = await Purchases.restorePurchases();
    if (!hasActivePremiumEntitlement(customerInfo)) {
      return { success: false, error: "No active subscription found to restore." };
    }

    const synced = await syncIapReceiptWithBackend(uid);
    if (!synced) {
      return { success: false, error: "Subscription found, but server verification failed." };
    }
    return { success: true, tier: "premium" };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to restore purchases." };
  }
}

export async function getPlanOfferings(): Promise<PlanOffering[]> {
  if (Platform.OS !== "android" || !Purchases || !isInitialized) return [];

  try {
    const offerings = await Purchases.getOfferings();
    const packages = offerings?.current?.availablePackages || [];
    return packages.flatMap((pkg: any): PlanOffering[] => {
      const plan = (Object.keys(PACKAGE_TYPE_ALIASES) as PremiumPlan[]).find((candidate) =>
        packageMatchesPlan(pkg, candidate)
      );
      const priceString = String(pkg?.product?.priceString || "").trim();
      if (!plan || !priceString) return [];
      return [{ plan, identifier: String(pkg.identifier), priceString }];
    });
  } catch (err) {
    if (__DEV__) console.warn("[PurchaseService] Failed to load Google Play offerings:", err);
    return [];
  }
}

async function syncIapReceiptWithBackend(uid: string): Promise<boolean> {
  if (!API_BASE_URL) return false;
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return false;

    const res = await fetch(`${API_BASE_URL}/api/v1/auth/entitlements/verify-iap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      // The backend derives and verifies the RevenueCat customer from the
      // Firebase token. No client entitlement or receipt data is trusted.
      body: JSON.stringify({ appUserId: uid }),
    });
    if (!res.ok) {
      if (__DEV__) console.warn("[PurchaseService] Backend entitlement verification failed:", res.status);
      return false;
    }
    return true;
  } catch (e) {
    if (__DEV__) console.warn("[PurchaseService] Failed to sync entitlement:", e);
    return false;
  }
}
