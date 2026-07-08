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

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { login } = useAuth();

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
      console.error("Login error details:", err);
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
            <Pressable 
              onPress={() => router.back()} 
              style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.onSurface} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Welcome Back</Text>
            <Text style={[styles.headerSubtitle, { color: colors.onSurfaceSecondary }]}>
              Sign in to resume your daily prayers and Quran studies.
            </Text>
          </View>

          {/* Form */}
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

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceSecondary }]}>Password</Text>
                <Pressable onPress={() => router.push("/auth/forgot-password")}>
                  <Text style={[styles.forgotLink, { color: colors.brand }]}>Forgot Password?</Text>
                </Pressable>
              </View>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.onSurfaceMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.onSurface }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.onSurfaceMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <MaterialCommunityIcons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.onSurfaceMuted} 
                  />
                </Pressable>
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: colors.brand },
                (pressed || loading) && { opacity: 0.9 }
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.onBrandPrimary} />
              ) : (
                <Text style={[styles.submitBtnTxt, { color: colors.onBrandPrimary }]}>Sign In</Text>
              )}
            </Pressable>
          </View>

          {/* Social Sign-In */}
          <View style={styles.socialSection}>
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerTxt, { color: colors.onSurfaceMuted }]}>OR CONTINUE WITH</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                alert("Google Sign-In integration ready!");
              }}
              style={({ pressed }) => [
                styles.socialBtn,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                pressed && { opacity: 0.85 }
              ]}
            >
              <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
              <Text style={[styles.socialBtnTxt, { color: colors.onSurface }]}>Google</Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerTxt, { color: colors.onSurfaceMuted }]}>
              Don't have an account?{" "}
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
