import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { getIslamHouseItemDetail, IslamHouseItemDetail } from "@/src/services/islamHouseService";
import * as WebBrowser from "expo-web-browser";

export default function LibraryItemScreen() {
  const router = useRouter();
  const { item } = useLocalSearchParams();
  const itemId = typeof item === "string" ? parseInt(item, 10) : 0;

  const { colors, mode, language } = useTheme();
  const { t } = useTranslation(language);

  const [detail, setDetail] = useState<IslamHouseItemDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    getIslamHouseItemDetail(itemId, language)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [itemId, language]);

  const openAttachment = async (url: string) => {
    if (Platform.OS === "web") {
      window.open(url, "_blank");
    } else {
      await WebBrowser.openBrowserAsync(url);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <Text style={{ color: colors.error }}>Failed to load item.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.brand }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  let icon = "file-document-outline";
  if (detail.type === "book") icon = "book-open-page-variant";
  if (detail.type === "audio") icon = "headphones";
  if (detail.type === "video") icon = "play-circle";
  if (detail.type === "article") icon = "newspaper";
  if (detail.type === "fatwa") icon = "scale-balance";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 8, marginRight: 8 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
          {detail.type.charAt(0).toUpperCase() + detail.type.slice(1)} Details
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View style={[styles.iconContainer, { backgroundColor: colors.brand + "15" }]}>
            <MaterialCommunityIcons name={icon as any} size={48} color={colors.brand} />
          </View>
          <Text style={[styles.title, { color: colors.onSurface }]}>{detail.title}</Text>

          {detail.authors && detail.authors.length > 0 && (
            <Text style={[styles.author, { color: colors.onSurfaceMuted }]}>
              {detail.authors.map(a => a.title).join(", ")}
            </Text>
          )}
        </View>

        {/* Categories */}
        {detail.categories && detail.categories.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24, justifyContent: "center" }}>
            {detail.categories.map(c => (
              <View key={c.id} style={[styles.tag, { backgroundColor: colors.border }]}>
                <Text style={[styles.tagText, { color: colors.onSurface }]}>{c.title}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Description */}
        {detail.description ? (
          <View style={[styles.section, { backgroundColor: mode === "dark" ? colors.surfaceSecondary : "#F9FAFB", borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Description</Text>
            <Text style={[styles.description, { color: colors.onSurfaceMuted }]}>
              {detail.description}
            </Text>
          </View>
        ) : null}

        {/* Attachments */}
        {detail.attachments && detail.attachments.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface, marginBottom: 12 }]}>
              Attachments & Media
            </Text>
            {detail.attachments.map(att => (
              <Pressable
                key={att.id}
                style={[styles.attachmentCard, { borderColor: colors.border, backgroundColor: mode === "dark" ? colors.surfaceSecondary : "#FFFFFF" }]}
                onPress={() => openAttachment(att.url)}
              >
                <View style={[styles.attIcon, { backgroundColor: colors.brand + "15" }]}>
                  <MaterialCommunityIcons
                    name={att.extension_type === "pdf" ? "file-pdf-box" : att.extension_type === "mp3" ? "music-box" : att.extension_type === "mp4" ? "video" : "file"}
                    size={24}
                    color={colors.brand}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.attTitle, { color: colors.onSurface }]} numberOfLines={1}>
                    {att.title || "File Attachment"}
                  </Text>
                  <Text style={[styles.attSize, { color: colors.onSurfaceMuted }]}>
                    {att.extension_type.toUpperCase()} • {att.size}
                  </Text>
                </View>
                <MaterialCommunityIcons name="open-in-new" size={20} color={colors.onSurfaceMuted} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", fontFamily: "Figtree_700Bold", flex: 1 },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Figtree_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
    fontFamily: "Figtree_400Regular",
    textAlign: "center",
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontFamily: "Figtree_500Medium",
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Figtree_700Bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    fontFamily: "Figtree_400Regular",
    lineHeight: 24,
  },
  attachmentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  attIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  attTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Figtree_600SemiBold",
    marginBottom: 4,
  },
  attSize: {
    fontSize: 13,
    fontFamily: "Figtree_400Regular",
  }
});
