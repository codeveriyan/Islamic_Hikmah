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
  AppCheckbox,
  AppIconButton,
  AppTextInput,
} from "@/src/components/ui";
import { AppStatusBanner } from "@/src/components/states";

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (val: string) => {
    const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return reg.test(val);
  };

  const handleRegister = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!validateEmail(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (!acceptTerms) {
      setErrorMsg("You must accept the Terms & Conditions.");
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password);
      // Automatically triggers navigation to verify-email via AuthContext protection
    } catch (err: any) {
      console.error("Registration error details:", err);
      let msg = err.message || "An error occurred during registration. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        msg = "This email is already in use by another account.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Invalid email format.";
      } else if (err.code === "auth/weak-password") {
        msg = "The password is too weak.";
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
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Create Account</Text>
            <Text style={[styles.headerSubtitle, { color: colors.onSurfaceSecondary }]}>
              Join Islamic Hikmah and start tracking your goals.
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

            {/* Name Input */}
            <AppTextInput
              autoCapitalize="words"
              label="Full name"
              leadingIcon="account-outline"
              onChangeText={setName}
              placeholder="Enter your full name"
              value={name}
            />

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
            <AppTextInput
              autoCapitalize="none"
              autoCorrect={false}
              helperText="Use at least six characters."
              label="Password"
              leadingIcon="lock-outline"
              onChangeText={setPassword}
              onTrailingIconPress={() => setShowPassword(!showPassword)}
              placeholder="Create a password"
              secureTextEntry={!showPassword}
              trailingIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              trailingIconAccessibilityLabel={
                showPassword ? "Hide password" : "Show password"
              }
              value={password}
            />

            {/* Confirm Password */}
            <AppTextInput
              autoCapitalize="none"
              autoCorrect={false}
              errorMessage={
                confirmPassword && password !== confirmPassword
                  ? "Passwords do not match."
                  : undefined
              }
              label="Confirm password"
              leadingIcon="lock-check-outline"
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              secureTextEntry={!showPassword}
              value={confirmPassword}
            />

            {/* Terms and Conditions checkbox */}
            <AppCheckbox
              accessibilityLabel="Accept Terms and Conditions and Privacy Policy"
              checked={acceptTerms}
              label={
                <Text style={[styles.termsTxt, { color: colors.onSurfaceSecondary }]}>
                  I accept the <Text style={{ color: colors.brand, fontWeight: "600" }}>Terms & Conditions</Text> and <Text style={{ color: colors.brand, fontWeight: "600" }}>Privacy Policy</Text>
                </Text>
              }
              onValueChange={(checked) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setAcceptTerms(checked);
              }}
            />

            {/* Submit Button */}
            <AppButton
              fullWidth
              label="Sign up"
              loading={loading}
              onPress={handleRegister}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerTxt, { color: colors.onSurfaceMuted }]}>
              Already have an account?{" "}
            </Text>
            <Pressable onPress={() => router.push("/auth/login")}>
              <Text style={[styles.footerLink, { color: colors.brand }]}>Sign In</Text>
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
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 10,
    paddingRight: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  termsTxt: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  submitBtnTxt: {
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
