import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { 
  getFavourites, 
  toggleFavourite, 
  Favourite,
  getQuranBookmarks, 
  removeQuranBookmark, 
  QuranBookmark,
  getHadithBookmarks, 
  toggleHadithBookmark, 
  HadithBookmark,
  getSeerahBookmarks, 
  toggleSeerahBookmark, 
  SeerahBookmark,
  getDhikrBookmarks,
  toggleDhikrBookmark,
  DhikrBookmark
} from "@/src/storage";

type CategoryType = "quran" | "dhikr" | "hadith" | "seerah";

export default function FavouritesScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);

  // States for lists
  const [favouritesList, setFavouritesList] = useState<Favourite[]>([]);
  const [quranBms, setQuranBms] = useState<QuranBookmark[]>([]);
  const [dhikrBms, setDhikrBms] = useState<DhikrBookmark[]>([]);
  const [hadithBms, setHadithBms] = useState<HadithBookmark[]>([]);
  const [seerahBms, setSeerahBms] = useState<SeerahBookmark[]>([]);

  // Navigation segment modes
  const [activeMode, setActiveMode] = useState<"favourites" | "bookmarks">("favourites");
  const [activeCategory, setActiveCategory] = useState<CategoryType>("quran");

  const loadAllSavedData = useCallback(() => {
    Promise.all([
      getFavourites(),
      getQuranBookmarks(),
      getDhikrBookmarks(),
      getHadithBookmarks(),
      getSeerahBookmarks(),
    ]).then(([favs, qBms, dBms, hBms, sBms]) => {
      setFavouritesList(favs);
      setQuranBms(qBms);
      setDhikrBms(dBms);
      setHadithBms(hBms);
      setSeerahBms(sBms);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllSavedData();
    }, [loadAllSavedData])
  );

  // Filters based on active selection
  const getFilteredItems = (): any[] => {
    if (activeMode === "favourites") {
      switch (activeCategory) {
        case "quran":
          return favouritesList.filter((f) => f.type === "ayah");
        case "dhikr":
          return favouritesList.filter((f) => f.type === "dua");
        case "hadith":
          return favouritesList.filter((f) => f.type === "hadith");
        case "seerah":
          return favouritesList.filter((f) => f.type === "seerah");
      }
    } else {
      switch (activeCategory) {
        case "quran":
          return quranBms;
        case "dhikr":
          return dhikrBms;
        case "hadith":
          return hadithBms;
        case "seerah":
          return seerahBms;
      }
    }
  };

  const getCategoryCount = (cat: CategoryType): number => {
    if (activeMode === "favourites") {
      switch (cat) {
        case "quran": return favouritesList.filter((f) => f.type === "ayah").length;
        case "dhikr": return favouritesList.filter((f) => f.type === "dua").length;
        case "hadith": return favouritesList.filter((f) => f.type === "hadith").length;
        case "seerah": return favouritesList.filter((f) => f.type === "seerah").length;
      }
    } else {
      switch (cat) {
        case "quran": return quranBms.length;
        case "dhikr": return dhikrBms.length;
        case "hadith": return hadithBms.length;
        case "seerah": return seerahBms.length;
      }
    }
  };

  const handleRemove = async (item: any) => {
    if (activeMode === "favourites") {
      await toggleFavourite(item);
    } else {
      // Remove from bookmarks
      if (activeCategory === "quran") {
        await removeQuranBookmark(item.surahNumber, item.ayahNumber);
      } else if (activeCategory === "dhikr") {
        await toggleDhikrBookmark(item);
      } else if (activeCategory === "hadith") {
        await toggleHadithBookmark(item);
      } else if (activeCategory === "seerah") {
        await toggleSeerahBookmark(item);
      }
    }
    loadAllSavedData();
  };

  const handleCardPress = (item: any) => {
    if (activeCategory === "quran") {
      const sNumber = item.surahNumber || (item.id && Number(item.id.split("-")[1])) || 1;
      router.push(`/quran/${sNumber}` as any);
    } else if (activeCategory === "dhikr") {
      // Navigate to Dhikr page
      router.push("/dhikr" as any);
    } else if (activeCategory === "hadith") {
      const book = item.bookId || item.id?.split("-")[1] || "bukhari";
      router.push(`/hadith/${book}` as any);
    } else if (activeCategory === "seerah") {
      const chapter = item.chapterId || item.id?.replace("seerah-", "") || "arabian-peninsula";
      router.push(`/seerah/${chapter}` as any);
    }
  };

  const renderItemCard = ({ item }: { item: any }) => {
    let cardTitle = "";
    let arabicText = "";
    let translationText = "";
    let tag = "";

    if (activeMode === "favourites") {
      tag = item.type.toUpperCase();
      cardTitle = item.title;
      arabicText = item.arabic;
      translationText = item.translation;
    } else {
      tag = activeCategory.toUpperCase();
      if (activeCategory === "quran") {
        cardTitle = `${item.surahName} · Verse ${item.ayahNumber}`;
        translationText = item.note ? `Note: ${item.note}` : "Bookmarked Quran Verse";
      } else if (activeCategory === "dhikr") {
        cardTitle = item.title;
        arabicText = item.arabic;
        translationText = item.translation;
      } else if (activeCategory === "hadith") {
        cardTitle = `${item.bookId.toUpperCase()} · Hadith #${item.hadithnumber}`;
        arabicText = item.arabicText;
        translationText = item.text;
      } else if (activeCategory === "seerah") {
        cardTitle = item.title;
        translationText = item.content ? item.content.slice(0, 160) + "..." : "Bookmarked Seerah Chapter";
      }
    }

    return (
      <Pressable 
        onPress={() => handleCardPress(item)}
        style={({ pressed }) => [
          styles.card, 
          { backgroundColor: colors.surfaceSecondary },
          pressed && { opacity: 0.95 }
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardKind, { color: colors.brand }]}>{tag}</Text>
          <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{cardTitle}</Text>
          {arabicText ? (
            <Text style={[styles.arabic, { color: colors.onSurfaceSecondary }]} numberOfLines={2}>
              {arabicText}
            </Text>
          ) : null}
          {translationText ? (
            <Text style={[styles.translation, { color: colors.onSurfaceMuted }]} numberOfLines={3}>
              {translationText}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => handleRemove(item)}
          hitSlop={12}
          style={styles.actionBtn}
        >
          <MaterialCommunityIcons 
            name={activeMode === "favourites" ? "heart" : "bookmark"} 
            // Favourites is red (error), Bookmarks is green/brand
            color={activeMode === "favourites" ? colors.error : colors.brand} 
            size={22} 
          />
        </Pressable>
      </Pressable>
    );
  };

  const listItems = getFilteredItems();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>{t("favourites")}</Text>
      </View>

      {/* Main Switcher: Favourites / Bookmarks */}
      <View style={[styles.modeSwitcher, { backgroundColor: colors.surfaceSecondary }]}>
        <Pressable 
          onPress={() => setActiveMode("favourites")}
          style={[
            styles.modeBtn, 
            activeMode === "favourites" && { backgroundColor: colors.brand }
          ]}
        >
          <Text style={[
            styles.modeBtnText, 
            { color: activeMode === "favourites" ? "#FFFFFF" : colors.onSurfaceMuted }
          ]}>
            Favorites
          </Text>
        </Pressable>
        <Pressable 
          onPress={() => setActiveMode("bookmarks")}
          style={[
            styles.modeBtn, 
            activeMode === "bookmarks" && { backgroundColor: colors.brand }
          ]}
        >
          <Text style={[
            styles.modeBtnText, 
            { color: activeMode === "bookmarks" ? "#FFFFFF" : colors.onSurfaceMuted }
          ]}>
            Bookmarks
          </Text>
        </Pressable>
      </View>

      {/* Category Sub-Tabs */}
      <View style={styles.tabContainer}>
        {(["quran", "dhikr", "hadith", "seerah"] as CategoryType[]).map((cat) => {
          const isActive = activeCategory === cat;
          const count = getCategoryCount(cat);
          let label = cat.toUpperCase();
          if (cat === "dhikr") label = "DHIKR";

          return (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.tabBtn,
                isActive && { borderBottomColor: colors.brand, borderBottomWidth: 3 }
              ]}
            >
              <Text style={[
                styles.tabText,
                { color: isActive ? colors.brand : colors.onSurfaceMuted },
                isActive && { fontWeight: "700" }
              ]}>
                {label} ({count})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Main List */}
      {listItems.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons 
            name={activeMode === "favourites" ? "heart-broken" : "bookmark-off-outline"} 
            size={64} 
            color={colors.brand + "55"} 
          />
          <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
            No {activeMode === "favourites" ? "favorites" : "bookmarks"} saved
          </Text>
          <Text style={[styles.emptyText, { color: colors.onSurfaceMuted }]}>
            Go to the {activeCategory.toUpperCase()} tab to save items here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item, index) => item.id || `${activeCategory}-${index}`}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: 40 }}
          renderItem={renderItemCard}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.sm },
  title: { fontSize: 24, fontWeight: "700" },
  
  // Mode switcher (Pill style)
  modeSwitcher: {
    flexDirection: "row",
    marginHorizontal: theme.spacing.lg,
    marginVertical: 12,
    borderRadius: 24,
    padding: 3,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // Tab container
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.15)",
    paddingHorizontal: theme.spacing.lg,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 16 },
  emptyText: { textAlign: "center", marginTop: 8, lineHeight: 20 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.md,
  },
  cardKind: { fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  cardTitle: { fontSize: 15, fontWeight: "700", marginTop: 4 },
  arabic: { fontFamily: "Amiri", fontSize: 18, marginTop: 8, textAlign: "right", alignSelf: "stretch" },
  translation: { marginTop: 6, fontSize: 13, lineHeight: 18 },
  actionBtn: {
    padding: 4,
    alignSelf: "flex-start",
  },
});
