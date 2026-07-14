import React, { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, Pressable, Modal, Animated,
  ScrollView, Dimensions, Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { usePremiumModal } from "@/src/PremiumModalContext";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

const PREMIUM_FEATURES = [
  { icon: "food-halal",          label: "Halal Food & Product Finder",     desc: "Find halal restaurants & scan product barcodes"      },
  { icon: "volume-high",         label: "Quran Audio & Reciters",          desc: "30+ reciters, word-by-word sync & offline downloads" },
  { icon: "book-multiple",       label: "Learn Quran & Mutashabihat",      desc: "Interactive study tools & similar-verse explorer"    },
  { icon: "prayer",              label: "Adhan Notifications",             desc: "Get notified at every prayer time automatically"    },
  { icon: "counter",             label: "Tasbih — Save, Customize & Audio", desc: "Custom dhikr, appearance themes & audio playback"   },
  { icon: "google",              label: "Google Calendar Sync",            desc: "Sync goals & prayer times with your calendar"       },
  { icon: "compass-rose",        label: "Qibla Distance & Skins",         desc: "Kaaba distance + premium compass designs"           },
  { icon: "calculator",         label: "Zakat Calculator",                desc: "Full Zakat calculation on your wealth"              },
];

const PLANS = [
  { id: "monthly",  label: "Monthly",  price: "₹99",   period: "/month", badge: "" },
  { id: "yearly",   label: "Yearly",   price: "₹699",  period: "/year",  badge: "Save 40%" },
  { id: "lifetime", label: "Lifetime", price: "₹1,999", period: "once",  badge: "Best Value" },
];

export default function PremiumModal() {
  const { visible, featureName, hidePremiumModal } = usePremiumModal();
  const { profile, startTrial } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  const trialAvailable = !profile?.trialStartedAt && !!profile && profile.uid !== "guest-uid";
  const trialActive    = profile?.trialActive ?? false;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, damping: 22, stiffness: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    hidePremiumModal();
    router.push("/premium");
  };

  const handleStartTrial = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    hidePremiumModal();
    if (!profile || profile.uid === "guest-uid") {
      router.push("/auth/login");
      return;
    }
    await startTrial();
  };

  const handleLogin = () => {
    hidePremiumModal();
    router.push("/auth/login");
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={hidePremiumModal}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={hidePremiumModal} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        {/* Gradient header */}
        <LinearGradient
          colors={["#064e2e", "#0f7a4a", "#1a9d5f"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Close button */}
          <Pressable onPress={hidePremiumModal} style={styles.closeBtn} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={20} color="rgba(255,255,255,0.7)" />
          </Pressable>

          {/* Crown icon */}
          <View style={styles.crownWrap}>
            <LinearGradient
              colors={["#f5d060", "#e8a320", "#c97b0c"]}
              style={styles.crownCircle}
            >
              <MaterialCommunityIcons name="crown" size={32} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.headerTitle}>Islamic Hikmah Premium</Text>
          <Text style={styles.headerSub}>
            {featureName !== "Premium Feature"
              ? `"${featureName}" is a Premium feature`
              : "Unlock the full Islamic experience"}
          </Text>

          {/* Shimmer dots */}
          <View style={styles.shimmerRow}>
            {["✦","✧","✦","✧","✦"].map((s, i) => (
              <Text key={i} style={[styles.shimmer, { opacity: 0.3 + (i % 2) * 0.3 }]}>{s}</Text>
            ))}
          </View>
        </LinearGradient>

        {/* Body */}
        <View style={[styles.body, { backgroundColor: colors.surface }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bodyScroll}
            bounces={false}
          >
            {/* Feature list */}
            <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>WHAT YOU GET</Text>
            <View style={styles.featureList}>
              {PREMIUM_FEATURES.map((f, i) => (
                <View key={i} style={[styles.featureRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.featureIcon, { backgroundColor: "#0f7a4a18" }]}>
                    <MaterialCommunityIcons name={f.icon as any} size={20} color="#0f7a4a" />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={[styles.featureLabel, { color: colors.onSurface }]}>{f.label}</Text>
                    <Text style={[styles.featureDesc,  { color: colors.onSurfaceMuted }]}>{f.desc}</Text>
                  </View>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#0f7a4a" />
                </View>
              ))}
            </View>

            {/* Plan selector */}
            <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted, marginTop: 20 }]}>CHOOSE A PLAN</Text>
            <View style={styles.planRow}>
              {PLANS.map((plan) => (
                <Pressable
                  key={plan.id}
                  onPress={handleUpgrade}
                  style={({ pressed }) => [
                    styles.planCard,
                    { borderColor: plan.id === "yearly" ? "#0f7a4a" : colors.border,
                      backgroundColor: plan.id === "yearly" ? "#0f7a4a0e" : colors.surfaceSecondary,
                      borderWidth: plan.id === "yearly" ? 2 : 1,
                      opacity: pressed ? 0.85 : 1
                    }
                  ]}
                >
                  {plan.badge ? (
                    <View style={[styles.planBadge, { backgroundColor: plan.id === "lifetime" ? "#e8a320" : "#0f7a4a" }]}>
                      <Text style={styles.planBadgeTxt}>{plan.badge}</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.planLabel, { color: colors.onSurface }]}>{plan.label}</Text>
                  <Text style={[styles.planPrice, { color: plan.id === "yearly" ? "#0f7a4a" : colors.onSurface }]}>
                    {plan.price}
                  </Text>
                  <Text style={[styles.planPeriod, { color: colors.onSurfaceMuted }]}>{plan.period}</Text>
                </Pressable>
              ))}
            </View>

            {/* Trial / CTA */}
            <View style={styles.ctaSection}>
              {/* Primary CTA */}
              <Pressable
                onPress={handleUpgrade}
                style={({ pressed }) => [styles.upgradeBtn, pressed && { opacity: 0.88 }]}
              >
                <LinearGradient
                  colors={["#0a4f2f", "#0f7a4a", "#16a064"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.upgradeBtnGradient}
                >
                  <MaterialCommunityIcons name="crown" size={18} color="#f5d060" />
                  <Text style={styles.upgradeBtnTxt}>Unlock Premium Now</Text>
                </LinearGradient>
              </Pressable>

              {/* Trial CTA */}
              {trialActive ? (
                <View style={[styles.trialActiveRow, { backgroundColor: "#0f7a4a15" }]}>
                  <MaterialCommunityIcons name="check-circle" size={16} color="#0f7a4a" />
                  <Text style={[styles.trialActiveTxt, { color: "#0f7a4a" }]}>Free trial is active — enjoy Premium!</Text>
                </View>
              ) : trialAvailable ? (
                <Pressable
                  onPress={handleStartTrial}
                  style={({ pressed }) => [styles.trialBtn, { borderColor: "#0f7a4a" + "44", opacity: pressed ? 0.8 : 1 }]}
                >
                  <MaterialCommunityIcons name="timer-outline" size={16} color="#0f7a4a" />
                  <Text style={[styles.trialBtnTxt, { color: "#0f7a4a" }]}>Start 7-Day Free Trial</Text>
                </Pressable>
              ) : !profile || profile.uid === "guest-uid" ? (
                <Pressable
                  onPress={handleLogin}
                  style={({ pressed }) => [styles.trialBtn, { borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
                >
                  <MaterialCommunityIcons name="account-key-outline" size={16} color={colors.brand} />
                  <Text style={[styles.trialBtnTxt, { color: colors.brand }]}>Login for 7-Day Free Trial</Text>
                </Pressable>
              ) : null}

              <Text style={[styles.disclaimer, { color: colors.onSurfaceMuted }]}>
                UPI payment • No platform fees • Cancel anytime
              </Text>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_H * 0.92,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  crownWrap: {
    marginBottom: 12,
  },
  crownCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#e8a320",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
    textAlign: "center",
  },
  shimmerRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  shimmer: {
    fontSize: 14,
    color: "#f5d060",
  },
  body: {
    flex: 1,
  },
  bodyScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  featureList: {
    gap: 0,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  featureDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  planRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  planCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  planBadge: {
    position: "absolute",
    top: 6,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  planBadgeTxt: {
    fontSize: 8,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  planLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 8,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  planPeriod: {
    fontSize: 10,
    marginTop: 2,
  },
  ctaSection: {
    marginTop: 22,
    gap: 10,
    alignItems: "center",
  },
  upgradeBtn: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#0f7a4a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  upgradeBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
  },
  upgradeBtnTxt: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  trialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  trialBtnTxt: {
    fontSize: 14,
    fontWeight: "700",
  },
  trialActiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  trialActiveTxt: {
    fontSize: 13,
    fontWeight: "600",
  },
  disclaimer: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
});
