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