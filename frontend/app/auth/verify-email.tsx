import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator, 
  ScrollView 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "@/src/firebase";
import * as Haptics from "expo-haptics";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, reloadUser, logout } = useAuth();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Verification state check interval
  useEffect(() => {
    let checkInterval: any;
    
    if (user && !user.emailVerified) {
      // Check every 5 seconds in the background
      checkInterval = setInterval(async () => {
        try {
          await reloadUser();
        } catch {}
      }, 5000);
    }
    
    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [user]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleCheckVerification = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setChecking(true);
    setFeedbackMsg(null);

    try {
      await reloadUser();
      if (auth.currentUser?.emailVerified) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.replace("/(tabs)");
      } else {
        setFeedbackMsg({
          text: "Email is not verified yet. Please check your inbox and click the verification link.",
          type: "info"
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
    } catch (err) {
      setFeedbackMsg({
        text: "Failed to reload user. Please try again.",
        type: "error"
      });
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (cooldown > 0 || !auth.currentUser) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setResending(true);
    setFeedbackMsg(null);

    try {
      await sendEmailVerification(auth.currentUser);
      setFeedbackMsg({
        text: "A new verification email has been sent successfully.",
        type: "success"
      });
      setCooldown(60); // 60 seconds cooldown
    } catch (err) {
      setFeedbackMsg({
        text: "Too many requests. Please try again later.",
        type: "error"
      });
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await logout();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Info */}
        <View style={styles.topSection}>
          <View style={[styles.iconWrap, { backgroundColor: colors.brand + "15" }]}>
            <MaterialCommunityIcons name="email-check-outline" size={50} color={colors.brand} />
          </View>
          <Text style={[styles.title, { color: colors.onSurface }]}>Verify Your Email</Text>
          <Text style={[styles.desc, { color: colors.onSurfaceSecondary }]}>
            We sent a verification link to {"\n"}
            <Text style={[styles.emailTxt, { color: colors.onSurface }]}>{user?.email}</Text>
          </Text>
          <Text style={[styles.descSecondary, { color: colors.onSurfaceMuted }]}>
            Please click on that link to activate your Islamic Hikmah account.
          </Text>
        </View>

        {/* Feedback Messages */}
        {feedbackMsg && (
          <View style={[
            styles.feedbackBox,
            feedbackMsg.type === "success" && { backgroundColor: "#E8F5E9", borderColor: "#C8E6C9" },
            feedbackMsg.type === "error" && { backgroundColor: "#FFEBEE", borderColor: "#FFCDD2" },
            feedbackMsg.type === "info" && { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }
          ]}>
            <MaterialCommunityIcons 
              name={
                feedbackMsg.type === "success" ? "checkbox-marked-circle-outline" : 
                feedbackMsg.type === "error" ? "alert-circle-outline" : "information-outline"
              } 
              size={18} 
              color={
                feedbackMsg.type === "success" ? "#2E7D32" : 
                feedbackMsg.type === "error" ? "#C62828" : colors.brand
              } 
            />
            <Text style={[
              styles.feedbackTxt,
              feedbackMsg.type === "success" && { color: "#2E7D32" },
              feedbackMsg.type === "error" && { color: "#C62828" },
              feedbackMsg.type === "info" && { color: colors.onSurfaceSecondary }
            ]}>
              {feedbackMsg.text}
            </Text>
          </View>
        )}

        {/* Buttons / Actions */}
        <View style={styles.btnSection}>
          {/* Check Verification Status */}
          <Pressable
            onPress={handleCheckVerification}
            disabled={checking}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: colors.brand },
              (pressed || checking) && { opacity: 0.9 }
            ]}
          >
            {checking ? (
              <ActivityIndicator color={colors.onBrandPrimary} />
            ) : (
              <>
                <MaterialCommunityIcons name="refresh" size={20} color={colors.onBrandPrimary} />
                <Text style={[styles.primaryBtnTxt, { color: colors.onBrandPrimary }]}>I've Verified My Email</Text>
              </>
            )}
          </Pressable>

          {/* Resend Verification */}
          <Pressable
            onPress={handleResendEmail}
            disabled={resending || cooldown > 0}
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: colors.border },
              (pressed || resending || cooldown > 0) && { backgroundColor: colors.surfaceSecondary }
            ]}
          >
            {resending ? (
              <ActivityIndicator color={colors.onSurface} />
            ) : (
              <Text style={[styles.secondaryBtnTxt, { color: cooldown > 0 ? colors.onSurfaceMuted : colors.onSurface }]}>
                {cooldown > 0 ? `Resend Code in ${cooldown}s` : "Resend Verification Email"}
              </Text>
            )}
          </Pressable>

          {/* Sign Out / Cancel */}
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && { opacity: 0.7 }
            ]}
          >
            <Text style={[styles.cancelBtnTxt, { color: colors.brand }]}>Use a different email address</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "center",
    marginTop: 40,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
  },
  desc: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 12,
  },
  emailTxt: {
    fontWeight: "700",
  },
  descSecondary: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  feedbackBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginVertical: 24,
  },
  feedbackTxt: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    flex: 1,
  },
  btnSection: {
    gap: 12,
    marginTop: 12,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnTxt: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnTxt: {
    fontSize: 15,
    fontWeight: "600",
  },
  cancelBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 12,
  },
  cancelBtnTxt: {
    fontSize: 14,
    fontWeight: "700",
  },
});
