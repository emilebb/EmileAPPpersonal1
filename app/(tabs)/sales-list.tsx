import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Platform, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { obtenerVentasLocales, verificarConexionYSincronizar } from '../../lib/offline-sync';

interface VentaLocal {
  id: string;
  producto_id: string;
  producto_nombre: string;
  cantidad_venta: number;
  precio_total: number;
  timestamp: string;
  sync_status: 'pending' | 'synced' | 'error';
}

export default function SalesListScreen() {
  const [ventas, setVentas] = useState<VentaLocal[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarVentas();
    // Verificar conexión y sincronizar al montar
    verificarConexionYSincronizar();
  }, []);

  const cargarVentas = async () => {
    try {
      const ventasData = await obtenerVentasLocales();
      // Ordenar por timestamp descendente
      const ventasOrdenadas = ventasData.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setVentas(ventasOrdenadas);
    } catch (error) {
      console.error('Error cargando ventas:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await verificarConexionYSincronizar();
    await cargarVentas();
    setRefreshing(false);
  };

  const formatearFecha = (timestamp: string) => {
    const fecha = new Date(timestamp);
    const hoy = new Date();
    const esHoy = fecha.toDateString() === hoy.toDateString();
    
    if (esHoy) {
      return `Hoy, ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return fecha.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const getSyncIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <Ionicons name="checkmark-circle" size={20} color="#4ade80" />;
      case 'pending':
        return <Ionicons name="time" size={20} color="#fbbf24" />;
      case 'error':
        return <Ionicons name="close-circle" size={20} color="#ef4444" />;
      default:
        return null;
    }
  };

  const getSyncText = (status: string) => {
    switch (status) {
      case 'synced':
        return "Sincronizado";
      case 'pending':
        return "Pendiente";
      case 'error':
        return "Error";
      default:
        return "";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Ventas</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={24} color="#38bdf8" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />
        }
      >
        {ventas.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#64748b" />
            <Text style={styles.emptyText}>No hay ventas registradas</Text>
            <Text style={styles.emptySubtext}>Las ventas aparecerán aquí una vez que las registres</Text>
          </View>
        ) : (
          ventas.map((ventaItem) => (
            <View key={ventaItem.id} style={styles.ventaCard}>
              <View style={styles.ventaHeader}>
                <View style={styles.ventaInfo}>
                  <Text style={styles.productoNombre}>{ventaItem.producto_nombre}</Text>
                  <Text style={styles.ventaFecha}>{formatearFecha(ventaItem.timestamp)}</Text>
                </View>
                <View style={styles.syncContainer}>
                  {getSyncIcon(ventaItem.sync_status)}
                  <Text style={[styles.syncText, {
                    color: ventaItem.sync_status === 'synced' ? '#4ade80' : 
                           ventaItem.sync_status === 'pending' ? '#fbbf24' : '#ef4444'
                  }]}>
                    {getSyncText(ventaItem.sync_status)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.ventaDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cantidad:</Text>
                  <Text style={styles.detailValue}>{ventaItem.cantidad_venta}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total:</Text>
                  <Text style={styles.precioTotal}>${ventaItem.precio_total.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#94a3b8',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  ventaCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ventaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ventaInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  ventaFecha: {
    fontSize: 14,
    color: '#64748b',
  },
  syncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  ventaDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginRight: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: '600',
  },
  precioTotal: {
    fontSize: 18,
    color: '#4ade80',
    fontWeight: 'bold',
  },
});
