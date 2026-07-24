import { useCallback, useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList, Linking, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { resolveUserLocation } from "@/src/storage";



let WebView: any;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

type MapPlace = {
  id: string;
  name: string;
  address: string;
  distance: string;
  lat: number;
  lng: number;
};

// ─── HIGH-FIDELITY MOCK FALLBACKS ───
const MOCK_MOSQUES: MapPlace[] = [
  { id: "m1", name: "Chinna Palli", address: "Kuniyamuthur, Coimbatore", distance: "1.0 km", lat: 10.9790, lng: 76.9450 },
  { id: "m2", name: "Masjidur", address: "Podanur, Coimbatore", distance: "1.2 km", lat: 10.9630, lng: 76.9620 },
  { id: "m3", name: "Masjid maalikul mulk (JAQH)", address: "Easwar Nagar, Coimbatore", distance: "1.5 km", lat: 10.9580, lng: 76.9720 },
  { id: "m4", name: "Masjide Noorul Islam", address: "Podanur Main Road, Coimbatore", distance: "1.6 km", lat: 10.9660, lng: 76.9650 },
  { id: "m5", name: "Jamathul Muthakeem Shafiayya Jamath", address: "Kuniyamuthur, Coimbatore", distance: "1.7 km", lat: 10.9760, lng: 76.9410 },
  { id: "m6", name: "Masjid ul ihsaan", address: "Cheran Nagar, Coimbatore", distance: "1.9 km", lat: 10.9520, lng: 76.9780 },
  { id: "m7", name: "Iqlas Mosque", address: "Kuniyamuthur, Coimbatore", distance: "2.0 km", lat: 10.9820, lng: 76.9490 },
  { id: "m8", name: "Masjid-e-Madeenah Dakhni Sunnath", address: "Podanur, Coimbatore", distance: "2.1 km", lat: 10.9610, lng: 76.9600 },
  { id: "m9", name: "Tajul Islam Hanafi Sunnah Jamath", address: "Kuniyamuthur, Coimbatore", distance: "2.2 km", lat: 10.9770, lng: 76.9400 },
  { id: "m10", name: "Hedayadul Islam Kabarstan Masjid", address: "Kuniyamuthur, Coimbatore", distance: "2.4 km", lat: 10.9750, lng: 76.9380 },
  { id: "m11", name: "Thajul Islam Sunnath Hanafi Jamath", address: "Palakkad Main Road", distance: "38.5 km", lat: 10.7867, lng: 76.6548 },
  { id: "m12", name: "Hidhayathul Islam Masjid", address: "Coimbatore, Tamil Nadu", distance: "5.0 km", lat: 11.0020, lng: 76.9600 },
];

const MOCK_HALAL: MapPlace[] = [
  { id: "f1", name: "Rahmath Biryani Hotel", address: "Podanur Road", distance: "1.7 km", lat: 10.9620, lng: 76.9690 },
  { id: "f2", name: "Kabab Magic & Biryani", address: "Kuniyamuthur, Coimbatore", distance: "3.1 km", lat: 10.9790, lng: 76.9410 },
  { id: "f3", name: "Madina Grill & Shawarma", address: "Coimbatore Junction", distance: "6.4 km", lat: 11.0120, lng: 76.9620 },
  { id: "f4", name: "Zam Zam Arabic Restaurant", address: "Town Hall, Coimbatore", distance: "6.7 km", lat: 11.0150, lng: 76.9590 },
  { id: "f5", name: "Tandoori Knights", address: "Palakkad Main Road", distance: "37.5 km", lat: 10.7840, lng: 76.6590 },
  { id: "f6", name: "Al-Rehman Family Restaurant (Halal)", address: "Palakkad Bypass Road", distance: "38.5 km", lat: 10.7960, lng: 76.6420 },
  { id: "f7", name: "Al-MAJLIS Kudil Restaurant", address: "Podanur, Coimbatore", distance: "1.9 km", lat: 10.9650, lng: 76.9680 },
  { id: "f8", name: "Street Arabiya Podanur", address: "Podanur, Coimbatore", distance: "2.0 km", lat: 10.9640, lng: 76.9710 },
  { id: "f9", name: "Halaal Foods", address: "Kuniyamuthur, Coimbatore", distance: "2.3 km", lat: 10.9850, lng: 76.9460 },
];

const MOCK_BUTCHERS: MapPlace[] = [
  { id: "b1", name: "HALAL CHICKEN Center", address: "Easwar Nagar, Podanur, Coimbatore", distance: "1.4 km", lat: 10.9550, lng: 76.9750 },
  { id: "b2", name: "Zabiha Halal Meat Shop", address: "Kuniyamuthur, Coimbatore", distance: "1.8 km", lat: 10.9800, lng: 76.9430 },
  { id: "b3", name: "Fresh Halal Mutton & Beef Stall", address: "Podanur Main Road, Coimbatore", distance: "2.0 km", lat: 10.9630, lng: 76.9660 },
  { id: "b4", name: "Easwar Nagar Halal Poultry Farm", address: "Easwar Nagar, Coimbatore", distance: "2.2 km", lat: 10.9590, lng: 76.9710 },
  { id: "b5", name: "Al Halali Meat Shop", address: "Kuniyamuthur, Coimbatore", distance: "2.5 km", lat: 10.9810, lng: 76.9440 },
];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

function distanceInKm(distance: string): number {
  const value = parseFloat(distance);
  return distance.endsWith(" m") ? value / 1000 : value;
}

export default function FinderScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: "mosque" | "halal" }>();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);

  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [isMapView, setIsMapView] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [halalSubTab, setHalalSubTab] = useState<"food" | "butcher">("food");

  const title = type === "halal"
    ? (halalSubTab === "food" ? "Halal Food Finder" : "Halal Meat Shop Finder")
    : "Masjid Finder";

  const iconName = type === "halal"
    ? (halalSubTab === "food" ? "food-fork-drink" : "store-outline")
    : "mosque";

  const fetchPlaces = useCallback(async (loc: { lat: number; lon: number; city?: string }) => {
    setLoading(true);

    let queryTerm: string;
    if (type === "mosque") {
      queryTerm = "mosque OR masjid";
    } else if (halalSubTab === "food") {
      queryTerm = "halal restaurant OR halal food";
    } else {
      queryTerm = "halal butcher OR halal meat OR chicken stall OR mutton stall";
    }

    const delta = 0.15;
    const viewbox = `${loc.lon - delta},${loc.lat + delta},${loc.lon + delta},${loc.lat - delta}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryTerm)}&bounded=1&viewbox=${viewbox}&addressdetails=1`;

    let fetchedData: any[] = [];
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Islamic_Hikmah_App/1.0',
          'Accept-Language': 'en'
        }
      });
      if (!res.ok) throw new Error(`Place search failed (${res.status})`);
      fetchedData = await res.json();
    } catch (fetchErr) {
      console.warn("Nominatim fetch failed, using fallback:", fetchErr);
    }

    const restaurantKeywords = [
      "restaurant", "hotel", "biryani", "grill", "shawarma", "kudil", "arabiya",
      "catering", "kitchen", "cafe", "bistro", "dhaba", "food", "cookhouse", "eatery",
      "canteen", "family dining", "diner", "mess", "bhavan", "palace"
    ];

    if (Array.isArray(fetchedData) && fetchedData.length > 0) {
      let parsed = fetchedData.map((item: any, index: number) => {
        const name = item.name || item.display_name.split(",")[0] || (type === "halal" ? "Halal Place" : "Mosque");
        let address = item.display_name;
        if (address.startsWith(name + ",")) {
          address = address.substring(name.length + 1).trim();
        }
        const itemLat = parseFloat(item.lat);
        const itemLng = parseFloat(item.lon);
        return {
          id: item.place_id?.toString() || index.toString(),
          name,
          address,
          distance: getDistance(loc.lat, loc.lon, itemLat, itemLng),
          lat: itemLat,
          lng: itemLng
        };
      });

      // Strict filter for Meat Shops tab: eliminate restaurants!
      if (type === "halal" && halalSubTab === "butcher") {
        parsed = parsed.filter(item => {
          const lowerName = item.name.toLowerCase();
          return !restaurantKeywords.some(kw => lowerName.includes(kw));
        });
      }

      // If butcher results are few or empty after filtering out restaurants, append genuine mock butchers
      if (type === "halal" && halalSubTab === "butcher" && parsed.length < 3) {
        const mockFormatted = MOCK_BUTCHERS.map(place => ({
          ...place,
          distance: getDistance(loc.lat, loc.lon, place.lat, place.lng)
        }));
        const existingNames = new Set(parsed.map(p => p.name.toLowerCase()));
        for (const mb of mockFormatted) {
          if (!existingNames.has(mb.name.toLowerCase())) {
            parsed.push(mb);
          }
        }
      }

      // Sort by distance
      parsed.sort((a, b) => distanceInKm(a.distance) - distanceInKm(b.distance));
      setPlaces(parsed);
    } else {
      const fallback = type === "mosque" ? MOCK_MOSQUES : halalSubTab === "food" ? MOCK_HALAL : MOCK_BUTCHERS;
      setPlaces(fallback
        .map(place => ({ ...place, distance: getDistance(loc.lat, loc.lon, place.lat, place.lng) }))
        .sort((a, b) => distanceInKm(a.distance) - distanceInKm(b.distance)));
    }

    setLoading(false);
  }, [type, halalSubTab]);

  useEffect(() => {
    (async () => {
      try {
        const loc = await resolveUserLocation({ preferCurrent: true, requireCurrent: true });
        setCity(loc.city || "Nearby");
        setUserCoords({ lat: loc.lat, lon: loc.lon });
        await fetchPlaces({ lat: loc.lat, lon: loc.lon, city: loc.city });
      } catch (e) {
        console.error(e);
        setCity("Nearby");
        setPlaces(type === "mosque" ? MOCK_MOSQUES : halalSubTab === "food" ? MOCK_HALAL : MOCK_BUTCHERS);
        setLoading(false);
      }
    })();
  }, [fetchPlaces]);

  const handleOpenPlace = (place: MapPlace) => {
    const query = encodeURIComponent(`${place.name} ${place.address}`);
    const mapsUrl = Platform.select({
      ios: `maps://0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`
    });
    if (mapsUrl) {
      Linking.openURL(mapsUrl);
    }
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
        <MaterialCommunityIcons name={iconName} size={22} color={colors.brand} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.placeName, { color: colors.onSurface }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.placeAddress, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
          {item.address}
        </Text>
      </View>

      <View style={styles.distanceWrap}>
        <Text style={[styles.distanceText, { color: colors.brand }]}>{item.distance}</Text>
        <MaterialCommunityIcons name="navigation" size={14} color={colors.brand} style={{ marginTop: 2 }} />
      </View>
    </Pressable>
  );

  // Google Maps Embed URL
  const googleMapsUrl = useMemo(() => {
    if (!userCoords) return "";
    let query = "mosque+OR+masjid";
    if (type === "halal") {
      query = halalSubTab === "food" ? "halal+restaurant+OR+halal+food" : "halal+butcher+OR+halal+meat";
    }
    return `https://maps.google.com/maps?q=${query}&ll=${userCoords.lat},${userCoords.lon}&z=14&output=embed`;
  }, [userCoords, type, halalSubTab]);

  const openMapSearch = () => {
    const query = type === "mosque" ? "mosques near me" : halalSubTab === "food" ? "halal restaurants near me" : "halal meat shops near me";
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`).catch(() => {});
  };

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
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Pressable onPress={openMapSearch} hitSlop={10}>
            <MaterialCommunityIcons
              name="map-marker-radius-outline"
              size={24}
              color={colors.onSurface}
            />
          </Pressable>
          <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={10}>
            <MaterialCommunityIcons name="home-outline" size={24} color={colors.onSurface} />
          </Pressable>
          <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      {/* Halal Sub-segment selector */}
      {type === "halal" && !isMapView && (
        <>
          <Pressable
            onPress={() => router.push("/halal-scanner" as any)}
            style={[styles.scannerCta, { backgroundColor: colors.brand + "18", borderColor: colors.brand + "55" }]}
          >
            <MaterialCommunityIcons name="barcode-scan" size={22} color={colors.brand} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.scannerTitle, { color: colors.onSurface }]}>Halal Food Scanner</Text>
              <Text style={[styles.scannerSub, { color: colors.onSurfaceMuted }]}>Check packaged food ingredients before you eat.</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.brand} />
          </Pressable>
          <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
            <Pressable
              onPress={() => setHalalSubTab("food")}
              style={[styles.tabItem, halalSubTab === "food" && { borderBottomColor: colors.brand }]}
            >
              <Text style={[styles.tabText, { color: halalSubTab === "food" ? colors.brand : colors.onSurfaceMuted }]}>
                Halal Restaurants
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setHalalSubTab("butcher")}
              style={[styles.tabItem, halalSubTab === "butcher" && { borderBottomColor: colors.brand }]}
            >
              <Text style={[styles.tabText, { color: halalSubTab === "butcher" ? colors.brand : colors.onSurfaceMuted }]}>
                Halal Meat Shops
              </Text>
            </Pressable>
          </View>
        </>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      ) : isMapView ? (
        Platform.OS === 'web' ? (
          <iframe
            src={googleMapsUrl}
            style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
            title="Maps Embed"
          />
        ) : (
          <WebView
            originWhitelist={['*']}
            source={{ uri: googleMapsUrl }}
            style={{ flex: 1 }}
          />
        )
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: colors.onSurfaceMuted }}>No results found nearby</Text>
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
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
  },
  scannerCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: theme.spacing.lg,
    marginBottom: 0,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
  },
  scannerTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  scannerSub: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
});
