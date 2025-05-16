const { User, Payment } = require('../models');
const { sendNotificationToDevice, getGoogleAccessToken } = require('../utils/firebaseAdmin');
const { Op } = require('sequelize');
const tokenStore = require('../utils/tokenStore');
const { testPaymentReminders } = require('../scheduler/notificationScheduler');

// Firebase Access Token'ı alma - Sadece admin kullanıcılar için
const getAccessToken = async (req, res) => {
  try {
    // Admin yetkisi kontrolü
    if (!req.user.isAdmin) {
      console.log('Yetkisiz erişim denemesi:', req.user.id, req.user.email);
      return res.status(403).json({ 
        success: false, 
        message: 'Bu işlem için admin yetkisi gerekli' 
      });
    }
    
    // Önce token store'dan token'ı kontrol et
    let accessToken = tokenStore.getFirebaseAccessToken();
    
    // Eğer store'da token yoksa, yeni token al
    if (!accessToken) {
      accessToken = await getGoogleAccessToken();
    }
    
    if (!accessToken) {
      return res.status(500).json({ 
        success: false, 
        message: 'Access Token alınamadı' 
      });
    }
    
    // Kalan süre bilgisini hesapla
    const remainingTimeInMinutes = Math.round(tokenStore.getTokenRemainingTime() / 1000 / 60);
    
    // İşlemi logla
    console.log(`Admin ${req.user.id} (${req.user.email}) FCM Access Token aldı. Kalan süre: ${remainingTimeInMinutes} dakika`);
    
    // Başarılı yanıt
    res.status(200).json({
      success: true,
      accessToken,
      expiresIn: remainingTimeInMinutes * 60, // saniye cinsinden kalan süre
      expiresInMinutes: remainingTimeInMinutes
    });
  } catch (error) {
    console.error('Admin Access Token endpoint hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
};

// Tüm kullanıcılara bildirim gönderme
const sendNotificationToAllUsers = async (req, res) => {
  try {
    // Admin kontrolü
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Yetkisiz erişim' });
    }
    
    const { title, body, data } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ message: 'Başlık ve içerik gerekli' });
    }
    
    // FCM tokeni olan tüm aktif kullanıcıları bul
    const users = await User.findAll({
      where: {
        isActive: true,
        fcmToken: {
          [Op.ne]: null
        },
        enableFirebaseNotifications: true
      }
    });
    
    console.log(`${users.length} kullanıcıya bildirim gönderiliyor`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Her kullanıcıya bildirim gönder
    for (const user of users) {
      try {
        await sendNotificationToDevice(user.fcmToken, title, body, {
          type: 'admin_broadcast',
          senderId: req.user.id,
          ...(data || {})
        });
        successCount++;
      } catch (error) {
        console.error(`${user.id} kullanıcısına bildirim gönderilemedi:`, error);
        failureCount++;
      }
    }
    
    // İşlemi logla
    console.log(`Admin ${req.user.id} (${req.user.email}) ${users.length} kullanıcıya bildirim gönderdi. Başarılı: ${successCount}, Başarısız: ${failureCount}`);
    
    res.status(200).json({ 
      message: 'Bildirimler gönderildi', 
      stats: { 
        total: users.length, 
        success: successCount, 
        failure: failureCount 
      } 
    });
  } catch (error) {
    console.error('Toplu bildirim hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Özel bir kullanıcıya bildirim gönderme
const sendNotificationToUser = async (req, res) => {
  try {
    // Admin kontrolü
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Yetkisiz erişim' });
    }
    
    const { userId, title, body, data } = req.body;
    
    if (!userId || !title || !body) {
      return res.status(400).json({ message: 'Kullanıcı ID, başlık ve içerik gerekli' });
    }
    
    // Kullanıcıyı bul
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    if (!user.fcmToken) {
      return res.status(400).json({ message: 'Kullanıcının FCM tokeni yok' });
    }
    
    // Bildirim gönder
    const result = await sendNotificationToDevice(user.fcmToken, title, body, {
      type: 'admin_direct',
      senderId: req.user.id,
      ...(data || {})
    });
    
    // İşlemi logla
    console.log(`Admin ${req.user.id} (${req.user.email}) kullanıcı ${userId}'ye bildirim gönderdi`);
    
    res.status(200).json({ 
      message: 'Bildirim gönderildi', 
      result 
    });
  } catch (error) {
    console.error('Kullanıcıya bildirim gönderme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Ödenmeyen yaklaşan ödemelere bildirim gönderme (manuel tetikleme)
const sendReminderForUpcomingPayments = async (req, res) => {
  try {
    // Admin kontrolü
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Yetkisiz erişim' });
    }
    
    const { days = 7 } = req.body;
    
    // Belirtilen gün içinde vadesi gelecek ödemeleri bul
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    const upcomingPayments = await Payment.findAll({
      where: {
        paymentDate: {
          [Op.gte]: startDate,
          [Op.lt]: endDate
        },
        status: 'PENDING'
      },
      include: [{ model: User, as: 'user' }]
    });
    
    console.log(`${days} gün içerisinde vadesi gelecek ${upcomingPayments.length} ödeme bulundu`);
    
    let sentCount = 0;
    let failedCount = 0;
    
    for (const payment of upcomingPayments) {
      if (payment.user && payment.user.fcmToken) {
        const daysUntilPayment = Math.ceil((new Date(payment.paymentDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        const title = 'Yaklaşan Ödeme Hatırlatması';
        const body = `${payment.amount} ${payment.currency} tutarındaki ${payment.title} ödemeniz ${daysUntilPayment} gün içinde.`;
        
        try {
          await sendNotificationToDevice(payment.user.fcmToken, title, body, {
            paymentId: payment.id,
            type: 'upcoming_payment',
            daysRemaining: daysUntilPayment
          });
          
          sentCount++;
        } catch (error) {
          console.error(`Ödeme ${payment.id} için bildirim gönderilemedi:`, error);
          failedCount++;
        }
      }
    }
    
    // İşlemi logla
    console.log(`Admin ${req.user.id} (${req.user.email}) ${days} gün içindeki ödemeler için ${sentCount} bildirim gönderdi`);
    
    res.status(200).json({
      message: 'Yaklaşan ödeme bildirimleri gönderildi',
      stats: {
        totalPayments: upcomingPayments.length,
        sent: sentCount,
        failed: failedCount
      }
    });
  } catch (error) {
    console.error('Yaklaşan ödeme bildirimi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Zamanlanmış bildirimleri test etme - doğrudan scheduler'ı çağırır
const testPaymentNotifications = async (req, res) => {
  try {
    // Admin kontrolü
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Yetkisiz erişim' });
    }
    
    console.log(`Admin ${req.user.id} (${req.user.email}) zamanlanmış bildirim testini tetikledi`);
    
    // Scheduler'ın test fonksiyonunu çağır
    const result = await testPaymentReminders();
    
    res.status(200).json({
      message: 'Zamanlanmış bildirim testi çalıştırıldı',
      result
    });
  } catch (error) {
    console.error('Zamanlanmış bildirim testi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

module.exports = {
  getAccessToken,
  sendNotificationToAllUsers,
  sendNotificationToUser,
  sendReminderForUpcomingPayments,
  testPaymentNotifications
}; 