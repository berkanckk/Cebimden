import { firebaseHelper } from '../utils/firebaseHelper';
import { messaging } from '../utils/firebaseHelper';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignupScreen = ({ navigation }) => {
  const handleSignup = async () => {
    // Validasyon kontrolleri
    if (!name || !email || !password || !passwordConfirm) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }
    
    if (password !== passwordConfirm) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }
    
    setLoading(true);
    
    try {
      // Sadece FCM Token'ı al
      const fcmToken = await messaging().getToken();
      console.log('FCM Token alındı:', fcmToken);
      
      // Kayıt isteği
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        fcmToken,
        enableNotifications: true,
        enableFirebaseNotifications: true,
        notificationTime: '09:00'
      });
      
      // Token ve kullanıcı bilgilerini sakla
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      
      // Firebase Access Token kullanıcı bilgilerinden al ve gerekirse sakla
      if (response.data.user.firebaseAccessToken) {
        console.log('Backend\'den Firebase Access Token alındı');
        await AsyncStorage.setItem('firebaseAccessToken', response.data.user.firebaseAccessToken);
      }
      
      // Bildirimleri yapılandır
      await configureNotifications();
      
      // Ana sayfaya yönlendir
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }]
      });
      
    } catch (error) {
      Alert.alert('Kayıt Başarısız', error.response?.data?.message || 'Kayıt yapılamadı, lütfen tekrar deneyin');
    } finally {
      setLoading(false);
    }
  };

  // Bildirimleri yapılandır
  const configureNotifications = async () => {
    const authStatus = await messaging().requestPermission();
    return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
           authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  };
} 