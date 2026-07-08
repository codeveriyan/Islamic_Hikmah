import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  ActivityIndicator, 
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
                <Pressable
                  onPress={() => router.replace("/auth/login")}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { backgroundColor: colors.brand, marginTop: 24 },
                    pressed && { opacity: 0.9 }
                  ]}
                >
                  <Text style={[styles.primaryBtnTxt, { color: colors.onBrandPrimary }]}>Back to Login</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.form}>
                {errorMsg && (
                  <View style={[styles.errorBox, { backgroundColor: "#FFEBEE" }]}>
                    <MaterialCommunityIcons name="alert-circle" size={18} color="#D32F2F" />
                    <Text style={styles.errorTxt}>{errorMsg}</Text>
                  </View>
                )}

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.onSurfaceSecondary }]}>Email Address</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <MaterialCommunityIcons name="email-outline" size={20} color={colors.onSurfaceMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.onSurface }]}
                      placeholder="Enter your email"
                      placeholderTextColor={colors.onSurfaceMuted}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Submit Button */}
                <Pressable
                  onPress={handleReset}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { backgroundColor: colors.brand, marginTop: 12 },
                    (pressed || loading) && { opacity: 0.9 }
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.onBrandPrimary} />
                  ) : (
                    <Text style={[styles.primaryBtnTxt, { color: colors.onBrandPrimary }]}>Send Reset Link</Text>
                  )}
                </Pressable>
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
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  errorTxt: {
    color: "#D32F2F",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    width: "100%",
  },
  primaryBtnTxt: {
    fontSize: 16,
    fontWeight: "700",
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
