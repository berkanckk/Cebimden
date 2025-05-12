import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { COLORS } from '../../styles/colors';
import { globalStyles } from '../../styles/globalStyles';
import { paymentService } from '../../services/api';
import GradientButton from '../../components/GradientButton';
import Header from '../../components/Header';
import DateTimePicker from '@react-native-community/datetimepicker';
import { clearAllNotifications } from '../../utils/notifications';
import messaging from '@react-native-firebase/messaging';

const NotificationSettingsScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [enableFirebaseNotifications, setEnableFirebaseNotifications] = useState(true);
  const [dayBeforeReminder, setDayBeforeReminder] = useState(true);
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Bildirim tercihlerini yükle
  useEffect(() => {
    const loadNotificationPreferences = async () => {
      try {
        const response = await paymentService.getNotificationPreferences();
        
        if (response.data) {
          setEnableNotifications(response.data.enableNotifications);
          setDayBeforeReminder(response.data.dayBeforeReminder);
          
          // Firebase bildirim durumunu da ayarla
          setEnableFirebaseNotifications(response.data.enableFirebaseNotifications !== false);
          
          // HH:MM formatındaki saati Date nesnesine dönüştür
          if (response.data.notificationTime) {
            const [hours, minutes] = response.data.notificationTime.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            setNotificationTime(date);
          }
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
        Alert.alert('Hata', 'Bildirim tercihleriniz yüklenirken bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotificationPreferences();
  }, []);

  // Tercihler değiştiğinde durumu güncelle
  useEffect(() => {
    setHasChanges(true);
  }, [enableNotifications, enableFirebaseNotifications, dayBeforeReminder, notificationTime]);

  // Saat formatını string olarak döndür (ör: "09:00")
  const formatTimeToString = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Zaman seçici değişimini yönet
  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setNotificationTime(selectedTime);
    }
  };

  // Firebase bildirimlerini etkinleştir/devre dışı bırak
  const handleFirebaseNotificationsToggle = async (value) => {
    try {
      setEnableFirebaseNotifications(value);
      
      if (value) {
        // Firebase bildirimlerini etkinleştir
        await messaging().requestPermission();
        const token = await messaging().getToken();
        if (token) {
          await paymentService.updateFCMToken(token);
        }
      } else {
        // Firebase bildirimlerini devre dışı bırak - sadece API'de devre dışı bırakıyoruz
        // gerçekte FCM token'ı silmek veya bildirimleri engellemek mümkün olmayabilir
      }
    } catch (error) {
      console.error('Firebase bildirim ayarları değiştirilirken hata:', error);
      Alert.alert('Hata', 'Firebase bildirim ayarları değiştirilirken bir hata oluştu.');
      setEnableFirebaseNotifications(!value); // Hata durumunda değeri geri al
    }
  };

  // Bildirimleri temizle
  const handleClearAllNotifications = async () => {
    Alert.alert(
      'Tüm Bildirimleri Temizle',
      'Tüm bildirimleri temizlemek istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllNotifications();
              Alert.alert('Başarılı', 'Tüm bildirimler temizlendi.');
            } catch (error) {
              console.error('Error clearing notifications:', error);
              Alert.alert('Hata', 'Bildirimler temizlenirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  // Değişiklikleri kaydet
  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);
      
      const preferences = {
        enableNotifications,
        dayBeforeReminder,
        notificationTime: formatTimeToString(notificationTime),
        enableFirebaseNotifications
      };
      
      await paymentService.setNotificationPreferences(preferences);
      
      setHasChanges(false);
      Alert.alert('Başarılı', 'Bildirim tercihleriniz güncellendi.');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      Alert.alert('Hata', 'Bildirim tercihleriniz kaydedilirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Bildirim Ayarları" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genel Bildirim Ayarları</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Bildirimleri Etkinleştir</Text>
            <Switch
              value={enableNotifications}
              onValueChange={setEnableNotifications}
              trackColor={{ false: COLORS.lightGrey, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Firebase Uzak Bildirimleri</Text>
            <Switch
              value={enableFirebaseNotifications}
              onValueChange={handleFirebaseNotificationsToggle}
              trackColor={{ false: COLORS.lightGrey, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
          
          {enableNotifications && (
            <>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Ödeme Gününden Bir Gün Önce Hatırlat</Text>
                <Switch
                  value={dayBeforeReminder}
                  onValueChange={setDayBeforeReminder}
                  trackColor={{ false: COLORS.lightGrey, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Bildirim Saati</Text>
                <TouchableOpacity 
                  style={styles.timePickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.timeText}>
                    {notificationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {showTimePicker && (
                <DateTimePicker
                  value={notificationTime}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                />
              )}
            </>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirimleri Yönet</Text>
          
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClearAllNotifications}
          >
            <Text style={styles.clearButtonText}>Tüm Bildirimleri Temizle</Text>
          </TouchableOpacity>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Firebase Bildirimleri Hakkında</Text>
            <Text style={styles.infoText}>
              Firebase uzak bildirimleri, uygulama geliştiricilerinin sunucudan size önemli güncellemeler 
              ve hatırlatmalar göndermesini sağlar. Bu özelliği etkinleştirerek, internet bağlantınız olmasa 
              bile ödeme hatırlatmalarınızı alabilirsiniz.
            </Text>
          </View>
        </View>
        
        {hasChanges && (
          <GradientButton
            title={isLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            onPress={handleSaveChanges}
            disabled={isLoading}
            style={styles.saveButton}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.textPrimary,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
    paddingRight: 8,
  },
  timePickerButton: {
    backgroundColor: COLORS.lightGrey,
    padding: 8,
    borderRadius: 4,
  },
  timeText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  clearButton: {
    backgroundColor: COLORS.dangerLight,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButtonText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    marginTop: 16,
  },
  infoBox: {
    backgroundColor: COLORS.infoLight || '#E3F2FD',
    padding: 12,
    borderRadius: 6,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default NotificationSettingsScreen; 