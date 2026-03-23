import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { finalizarVentaOffline, VentaData } from '../../lib/offline-sync';

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
  container: { 
    flex: 1, 
    backgroundColor: '#09090b',
  },
  header: { 
    padding: 24, 
    paddingTop: Platform.OS === 'android' ? 20 : 20,
    backgroundColor: '#09090b',
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  content: { 
    flex: 1, 
    padding: 24, 
    justifyContent: 'space-between',
  },
  
  conceptRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20,
  },
  searchContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16, 
    paddingHorizontal: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.06)', 
    height: 56,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16, 
    color: '#f8fafc',
    fontWeight: '500',
  },
  scanBtn: { 
    backgroundColor: '#38bdf8', 
    padding: 16, 
    borderRadius: 16, 
    marginLeft: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: 56,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  searchResults: { 
    flex: 1,
  },
  searchResult: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  resultName: { 
    color: '#f8fafc', 
    fontSize: 15, 
    fontWeight: '600', 
    marginBottom: 4,
  },
  resultStock: { 
    color: '#64748b', 
    fontSize: 12,
  },
  resultPrice: { 
    color: '#4ade80', 
    fontSize: 16, 
    fontWeight: '700',
  },

  selectedCard: { 
    backgroundColor: 'rgba(56, 189, 248, 0.08)', 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(56, 189, 248, 0.3)', 
    marginBottom: 16,
  },
  selectedHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12,
  },
  selectedName: { 
    color: '#f8fafc', 
    fontSize: 22, 
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  selectedPrice: { 
    color: '#94a3b8', 
    fontSize: 14, 
    marginTop: 4,
  },
  
  warningBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(251, 191, 36, 0.1)', 
    padding: 14, 
    borderRadius: 12, 
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  warningText: { 
    color: '#fbbf24', 
    marginLeft: 10, 
    fontWeight: '600',
    fontSize: 13,
  },

  amountContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'baseline', 
    marginVertical: 20,
  },
  amountLabel: { 
    fontSize: 20, 
    color: '#64748b', 
    fontWeight: '600',
    marginRight: 8,
  },
  amountDisplay: { 
    fontSize: 64, 
    fontWeight: '900', 
    color: '#4ade80',
    letterSpacing: -2,
  },

  keypad: { 
    justifyContent: 'center', 
    marginTop: 16,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 12,
  },
  numBtn: { 
    width: '31%', 
    aspectRatio: 1.8, 
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  numText: { 
    fontSize: 32, 
    color: '#f8fafc', 
    fontWeight: '700',
  },

  chargeBtn: { 
    backgroundColor: '#4ade80', 
    borderRadius: 20, 
    padding: 20, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 16,
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  chargeBtnDisabled: { 
    backgroundColor: 'rgba(255, 255, 255, 0.06)', 
  },
  chargeBtnText: { 
    fontSize: 18, 
    color: '#09090b', 
    fontWeight: '700',
  },
  
  cameraContainer: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  camera: { 
    flex: 1 
  },
  cameraOverlay: { 
    flex: 1, 
    backgroundColor: 'transparent', 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    paddingBottom: 50 
  },
  cameraText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 30, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 10 
  },
  closeCameraBtn: { 
    backgroundColor: 'white', 
    borderRadius: 30 
  },
});
