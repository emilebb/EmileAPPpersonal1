import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Platform, Modal, Image, Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';

interface Product {
  id: string;
  nombre: string;
  stock_actual: number;
  precio_venta: number;
  categoria?: string;
  imagen_uri?: string;
}

export default function InventoryScreen() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Form State
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [categoria, setCategoria] = useState('Otro');
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
    if (data) setProductos(data);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImagenUri(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const saveProduct = async () => {
    if (!nombre || !precio) {
      if (Platform.OS === 'web') window.alert("Nombre y precio son obligatorios");
      else Alert.alert("Error", "Nombre y precio son obligatorios");
      return;
    }

    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      if (Platform.OS === 'web') window.alert("Inicia sesión primero.");
      else Alert.alert("Error", "Inicia sesión primero.");
      return;
    }

    // Verificamos si es PRO o si aún tiene espacio
    const { data: perfilData } = await supabase
      .from('perfiles')
      .select('plan_suscripcion')
      .eq('id', session.user.id)
      .single();
      
    if (perfilData?.plan_suscripcion === 'free') {
      const { count } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      if (count !== null && count >= 20) {
        setLoading(false);
        const title = "Límite alcanzado";
        const msg = "Has llegado al límite de 20 productos. ¡Pásate a PRO para agregar ilimitados!";
        if (Platform.OS === 'web') {
          window.alert(`${title}\n${msg}`);
        } else {
          Alert.alert(title, msg, [{ text: "Entendido" }]);
        }
        return;
      }
    }

    const { error } = await supabase.from('productos').insert([{
      user_id: session.user.id,
      nombre,
      precio_venta: parseFloat(precio) || 0,
      stock_actual: parseInt(stock) || 0,
      categoria,
      imagen_uri: imagenUri
    }]);

    if (error) {
      console.error("SUPABASE ERROR DETAILS:", JSON.stringify(error, null, 2));
      const errMsg = `Error de Base de Datos:\n${error.message}\n\nDetalles: ${error.details || 'Ninguno'}\nPista: ${error.hint || 'Conflicto de tabla (409) o regla RLS.'}`;
      if (Platform.OS === 'web') window.alert(errMsg);
      else Alert.alert("Error", errMsg);
    } else {
      if (Platform.OS === 'web') window.alert("¡Producto guardado!");
      else Alert.alert("¡Éxito!", "Producto guardado con éxito.");
      
      setNombre(''); setPrecio(''); setStock(''); setCategoria('Otro'); setImagenUri(null);
      setIsModalVisible(false);
      fetchInventory();
    }
    setLoading(false);
  };

  const filteredInventory = search.trim().length > 0 
    ? productos.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()))
    : productos;

  const renderItem = ({ item }: { item: Product }) => {
    let stockColor = '#94a3b8';
    let stockBg = '#1e293b';
    
    if (item.stock_actual <= 0) {
      stockColor = '#ef4444';
      stockBg = '#7f1d1d20';
    } else if (item.stock_actual <= 5) {
      stockColor = '#eab308';
      stockBg = '#854d0e20';
    }

    return (
      <View style={styles.productCard}>
        {item.imagen_uri ? (
          <Image source={{ uri: item.imagen_uri }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#334155' }]}>
            <Ionicons name="cube" size={24} color="#94a3b8" />
          </View>
        )}
        
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.nombre}</Text>
          <Text style={styles.productCategory}>{item.categoria || 'Sin Categoria'}</Text>
          <Text style={styles.productPrice}>${Number(item.precio_venta).toFixed(2)}</Text>
        </View>
        
        <View style={[styles.stockBadge, { backgroundColor: stockBg }]}>
          <Ionicons name={item.stock_actual <= 0 ? "warning" : "cube"} size={16} color={stockColor} />
          <Text style={[styles.stockText, { color: stockColor }]}>
            {item.stock_actual} {item.stock_actual === 1 ? 'u' : 'us'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventario</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearIcon}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ flex: 1, width: '100%' }}>
        <FlashList<Product>
          data={filteredInventory}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={100}
        />
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => setIsModalVisible(true)}>
        <Ionicons name="add" size={32} color="#0f172a" />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" presentationStyle="formSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📦 Nuevo Producto</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close-circle" size={32} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            
            <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
              {imagenUri ? (
                <Image source={{ uri: imagenUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={32} color="#38bdf8" />
                  <Text style={styles.imagePickerText}>Añadir Foto</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Nombre del Producto</Text>
            <TextInput style={styles.input} placeholder="Ej. Camiseta Negra" placeholderTextColor="#64748b" value={nombre} onChangeText={setNombre} />

            <View style={{ flexDirection: 'row', gap: 15 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Precio Venta ($)</Text>
                <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#64748b" keyboardType="numeric" value={precio} onChangeText={setPrecio} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Stock Inicial</Text>
                <TextInput style={styles.input} placeholder="0" placeholderTextColor="#64748b" keyboardType="numeric" value={stock} onChangeText={setStock} />
              </View>
            </View>

            <Text style={styles.inputLabel}>Categoría Rápida</Text>
            <View style={styles.categoriesContainer}>
              {['Ropa', 'Comida', 'Accesorios', 'Otro'].map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.categoryChip, categoria === cat && styles.categoryChipActive]} 
                  onPress={() => setCategoria(cat)}>
                  <Text style={[styles.categoryChipText, categoria === cat && styles.categoryChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveProduct} disabled={loading}>
              <Text style={styles.saveBtnText}>{loading ? 'Guardando...' : 'Crear Producto'}</Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 10, backgroundColor: '#0f172a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc', marginBottom: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 15, height: 50 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#f8fafc', fontSize: 16 },
  clearIcon: { padding: 5 },
  listContent: { padding: 20, paddingBottom: 100 },
  
  productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  productImage: { width: 60, height: 60, borderRadius: 12, marginRight: 15 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: '#f8fafc', marginBottom: 2 },
  productCategory: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  productPrice: { fontSize: 16, color: '#38bdf8', fontWeight: 'bold' },
  stockBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, minWidth: 60, justifyContent: 'center' },
  stockText: { fontWeight: 'bold', marginLeft: 6, fontSize: 14 },
  
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
  
  modalContainer: { flex: 1, backgroundColor: '#0f172a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc' },
  modalContent: { padding: 20 },
  
  imagePickerBtn: { alignSelf: 'center', marginBottom: 30, width: 150, height: 150, borderRadius: 16, backgroundColor: '#1e293b', borderWidth: 2, borderColor: '#334155', borderStyle: 'dashed', overflow: 'hidden' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imagePickerText: { color: '#38bdf8', marginTop: 10, fontWeight: 'bold' },
  previewImage: { width: '100%', height: '100%' },
  
  inputLabel: { color: '#94a3b8', fontSize: 14, marginBottom: 8, fontWeight: 'bold' },
  input: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 15, color: '#f8fafc', fontSize: 16, marginBottom: 20 },
  
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  categoryChip: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16 },
  categoryChipActive: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  categoryChipText: { color: '#cbd5e1', fontWeight: 'bold' },
  categoryChipTextActive: { color: '#0f172a' },

  saveBtn: { backgroundColor: '#38bdf8', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#0f172a', fontSize: 18, fontWeight: 'bold' }
});
