import notifee, { AndroidImportance, EventType, TriggerType } from '@notifee/react-native';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';

// Bildirim kanalı oluşturma
export const createNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    // Android için bildirim kanalı oluşturma
    const channelId = await notifee.createChannel({
      id: 'payment_reminders',
      name: 'Ödeme Hatırlatıcıları',
      description: 'Yaklaşan ödemeleriniz için hatırlatmalar',
      importance: AndroidImportance.HIGH, // Yüksek öncelik
      sound: 'default',
      vibration: true,
      lights: true,
    });
    
    return channelId;
  }
  
  return null;
};

// Zamanlanmış bildirim oluşturma
export const schedulePaymentNotification = async (
  paymentId: string,
  title: string,
  body: string,
  paymentDate: Date,
  sendDayBefore: boolean = true
) => {
  try {
    // Bildirim kanalını oluştur (Android için)
    const channelId = await createNotificationChannel();
    
    // Ödeme günü bildirimi
    const paymentDateTrigger = new Date(paymentDate);
    paymentDateTrigger.setHours(9, 0, 0, 0); // Sabah 9:00'da bildirim
    
    // Şimdiki zamanı al
    const now = new Date();
    
    // Eğer bildirim zamanı geçmişte kaldıysa, bildirimi oluşturma
    if (paymentDateTrigger.getTime() <= now.getTime()) {
      console.log('Bildirim zamanı geçmiş, ödeme günü bildirimi oluşturulmadı:', paymentId);
    } else {
      // Bildirim zamanı gelecekte, bildirimi oluştur
      await notifee.createTriggerNotification(
        {
          id: `payment-${paymentId}`,
          title: title,
          body: body,
          android: {
            channelId: channelId || 'payment_reminders',
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
            },
            smallIcon: 'ic_launcher', // Android manifest'te tanımlı olmalı
          },
          ios: {
            sound: 'default',
          },
          data: {
            paymentId,
            type: 'payment',
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: paymentDateTrigger.getTime(),
        }
      );
    }
    
    // Ödeme gününden bir gün önce hatırlatma (isteğe bağlı)
    if (sendDayBefore) {
      const dayBeforeTrigger = new Date(paymentDate);
      dayBeforeTrigger.setDate(dayBeforeTrigger.getDate() - 1);
      dayBeforeTrigger.setHours(18, 0, 0, 0); // Akşam 6:00'da bildirim
      
      // Eğer bir gün önceki bildirim zamanı geçmişse, oluşturma
      if (dayBeforeTrigger.getTime() <= now.getTime()) {
        console.log('Bildirim zamanı geçmiş, bir gün önceki hatırlatma oluşturulmadı:', paymentId);
      } else {
        await notifee.createTriggerNotification(
          {
            id: `payment-reminder-${paymentId}`,
            title: 'Ödeme Hatırlatıcısı',
            body: `Yarın ödemeniz var: ${title}`,
            android: {
              channelId: channelId || 'payment_reminders',
              importance: AndroidImportance.HIGH,
              pressAction: {
                id: 'default',
              },
              smallIcon: 'ic_launcher',
            },
            ios: {
              sound: 'default',
            },
            data: {
              paymentId,
              type: 'payment_reminder',
            },
          },
          {
            type: TriggerType.TIMESTAMP,
            timestamp: dayBeforeTrigger.getTime(),
          }
        );
      }
    }
    
    return true;
  } catch (error) {
    console.error('Bildirim zamanlaması başarısız oldu:', error);
    return false;
  }
};

// Mevcut bildirimleri iptal etme
export const cancelPaymentNotification = async (paymentId: string) => {
  try {
    // Hem ödeme günü hem de hatırlatma bildirimlerini iptal et
    await notifee.cancelNotification(`payment-${paymentId}`);
    await notifee.cancelNotification(`payment-reminder-${paymentId}`);
    return true;
  } catch (error) {
    console.error('Bildirim iptali başarısız oldu:', error);
    return false;
  }
};

// Bildirim dinleyicisini kurmak için hook
export const useNotificationListener = (onNotificationPress?: (data: any) => void) => {
  useEffect(() => {
    // Uygulama arka plandayken veya önplandayken açılan bildirimler için
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification && onNotificationPress) {
        onNotificationPress(detail.notification.data);
      }
    });
    
    // Uygulama kapalıyken açılan bildirimler için
    const checkInitialNotification = async () => {
      const initialNotification = await notifee.getInitialNotification();
      if (initialNotification && onNotificationPress) {
        onNotificationPress(initialNotification.notification.data);
      }
    };
    
    checkInitialNotification();
    
    return () => {
      unsubscribe();
    };
  }, [onNotificationPress]);
};

// Tüm bildirimleri temizleme
export const clearAllNotifications = async () => {
  await notifee.cancelAllNotifications();
};

// Firebase'den gelen bildirimleri notifee ile gösterme
export const displayFirebaseNotification = async (remoteMessage: any) => {
  if (!remoteMessage || !remoteMessage.notification) {
    return;
  }

  const { title, body } = remoteMessage.notification;
  const data = remoteMessage.data || {};
  
  try {
    // Bildirim kanalını oluştur (Android için)
    const channelId = await createNotificationChannel();
    
    // Bildirimi göster
    await notifee.displayNotification({
      title: title || 'Cebimde Bildirimi',
      body: body || 'Yeni bir bildiriminiz var',
      android: {
        channelId: channelId || 'payment_reminders',
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        smallIcon: 'ic_launcher',
        // Ses ve titreşim ekleyelim
        sound: 'default',
        vibrationPattern: [300, 500], 
      },
      ios: {
        sound: 'default',
        // iOS için özel ayarlar
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
      },
      data,
    });
    
    return true;
  } catch (error) {
    console.error('Firebase bildirimi gösterilirken hata oluştu:', error);
    return false;
  }
};

// Firebase ile notifee'yi birleştirme hook'u
export const useCombinedNotifications = (onNotificationPress?: (data: any) => void) => {
  useEffect(() => {
    // Notifee dinleyicisi
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification && onNotificationPress) {
        onNotificationPress(detail.notification.data);
      }
    });
    
    // Firebase ön plan dinleyicisi
    const unsubscribeFirebase = messaging().onMessage(async (remoteMessage) => {
      console.log('Firebase ön plan bildirimi alındı:', remoteMessage);
      await displayFirebaseNotification(remoteMessage);
    });
    
    // Uygulama kapalıyken açılan bildirimler için
    const checkInitialNotifications = async () => {
      // Notifee için kontrol
      const initialNotifee = await notifee.getInitialNotification();
      if (initialNotifee && onNotificationPress) {
        onNotificationPress(initialNotifee.notification.data);
        return;
      }
      
      // Firebase için kontrol
      const initialFirebase = await messaging().getInitialNotification();
      if (initialFirebase && onNotificationPress) {
        onNotificationPress(initialFirebase.data);
      }
    };
    
    checkInitialNotifications();
    
    return () => {
      unsubscribeNotifee();
      unsubscribeFirebase();
    };
  }, [onNotificationPress]);
}; 