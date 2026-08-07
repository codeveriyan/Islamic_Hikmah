import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet, Modal, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/ThemeContext';
import { useRouter } from 'expo-router';

export type ActionBarProps = {
  isFav?: boolean;
  toggleFav?: () => void;
  isBm?: boolean;
  toggleBm?: () => void;
  onShare?: () => void;
  onTextSize?: () => void;
};

export function ActionBar({ isFav, toggleFav, isBm, toggleBm, onShare, onTextSize }: ActionBarProps) {
  const [visible, setVisible] = useState(false);
  const { colors, mode } = useTheme();
  const router = useRouter();

  const btnBg = mode === "dark" ? "rgba(255,255,255,0.08)" : "#F1F5F9";

  return (
    <View style={{ position: 'relative' }}>
      <Pressable onPress={() => setVisible(true)} hitSlop={10} style={{ padding: 4 }}>
        <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.onSurface} />
      </Pressable>

      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: Platform.OS === 'web' ? 'transparent' : 'rgba(0,0,0,0.1)' }}
          onPress={() => setVisible(false)}
        >
          <Pressable style={[styles.popover, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
             {/* 1. Tt */}
             <Pressable
               style={[styles.actionBtn, { backgroundColor: btnBg, opacity: onTextSize ? 1 : 0.4 }]}
               onPress={() => { if (onTextSize) { onTextSize(); setVisible(false); } }}
               disabled={!onTextSize}
             >
               <Text style={[styles.ttIcon, { color: colors.brand }]}>Tt</Text>
             </Pressable>

             {/* 2. Heart */}
             <Pressable
               style={[styles.actionBtn, { backgroundColor: btnBg, opacity: toggleFav ? 1 : 0.4 }]}
               onPress={() => { if (toggleFav) { toggleFav(); setVisible(false); } }}
               disabled={!toggleFav}
             >
               <MaterialCommunityIcons name={isFav ? "heart" : "heart-outline"} size={22} color={isFav ? "#EF4444" : colors.onSurfaceMuted} />
             </Pressable>

             {/* 3. Bookmark */}
             <Pressable
               style={[styles.actionBtn, { backgroundColor: btnBg, opacity: toggleBm ? 1 : 0.4 }]}
               onPress={() => { if (toggleBm) { toggleBm(); setVisible(false); } }}
               disabled={!toggleBm}
             >
               <MaterialCommunityIcons name={isBm ? "bookmark" : "bookmark-outline"} size={22} color={isBm ? colors.brand : colors.onSurfaceMuted} />
             </Pressable>

             {/* 4. Share */}
             <Pressable
               style={[styles.actionBtn, { backgroundColor: btnBg, opacity: onShare ? 1 : 0.4 }]}
               onPress={() => { if (onShare) { onShare(); setVisible(false); } }}
               disabled={!onShare}
             >
               <MaterialCommunityIcons name="share-variant-outline" size={22} color={colors.onSurfaceMuted} />
             </Pressable>

             {/* 5. Home */}
             <Pressable style={[styles.actionBtn, { backgroundColor: btnBg }]} onPress={() => { setVisible(false); router.replace("/(tabs)"); }}>
               <MaterialCommunityIcons name="home-outline" size={22} color={colors.onSurfaceMuted} />
             </Pressable>

             {/* 6. Settings */}
             <Pressable style={[styles.actionBtn, { backgroundColor: btnBg }]} onPress={() => { setVisible(false); router.push("/quran/personalise" as any); }}>
               <MaterialCommunityIcons name="cog-outline" size={22} color={colors.onSurfaceMuted} />
             </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  popover: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 60,
    right: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 200,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ttIcon: {
    fontSize: 16,
    fontWeight: "700",
  },
});
