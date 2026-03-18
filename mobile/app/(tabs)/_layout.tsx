import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { FloatingTabBar } from '../../src/components/FloatingTabBar';
import { useAuth } from '../../src/contexts/AuthContext';

export default function TabsLayout() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/(auth)/login');
    }
  }, [session, isLoading]);

  if (isLoading || !session) return null;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index"     options={{ title: 'Home' }} />
      <Tabs.Screen name="calendar"  options={{ title: 'Calendar' }} />
      <Tabs.Screen name="timeline"  options={{ href: null }} />
      <Tabs.Screen name="dashboard" options={{ title: 'Stats' }} />
      <Tabs.Screen name="plan"      options={{ href: null }} />
      <Tabs.Screen name="templates" options={{ title: 'Templates' }} />
      <Tabs.Screen name="settings"  options={{ title: 'Settings' }} />
    </Tabs>
  );
}
