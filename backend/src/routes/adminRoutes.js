const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Admin yetkisi kontrolü middleware'i
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Admin yetkisi gerekli' });
  }
};

// Notifikasyon endpointleri - Korumalı ve admin gerektirir
router.get('/notifications/access-token', protect, isAdmin, adminController.getAccessToken);
router.post('/notifications/broadcast', protect, isAdmin, adminController.sendNotificationToAllUsers);
router.post('/notifications/user', protect, isAdmin, adminController.sendNotificationToUser);
router.post('/notifications/upcoming-payments', protect, isAdmin, adminController.sendReminderForUpcomingPayments);

module.exports = router; 