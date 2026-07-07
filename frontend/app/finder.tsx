import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList, Linking, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { resolveUserLocation } from "@/src/storage";

type MapPlace = {
  id: string;
  name: string;
  address: string;
  distance: string;
};

// High-fidelity local mocked results for realistic places (Palakkad / Coimbatore regions based on coordinates)
const MOCK_MOSQUES: MapPlace[] = [
  { id: "1", name: "Thajul Islam Sunnath Hanafi Jamath", address: "Palakkad Main Road", distance: "1.1 km" },
  { id: "2", name: "Thajul Islam Hanafi Masjid", address: "Palakkad, Kerala", distance: "1.2 km" },
  { id: "3", name: "Ahle Sunnath Jamath Thagni Masjid", address: "Palakkad Main Road", distance: "1.1 km" },
  { id: "4", name: "Hidhayathul Islam Masjid", address: "Coimbatore, Tamil Nadu", distance: "2.0 km" },
  { id: "5", name: "Masjidhul Jannah", address: "Coimbatore Road", distance: "2.2 km" },
  { id: "6", name: "மஸ்ஜித் மதனியா (Masjid Madania)", address: "Coimbatore 641001", distance: "2.6 km" },
  { id: "7", name: "Salafi Masjid", address: "Palakkad Bypass", distance: "2.6 km" },
  { id: "8", name: "Shafi Sunnath Jamath Masjith", address: "Kuniyamuthur, Coimbatore", distance: "2.7 km" },
  { id: "9", name: "Hanafi Sunth Jamath Mosque", address: "Coimbatore 641042", distance: "3.0 km" },
  { id: "10", name: "Thareekkathul Islam Shaffihiya Jamath", address: "Podanur, Coimbatore", distance: "3.7 km" },
];

const MOCK_HALAL: MapPlace[] = [
  { id: "1", name: "Al-Rehman Family Restaurant (Halal)", address: "Palakkad Bypass Road", distance: "0.8 km" },
  { id: "2", name: "Kabab Magic & Biryani", address: "Kuniyamuthur, Coimbatore", distance: "1.2 km" },
  { id: "3", name: "Tandoori Knights", address: "Palakkad Main Road", distance: "1.5 km" },
  { id: "4", name: "Madina Grill & Shawarma", address: "Coimbatore Junction", distance: "1.9 km" },
  { id: "5", name: "Rahmath Biryani Hotel", address: "Podanur Road", distance: "2.3 km" },
  { id: "6", name: "Zam Zam Arabic Restaurant", address: "Town Hall, Coimbatore", distance: "2.8 km" },
];

export default function FinderScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: "mosque" | "halal" }>();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);

  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [places, setPlaces] = useState<MapPlace[]>([]);

  const title = type === "halal" ? "Halal Food Finder" : "Mosque Finder";
  const icon = type === "halal" ? "food-fork-drink" : "mosque";

  useEffect(() => {
    (async () => {
      try {
        const loc = await resolveUserLocation();
        setCity(loc.city || "Nearby");
        
        // Select matching mocked dataset to show
        setPlaces(type === "halal" ? MOCK_HALAL : MOCK_MOSQUES);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [type]);

  const handleOpenPlace = (place: MapPlace) => {
    const query = encodeURIComponent(`${place.name} ${place.address}`);
    const mapsUrl = Platform.select({
      ios: `maps://0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`
    });
    Linking.openURL(mapsUrl);
  };

  const renderItem = ({ item }: { item: MapPlace }) => (
    <Pressable 
      onPress={() => handleOpenPlace(item)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surfaceSecondary, borderBottomColor: colors.border },
        pressed && { opacity: 0.8 }
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.brand + "18" }]}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.brand} />
      </View>
      
      <View style={{ flex: 1 }}>
        <Text style={[styles.placeName, { color: colors.onSurface }]}>{item.name}</Text>
        <Text style={[styles.placeAddress, { color: colors.onSurfaceMuted }]}>{item.address}</Text>
      </View>

      <View style={styles.distanceWrap}>
        <Text style={[styles.distanceText, { color: colors.brand }]}>{item.distance}</Text>
        <MaterialCommunityIcons name="navigation" size={14} color={colors.brand} style={{ marginTop: 2 }} />
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
          <Text style={{ fontSize: 11, color: colors.onSurfaceMuted, marginTop: 2 }}>📍 {city}</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: colors.onSurfaceMuted }}>No results found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  list: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.md,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  placeName: { fontSize: 15, fontWeight: "700" },
  placeAddress: { fontSize: 12, marginTop: 4 },
  distanceWrap: {
    alignItems: "center",
    gap: 4,
  },
  distanceText: { fontSize: 12, fontWeight: "800" },
});
