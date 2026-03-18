import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('Check your email', 'Confirm your email to continue.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#080810' }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <View style={{
            width: 64, height: 64, borderRadius: 20,
            backgroundColor: '#ec5b13', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 28 }}>✓</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
            Smart To-Do
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', marginTop: 6, fontSize: 15 }}>
            AI-powered task manager
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: 12 }}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 14, padding: 16,
              color: '#fff', fontSize: 16,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
            }}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.3)"
            secureTextEntry
            autoCapitalize="none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 14, padding: 16,
              color: '#fff', fontSize: 16,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
            }}
          />
          <Pressable
            onPress={handleSubmit}
            disabled={isLoading || !email.trim() || !password.trim()}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#d4520f' : '#ec5b13',
              borderRadius: 14, padding: 16,
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', marginTop: 4, alignSelf: 'stretch',
              opacity: isLoading || !email.trim() || !password.trim() ? 0.5 : 1,
            })}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
            }
          </Pressable>
        </View>

        <Pressable onPress={() => setIsSignUp(v => !v)} style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <Text style={{ color: '#ec5b13', fontWeight: '600' }}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
