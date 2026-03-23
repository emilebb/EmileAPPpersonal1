import React, { useState } from 'react';
import { StyleSheet, View, Text, AppState, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

const features = [
  { icon: 'cube', label: 'Gestiona inventario' },
  { icon: 'receipt', label: 'Registra ventas' },
  { icon: 'cloud', label: 'Sincronizacion' },
];

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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.backgroundOrb1} />
          <View style={styles.backgroundOrb2} />
          
          <View style={styles.content}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Image 
                    source={require('@/assets/images/logo.png')} 
                    style={styles.logoImage}
                    contentFit="contain"
                  />
                </View>
              </View>
              
              <Text style={styles.heroTitle}>VAULT</Text>
              <Text style={styles.heroSubtitle}>
                Sistema de inventario y ventas{'\n'}en la palma de tu mano
              </Text>
              
              {/* Feature Pills */}
              <View style={styles.featurePills}>
                {features.map((feature, index) => (
                  <View key={index} style={styles.featurePill}>
                    <Ionicons name={feature.icon as any} size={14} color="#38bdf8" />
                    <Text style={styles.featurePillText}>{feature.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Auth Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {isLoginView ? 'Inicia sesion' : 'Crea tu cuenta'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {isLoginView 
                  ? 'Accede a tu panel' 
                  : 'Empieza gratis en segundos'}
              </Text>

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
                    placeholder="Email"
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
                    placeholder="Contraseña"
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
                      placeholder="Confirmar pass"
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
                    {loading ? 'Cargando...' : (isLoginView ? 'Entrar' : 'Crear Cuenta Gratis')}
                  </Text>
                  {!loading && <Ionicons name="arrow-forward" size={20} color="#09090b" style={styles.btnIcon} />}
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity 
                  style={styles.switchBtn} 
                  onPress={() => setIsLoginView(!isLoginView)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchBtnText}>
                    No tienes cuenta?
                  </Text>
                  <Text style={styles.switchBtnLink}>
                    {isLoginView ? ' Registrate' : ' Inicia sesion'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Trust Badges */}
            <View style={styles.trustBadges}>
              <View style={styles.trustBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#4ade80" />
                <Text style={styles.trustBadgeText}>Datos seguros</Text>
              </View>
              <View style={styles.trustBadge}>
                <Ionicons name="cloud-done" size={16} color="#4ade80" />
                <Text style={styles.trustBadgeText}>Sincronización</Text>
              </View>
              <View style={styles.trustBadge}>
                <Ionicons name="phone-portrait" size={16} color="#4ade80" />
                <Text style={styles.trustBadgeText}>Multi-dispositivo</Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  backgroundOrb1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    blurRadius: 100,
  },
  backgroundOrb2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(74, 222, 128, 0.06)',
    blurRadius: 80,
  },
  content: { 
    padding: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    overflow: 'hidden',
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 6,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featurePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    gap: 6,
  },
  featurePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38bdf8',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 28,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  formGroup: { 
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 14,
  },
  inputContainerFocused: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  inputIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  input: { 
    flex: 1, 
    color: '#f8fafc', 
    fontSize: 15,
    fontWeight: '500',
  },
  primaryBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: { 
    color: '#09090b', 
    fontSize: 16, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnIcon: {
    marginLeft: 8,
  },
  footer: { 
    marginTop: 16,
    alignItems: 'center',
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  switchBtnText: {
    color: '#64748b',
    fontSize: 14,
  },
  switchBtnLink: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustBadgeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  footerText: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    letterSpacing: 0.3,
  },
});
