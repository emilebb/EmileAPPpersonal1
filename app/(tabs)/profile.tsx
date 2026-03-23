import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, SafeAreaView, KeyboardAvoidingView, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PerfilUsuario() {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState({ nombre_negocio: '', moneda: 'USD', plan_suscripcion: 'free' });
  const router = useRouter();

  useEffect(() => { 
    obtenerPerfil(); 
  }, []);

  async function obtenerPerfil() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
      if (data) {
        setPerfil(data);
      } else if (error && error.code !== 'PGRST116') {
        if (Platform.OS === 'web') window.alert("Error leyendo perfil: " + error.message);
        else Alert.alert("Error", error.message);
      }
    }
    setLoading(false);
  }

  async function actualizarPerfil() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);

    const { error } = await supabase.from('perfiles').upsert({
      id: user.id,
      ...perfil,
      updated_at: new Date(),
    });

    setLoading(false);

    if (error) {
      const msg = "Error: " + error.message + "\n\n¿Ya ejecutaste el script SQL para crear la tabla perfiles?";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Error", msg);
    } else {
      if (Platform.OS === 'web') window.alert("¡Perfil actualizado correctamente!");
      else Alert.alert("¡Éxito!", "Perfil actualizado correctamente.");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.header}>Mi Negocio</Text>
          
          {/* Avatar / Logo del Negocio */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={{color: '#fff', fontSize: 40}}>🏢</Text>
            </View>
            <Text style={styles.planBadge}>{perfil.plan_suscripcion.toUpperCase()}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Nombre de la Empresa</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej. Mi Super Tienda"
              placeholderTextColor="#64748b"
              value={perfil.nombre_negocio} 
              onChangeText={(t) => setPerfil({...perfil, nombre_negocio: t})} 
            />

            <Text style={styles.label}>Moneda de Trabajo</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej. USD, EUR, MXN"
              placeholderTextColor="#64748b"
              value={perfil.moneda} 
              onChangeText={(t) => setPerfil({...perfil, moneda: t})} 
            />

            <TouchableOpacity style={styles.btnGuardar} onPress={actualizarPerfil} disabled={loading}>
              <Text style={styles.btnText}>{loading ? 'Guardando...' : 'Guardar Cambios'}</Text>
            </TouchableOpacity>

            {perfil.plan_suscripcion === 'free' && (
              <TouchableOpacity style={styles.btnUpgrade} onPress={() => router.push('/modal')}>
                <Text style={styles.btnTextUpgrade}>🚀 Subir a Plan PRO ($9.99)</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity onPress={() => supabase.auth.signOut()} style={styles.btnLogout}>
            <Ionicons name="log-out-outline" size={24} color="#ff4d4d" style={{ marginRight: 8 }} />
            <Text style={{color: '#ff4d4d', fontWeight: 'bold', fontSize: 16}}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 50 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc', marginBottom: 30 },
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#38bdf8' },
  planBadge: { backgroundColor: '#38bdf8', color: '#0f172a', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: -15, fontWeight: 'bold', overflow: 'hidden' },
  form: { gap: 15 },
  label: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', marginLeft: 4 },
  input: { backgroundColor: '#1e293b', color: '#f8fafc', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#334155' },
  btnGuardar: { backgroundColor: '#38bdf8', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 16 },
  btnUpgrade: { backgroundColor: '#1e293b', padding: 18, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#38bdf8', marginTop: 5 },
  btnTextUpgrade: { color: '#38bdf8', fontWeight: 'bold', fontSize: 16 },
  btnLogout: { marginTop: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, borderRadius: 12, backgroundColor: '#7f1d1d20' }
});
