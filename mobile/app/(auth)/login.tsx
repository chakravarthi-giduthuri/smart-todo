import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  function startCooldown() {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: signUpEmail });
      if (error) throw error;
      startCooldown();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not resend email');
    } finally {
      setIsResending(false);
    }
  }

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
        setSignUpEmail(email);
        setAwaitingConfirmation(true);
        startCooldown();
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

  // ── Email confirmation waiting screen ─────────────────────────────────────
  if (awaitingConfirmation) {
    return (
      <View style={styles.root}>
        <View style={styles.inner}>
          <View style={styles.confirmIconWrap}>
            <Ionicons name="mail-outline" size={48} color="#ec5b13" />
          </View>
          <Text style={styles.confirmTitle}>Check your email</Text>
          <Text style={styles.confirmBody}>
            We sent a confirmation link to{'\n'}
            <Text style={styles.confirmEmail}>{signUpEmail}</Text>
          </Text>
          <Text style={styles.confirmHint}>
            Open the link in your email to activate your account, then come back to sign in.
          </Text>

          <TouchableOpacity
            onPress={handleResend}
            disabled={resendCooldown > 0 || isResending}
            activeOpacity={0.8}
            style={[styles.btn, (resendCooldown > 0 || isResending) && styles.btnDisabled]}
          >
            {isResending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
                </Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setAwaitingConfirmation(false); setIsSignUp(false); }}
            style={styles.toggleBtn}
          >
            <Text style={styles.toggleText}>
              Already confirmed? <Text style={styles.toggleLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
  // Confirmation screen
  confirmIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(236,91,19,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  confirmTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmBody: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  confirmEmail: {
    color: '#fff',
    fontWeight: '600',
  },
  confirmHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
});
