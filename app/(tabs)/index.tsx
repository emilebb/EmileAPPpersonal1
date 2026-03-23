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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <View style={styles.avatarWrapper}>
              <Ionicons name="person-circle" size={40} color="#38bdf8" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Money Maker</Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#f8fafc" />
          </TouchableOpacity>
        </View>

        {/* Global Balance */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>TOTAL VAULT BALANCE</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.currencySymbol}>$</Text>
            <Text style={styles.balanceAmount}>124,592</Text>
            <Text style={styles.balanceDecimal}>.80</Text>
          </View>
          
          <View style={styles.badgeRow}>
            <View style={styles.trendingBadge}>
              <Ionicons name="trending-up" size={14} color="#38bdf8" />
              <Text style={styles.trendingText}>+12.4%</Text>
            </View>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterText}>WEEKLY</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Revenue Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Weekly Revenue</Text>
              <Text style={styles.chartSubtitle}>Performance Metrics</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
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
              width={width - 40}
              height={180}
              chartConfig={{
                backgroundColor: "#1a1d24",
                backgroundGradientFrom: "#1a1d24",
                backgroundGradientTo: "#1a1d24",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(50, 210, 255, ${opacity})`,
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
            <View style={{ height: 180, backgroundColor: '#1a1d24' }} />
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={handleUpgrade}>
              <Text style={styles.seeAllText}>SEE ALL</Text>
            </TouchableOpacity>
          </View>

          <ActivityItem 
            icon="bag-handle" 
            title="Product Sales" 
            subtitle="Today, 2:45 PM" 
            amount="+$2,450.00" 
            status="COMPLETED" 
            statusColor="#38bdf8"
          />
          <ActivityItem 
            icon="wallet" 
            title="Vault Payout" 
            subtitle="Yesterday, 10:12 AM" 
            amount="-$1,200.00" 
            status="PROCESSING" 
            statusColor="#a29bfe"
          />
          <ActivityItem 
            icon="star" 
            title="Partner Commission" 
            subtitle="24 Oct, 2023" 
            amount="+$842.10" 
            status="COMPLETED" 
            statusColor="#38bdf8"
          />
        </View>

        {/* Action Tiles */}
        <View style={styles.tilesRow}>
          <ActionTile icon="send" label="Transfer" sublabel="Move funds instantly" />
          <ActionTile icon="card" label="Top Up" sublabel="Add liquidity to vault" />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const ActivityItem = ({ icon, title, subtitle, amount, status, statusColor }: any) => (
  <View style={styles.activityCard}>
    <View style={styles.activityIconBox}>
      <Ionicons name={icon} size={22} color="#38bdf8" />
    </View>
    <View style={styles.activityMain}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activitySubtitle}>{subtitle}</Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={[styles.activityAmount, { color: amount.startsWith('+') ? '#38bdf8' : '#f8fafc' }]}>{amount}</Text>
      <Text style={[styles.activityStatus, { color: statusColor }]}>{status}</Text>
    </View>
  </View>
);

const ActionTile = ({ icon, label, sublabel }: any) => (
  <TouchableOpacity style={styles.actionTile}>
    <Ionicons name={icon} size={24} color="#38bdf8" style={{ marginBottom: 12 }} />
    <Text style={styles.tileLabel}>{label}</Text>
    <Text style={styles.tileSublabel}>{sublabel}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1017',
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  balanceLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 24,
    color: '#1e3a4f',
    fontWeight: 'bold',
    marginTop: 10,
    marginRight: 4,
  },
  balanceAmount: {
    fontSize: 64,
    fontWeight: '900',
    color: '#1e3a8a', // Darker blue base
    textShadowColor: 'rgba(56, 189, 248, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  balanceDecimal: {
    fontSize: 32,
    color: '#1e3a4f',
    fontWeight: 'bold',
    marginTop: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  trendingText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
  filterChip: {
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  filterText: {
    color: '#94a3b8',
    fontWeight: 'bold',
    fontSize: 14,
  },
  chartCard: {
    backgroundColor: '#1a1d24',
    borderRadius: 30,
    padding: 24,
    marginBottom: 40,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  chartTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartSubtitle: {
    color: '#64748b',
    fontSize: 12,
  },
  chartStatAmount: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartStatLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
  },
  chart: {
    marginLeft: -20,
  },
  activitySection: {
    marginBottom: 40,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  seeAllText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1d24',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
  },
  activityIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityMain: {
    flex: 1,
  },
  activityTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activitySubtitle: {
    color: '#64748b',
    fontSize: 12,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activityStatus: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 15,
  },
  actionTile: {
    flex: 1,
    backgroundColor: '#1a1d24',
    padding: 24,
    borderRadius: 30,
  },
  tileLabel: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tileSublabel: {
    color: '#64748b',
    fontSize: 11,
  },
});

