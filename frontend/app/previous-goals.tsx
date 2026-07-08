import { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";

type PreviousDay = {
  dateLabel: string;
  completedRatio: string;
};

const PREVIOUS_DAYS_MOCK: PreviousDay[] = [
  { dateLabel: "Yesterday, Jul 7", completedRatio: "0/12 goals completed" },
  { dateLabel: "Monday, Jul 6", completedRatio: "0/13 goals completed" },
  { dateLabel: "Sunday, Jul 5", completedRatio: "0/12 goals completed" },
  { dateLabel: "Saturday, Jul 4", completedRatio: "0/12 goals completed" },
  { dateLabel: "Friday, Jul 3", completedRatio: "0/10 goals completed" },
  { dateLabel: "Thursday, Jul 2", completedRatio: "0/12 goals completed" },
];

export default function PreviousGoalsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
    Alert.alert("Success", "Logged in successfully to sync progress!");
  };

  const handleDayPress = (day: PreviousDay) => {
    Alert.alert(
      day.dateLabel,
      `You completed ${day.completedRatio.split(" ")[0]} goals on this day.`
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Previous Goals</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48 }}>
        {/* Login Sync Banner */}
        {!isLoggedIn ? (
          <View style={[styles.loginCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
              <MaterialCommunityIcons name="account" size={32} color={colors.onSurfaceMuted} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.loginText, { color: colors.onSurface }]}>Login to sync your daily progress</Text>
              <Pressable 
                onPress={handleLogin}
                style={[styles.loginBtn, { borderColor: colors.onSurface }]}
              >
                <Text style={[styles.loginBtnText, { color: colors.onSurface }]}>Login</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[styles.loginCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.brand + "22" }]}>
              <MaterialCommunityIcons name="account-check" size={32} color={colors.brand} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.loginText, { color: colors.onSurface }]}>Connected &amp; Syncing Progress</Text>
              <Text style={{ fontSize: 12, color: colors.onSurfaceMuted, marginTop: 4 }}>Logged in as Guest</Text>
            </View>
          </View>
        )}

        {/* Section Header */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Recent Goals</Text>

        {/* Previous Days List */}
        <View style={[styles.listContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          {PREVIOUS_DAYS_MOCK.map((day, idx) => {
            const isLast = idx === PREVIOUS_DAYS_MOCK.length - 1;
            return (
              <Pressable
                key={day.dateLabel}
                onPress={() => handleDayPress(day)}
                style={({ pressed }) => [
                  styles.dayRow,
                  { borderBottomColor: colors.border, borderBottomWidth: isLast ? 0 : 1 },
                  pressed && { opacity: 0.7 }
                ]}
              >
                <View style={styles.dayIconCheck}>
                  <View style={[styles.circleBadge, { borderColor: colors.onSurfaceMuted }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dayTitle, { color: colors.onSurface }]}>{day.dateLabel}</Text>
                  <Text style={[styles.daySub, { color: colors.onSurfaceMuted }]}>{day.completedRatio}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
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
  },
  title: { fontSize: 18, fontWeight: "700" },
  loginCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  loginBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 24,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  loginBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  listContainer: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  dayIconCheck: {
    marginRight: 16,
  },
  circleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  daySub: {
    fontSize: 12,
    marginTop: 4,
  },
});
