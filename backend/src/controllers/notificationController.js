const { User } = require('../models');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { getGoogleAccessToken, sendNotificationToDevice, sendNotificationWithAccessToken } = require('../utils/firebaseAdmin');

// Debug için process.env değerlerini kontrol et
console.log('Environment variables:', {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT
});

// Firebase API ile bildirim gönderme
const sendFirebaseNotification = async (req, res) => {
  try {
    const { token, title, body, data } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'FCM token gerekli' });
    }
    
    if (!title || !body) {
      return res.status(400).json({ message: 'Bildirim başlığı ve içeriği gerekli' });
    }

    // FCM API ile bildirim gönder
    const accessToken = await getFirebaseAccessToken();
    
    if (!accessToken) {
      return res.status(500).json({ message: 'Firebase erişim jetonu alınamadı' });
    }
    
    const response = await sendToFCM(accessToken, token, title, body, data || {});
    
    res.status(200).json({
      message: 'Bildirim başarıyla gönderildi',
      result: response
    });
    
  } catch (error) {
    console.error('Firebase bildirim gönderme hatası:', error);
    res.status(500).json({ message: 'Bildirim gönderilirken hata oluştu', error: error.message });
  }
};

// Firebase erişim jetonu al
const getFirebaseAccessToken = async () => {
  try {
    // Servis hesabı dosyasının yolu
    const serviceAccountPath = path.join(__dirname, '../config/cebimde-ra.json');
    
    // Servis hesabı dosyası var mı kontrol et
    if (!fs.existsSync(serviceAccountPath)) {
      console.error('Servis hesabı dosyası bulunamadı:', serviceAccountPath);
      return null;
    }
    
    // GoogleAuth ile kimlik doğrulama
    const auth = new GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"]
    });
    
    // Client oluştur ve erişim jetonunu al
    const client = await auth.getClient();
    const tokenData = await client.getAccessToken();
    
    return tokenData.token;
  } catch (error) {
    console.error('Firebase erişim jetonu alma hatası:', error);
    return null;
  }
};

// FCM API'ye doğrudan istek gönderme
const sendToFCM = async (accessToken, deviceToken, title, body, data = {}) => {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    
    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID ortam değişkeni bulunamadı');
    }
    
    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    
    const payload = {
      message: {
        token: deviceToken,
        notification: {
          title,
          body
        },
        data
      }
    };
    
    const response = await axios.post(fcmEndpoint, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('FCM API çağrı hatası:', error);
    throw error;
  }
};

// @desc    FCM Access Token'ı al
// @route   GET /api/notifications/access-token
// @access  Private (Admin)
const getAccessToken = async (req, res) => {
  try {
    // DEPRECATED: Bu endpoint artık kullanımdan kaldırılıyor, admin/notifications/access-token kullanın
    console.warn('DEPRECATED: /api/notifications/access-token kullanımı tespit edildi. Lütfen /api/admin/notifications/access-token kullanın!');
    
    // Admin yetkisi kontrolü
    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu işlem için admin yetkisi gerekli',
        note: 'Bu endpoint kullanımdan kaldırılıyor, lütfen /api/admin/notifications/access-token kullanın' 
      });
    }
    
    const accessToken = await getGoogleAccessToken();
    
    if (!accessToken) {
      return res.status(500).json({ 
        success: false, 
        message: 'Access Token alınamadı',
        note: 'Bu endpoint kullanımdan kaldırılıyor, lütfen /api/admin/notifications/access-token kullanın'
      });
    }
    
    // Başarılı yanıt
    res.status(200).json({
      success: true,
      accessToken,
      note: 'Bu endpoint kullanımdan kaldırılıyor, lütfen /api/admin/notifications/access-token kullanın'
    });
  } catch (error) {
    console.error('Access Token endpoint hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası', 
      error: error.message,
      note: 'Bu endpoint kullanımdan kaldırılıyor, lütfen /api/admin/notifications/access-token kullanın'
    });
  }
};

// @desc    FCM bildirimi gönder (Access Token ile)
// @route   POST /api/notifications/send-with-token
// @access  Private (Admin)
const sendNotification = async (req, res) => {
  try {
    const { fcmToken, title, body, data } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'FCM Token gerekli' 
      });
    }
    
    if (!title || !body) {
      return res.status(400).json({ 
        success: false, 
        message: 'Başlık ve içerik gerekli' 
      });
    }
    
    // Access Token ile bildirim gönder
    const result = await sendNotificationWithAccessToken(fcmToken, title, body, data || {});
    
    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Bildirim gönderilemedi', 
        error: result.error 
      });
    }
    
    // Başarılı yanıt
    res.status(200).json({
      success: true,
      message: 'Bildirim başarıyla gönderildi',
      result: result.data
    });
  } catch (error) {
    console.error('Bildirim gönderme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
};

module.exports = {
  sendFirebaseNotification,
  getAccessToken,
  sendNotification
}; 