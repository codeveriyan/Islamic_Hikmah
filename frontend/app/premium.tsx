import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  Alert,
  Modal,
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
import { auth } from "@/src/firebase";
import { API_BASE_URL } from "@/src/apiBaseUrl";
import { initPurchaseService, purchasePlan, restorePurchases } from "@/src/services/purchaseService";
import {
  AppButton,
  AppIconButton,
  AppTextInput,
} from "@/src/components/ui";

export default function PremiumScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, startTrial, refreshEntitlements, isGuest } = useAuth();
  
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly" | "lifetime">("yearly");
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [utr, setUtr] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [purchasingNative, setPurchasingNative] = useState(false);

  useEffect(() => {
    initPurchaseService(auth.currentUser?.uid).catch(() => {});
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

  const getPlanPrice = () => {
    switch (selectedPlan) {
      case "monthly": return 99;
      case "yearly": return 199;
      case "lifetime": return 499;
    }
  };

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
    const result = await purchasePlan(selectedPlan, profile?.email);
    setPurchasingNative(false);

    if (result.success) {
      await refreshEntitlements();
      Alert.alert("Welcome to Pro! 🎉", "Your subscription is active. Enjoy all premium features!", [
        { text: "Continue", onPress: () => router.back() },
      ]);
      return;
    }

    if (result.error) {
      Alert.alert("Purchase Notice", result.error);
      return;
    }

    // Fallback to UPI flow if native store billing isn't configured
    setUpiModalVisible(true);
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
    } catch {
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
      if (!API_BASE_URL || !auth.currentUser || isGuest) {
        throw new Error("Sign in and connect to the payment service before submitting a UTR.");
      }
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/payment-submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          utr: cleanUTR,
          plan: selectedPlan
        })
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.detail || "Payment submission failed.");
      }

      setVerifying(false);
      setUpiModalVisible(false);
      setUtr("");
      setShowQR(false);

      Alert.alert(
        "Payment Submitted",
        "JazakAllah! Your UTR is pending manual review. Premium will be activated only after the payment is confirmed.",
        [{ text: "Done", onPress: () => router.back() }]
      );
    } catch (err: any) {
      setVerifying(false);
      Alert.alert("Error", err.message || "Failed to submit verification. Please check your internet connection.");
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
              onPress={handleRestore}
              variant="text"
            />
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
                No platform commissions. 100% of your support goes to the application&apos;s servers.
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
                <AppButton
                  fullWidth
                  icon="flash"
                  label="Open UPI payment apps"
                  onPress={handlePayViaUPI}
                />
              )}

              {/* Manual UPI/QR Trigger */}
              <AppButton
                fullWidth
                icon="qrcode"
                label={showQR ? "Hide QR code" : "Show static UPI QR code"}
                onPress={() => setShowQR(!showQR)} 
                variant="outlined"
              />

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
                    <AppIconButton
                      accessibilityLabel="Copy UPI ID"
                      icon="content-copy"
                      onPress={handleCopyUPI}
                    />
                  </View>
                </View>
              )}

              {/* Verification Section */}
              <View style={styles.verificationWrap}>
                <Text style={[styles.verificationLabel, { color: colors.onSurface }]}>
                  Enter 12-digit UPI Ref No. (UTR)
                </Text>
                <Text style={[styles.verificationDesc, { color: colors.onSurfaceMuted }]}>
                  After completing the transfer, submit the UTR for manual payment review.
                </Text>
                <AppTextInput
                  autoCorrect={false}
                  keyboardType="numeric"
                  label="UPI reference number"
                  leadingIcon="receipt-text-outline"
                  maxLength={12}
                  onChangeText={setUtr}
                  placeholder="e.g. 620478193024"
                  value={utr}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <AppButton
                  fullWidth
                  label="Submit for review"
                  loading={verifying}
                  onPress={handleVerifyUTR}
                />

                <AppButton
                  fullWidth
                  label="Cancel"
                  onPress={() => {
                    setUpiModalVisible(false);
                    setUtr("");
                    setShowQR(false);
                  }}
                  variant="text"
                />
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
