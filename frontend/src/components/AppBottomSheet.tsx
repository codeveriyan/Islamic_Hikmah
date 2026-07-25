import React, { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useTheme } from "@/src/ThemeContext";

export type AppBottomSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  title?: string;
  scrollable?: boolean;
  onClose?: () => void;
};

/**
 * Standardised bottom sheet for the entire app.
 * Replaces React Native Modal for all action sheets and forms.
 *
 * Usage:
 *   const sheetRef = useRef<AppBottomSheetRef>(null);
 *   <AppBottomSheet ref={sheetRef} title="Prayer Times">...</AppBottomSheet>
 *   sheetRef.current?.open();
 */
export const AppBottomSheet = forwardRef<AppBottomSheetRef, Props>(
  ({ children, snapPoints: customSnaps, title, scrollable = false, onClose }, ref) => {
    const { colors, mode } = useTheme();
    const bsRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => customSnaps ?? ["50%", "85%"], [customSnaps]);

    useImperativeHandle(ref, () => ({
      open: () => bsRef.current?.snapToIndex(0),
      close: () => bsRef.current?.close(),
    }));

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.55}
        />
      ),
      []
    );

    const handleStyle = { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.onSurfaceMuted + "66", alignSelf: "center" as const, marginVertical: 8 };

    const ContentWrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

    return (
      <BottomSheet
        ref={bsRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={onClose}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={handleStyle}
        backgroundStyle={{ backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      >
        <ContentWrapper style={{ flex: 1 }}>
          {title && (
            <View style={[s.header, { borderBottomColor: colors.border }]}>
              <Text style={[s.title, { color: colors.onSurface }]}>{title}</Text>
              <TouchableOpacity onPress={() => bsRef.current?.close()} hitSlop={12}>
                <Text style={{ color: colors.onSurfaceMuted, fontSize: 22, lineHeight: 24 }}>×</Text>
              </TouchableOpacity>
            </View>
          )}
          {children}
        </ContentWrapper>
      </BottomSheet>
    );
  }
);

AppBottomSheet.displayName = "AppBottomSheet";

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  title: {
    fontSize: 17,
    fontFamily: "Outfit_600SemiBold",
    fontWeight: "700",
  },
});
