import React, { createContext, useContext, useRef } from 'react';
import { Animated } from 'react-native';

interface TabScrollContextValue {
  /** Animated value: 0 = full-size tab bar, 1 = compact tab bar */
  compact: Animated.Value;
  /** Call from any scrollable screen with the current Y scroll offset */
  notifyScroll: (y: number) => void;
}

const TabScrollContext = createContext<TabScrollContextValue>({
  compact: new Animated.Value(0),
  notifyScroll: () => {},
});

export function TabScrollProvider({ children }: { children: React.ReactNode }) {
  const compact = useRef(new Animated.Value(0)).current;
  const prevY = useRef(0);

  const notifyScroll = (y: number) => {
    const shouldCompact = y > 80;
    const wasCompact = prevY.current > 80;
    prevY.current = y;
    if (shouldCompact === wasCompact) return;

    Animated.spring(compact, {
      toValue: shouldCompact ? 1 : 0,
      useNativeDriver: false,
      tension: 180,
      friction: 24,
    }).start();
  };

  return (
    <TabScrollContext.Provider value={{ compact, notifyScroll }}>
      {children}
    </TabScrollContext.Provider>
  );
}

export const useTabScroll = () => useContext(TabScrollContext);
