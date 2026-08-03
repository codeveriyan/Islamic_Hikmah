import React, { createContext, useContext, useRef, useCallback } from "react";
import { NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useSharedValue, withTiming, SharedValue } from "react-native-reanimated";

interface TabBarVisibilityContextType {
  isTabBarVisible: SharedValue<boolean>;
  hideTabBar: () => void;
  showTabBar: () => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollEndDrag: () => void;
  onMomentumScrollEnd: () => void;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityContextType | null>(null);

export function TabBarVisibilityProvider({ children }: { children: React.ReactNode }) {
  const isTabBarVisible = useSharedValue<boolean>(true);
  const lastScrollY = useRef<number>(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideTabBar = useCallback(() => {
    if (isTabBarVisible.value) {
      isTabBarVisible.value = false;
    }
  }, [isTabBarVisible]);

  const showTabBar = useCallback(() => {
    if (!isTabBarVisible.value) {
      isTabBarVisible.value = true;
    }
  }, [isTabBarVisible]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;
    
    // Ignore small jitter near top
    if (currentY <= 10) {
      showTabBar();
      lastScrollY.current = currentY;
      return;
    }

    // If scrolling down by more than 5px, hide tab bar
    if (diff > 5 && isTabBarVisible.value) {
      hideTabBar();
    } else if (diff < -15 && !isTabBarVisible.value) {
      // If scrolling up significantly, show tab bar early
      showTabBar();
    }

    lastScrollY.current = currentY;

    // Reset idle timer — when scroll stops for 350ms, show tab bar
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      showTabBar();
    }, 350);
  }, [hideTabBar, showTabBar, isTabBarVisible]);

  const onScrollEndDrag = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      showTabBar();
    }, 150);
  }, [showTabBar]);

  const onMomentumScrollEnd = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    showTabBar();
  }, [showTabBar]);

  return (
    <TabBarVisibilityContext.Provider
      value={{
        isTabBarVisible,
        hideTabBar,
        showTabBar,
        onScroll,
        onScrollEndDrag,
        onMomentumScrollEnd,
      }}
    >
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility() {
  const context = useContext(TabBarVisibilityContext);
  if (!context) {
    // Fallback if used outside provider
    const dummyValue = useSharedValue<boolean>(true);
    return {
      isTabBarVisible: dummyValue,
      hideTabBar: () => {},
      showTabBar: () => {},
      onScroll: () => {},
      onScrollEndDrag: () => {},
      onMomentumScrollEnd: () => {},
    };
  }
  return context;
}
