import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_TOKEN_KEY = 'firebase_fcm_token';
const FIREBASE_ACCESS_TOKEN_KEY = 'firebase_access_token';

/**
 * FCM token al ve önbelleğe sakla
 */
export const getFCMToken = async () => {
  try {
    // Önce önbellekten kontrol et
    let fcmToken = await AsyncStorage.getItem(FIREBASE_TOKEN_KEY);

    // Token yoksa veya yenilenmesi gerekiyorsa, yeni token al
    if (!fcmToken) {
      fcmToken = await messaging().getToken();
      
      // Önbelleğe kaydet
      if (fcmToken) {
        await AsyncStorage.setItem(FIREBASE_TOKEN_KEY, fcmToken);
      }
    }
    
    return fcmToken;
  } catch (error) {
    console.error('FCM token alma hatası:', error);
    return null;
  }
};

/**
 * Firebase'de anonim oturum aç
 */
export const signInAnonymously = async () => {
  try {
    // Kullanıcı zaten authenticate olmuş mu kontrol et
    if (auth().currentUser) {
      console.log('Zaten oturum açılmış:', auth().currentUser.uid);
      return auth().currentUser;
    }
    
    // Anonim olarak oturum aç
    const result = await auth().signInAnonymously();
    console.log('Anonim oturum açıldı:', result.user.uid);
    return result.user;
  } catch (error) {
    console.error('Anonim oturum açma hatası:', error);
    return null;
  }
};

/**
 * Firebase access token al (eğer gerekirse önce oturum aç)
 */
export const getFirebaseAccessToken = async () => {
  try {
    // Kullanıcı authenticate olmamışsa, anonim oturum aç
    let currentUser = auth().currentUser;
    if (!currentUser) {
      console.log('Firebase kullanıcısı yok, anonim oturum açılıyor...');
      currentUser = await signInAnonymously();
      
      if (!currentUser) {
        console.log('Anonim oturum açılamadı');
        return null;
      }
    }
    
    // Token al (force refresh ile)
    console.log('Firebase token alınıyor...');
    const accessToken = await currentUser.getIdToken(true);
    console.log('Token alındı, uzunluk:', accessToken.length);
    
    // Önbelleğe kaydet
    if (accessToken) {
      await AsyncStorage.setItem(FIREBASE_ACCESS_TOKEN_KEY, accessToken);
      console.log('Token AsyncStorage\'a kaydedildi');
    }
    
    return accessToken;
  } catch (error) {
    console.error('Firebase access token alma hatası:', error);
    return null;
  }
};

/**
 * Tüm Firebase tokenlarını al
 */
export const getFirebaseTokens = async () => {
  try {
    const fcmToken = await getFCMToken();
    const accessToken = await getFirebaseAccessToken();
    
    return { fcmToken, accessToken };
  } catch (error) {
    console.error('Firebase token alma hatası:', error);
    return { fcmToken: null, accessToken: null };
  }
};

/**
 * Bildirimleri yapılandır ve izinleri iste
 */
export const configureNotifications = async () => {
  try {
    // Bildirim izinlerini iste
    const authStatus = await messaging().requestPermission();
    const enabled = 
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
    if (enabled) {
      console.log('Bildirim izinleri alındı');
      
      // FCM token al
      const fcmToken = await getFCMToken();
      console.log('FCM Token:', fcmToken);
      
      return fcmToken;
    } else {
      console.log('Bildirim izinleri reddedildi');
      return null;
    }
  } catch (error) {
    console.error('Bildirim yapılandırma hatası:', error);
    return null;
  }
};

export default {
  getFCMToken,
  getFirebaseAccessToken,
  getFirebaseTokens,
  configureNotifications
}; 