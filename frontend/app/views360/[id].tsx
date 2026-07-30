import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/ThemeContext";
import { HOLY_PLACES_360 } from "@/src/data/views360Data";
import { PANORAMA_BASE64_MAP } from "@/src/data/views360Assets";

export default function HolyPlace360ViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isGyroActive, setIsGyroActive] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const place = useMemo(() => {
    return (
      HOLY_PLACES_360.find((p) => p.id === id || p.assetKey === id) ||
      HOLY_PLACES_360[0]
    );
  }, [id]);

  // Base64 panorama data URI for instant 100% offline & web rendering
  const panoramaSource = useMemo(() => {
    const b64 = PANORAMA_BASE64_MAP[place.assetKey];
    return b64 || place.panoramaUrl;
  }, [place]);

  // Pannellum HTML viewer with WebGL and DeviceOrientation (Gyroscope) support
  const htmlContent = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>${place.title}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"/>
        <script src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #panorama { width: 100%; height: 100%; background-color: #000000; overflow: hidden; }
          .pnm-controls-container { display: none !important; }
        </style>
      </head>
      <body>
        <div id="panorama"></div>
        <script>
          try {
            var viewer = pannellum.viewer('panorama', {
              type: 'equirectangular',
              panorama: '${panoramaSource}',
              autoLoad: true,
              autoRotate: -1.5,
              orientationOnByDefault: ${isGyroActive ? "true" : "false"},
              showControls: false,
              friction: 0.15,
              hfov: 100,
              minHfov: 50,
              maxHfov: 120,
              backgroundColor: [0, 0, 0]
            });

            viewer.on('load', function() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOADED' }));
              }
            });

            viewer.on('error', function(err) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', error: String(err) }));
              }
            });
          } catch (e) {
            console.error("Pannellum init error:", e);
          }
        </script>
      </body>
      </html>
    `;
  }, [place, panoramaSource, isGyroActive]);

  // Dismiss spinner automatically after 2.5 seconds as safety backup
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [id]);

  const handleToggleGyro = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsGyroActive((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      {/* 360 WebGL Panorama Renderer (Iframe on Web, WebView on Native) */}
      {Platform.OS === "web" ? (
        <iframe
          srcDoc={htmlContent}
          style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#000" }}
          title={place.title}
          onLoad={() => setIsLoading(false)}
        />
      ) : (
        <WebView
          source={{ html: htmlContent, baseUrl: "https://islamic-hikmah.app" }}
          style={styles.webview}
          scrollEnabled={false}
          bounces={false}
          originWhitelist={["*"]}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onLoadEnd={() => setIsLoading(false)}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === "LOADED" || data.type === "ERROR") {
                setIsLoading(false);
              }
            } catch {}
          }}
        />
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading 360° Sacred View...</Text>
        </View>
      )}

      {/* Top Floating Control Bar */}
      <SafeAreaView style={styles.topBarContainer}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            hitSlop={12}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>

          <View style={styles.titleWrapper}>
            <Text style={styles.titleText} numberOfLines={1}>
              {place.title}
            </Text>
            <Text style={styles.cityText}>{place.city}</Text>
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setShowInfoModal(true);
            }}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            hitSlop={12}
          >
            <MaterialCommunityIcons name="information-outline" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Bottom Floating Control Bar (Phone Gyro & Motion Hint) */}
      <SafeAreaView style={styles.bottomBarContainer}>
        <View style={styles.bottomPill}>
          <Pressable
            onPress={handleToggleGyro}
            style={({ pressed }) => [styles.gyroBtn, pressed && { opacity: 0.8 }]}
          >
            <MaterialCommunityIcons
              name={isGyroActive ? "phone-rotate-portrait" : "gesture-swipe-horizontal"}
              size={20}
              color="#F59E0B"
            />
            <Text style={styles.gyroText}>
              {isGyroActive ? "Move your phone to look around" : "Drag / swipe to rotate 360°"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Historical Information Modal Sheet */}
      <Modal
        visible={showInfoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface || "#111B21" }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface || "#FFFFFF" }]}>
                {place.title}
              </Text>
              <Pressable
                onPress={() => setShowInfoModal(false)}
                style={styles.closeBtn}
                hitSlop={12}
              >
                <MaterialCommunityIcons name="close" size={22} color={colors.onSurfaceMuted || "#8696A0"} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalSubtitle, { color: colors.warning || "#F59E0B" }]}>
                {place.subtitle}
              </Text>
              <Text style={[styles.modalDescription, { color: colors.onSurface || "#E5E7EB" }]}>
                {place.description}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  webview: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "600",
  },
  topBarContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrapper: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cityText: {
    color: "#F59E0B",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  bottomBarContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bottomPill: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  gyroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gyroText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalScroll: {
    marginTop: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
});
