// Firebase Admin SDK'yı kullanarak uzak bildirimler gönderme
// Not: Gerçek uygulama için bu projeye bir serviceAccountKey.json dosyası ekleyin
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');
const tokenStore = require('./tokenStore');

// Google Cloud için Access Token alma
const getGoogleAccessToken = async () => {
  try {
    // Önce token store'dan token'ı kontrol et
    const storedToken = tokenStore.getFirebaseAccessToken();
    if (storedToken) {
      console.log('Token store\'dan geçerli token alındı. Kalan süre:', 
        Math.round(tokenStore.getTokenRemainingTime() / 1000 / 60), 'dakika');
      return storedToken;
    }

    // Mevcut çalışma dizini
    const cwd = process.cwd();
    console.log('getGoogleAccessToken - çalışma dizini:', cwd);
    
    // JSON dosyasını kullan
    const alternativePaths = [
      path.resolve(cwd, '../firebaseauth/cebimde-ra.json'),
      path.resolve(cwd, './firebaseauth/cebimde-ra.json'),
      path.resolve(cwd, '../../firebaseauth/cebimde-ra.json'),
      path.resolve(__dirname, '../../firebaseauth/cebimde-ra.json'),
      path.resolve(__dirname, '../../../firebaseauth/cebimde-ra.json'),
      'C:/Cebimde/firebaseauth/cebimde-ra.json'
    ];
    
    let serviceAccountFile = null;
    
    for (const testPath of alternativePaths) {
      console.log(`Token için yol deneniyor: ${testPath}`);
      if (fs.existsSync(testPath)) {
        try {
          const fileContent = fs.readFileSync(testPath, 'utf8');
          serviceAccountFile = JSON.parse(fileContent);
          console.log('Service Account dosyası token için okundu.');
          break;
        } catch (err) {
          console.error(`Token için dosya ${testPath} bulundu ama okuma/parse hatası:`, err.message);
        }
      }
    }
    
    if (!serviceAccountFile) {
      console.error('Service Account dosyası token için bulunamadı.');
      return null;
    }
    
    // GoogleAuth doğrudan JSON nesnesi ile oluştur
    console.log('GoogleAuth token için oluşturuluyor...');
    const auth = new GoogleAuth({
      credentials: serviceAccountFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"]
    });
    
    // Client oluştur ve erişim jetonunu al
    console.log('Auth client token için oluşturuluyor...');
    const client = await auth.getClient();
    console.log('Auth client başarıyla oluşturuldu, token alınıyor...');
    const tokenData = await client.getAccessToken();
    console.log('Token verisi alındı');
    
    // Token süresi (55 dakika)
    const expiryTime = 55 * 60 * 1000;
    
    // Token'ı token store'a kaydet
    tokenStore.storeFirebaseAccessToken(tokenData.token, expiryTime);
    
    console.log('Yeni Google Access Token alındı ve store\'a kaydedildi.');
    
    return tokenData.token;
  } catch (error) {
    console.error('Google Access Token alma hatası:', error);
    console.error('Token hata yığını:', error.stack);
    return null;
  }
};

// Firebase Admin SDK'yı başlat
const initializeFirebaseAdmin = () => {
  try {
    // cebimde-ra.json dosyasının yolunu kontrol edin (Service Account Key)
    const cwd = process.cwd();
    console.log('Mevcut çalışma dizini:', cwd);
    
    // Mutlak yol kullan
    const serviceAccountPath = path.resolve(cwd, '../firebaseauth/cebimde-ra.json');
    console.log('Service account dosya yolu (mutlak):', serviceAccountPath);
    
    // Alternatif yollar dene
    const alternativePaths = [
      path.resolve(cwd, '../firebaseauth/cebimde-ra.json'),
      path.resolve(cwd, './firebaseauth/cebimde-ra.json'),
      path.resolve(cwd, '../../firebaseauth/cebimde-ra.json'),
      path.resolve(__dirname, '../../firebaseauth/cebimde-ra.json'),
      path.resolve(__dirname, '../../../firebaseauth/cebimde-ra.json'),
      'C:/Cebimde/firebaseauth/cebimde-ra.json'
    ];
    
    console.log('Olası dosya yollarını kontrol ediyorum...');
    let serviceAccountFile = null;
    let foundPath = null;
    
    for (const testPath of alternativePaths) {
      console.log(`Yol deneniyor: ${testPath}`);
      if (fs.existsSync(testPath)) {
        console.log(`Dosya bulundu: ${testPath}`);
        foundPath = testPath;
        try {
          const fileContent = fs.readFileSync(testPath, 'utf8');
          serviceAccountFile = JSON.parse(fileContent);
          console.log('Service Account dosyası başarıyla okundu ve parse edildi.');
          break;
        } catch (err) {
          console.error(`Dosya ${testPath} bulundu ama okuma/parse hatası:`, err.message);
        }
      }
    }
    
    if (!serviceAccountFile) {
      console.warn('Service Account dosyası bulunamadı veya okunamadı. Firebase Admin başlatılamayacak.');
      return false;
    }
    
    // Direkt olarak JSON dosyasını kullan (dosya yolu değil)
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountFile)
    });
    
    console.log('Firebase Admin SDK başarıyla başlatıldı');
    return true;
  } catch (error) {
    console.error('Firebase Admin SDK başlatma hatası:', error);
    console.error('Hata yığını:', error.stack);
    return false;
  }
};

// Bir cihaza bildirim gönderme
const sendNotificationToDevice = async (fcmToken, title, body, data = {}) => {
  try {
    if (!fcmToken) {
      console.warn('FCM token boş. Bildirim gönderilemiyor.');
      return false;
    }
    
    // Bildirim mesajını oluştur
    const message = {
      notification: {
        title,
        body
      },
      data,
      token: fcmToken
    };
    
    // Bildirimi gönder
    const response = await admin.messaging().send(message);
    console.log('Bildirim başarıyla gönderildi:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Bildirim gönderme hatası:', error);
    return { success: false, error: error.message };
  }
};

// HTTP ile FCM bildirim gönderme (Access Token kullanarak)
const sendNotificationWithAccessToken = async (fcmToken, title, body, data = {}) => {
  try {
    if (!fcmToken) {
      console.warn('FCM token boş. Bildirim gönderilemiyor.');
      return false;
    }
    
    // Google Access Token'ı al - önce token store'dan, yoksa yeni al
    const accessToken = tokenStore.getFirebaseAccessToken() || await getGoogleAccessToken();
    if (!accessToken) {
      console.error('Access Token alınamadı. Bildirim gönderilemiyor.');
      return { success: false, error: 'Access Token alınamadı' };
    }
    
    // FCM API endpoint
    const fcmEndpoint = 'https://fcm.googleapis.com/v1/projects/cebimde-94ab9/messages:send';
    
    // Bildirim mesajını oluştur
    const message = {
      message: {
        token: fcmToken,
        notification: {
          title,
          body
        },
        data
      }
    };
    
    // HTTP Post isteği gönder
    const response = await fetch(fcmEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('FCM API hatası:', response.status, errorText);
      
      // 401 hatası (Unauthorized) - token geçersiz olabilir, yeniden dene
      if (response.status === 401) {
        console.log('Token geçersiz olabilir, token store temizleniyor ve yeni token alınıyor...');
        tokenStore.clearToken();
        const newToken = await getGoogleAccessToken();
        
        if (newToken) {
          console.log('Yeni token alındı, bildirimi tekrar göndermeye çalışılıyor...');
          return await sendNotificationWithAccessToken(fcmToken, title, body, data);
        }
      }
      
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    
    const responseData = await response.json();
    console.log('HTTP ile bildirim başarıyla gönderildi:', responseData);
    return { success: true, data: responseData };
  } catch (error) {
    console.error('HTTP bildirim gönderme hatası:', error);
    return { success: false, error: error.message };
  }
};

// Konuya bildirim gönderme (örn: 'payments', 'reminders' vb)
const sendNotificationToTopic = async (topic, title, body, data = {}) => {
  try {
    // Bildirim mesajını oluştur
    const message = {
      notification: {
        title,
        body
      },
      data,
      topic
    };
    
    // Bildirimi gönder
    const response = await admin.messaging().send(message);
    console.log(`${topic} konusuna bildirim gönderildi:`, response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Konu bildirimi gönderme hatası:', error);
    return { success: false, error: error.message };
  }
};

// Çoklu cihazlara bildirim gönderme
const sendMulticastNotification = async (fcmTokens, title, body, data = {}) => {
  try {
    if (!fcmTokens || !fcmTokens.length) {
      console.warn('FCM tokenları boş. Bildirimler gönderilemiyor.');
      return false;
    }
    
    // Bildirim mesajını oluştur
    const message = {
      notification: {
        title,
        body
      },
      data,
      tokens: fcmTokens
    };
    
    // Bildirimleri gönder
    const response = await admin.messaging().sendMulticast(message);
    console.log(`${response.successCount} başarılı, ${response.failureCount} başarısız bildirim.`);
    return { 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses 
    };
  } catch (error) {
    console.error('Çoklu bildirim gönderme hatası:', error);
    return { success: false, error: error.message };
  }
};

// Ödeme bildirimi gönderme yardımcı fonksiyonu
const sendPaymentNotification = async (user, payment) => {
  try {
    if (!user || !user.fcmToken || !user.enableFirebaseNotifications) {
      console.log('Kullanıcı FCM tokenı yok veya bildirimleri kapalı.');
      return false;
    }
    
    const title = 'Ödeme Hatırlatıcısı';
    const body = `${payment.amount} ${payment.currency} tutarındaki ${payment.title} ödemeniz bugün.`;
    
    const data = {
      paymentId: payment.id,
      type: 'payment_reminder',
      amount: payment.amount.toString(),
      currency: payment.currency,
      date: payment.paymentDate
    };
    
    return await sendNotificationToDevice(user.fcmToken, title, body, data);
  } catch (error) {
    console.error('Ödeme bildirimi gönderme hatası:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  initializeFirebaseAdmin,
  getGoogleAccessToken,
  sendNotificationToDevice,
  sendNotificationToTopic,
  sendMulticastNotification,
  sendPaymentNotification,
  sendNotificationWithAccessToken
}; 