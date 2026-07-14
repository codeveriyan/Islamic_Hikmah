import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/src/AuthContext";

// Multicolor Google G logo in SVG
const GoogleGIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 10 }}>
    <Path
      fill="#EA4335"
      d="M12 5.04c1.67 0 3.18.58 4.36 1.71l3.26-3.26C17.65 1.58 14.99 1 12 1 7.37 1 3.4 3.65 1.48 7.51l3.86 3C6.31 7.6 8.94 5.04 12 5.04z"
    />
    <Path
      fill="#4285F4"
      d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.43-4.94 3.43-8.69z"
    />
    <Path
      fill="#FBBC05"
      d="M5.34 14.51c-.24-.72-.38-1.49-.38-2.51s.14-1.79.38-2.51V6.51H1.48C.67 8.14.2 10 .2 12s.47 3.86 1.28 5.49l3.86-2.98z"
    />
    <Path
      fill="#34A853"
      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.11-3.96 1.11-3.06 0-5.69-2.56-6.66-5.47l-3.86 2.98C3.4 20.35 7.37 23 12 23z"
    />
  </Svg>
);

const HandsIllustration = () => {
  return (
    <View style={styles.illustrationWrapper}>
      {/* Soft background clouds */}
      <View style={[styles.cloud, { top: 15, left: 20, width: 80, height: 32 }]} />
      <View style={[styles.cloud, { top: 35, right: 30, width: 100, height: 28 }]} />

      {/* Left Hand holding blue mosque circle */}
      <View style={styles.leftHandContainer}>
        {/* Left Arm */}
        <View style={styles.leftArm} />
        {/* Left Palm */}
        <View style={styles.leftPalm} />
        {/* Blue Circle with Mosque inside */}
        <View style={styles.mosqueCircle}>
          <View style={styles.mosqueBase} />
          <View style={styles.mosqueDome} />
          <View style={styles.mosqueArch} />
          <MaterialCommunityIcons name="moon-waning-crescent" size={18} color="#FFFFFF" style={styles.moon} />
        </View>
      </View>

      {/* Right Hand holding Tasbih beads */}
      <View style={styles.rightHandContainer}>
        {/* Right Arm */}
        <View style={styles.rightArm} />
        {/* Right Palm */}
        <View style={styles.rightPalm} />
        {/* Beads/Tasbih loop */}
        <View style={styles.tasbihContainer}>
          <View style={styles.tasbihLoop} />
          <View style={styles.tasbihTassel} />
          <View style={styles.tasbihBeadEnd} />
        </View>
      </View>
    </View>
  );
};

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { loginAsGuest, loginWithGoogle, loading } = useAuth();

  const handleEmailPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push("/auth/login");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Illustration */}
        <HandsIllustration />

        {/* Messaging Text */}
        <View style={styles.textSection}>
          <Text style={[styles.heading, { color: colors.onSurface }]}>
            Unlock the true potential of Athan App
          </Text>
          <Text style={[styles.subheading, { color: colors.onSurfaceMuted }]}>
            Keep track of your prayers, view prayer performance, save your bookmarks and more.
          </Text>
        </View>

        {/* Buttons List */}
        <View style={styles.btnSection}>
          
          {/* Continue with Google */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              loginWithGoogle();
            }}
            disabled={loading}
            style={({ pressed }) => [
              styles.googleBtn,
              { borderColor: colors.border },
              pressed && { backgroundColor: colors.surfaceSecondary }
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.onSurface} />
            ) : (
              <>
                <GoogleGIcon />
                <Text style={[styles.googleBtnText, { color: colors.onSurface }]}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {/* Continue with Email */}
          <Pressable
            onPress={handleEmailPress}
            disabled={loading}
            style={({ pressed }) => [
              styles.emailBtn,
              { backgroundColor: colors.brand },
              pressed && { opacity: 0.9 }
            ]}
          >
            <MaterialCommunityIcons name="email" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
            <Text style={styles.emailBtnText}>Continue with Email</Text>
          </Pressable>

          {/* Will do it later */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              loginAsGuest();
            }}
            disabled={loading}
            style={({ pressed }) => [
              styles.laterBtn,
              pressed && { opacity: 0.7 }
            ]}
          >
            <Text style={[styles.laterText, { color: colors.onSurface }]}>Will do it later</Text>
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
    paddingVertical: 20,
    justifyContent: "space-between",
  },
  illustrationWrapper: {
    width: "100%",
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginTop: 20,
    position: "relative",
  },
  cloud: {
    position: "absolute",
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    opacity: 0.8,
  },
  leftHandContainer: {
    position: "absolute",
    left: -20,
    top: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  leftArm: {
    width: 100,
    height: 50,
    backgroundColor: "#FCA5A5",
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
  },
  leftPalm: {
    width: 40,
    height: 40,
    backgroundColor: "#FCA5A5",
    borderRadius: 20,
    marginLeft: -15,
    zIndex: 2,
    transform: [{ rotate: "15deg" }],
  },
  mosqueCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#3B82F6",
    marginLeft: -40,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mosqueBase: {
    width: 40,
    height: 40,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    bottom: -8,
    position: "absolute",
  },
  mosqueDome: {
    width: 26,
    height: 35,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    bottom: -8,
    position: "absolute",
    zIndex: 2,
  },
  mosqueArch: {
    width: 12,
    height: 16,
    backgroundColor: "#3B82F6",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    bottom: -8,
    position: "absolute",
    zIndex: 3,
  },
  moon: {
    position: "absolute",
    top: 15,
    right: 18,
    transform: [{ rotate: "-35deg" }],
  },
  rightHandContainer: {
    position: "absolute",
    right: -25,
    top: 40,
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  rightArm: {
    width: 100,
    height: 50,
    backgroundColor: "#FCA5A5",
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
  },
  rightPalm: {
    width: 40,
    height: 40,
    backgroundColor: "#FCA5A5",
    borderRadius: 20,
    marginRight: -15,
    zIndex: 2,
    transform: [{ rotate: "-15deg" }],
  },
  tasbihContainer: {
    marginRight: -25,
    zIndex: 1,
    alignItems: "center",
  },
  tasbihLoop: {
    width: 32,
    height: 60,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#60A5FA",
    borderStyle: "dashed",
  },
  tasbihTassel: {
    width: 4,
    height: 12,
    backgroundColor: "#2563EB",
    marginTop: -2,
  },
  tasbihBeadEnd: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  textSection: {
    alignItems: "center",
    paddingHorizontal: 16,
    marginVertical: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 12,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  btnSection: {
    gap: 14,
    width: "100%",
    paddingBottom: 10,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  emailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
  },
  emailBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  laterBtn: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 8,
  },
  laterText: {
    fontSize: 15,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
