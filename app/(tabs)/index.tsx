import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, Dimensions, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleUpgrade = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
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
      <View style={styles.backgroundOrb} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.avatarButton}
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <View style={styles.avatarWrapper}>
              <Ionicons name="person-circle" size={44} color="#38bdf8" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>Welcome back</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={24} color="#f8fafc" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIconBox}>
              <Ionicons name="wallet" size={20} color="#38bdf8" />
            </View>
            <Text style={styles.balanceLabel}>TOTAL VAULT BALANCE</Text>
          </View>
          
          <View style={styles.balanceRow}>
            <Text style={styles.currencySymbol}>$</Text>
            <Text style={styles.balanceAmount}>124,592</Text>
            <Text style={styles.balanceDecimal}>.80</Text>
          </View>
          
          <View style={styles.badgeRow}>
            <View style={styles.trendingBadge}>
              <Ionicons name="trending-up" size={14} color="#4ade80" />
              <Text style={styles.trendingText}>+12.4%</Text>
            </View>
            <TouchableOpacity style={styles.filterChip} activeOpacity={0.7}>
              <Text style={styles.filterText}>WEEKLY</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip} activeOpacity={0.7}>
              <Text style={styles.filterText}>USD</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Revenue Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Revenue Overview</Text>
              <Text style={styles.chartSubtitle}>Your performance this week</Text>
            </View>
            <View style={styles.chartStats}>
              <Text style={styles.chartStatAmount}>$12,402</Text>
              <Text style={styles.chartStatLabel}>NET PROFIT</Text>
            </View>
          </View>

          {isMounted ? (
            <LineChart
              data={{
                labels: ["MON", "WED", "FRI", "SUN"],
                datasets: [{ data: [30, 45, 35, 75, 40, 85] }]
              }}
              width={width - 72}
              height={180}
              chartConfig={{
                backgroundColor: "transparent",
                backgroundGradientFrom: "transparent",
                backgroundGradientTo: "transparent",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: "0" },
                propsForBackgroundLines: { stroke: "#2d323d", strokeDasharray: "" }
              }}
              bezier
              withVerticalLines={false}
              withHorizontalLines={false}
              style={styles.chart}
            />
          ) : (
            <View style={styles.chartPlaceholder} />
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                <Ionicons name="add-circle" size={28} color="#38bdf8" />
              </View>
              <Text style={styles.actionLabel}>New Sale</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(74, 222, 128, 0.1)' }]}>
                <Ionicons name="cube" size={28} color="#4ade80" />
              </View>
              <Text style={styles.actionLabel}>Inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
                <Ionicons name="barcode" size={28} color="#fbbf24" />
              </View>
              <Text style={styles.actionLabel}>Scanner</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={handleUpgrade} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>SEE ALL</Text>
            </TouchableOpacity>
          </View>

          <ActivityItem 
            icon="bag-handle" 
            title="Product Sales" 
            subtitle="Today, 2:45 PM" 
            amount="+$2,450.00" 
            status="COMPLETED" 
            statusColor="#4ade80"
            iconBg="rgba(74, 222, 128, 0.1)"
          />
          <ActivityItem 
            icon="wallet" 
            title="Vault Payout" 
            subtitle="Yesterday, 10:12 AM" 
            amount="-$1,200.00" 
            status="PROCESSING" 
            statusColor="#a29bfe"
            iconBg="rgba(162, 155, 254, 0.1)"
          />
          <ActivityItem 
            icon="star" 
            title="Partner Commission" 
            subtitle="24 Oct, 2023" 
            amount="+$842.10" 
            status="COMPLETED" 
            statusColor="#4ade80"
            iconBg="rgba(74, 222, 128, 0.1)"
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const ActivityItem = ({ icon, title, subtitle, amount, status, statusColor, iconBg }: any) => (
  <View style={styles.activityCard}>
    <View style={[styles.activityIconBox, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={22} color={statusColor} />
    </View>
    <View style={styles.activityMain}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activitySubtitle}>{subtitle}</Text>
    </View>
    <View style={styles.activityRight}>
      <Text style={[styles.activityAmount, { color: amount.startsWith('+') ? '#4ade80' : '#f8fafc' }]}>{amount}</Text>
      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
        <Text style={[styles.activityStatus, { color: statusColor }]}>{status}</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  backgroundOrb: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    blurRadius: 80,
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarButton: {
    padding: 4,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#09090b',
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  balanceLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 28,
    color: '#38bdf8',
    fontWeight: '700',
    marginTop: 8,
    marginRight: 2,
  },
  balanceAmount: {
    fontSize: 56,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -2,
    textShadowColor: 'rgba(56, 189, 248, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  balanceDecimal: {
    fontSize: 28,
    color: '#475569',
    fontWeight: '700',
    marginTop: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  trendingText: {
    color: '#4ade80',
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 13,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 12,
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  chartTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  chartSubtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
  chartStats: {
    alignItems: 'flex-end',
  },
  chartStatAmount: {
    color: '#4ade80',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  chartStatLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  chart: {
    marginLeft: -8,
  },
  chartPlaceholder: {
    height: 180,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  quickActions: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  actionIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  activitySection: {
    marginBottom: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  activityIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityMain: {
    flex: 1,
  },
  activityTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  activitySubtitle: {
    color: '#64748b',
    fontSize: 12,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  activityStatus: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

