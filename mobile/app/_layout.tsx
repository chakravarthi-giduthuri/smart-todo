import '../src/lib/apiSetup';
import '../src/styles/global.css';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { TabVisibilityProvider } from '../src/contexts/TabVisibilityContext';
import { useNotifications } from '../src/hooks/useNotifications';
import { AnimatedSplash } from '../src/components/AnimatedSplash';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
    },
  },
});

function AppProviders() {
  useNotifications();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TabVisibilityProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </TabVisibilityProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  if (showSplash) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AnimatedSplash onFinish={() => setShowSplash(false)} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders />
    </GestureHandlerRootView>
  );
}
