import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const categories = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'clothing', label: 'Clothing', icon: 'shirt' },
  { id: 'tech', label: 'Tech', icon: 'laptop' },
  { id: 'accessories', label: 'Accessories', icon: 'watch' },
  { id: 'food', label: 'Food', icon: 'restaurant' },
];

const featuredProducts = [
  { id: '1', name: 'Premium Wireless Headphones', price: 299.99, sales: 1240, rating: 4.8, category: 'tech' },
  { id: '2', name: 'Smart Fitness Watch', price: 199.99, sales: 890, rating: 4.6, category: 'tech' },
  { id: '3', name: 'Vintage Leather Jacket', price: 349.99, sales: 567, rating: 4.9, category: 'clothing' },
  { id: '4', name: 'Designer Sunglasses', price: 159.99, sales: 2100, rating: 4.7, category: 'accessories' },
];

export default function ExploreScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundOrb} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Discover products & insights</Text>
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(cat.id)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={cat.icon as any} 
                size={18} 
                color={selectedCategory === cat.id ? '#09090b' : '#64748b'} 
              />
              <Text style={[
                styles.categoryLabel,
                selectedCategory === cat.id && styles.categoryLabelActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Performers</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {featuredProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productImagePlaceholder}>
                <Ionicons name="cube" size={32} color="#38bdf840" />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                <View style={styles.productMeta}>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#fbbf24" />
                    <Text style={styles.ratingText}>{product.rating}</Text>
                  </View>
                  <Text style={styles.salesText}>{product.sales.toLocaleString()} sold</Text>
                </View>
              </View>
              <View style={styles.productRight}>
                <Text style={styles.productPrice}>${product.price}</Text>
                <TouchableOpacity style={styles.addBtn} activeOpacity={0.7}>
                  <Ionicons name="add" size={20} color="#09090b" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
              <Ionicons name="trending-up" size={24} color="#38bdf8" />
            </View>
            <Text style={styles.statValue}>$48.2K</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(74, 222, 128, 0.1)' }]}>
              <Ionicons name="cart" size={24} color="#4ade80" />
            </View>
            <Text style={styles.statValue}>1,247</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  backgroundOrb: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(74, 222, 128, 0.05)',
    blurRadius: 80,
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 4,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  categoryChipActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryLabelActive: {
    color: '#09090b',
  },
  section: {
    padding: 24,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#38bdf8',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  productImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 6,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fbbf24',
  },
  salesText: {
    fontSize: 12,
    color: '#64748b',
  },
  productRight: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ade80',
    marginBottom: 8,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
});
