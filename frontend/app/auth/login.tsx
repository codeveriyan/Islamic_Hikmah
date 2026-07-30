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
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import * as Haptics from "expo-haptics";
import {
  AppButton,
  AppIconButton,
  AppTextInput,
} from "@/src/components/ui";
import { AppStatusBanner } from "@/src/components/states";

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Success: AuthContext redirection logic will handle route navigation
    } catch (err: any) {
      if (__DEV__) console.error("Login error details:", err);
      let msg = err.message || "Invalid email or password.";
      if (err.code === "auth/user-not-found") {
        msg = "No user found with this email.";
      } else if (err.code === "auth/wrong-password") {
        msg = "Incorrect password.";
      } else if (err.code === "auth/invalid-credential") {
        msg = "Invalid email or password credentials.";
      } else if (err.code === "auth/operation-not-allowed") {
        msg = "Email/Password sign-in method is disabled. Please enable it in the Firebase Console under Authentication > Sign-in method.";
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
            <AppIconButton
              accessibilityLabel="Go back"
              icon="arrow-left"
              onPress={() => router.back()}
              style={styles.backBtn}
              variant="tonal"
            />
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Welcome Back</Text>
            <Text style={[styles.headerSubtitle, { color: colors.onSurfaceSecondary }]}>
              Sign in to resume your daily prayers and Quran studies.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {errorMsg ? (
              <AppStatusBanner
                kind="error"
                message={errorMsg}
                onDismiss={() => setErrorMsg(null)}
              />
            ) : null}

            {/* Email Input */}
            <AppTextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              label="Email address"
              leadingIcon="email-outline"
              onChangeText={setEmail}
              placeholder="Enter your email"
              value={email}
            />

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceSecondary }]}>Password</Text>
                <Pressable onPress={() => router.push("/auth/forgot-password")}>
                  <Text style={[styles.forgotLink, { color: colors.brand }]}>Forgot Password?</Text>
                </Pressable>
              </View>
              <AppTextInput
                autoCapitalize="none"
                autoCorrect={false}
                leadingIcon="lock-outline"
                onChangeText={setPassword}
                onTrailingIconPress={() => setShowPassword(!showPassword)}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                trailingIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                trailingIconAccessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
                value={password}
              />
            </View>

            {/* Submit Button */}
            <AppButton
              fullWidth
              label="Sign in"
              loading={loading}
              onPress={handleLogin}
            />
          </View>

          {/* Social Sign-In */}
          <View style={styles.socialSection}>
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerTxt, { color: colors.onSurfaceMuted }]}>OR CONTINUE WITH</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <AppButton
              fullWidth
              icon="google"
              label="Google"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                loginWithGoogle();
              }}
              variant="outlined"
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerTxt, { color: colors.onSurfaceMuted }]}>
              {"Don't have an account? "}
            </Text>
            <Pressable onPress={() => router.push("/auth/register")}>
              <Text style={[styles.footerLink, { color: colors.brand }]}>Sign Up</Text>
            </Pressable>
          </View>
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
  form: {
    gap: 16,
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
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotLink: {
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
  eyeBtn: {
    padding: 6,
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  submitBtnTxt: {
    fontSize: 16,
    fontWeight: "700",
  },
  socialSection: {
    marginTop: 20,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerTxt: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  socialBtnTxt: {
    fontSize: 16,
    fontWeight: "600",
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
