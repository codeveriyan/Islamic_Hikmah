import React, { createContext, useContext, useCallback } from "react";
import { NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useSharedValue, SharedValue, useAnimatedScrollHandler } from "react-native-reanimated";

interface TabBarVisibilityContextType {
  isTabBarVisible: SharedValue<boolean>;
  hideTabBar: () => void;
  showTabBar: () => void;
  /**
   * UI-thread scroll handler (Reanimated). Attach it to an Animated.ScrollView
   * as its `onScroll` prop — all hide/show logic then runs on the UI thread
   * with zero JS-thread work per frame, which is what makes scroll feel native.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrollHandler: (event: any) => void;
  /** @deprecated JS-thread handler kept for screens not yet migrated to `scrollHandler`. Prefer `scrollHandler` on an Animated.ScrollView. */
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** @deprecated only needed with the legacy JS-thread `onScroll`. */
  onScrollEndDrag: () => void;
  /** @deprecated only needed with the legacy JS-thread `onScroll`. */
  onMomentumScrollEnd: () => void;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityContextType | null>(null);

const HIDE_THRESHOLD = 5;
const SHOW_THRESHOLD = -15;
const TOP_OFFSET = 10;

export function TabBarVisibilityProvider({ children }: { children: React.ReactNode }) {
  const isTabBarVisible = useSharedValue<boolean>(true);
  const lastScrollY = useSharedValue<number>(0);

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

  // All scroll math runs on the UI thread — previously this fired ~60 JS
  // callbacks/sec (with setTimeout/clearTimeout churn) during every scroll.
  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag: (e) => {
      // Reset the reference point so switching screens can't cause a jump
      lastScrollY.value = e.contentOffset.y;
    },
    onScroll: (e) => {
      const y = e.contentOffset.y;
      const diff = y - lastScrollY.value;
      if (y <= TOP_OFFSET) {
        isTabBarVisible.value = true;
      } else if (diff > HIDE_THRESHOLD) {
        isTabBarVisible.value = false;
      } else if (diff < SHOW_THRESHOLD) {
        isTabBarVisible.value = true;
      }
      lastScrollY.value = y;
    },
    onEndDrag: (e) => {
      // Finger lifted without momentum → scroll is done, bring the bar back
      if (!e.velocity || e.velocity.y === 0) {
        isTabBarVisible.value = true;
      }
    },
    onMomentumEnd: () => {
      isTabBarVisible.value = true;
    },
  });

  // ── Legacy JS-thread handlers (deprecated, kept for unmigrated screens) ────
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const diff = y - lastScrollY.value;
    if (y <= TOP_OFFSET) {
      showTabBar();
    } else if (diff > HIDE_THRESHOLD) {
      hideTabBar();
    } else if (diff < SHOW_THRESHOLD) {
      showTabBar();
    }
    lastScrollY.value = y;
  }, [hideTabBar, showTabBar, lastScrollY]);

  const onScrollEndDrag = useCallback(() => {
    showTabBar();
  }, [showTabBar]);

  const onMomentumScrollEnd = useCallback(() => {
    showTabBar();
  }, [showTabBar]);

  return (
    <TabBarVisibilityContext.Provider
      value={{
        isTabBarVisible,
        hideTabBar,
        showTabBar,
        scrollHandler,
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
  // Hooks must always run in the same order — never after an early return.
  const fallbackVisible = useSharedValue<boolean>(true);
  const fallbackScrollHandler = useAnimatedScrollHandler({});

  if (!context) {
    return {
      isTabBarVisible: fallbackVisible,
      hideTabBar: () => {},
      showTabBar: () => {},
      scrollHandler: fallbackScrollHandler,
      onScroll: () => {},
      onScrollEndDrag: () => {},
      onMomentumScrollEnd: () => {},
    };
  }
  return context;
}
