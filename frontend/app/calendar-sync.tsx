import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import { useAuth } from "@/src/AuthContext";
import { getGoogleCalendarConnected, setGoogleCalendarConnected } from "@/src/storage";

const { width } = Dimensions.get("window");

export default function CalendarSyncScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isGuest, user } = useAuth();
  const [calendarConnected, setCalendarConnected] = useState(false);

  useEffect(() => {
    (async () => {
      const connected = await getGoogleCalendarConnected();
      setCalendarConnected(connected);
    })();
  }, []);

  const handleToggle = async (value: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    if (isGuest || !user) {
      Alert.alert(
        "Login Required",
        "Please sign in with your credentials to sync with Google Calendar.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/auth/login") }
        ]
      );
      return;
    }

    try {
      setCalendarConnected(value);
      await setGoogleCalendarConnected(value);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert(
        value ? "Connected" : "Disconnected",
        value 
          ? "Successfully connected to Google Calendar. Your prayer times will now sync automatically!" 
          : "Disconnected from Google Calendar."
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to update calendar sync settings.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Calendar Sync</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Toggle Card */}
        <View style={[styles.toggleCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Text style={[styles.toggleText, { color: colors.onSurface }]}>Sync with Google Calendar</Text>
          <Switch
            value={calendarConnected}
            onValueChange={handleToggle}
            trackColor={{ false: colors.border, true: colors.brand }}
            thumbColor={colors.surfaceSecondary}
          />
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: colors.onSurfaceMuted }]}>
          Syncing Athan with your Google Calendar seamlessly incorporates prayer times into your schedule, ensuring you prioritize spiritual commitments effortlessly.
        </Text>

        {/* Calendar Illustration Box */}
        <View style={[styles.illustrationCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          {/* Calendar Grid Header line */}
          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8, marginBottom: 8 }}>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeDay}>FRI</Text>
              <Text style={styles.dayBadgeNum}>14</Text>
            </View>
            <View style={{ flex: 1, paddingLeft: 12, justifyContent: "center" }}>
              <View style={{ height: 12, backgroundColor: colors.border, borderRadius: 6, width: "60%", marginBottom: 4 }} />
              <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, width: "40%" }} />
            </View>
          </View>

          {/* Time Slots grid with events */}
          <View style={{ gap: 12, paddingVertical: 4 }}>
            {/* Slot 1 PM */}
            <View style={styles.timeSlotRow}>
              <Text style={[styles.timeSlotHour, { color: colors.onSurfaceMuted }]}>1 pm</Text>
              <View style={[styles.eventBlock, { backgroundColor: "#0284c7" }]}>
                <Text style={styles.eventTitleText}>Daily Scrum</Text>
              </View>
            </View>

            {/* Slot 2 PM */}
            <View style={styles.timeSlotRow}>
              <Text style={[styles.timeSlotHour, { color: colors.onSurfaceMuted }]}>2 pm</Text>
              <View style={[styles.eventBlock, { backgroundColor: "#6366F1", marginTop: 4 }]}>
                <Text style={styles.eventTitleText}>Jummah Prayer</Text>
              </View>
            </View>

            {/* Slot 3 PM */}
            <View style={styles.timeSlotRow}>
              <Text style={[styles.timeSlotHour, { color: colors.onSurfaceMuted }]}>3 pm</Text>
              <View style={[styles.eventBlock, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
                <Text style={[styles.eventTitleText, { color: colors.onSurface }]}>Meeting with Ali Raza</Text>
              </View>
            </View>

            {/* Slot 4 PM */}
            <View style={styles.timeSlotRow}>
              <Text style={[styles.timeSlotHour, { color: colors.onSurfaceMuted }]}>4 pm</Text>
              <View style={[styles.eventBlock, { backgroundColor: "#6366F1" }]}>
                <Text style={styles.eventTitleText}>Asr Prayer</Text>
              </View>
            </View>

            {/* Slot 5 PM */}
            <View style={styles.timeSlotRow}>
              <Text style={[styles.timeSlotHour, { color: colors.onSurfaceMuted }]}>5 pm</Text>
              <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10 }} />
            </View>
          </View>

          {/* Overlapping Large Iconic Google Calendar Emblem */}
          <View style={styles.emblemContainer}>
            <View style={styles.calendarEmblem}>
              <View style={styles.calendarEmblemBlue}>
                <Text style={styles.calendarEmblemText}>31</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <Pressable
          onPress={() => handleToggle(!calendarConnected)}
          style={[styles.actionBtn, { backgroundColor: colors.brand }]}
        >
          <Text style={[styles.actionBtnText, { color: colors.onBrandPrimary }]}>
            {calendarConnected ? "Disconnect Google Calendar" : "Connect your Google Calendar"}
          </Text>
        </Pressable>
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
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    width: "100%",
    marginBottom: 20,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "700",
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "left",
    width: "100%",
    marginBottom: 24,
  },
  illustrationCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 32,
    position: "relative",
  },
  dayBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeDay: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "700",
  },
  dayBadgeNum: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 18,
  },
  timeSlotRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 40,
  },
  timeSlotHour: {
    width: 40,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    paddingTop: 4,
  },
  eventBlock: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
    justifyContent: "center",
  },
  eventTitleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  emblemContainer: {
    position: "absolute",
    right: 12,
    bottom: -16,
  },
  calendarEmblem: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  calendarEmblemBlue: {
    width: 40,
    height: 40,
    backgroundColor: "#4285F4",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarEmblemText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  actionBtn: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "800",
  },
});
