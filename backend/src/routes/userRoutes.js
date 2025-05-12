const express = require('express');
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  changePassword,
  setNotificationPreferences,
  getNotificationPreferences,
  updateFCMToken
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Açık rotalar
router.post('/register', registerUser);
router.post('/login', loginUser);

// Korumalı rotalar
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Şifre değiştirme
router.post('/change-password', protect, changePassword);

// Bildirim tercihleri rotaları
router.route('/notification-preferences')
  .get(protect, getNotificationPreferences)
  .post(protect, setNotificationPreferences);

// FCM token güncelleme
router.post('/fcm-token', protect, updateFCMToken);

module.exports = router; 