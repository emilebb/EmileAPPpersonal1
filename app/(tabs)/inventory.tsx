import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Platform, Modal, Alert, KeyboardAvoidingView, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { finalizarVentaOffline, VentaData } from '../../lib/offline-sync';

interface Product {
  id: string;
  nombre: string;
  stock_actual: number;
  precio_venta: number;
  categoria?: string;
  imagen_uri?: string;
}

interface CartItem {
  product: Product;
  cantidad: number;
}

export default function InventoryScreen() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isQuantityModalVisible, setIsQuantityModalVisible] = useState(false);
  const [selectedProductForCart, setSelectedProductForCart] = useState<Product | null>(null);
  const [cartQuantity, setCartQuantity] = useState('1');
  const [processingCart, setProcessingCart] = useState(false);

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

  // Cart functions
  const cartTotal = cart.reduce((sum, item) => sum + (item.product.precio_venta * item.cantidad), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.cantidad, 0);

  const openQuantityModal = (product: Product) => {
    setSelectedProductForCart(product);
    setCartQuantity('1');
    setIsQuantityModalVisible(true);
  };

  const addToCart = () => {
    if (!selectedProductForCart) return;
    const qty = parseInt(cartQuantity) || 1;
    if (qty <= 0 || qty > selectedProductForCart.stock_actual) return;

    const existing = cart.find(item => item.product.id === selectedProductForCart.id);
    if (existing) {
      setCart(cart.map(item => 
        item.product.id === selectedProductForCart.id 
          ? { ...item, cantidad: item.cantidad + qty }
          : item
      ));
    } else {
      setCart([...cart, { product: selectedProductForCart, cantidad: qty }]);
    }
    setIsQuantityModalVisible(false);
    setSelectedProductForCart(null);
  };

  const updateCartItemQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else {
      setCart(cart.map(item => 
        item.product.id === productId ? { ...item, cantidad: newQty } : item
      ));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const processCartSale = async () => {
    if (cart.length === 0) return;
    
    setProcessingCart(true);

    for (const item of cart) {
      const datosVenta: VentaData = {
        producto_id: item.product.id,
        cantidad_venta: item.cantidad,
        precio_total: item.product.precio_venta * item.cantidad,
        timestamp: new Date().toISOString(),
        producto_nombre: item.product.nombre
      };
      
      try {
        await finalizarVentaOffline(datosVenta);
      } catch (error) {
        console.error('Error procesando venta:', error);
      }
    }

    // Update local inventory
    setProductos(productos.map(p => {
      const cartItem = cart.find(c => c.product.id === p.id);
      if (cartItem) {
        return { ...p, stock_actual: Math.max(0, p.stock_actual - cartItem.cantidad) };
      }
      return p;
    }));

    setProcessingCart(false);
    setCart([]);
    setIsCartVisible(false);
  };

  const renderItem = ({ item }: { item: Product }) => {
    const isLowStock = item.stock_actual <= 5;
    const isNoStock = item.stock_actual <= 0;
    const inCart = cart.find(c => c.product.id === item.id);

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
              <TouchableOpacity 
                style={[styles.cartIconBox, inCart && styles.cartIconBoxActive]}
                onPress={() => !isNoStock && openQuantityModal(item)}
                disabled={isNoStock}
              >
                {inCart ? (
                  <View>
                    <Ionicons name="cart" size={20} color="#0f172a" />
                    <View style={styles.cartBadge}>
                      <Text style={styles.cartBadgeText}>{inCart.cantidad}</Text>
                    </View>
                  </View>
                ) : (
                  <Ionicons name={isNoStock ? "close-circle" : "cart-outline"} size={20} color={isNoStock ? "#ef4444" : "#f8fafc"} />
                )}
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
          <TouchableOpacity style={styles.cartButton} onPress={() => setIsCartVisible(true)}>
            <Ionicons name="cart" size={28} color="#f8fafc" />
            {cartItemCount > 0 && (
              <View style={styles.cartCount}>
                <Text style={styles.cartCountText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
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

      {/* Cart Modal */}
      <Modal visible={isCartVisible} animationType="slide" transparent={true}>
        <View style={styles.cartOverlay}>
          <View style={styles.cartContainer}>
            <View style={styles.cartHeader}>
              <View style={styles.cartTitleRow}>
                <Ionicons name="cart" size={24} color="#f8fafc" />
                <Text style={styles.cartTitle}>Shopping Cart</Text>
                <Text style={styles.cartItemCount}>{cartItemCount} items</Text>
              </View>
              <TouchableOpacity onPress={() => setIsCartVisible(false)}>
                <Ionicons name="close" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCart}>
                <Ionicons name="cart-outline" size={64} color="#334155" />
                <Text style={styles.emptyCartText}>Your cart is empty</Text>
                <Text style={styles.emptyCartSubtext}>Add products from inventory</Text>
              </View>
            ) : (
              <>
                <ScrollView style={styles.cartList}>
                  {cart.map((item) => (
                    <View key={item.product.id} style={styles.cartItem}>
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName}>{item.product.nombre}</Text>
                        <Text style={styles.cartItemPrice}>${item.product.precio_venta.toFixed(2)} / unit</Text>
                      </View>
                      <View style={styles.cartItemControls}>
                        <TouchableOpacity 
                          style={styles.qtyBtn}
                          onPress={() => updateCartItemQuantity(item.product.id, item.cantidad - 1)}
                        >
                          <Ionicons name="remove" size={18} color="#f8fafc" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.cantidad}</Text>
                        <TouchableOpacity 
                          style={styles.qtyBtn}
                          onPress={() => updateCartItemQuantity(item.product.id, item.cantidad + 1)}
                        >
                          <Ionicons name="add" size={18} color="#f8fafc" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.cartItemTotal}>
                        ${(item.product.precio_venta * item.cantidad).toFixed(2)}
                      </Text>
                      <TouchableOpacity 
                        style={styles.removeBtn}
                        onPress={() => removeFromCart(item.product.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.cartFooter}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>${cartTotal.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.checkoutBtn}
                    onPress={processCartSale}
                    disabled={processingCart}
                  >
                    <Ionicons name="card" size={24} color="#0f172a" style={{ marginRight: 10 }} />
                    <Text style={styles.checkoutBtnText}>
                      {processingCart ? 'Processing...' : 'Checkout'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.clearCartBtn} onPress={clearCart}>
                    <Text style={styles.clearCartBtnText}>Clear Cart</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Quantity Modal */}
      <Modal visible={isQuantityModalVisible} animationType="fade" transparent={true}>
        <View style={styles.qtyModalOverlay}>
          <View style={styles.qtyModalContainer}>
            <Text style={styles.qtyModalTitle}>ADD TO CART</Text>
            <Text style={styles.qtyModalProduct}>{selectedProductForCart?.nombre}</Text>
            <Text style={styles.qtyModalStock}>Stock: {selectedProductForCart?.stock_actual}</Text>
            
            <View style={styles.qtyInputRow}>
              <TouchableOpacity 
                style={styles.qtyInputBtn}
                onPress={() => setCartQuantity(prev => {
                  const num = parseInt(prev) || 1;
                  return num > 1 ? String(num - 1) : '1';
                })}
              >
                <Ionicons name="remove" size={28} color="#f8fafc" />
              </TouchableOpacity>
              <TextInput
                style={styles.qtyInput}
                value={cartQuantity}
                onChangeText={setCartQuantity}
                keyboardType="numeric"
                textAlign="center"
              />
              <TouchableOpacity 
                style={styles.qtyInputBtn}
                onPress={() => setCartQuantity(prev => {
                  const num = parseInt(prev) || 0;
                  return String(Math.min(num + 1, selectedProductForCart?.stock_actual || 1));
                })}
              >
                <Ionicons name="add" size={28} color="#f8fafc" />
              </TouchableOpacity>
            </View>

            <Text style={styles.qtyModalTotal}>
              Subtotal: ${((parseInt(cartQuantity) || 0) * (selectedProductForCart?.precio_venta || 0)).toFixed(2)}
            </Text>

            <View style={styles.qtyModalActions}>
              <TouchableOpacity 
                style={styles.qtyCancelBtn}
                onPress={() => setIsQuantityModalVisible(false)}
              >
                <Text style={styles.qtyCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.qtyConfirmBtn}
                onPress={addToCart}
              >
                <Ionicons name="cart" size={20} color="#0f172a" style={{ marginRight: 8 }} />
                <Text style={styles.qtyConfirmBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  // Cart styles
  cartButton: {
    position: 'absolute',
    right: 0,
    top: 5,
    padding: 8,
  },
  cartCount: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4ade80',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCountText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartIconBoxActive: {
    backgroundColor: '#4ade80',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#38bdf8',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#0f172a',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cartOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  cartContainer: {
    backgroundColor: '#0d1017',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#2d333d',
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1d24',
  },
  cartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  cartItemCount: {
    color: '#64748b',
    fontSize: 14,
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyCartText: {
    color: '#64748b',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyCartSubtext: {
    color: '#475569',
    fontSize: 14,
    marginTop: 8,
  },
  cartList: {
    maxHeight: 400,
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1d24',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2d333d',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cartItemPrice: {
    color: '#64748b',
    fontSize: 12,
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2d333d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  },
  cartItemTotal: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
    minWidth: 70,
    textAlign: 'right',
  },
  removeBtn: {
    padding: 8,
    marginLeft: 8,
  },
  cartFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#1a1d24',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    color: '#4ade80',
    fontSize: 28,
    fontWeight: '900',
  },
  checkoutBtn: {
    backgroundColor: '#4ade80',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
  },
  clearCartBtn: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
  },
  clearCartBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Quantity Modal styles
  qtyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qtyModalContainer: {
    backgroundColor: '#0d1017',
    borderRadius: 32,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#2d333d',
    alignItems: 'center',
  },
  qtyModalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#38bdf8',
    letterSpacing: 2,
    marginBottom: 16,
  },
  qtyModalProduct: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
  },
  qtyModalStock: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 24,
  },
  qtyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  qtyInputBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#1a1d24',
    borderWidth: 1,
    borderColor: '#2d333d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyInput: {
    backgroundColor: '#1a1d24',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#38bdf8',
    width: 100,
    height: 60,
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: 'bold',
  },
  qtyModalTotal: {
    color: '#4ade80',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  qtyModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  qtyCancelBtn: {
    flex: 1,
    backgroundColor: '#1a1d24',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d333d',
  },
  qtyCancelBtnText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qtyConfirmBtn: {
    flex: 1,
    backgroundColor: '#4ade80',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyConfirmBtnText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

