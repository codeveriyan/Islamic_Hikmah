import { useCallback, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Image, Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { AnimatedCard } from "@/src/components/AnimatedCard";
import { getCompletedGoals, getActiveGoalIds, getHadithBookmarks, getQuranBookmarks, getDhikrStreak, type DhikrDay } from "@/src/storage";
import { theme } from "@/src/theme";

type MenuItem = {
  id: string;
  label: string;
  subtitle?: string;
  icon: string;
  route: string;
  color: string;
  badge?: string;
};

export default function MeTab() {
  const router = useRouter();
  const { colors, mode } = useTheme();
  const { profile, user, isGuest } = useAuth();

  const [goalProgress, setGoalProgress] = useState({ completed: 0, total: 0 });
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [activityWeek, setActivityWeek] = useState<boolean[]>(Array(7).fill(false));
  const [hadithSaved, setHadithSaved] = useState(0);
  const [quranBms, setQuranBms] = useState(0);
  const [dhikrStreak, setDhikrStreak] = useState<{ streak: number; todayTotal: number; weekHistory: DhikrDay[] }>({
    streak: 0, todayTotal: 0, weekHistory: [],
  });

  // Compute today's date string
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const [completedIds, activeIds, hBms, qBms, dStreak] = await Promise.all([
            getCompletedGoals(),
            getActiveGoalIds(),
            getHadithBookmarks(),
            getQuranBookmarks(),
            getDhikrStreak(),
          ]);
          const completed = completedIds.length;
          const total = activeIds.length;
          setGoalProgress({ completed, total });
          setHadithSaved(hBms.length);
          setQuranBms(qBms.length);
          setDhikrStreak(dStreak);

          // Mark today as active if any goal completed
          if (completed > 0) {
            await AsyncStorage.setItem(`hikmah:activity:${todayStr}`, String(completed));
          }

          // Load last 7 days activity
          const today = new Date();
          const last7Keys = Array.from({ length: 7 }, (_, i) => {
            const d2 = new Date(today);
            d2.setDate(d2.getDate() - (6 - i));
            return `hikmah:activity:${d2.getFullYear()}-${d2.getMonth() + 1}-${d2.getDate()}`;
          });
          const acts = await AsyncStorage.multiGet(last7Keys);
          setActivityWeek(acts.map(([, v]) => !!v));

          // Load + update streak
          const streakRaw = await AsyncStorage.getItem("hikmah:streak:v3");
          const sd = streakRaw ? JSON.parse(streakRaw) : { current: 0, longest: 0, lastDate: "" };
          if (completed > 0 && sd.lastDate !== todayStr) {
            // Check if yesterday was active
            const yest = new Date(today);
            yest.setDate(yest.getDate() - 1);
            const yesterdayStr = `${yest.getFullYear()}-${yest.getMonth() + 1}-${yest.getDate()}`;
            const wasYesterday = sd.lastDate === yesterdayStr;
            const newCurrent = wasYesterday ? sd.current + 1 : 1;
            const newLongest = Math.max(sd.longest, newCurrent);
            const updated = { current: newCurrent, longest: newLongest, lastDate: todayStr };
            await AsyncStorage.setItem("hikmah:streak:v3", JSON.stringify(updated));
            setStreak({ current: newCurrent, longest: newLongest });
          } else {
            setStreak({ current: sd.current, longest: sd.longest });
          }
        } catch {}
      })();
    }, [todayStr])
  );

  const bg = mode === "dark" ? colors.surface : "#F8FAFC";
  const cardBg = mode === "dark" ? colors.surfaceSecondary : "#FFFFFF";
  const progressPct = goalProgress.total > 0
    ? Math.round((goalProgress.completed / goalProgress.total) * 100)
    : 0;

  const name = profile?.name || user?.email?.split("@")[0] || (isGuest ? "Guest" : "Islamic Hikmah");
  const email = profile?.email || user?.email || "";
  const tier = profile?.tier || "free";
  const isPremium = tier === "premium" || profile?.trialActive;

  const MENU_GROUPS: { title: string; items: MenuItem[] }[] = [
    {
      title: "My Journey",
      items: [
        { id: "goals", label: "Daily Goals", subtitle: `${goalProgress.completed}/${goalProgress.total} completed today`, icon: "target", route: "/goals", color: "#047857" },
        { id: "favourites", label: "Saved Items", subtitle: "Verses, hadiths & more", icon: "heart", route: "/(tabs)/favourites", color: "#BE185D" },
        { id: "reminders", label: "Reminders", icon: "bell", route: "/(tabs)/reminder", color: "#7C3AED", subtitle: "Manage your notifications" },
      ],
    },
    {
      title: "Account",
      items: [
        { id: "profile", label: "My Profile", icon: "account-circle", route: "/profile", color: "#1D4ED8" },
        { id: "premium", label: isPremium ? "Premium Active ✓" : "Upgrade to Premium", subtitle: isPremium ? "All features unlocked" : "Unlock all features", icon: "crown", route: "/premium", color: "#D97706" },
        { id: "settings", label: "Settings", subtitle: "Theme, language, font & more", icon: "cog", route: "/settings", color: "#64748B" },
      ],
    },
    {
      title: "More",
      items: [
        { id: "emotions", label: "Emotional Wellness", subtitle: "Duas for how you feel", icon: "emoticon-happy-outline", route: "/(tabs)/emotions", color: "#0F766E" },
        { id: "menu", label: "All Features", subtitle: "View the full feature list", icon: "apps", route: "/menu", color: "#78350F" },
      ],
    },
  ];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Profile Hero Card */}
        <AnimatedCard onPress={() => router.push("/profile")} style={[s.profileCard, { overflow: "hidden" }]}>
          <LinearGradient
            colors={mode === "dark" ? ["#0B2D25", "#163B2E"] : ["#065F46", "#047857"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={s.profileRow}>
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={s.avatar} />
            ) : (
              <View style={[s.avatarFallback]}>
                <Text style={s.avatarInitial}>{name[0]?.toUpperCase() ?? "?"}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.profileName}>{name}</Text>
              {email ? <Text style={s.profileEmail}>{email}</Text> : null}
              <View style={s.tierBadge}>
                <MaterialCommunityIcons
                  name={isPremium ? "crown" : "account"}
                  size={11}
                  color={isPremium ? colors.warning : "rgba(255,255,255,0.7)"}
                />
                <Text style={[s.tierTxt, isPremium && { color: "#FCD34D" }]}>
                  {isPremium ? "Premium Member" : "Free Account"}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.6)" />
          </View>
        </AnimatedCard>

        {/* ── Streak + Activity Grid ── */}
        <AnimatedCard style={[s.streakCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
          <View style={s.streakTop}>
            {/* Current streak */}
            <View style={s.streakStat}>
              <Text style={[s.streakLabel, { color: colors.onSurfaceMuted }]}>STREAK</Text>
              <View style={s.streakValRow}>
                <Text style={[s.streakNum, { color: streak.current > 0 ? colors.warning : colors.onSurfaceMuted }]}>
                  {streak.current}
                </Text>
                <Text style={s.fireEmoji}>{streak.current >= 3 ? '🔥' : streak.current > 0 ? '✨' : '💤'}</Text>
              </View>
              <Text style={[s.streakDays, { color: colors.onSurfaceMuted }]}>days</Text>
            </View>

            <View style={[s.streakDivider, { backgroundColor: colors.border }]} />

            {/* Longest streak */}
            <View style={s.streakStat}>
              <Text style={[s.streakLabel, { color: colors.onSurfaceMuted }]}>LONGEST</Text>
              <Text style={[s.streakNum, { color: colors.onSurface, fontSize: 22 }]}>{streak.longest}</Text>
              <Text style={[s.streakDays, { color: colors.onSurfaceMuted }]}>days</Text>
            </View>

            <View style={[s.streakDivider, { backgroundColor: colors.border }]} />

            {/* 7-day activity grid */}
            <View style={[s.streakStat, { alignItems: 'flex-end', flex: 1 }]}>
              <Text style={[s.streakLabel, { color: colors.onSurfaceMuted }]}>THIS WEEK</Text>
              <View style={s.activityRow}>
                {activityWeek.map((active, idx) => (
                  <View
                    key={idx}
                    style={[
                      s.activityDot,
                      { backgroundColor: active ? colors.brand : colors.surfaceSecondary,
                        borderColor: active ? colors.brand + '40' : colors.border },
                    ]}
                  />
                ))}
              </View>
              <View style={s.activityLabels}>
                {['M','T','W','T','F','S','S'].map((l, i) => (
                  <Text key={i} style={[s.activityLbl, { color: colors.onSurfaceMuted }]}>{l}</Text>
                ))}
              </View>
            </View>
          </View>
        </AnimatedCard>

        {/* 📿 Dhikr Consistency Card */}
        <AnimatedCard style={[s.streakCard, { backgroundColor: cardBg, borderColor: colors.border, marginTop: 12 }]}>
          <View style={s.streakTop}>
            {/* Dhikr streak */}
            <View style={s.streakStat}>
              <Text style={[s.streakLabel, { color: colors.onSurfaceMuted }]}>DHIKR STREAK</Text>
              <View style={s.streakValRow}>
                <Text style={[s.streakNum, { color: dhikrStreak.streak > 0 ? colors.brand : colors.onSurfaceMuted }]}>
                  {dhikrStreak.streak}
                </Text>
                <Text style={s.fireEmoji}>{dhikrStreak.streak >= 7 ? '🌟' : dhikrStreak.streak > 0 ? '📿' : '💤'}</Text>
              </View>
              <Text style={[s.streakDays, { color: colors.onSurfaceMuted }]}>days</Text>
            </View>

            <View style={[s.streakDivider, { backgroundColor: colors.border }]} />

            {/* Today's count */}
            <View style={s.streakStat}>
              <Text style={[s.streakLabel, { color: colors.onSurfaceMuted }]}>TODAY</Text>
              <Text style={[s.streakNum, { color: colors.onSurface, fontSize: 22 }]}>{dhikrStreak.todayTotal}</Text>
              <Text style={[s.streakDays, { color: colors.onSurfaceMuted }]}>dhikr</Text>
            </View>

            <View style={[s.streakDivider, { backgroundColor: colors.border }]} />

            {/* 7-day intensity heatmap */}
            <View style={[s.streakStat, { alignItems: 'flex-end', flex: 1 }]}>
              <Text style={[s.streakLabel, { color: colors.onSurfaceMuted }]}>THIS WEEK</Text>
              {(() => {
                const maxTotal = Math.max(...dhikrStreak.weekHistory.map(d => d.total), 1);
                return (
                  <View style={s.activityRow}>
                    {dhikrStreak.weekHistory.map((day, idx) => {
                      const intensity = day.total / maxTotal;
                      const bg = day.total === 0
                        ? colors.surfaceSecondary
                        : `rgba(0,168,132,${Math.max(0.2, intensity)})`;
                      return (
                        <View
                          key={idx}
                          style={[
                            s.activityDot,
                            { backgroundColor: bg, borderColor: day.total > 0 ? colors.brand + '40' : colors.border },
                          ]}
                        />
                      );
                    })}
                  </View>
                );
              })()}
              <View style={s.activityLabels}>
                {['M','T','W','T','F','S','S'].map((l, i) => (
                  <Text key={i} style={[s.activityLbl, { color: colors.onSurfaceMuted }]}>{l}</Text>
                ))}
              </View>
            </View>
          </View>
        </AnimatedCard>

        {/* ⚡ Quick Stats Row ⚡ */}
        <View style={s.statsRow}>
          {[
            { label: 'Goals Done', value: goalProgress.completed, icon: 'target', color: colors.brand },
            { label: 'Hadiths Saved', value: hadithSaved, icon: 'book-open-page-variant', color: '#3B82F6' },
            { label: 'Quran Marks', value: quranBms, icon: 'bookmark', color: '#8B5CF6' },
          ].map(stat => (
            <View key={stat.label} style={[s.statCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
              <MaterialCommunityIcons name={stat.icon as any} size={18} color={stat.color} />
              <Text style={[s.statNum, { color: colors.onSurface }]}>{stat.value}</Text>
              <Text style={[s.statLabel, { color: colors.onSurfaceMuted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Achievement Badges ── */}
        <Text style={[s.groupTitle, { color: colors.onSurfaceMuted, marginBottom: 10 }]}>Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
          {[
            { icon: '🔥', label: 'Streak Warrior', sub: '7 day streak', unlocked: streak.current >= 7 },
            { icon: '📖', label: 'Quran Reader', sub: 'Bookmark 5 verses', unlocked: quranBms >= 5 },
            { icon: '🏆', label: 'Hadith Scholar', sub: 'Save 5 hadiths', unlocked: hadithSaved >= 5 },
            { icon: '✅', label: 'Goal Setter', sub: 'Complete a goal', unlocked: goalProgress.completed > 0 },
            { icon: '💫', label: 'Consistent', sub: '3 active days', unlocked: activityWeek.filter(Boolean).length >= 3 },
            { icon: '📿', label: 'Dhikr Master', sub: '3-day dhikr streak', unlocked: dhikrStreak.streak >= 3 },
            { icon: '🌟', label: 'Dhikr Devotee', sub: '100+ dhikr today', unlocked: dhikrStreak.todayTotal >= 100 },
          ].map(badge => (
            <View
              key={badge.label}
              style={[
                s.badge,
                {
                  backgroundColor: badge.unlocked ? colors.brand + '15' : cardBg,
                  borderColor: badge.unlocked ? colors.brand + '44' : colors.border,
                  opacity: badge.unlocked ? 1 : 0.55,
                },
              ]}
            >
              <Text style={{ fontSize: 24, marginBottom: 4 }}>{badge.icon}</Text>
              <Text style={[s.badgeLabel, { color: colors.onSurface }]}>{badge.label}</Text>
              <Text style={[s.badgeSub, { color: colors.onSurfaceMuted }]}>{badge.sub}</Text>
              {badge.unlocked && (
                <View style={[s.unlockedPip, { backgroundColor: colors.brand }]} />
              )}
            </View>
          ))}
        </ScrollView>

        {/* Goals Progress */}
        {goalProgress.total > 0 && (
          <AnimatedCard onPress={() => router.push("/goals")} style={[s.goalsCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
            <View style={s.goalsRow}>
              <View style={[s.goalsIcon, { backgroundColor: colors.brand + "18" }]}>
                <MaterialCommunityIcons name="target" size={20} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.goalsTitle, { color: colors.onSurface }]}>
                  Today's Goals — {progressPct}%
                </Text>
                <Text style={[s.goalsSub, { color: colors.onSurfaceMuted }]}>
                  {goalProgress.completed} of {goalProgress.total} completed
                </Text>
                <View style={[s.progressTrack, { backgroundColor: colors.surfaceSecondary }]}>
                  <View style={[s.progressFill, { width: `${progressPct}%`, backgroundColor: colors.brand }]} />
                </View>
              </View>
            </View>
          </AnimatedCard>
        )}

        {/* Menu Groups */}
        {MENU_GROUPS.map((group) => (
          <View key={group.title} style={{ marginBottom: 20 }}>
            <Text style={[s.groupTitle, { color: colors.onSurfaceMuted }]}>{group.title}</Text>
            <View style={[s.menuList, { backgroundColor: cardBg, borderColor: colors.border }]}>
              {group.items.map((item, idx) => (
                <AnimatedCard
                  key={item.id}
                  onPress={() => router.push(item.route as any)}
                  style={[
                    s.menuRow,
                    idx < group.items.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
                  ]}
                >
                  <View style={[s.menuIcon, { backgroundColor: item.color + "18" }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.menuLabel, { color: colors.onSurface }]}>{item.label}</Text>
                    {item.subtitle ? (
                      <Text style={[s.menuSub, { color: colors.onSurfaceMuted }]}>{item.subtitle}</Text>
                    ) : null}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
                </AnimatedCard>
              ))}
            </View>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  streakCard: {
    borderRadius: theme.radius.lg, borderWidth: 0.5, padding: 16, marginBottom: 14,
  },
  streakTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 0 },
  streakStat: { alignItems: 'center', minWidth: 64 },
  streakLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  streakValRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  streakNum: { fontSize: 28, fontWeight: '800', fontFamily: 'Outfit_600SemiBold' },
  fireEmoji: { fontSize: 22, marginTop: -2 },
  streakDays: { fontSize: 11, marginTop: 2, fontFamily: 'Figtree_400Regular' },
  streakDivider: { width: 0.5, height: 48, marginHorizontal: 12, alignSelf: 'center' },
  activityRow: { flexDirection: 'row', gap: 3, marginTop: 4 },
  activityDot: { width: 16, height: 16, borderRadius: 4, borderWidth: 1 },
  activityLabels: { flexDirection: 'row', gap: 3, marginTop: 3 },
  activityLbl: { width: 16, textAlign: 'center', fontSize: 8, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, borderRadius: theme.radius.md, borderWidth: 0.5, padding: 12, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, fontWeight: '800', fontFamily: 'Outfit_600SemiBold' },
  statLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center', fontFamily: 'Figtree_400Regular' },
  badge: { width: 100, borderRadius: theme.radius.lg, borderWidth: 1, padding: 12, alignItems: 'center', position: 'relative' },
  badgeLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center', fontFamily: 'Figtree_400Regular' },
  badgeSub: { fontSize: 9, textAlign: 'center', fontFamily: 'Figtree_400Regular', marginTop: 2 },
  unlockedPip: { position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: 3 },
  safe: { flex: 1 },
  scroll: { padding: theme.spacing.lg },
  profileCard: {
    borderRadius: 20, marginBottom: 16, padding: 20,
  },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  avatarFallback: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { fontSize: 22, fontWeight: "700", color: "#fff" },
  profileName: { fontSize: 18, fontFamily: "Outfit_600SemiBold", fontWeight: "700", color: "#fff" },
  profileEmail: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Figtree_400Regular", marginTop: 2 },
  tierBadge: {
    flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start",
  },
  tierTxt: { fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: "700" },
  goalsCard: {
    borderRadius: theme.radius.lg, borderWidth: 0.5,
    padding: 16, marginBottom: 20,
  },
  goalsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  goalsIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  goalsTitle: { fontSize: 14, fontFamily: "Figtree_400Regular", fontWeight: "700" },
  goalsSub: { fontSize: 12, fontFamily: "Figtree_400Regular", marginTop: 2, marginBottom: 8 },
  progressTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  groupTitle: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0.8,
    textTransform: "uppercase", fontFamily: "Figtree_400Regular",
    marginBottom: 8, marginLeft: 4,
  },
  menuList: { borderRadius: theme.radius.lg, borderWidth: 0.5, overflow: "hidden" },
  menuRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  menuIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontFamily: "Figtree_400Regular", fontWeight: "500" },
  menuSub: { fontSize: 12, fontFamily: "Figtree_400Regular", marginTop: 1 },
});
