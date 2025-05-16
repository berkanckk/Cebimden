import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { paymentService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { createNotificationChannel } from './notifications';

// FCM token alma ve güncelleme işlemi
export const initializeFirebase = async () => {
  try {
    console.log('Firebase başlatılıyor...');
    
    // iOS için bildirim izni istemek gerekiyor
    if (Platform.OS === 'ios') {
      console.log('iOS platformu için bildirim izni isteniyor...');
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
      if (!enabled) {
        console.log('Firebase bildirim izni reddedildi');
        return false;
      }
      console.log('iOS bildirim izni alındı');
    }
    
    // FCM token al
    console.log('FCM token alınıyor...');
    const token = await messaging().getToken();
    console.log('FCM Token alındı:', token);
    
    // FCM token'ı yerel olarak sakla, oturum açıldığında kullanılacak
    if (token) {
      console.log('FCM token AsyncStorage\'a kaydediliyor...');
      await AsyncStorage.setItem('fcmToken', token);
      console.log('FCM token AsyncStorage\'a kaydedildi');
      
      // Token'ı kontrol et
      const savedToken = await AsyncStorage.getItem('fcmToken');
      console.log('AsyncStorage\'dan okunan FCM token:', savedToken);
    }
    
    // Token yenilendiğinde
    messaging().onTokenRefresh(async (newToken) => {
      console.log('FCM Token yenilendi:', newToken);
      await AsyncStorage.setItem('fcmToken', newToken);
      console.log('Yeni FCM token AsyncStorage\'a kaydedildi');
      
      // Not: Oturum açılmışsa, sonraki girişte yeni token otomatik gönderilecek
    });
    
    return true;
  } catch (error) {
    console.error('Firebase başlatma hatası:', error);
    return false;
  }
};

// Arka planda bildirim geldiğinde
export const setBackgroundMessageHandler = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Arka plan mesajı alındı:', remoteMessage);
    
    // Arka planda gelen bildirimleri notifee ile göster
    try {
      if (remoteMessage && (remoteMessage.notification || remoteMessage.data)) {
        const channelId = await createNotificationChannel();
        
        await notifee.displayNotification({
          title: remoteMessage.notification?.title || 'Cebimde Bildirimi',
          body: remoteMessage.notification?.body || 'Yeni bir bildiriminiz var',
          android: {
            channelId: 'payment_reminders',
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
            },
            smallIcon: 'ic_launcher',
            sound: 'default',
            vibrationPattern: [300, 500],
          },
          ios: {
            sound: 'default',
          },
          data: remoteMessage.data,
        });
        
        console.log('Arka plan bildirimi başarıyla gösterildi');
      }
    } catch (error) {
      console.error('Arka plan bildirimi gösterilirken hata:', error);
    }
  });
};

// Ön planda bildirim geldiğinde (uygulama açıkken)
export const configureForegroundNotifications = () => {
  messaging().onMessage(async (remoteMessage) => {
    console.log('Ön plan mesajı alındı:', remoteMessage);
    // Burada gelen bildirimleri işleyebilirsiniz
  });
};

// Bildirime tıklandığında (uygulama kapalı iken açılırsa)
export const checkInitialNotification = async () => {
  const remoteMessage = await messaging().getInitialNotification();
  
  if (remoteMessage) {
    console.log('Başlangıç bildirimi alındı:', remoteMessage);
    // Burada gerekli yönlendirme işlemlerini yapabilirsiniz
    return remoteMessage;
  }
  
  return null;
};

// FCM ve Notifee'yi birlikte kullanma
export const configureCombinedNotifications = () => {
  // FCM'den gelen bildirimleri Notifee aracılığıyla göster
  messaging().onMessage(async (message) => {
    console.log('Ön planda FCM bildirimi alındı:', message);
    
    if (message && (message.notification || message.data)) {
      try {
        const channelId = await createNotificationChannel();
        
        await notifee.displayNotification({
          title: message.notification?.title || 'Cebimde Bildirimi',
          body: message.notification?.body || 'Yeni bir bildiriminiz var',
          android: {
            channelId: 'payment_reminders',
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
            },
            smallIcon: 'ic_launcher',
            sound: 'default',
            vibrationPattern: [300, 500],
          },
          ios: {
            sound: 'default',
            foregroundPresentationOptions: {
              badge: true,
              sound: true,
              banner: true,
              list: true,
            },
          },
          data: message.data,
        });
        
        console.log('FCM bildirimi başarıyla gösterildi');
      } catch (error) {
        console.error('FCM bildirimi gösterilirken hata:', error);
      }
    }
  });
};

// Kullanıcı oturum açtığında FCM token gönderme işlemine artık gerek yok
// Giriş ve kayıt işlemleri sırasında FCM token otomatik olarak gönderiliyor

export default {
  initializeFirebase,
  setBackgroundMessageHandler,
  configureForegroundNotifications,
  checkInitialNotification,
  configureCombinedNotifications
}; 