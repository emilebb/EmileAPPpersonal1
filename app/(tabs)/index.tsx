import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

// removed global width definition

export default function DashboardScreen() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(screenWidth - 40, 300); // Evita error 418 y SVG width negativo en Web SSR

  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => { setIsMounted(true); }, []);

  const handleExport = async () => {
    try {
      const html = `
        <html>
          <body style="font-family: Arial; padding: 20px;">
            <h1>Reporte de Ventas - Money Maker</h1>
            <p><strong>Balance Total:</strong> $45,231.89</p>
            <p><strong>Crecimiento:</strong> +12.5% vs último mes</p>
            <hr />
            <h2>Actividad Reciente</h2>
            <ul>
              <li>Suscripción Premium: +$99.00</li>
              <li>Venta de Curso: +$149.00</li>
              <li>Donación: +$25.00</li>
            </ul>
          </body>
        </html>
      `;
      const { uri } = await printToFileAsync({ html });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      alert("Error exportando: " + error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Buenos días,</Text>
            <Text style={styles.userName}>Creador 🚀</Text>
          </View>
          <TouchableOpacity style={styles.proUpgradeBtn} onPress={() => router.push('/modal')}>
            <Ionicons name="star" size={16} color="#0f172a" />
            <Text style={styles.proUpgradeText}>Hazte PRO</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance Total</Text>
          <Text style={styles.balanceAmount}>$45,231.89</Text>
          <View style={styles.profitBadge}>
            <Ionicons name="trending-up" size={16} color="#4ade80" />
            <Text style={styles.profitText}>+12.5% vs último mes</Text>
          </View>
        </View>

        {/* Sales Chart Section */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Ingresos de Hoy</Text>
          {isMounted ? (
            <LineChart
              data={{
                labels: ["8am", "10am", "12pm", "2pm", "4pm", "6pm"],
                datasets: [{ data: [20, 45, 28, 80, 110, 43] }]
              }}
              width={chartWidth}
              height={220}
              yAxisLabel="$"
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: "#1e293b",
                backgroundGradientFrom: "#1e293b",
                backgroundGradientTo: "#1e293b",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: "5", strokeWidth: "2", stroke: "#0f172a" }
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={[styles.chart, { width: chartWidth, height: 220, backgroundColor: '#1e293b' }]} />
          )}
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.actionsGrid}>
          <ActionCard icon="wallet-outline" label="Retirar" color="#f472b6" />
          <ActionCard icon="cube-outline" label="Inventario" color="#facc15" onPress={() => router.push('/inventory')} />
          <ActionCard icon="document-text-outline" label="Exportar" color="#a78bfa" onPress={handleExport} />
          <ActionCard icon="log-out-outline" label="Salir" color="#ef4444" onPress={async () => await supabase.auth.signOut()} />
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Actividad Reciente</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver Todo</Text>
            </TouchableOpacity>
          </View>

          <ActivityItem icon="logo-usd" title="Suscripción Premium" amount="+$99.00" time="Hace 2 min" />
          <ActivityItem icon="cart" title="Venta de Curso" amount="+$149.00" time="Hace 1 hora" />
          <ActivityItem icon="gift" title="Donación" amount="+$25.00" time="Hace 3 horas" />
          <ActivityItem icon="logo-usd" title="Suscripción Pro" amount="+$49.00" time="Ayer" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ActionCard = ({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress?: () => void }) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress}>
    <View style={[styles.actionIconBg, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const ActivityItem = ({ icon, title, amount, time }: { icon: any; title: string; amount: string; time: string }) => (
  <View style={styles.activityItem}>
    <View style={styles.activityIconWrapper}>
      <Ionicons name={icon} size={20} color="#94a3b8" />
    </View>
    <View style={styles.activityDetails}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
    <Text style={styles.activityAmount}>{amount}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // slate-900
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: '#94a3b8', // slate-400
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc', // slate-50
  },
  proUpgradeBtn: {
    backgroundColor: '#fbbf24', // amber-400
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  proUpgradeText: {
    color: '#0f172a',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
  balanceCard: {
    backgroundColor: '#1e293b', // slate-800
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#334155', // slate-700
  },
  balanceLabel: {
    fontSize: 14,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 16,
  },
  profitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e20', // transparent green
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  profitText: {
    color: '#4ade80', // green-400
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  chartSection: {
    marginBottom: 30,
  },
  chart: {
    marginTop: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  actionCard: {
    width: (Dimensions.get('window').width - 60) / 4,
    alignItems: 'center',
    marginBottom: 15,
  },
  actionIconBg: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    color: '#e2e8f0', // slate-200
    fontSize: 12,
    fontWeight: '500',
  },
  activitySection: {
    marginTop: 10,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  seeAllText: {
    color: '#38bdf8', // sky-400
    fontWeight: '600',
    fontSize: 14,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activityIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityTime: {
    color: '#64748b', // slate-500
    fontSize: 13,
  },
  activityAmount: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
