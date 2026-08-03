import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { auth } from "@/src/firebase";
import {
  getPlanOfferings,
  initPurchaseService,
  purchasePlan,
  restorePurchases,
  type PremiumPlan,
} from "@/src/services/purchaseService";
import {
  AppButton,
  AppIconButton,
} from "@/src/components/ui";

export default function PremiumScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, startTrial, refreshEntitlements, isGuest } = useAuth();
  
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan>("yearly");
  const [planPrices, setPlanPrices] = useState<Partial<Record<PremiumPlan, string>>>({});
  const [purchasingNative, setPurchasingNative] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadGooglePlayOfferings = async () => {
      const configured = await initPurchaseService(auth.currentUser?.uid);
      if (!configured) return;
      const offerings = await getPlanOfferings();
      if (cancelled) return;
      const prices: Partial<Record<PremiumPlan, string>> = {};
      offerings.forEach((offering) => {
        prices[offering.plan] = offering.priceString;
      });
      setPlanPrices(prices);
    };
    loadGooglePlayOfferings().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStartTrial = async () => {
    if (isGuest) {
      Alert.alert(
        "Registration Required",
        "To prevent abuse, starting the 7-day free trial requires a registered user account. Would you like to sign in or create an account now?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log In", onPress: () => router.push("/auth/login") },
        ]
      );
      return;
    }

    try {
      await startTrial();
      Alert.alert(
        "Trial Started! 🎉",
        "Your 7-day free trial has been activated successfully! You now have unrestricted access to all companion Pro features.",
        [{ text: "Great!", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert("Error", "Failed to start free trial. Please check your network connection.");
    }
  };

  const getPlanPrice = (plan: PremiumPlan) => planPrices[plan] || "Price in Google Play";

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (isGuest || !auth.currentUser) {
      Alert.alert(
        "Sign In Required",
        "Sign in with a verified account before subscribing.",
        [{ text: "Log In", onPress: () => router.push("/auth/login") }]
      );
      return;
    }

    setPurchasingNative(true);
    let result;
    try {
      result = await purchasePlan(selectedPlan, profile?.email);
    } catch {
      Alert.alert("Purchase Error", "The purchase could not be started. Please try again.");
      return;
    } finally {
      setPurchasingNative(false);
    }

    if (result.success) {
      await refreshEntitlements();
      Alert.alert("Welcome to Pro! 🎉", "Your subscription is active. Enjoy all premium features!", [
        { text: "Continue", onPress: () => router.back() },
      ]);
      return;
    }

    Alert.alert("Google Play Billing", result.error || "Google Play billing is unavailable.");
  };

  const handleRestorePurchases = async () => {
    setPurchasingNative(true);
    const result = await restorePurchases();
    setPurchasingNative(false);

    if (result.success) {
      await refreshEntitlements();
      Alert.alert("Purchases Restored! 🎉", "Your Pro subscription has been restored successfully.");
    } else {
      Alert.alert("Restore Notice", result.error || "No active purchases found to restore.");
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await handleRestorePurchases();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Top Close Button */}
      <View style={styles.topHeader}>
        <AppIconButton
          accessibilityLabel="Close premium screen"
          icon="close"
          onPress={() => router.back()} 
          variant="tonal"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Title */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={["#FFD700", colors.brand]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.goldBadge}
          >
            <MaterialCommunityIcons name="crown" size={24} color="#000" />
            <Text style={styles.goldBadgeTxt}>PRO</Text>
          </LinearGradient>
          <Text style={[styles.heroTitle, { color: colors.onSurface }]}>Unlock Premium Access</Text>
          <Text style={[styles.heroDesc, { color: colors.onSurfaceSecondary }]}>
            {"Support the app's development and get access to these premium companion tools."}
          </Text>
        </View>

        {/* Feature List */}
        <View style={[styles.featuresSection, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          
          <View style={styles.featureRow}>
            <View style={[styles.featureIconWrap, { backgroundColor: colors.brand + "15" }]}>
              <MaterialCommunityIcons name="calendar-sync-outline" size={22} color={colors.brand} />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={[styles.featureTitle, { color: colors.onSurface }]}>Google Calendar Sync</Text>
              <Text style={[styles.featureDescText, { color: colors.onSurfaceMuted }]}>
                Automate your schedules. Sync prayer timings directly to your Google Calendar.
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.featureIconWrap, { backgroundColor: colors.brand + "15" }]}>
              <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={22} color={colors.brand} />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={[styles.featureTitle, { color: colors.onSurface }]}>Advanced Analytics & History</Text>
              <Text style={[styles.featureDescText, { color: colors.onSurfaceMuted }]}>
                Access previous goals log. Track spiritual growth patterns over months.
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.featureIconWrap, { backgroundColor: colors.brand + "15" }]}>
              <MaterialCommunityIcons name="music-note-outline" size={22} color={colors.brand} />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={[styles.featureTitle, { color: colors.onSurface }]}>Offline Audio & Reciters</Text>
              <Text style={[styles.featureDescText, { color: colors.onSurfaceMuted }]}>
                Listen to multiple high-quality Quran recitations offline without internet.
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.featureIconWrap, { backgroundColor: colors.brand + "15" }]}>
              <MaterialCommunityIcons name="bell-ring-outline" size={22} color={colors.brand} />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={[styles.featureTitle, { color: colors.onSurface }]}>Custom Reminders & Muezzins</Text>
              <Text style={[styles.featureDescText, { color: colors.onSurfaceMuted }]}>
                Customize notifications with unique Adhan voice files and recurrence rules.
              </Text>
            </View>
          </View>

        </View>

        {/* Pricing Selection */}
        <View style={styles.pricingSection}>
          
          {/* Monthly */}
          <Pressable 
            onPress={() => setSelectedPlan("monthly")}
            style={[
              styles.planCard, 
              { backgroundColor: colors.surfaceSecondary, borderColor: selectedPlan === "monthly" ? colors.brand : colors.border }
            ]}
          >
            <View style={styles.planInfo}>
              <Text style={[styles.planName, { color: colors.onSurface }]}>Monthly Access</Text>
              <Text style={[styles.planSub, { color: colors.onSurfaceMuted }]}>Cancel anytime</Text>
            </View>
            <View style={styles.planPriceInfo}>
              <Text style={[styles.planPrice, { color: colors.onSurface }]}>{getPlanPrice("monthly")}</Text>
              <Text style={[styles.planPeriod, { color: colors.onSurfaceMuted }]}>/ month</Text>
            </View>
          </Pressable>

          {/* Yearly */}
          <Pressable 
            onPress={() => setSelectedPlan("yearly")}
            style={[
              styles.planCard, 
              { backgroundColor: colors.surfaceSecondary, borderColor: selectedPlan === "yearly" ? colors.brand : colors.border }
            ]}
          >
            <View style={styles.planInfo}>
              <View style={styles.yearlyHeader}>
                <Text style={[styles.planName, { color: colors.onSurface }]}>Yearly Access</Text>
                <View style={[styles.saveBadge, { backgroundColor: colors.brand }]}>
                  <Text style={[styles.saveBadgeTxt, { color: colors.onBrandPrimary }]}>BEST VALUE</Text>
                </View>
              </View>
              <Text style={[styles.planSub, { color: colors.onSurfaceMuted }]}>Best spiritual value</Text>
            </View>
            <View style={styles.planPriceInfo}>
              <Text style={[styles.planPrice, { color: colors.onSurface }]}>{getPlanPrice("yearly")}</Text>
              <Text style={[styles.planPeriod, { color: colors.onSurfaceMuted }]}>/ year</Text>
            </View>
          </Pressable>

          {/* Lifetime */}
          <Pressable 
            onPress={() => setSelectedPlan("lifetime")}
            style={[
              styles.planCard, 
              { backgroundColor: colors.surfaceSecondary, borderColor: selectedPlan === "lifetime" ? colors.brand : colors.border }
            ]}
          >
            <View style={styles.planInfo}>
              <Text style={[styles.planName, { color: colors.onSurface }]}>Lifetime Access</Text>
              <Text style={[styles.planSub, { color: colors.onSurfaceMuted }]}>Pay once, own forever</Text>
            </View>
            <View style={styles.planPriceInfo}>
              <Text style={[styles.planPrice, { color: colors.onSurface }]}>{getPlanPrice("lifetime")}</Text>
              <Text style={[styles.planPeriod, { color: colors.onSurfaceMuted }]}>one-time</Text>
            </View>
          </Pressable>

        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>

          {!profile?.trialStartedAt && profile?.tier !== "premium" && (
            <AppButton
              fullWidth
              icon="clock-outline"
              label="Start 7-day free trial"
              onPress={handleStartTrial}
              variant="outlined"
            />
          )}

          {profile?.trialActive && (
            <View style={[styles.trialActiveBanner, { backgroundColor: "rgba(39,174,96,0.06)", borderColor: "rgba(39,174,96,0.15)", borderWidth: 1, borderRadius: 12, paddingVertical: 12, width: "100%", alignItems: "center", marginBottom: 8 }]}>
              <Text style={{ color: "#27ae60", fontWeight: "700" }}>
                ⏳ Trial Active — {profile.trialDaysLeft} days remaining
              </Text>
            </View>
          )}
          
          <AppButton
            fullWidth
            loading={purchasingNative}
            label={
              selectedPlan === "lifetime"
                ? "Unlock lifetime access"
                : "Subscribe now"
            }
            onPress={handleSubscribe}
          />

          <View style={styles.linksRow}>
            <AppButton
              label="Restore purchase"
              loading={purchasingNative}
              onPress={handleRestore}
              variant="text"
            />
          </View>

        </View>

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeader: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: "flex-end",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  goldBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 99,
    gap: 6,
    marginBottom: 16,
  },
  goldBadgeTxt: {
    fontWeight: "800",
    fontSize: 14,
    color: "#000",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  featuresSection: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 20,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: "row",
    gap: 16,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTextWrap: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  featureDescText: {
    fontSize: 13,
    lineHeight: 18,
  },
  pricingSection: {
    gap: 12,
    marginBottom: 32,
  },
  planCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    borderWidth: 2,
  },
  planInfo: {
    flex: 1,
    gap: 4,
  },
  yearlyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  saveBadgeTxt: {
    fontSize: 10,
    fontWeight: "800",
  },
  planName: {
    fontSize: 16,
    fontWeight: "700",
  },
  planSub: {
    fontSize: 13,
  },
  planPriceInfo: {
    alignItems: "flex-end",
  },
  planPrice: {
    fontSize: 20,
    fontWeight: "800",
  },
  planPeriod: {
    fontSize: 12,
  },
  actionsSection: {
    gap: 20,
    alignItems: "center",
  },
  subscribeBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  subscribeBtnTxt: {
    fontSize: 16,
    fontWeight: "800",
  },
  linksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  linkBtn: {
    padding: 6,
  },
  linkBtnTxt: {
    fontSize: 13,
  },
  linkDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  trialBtn: {
    flexDirection: "row",
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 8,
  },
  trialBtnTxt: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  trialActiveBanner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
});
