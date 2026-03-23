import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { GlobalSyncProvider } from '../hooks/useOfflineSync';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    // Escuchar cambios de sesión y redirigir automáticamente
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        // Usa setTimeout para evitar conflictos de renderizado con Expo Router
        setTimeout(() => router.replace('/login'), 0);
      } else {
        setTimeout(() => router.replace('/'), 0);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <GlobalSyncProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GlobalSyncProvider>
  );
}
