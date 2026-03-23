import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ModalScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Hazte Pro 🚀</Text>
          <Text style={styles.subtitle}>Desbloquea el poder absoluto de tu inventario.</Text>
        </View>

        <View style={styles.planCard}>
          <Text style={styles.planName}>Nivel Gratis</Text>
          <Text style={styles.planPrice}>$0<Text style={styles.month}>/mes</Text></Text>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
            <Text style={styles.featureText}>Hasta 20 productos</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
            <Text style={styles.featureText}>Hasta 50 ventas/mes</Text>
          </View>
          <Text style={styles.currentPlan}>Tu plan actual</Text>
        </View>

        <View style={[styles.planCard, styles.proCard]}>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>RECOMENDADO</Text>
          </View>
          <Text style={styles.planName}>Nivel Pro</Text>
          <Text style={styles.planPrice}>$9.99<Text style={styles.month}>/mes</Text></Text>
          <View style={styles.feature}>
            <Ionicons name="star" size={20} color="#fbbf24" />
            <Text style={styles.featureTextPro}>Productos e inventario ilimitado</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="star" size={20} color="#fbbf24" />
            <Text style={styles.featureTextPro}>Exportación a PDF / Excel</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="star" size={20} color="#fbbf24" />
            <Text style={styles.featureTextPro}>Sincronización en la nube</Text>
          </View>
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => { alert('¡Gracias por tu compra!'); router.back(); }}>
            <Text style={styles.upgradeBtnText}>Empezar Prueba Gratis</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>Quizás más tarde</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  proCard: {
    borderColor: '#38bdf8',
    borderWidth: 2,
    position: 'relative',
  },
  proBadge: {
    position: 'absolute',
    top: -12,
    right: 24,
    backgroundColor: '#38bdf8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proBadgeText: {
    color: '#0f172a',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 20,
  },
  month: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: 'normal',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    color: '#cbd5e1',
    marginLeft: 12,
    fontSize: 16,
  },
  featureTextPro: {
    color: '#f8fafc',
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  currentPlan: {
    marginTop: 10,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  upgradeBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  upgradeBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeBtn: {
    padding: 16,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 16,
  },
});
