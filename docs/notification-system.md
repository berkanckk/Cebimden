# Firebase Bildirim Sistemi Dokümantasyonu

## Genel Bakış

Cebimde uygulaması için Firebase Cloud Messaging (FCM) entegrasyonu yapılmıştır. Sistem iki farklı token türü ile çalışır:

1. **FCM Device Token**: Kullanıcıların mobil cihazlarına bildirim göndermek için kullanılır
2. **Firebase Auth Token**: Google Cloud ile iletişim kurmak için kullanılan JWT token

## Token Yönetimi

### FCM Device Token

- Mobil cihazlarda `LoginScreen.tsx` FCM tokenını AsyncStorage'dan alır
- Bu token, kullanıcı giriş veya kayıt olduğunda backende iletilir
- Backendde `userController.js` FCM tokenını veritabanına kaydeder

### Firebase Auth Token

Firebase ile iletişim için gereken Auth Token'ı artık otomatik olarak:

1. Backendde `tokenStore.js` tarafından hafızada saklanır
2. Her 50 dakikada bir otomatik olarak yenilenir (tokenlar 1 saat geçerlidir)
3. Başlangıçta otomatik olarak alınır
4. 401 hata durumunda otomatik olarak yenilenir

### Kullanıcı Access Token İşlemleri

Uygulama artık kullanıcı giriş ve kayıt işlemleri sırasında hem FCM token hem de Firebase Access Token bilgilerini yönetir:

1. Frontend'de `firebaseHelper.js` modülü ile tokenlar alınır
2. `LoginScreen.tsx` ve `SignupScreen.tsx` içinde tokenlar backend'e gönderilir
3. Backend'de `authController.js` gelen token bilgilerini User tablosuna kaydeder
4. User modeli hem FCM token hem Firebase access token saklar
5. İstenildiğinde admin panel üzerinden token bilgileri görüntülenebilir

```javascript
// Örnek login isteği
{
  "email": "user@example.com",
  "password": "password123",
  "fcmToken": "d0d09NnJ84zXyD7AahRiB.APA91bFhKd35GAI0DUZGzo-zwCOpOnHYVD9tz3e4DSBj24I5gUIZhIrL60KOBKCTp0OeWiLzJHQJ0atyqNHoj2IdP-Y3D98uaa9BoG_Z8RZV5rIErIdAC8",
  "firebaseAccessToken": "eyJhbGciOiJSUzI1NiIsI..."
}
```

### Access Token Erişimi (Sadece Admin)

Admin kullanıcılar için Firebase Access Token'ına erişim:

```javascript
// Admin API üzerinden token alma
GET /api/admin/token

// Başarılı yanıt
{
  "success": true,
  "accessToken": "ya29.a0AfH6SMBmU...", // Firebase Access Token
  "expiresIn": 3300,                     // Saniye cinsinden geçerlilik süresi
  "expiresInMinutes": 55                 // Dakika cinsinden geçerlilik süresi
}
```

⚠️ **Güvenlik Uyarısı**: Access token sadece admin kullanıcılar tarafından erişilebilir ve hassas bir bilgidir. Son kullanıcılara iletilmemelidir!

## Bildirim Gönderme

Bildirimler üç şekilde gönderilebilir:

1. **Planlı Bildirimler**: `notificationScheduler.js` ile her gün 9:00'da ve vadesi yaklaşan ödemeler için
2. **Manuel Bildirimler**: Admin kullanıcılar tarafından admin paneli üzerinden
3. **Direkt API**: Admin kullanıcılar için özel API endpointleri ile

## Güvenlik

- Token yönetimi tamamen backend tarafında yapılmaktadır
- Sadece admin kullanıcılar bildirim gönderebilir
- Admin kontrolü için özel middleware uygulanmıştır

## Kod Yapısı

### Backend

- `tokenStore.js`: Token saklama ve yönetim mekanizması
- `firebaseAdmin.js`: Firebase ile iletişim için yardımcı fonksiyonlar
- `notificationScheduler.js`: Otomatik bildirim planlaması
- `adminController.js`: Admin kullanıcılar için bildirim endpointleri

### Frontend

- `LoginScreen.tsx`: FCM device token alımı ve login sırasında backende iletimi
- `useAuth.tsx`: Yetkilendirme hook'u
- `api.ts`: Backend ile iletişim için API servisleri

## Token Yenileme Akışı

1. Server başlatıldığında ilk token alınır
2. Her 50 dakikada bir token geçerliliği kontrol edilir
3. Geçerlilik süresi 10 dakikadan az kaldıysa yenilenir
4. API çağrılarında 401 hatası alınırsa token otomatik yenilenir

## Kullanım Örnekleri

### Bildirim Gönderme (Admin)

```javascript
// Admin controller üzerinden
POST /api/admin/notifications/broadcast
{
  "title": "Ödeme Hatırlatıcısı",
  "body": "Yaklaşan ödemeleriniz var"
}
```

### Otomatik Bildirimler

Server başladığında `notificationScheduler.js` ile otomatik olarak planlanır ve çalışır. Kullanıcılar bildirim ayarlarını uygulamadan yönetebilirler. 