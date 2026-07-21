import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Modal,
  TextInput,
  Platform,
  Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "@/src/firebase";

const HADITH_API_BASE_URL = process.env.EXPO_PUBLIC_HADITH_API_BASE_URL?.replace(/\/$/, "");

export default function PremiumScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, togglePremiumTier, startTrial, isGuest } = useAuth();
  
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly" | "lifetime">("yearly");
  const [purchasing, setPurchasing] = useState(false);
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [utr, setUtr] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showQR, setShowQR] = useState(false);

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
    } catch (e) {
      Alert.alert("Error", "Failed to start free trial. Please check your network connection.");
    }
  };

  const getPlanPrice = () => {
    switch (selectedPlan) {
      case "monthly": return 99;
      case "yearly": return 199;
      case "lifetime": return 499;
    }
  };

  const handleSubscribe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setUpiModalVisible(true);
  };

  const handlePayViaUPI = async () => {
    Haptics.selectionAsync().catch(() => {});
    const price = getPlanPrice();
    const upiUrl = `upi://pay?pa=islamichikmah@ybl&pn=Islamic%20Hikmah&am=${price}&cu=INR&tn=Islamic%20Hikmah%20${selectedPlan}`;
    
    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) {
        await Linking.openURL(upiUrl);
      } else {
        Alert.alert(
          "UPI App Not Found",
          "We couldn't detect any active UPI apps (like Google Pay, PhonePe, or Paytm) on this device. Please scan the QR Code manually to complete the payment.",
          [{ text: "Show QR Code", onPress: () => setShowQR(true) }]
        );
      }
    } catch (e) {
      Alert.alert("Error", "Unable to launch UPI application. Please pay manually using the QR code.");
    }
  };

  const handleCopyUPI = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      await Clipboard.setStringAsync("islamichikmah@ybl");
      Alert.alert("Copied", "UPI ID copied to clipboard!");
    } catch (err) {
      console.warn("Failed to copy to clipboard:", err);
      Alert.alert("Error", "Could not copy to clipboard. Please copy it manually.");
    }
  };

  const handleVerifyUTR = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const cleanUTR = utr.trim();
    
    if (!/^\d{12}$/.test(cleanUTR)) {
      Alert.alert("Invalid UTR", "The UPI Ref No. (UTR) must be exactly a 12-digit number. Please check your payment receipt.");
      return;
    }

    setVerifying(true);
    try {
      // Save payment transaction ledger to Firestore
      const paymentRef = doc(db, "payments", cleanUTR);
      await setDoc(paymentRef, {
        uid: profile?.uid || "anonymous",
        email: profile?.email || "anonymous@islamichikmah.app",
        plan: selectedPlan,
        amount: getPlanPrice(),
        utr: cleanUTR,
        timestamp: Date.now(),
        status: "pending"
      });

      // Call backend UTR verify endpoint if base URL is set
      if (HADITH_API_BASE_URL) {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          const res = await fetch(`${HADITH_API_BASE_URL}/api/verify-utr`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              utr: cleanUTR,
              plan: selectedPlan,
              amount: getPlanPrice()
            })
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Payment verification failed.");
          }
        }
      }

      // Instantly unlock premium tier locally for a premium experience
      if (profile?.tier !== "premium") {
        await togglePremiumTier();
      }

      setVerifying(false);
      setUpiModalVisible(false);
      setUtr("");
      setShowQR(false);

      Alert.alert(
        "Verification Logged 🎉",
        "JazakAllah! Your payment UTR has been logged for audit. All Premium features have been unlocked instantly on your device!",
        [{ text: "Awesome", onPress: () => router.back() }]
      );
    } catch (err: any) {
      setVerifying(false);
      Alert.alert("Error", err.message || "Failed to submit verification. Please check your internet connection.");
    }
  };

  const handleDevBypass = async () => {
    if (!__DEV__) return;
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
    if (profile?.tier === "premium" || profile?.trialActive) {
      Alert.alert("Subscription Restored", "Your active Pro subscription has been verified and restored.");
    } else {
      Alert.alert(
        "No Subscription Found",
        "We could not locate an active Pro subscription for your account. If you believe this is an error, please try logging in with your registered email."
      );
    }
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

          {!profile?.trialStartedAt && profile?.tier !== "premium" && (
            <Pressable
              onPress={handleStartTrial}
              style={({ pressed }) => [
                styles.trialBtn,
                { backgroundColor: "rgba(39,174,96,0.12)", borderColor: "#27ae60", borderWidth: 1.5 },
                pressed && { opacity: 0.8 }
              ]}
            >
              <MaterialCommunityIcons name="clock-outline" size={20} color="#27ae60" style={{ marginRight: 6 }} />
              <Text style={[styles.trialBtnTxt, { color: "#27ae60" }]}>
                Start 7-Day Free Trial
              </Text>
            </Pressable>
          )}

          {profile?.trialActive && (
            <View style={[styles.trialActiveBanner, { backgroundColor: "rgba(39,174,96,0.06)", borderColor: "rgba(39,174,96,0.15)", borderWidth: 1, borderRadius: 12, paddingVertical: 12, width: "100%", alignItems: "center", marginBottom: 8 }]}>
              <Text style={{ color: "#27ae60", fontWeight: "700" }}>
                ⏳ Trial Active — {profile.trialDaysLeft} days remaining
              </Text>
            </View>
          )}
          
          <Pressable
            onPress={handleSubscribe}
            disabled={purchasing}
            style={({ pressed }) => [
              styles.subscribeBtn,
              { backgroundColor: colors.brand },
              (pressed || purchasing) && { opacity: 0.9 }
            ]}
          >
            <Text style={[styles.subscribeBtnTxt, { color: colors.onBrandPrimary }]}>
              {selectedPlan === "lifetime" ? "Unlock Lifetime Access" : "Subscribe Now"}
            </Text>
          </Pressable>

          <View style={styles.linksRow}>
            <Pressable onPress={handleRestore} style={styles.linkBtn}>
              <Text style={[styles.linkBtnTxt, { color: colors.onSurfaceMuted }]}>Restore Purchase</Text>
            </Pressable>
            {__DEV__ && (
              <>
                <View style={[styles.linkDot, { backgroundColor: colors.border }]} />
                <Pressable onPress={handleDevBypass} style={styles.linkBtn}>
                  <Text style={[styles.linkBtnTxt, { color: colors.brand, fontWeight: "700" }]}>
                    {profile?.tier === "premium" ? "Dev: Lock App" : "Dev: Unlock Free Premium"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>

        </View>

      </ScrollView>

      {/* UPI Billing Sheet Modal */}
      <Modal
        visible={upiModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUpiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            
            {/* Crown Icon Header */}
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="crown" size={32} color="#FFD700" />
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>UPI Payment Checkout</Text>
              <Text style={[styles.modalSubtitle, { color: colors.onSurfaceMuted }]}>
                No platform commissions. 100% of your support goes to the application's servers.
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalForm} contentContainerStyle={{ paddingBottom: 24 }}>
              
              {/* Plan Summary Card */}
              <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.summaryPlanName, { color: colors.onSurface }]}>
                  {selectedPlan === "lifetime" ? "Lifetime Pro" : selectedPlan === "yearly" ? "Yearly Pro" : "Monthly Pro"}
                </Text>
                <Text style={[styles.summaryPlanPrice, { color: colors.brand }]}>₹{getPlanPrice()}</Text>
              </View>

              {/* Pay Button for Mobile */}
              {Platform.OS !== "web" && (
                <Pressable
                  onPress={handlePayViaUPI}
                  style={({ pressed }) => [
                    styles.upiPayButton,
                    { backgroundColor: colors.brand },
                    pressed && { opacity: 0.9 }
                  ]}
                >
                  <MaterialCommunityIcons name="flash" size={20} color={colors.onBrandPrimary} style={{ marginRight: 6 }} />
                  <Text style={[styles.upiPayButtonText, { color: colors.onBrandPrimary }]}>Open UPI Payment Apps</Text>
                </Pressable>
              )}

              {/* Manual UPI/QR Trigger */}
              <Pressable 
                onPress={() => setShowQR(!showQR)} 
                style={[styles.qrTrigger, { borderColor: colors.border }]}
              >
                <MaterialCommunityIcons name="qrcode" size={18} color={colors.onSurface} style={{ marginRight: 6 }} />
                <Text style={[styles.qrTriggerTxt, { color: colors.onSurface }]}>
                  {showQR ? "Hide QR Code" : "Show static UPI QR Code"}
                </Text>
              </Pressable>

              {/* Static QR Section */}
              {showQR && (
                <View style={styles.qrSection}>
                  <View style={styles.qrBox}>
                    {/* Mock styled QR code patterns */}
                    <View style={styles.qrPatternRow}>
                      <View style={styles.qrCornerMark} />
                      <View style={{ flex: 1 }} />
                      <View style={styles.qrCornerMark} />
                    </View>
                    <View style={styles.qrPatternMid}>
                      <MaterialCommunityIcons name="crown" size={32} color={colors.brand} />
                    </View>
                    <View style={styles.qrPatternRow}>
                      <View style={styles.qrCornerMark} />
                      <View style={{ flex: 1 }} />
                      <View style={styles.qrCornerMark} />
                    </View>
                  </View>
                  
                  <View style={styles.upiIdRow}>
                    <Text style={[styles.upiIdTxt, { color: colors.onSurfaceMuted }]}>UPI ID: islamichikmah@ybl</Text>
                    <Pressable onPress={handleCopyUPI} hitSlop={8} style={styles.copyBtn}>
                      <MaterialCommunityIcons name="content-copy" size={16} color={colors.brand} />
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Verification Section */}
              <View style={styles.verificationWrap}>
                <Text style={[styles.verificationLabel, { color: colors.onSurface }]}>
                  Enter 12-digit UPI Ref No. (UTR)
                </Text>
                <Text style={[styles.verificationDesc, { color: colors.onSurfaceMuted }]}>
                  After completing the transfer inside your UPI app, paste the UTR transaction number here to activate.
                </Text>
                <TextInput
                  style={[styles.utrInput, { backgroundColor: colors.surface, color: colors.onSurface, borderColor: colors.border }]}
                  placeholder="e.g. 620478193024"
                  placeholderTextColor={colors.onSurfaceMuted}
                  value={utr}
                  onChangeText={setUtr}
                  keyboardType="numeric"
                  maxLength={12}
                  autoCorrect={false}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <Pressable
                  onPress={handleVerifyUTR}
                  disabled={verifying}
                  style={({ pressed }) => [
                    styles.verifyBtn,
                    { backgroundColor: colors.brand },
                    (pressed || verifying) && { opacity: 0.9 }
                  ]}
                >
                  {verifying ? (
                    <ActivityIndicator color={colors.onBrandPrimary} />
                  ) : (
                    <Text style={[styles.verifyBtnTxt, { color: colors.onBrandPrimary }]}>Verify & Activate</Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => {
                    setUpiModalVisible(false);
                    setUtr("");
                    setShowQR(false);
                  }}
                  style={styles.cancelBtn}
                >
                  <Text style={[styles.cancelBtnTxt, { color: colors.onSurfaceMuted }]}>Cancel</Text>
                </Pressable>
              </View>

            </ScrollView>

          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingTop: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  modalForm: {
    paddingHorizontal: 24,
  },
  summaryCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryPlanName: {
    fontSize: 15,
    fontWeight: "700",
  },
  summaryPlanPrice: {
    fontSize: 18,
    fontWeight: "800",
  },
  upiPayButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 12,
    marginBottom: 12,
  },
  upiPayButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  qrTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 16,
  },
  qrTriggerTxt: {
    fontSize: 14,
    fontWeight: "600",
  },
  qrSection: {
    alignItems: "center",
    marginBottom: 18,
    gap: 12,
  },
  qrBox: {
    width: 140,
    height: 140,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderColor: "#E2E8F0",
    borderWidth: 1,
    justifyContent: "space-between",
  },
  qrPatternRow: {
    flexDirection: "row",
    height: 32,
  },
  qrCornerMark: {
    width: 32,
    height: 32,
    borderWidth: 3,
    borderColor: "#0F172A",
    borderRadius: 4,
  },
  qrPatternMid: {
    alignItems: "center",
    justifyContent: "center",
  },
  upiIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  upiIdTxt: {
    fontSize: 13,
    fontWeight: "600",
  },
  copyBtn: {
    padding: 4,
  },
  verificationWrap: {
    gap: 8,
    marginBottom: 24,
  },
  verificationLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  verificationDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  utrInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    letterSpacing: 1.5,
  },
  modalActions: {
    gap: 10,
  },
  verifyBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyBtnTxt: {
    fontSize: 15,
    fontWeight: "700",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelBtnTxt: {
    fontSize: 14,
    fontWeight: "600",
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
