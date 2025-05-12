const express = require('express');
const { 
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getUpcomingPayments,
  updatePaymentStatus,
  getPaymentNotifications,
  sendPaymentNotification
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Tüm rotalar korumalı
router.use(protect);

// Ana rotalar
router.route('/')
  .post(createPayment)
  .get(getPayments);

// Yaklaşan ödemeler
router.get('/upcoming', getUpcomingPayments);

// Bildirimler için ödemeleri getir
router.get('/notifications', getPaymentNotifications);

// Tekil ödeme işlemleri
router.route('/:id')
  .get(getPaymentById)
  .put(updatePayment)
  .delete(deletePayment);

// Ödeme durum güncelleme
router.put('/:id/status', updatePaymentStatus);

// Manuel FCM bildirim gönderme
router.post('/:id/send-notification', sendPaymentNotification);

module.exports = router; 