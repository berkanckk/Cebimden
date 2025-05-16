import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import { getFirebaseToken } from '../utils/firebaseHelper';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Firebase token'larını al
  const getTokens = async () => {
    try {
      // Sadece FCM Device Token al (Firebase Access Token backend'de alınacak)
      const fcmToken = await messaging().getToken();
      console.log('FCM Token alındı:', fcmToken);
      
      return { fcmToken };
    } catch (error) {
      console.error('Token alma hatası:', error);
      return { fcmToken: null };
    }
  };

  // Login işlemi
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen email ve şifre girin');
      return;
    }
    
    setLoading(true);
    
    try {
      // Sadece FCM Token'ı al
      const { fcmToken } = await getTokens();
      
      // Login isteği
      const response = await api.post('/auth/login', {
        email,
        password,
        fcmToken
      });
      
      // Token ve kullanıcı bilgilerini sakla
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      
      // Firebase Access Token kullanıcı bilgilerinden al ve gerekirse sakla
      if (response.data.user.firebaseAccessToken) {
        console.log('Backend\'den Firebase Access Token alındı');
        await AsyncStorage.setItem('firebaseAccessToken', response.data.user.firebaseAccessToken);
      }
      
      // Bildirim ayarlarını güncelle
      updateNotificationSettings();
      
      // Ana sayfaya yönlendir
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }]
      });
    } catch (error) {
      Alert.alert('Giriş Başarısız', error.response?.data?.message || 'Giriş yapılamadı, lütfen tekrar deneyin');
    } finally {
      setLoading(false);
    }
  };
} 