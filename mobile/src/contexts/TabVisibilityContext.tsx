import React, { createContext, useContext, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

interface TabVisibilityContextValue {
  /** 1 = visible, 0 = hidden — useNativeDriver:true (transform/opacity only) */
  tabAnim: Animated.Value;
  /** 1 = visible, 0 = hidden — useNativeDriver:false (layout props like bottom) */
  tabAnimLayout: Animated.Value;
  hideTabBar: () => void;
  showTabBar: () => void;
  scheduleShow: (delayMs?: number) => void;
}

const TabVisibilityContext = createContext<TabVisibilityContextValue>({
  tabAnim: new Animated.Value(1),
  tabAnimLayout: new Animated.Value(1),
  hideTabBar: () => {},
  showTabBar: () => {},
  scheduleShow: () => {},
});

export function TabVisibilityProvider({ children }: { children: React.ReactNode }) {
  const tabAnim = useRef(new Animated.Value(1)).current;
  const tabAnimLayout = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHidden = useRef(false);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const hideTabBar = useCallback(() => {
    clearTimer();
    if (isHidden.current) return;
    isHidden.current = true;
    Animated.timing(tabAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
    Animated.timing(tabAnimLayout, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [tabAnim, tabAnimLayout]);

  const showTabBar = useCallback(() => {
    clearTimer();
    if (!isHidden.current) return;
    isHidden.current = false;
    Animated.spring(tabAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 140,
      friction: 20,
    }).start();
    Animated.spring(tabAnimLayout, {
      toValue: 1,
      useNativeDriver: false,
      tension: 140,
      friction: 20,
    }).start();
  }, [tabAnim, tabAnimLayout]);

  const scheduleShow = useCallback(
    (delayMs = 600) => {
      clearTimer();
      timerRef.current = setTimeout(() => showTabBar(), delayMs);
    },
    [showTabBar],
  );

  return (
    <TabVisibilityContext.Provider value={{ tabAnim, tabAnimLayout, hideTabBar, showTabBar, scheduleShow }}>
      {children}
    </TabVisibilityContext.Provider>
  );
}

export const useTabVisibility = () => useContext(TabVisibilityContext);
