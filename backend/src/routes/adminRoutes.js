const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');

// Tüm admin rotaları için auth ve admin middleware'lerini kullan
router.use(authMiddleware, adminMiddleware);

// Firebase Access Token endpoint'i
router.get('/token', adminController.getAccessToken);

// Diğer admin bildirim endpointleri
router.post('/notifications/broadcast', adminController.sendNotificationToAllUsers);
router.post('/notifications/user', adminController.sendNotificationToUser);
router.post('/notifications/upcoming-payments', adminController.sendReminderForUpcomingPayments);

// Test endpoint - Zamanlı bildirimleri test etmek için
router.post('/test/payment-notifications', adminController.testPaymentNotifications);

module.exports = router; 