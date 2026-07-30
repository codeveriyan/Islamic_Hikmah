import { useCallback, useRef, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Platform, ListRenderItem, useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/src/AuthContext";
import { theme } from "@/src/theme";

const ONBOARDING_KEY = "hikmah:onboarding-done";

// ─── Slide data ───────────────────────────────────────────────────────────────
type Slide = {
  key: string;
  gradient: [string, string];
  accentColor: string;
  iconName: string;
  arabicText: string;
  title: string;
  subtitle: string;
  features?: { icon: string; label: string }[];
};

const SLIDES: Slide[] = [
  {
    key: "welcome",
    gradient: ["#061713", "#0B2416"],
    accentColor: "#00A884",
    iconName: "mosque",
    arabicText: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    title: "Welcome to Islamic Hikmah",
    subtitle:
      "Your complete Islamic companion — prayer times, Qur'an, Hadith, Seerah & Dhikr, all in one beautifully crafted app.",
    features: undefined,
  },
  {
    key: "features",
    gradient: ["#0B1D2E", "#0D2240"],
    accentColor: "#3B82F6",
    iconName: "star-crescent",
    arabicText: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    title: "Everything You Need",
    subtitle: "Built for Muslims who want to deepen their connection with Allah every single day.",
    features: [
      { icon: "mosque", label: "Prayer Times & Adhan" },
      { icon: "book-open-variant", label: "Al-Qur'an (Read & Listen)" },
      { icon: "book-open-page-variant", label: "14 Hadith Collections" },
      { icon: "compass", label: "Qibla & Mosque Finder" },
      { icon: "hands-pray", label: "Du'as & Adhkar Hub" },
      { icon: "star-crescent", label: "Seerah of the Prophet ﷺ" },
    ],
  },
  {
    key: "track",
    gradient: ["#1A0B2E", "#2D1045"],
    accentColor: "#A855F7",
    iconName: "chart-line",
    arabicText: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    title: "Track & Grow Every Day",
    subtitle: "Build lasting habits with daily goals, streak tracking, achievement badges, and weekly progress charts.",
    features: [
      { icon: "fire", label: "Daily Streak Tracker" },
      { icon: "target", label: "Daily Islamic Goals" },
      { icon: "trophy", label: "Achievement Badges" },
      { icon: "chart-bar", label: "Weekly Progress Chart" },
      { icon: "bell-ring", label: "Smart Reminders" },
      { icon: "heart", label: "Save Favourites" },
    ],
  },
  {
    key: "getstarted",
    gradient: ["#0A1628", "#0F2A4A"],
    accentColor: "#10B981",
    iconName: "heart",
    arabicText: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ",
    title: "Begin Your Journey",
    subtitle:
      "Create a free account to sync your progress across devices, unlock premium features, or continue as a guest.",
    features: undefined,
  },
];

// ─── Feature pill ─────────────────────────────────────────────────────────────
function FeaturePill({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View style={[fp.pill, { borderColor: color + "30" }]}>
      <View style={[fp.iconWrap, { backgroundColor: color + "20" }]}>
        <MaterialCommunityIcons name={icon as any} size={16} color={color} />
      </View>
      <Text style={fp.label}>{label}</Text>
    </View>
  );
}
const fp = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, width: "48%" },
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 12, color: "#fff", fontFamily: "Figtree_400Regular", fontWeight: "600", flex: 1 },
});

// ─── Single slide ─────────────────────────────────────────────────────────────
function SlideView({
  slide,
  index,
  scrollX,
  viewportWidth,
}: {
  slide: Slide;
  index: number;
  scrollX: SharedValue<number>;
  viewportWidth: number;
}) {
  const animStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * viewportWidth,
      index * viewportWidth,
      (index + 1) * viewportWidth,
    ];
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
    const scale = interpolate(scrollX.value, inputRange, [0.88, 1, 0.88], Extrapolation.CLAMP);
    const translateY = interpolate(scrollX.value, inputRange, [24, 0, 24], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }, { translateY }] };
  });

  return (
    <View style={[sv.slide, { width: viewportWidth }]}>
      <Animated.View style={[sv.content, animStyle]}>
        {/* Centre illustration */}
        <View style={[sv.iconRing, { borderColor: slide.accentColor + "30" }]}>
          <View style={[sv.iconInner, { borderColor: slide.accentColor + "55", backgroundColor: slide.accentColor + "12" }]}>
            <MaterialCommunityIcons name={slide.iconName as any} size={52} color={slide.accentColor} />
          </View>
        </View>

        {/* Arabic text */}
        <Text style={[sv.arabic, { color: slide.accentColor }]}>{slide.arabicText}</Text>

        {/* Title */}
        <Text style={sv.title}>{slide.title}</Text>
        <Text style={sv.subtitle}>{slide.subtitle}</Text>

        {/* Feature pills */}
        {slide.features && (
          <View style={sv.pillsGrid}>
            {slide.features.map((f) => (
              <FeaturePill key={f.label} icon={f.icon} label={f.label} color={slide.accentColor} />
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const sv = StyleSheet.create({
  slide: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  content: { alignItems: "center", width: "100%", maxWidth: 560 },
  iconRing: { width: 160, height: 160, borderRadius: 80, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", marginBottom: 28 },
  iconInner: { width: 110, height: 110, borderRadius: 55, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  arabic: { fontFamily: "NotoNaskhArabic", fontSize: 18, textAlign: "center", marginBottom: 16, opacity: 0.9 },
  title: { fontFamily: "Outfit_600SemiBold", fontSize: 26, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 12, lineHeight: 34 },
  subtitle: { fontSize: 15, color: "rgba(255,255,255,0.68)", fontFamily: "Figtree_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 28 },
  pillsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
});

// ─── Main Onboarding ──────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const { loginAsGuest } = useAuth();
  const { width: viewportWidth } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const markDone = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
  };

  const handleNext = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    }
  }, [currentIndex]);

  const handleSignUp = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await markDone();
    router.replace("/auth/welcome");
  }, []);

  const handleGuest = useCallback(async () => {
    Haptics.selectionAsync().catch(() => {});
    await markDone();
    if (loginAsGuest) await loginAsGuest();
    router.replace("/(tabs)");
  }, [loginAsGuest]);

  const handleSkip = useCallback(async () => {
    await markDone();
    router.replace("/auth/welcome");
  }, []);

  const currentSlide = SLIDES[currentIndex];

  const renderItem: ListRenderItem<Slide> = ({ item, index }) => (
    <SlideView
      slide={item}
      index={index}
      scrollX={scrollX}
      viewportWidth={viewportWidth}
    />
  );

  return (
    <View style={s.flex}>
      {/* Gradient background (changes per slide) */}
      <LinearGradient
        colors={currentSlide.gradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        {/* Skip button (top right) */}
        {currentIndex < SLIDES.length - 1 && (
          <Pressable
            onPress={handleSkip}
            style={s.skipBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={s.skipTxt}>Skip</Text>
          </Pressable>
        )}

        {/* Slides */}
        <FlatList
          ref={flatRef}
          data={SLIDES}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          getItemLayout={(_, index) => ({
            length: viewportWidth,
            offset: viewportWidth * index,
            index,
          })}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={s.flatList}
          onScroll={(e) => {
            scrollX.value = e.nativeEvent.contentOffset.x;
          }}
          scrollEventThrottle={16}
        />

        {/* Bottom bar */}
        <View style={s.bottom}>
          {/* Dot pagination */}
          <View style={s.dots}>
            {SLIDES.map((_, idx) => {
              const isActive = idx === currentIndex;
              return (
                <View
                  key={idx}
                  style={[
                    s.dot,
                    {
                      width: isActive ? 24 : 8,
                      backgroundColor: isActive ? currentSlide.accentColor : "rgba(255,255,255,0.3)",
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* CTA buttons */}
          {currentIndex < SLIDES.length - 1 ? (
            <Pressable
              onPress={handleNext}
              accessibilityRole="button"
              accessibilityLabel={`Continue to onboarding step ${currentIndex + 2} of ${SLIDES.length}`}
              style={[s.primaryBtn, { backgroundColor: currentSlide.accentColor }]}
            >
              <Text style={s.primaryBtnTxt}>Continue</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
            </Pressable>
          ) : (
            <View style={s.finalBtns}>
              <Pressable
                onPress={handleSignUp}
                accessibilityRole="button"
                accessibilityLabel="Create a free account"
                style={[s.primaryBtn, { backgroundColor: currentSlide.accentColor, flex: 1 }]}
              >
                <Text style={s.primaryBtnTxt}>Create Free Account</Text>
              </Pressable>
              <Pressable
                onPress={handleGuest}
                accessibilityRole="button"
                accessibilityLabel="Continue as guest"
                accessibilityHint="Guest progress stays on this device"
                style={[s.ghostBtn, { borderColor: "rgba(255,255,255,0.25)", flex: 1 }]}
              >
                <Text style={s.ghostBtnTxt}>Continue as Guest</Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1 },
  skipBtn: { position: "absolute", top: Platform.OS === "ios" ? 56 : 16, right: 20, zIndex: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radius.pill, backgroundColor: "rgba(255,255,255,0.12)" },
  skipTxt: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "Figtree_400Regular", fontWeight: "600" },
  flatList: { flex: 1 },
  bottom: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 12 : 24,
    gap: 20,
  },
  dots: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  dot: { height: 8, borderRadius: 4 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: theme.radius.pill },
  primaryBtnTxt: { fontSize: 16, fontFamily: "Figtree_400Regular", fontWeight: "700", color: "#fff" },
  finalBtns: { gap: 10 },
  ghostBtn: { paddingVertical: 16, borderRadius: theme.radius.pill, borderWidth: 1, alignItems: "center" },
  ghostBtnTxt: { fontSize: 15, fontFamily: "Figtree_400Regular", fontWeight: "600", color: "rgba(255,255,255,0.8)" },
});
