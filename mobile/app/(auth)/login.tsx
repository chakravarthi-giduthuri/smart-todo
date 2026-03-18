import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const isDisabled = isLoading || !email.trim() || !password.trim() || (isSignUp && !name.trim());

  async function handleSubmit() {
    if (isDisabled) return;
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() } },
        });
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
      style={styles.root}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Text style={styles.logoCheck}>✓</Text>
          </View>
          <Text style={styles.appName}>Smart To-Do</Text>
          <Text style={styles.appSub}>AI-powered task manager</Text>
        </View>

        {/* Inputs */}
        {isSignUp && (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="words"
            autoComplete="name"
            style={[styles.input, styles.inputSpacing]}
          />
        )}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={[styles.input, isSignUp && styles.inputSpacing]}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="rgba(255,255,255,0.3)"
          secureTextEntry
          autoCapitalize="none"
          style={[styles.input, styles.inputSpacing]}
        />

        {/* Submit button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isDisabled}
          activeOpacity={0.8}
          style={[styles.btn, isDisabled && styles.btnDisabled]}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
          }
        </TouchableOpacity>

        {/* Toggle sign-in / sign-up */}
        <TouchableOpacity onPress={() => { setIsSignUp(v => !v); setName(''); }} style={styles.toggleBtn}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <Text style={styles.toggleLink}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080810',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  // Logo
  logoWrap: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#ec5b13',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoCheck: { fontSize: 28, color: '#fff' },
  appName: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  appSub: { color: 'rgba(255,255,255,0.4)', marginTop: 6, fontSize: 15 },
  // Inputs
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputSpacing: { marginTop: 12 },
  // Button
  btn: {
    backgroundColor: '#ec5b13',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  btnDisabled: { backgroundColor: 'rgba(236,91,19,0.4)' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  // Toggle
  toggleBtn: { marginTop: 20, alignItems: 'center' },
  toggleText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  toggleLink: { color: '#ec5b13', fontWeight: '600' },
});
