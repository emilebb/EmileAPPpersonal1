import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
}

const mockInventory: Product[] = [
  { id: '1', name: 'Curso Premium React', stock: 15, price: 99.99 },
  { id: '2', name: 'Plantilla Dashboard', stock: 2, price: 49.0 },
  { id: '3', name: 'Libro UI/UX', stock: 0, price: 29.5 },
  { id: '4', name: 'Asesoría 1h', stock: 5, price: 150.0 },
  { id: '5', name: 'Paquete Iconos', stock: 150, price: 15.0 },
];

export default function InventoryScreen() {
  const [search, setSearch] = useState('');
  
  const filteredInventory = mockInventory.filter(product => 
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: Product }) => {
    // Indicador visual: Si stock <= 2, rojo; si <= 5, amarillo; si no, verde o neutro.
    let stockColor = '#94a3b8'; // normal (slate-400)
    let stockBg = '#1e293b';
    
    if (item.stock <= 0) {
      stockColor = '#ef4444'; // red-500
      stockBg = '#7f1d1d20';
    } else if (item.stock <= 5) {
      stockColor = '#eab308'; // yellow-500
      stockBg = '#854d0e20';
    }

    return (
      <View style={styles.productCard}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        </View>
        <View style={[styles.stockBadge, { backgroundColor: stockBg }]}>
          <Ionicons 
            name={item.stock <= 0 ? "warning" : "cube"} 
            size={16} 
            color={stockColor} 
          />
          <Text style={[styles.stockText, { color: stockColor }]}>
            {item.stock} {item.stock === 1 ? 'ud' : 'uds'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventario</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto..."
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
          keyExtractor={(item: Product) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={80}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // slate-900
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 10,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 16,
    height: '100%',
  },
  clearIcon: {
    padding: 5,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#38bdf8', // sky-400
    fontWeight: 'bold',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 80,
    justifyContent: 'center',
  },
  stockText: {
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
});
