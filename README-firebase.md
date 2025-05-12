# Firebase Entegrasyonu - Cebimde Uygulaması

Bu dokümantasyon, Cebimde uygulamasına eklenen Firebase Cloud Messaging (FCM) entegrasyonu için kurulum ve kullanım kılavuzudur.

## Kurulum Adımları

### 1. Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. "Proje Ekle" seçeneğine tıklayın ve "Cebimde" adında bir proje oluşturun
3. Analitik seçeneklerini tercihlerinize göre ayarlayın ve projeyi oluşturun

### 2. Android Uygulamasını Firebase'e Ekleme

1. Firebase konsolunda, projede "Android Uygulaması Ekle" seçeneğine tıklayın
2. Android paket adını girin (`com.cebimde`)
3. SHA-1 sertifika parmak izini ekleyin (isteğe bağlı, güvenlik için önerilir)
4. Devam edin ve `google-services.json` dosyasını indirin
5. Bu dosyayı `android/app/` dizinine kopyalayın

### 3. iOS Uygulamasını Firebase'e Ekleme

1. Firebase konsolunda, projede "iOS Uygulaması Ekle" seçeneğine tıklayın
2. iOS paket kimliğini girin (`org.cebimde`)
3. Devam edin ve `GoogleService-Info.plist` dosyasını indirin
4. Bu dosyayı Xcode kullanarak iOS projenize ekleyin

### 4. Android Yapılandırması

1. `android/build.gradle` dosyasına Google Servisleri ekleyin:

```gradle
buildscript {
  dependencies {
    // ... mevcut bağımlılıklar ...
    classpath 'com.google.gms:google-services:4.3.15'
  }
}
```

2. `android/app/build.gradle` dosyasına Google Servisleri eklentisini dahil edin:

```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
  // ... mevcut bağımlılıklar ...
  implementation platform('com.google.firebase:firebase-bom:32.3.1')
  implementation 'com.google.firebase:firebase-analytics'
}
```

### 5. iOS Yapılandırması

1. iOS projesine CocoaPods ile Firebase'i ekleyin:

```ruby
# ios/Podfile
pod 'Firebase/Core', '~> 10.15.0'
pod 'Firebase/Messaging', '~> 10.15.0'
```

2. CocoaPods'u güncelleyin:

```bash
cd ios && pod install && cd ..
```

3. `ios/AppDelegate.mm` dosyasınızı güncelleyin (RN 0.71+):

```objective-c
#import <Firebase.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];
  // ... diğer kodlar ...
}
```

## Eklenen Özellikler

1. **FCM Token Yönetimi**: Kullanıcı oturum açtığında ve token yenilendiğinde otomatik güncelleme
2. **Uzak Bildirimler**: Sunucudan FCM aracılığıyla uzak bildirimler alabilme
3. **Yerel ve Uzak Bildirim Entegrasyonu**: FCM bildirimlerini Notifee ile gösterme
4. **Bildirim Tercihleri**: Kullanıcıların FCM bildirimlerini açıp kapatabilmesi

## Kullanım

### Uzak Bildirim Gönderme (Backend)

FCM'den bir bildirim göndermek için Node.js ile örnek:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const sendNotification = async (fcmToken, title, body, data = {}) => {
  try {
    const message = {
      notification: {
        title,
        body
      },
      data,
      token: fcmToken
    };
    
    const response = await admin.messaging().send(message);
    console.log('Bildirim başarıyla gönderildi:', response);
    return true;
  } catch (error) {
    console.error('Bildirim gönderirken hata:', error);
    return false;
  }
};
```

### Uygulama İçi Kullanım

Uygulama, FCM token'ı otomatik olarak yönetir ve sunucuya gönderir. Kullanıcılar "NotificationSettingsScreen" ekranında FCM bildirimlerini açıp kapatabilirler.

## Güvenlik ve En İyi Uygulamalar

1. FCM apiKey gibi hassas bilgileri codesbase'e dahil etmeyin
2. Google-services.json ve GoogleService-Info.plist dosyalarını git ağacına eklemeyin (gitignore kullanın)
3. Bildirim içeriklerinde hassas kullanıcı verilerini göndermeyin
4. Bildirimlerde doğrulama mekanizması kullanın (örn. kullanıcı kimliği)

## Sorun Giderme

1. **Bildirimler gelmiyor**: FCM token'ın güncel olduğundan ve doğru şekilde kayıtlı olduğundan emin olun
2. **Android bildirimleri**: Manifest'te doğru izinlerin olduğunu kontrol edin
3. **iOS bildirimleri**: Bildirim izinlerinin ve APN sertifikasının doğru yapılandırıldığından emin olun

## Gelecek Geliştirmeler

1. **Topic Abonelikleri**: Kullanıcıların belirli bildirim konularına abone olması
2. **Bildirim Yönlendirme**: Bildirime tıklandığında ilgili ekrana derin bağlantı
3. **Bildirim Analitiği**: Bildirim etkileşimi ve dönüşüm oranı takibi 