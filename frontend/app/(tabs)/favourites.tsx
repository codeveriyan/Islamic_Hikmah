import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from "react-native";
import { AnimatedCard } from "@/src/components/AnimatedCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { EmptyState } from "@/src/components/EmptyState";

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
    let catColor = colors.brand;

    const CAT_COLORS: Record<string, string> = {
      quran: '#047857', dhikr: '#7C3AED', hadith: '#1D4ED8', seerah: '#B45309',
      favourites: colors.error,
    };
    const CAT_ICONS: Record<string, string> = {
      quran: 'book-open-variant', dhikr: 'hands-pray',
      hadith: 'text-box-outline', seerah: 'star-crescent',
    };

    if (activeMode === "favourites") {
      tag = item.type || 'SAVED';
      catColor = CAT_COLORS.favourites;
      cardTitle = item.title;
      arabicText = item.arabic;
      translationText = item.translation;
    } else {
      tag = activeCategory;
      catColor = CAT_COLORS[activeCategory] || colors.brand;
      if (activeCategory === "quran") {
        cardTitle = `${item.surahName} — Verse ${item.ayahNumber}`;
        translationText = item.note ? `📝 ${item.note}` : "Bookmarked Quran Verse";
      } else if (activeCategory === "dhikr") {
        cardTitle = item.title;
        arabicText = item.arabic;
        translationText = item.translation;
      } else if (activeCategory === "hadith") {
        cardTitle = `${item.bookId?.toUpperCase()} — Hadith #${item.hadithnumber}`;
        arabicText = item.arabicText;
        translationText = item.text;
      } else if (activeCategory === "seerah") {
        cardTitle = item.title;
        translationText = item.content ? item.content.slice(0, 160) + "…" : "Bookmarked Seerah Chapter";
      }
    }

    const iconName = activeMode === 'favourites'
      ? (CAT_ICONS[item.type] || 'star')
      : (CAT_ICONS[activeCategory] || 'bookmark');

    return (
      <AnimatedCard
        onPress={() => handleCardPress(item)}
        style={[
          styles.card,
          { backgroundColor: colors.surfaceSecondary, borderLeftColor: catColor },
        ]}
      >
        {/* Category label row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <View style={[styles.tagIcon, { backgroundColor: catColor + '22' }]}>
            <MaterialCommunityIcons name={iconName as any} size={12} color={catColor} />
          </View>
          <Text style={[styles.cardKind, { color: catColor }]}>{tag.toUpperCase()}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>{cardTitle}</Text>
          {arabicText ? (
            <Text style={[styles.arabic, { color: colors.onSurface }]} numberOfLines={2}>
              {arabicText}
            </Text>
          ) : null}
          {translationText ? (
            <Text style={[styles.translation, { color: colors.onSurfaceMuted }]} numberOfLines={3}>
              {translationText}
            </Text>
          ) : null}
        </View>

        {/* Remove button */}
        <Pressable
          onPress={() => handleRemove(item)}
          hitSlop={12}
          style={[styles.actionBtn, { backgroundColor: catColor + '15' }]}
        >
          <MaterialCommunityIcons
            name={activeMode === "favourites" ? "heart" : "bookmark"}
            color={catColor}
            size={18}
          />
        </Pressable>
      </AnimatedCard>
    );
  };

  const listItems = getFilteredItems();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.onSurface }]}>{t("favourites")}</Text>
          <Text style={{ fontSize: 12, color: colors.onSurfaceMuted, fontFamily: 'Figtree_400Regular', marginTop: 2 }}>
            {listItems.length > 0 ? `${listItems.length} saved item${listItems.length !== 1 ? 's' : ''}` : 'Your saved content'}
          </Text>
        </View>
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
      {activeMode === 'bookmarks' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {([
            { cat: 'quran', icon: 'book-open-variant', color: '#047857' },
            { cat: 'dhikr', icon: 'hands-pray', color: '#7C3AED' },
            { cat: 'hadith', icon: 'text-box-outline', color: '#1D4ED8' },
            { cat: 'seerah', icon: 'star-crescent', color: '#B45309' },
          ] as const).map(({ cat, icon, color }) => {
            const isActive = activeCategory === cat;
            const count = getCategoryCount(cat as CategoryType);
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat as CategoryType)}
                style={[
                  styles.tabBtn,
                  { borderColor: isActive ? color : colors.border,
                    backgroundColor: isActive ? color + '18' : colors.surfaceSecondary },
                ]}
              >
                <MaterialCommunityIcons name={icon as any} size={14} color={isActive ? color : colors.onSurfaceMuted} />
                <Text style={[styles.tabText, { color: isActive ? color : colors.onSurfaceMuted, fontWeight: isActive ? '700' : '500' }]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: isActive ? color : colors.border }]}>
                    <Text style={[styles.tabBadgeTxt, { color: isActive ? '#fff' : colors.onSurfaceMuted }]}>{count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Main List */}
      {listItems.length === 0 ? (
        <EmptyState
          icon={activeMode === "favourites" ? "heart-outline" : "bookmark-outline"}
          title={`No ${activeMode === "favourites" ? "Favourites" : "Bookmarks"} Yet`}
          subtitle={`Tap the heart or bookmark icon on any Quran verse, Hadith, or Dhikr to save it here.`}
          orbitIcons={["book-open-variant", "hands-pray", "star-crescent", "heart"]}
        />
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
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 14, paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  title: { fontSize: 24, fontWeight: "700", fontFamily: "Outfit_600SemiBold" },
  
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
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(128,128,128,0.15)",
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
    fontFamily: "Figtree_400Regular",
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
    borderLeftWidth: 3,
    marginBottom: 10,
  },
  tagIcon: {
    width: 20, height: 20, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  cardKind: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", fontFamily: "Figtree_400Regular" },
  cardTitle: { fontSize: 15, fontWeight: "700", marginTop: 2, fontFamily: "Outfit_600SemiBold" },
  arabic: { fontFamily: "Amiri", fontSize: 18, marginTop: 8, textAlign: "right", alignSelf: "stretch" },
  translation: { marginTop: 6, fontSize: 13, lineHeight: 19, fontFamily: "Figtree_400Regular" },
  actionBtn: {
    padding: 8, alignSelf: "flex-start",
    borderRadius: 10,
  },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeTxt: { fontSize: 9, fontWeight: '800' },
});
