import React from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import * as Haptics from "expo-haptics";

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const handlePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(route as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo and App Name */}
        <View style={styles.logoSection}>
          <Image 
            source={require("../../assets/images/icon.png")} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={[styles.appName, { color: colors.onSurface }]}>Islamic Hikmah</Text>
          <Text style={[styles.appSubtitle, { color: colors.brand }]}>Your Spiritual Companion</Text>
        </View>

        {/* Tagline */}
        <View style={styles.taglineSection}>
          <Text style={[styles.taglineText, { color: colors.onSurfaceSecondary }]}>
            Study the Noble Quran, daily goals, Hadith books, Mosque finder, and track your prayers seamlessly.
          </Text>
        </View>

        {/* Buttons Section */}
        <View style={styles.btnSection}>
          {/* Email Login */}
          <Pressable
            onPress={() => handlePress("/auth/login")}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: colors.brand },
              pressed && { opacity: 0.9 }
            ]}
          >
            <MaterialCommunityIcons name="email-outline" size={20} color={colors.onBrandPrimary} />
            <Text style={[styles.primaryBtnTxt, { color: colors.onBrandPrimary }]}>Sign In with Email</Text>
          </Pressable>

          {/* Create Account */}
          <Pressable
            onPress={() => handlePress("/auth/register")}
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: colors.border },
              pressed && { backgroundColor: colors.surfaceSecondary }
            ]}
          >
            <Text style={[styles.secondaryBtnTxt, { color: colors.onSurface }]}>Create Account</Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerTxt, { color: colors.onSurfaceMuted }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Social Sign-In */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              // Implement Google Login wrapper
              alert("Google Sign-In integration ready!");
            }}
            style={({ pressed }) => [
              styles.socialBtn,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              pressed && { opacity: 0.85 }
            ]}
          >
            <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
            <Text style={[styles.socialBtnTxt, { color: colors.onSurface }]}>Continue with Google</Text>
          </Pressable>

          {/* Guest login */}
          <Pressable
            onPress={() => handlePress("/(tabs)")}
            style={({ pressed }) => [
              styles.guestBtn,
              pressed && { opacity: 0.7 }
            ]}
          >
            <Text style={[styles.guestBtnTxt, { color: colors.brand }]}>Continue as Guest</Text>
            <MaterialCommunityIcons name="arrow-right" size={14} color={colors.brand} />
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
  logoSection: {
    alignItems: "center",
    marginTop: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
    borderRadius: 22,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  taglineSection: {
    marginVertical: 32,
    alignItems: "center",
  },
  taglineText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  btnSection: {
    gap: 12,
    marginBottom: 20,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  primaryBtnTxt: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  secondaryBtnTxt: {
    fontSize: 16,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerTxt: {
    fontSize: 12,
    fontWeight: "700",
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
  guestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 4,
    alignSelf: "center",
    padding: 8,
  },
  guestBtnTxt: {
    fontSize: 14,
    fontWeight: "700",
  },
});
