import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Platform, Modal, Image, Alert, KeyboardAvoidingView, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

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
      aspect: [1, 1], // Square for cards
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
      return;
    }

    // Pro check (limit 20)
    const { data: perfilData } = await supabase.from('perfiles').select('plan_suscripcion').eq('id', session.user.id).single();
    if (perfilData?.plan_suscripcion === 'free') {
      const { count } = await supabase.from('productos').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id);
      if (count !== null && count >= 20) {
        setLoading(false);
        const title = "Límite alcanzado";
        const msg = "Sube a PRO para agregar más de 20 productos.";
        if (Platform.OS === 'web') window.alert(`${title}\n${msg}`);
        else Alert.alert(title, msg);
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

    if (!error) {
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
    const isLowStock = item.stock_actual <= 5;
    const isNoStock = item.stock_actual <= 0;

    return (
      <View style={styles.cardContainer}>
        <View style={styles.productCard}>
          {item.imagen_uri ? (
            <Image source={{ uri: item.imagen_uri }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="cube" size={48} color="#38bdf820" />
            </View>
          )}

          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <Text style={styles.productName} numberOfLines={1}>{item.nombre}</Text>
              <View style={[styles.stockBadge, isLowStock && styles.lowStockBadge, isNoStock && styles.noStockBadge]}>
                <Text style={styles.stockLabel}>{isNoStock ? 'NO STOCK' : isLowStock ? 'LOW STOCK' : 'IN STOCK'}</Text>
              </View>
            </View>
            
            <Text style={styles.productCategory}>{item.categoria || 'ASSET'}</Text>
            
            <View style={styles.cardFooter}>
              <Text style={styles.productPrice}>${Number(item.precio_venta).toFixed(2)}</Text>
              <TouchableOpacity style={styles.cartIconBox}>
                <Ionicons name="cart-outline" size={20} color="#f8fafc" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleVault}>Vault</Text>
          <Text style={styles.titleInventory}>Inventory</Text>
        </View>
        <Text style={styles.subtitle}>Monitor and manage your high-frequency assets with real-time tracking.</Text>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search high-frequency assets..."
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filteredInventory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setIsModalVisible(true)}>
        <Ionicons name="add" size={32} color="#0f172a" />
      </TouchableOpacity>

      {/* Add Product Modal */}
      <Modal visible={isModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>NEW ASSET</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#f8fafc" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {imagenUri ? (
                  <Image source={{ uri: imagenUri }} style={styles.pickerPreview} />
                ) : (
                  <View style={styles.pickerContent}>
                    <Ionicons name="camera-outline" size={32} color="#38bdf8" />
                    <Text style={styles.pickerText}>UPLOAD VISUAL</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TextInput style={styles.input} placeholder="ASSET NAME" placeholderTextColor="#475569" value={nombre} onChangeText={setNombre} />
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="PRICE ($)" placeholderTextColor="#475569" keyboardType="numeric" value={precio} onChangeText={setPrecio} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="QUANTITY" placeholderTextColor="#475569" keyboardType="numeric" value={stock} onChangeText={setStock} />
              </View>

              <View style={styles.catRow}>
                {['Ropa', 'Tech', 'Accesory', 'Other'].map(cat => (
                  <TouchableOpacity key={cat} style={[styles.catChip, categoria === cat && styles.catChipActive]} onPress={() => setCategoria(cat)}>
                    <Text style={[styles.catText, categoria === cat && styles.catTextActive]}>{cat.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={saveProduct} disabled={loading}>
                <Text style={styles.saveBtnText}>{loading ? 'PROCESSING...' : 'INITIALIZE ASSET'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// FlatList instead of FlashList for simpler testing in this context if needed, but keeping logic
import { FlatList } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1017',
  },
  header: {
    padding: 24,
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  titleVault: {
    fontSize: 42,
    fontWeight: '900',
    color: '#38bdf8',
    marginRight: 10,
  },
  titleInventory: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1e293b',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1d24',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#2d333d',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 24,
  },
  productCard: {
    backgroundColor: '#1a1d24',
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2d333d',
  },
  productImage: {
    width: '100%',
    height: 400,
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f8fafc',
    flex: 1,
    marginRight: 10,
  },
  stockBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  lowStockBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
  },
  noStockBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  stockLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  productCategory: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 20,
    letterSpacing: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: '#38bdf8',
  },
  cartIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#2d333d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#0d1017',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#2d333d',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1d24',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 1,
  },
  modalScroll: {
    padding: 24,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    backgroundColor: '#1a1d24',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2d333d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  pickerContent: {
    alignItems: 'center',
  },
  pickerText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    letterSpacing: 1,
  },
  pickerPreview: {
    width: '100%',
    height: '100%',
  },
  input: {
    backgroundColor: '#1a1d24',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 20,
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2d333d',
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  catChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1a1d24',
    borderWidth: 1,
    borderColor: '#2d333d',
  },
  catChipActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  catText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
  },
  catTextActive: {
    color: '#38bdf8',
  },
  saveBtn: {
    backgroundColor: '#38bdf8',
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

