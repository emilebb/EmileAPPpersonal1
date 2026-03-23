import React, { useState } from 'react';
import { StyleSheet, View, Text, AppState, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function LoginScreen() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const router = useRouter();

  async function handleAuth() {
    if (!email || !password) {
      alert('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);

    if (isLoginView) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else router.replace('/');
    } else {
      if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden.');
        setLoading(false);
        return;
      }

      const { data: { session }, error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else if (!session) alert('¡Revisa tu bandeja de entrada para verificar tu correo!');
      else router.replace('/');
    }

    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.backgroundOrb1} />
        <View style={styles.backgroundOrb2} />
        
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="cube" size={48} color="#38bdf8" />
            </View>
            <Text style={styles.logoText}>VAULT</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconBadge}>
                <Ionicons name={isLoginView ? "lock-closed" : "person-add"} size={24} color="#38bdf8" />
              </View>
              <Text style={styles.title}>{isLoginView ? 'Welcome Back' : 'Create Account'}</Text>
              <Text style={styles.subtitle}>
                {isLoginView 
                  ? 'Sign in to access your vault' 
                  : 'Start managing your inventory today'}
              </Text>
            </View>

            <View style={styles.formGroup}>
              <View style={[
                styles.inputContainer, 
                focusedInput === 'email' && styles.inputContainerFocused
              ]}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="mail" size={20} color={focusedInput === 'email' ? '#38bdf8' : '#64748b'} />
                </View>
                <TextInput
                  style={styles.input}
                  onChangeText={setEmail}
                  value={email}
                  placeholder="Email address"
                  placeholderTextColor="#64748b"
                  autoCapitalize={'none'}
                  keyboardType="email-address"
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View style={[
                styles.inputContainer, 
                focusedInput === 'password' && styles.inputContainerFocused
              ]}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="key" size={20} color={focusedInput === 'password' ? '#38bdf8' : '#64748b'} />
                </View>
                <TextInput
                  style={styles.input}
                  onChangeText={setPassword}
                  value={password}
                  secureTextEntry={true}
                  placeholder="Password"
                  placeholderTextColor="#64748b"
                  autoCapitalize={'none'}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              {!isLoginView && (
                <View style={[
                  styles.inputContainer, 
                  focusedInput === 'confirm' && styles.inputContainerFocused
                ]}>
                  <View style={styles.inputIconWrapper}>
                    <Ionicons name="key-outline" size={20} color={focusedInput === 'confirm' ? '#38bdf8' : '#64748b'} />
                  </View>
                  <TextInput
                    style={styles.input}
                    onChangeText={setConfirmPassword}
                    value={confirmPassword}
                    secureTextEntry={true}
                    placeholder="Confirm Password"
                    placeholderTextColor="#64748b"
                    autoCapitalize={'none'}
                    onFocus={() => setFocusedInput('confirm')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              )}

              <TouchableOpacity 
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]} 
                disabled={loading} 
                onPress={handleAuth}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? 'Loading...' : (isLoginView ? 'Sign In' : 'Create Account')}
                </Text>
                {!loading && <Ionicons name="arrow-forward" size={20} color="#0f172a" style={styles.btnIcon} />}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
              
              <TouchableOpacity 
                style={styles.socialBtn} 
                onPress={() => setIsLoginView(!isLoginView)}
                activeOpacity={0.7}
              >
                <Ionicons name={isLoginView ? "person-add-outline" : "log-in-outline"} size={20} color="#f8fafc" />
                <Text style={styles.socialBtnText}>
                  {isLoginView ? 'Create New Account' : 'Sign In Instead'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footerText}>
            By continuing, you agree to our Terms & Privacy
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#09090b',
  },
  keyboardView: {
    flex: 1,
  },
  backgroundOrb1: {
    position: 'absolute',
    top: -200,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    blurRadius: 100,
  },
  backgroundOrb2: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
    blurRadius: 80,
  },
  content: { 
    flex: 1, 
    padding: 24, 
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 8,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#f8fafc', 
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: { 
    fontSize: 14, 
    color: '#64748b', 
    textAlign: 'center',
    lineHeight: 20,
  },
  formGroup: { 
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 14,
    transition: 'all 0.2s ease',
  },
  inputContainerFocused: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputIcon: {
    marginRight: 0,
  },
  input: { 
    flex: 1, 
    color: '#f8fafc', 
    fontSize: 16,
    fontWeight: '500',
  },
  primaryBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: { 
    color: '#09090b', 
    fontSize: 16, 
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnIcon: {
    marginLeft: 8,
  },
  footer: { 
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  dividerText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  socialBtnText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  footerText: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    letterSpacing: 0.3,
  },
});
