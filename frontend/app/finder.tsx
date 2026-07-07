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

// High-fidelity local mocked results for realistic places with coordinates (Palakkad / Coimbatore regions)
const MOCK_MOSQUES: MapPlace[] = [
  { id: "1", name: "Thajul Islam Sunnath Hanafi Jamath", address: "Palakkad Main Road", distance: "1.1 km", lat: 10.7867, lng: 76.6548 },
  { id: "2", name: "Thajul Islam Hanafi Masjid", address: "Palakkad, Kerala", distance: "1.2 km", lat: 10.7880, lng: 76.6580 },
  { id: "3", name: "Ahle Sunnath Jamath Thagni Masjid", address: "Palakkad Main Road", distance: "1.1 km", lat: 10.7850, lng: 76.6520 },
  { id: "4", name: "Hidhayathul Islam Masjid", address: "Coimbatore, Tamil Nadu", distance: "2.0 km", lat: 11.0020, lng: 76.9600 },
  { id: "5", name: "Masjidhul Jannah", address: "Coimbatore Road", distance: "2.2 km", lat: 11.0110, lng: 76.9480 },
  { id: "6", name: "மஸ்ஜித் மதனியா (Masjid Madania)", address: "Coimbatore 641001", distance: "2.6 km", lat: 11.0180, lng: 76.9580 },
  { id: "7", name: "Salafi Masjid", address: "Palakkad Bypass", distance: "2.6 km", lat: 10.7920, lng: 76.6450 },
  { id: "8", name: "Shafi Sunnath Jamath Masjith", address: "Kuniyamuthur, Coimbatore", distance: "2.7 km", lat: 10.9780, lng: 76.9420 },
  { id: "9", name: "Hanafi Sunth Jamath Mosque", address: "Coimbatore 641042", distance: "3.0 km", lat: 11.0250, lng: 76.9350 },
  { id: "10", name: "Thareekkathul Islam Shaffihiya Jamath", address: "Podanur, Coimbatore", distance: "3.7 km", lat: 10.9620, lng: 76.9680 },
];

const MOCK_HALAL: MapPlace[] = [
  { id: "1", name: "Al-Rehman Family Restaurant (Halal)", address: "Palakkad Bypass Road", distance: "0.8 km", lat: 10.7960, lng: 76.6420 },
  { id: "2", name: "Kabab Magic & Biryani", address: "Kuniyamuthur, Coimbatore", distance: "1.2 km", lat: 10.9790, lng: 76.9410 },
  { id: "3", name: "Tandoori Knights", address: "Palakkad Main Road", distance: "1.5 km", lat: 10.7840, lng: 76.6590 },
  { id: "4", name: "Madina Grill & Shawarma", address: "Coimbatore Junction", distance: "1.9 km", lat: 11.0120, lng: 76.9620 },
  { id: "5", name: "Rahmath Biryani Hotel", address: "Podanur Road", distance: "2.3 km", lat: 10.9630, lng: 76.9690 },
  { id: "6", name: "Zam Zam Arabic Restaurant", address: "Town Hall, Coimbatore", distance: "2.8 km", lat: 11.0150, lng: 76.9590 },
];

export default function FinderScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: "mosque" | "halal" }>();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);

  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [isMapView, setIsMapView] = useState(false);

  const title = type === "halal" ? "Halal Food Finder" : "Mosque Finder";
  const icon = type === "halal" ? "food-fork-drink" : "mosque";

  useEffect(() => {
    (async () => {
      try {
        const loc = await resolveUserLocation();
        setCity(loc.city || "Nearby");
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
    if (mapsUrl) {
      Linking.openURL(mapsUrl);
    }
  };

  // Listen to Leaflet Map iframe postMessages on Web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMessage = (event: MessageEvent) => {
        if (event.data && event.data.action === 'navigate' && event.data.place) {
          handleOpenPlace(event.data.place);
        }
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, []);

  // Handle native Webview message events
  const handleNativeMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.action === 'navigate' && data.place) {
        handleOpenPlace(data.place);
      }
    } catch (e) {
      console.error("Map message parsing error:", e);
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

  // Generate Leaflet Map HTML content dynamically
  const mapHtmlContent = useMemo(() => {
    if (places.length === 0) return "";
    const centerLat = places[0].lat;
    const centerLng = places[0].lng;

    const markersCode = places.map((p) => {
      const popupHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;padding:6px;width:160px;">
          <h4 style="margin:0 0 4px;font-size:13px;color:#1e3c3a;font-weight:700;">${p.name}</h4>
          <p style="margin:0 0 8px;font-size:11px;color:#7f8c8d;line-height:1.3;">${p.address}</p>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:11px;font-weight:800;color:${colors.brand};">📏 ${p.distance}</span>
            <button onclick="
              const payload = { action: 'navigate', place: ${JSON.stringify(p)} };
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(payload));
              } else {
                window.parent.postMessage(payload, '*');
              }
            " style="background:${colors.brand};color:#FFF;border:none;padding:4px 8px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer;">
              Directions
            </button>
          </div>
        </div>
      `;
      return `L.marker([${p.lat}, ${p.lng}]).addTo(map).bindPopup(\`${popupHtml.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);`;
    }).join("\n");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <style>
          body, html, #map { margin:0; padding:0; height:100%; width:100%; }
          .leaflet-popup-content-wrapper { border-radius: 8px; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLng}], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
          }).addTo(map);
          ${markersCode}
        </script>
      </body>
      </html>
    `;
  }, [places, colors.brand]);

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
        <Pressable onPress={() => setIsMapView(!isMapView)} hitSlop={10}>
          <MaterialCommunityIcons 
            name={isMapView ? "format-list-bulleted" : "map-marker-radius-outline"} 
            size={24} 
            color={colors.onSurface} 
          />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      ) : isMapView ? (
        // Map Mode
        Platform.OS === 'web' ? (
          <iframe 
            srcDoc={mapHtmlContent} 
            style={{ flex: 1, border: 'none', width: '100%', height: '100%' }} 
          />
        ) : (
          <WebView
            originWhitelist={['*']}
            source={{ html: mapHtmlContent }}
            onMessage={handleNativeMessage}
            style={{ flex: 1 }}
          />
        )
      ) : (
        // List Mode
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
