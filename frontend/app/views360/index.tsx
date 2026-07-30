import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import { HOLY_PLACES_360, HolyPlace360 } from "@/src/data/views360Data";
import { PANORAMA_BASE64_MAP } from "@/src/data/views360Assets";

type CityFilter = "All" | "Makkah" | "Madinah" | "Jerusalem";
const CITIES: CityFilter[] = ["All", "Makkah", "Madinah", "Jerusalem"];

export default function Views360CatalogScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [selectedCity, setSelectedCity] = useState<CityFilter>("All");

  const filteredPlaces = useMemo(() => {
    if (selectedCity === "All") return HOLY_PLACES_360;
    return HOLY_PLACES_360.filter((p) => p.city === selectedCity);
  }, [selectedCity]);

  const handleSelectPlace = (place: HolyPlace360) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(`/views360/${place.id}` as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceSecondary || "#0B141A" }]} edges={["top", "bottom"]}>
      {/* Top Navigation Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border || "#222E35" }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          hitSlop={12}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>360° Views</Text>
          <Text style={[styles.headerSubtitle, { color: colors.onSurfaceMuted || "#8696A0" }]}>
            Virtual tours of Islamic holy places
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          {CITIES.map((city) => {
            const isSelected = selectedCity === city;
            return (
              <Pressable
                key={city}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setSelectedCity(city);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected
                      ? colors.brand || "#00A884"
                      : colors.surface || "#111B21",
                    borderColor: isSelected
                      ? colors.brand || "#00A884"
                      : colors.border || "#222E35",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected
                        ? "#FFFFFF"
                        : colors.onSurface || "#E9EDEF",
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {city === "All" ? "All Sacred Sites" : city}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List of Sacred Places */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredPlaces.map((place) => (
          <Pressable
            key={place.id}
            onPress={() => handleSelectPlace(place)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: colors.surface || "#111B21", borderColor: colors.border || "#222E35" },
              pressed && { transform: [{ scale: 0.985 }], opacity: 0.92 },
            ]}
          >
            {/* Image Preview with Gradient & Badge Overlay */}
            <View style={styles.imageContainer}>
              <ExpoImage
                source={{ uri: PANORAMA_BASE64_MAP[place.assetKey] || place.thumbnailUrl }}
                style={styles.cardImage}
                contentFit="cover"
                transition={300}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.85)"]}
                style={styles.imageGradient}
              />

              {/* 360 Badge */}
              <View style={styles.badgePill}>
                <MaterialCommunityIcons name="compass-outline" size={16} color="#FFFFFF" />
                <Text style={styles.badgeText}>{place.badge || "360°"}</Text>
              </View>

              {/* City Tag */}
              <View style={styles.cityTag}>
                <MaterialCommunityIcons name="map-marker" size={13} color="#F59E0B" />
                <Text style={styles.cityTagText}>{place.city}</Text>
              </View>
            </View>

            {/* Card Content Details */}
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: colors.onSurface || "#FFFFFF" }]}>
                {place.title}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.warning || "#F59E0B" }]}>
                {place.subtitle}
              </Text>
              <Text
                style={[styles.cardDescription, { color: colors.onSurfaceMuted || "#8696A0" }]}
                numberOfLines={2}
              >
                {place.description}
              </Text>

              {/* Explore Button */}
              <View style={styles.cardFooter}>
                <View style={styles.exploreBtn}>
                  <MaterialCommunityIcons name="eye-outline" size={18} color="#F59E0B" />
                  <Text style={styles.exploreBtnText}>Explore in 360°</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  filterContainer: {
    paddingVertical: 12,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    height: 180,
    width: "100%",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
  },
  badgePill: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  cityTag: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cityTagText: {
    color: "#F3F4F6",
    fontSize: 12,
    fontWeight: "600",
  },
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(217, 119, 6, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exploreBtnText: {
    color: "#D97706",
    fontSize: 13,
    fontWeight: "700",
  },
});
