import axios from 'axios';
import { API_URL } from '../config';
import authService from './authService';

// Admin API için axios instance
const adminApi = axios.create({
  baseURL: `${API_URL}/api/admin`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// İstek interceptor - otomatik token ekleme
adminApi.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Admin servisleri
const adminService = {
  // Firebase Access Token alma
  getFirebaseAccessToken: async () => {
    try {
      const response = await adminApi.get('/token');
      return response.data;
    } catch (error) {
      console.error('Firebase token alma hatası:', error);
      throw error;
    }
  },
  
  // Tüm kullanıcılara bildirim gönderme
  sendBroadcastNotification: async (title, body, data = {}) => {
    try {
      const response = await adminApi.post('/notifications/broadcast', {
        title,
        body,
        data
      });
      return response.data;
    } catch (error) {
      console.error('Bildirim gönderme hatası:', error);
      throw error;
    }
  },
  
  // Belirli bir kullanıcıya bildirim gönderme
  sendNotificationToUser: async (userId, title, body, data = {}) => {
    try {
      const response = await adminApi.post('/notifications/user', {
        userId,
        title,
        body,
        data
      });
      return response.data;
    } catch (error) {
      console.error('Kullanıcıya bildirim gönderme hatası:', error);
      throw error;
    }
  },
  
  // Yaklaşan ödemeler için bildirim gönderme
  sendUpcomingPaymentReminders: async (days = 7) => {
    try {
      const response = await adminApi.post('/notifications/upcoming-payments', { days });
      return response.data;
    } catch (error) {
      console.error('Ödeme bildirimi hatası:', error);
      throw error;
    }
  }
};

export default adminService; 