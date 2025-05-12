# Bildirim Sistemi Entegrasyonu - Cebimde Uygulaması

Bu dokümantasyon, Cebimde uygulamasına eklenen bildirim sistemi için yapılan geliştirmelerin özeti ve kullanım kılavuzudur.

## Eklenen Özellikler

1. **Yerel Bildirim Sistemi**: Ödeme günlerinde ve/veya bir gün öncesinde yerel bildirimler
2. **Bildirim Tercihleri**: Kullanıcılar için bildirim ayarları ekranı
3. **Ödeme Ayarlarına Entegrasyon**: Ödeme eklerken veya düzenlerken bildirim seçenekleri

## Teknolojik Altyapı

- **@notifee/react-native**: Yerel bildirimler için kullanıldı
- **AsyncStorage**: Bildirim tercihlerini yerel olarak saklamak için
- **Backend Entegrasyonu**: Bildirim tercihlerini sunucuda saklamak için API servisleri

## Kullanım ve Kurulum

### 1. Gerekli Paketler

Proje zaten bu paketleri içermektedir. Yeni bir kurulum için gerekli komutlar:

```bash
npm install @notifee/react-native
```

### 2. Bildirim İzinleri

Uygulama ilk açıldığında bildirim izinleri otomatik olarak istenir. App.tsx dosyasında bu işlem gerçekleştirilir:

```typescript
useEffect(() => {
  const setupNotifications = async () => {
    // Android için bildirim kanalı oluştur
    await createNotificationChannel();
    
    // İzinleri kontrol et
    await notifee.requestPermission();
  };
  
  setupNotifications();
}, []);
```

### 3. Bildirimlerin Planlanması

Ödeme eklendiğinde veya güncellendiğinde, bildirimler otomatik olarak planlanır:

```typescript
// Kullanıcı bildirim istiyorsa yerel bildirim oluştur
if (enableNotification && response.data && response.data.id) {
  const paymentId = response.data.id;
  const title = `${cardName} Ödeme Hatırlatıcısı`;
  const body = `${amount} ${currency} tutarında ödemeniz bugün`;
  
  await schedulePaymentNotification(
    paymentId, 
    title, 
    body, 
    paymentDate,
    dayBeforeReminder
  );
}
```

## Kullanıcı Arayüzü

### Ödeme Eklerken/Düzenlerken Bildirim Seçenekleri

Kullanıcılar her ödeme için ayrı bildirim tercihleri belirleyebilirler:

- **Bildirim Alma**: Ödeme günü bildirim alıp almama
- **Bir Gün Önce Hatırlatma**: Ödeme gününden bir gün önce hatırlatma bildirimi alma seçeneği

### Bildirim Ayarları Ekranı

Kullanıcılar genel bildirim tercihlerini ayarlayabilirler:

- **Tüm Bildirimleri Açma/Kapatma**: Uygulamanın bildirim göndermesini tamamen kontrol etme
- **Bildirim Saati**: Bildirimlerin hangi saatte gönderileceğini ayarlama
- **Tüm Bildirimleri Temizleme**: Mevcut tüm bildirim planlamalarını iptal etme

## Backend Entegrasyonu

Backend, kullanıcı bildirim tercihlerini saklamak ve yönetmek için API'ler sağlar:

- `GET /users/notification-preferences`: Kullanıcının bildirim tercihlerini alma
- `POST /users/notification-preferences`: Kullanıcının bildirim tercihlerini güncelleme
- `GET /payments/notifications`: Bildirim ayarları etkinleştirilmiş ödemeleri listeleme

## Model Yapısı

### User Model

```javascript
{
  enableNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  dayBeforeReminder: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notificationTime: {
    type: DataTypes.STRING, // "HH:MM" formatında saat
    defaultValue: '09:00'
  },
  fcmToken: {
    type: DataTypes.STRING,
    allowNull: true
  }
}
```

### Payment Model

```javascript
{
  notificationEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  dayBeforeReminder: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notificationSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}
```

## Bildirim Yönetimi Kütüphanesi (utils/notifications.ts)

Bildirim işlemlerini yönetmek için bir dizi yardımcı fonksiyon geliştirildi:

- `createNotificationChannel`: Android için bildirim kanalı oluşturma
- `schedulePaymentNotification`: Ödeme bildirimlerini zamanlama
- `cancelPaymentNotification`: Belirli bir ödemenin bildirimlerini iptal etme
- `useNotificationListener`: Bildirim dinleyicisi hook'u
- `clearAllNotifications`: Tüm bildirimleri temizleme

## Güvenlik ve Performans

- Bildirimler yerel cihazda zamanlanır, bu nedenle ağ kesintisinden etkilenmez
- Hassas bilgiler (ödeme miktarı vb.) bildirimlerde güvenli bir şekilde işlenir
- Bildirim zamanlaması uygulama kapalı olsa bile çalışır

## Gelecek Geliştirmeler

1. **Firebase Cloud Messaging (FCM)** entegrasyonu ile uzaktan bildirim gönderme
2. **Bildirim Gruplaması**: Çok sayıda bildirimi kategorilere ayırma
3. **Özelleştirilebilir Bildirim Sesleri**: Farklı ödeme tipleri için farklı sesler

---

Bu bildirim sistemi Cebimde uygulamasının kullanıcı deneyimini geliştirmek ve ödemelerin zamanında yapılmasını hatırlatmak amacıyla tasarlanmıştır. 