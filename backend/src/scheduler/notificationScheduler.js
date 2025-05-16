const cron = require('node-cron');
const { Payment, User } = require('../models');
const { sendNotificationToDevice, getGoogleAccessToken } = require('../utils/firebaseAdmin');
const { Op } = require('sequelize');
const moment = require('moment');
const tokenStore = require('../utils/tokenStore');

// Ödeme bildirimleri için işlemi gerçekleştiren ana fonksiyon
const processPaymentReminders = async () => {
  console.log('Ödeme hatırlatma bildirimleri kontrol ediliyor...');
  
  try {
    // Bugün ve yarın vadesi gelecek ödemeleri bul
    const today = moment().startOf('day').toDate();
    const tomorrow = moment().add(1, 'days').startOf('day').toDate();
    
    // Bugün vadesi gelen ödemeler
    const todaysPayments = await Payment.findAll({
      where: {
        paymentDate: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        },
        status: 'PENDING',
        notificationSent: false,
        notificationEnabled: true
      },
      include: [{ model: User, as: 'user' }]
    });
    
    // Yarın vadesi gelecek ödemeler
    const tomorrowsPayments = await Payment.findAll({
      where: {
        paymentDate: {
          [Op.gte]: tomorrow,
          [Op.lt]: moment().add(2, 'days').startOf('day').toDate()
        },
        status: 'PENDING',
        reminderSent: false,
        dayBeforeReminder: true
      },
      include: [{ model: User, as: 'user' }]
    });
    
    console.log(`Bugün için ${todaysPayments.length} bildirim, yarın için ${tomorrowsPayments.length} bildirim bulundu`);
    
    // Bugünkü bildirimleri gönder
    for (const payment of todaysPayments) {
      if (payment.user && payment.user.fcmToken && payment.user.enableFirebaseNotifications) {
        const title = 'Ödeme Hatırlatıcısı';
        const body = `${payment.amount} ${payment.currency} tutarındaki ${payment.title} ödemeniz bugün.`;
        
        try {
          await sendNotificationToDevice(payment.user.fcmToken, title, body, {
            paymentId: payment.id,
            type: 'payment_today'
          });
          
          // Bildirimi gönderildi olarak işaretle
          payment.notificationSent = true;
          await payment.save();
          
          console.log(`Bildirim gönderildi: ${payment.id} - ${payment.title}`);
        } catch (notificationError) {
          console.error(`Bildirim gönderme hatası (${payment.id}):`, notificationError);
        }
      }
    }
    
    // Yarın için hatırlatmaları gönder
    for (const payment of tomorrowsPayments) {
      if (payment.user && payment.user.fcmToken && payment.user.enableFirebaseNotifications) {
        const title = 'Ödeme Ön Hatırlatma';
        const body = `${payment.amount} ${payment.currency} tutarındaki ${payment.title} ödemeniz yarın.`;
        
        try {
          await sendNotificationToDevice(payment.user.fcmToken, title, body, {
            paymentId: payment.id,
            type: 'payment_tomorrow'
          });
          
          // Hatırlatma gönderildi olarak işaretle
          payment.reminderSent = true;
          await payment.save();
          
          console.log(`Ön hatırlatma gönderildi: ${payment.id} - ${payment.title}`);
        } catch (notificationError) {
          console.error(`Ön hatırlatma gönderme hatası (${payment.id}):`, notificationError);
        }
      }
    }
    
    console.log('Ödeme bildirimleri tamamlandı.');
    
    return {
      todayCount: todaysPayments.length,
      tomorrowCount: tomorrowsPayments.length,
      success: true
    };
  } catch (error) {
    console.error('Bildirim işlemi hatası:', error);
    return { success: false, error: error.message };
  }
};

// Her gün sabah 9:00'da çalışacak
const schedulePaymentReminders = () => {
  console.log('Ödeme hatırlatma planlayıcı başlatılıyor...');
  
  // cron.schedule('0 9 * * *', async () => {
  cron.schedule('30 13 * * *', async () => {  // Test için 13:30'a değiştirildi
    await processPaymentReminders();
  });
  
  console.log('Ödeme hatırlatma planlayıcı başlatıldı');
};

// Manuel test için fonksiyon - her zaman çağrılabilir
const testPaymentReminders = async () => {
  console.log('TEST: Ödeme hatırlatma bildirimleri test ediliyor...');
  return await processPaymentReminders();
};

// Token yenileme işlemi - Her saatte bir yeni token alıp Firebase ile iletişim için kullanılacak
const scheduleTokenRefresh = () => {
  const { getGoogleAccessToken } = require('../utils/firebaseAdmin');
  
  console.log('Firebase token yenileme planlayıcı başlatılıyor...');
  
  // İlk token'ı hemen al
  getGoogleAccessToken()
    .then(token => {
      if (token) {
        console.log('İlk token başarıyla alındı ve token store\'a kaydedildi.');
      } else {
        console.error('İlk token alınamadı!');
      }
    })
    .catch(err => {
      console.error('İlk token alma hatası:', err);
    });
  
  // Her 50 dakikada bir token'ı yenile (token 1 saat geçerli, güvenli tarafta kalmak için 50 dk)
  cron.schedule('*/50 * * * *', async () => {
    console.log('Firebase token yenileniyor...');
    
    try {
      // Token geçerli mi kontrol et
      if (tokenStore.isTokenValid()) {
        console.log('Mevcut token hala geçerli, kalan süre:', 
          Math.round(tokenStore.getTokenRemainingTime() / 1000 / 60), 'dakika');
          
        // Token süresinin 10 dakikadan az kaldığı durumda yenile
        if (tokenStore.getTokenRemainingTime() < 10 * 60 * 1000) {
          console.log('Token süresi 10 dakikadan az kalmış, yenileniyor...');
          const token = await getGoogleAccessToken();
          if (token) {
            console.log('Firebase token başarıyla yenilendi.');
          } else {
            console.error('Firebase token yenilenemedi!');
          }
        }
      } else {
        console.log('Token geçersiz veya süresi dolmuş, yeni token alınıyor...');
        const token = await getGoogleAccessToken();
        if (token) {
          console.log('Firebase token başarıyla yenilendi.');
        } else {
          console.error('Firebase token yenilenemedi!');
        }
      }
    } catch (error) {
      console.error('Token yenileme hatası:', error);
    }
  });
  
  console.log('Firebase token yenileme planlayıcı başlatıldı');
};

module.exports = { 
  schedulePaymentReminders,
  scheduleTokenRefresh,
  testPaymentReminders
}; 