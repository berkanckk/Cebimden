const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Access Token ve token ile bildirim gönderme endpointleri
router.get('/access-token', protect, notificationController.getAccessToken);
router.post('/send-with-token', protect, notificationController.sendNotification);

// Diğer bildirim routeları
// router.get('/', protect, notificationController.getNotifications);
// router.post('/mark-as-read/:id', protect, notificationController.markAsRead);
// router.delete('/:id', protect, notificationController.deleteNotification);

// Firebase bildirim gönderme
router.post('/send', protect, notificationController.sendFirebaseNotification);

module.exports = router; 