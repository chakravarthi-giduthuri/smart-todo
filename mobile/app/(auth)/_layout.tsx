import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AuthLayout() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
