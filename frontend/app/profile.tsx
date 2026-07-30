import React, { useState, useEffect, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Image, 
  ScrollView, 
  Modal, 
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { deleteUser } from "firebase/auth";
import { auth } from "@/src/firebase";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AnimatedCard } from "@/src/components/AnimatedCard";
import { getQuranBookmarks, getHadithBookmarks } from "@/src/storage";
import {
  AppButton,
  AppIconButton,
  AppTextInput,
} from "@/src/components/ui";

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, isGuest, logout, updateProfileInfo } = useAuth();

  // ── Journey Stats State ──
  const [journeyStats, setJourneyStats] = useState({
    streak: 0, longestStreak: 0,
    prayersThisWeek: 0,
    pagesThisWeek: 0,
    totalBookmarks: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const today = new Date();
        // Streak
        const streakRaw = await AsyncStorage.getItem("hikmah:streak:v3");
        const sd = streakRaw ? JSON.parse(streakRaw) : { current: 0, longest: 0 };
        // Prayers this week
        let totalPrayed = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(today); d.setDate(d.getDate() - i);
          const key = `hikmah:prayed:${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          const raw = await AsyncStorage.getItem(key);
          if (raw) totalPrayed += JSON.parse(raw).length;
        }
        // Pages read this week
        let totalPages = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(today); d.setDate(d.getDate() - i);
          const key = `hikmah:quran-pages:${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          const raw = await AsyncStorage.getItem(key);
          if (raw) totalPages += parseInt(raw, 10);
        }
        // Bookmarks
        const [qBms, hBms] = await Promise.all([getQuranBookmarks(), getHadithBookmarks()]);
        setJourneyStats({
          streak: sd.current ?? 0,
          longestStreak: sd.longest ?? 0,
          prayersThisWeek: totalPrayed,
          pagesThisWeek: totalPages,
          totalBookmarks: qBms.length + hBms.length,
        });
      } catch {}
    })();
  }, []);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [name, setName] = useState(profile?.name || "");
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || "");
  const [updating, setUpdating] = useState(false);

  const openProfileEditor = () => {
    setName(profile?.name || "");
    setPhotoURL(profile?.photoURL || "");
    setEditModalVisible(true);
  };

  const chooseProfilePhoto = async (source: "camera" | "gallery") => {
    try {
      const permission = source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", `Please allow ${source === "camera" ? "camera" : "photo library"} access to select a profile photo.`);
        return;
      }
      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.82 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.82 });
      if (!result.canceled && result.assets[0]?.uri) setPhotoURL(result.assets[0].uri);
    } catch (err) {
      console.error("Failed to select profile photo:", err);
      Alert.alert("Error", "Unable to select profile photo. Please try again.");
    }
  };

  const handleSaveProfile = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (!name.trim()) return;

    setUpdating(true);
    try {
      await updateProfileInfo(name, photoURL || undefined);
      setEditModalVisible(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const performLogout = async () => {
      try {
        await logout();
        router.replace("/auth/welcome");
      } catch (error) {
        console.error("Sign out failed:", error);
        Alert.alert("Sign Out Failed", "Unable to sign out. Please try again.");
      }
    };

    if (isGuest) {
      await performLogout();
      return;
    }

    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to sign out?");
      if (confirmed) await performLogout();
      return;
    }

    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out",
          style: "destructive",
          onPress: performLogout,
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert(
      "Delete Account",
      "WARNING: This action is permanent and will completely delete your account. Are you sure you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Account", 
          style: "destructive",
          onPress: async () => {
            if (auth.currentUser) {
              try {
                await deleteUser(auth.currentUser);
                Alert.alert("Account Deleted", "Your account has been deleted successfully.");
                router.replace("/auth/welcome");
              } catch (err: any) {
                if (err.code === "auth/requires-recent-login") {
                  Alert.alert(
                    "Re-authentication Required",
                    "For security reasons, please log out, log back in, and try deleting your account again."
                  );
                } else {
                  Alert.alert("Error", "Failed to delete account. Please try again later.");
                }
              }
            }
          }
        }
      ]
    );
  };

  const joinedDate = profile?.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : "Recently Joined";

  // ── Trial countdown ────────────────────────────────────────────────────────
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    if (!profile?.trialActive) return;
    const interval = setInterval(() => setNowMs(Date.now()), 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [profile?.trialActive]);

  const trialCountdown = useMemo(() => {
    if (!profile?.trialActive || !profile?.trialStartedAt) return null;
    const trialEndsAt = profile.trialStartedAt + 7 * 24 * 60 * 60 * 1000;
    const msLeft = trialEndsAt - nowMs;
    if (msLeft <= 0) return { days: 0, hours: 0, label: 'Trial Expired', urgent: true };
    const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const urgent = days < 2;
    return { days, hours, label: days === 0 ? `${hours}h remaining` : `${days}d ${hours}h remaining`, urgent };
  }, [profile?.trialActive, profile?.trialStartedAt, nowMs]);
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppIconButton
          accessibilityLabel="Go back"
          icon="arrow-left"
          onPress={() => router.back()}
          variant="tonal"
        />
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>User Profile</Text>
        <AppIconButton
          accessibilityLabel="Edit profile"
          icon="pencil-outline"
          onPress={openProfileEditor}
          variant="tonal"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <Pressable
            onPress={openProfileEditor}
            accessibilityRole="button"
            accessibilityLabel="Edit profile picture and name"
            style={({ pressed }) => [styles.avatarWrap, { borderColor: colors.brand }, pressed && { opacity: 0.8 }]}
          >
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.brand + "22" }]}>
                <Text style={[styles.avatarText, { color: colors.brand }]}>
                  {profile?.name?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <View style={[styles.avatarEditBadge, { backgroundColor: colors.brand, borderColor: colors.surface }]}>
              <MaterialCommunityIcons name="camera-outline" size={15} color={colors.onBrandPrimary} />
            </View>
          </Pressable>
          <Pressable
            onPress={openProfileEditor}
            accessibilityRole="button"
            accessibilityLabel="Edit profile name"
            hitSlop={6}
          >
            <Text style={[styles.profileName, { color: colors.onSurface }]}>{profile?.name || "Islamic Hikmah User"}</Text>
          </Pressable>
          <Text style={[styles.profileEmail, { color: colors.onSurfaceSecondary }]}>{profile?.email}</Text>
          <View style={[styles.badge, { backgroundColor: colors.brand + "15" }]}>
            <Text style={[styles.badgeTxt, { color: colors.brand }]}>
              {profile?.status || "Active"} Session
            </Text>
          </View>
        </View>


        {/* ── Journey Stats Dashboard ── */}
        <Text style={[styles.sectionTitle, { color: colors.onSurfaceMuted, marginBottom: 10 }]}>MY JOURNEY</Text>
        <View style={styles.statsGrid}>
          {[
            { icon: 'fire', label: 'Streak', value: journeyStats.streak, unit: 'days', color: colors.warning },
            { icon: 'mosque', label: 'Prayers This Week', value: journeyStats.prayersThisWeek, unit: 'prayed', color: '#047857' },
            { icon: 'book-open-variant', label: 'Pages Read', value: journeyStats.pagesThisWeek, unit: 'this week', color: '#1D4ED8' },
            { icon: 'bookmark', label: 'Saved Items', value: journeyStats.totalBookmarks, unit: 'bookmarks', color: '#7C3AED' },
          ].map(stat => (
            <AnimatedCard
              key={stat.label}
              style={[styles.statCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
              <View style={[styles.statIconWrap, { backgroundColor: stat.color + '18' }]}>
                <MaterialCommunityIcons name={stat.icon as any} size={22} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.onSurface }]}>{stat.value}</Text>
              <Text style={[styles.statUnit, { color: colors.onSurfaceMuted }]}>{stat.unit}</Text>
              <Text style={[styles.statLabel, { color: colors.onSurfaceMuted }]}>{stat.label}</Text>
            </AnimatedCard>
          ))}
        </View>

        {/* Info Rows */}
        <View style={[styles.section, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurfaceMuted }]}>ACCOUNT DETAILS</Text>
          
          <View style={styles.row}>
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.onSurfaceMuted} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.onSurfaceMuted }]}>Member Since</Text>
              <Text style={[styles.rowVal, { color: colors.onSurface }]}>{joinedDate}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.onSurfaceMuted} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.onSurfaceMuted }]}>Security Provider</Text>
              <Text style={[styles.rowVal, { color: colors.onSurface }]}>
                {isGuest ? "Local Guest Mode" : "Firebase Secure Auth"}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <MaterialCommunityIcons name="cellphone-link" size={20} color={colors.onSurfaceMuted} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.onSurfaceMuted }]}>Active Session Device</Text>
              <Text style={[styles.rowVal, { color: colors.onSurface }]}>
                {Platform.OS === "web" ? "Current Browser" : "Current Mobile Device"}
              </Text>
            </View>
          </View>
        </View>

        {/* Subscription Status Card */}
        <View style={[styles.subscriptionCard, {
          backgroundColor: profile?.tier === 'premium'
            ? 'rgba(212,175,55,0.10)'
            : profile?.trialActive
              ? 'rgba(39,174,96,0.10)'
              : 'rgba(108,117,125,0.08)',
          borderColor: profile?.tier === 'premium'
            ? colors.gold
            : profile?.trialActive
              ? '#27ae60'
              : colors.border,
        }]}>
          {profile?.tier === 'premium' ? (
            // ─── PREMIUM user ────────────────────────────────────────────────
            <Pressable
              onPress={() => router.push('/premium')}
              accessibilityRole="button"
              accessibilityLabel="Open premium access page"
              style={({ pressed }) => [styles.subscriptionRow, pressed && { opacity: 0.75 }]}
            >
                <Text style={styles.subscriptionCrown}>👑</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subscriptionTitle, { color: colors.gold }]}>Premium Member</Text>
                  <Text style={[styles.subscriptionSub, { color: colors.onSurfaceMuted }]}>Full access to all premium features</Text>
                </View>
                <View style={[styles.subscriptionBadge, { backgroundColor: colors.gold }]}>
                  <Text style={styles.subscriptionBadgeTxt}>PREMIUM</Text>
                </View>
            </Pressable>
          ) : profile?.trialActive && trialCountdown ? (
            // ─── TRIAL user ──────────────────────────────────────────────────
            <>
              <View style={styles.subscriptionRow}>
                <Text style={styles.subscriptionCrown}>⏳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subscriptionTitle, { color: trialCountdown.urgent ? '#e74c3c' : '#27ae60' }]}>Free Trial Active</Text>
                  <Text style={[styles.subscriptionSub, { color: colors.onSurfaceMuted }]}>Enjoying full premium access</Text>
                </View>
                <View style={[styles.subscriptionBadge, { backgroundColor: trialCountdown.urgent ? '#e74c3c' : '#27ae60' }]}>
                  <Text style={styles.subscriptionBadgeTxt}>{trialCountdown.urgent ? '⚠️ URGENT' : 'TRIAL'}</Text>
                </View>
              </View>
              <View style={[styles.countdownBox, { borderColor: trialCountdown.urgent ? '#e74c3c40' : '#27ae6040', backgroundColor: trialCountdown.urgent ? 'rgba(231,76,60,0.08)' : 'rgba(39,174,96,0.08)' }]}>
                <Text style={[styles.countdownEmoji]}>{trialCountdown.days === 0 ? '🔴' : trialCountdown.urgent ? '🟡' : '🟢'}</Text>
                <View>
                  <Text style={[styles.countdownTime, { color: trialCountdown.urgent ? '#e74c3c' : '#27ae60' }]}>{trialCountdown.label}</Text>
                  <Text style={[styles.countdownNote, { color: colors.onSurfaceMuted }]}>{trialCountdown.urgent ? 'Upgrade now to keep your access!' : 'Trial ends — upgrade to continue'}</Text>
                </View>
              </View>
              <AppButton
                fullWidth
                icon="crown"
                label="Upgrade to premium"
                onPress={() => router.push('/premium')}
              />
            </>
          ) : (
            // ─── FREE user ───────────────────────────────────────────────────
            <>
              <View style={styles.subscriptionRow}>
                <Text style={styles.subscriptionCrown}>🔓</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subscriptionTitle, { color: colors.onSurface }]}>Free Plan</Text>
                  <Text style={[styles.subscriptionSub, { color: colors.onSurfaceMuted }]}>Start a 7-day trial to unlock all features</Text>
                </View>
                <View style={[styles.subscriptionBadge, { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }]}>
                  <Text style={[styles.subscriptionBadgeTxt, { color: colors.onSurfaceMuted }]}>FREE</Text>
                </View>
              </View>
              <AppButton
                fullWidth
                icon="crown"
                label="Start free trial or buy premium"
                onPress={() => router.push('/premium')}
              />
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <AppButton
            fullWidth
            icon={isGuest ? "login" : "logout"}
            label={isGuest ? "Sign in or create account" : "Sign out"}
            onPress={handleLogout}
            variant={isGuest ? "outlined" : "danger"}
          />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Edit Profile</Text>

            <View style={styles.modalForm}>
              {/* Name */}
              <AppTextInput
                label="Display name"
                leadingIcon="account-outline"
                onChangeText={setName}
                placeholder="Enter name"
                value={name}
              />

              {/* Profile photo */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceSecondary }]}>Profile Photo</Text>
                {photoURL ? <Image source={{ uri: photoURL }} style={styles.photoPreview} /> : null}
                <View style={styles.photoActions}>
                  <Pressable onPress={() => chooseProfilePhoto("camera")} style={[styles.photoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <MaterialCommunityIcons name="camera-outline" size={22} color={colors.brand} />
                    <Text style={[styles.photoBtnText, { color: colors.onSurface }]}>Camera</Text>
                  </Pressable>
                  <Pressable onPress={() => chooseProfilePhoto("gallery")} style={[styles.photoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <MaterialCommunityIcons name="image-multiple-outline" size={22} color={colors.brand} />
                    <Text style={[styles.photoBtnText, { color: colors.onSurface }]}>Gallery</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <AppButton
                label="Cancel"
                onPress={() => setEditModalVisible(false)}
                style={styles.modalButton}
                variant="outlined"
              />
              <AppButton
                label="Save"
                loading={updating}
                onPress={handleSaveProfile}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  editIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 20,
  },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4,
  },
  statCard: {
    width: '47.5%', borderRadius: 16, borderWidth: 0.5,
    padding: 14, alignItems: 'center', gap: 4,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  statValue: { fontSize: 26, fontWeight: '800', fontFamily: 'Outfit_600SemiBold' },
  statUnit: { fontSize: 10, fontFamily: 'Figtree_400Regular', fontWeight: '600' },
  statLabel: { fontSize: 11, fontFamily: 'Figtree_400Regular', textAlign: 'center', marginTop: 2 },
  profileCard: {
    alignItems: "center",

    gap: 8,
    marginTop: 10,
  },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    padding: 3,
    marginBottom: 8,
    position: "relative",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 47,
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 47,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "800",
  },
  avatarEditBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "800",
  },
  profileEmail: {
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    marginTop: 4,
  },
  badgeTxt: {
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  rowVal: {
    fontSize: 15,
    fontWeight: "600",
  },
  divider: {
    height: 1,
  },
  actionSection: {
    gap: 12,
    marginTop: 10,
    alignItems: "center",
  },
  btnOutlined: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    width: "100%",
  },
  btnTxt: {
    fontSize: 16,
    fontWeight: "700",
  },
  btnTextLink: {
    padding: 8,
    marginTop: 8,
  },
  deleteTxt: {
    color: "#D32F2F",
    fontSize: 13,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    gap: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  modalForm: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  photoPreview: { width: 82, height: 82, borderRadius: 41, alignSelf: "center", marginVertical: 4 },
  photoActions: { flexDirection: "row", gap: 12 },
  photoBtn: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  photoBtnText: { fontSize: 14, fontWeight: "700" },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
  },
  modalBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnTxt: {
    fontSize: 16,
    fontWeight: "700",
  },

  // ── Subscription Status Card ─────────────────────────────────────────────
  subscriptionCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 18,
    gap: 14,
  },
  subscriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subscriptionCrown: {
    fontSize: 28,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  subscriptionSub: {
    fontSize: 12,
    fontWeight: "500",
  },
  subscriptionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  subscriptionBadgeTxt: {
    fontSize: 10,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.6,
  },
  countdownBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  countdownEmoji: {
    fontSize: 22,
  },
  countdownTime: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 2,
  },
  countdownNote: {
    fontSize: 12,
    fontWeight: "500",
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#D4AF37',
  },
  upgradeBtnTxt: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
});
