import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import * as Haptics from "expo-haptics";
import { AppButton, AppTextInput } from "@/src/components/ui";
import { AppStatusBanner } from "@/src/components/states";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { sendResetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await sendResetPassword(email);
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err: any) {
      let msg = "Failed to send reset email. Please verify your address.";
      if (err.code === "auth/user-not-found") {
        msg = "No user found with this email.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Invalid email format.";
      }
      setErrorMsg(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable 
              onPress={() => router.back()} 
              style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.onSurface} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Forgot Password</Text>
            <Text style={[styles.headerSubtitle, { color: colors.onSurfaceSecondary }]}>
              Enter your registered email below, and we will send you a password reset link.
            </Text>
          </View>

          {/* Form / Content */}
          <View style={styles.content}>
            {success ? (
              <View style={[styles.successContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <View style={[styles.successIconWrap, { backgroundColor: colors.brand + "15" }]}>
                  <MaterialCommunityIcons name="email-check-outline" size={40} color={colors.brand} />
                </View>
                <Text style={[styles.successTitle, { color: colors.onSurface }]}>Reset Link Sent!</Text>
                <Text style={[styles.successDesc, { color: colors.onSurfaceSecondary }]}>
                  Please check your inbox at <Text style={{ fontWeight: "700" }}>{email}</Text> and follow the link to reset your password.
                </Text>
                <AppButton
                  fullWidth
                  label="Back to Login"
                  onPress={() => router.replace("/auth/login")}
                  style={{ marginTop: 24 }}
                />
              </View>
            ) : (
              <View style={styles.form}>
                {errorMsg && (
                  <AppStatusBanner kind="error" message={errorMsg} />
                )}

                {/* Email Input */}
                <AppTextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  label="Email Address"
                  leadingIcon="email-outline"
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  value={email}
                />

                {/* Submit Button */}
                <AppButton
                  fullWidth
                  label="Send Reset Link"
                  loading={loading}
                  onPress={handleReset}
                  style={{ marginTop: 12 }}
                />
              </View>
            )}
          </View>

          {/* Footer */}
          {!success && (
            <View style={styles.footer}>
              <Text style={[styles.footerTxt, { color: colors.onSurfaceMuted }]}>
                Remember your password?{" "}
              </Text>
              <Pressable onPress={() => router.push("/auth/login")}>
                <Text style={[styles.footerLink, { color: colors.brand }]}>Sign In</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: "space-between",
  },
  header: {
    marginTop: 10,
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  form: {
    gap: 16,
  },
  successContainer: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  successDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 10,
  },
  footerTxt: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});
