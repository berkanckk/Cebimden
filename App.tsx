/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { AuthProvider } from './src/hooks/useAuth';
import AppNavigator from './src/navigation';
import { COLORS } from './src/styles/colors';
import { createNotificationChannel } from './src/utils/notifications';
import notifee from '@notifee/react-native';
// Firebase modüllerini import ediyoruz
import { initializeFirebase, setBackgroundMessageHandler, configureCombinedNotifications } from './src/utils/firebase';

// For react-navigation
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function App(): React.JSX.Element {
  // Uygulama başladığında bildirim kanallarını oluştur ve Firebase'i başlat
  useEffect(() => {
    const setupNotifications = async () => {
      // Android için bildirim kanalı oluştur
      await createNotificationChannel();
      
      // İzinleri kontrol et
      await notifee.requestPermission();
      
      // Firebase'i başlat
      await initializeFirebase();
      
      // Firebase ve Notifee entegrasyonunu kur
      configureCombinedNotifications();
    };
    
    setupNotifications();
    
    // Firebase arka plan mesaj işleyicisini ayarla
    setBackgroundMessageHandler();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
