import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

interface Product {
  id: string;
  nombre: string;
  stock_actual: number;
  precio_venta: number;
}

export default function NewSaleScreen() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cantidadStr, setCantidadStr] = useState('');
  
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProductos();
  }, []);

  async function fetchProductos() {
    const { data } = await supabase.from('productos').select('*');
    if (data) setProductos(data);
  }

  const cantidad = parseInt(cantidadStr) || 0;
  const precioTotal = selectedProduct ? (selectedProduct.precio_venta * cantidad) : 0;
  const showWarning = selectedProduct && cantidad > selectedProduct.stock_actual;

  const handleBarcodeScanned = ({ data }: any) => {
    setIsScanning(false);
    // Find product by id or barcode matching
    const product = productos.find(p => p.id === data || p.nombre.toLowerCase().includes(data.toLowerCase()));
    if (product) {
       setSelectedProduct(product);
       setSearch('');
    } else {
       if (Platform.OS === 'web') window.alert("Producto no encontrado.");
       else Alert.alert("No encontrado", "Producto no encontrado en la base de datos.");
    }
  };

  const ejecutarVenta = async () => {
    if (!selectedProduct) return;
    if (cantidad <= 0) {
      if (Platform.OS === 'web') window.alert("Ingresa una cantidad válida.");
      else Alert.alert("Error", "Ingresa una cantidad válida.");
      return;
    }

    setLoading(true);
    
    try {
      const datosVenta: VentaData = {
        producto_id: selectedProduct.id,
        cantidad_venta: cantidad,
        precio_total: precioTotal,
        timestamp: new Date().toISOString(),
        producto_nombre: selectedProduct.nombre
      };

      await finalizarVentaOffline(datosVenta);
      
      // Update local state for immediate feedback
      setProductos(productos.map(p => 
        p.id === selectedProduct.id ? { ...p, stock_actual: p.stock_actual - cantidad } : p
      ));
      setSelectedProduct(null);
      setCantidadStr('');
      
    } catch (error) {
      console.error('Error en venta:', error);
      if (Platform.OS === 'web') {
        window.alert("Error: " + (error as Error).message);
      } else {
        Alert.alert("Error", (error as Error).message);
      }
    }
    
    setLoading(false);
  };

  const addCantidad = (val: string) => {
    if (val === '0' && cantidadStr === '') return;
    setCantidadStr(prev => prev + val);
  };
  
  const removeCantidad = () => {
    setCantidadStr(prev => prev.slice(0, -1));
  };

  const NumButton = ({ num }: { num: string }) => (
    <TouchableOpacity style={styles.numBtn} onPress={() => addCantidad(num)}>
      <Text style={styles.numText}>{num}</Text>
    </TouchableOpacity>
  );

  const filteredProducts = search.trim().length > 0 
    ? productos.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registrar Venta</Text>
      </View>

      <View style={styles.content}>
        
        {/* Búsqueda de producto */}
        {!selectedProduct && (
          <View style={{ flex: 1 }}>
            <View style={styles.conceptRow}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#64748b" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar Producto..."
                  placeholderTextColor="#64748b"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              <TouchableOpacity style={styles.scanBtn} onPress={async () => {
                if (!permission?.granted) {
                  const { granted } = await requestPermission();
                  if (!granted) return;
                }
                setIsScanning(true);
              }}>
                <Ionicons name="barcode-outline" size={24} color="#f8fafc" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.searchResults}>
              {filteredProducts.map(p => (
                <TouchableOpacity key={p.id} style={styles.searchResult} onPress={() => { setSelectedProduct(p); setSearch(''); }}>
                  <View>
                    <Text style={styles.resultName}>{p.nombre}</Text>
                    <Text style={styles.resultStock}>Stock libre: {p.stock_actual}</Text>
                  </View>
                  <Text style={styles.resultPrice}>${p.precio_venta}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Producto Seleccionado */}
        {selectedProduct && (
          <View style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <View>
                <Text style={styles.selectedName}>{selectedProduct.nombre}</Text>
                <Text style={styles.selectedPrice}>Precio /u: ${selectedProduct.precio_venta.toFixed(2)}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                <Ionicons name="close-circle" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {showWarning && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={20} color="#eab308" />
                <Text style={styles.warningText}>¡Cuidado! Solo tienes {selectedProduct.stock_actual} en stock.</Text>
              </View>
            )}
          </View>
        )}

        {selectedProduct && (
          <View>
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Cant: </Text>
              <Text style={styles.amountDisplay}>{cantidadStr || '0'}</Text>
            </View>

            <View style={styles.keypad}>
              <View style={styles.row}>
                <NumButton num="1" /><NumButton num="2" /><NumButton num="3" />
              </View>
              <View style={styles.row}>
                <NumButton num="4" /><NumButton num="5" /><NumButton num="6" />
              </View>
              <View style={styles.row}>
                <NumButton num="7" /><NumButton num="8" /><NumButton num="9" />
              </View>
              <View style={styles.row}>
                <NumButton num="00" /><NumButton num="0" />
                <TouchableOpacity style={styles.numBtn} onPress={removeCantidad} onLongPress={() => setCantidadStr('')}>
                  <Ionicons name="backspace-outline" size={32} color="#f8fafc" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.chargeBtn, (!selectedProduct || cantidad <= 0 || loading) && styles.chargeBtnDisabled]} 
          onPress={ejecutarVenta}
          disabled={!selectedProduct || cantidad <= 0 || loading}
        >
          <Ionicons name="card" size={24} color="#f8fafc" style={{ marginRight: 10 }} />
          <Text style={styles.chargeBtnText}>
            {loading ? "Procesando..." : `Cobrar $${precioTotal.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isScanning} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView 
            style={styles.camera} 
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "code128"] }}
            onBarcodeScanned={handleBarcodeScanned}
          >
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraText}>Apunta a un código de barras</Text>
              <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setIsScanning(false)}>
                <Ionicons name="close-circle" size={48} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: '#0f172a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc' },
  content: { flex: 1, padding: 20, justifyContent: 'space-between' },
  
  conceptRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16, paddingHorizontal: 15, borderWidth: 1, borderColor: '#334155', height: 55 },
  searchInput: { flex: 1, fontSize: 16, color: '#f8fafc' },
  scanBtn: { backgroundColor: '#38bdf8', padding: 15, borderRadius: 16, marginLeft: 10, justifyContent: 'center', alignItems: 'center', height: 55 },
  
  searchResults: { flex: 1 },
  searchResult: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: 15, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  resultName: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  resultStock: { color: '#94a3b8', fontSize: 14 },
  resultPrice: { color: '#4ade80', fontSize: 16, fontWeight: 'bold' },

  selectedCard: { backgroundColor: '#1e293b', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#38bdf8', marginBottom: 10 },
  selectedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  selectedName: { color: '#f8fafc', fontSize: 20, fontWeight: 'bold' },
  selectedPrice: { color: '#cbd5e1', fontSize: 14, marginTop: 4 },
  
  warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#422006', padding: 10, borderRadius: 8, marginTop: 5 },
  warningText: { color: '#fde047', marginLeft: 8, fontWeight: 'bold' },

  amountContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', marginVertical: 10 },
  amountLabel: { fontSize: 24, color: '#94a3b8', fontWeight: 'bold' },
  amountDisplay: { fontSize: 60, fontWeight: '900', color: '#4ade80' },

  keypad: { justifyContent: 'center', marginTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  numBtn: { width: '31%', aspectRatio: 1.8, backgroundColor: '#1e293b', borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  numText: { fontSize: 32, color: '#f8fafc', fontWeight: 'bold' },

  chargeBtn: { backgroundColor: '#38bdf8', borderRadius: 20, padding: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  chargeBtnDisabled: { backgroundColor: '#334155', opacity: 0.7 },
  chargeBtnText: { fontSize: 20, color: '#0f172a', fontWeight: 'bold' },
  
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 50 },
  cameraText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 30, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  closeCameraBtn: { backgroundColor: 'white', borderRadius: 30 },
});
