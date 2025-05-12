İş Gereksinimleri Dokümanı (BRD)
Proje Adı:
Mobil Ödeme Takip Sistemi (Cebimde)

Proje Amacı:
Kullanıcıların banka/kredi kartı üzerinden gerçekleştirecekleri ödemeleri takip edebilecekleri, geçmiş ve gelecek ödemelerini görebilecekleri, ödeme günlerinde bildirim alabilecekleri bir mobil uygulama geliştirilmesi.

Hedef Kitle:
Bireysel kullanıcılar (banka/kredi kartı borçlarını takip etmek isteyenler)

Düzenli taksit ödemeleri olan kullanıcılar

Kendi finans planlamasını mobil cihaz üzerinden yapmak isteyen kullanıcılar

Platformlar:
Mobil Uygulama: React Native (iOS & Android)

Backend: Node.js + Express.js

Veritabanı: PostgreSQL

Ana Özellikler:
5.1. Kullanıcı Girişi ve Kayıt:
E-posta & şifre ile kullanıcı kaydı ve giriş yapma.

JWT ile kullanıcı kimlik doğrulama.

Şifre sıfırlama (isteğe bağlı).

Kullanıcı doğrulama e-posta onayı.

5.2. Ödeme Takip Paneli:
Kullanıcı giriş yaptıktan sonra geçmiş ve gelecekteki ödemeleri listeleyebilme.

Kart tipi (kredi/banka), tutar, ödeme tarihi bilgilerini gösterme.

Ödemeler tarih sırasına göre sıralanacak.

Ödemeler farklı kişi adına olabilir.

Tekrarlayan ödeme girişi.

Otomatik ödeme talimatları listelenmeli.

5.3. Ödeme Kayıt Sayfası:
Yeni ödeme ekleme:

Tarih

Kart/Banka adı (manuel giriş veya dropdown listesi)

Tutar (₺, $, € seçimi yapılabilir)

Not (isteğe bağlı açıklama)

Borç sahibi farklıysa, buna göre input alanı.

Gelecek tarihlere eklenen ödemeler için cihaz takvimine/uygulama içi bildirim sistemine entegre bildirim (firebase ile yapılabilir).

5.4. Bildirimler:
Ödeme günü geldiğinde kullanıcının cihazına push bildirim gönderimi.

Opsiyonel olarak: ödeme tarihinden 1 gün önce hatırlatma bildirimi.

6. Teknik Gereksinimler:
Frontend (React Native):
Navigation Sistemi: React Navigation

API Bağlantısı: Axios / Fetch

Local Storage: SecureStore / AsyncStorage

Bildirim Sistemi: Firebase Cloud Messaging + notifee (gerektiği takdirde)

Tasarım: Responsive tasarım, kullanıcı dostu UI/UX

Backend (Node.js + Express.js):
REST API örnek endpoint'leri:

POST /register

POST /login

GET /payments, POST /payments, DELETE /payments/:id

JWT ile authentication (JSON Web Token).

Kullanıcı ödeme bilgileri güvenli bir şekilde saklanmalı.

CORS ve güvenlik ayarları yapılmalı.

7. Gelecek Geliştirmeler (Opsiyonel):
Ödeme geçmişi görselleri ve grafikler.

PDF/CSV formatında dışa aktarım.

Çoklu cihaz senkronizasyonu.

Kategori bazlı filtreleme (kira, alışveriş vb.)

Kullanıcılar için finansal raporlar.

8. Başarı Kriterleri:
Kullanıcılar uygulamaya kolayca kayıt/giriş yapabilmeli.

En az %95 oranında doğru bildirim gönderimi sağlanmalı.

Kayıtlı ödemelerin listeleme ve ekleme işlemleri sorunsuz çalışmalı.

Uygulama performansı mobil cihazlarda akıcı olmalı.

Güvenlik önlemleri yüksek düzeyde olmalı (özellikle kullanıcı verileri).

Bildirimler düzgün çalışmalı.

9. Teknoloji ve Araçlar:
Frontend: React Native, React Navigation, Axios, Firebase

Backend: Node.js, Express.js, JWT, PostgreSQL

Bildirimler: Firebase Cloud Messaging, Notifee

Diğer: Git (Versiyon kontrolü için), GitHub (Kod depolama ve işbirliği)

Notlar ve Ekstra:
Bu dokümanda belirtilen özellikler ve gereksinimler, sistemin temel işlevselliğini tanımlar.

Kullanıcı deneyimi (UX/UI) tasarımı dikkatlice ele alınmalı.

Backend tarafındaki güvenlik önlemleri, özellikle ödeme bilgileri için şifreleme ve güvenli API bağlantıları önemlidir.

Projede kullanılan tüm kütüphaneler ve araçlar sürekli güncel tutulmalı.