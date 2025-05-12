const { Payment } = require('../models');
const { Op } = require('sequelize');

// @desc    Yeni ödeme oluşturma
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res) => {
  try {
    console.log('Received payment data:', req.body);

    const {
      // Frontend'den gelen alanlar
      cardName,
      amount,
      currency,
      date,
      note,
      ownerName,
      isRecurring,
      recurringType: frontendRecurringType,
      isAutoPayment,
      completed,
      enableNotification,
      dayBeforeReminder,
      // Backend'de beklenen alanlar
      title,
      description,
      paymentDate,
      paymentType,
      status,
      category,
      notificationEnabled,
      notificationDate
    } = req.body;

    // Veri dönüşümü - frontend'den gelen verileri backend modeline uyarla
    const paymentData = {
      // İsim eşleştirmeleri
      title: title || cardName, // cardName kullan eğer title yoksa
      description: description || note, // note kullan eğer description yoksa
      amount: amount,
      currency: currency || 'TRY',
      paymentDate: paymentDate || date, // date kullan eğer paymentDate yoksa
      // Defaultlar tanımla
      paymentType: paymentType || 'CREDIT_CARD', // Default değer
      status: status || (completed ? 'PAID' : 'PENDING'), // completed'a göre belirle
      recurringType: frontendRecurringType && isRecurring 
        ? frontendRecurringType.toUpperCase() // Büyük harfe çevir (weekly->WEEKLY)
        : 'ONCE', // Default ONCE
      category: category || 'GENERAL',
      // Bildirim ayarlarını ekle
      notificationEnabled: enableNotification !== undefined ? enableNotification : notificationEnabled !== undefined ? notificationEnabled : true,
      dayBeforeReminder: dayBeforeReminder !== undefined ? dayBeforeReminder : true,
      notificationDate: notificationDate || null,
      userId: req.user.id
    };

    console.log('Transformed payment data:', paymentData);

    const payment = await Payment.create(paymentData);

    res.status(201).json(payment);
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Kullanıcı ödemelerini getirme
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { userId: req.user.id },
      order: [['paymentDate', 'ASC']]
    });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Ödeme detaylarını getirme
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (payment) {
      res.json(payment);
    } else {
      res.status(404).json({ message: 'Ödeme bulunamadı' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Ödeme güncelleme
// @route   PUT /api/payments/:id
// @access  Private
const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (payment) {
      const {
        title,
        description,
        amount,
        currency,
        paymentDate,
        paymentType,
        status,
        recurringType,
        category,
        notificationEnabled,
        dayBeforeReminder,
        notificationDate,
        updateNotification,
      } = req.body;

      payment.title = title || payment.title;
      payment.description = description !== undefined ? description : payment.description;
      payment.amount = amount || payment.amount;
      payment.currency = currency || payment.currency;
      payment.paymentDate = paymentDate || payment.paymentDate;
      payment.paymentType = paymentType || payment.paymentType;
      payment.status = status || payment.status;
      payment.recurringType = recurringType || payment.recurringType;
      payment.category = category || payment.category;
      
      // Bildirim ayarları güncellemeleri
      payment.notificationEnabled = notificationEnabled !== undefined ? notificationEnabled : payment.notificationEnabled;
      payment.dayBeforeReminder = dayBeforeReminder !== undefined ? dayBeforeReminder : payment.dayBeforeReminder;
      payment.notificationDate = notificationDate !== undefined ? notificationDate : payment.notificationDate;

      const updatedPayment = await payment.save();
      
      // Frontend'e bildirim güncelleme durumunu da döndür
      res.json({
        ...updatedPayment.toJSON(),
        updateNotification: updateNotification || false
      });
    } else {
      res.status(404).json({ message: 'Ödeme bulunamadı' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Ödeme silme
// @route   DELETE /api/payments/:id
// @access  Private
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (payment) {
      await payment.destroy();
      res.json({ message: 'Ödeme silindi' });
    } else {
      res.status(404).json({ message: 'Ödeme bulunamadı' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Yaklaşan ödemeleri getirme
// @route   GET /api/payments/upcoming
// @access  Private
const getUpcomingPayments = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);

    const payments = await Payment.findAll({
      where: { 
        userId: req.user.id,
        paymentDate: {
          [Op.between]: [today, thirtyDaysLater]
        },
        status: 'PENDING'
      },
      order: [['paymentDate', 'ASC']]
    });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Ödeme durum güncelleme
// @route   PUT /api/payments/:id/status
// @access  Private
const updatePaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Ödeme bulunamadı' });
    }

    const { status } = req.body;
    
    // Status değeri geçerli mi kontrol et
    if (!['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ message: 'Geçersiz durum değeri' });
    }
    
    payment.status = status;
    await payment.save();
    
    res.json({ message: 'Ödeme durumu güncellendi', payment });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Yaklaşan bildirimleri getirme (bugünden itibaren)
// @route   GET /api/payments/notifications
// @access  Private
const getPaymentNotifications = async (req, res) => {
  try {
    const today = new Date();
    
    // Bildirim aktif olan yaklaşan ödemeleri bul
    const payments = await Payment.findAll({
      where: { 
        userId: req.user.id,
        paymentDate: {
          [Op.gte]: today  // Bugün ve sonrası
        },
        status: 'PENDING',
        notificationEnabled: true
      },
      order: [['paymentDate', 'ASC']]
    });

    // Bildirim verilerini hazırla
    const notifications = payments.map(payment => ({
      id: payment.id,
      title: payment.title,
      amount: payment.amount,
      currency: payment.currency,
      paymentDate: payment.paymentDate,
      dayBeforeReminder: payment.dayBeforeReminder
    }));

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    FCM bildirimini Manuel olarak gönderme
// @route   POST /api/payments/:id/send-notification
// @access  Private
const sendPaymentNotification = async (req, res) => {
  try {
    const { User } = require('../models');
    const { sendPaymentNotification } = require('../utils/firebaseAdmin');
    
    // Ödemeyi bul
    const payment = await Payment.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Ödeme bulunamadı' });
    }

    // Kullanıcıyı bul
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Bildirim ayarlarını kontrol et
    if (!user.enableFirebaseNotifications || !user.fcmToken) {
      return res.status(400).json({ 
        message: 'FCM bildirimleri etkin değil veya FCM token bulunamadı',
        enableFirebaseNotifications: user.enableFirebaseNotifications,
        hasFCMToken: !!user.fcmToken
      });
    }
    
    // Bildirimi gönder
    const notificationResult = await sendPaymentNotification(user, payment);
    
    if (notificationResult && notificationResult.success) {
      res.json({ 
        message: 'Ödeme bildirimi başarıyla gönderildi',
        messageId: notificationResult.messageId
      });
    } else {
      res.status(500).json({ 
        message: 'Bildirim gönderilirken bir hata oluştu',
        error: notificationResult.error || 'Bilinmeyen hata'
      });
    }
  } catch (error) {
    console.error('Send payment notification error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getUpcomingPayments,
  updatePaymentStatus,
  getPaymentNotifications,
  sendPaymentNotification,
}; 