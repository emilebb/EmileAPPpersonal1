import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, SafeAreaView, KeyboardAvoidingView, ScrollView, Linking } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function PerfilUsuario() {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState({ nombre_negocio: '', moneda: 'USD', plan_suscripcion: 'free' });

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

  const handleUpgrade = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // 1. Crea un "Payment Link" en tu dashboard de Stripe (toma 2 minutos)
    // 2. Agrégale el ID del usuario como parámetro para saber quién pagó
    const STRIPE_PAYMENT_LINK = `https://buy.stripe.com/test_tu_enlace_aqui?client_reference_id=${user.id}`;

    try {
      const supported = await Linking.canOpenURL(STRIPE_PAYMENT_LINK);
      if (supported) {
        await Linking.openURL(STRIPE_PAYMENT_LINK);
      } else {
        if (Platform.OS === 'web') window.alert("No se pudo abrir la pasarela de pago.");
        else Alert.alert("Error", "No se pudo abrir la pasarela de pago.");
      }
    } catch (error) {
      console.error("Error al redirigir a Stripe", error);
    }
  };

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
              <TouchableOpacity style={styles.btnUpgrade} onPress={handleUpgrade}>
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
  container: { 
    flex: 1, 
    backgroundColor: '#09090b',
  },
  scroll: { 
    padding: 24, 
    paddingTop: Platform.OS === 'android' ? 20 : 20, 
    paddingBottom: 100,
  },
  header: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: '#f8fafc', 
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  avatarContainer: { 
    alignItems: 'center', 
    marginBottom: 32,
  },
  avatarPlaceholder: { 
    width: 100, 
    height: 100, 
    borderRadius: 32, 
    backgroundColor: 'rgba(56, 189, 248, 0.1)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: 'rgba(56, 189, 248, 0.3)',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  planBadge: { 
    backgroundColor: '#38bdf8', 
    color: '#09090b', 
    paddingHorizontal: 16, 
    paddingVertical: 6, 
    borderRadius: 20, 
    marginTop: -16, 
    fontWeight: '700', 
    overflow: 'hidden',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  form: { 
    gap: 16,
  },
  label: { 
    color: '#94a3b8', 
    fontSize: 12, 
    fontWeight: '600', 
    marginLeft: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: { 
    backgroundColor: 'rgba(255, 255, 255, 0.04)', 
    color: '#f8fafc', 
    padding: 18, 
    borderRadius: 16, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.06)',
    fontWeight: '500',
  },
  btnGuardar: { 
    backgroundColor: '#38bdf8', 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginTop: 16,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  btnText: { 
    color: '#09090b', 
    fontWeight: '700', 
    fontSize: 16,
    letterSpacing: 0.5,
  },
  btnUpgrade: { 
    backgroundColor: 'rgba(56, 189, 248, 0.08)', 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(56, 189, 248, 0.3)', 
    marginTop: 12,
  },
  btnTextUpgrade: { 
    color: '#38bdf8', 
    fontWeight: '700', 
    fontSize: 15,
  },
  btnLogout: { 
    marginTop: 40, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 18, 
    borderRadius: 16, 
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  }
});
