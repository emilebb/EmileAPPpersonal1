import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { verificarConexionYSincronizar } from '../lib/offline-sync';

let syncInterval: any = null;
let isListening = false;

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Configurar listener para cambios de conexión
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = isOnline === false;
      const nowOnline = state.isConnected === true;
      
      setIsOnline(state.isConnected);
      
      // Si volvemos a estar online, sincronizar automáticamente
      if (wasOffline && nowOnline) {
        console.log('Conexión restaurada. Iniciando sincronización...');
        sincronizarConFeedback();
      }
    });

    // Verificar estado inicial
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected);
      if (state.isConnected) {
        sincronizarConFeedback();
      }
    });

    // Configurar sincronización periódica (cada 5 minutos)
    syncInterval = setInterval(() => {
      if (isOnline) {
        verificarConexionYSincronizar();
        setLastSyncTime(new Date());
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      unsubscribe();
      if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
      }
    };
  }, [isOnline]);

  const sincronizarConFeedback = async () => {
    try {
      const resultado = await verificarConexionYSincronizar();
      setLastSyncTime(new Date());
      
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
    } catch (error) {
      console.error('Error en sincronización automática:', error);
    }
  };

  const sincronizarManual = async () => {
    await sincronizarConFeedback();
  };

  return {
    isOnline,
    lastSyncTime,
    sincronizarManual,
  };
};

// Hook global para la app
export const GlobalSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline } = useOfflineSync();

  return React.createElement(React.Fragment, null, children);
};
