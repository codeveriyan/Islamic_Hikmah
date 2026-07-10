import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Image, 
  ScrollView, 
  TextInput, 
  Modal, 
  ActivityIndicator, 
  Alert 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { deleteUser } from "firebase/auth";
import { auth } from "@/src/firebase";
import * as Haptics from "expo-haptics";

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, logout, updateProfileInfo } = useAuth();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [name, setName] = useState(profile?.name || "");
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || "");
  const [updating, setUpdating] = useState(false);

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
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/auth/welcome");
          }
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()} 
          style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>User Profile</Text>
        <Pressable 
          onPress={() => {
            setName(profile?.name || "");
            setPhotoURL(profile?.photoURL || "");
            setEditModalVisible(true);
          }}
          style={[styles.editIconBtn, { backgroundColor: colors.surfaceSecondary }]}
        >
          <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.brand} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatarWrap, { borderColor: colors.brand }]}>
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.brand + "22" }]}>
                <Text style={[styles.avatarText, { color: colors.brand }]}>
                  {profile?.name?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.profileName, { color: colors.onSurface }]}>{profile?.name || "Islamic Hikmah User"}</Text>
          <Text style={[styles.profileEmail, { color: colors.onSurfaceSecondary }]}>{profile?.email}</Text>
          <View style={[styles.badge, { backgroundColor: colors.brand + "15" }]}>
            <Text style={[styles.badgeTxt, { color: colors.brand }]}>
              {profile?.status || "Active"} Session
            </Text>
          </View>
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
              <Text style={[styles.rowVal, { color: colors.onSurface }]}>Firebase Secure Auth</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <MaterialCommunityIcons name="cellphone-link" size={20} color={colors.onSurfaceMuted} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.onSurfaceMuted }]}>Active Session Device</Text>
              <Text style={[styles.rowVal, { color: colors.onSurface }]}>Current Mobile Device</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.btnOutlined,
              { borderColor: colors.border },
              pressed && { backgroundColor: colors.surfaceSecondary }
            ]}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#D32F2F" />
            <Text style={[styles.btnTxt, { color: "#D32F2F" }]}>Sign Out</Text>
          </Pressable>
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
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceSecondary }]}>Display Name</Text>
                <TextInput
                  style={[styles.input, { color: colors.onSurface, backgroundColor: colors.surface, borderColor: colors.border }]}
                  placeholder="Enter name"
                  placeholderTextColor={colors.onSurfaceMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Photo URL */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceSecondary }]}>Avatar Image URL</Text>
                <TextInput
                  style={[styles.input, { color: colors.onSurface, backgroundColor: colors.surface, borderColor: colors.border }]}
                  placeholder="Paste image URL (optional)"
                  placeholderTextColor={colors.onSurfaceMuted}
                  value={photoURL}
                  onChangeText={setPhotoURL}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setEditModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border } as any]}
              >
                <Text style={[styles.modalBtnTxt, { color: colors.onSurface } as any]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveProfile}
                disabled={updating}
                style={[styles.modalBtn, { backgroundColor: colors.brand } as any]}
              >
                {updating ? (
                  <ActivityIndicator color={colors.onBrandPrimary} />
                ) : (
                  <Text style={[styles.modalBtnTxt, { color: colors.onBrandPrimary } as any]}>Save</Text>
                )}
              </Pressable>
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
    gap: 24,
  },
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
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
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
});
