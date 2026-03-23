import React, { useState } from 'react';
import { Alert, StyleSheet, View, Text, AppState, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
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
      <View style={styles.content}>
        <View style={styles.header}>
            <Ionicons name={isLoginView ? "lock-closed" : "person-add"} size={60} color="#38bdf8" />
            <Text style={styles.title}>{isLoginView ? 'Iniciar Sesión' : 'Crear Cuenta'}</Text>
            <Text style={styles.subtitle}>Sincroniza y protege tu inventario en la nube.</Text>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              onChangeText={setEmail}
              value={email}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#64748b"
              autoCapitalize={'none'}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="key" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              onChangeText={setPassword}
              value={password}
              secureTextEntry={true}
              placeholder="Contraseña"
              placeholderTextColor="#64748b"
              autoCapitalize={'none'}
            />
          </View>

          {!isLoginView && (
            <View style={styles.inputContainer}>
              <Ionicons name="key-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                onChangeText={setConfirmPassword}
                value={confirmPassword}
                secureTextEntry={true}
                placeholder="Confirmar Contraseña"
                placeholderTextColor="#64748b"
                autoCapitalize={'none'}
              />
            </View>
          )}

          <TouchableOpacity style={styles.primaryBtn} disabled={loading} onPress={handleAuth}>
            <Text style={styles.primaryBtnText}>
              {loading ? 'Cargando...' : (isLoginView ? 'Entrar' : 'Registrarse')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isLoginView ? '¿No tienes cuenta?' : '¿Ya tienes una cuenta?'}
          </Text>
          <TouchableOpacity onPress={() => setIsLoginView(!isLoginView)}>
            <Text style={styles.switchModeText}>
              {isLoginView ? ' Regístrate aquí' : ' Inicia Sesión'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 24, flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc', marginTop: 20, marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 20 },
  formGroup: { marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingHorizontal: 15, height: 55, marginBottom: 16 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#f8fafc', fontSize: 16 },
  primaryBtn: { backgroundColor: '#38bdf8', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  primaryBtnText: { color: '#0f172a', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#94a3b8', fontSize: 16 },
  switchModeText: { color: '#38bdf8', fontSize: 16, fontWeight: 'bold' },
});
