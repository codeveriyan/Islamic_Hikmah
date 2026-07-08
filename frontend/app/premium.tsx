import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  ActivityIndicator, 
  Alert 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

export default function PremiumScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, togglePremiumTier } = useAuth();
  
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly" | "lifetime">("yearly");
  const [purchasing, setPurchasing] = useState(false);

  const handleSubscribe = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setPurchasing(true);
    
    // Simulate payment sheet delay
    setTimeout(async () => {
      try {
        if (profile?.tier !== "premium") {
          await togglePremiumTier();
        }
        setPurchasing(false);
        Alert.alert(
          "Subscription Success!",
          "Thank you for subscribing! Premium features have been unlocked on your account.",
          [{ text: "Awesome", onPress: () => router.back() }]
        );
      } catch (err) {
        setPurchasing(false);
        Alert.alert("Error", "Payment failed. Please try again.");
      }
    }, 2000);
  };

  const handleDevBypass = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await togglePremiumTier();
    const isNowPremium = profile?.tier !== "premium"; // due to state batching, check inverse
    Alert.alert(
      "Developer Bypass",
      isNowPremium 
        ? "Premium mode enabled! All gated features are now unlocked." 
        : "Premium mode disabled! App returned to Free tier status.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Alert.alert("Purchase Restored", "Your subscription purchases have been successfully restored.");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Top Close Button */}
      <View style={styles.topHeader}>
        <Pressable 
          onPress={() => router.back()} 
          style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
        </Pressable>
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
            Support the app's development and get access to these premium companion tools.
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
              <Text style={[styles.planPrice, { color: colors.onSurface }]}>₹99</Text>
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
                  <Text style={[styles.saveBadgeTxt, { color: colors.onBrandPrimary }]}>SAVE 80%</Text>
                </View>
              </View>
              <Text style={[styles.planSub, { color: colors.onSurfaceMuted }]}>Best spiritual value</Text>
            </View>
            <View style={styles.planPriceInfo}>
              <Text style={[styles.planPrice, { color: colors.onSurface }]}>₹199</Text>
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
              <Text style={[styles.planPrice, { color: colors.onSurface }]}>₹499</Text>
              <Text style={[styles.planPeriod, { color: colors.onSurfaceMuted }]}>one-time</Text>
            </View>
          </Pressable>

        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          
          <Pressable
            onPress={handleSubscribe}
            disabled={purchasing}
            style={({ pressed }) => [
              styles.subscribeBtn,
              { backgroundColor: colors.brand },
              (pressed || purchasing) && { opacity: 0.9 }
            ]}
          >
            {purchasing ? (
              <ActivityIndicator color={colors.onBrandPrimary} />
            ) : (
              <Text style={[styles.subscribeBtnTxt, { color: colors.onBrandPrimary }]}>
                {selectedPlan === "lifetime" ? "Unlock Lifetime Access" : "Subscribe Now"}
              </Text>
            )}
          </Pressable>

          <View style={styles.linksRow}>
            <Pressable onPress={handleRestore} style={styles.linkBtn}>
              <Text style={[styles.linkBtnTxt, { color: colors.onSurfaceMuted }]}>Restore Purchase</Text>
            </Pressable>
            <View style={[styles.linkDot, { backgroundColor: colors.border }]} />
            <Pressable onPress={handleDevBypass} style={styles.linkBtn}>
              <Text style={[styles.linkBtnTxt, { color: colors.brand, fontWeight: "700" }]}>
                {profile?.tier === "premium" ? "Dev: Lock App" : "Dev: Unlock Free Premium"}
              </Text>
            </Pressable>
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
});
