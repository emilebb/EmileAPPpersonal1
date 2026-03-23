import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Alert, Platform } from 'react-native';
import { supabase } from './supabase';

export interface VentaData {
  producto_id: string;
  cantidad_venta: number;
  precio_total: number;
  timestamp: string;
  producto_nombre: string;
  sync_status?: 'pending' | 'synced';
}

export interface SyncQueueItem extends VentaData {
  id: string;
  retry_count?: number;
}

const QUEUE_KEY = 'cola_ventas';

export const finalizarVentaOffline = async (datosVenta: VentaData): Promise<void> => {
  try {
    const estadoRed = await NetInfo.fetch();

    if (estadoRed.isConnected) {
      // Si hay internet, directo a Supabase
      await guardarEnSupabase(datosVenta);
      
      // Guardar como sincronizado para el historial local
      await guardarVentaLocal({ ...datosVenta, sync_status: 'synced' });
      
      if (Platform.OS === 'web') {
        window.alert("¡Éxito! Venta registrada y sincronizada.");
      } else {
        Alert.alert("¡Éxito!", "Venta registrada y sincronizada.");
      }
    } else {
      // Si NO hay, guardamos en la cola local
      const colaActual = await obtenerColaVentas();
      const nuevaVenta: SyncQueueItem = {
        ...datosVenta,
        id: Date.now().toString(),
        sync_status: 'pending',
        retry_count: 0
      };
      
      colaActual.push(nuevaVenta);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(colaActual));
      
      // Guardar en historial local
      await guardarVentaLocal({ ...datosVenta, sync_status: 'pending' });
      
      if (Platform.OS === 'web') {
        window.alert("Modo Offline", "Venta guardada localmente. Se sincronizará al volver la conexión.");
      } else {
        Alert.alert("Modo Offline", "Venta guardada localmente. Se sincronizará al volver la conexión.");
      }
    }
  } catch (error) {
    console.error('Error en finalizarVentaOffline:', error);
    
    // Si falla la conexión, guardar como pendiente
    try {
      const colaActual = await obtenerColaVentas();
      const nuevaVenta: SyncQueueItem = {
        ...datosVenta,
        id: Date.now().toString(),
        sync_status: 'pending',
        retry_count: 0
      };
      
      colaActual.push(nuevaVenta);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(colaActual));
      
      await guardarVentaLocal({ ...datosVenta, sync_status: 'pending' });
      
      if (Platform.OS === 'web') {
        window.alert("Modo Offline", "Venta guardada localmente. Se sincronizará al volver la conexión.");
      } else {
        Alert.alert("Modo Offline", "Venta guardada localmente. Se sincronizará al volver la conexión.");
      }
    } catch (localError) {
      console.error('Error crítico guardando localmente:', localError);
      if (Platform.OS === 'web') {
        window.alert("Error crítico", "No se pudo guardar la venta. Intente nuevamente.");
      } else {
        Alert.alert("Error crítico", "No se pudo guardar la venta. Intente nuevamente.");
      }
    }
  }
};

export const guardarEnSupabase = async (datosVenta: VentaData): Promise<void> => {
  const { error } = await supabase.rpc('registrar_venta', {
    producto_id: datosVenta.producto_id,
    cantidad_venta: datosVenta.cantidad_venta,
    precio_total: datosVenta.precio_total
  });

  if (error) {
    throw new Error(`Error en Supabase: ${error.message}`);
  }
};

export const obtenerColaVentas = async (): Promise<SyncQueueItem[]> => {
  try {
    const colaData = await AsyncStorage.getItem(QUEUE_KEY);
    return colaData ? JSON.parse(colaData) : [];
  } catch (error) {
    console.error('Error obteniendo cola:', error);
    return [];
  }
};

export const sincronizarVentasPendientes = async (): Promise<{ sincronizadas: number; errores: number }> => {
  const cola = await obtenerColaVentas();
  const colaActualizada: SyncQueueItem[] = [];
  let sincronizadas = 0;
  let errores = 0;

  try {
    const estadoRed = await NetInfo.fetch();
    
    if (!estadoRed.isConnected) {
      return { sincronizadas: 0, errores: 0 };
    }

    for (const venta of cola) {
      try {
        await guardarEnSupabase(venta);
        sincronizadas++;
        
        // Actualizar estado en historial local
        await actualizarEstadoVenta(venta.id, 'synced');
        
      } catch (error) {
        console.error(`Error sincronizando venta ${venta.id}:`, error);
        
        // Reintentar hasta 3 veces
        const retryCount = (venta.retry_count || 0) + 1;
        if (retryCount < 3) {
          colaActualizada.push({ ...venta, retry_count: retryCount });
        } else {
          errores++;
          // Marcar como error permanente después de 3 intentos
          await actualizarEstadoVenta(venta.id, 'error');
        }
      }
    }

    // Actualizar cola con los pendientes
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(colaActualizada));

    return { sincronizadas, errores };
    
  } catch (error) {
    console.error('Error en sincronización:', error);
    return { sincronizadas: 0, errores: cola.length };
  }
};

export const guardarVentaLocal = async (venta: VentaData): Promise<void> => {
  try {
    const ventasLocalKey = 'ventas_local';
    const ventasActuales = await obtenerVentasLocales();
    
    const nuevaVenta = {
      ...venta,
      id: Date.now().toString(),
      timestamp: venta.timestamp || new Date().toISOString()
    };
    
    ventasActuales.push(nuevaVenta);
    await AsyncStorage.setItem(ventasLocalKey, JSON.stringify(ventasActuales));
  } catch (error) {
    console.error('Error guardando venta local:', error);
    throw error;
  }
};

export const obtenerVentasLocales = async (): Promise<any[]> => {
  try {
    const ventasData = await AsyncStorage.getItem('ventas_local');
    return ventasData ? JSON.parse(ventasData) : [];
  } catch (error) {
    console.error('Error obteniendo ventas locales:', error);
    return [];
  }
};

export const actualizarEstadoVenta = async (ventaId: string, estado: 'pending' | 'synced' | 'error'): Promise<void> => {
  try {
    const ventasActuales = await obtenerVentasLocales();
    const ventasActualizadas = ventasActuales.map(venta => 
      venta.id === ventaId ? { ...venta, sync_status: estado } : venta
    );
    
    await AsyncStorage.setItem('ventas_local', JSON.stringify(ventasActualizadas));
  } catch (error) {
    console.error('Error actualizando estado venta:', error);
  }
};

export const limpiarColaSincronizacion = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch (error) {
    console.error('Error limpiando cola:', error);
  }
};

export const verificarConexionYSincronizar = async (): Promise<{ sincronizadas: number; errores: number }> => {
  try {
    const estadoRed = await NetInfo.fetch();
    
    if (estadoRed.isConnected) {
      const resultado = await sincronizarVentasPendientes();
      
      if (resultado.sincronizadas > 0) {
        if (Platform.OS === 'web') {
          window.alert(`Sincronización completada: ${resultado.sincronizadas} ventas sincronizadas.`);
        } else {
          Alert.alert("Sincronización", `${resultado.sincronizadas} ventas sincronizadas correctamente.`);
        }
      }
      
      if (resultado.errores > 0) {
        console.warn(`${resultado.errores} ventas no pudieron sincronizarse después de múltiples intentos.`);
      }
      
      return resultado;
    } else {
      return { sincronizadas: 0, errores: 0 };
    }
  } catch (error) {
    console.error('Error en verificación de conexión:', error);
    return { sincronizadas: 0, errores: 0 };
  }
};
