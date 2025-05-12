const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('./config/db');

// Routes
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

// .env dosyasını yükle
dotenv.config();
console.log('Loading environment variables...');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('Environment variables:', {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT
});

// Veritabanı bağlantısı
connectDB();

// Express app oluştur
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Varsayılan route
app.get('/', (req, res) => {
  res.send('Cebimde API çalışıyor!');
});

// Firebase admin başlatma durumunu kontrol et
try {
  const firebaseAdmin = require('./utils/firebaseAdmin');
  console.log('Firebase Admin modülü yüklendi, başlatılıyor...');
  const initialized = firebaseAdmin.initializeFirebaseAdmin();
  console.log('Firebase Admin başlatma sonucu:', initialized ? 'Başarılı' : 'Başarısız');
  
  // Test amaçlı token almayı dene
  if (initialized) {
    console.log('Firebase Access Token test ediliyor...');
    firebaseAdmin.getGoogleAccessToken()
      .then(token => {
        console.log('Test token alındı:', token ? 'Başarılı' : 'Başarısız');
        if (token) {
          console.log('Token başlangıcı:', token.substring(0, 10) + '...');
        }
      })
      .catch(err => {
        console.error('Test token alma hatası:', err);
      });
  }
} catch (error) {
  console.error('Firebase Admin yükleme hatası:', error);
}

// Bildirim planlaması
try {
  const { schedulePaymentReminders, scheduleTokenRefresh } = require('./scheduler/notificationScheduler');
  
  // Otomatik bildirim planlamasını başlat (her sabah 9'da)
  schedulePaymentReminders();
  
  // Firebase token'ı yenileme planlamasını başlat (her 50 dakikada bir)
  scheduleTokenRefresh();
  
  console.log('Bildirim planlaması başlatıldı');
} catch (error) {
  console.error('Bildirim planlaması başlatılırken hata:', error);
}

// Server
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor.`);
});

module.exports = app; 