import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Wi-Fi ağı içinde kullanım için (lokal geliştirme)
const API_URL = 'http://192.168.0.4:5000/api'; // Bilgisayarınızın gerçek IP adresi

// Geliştirme ortamı için alternatif URL'ler (ihtiyaca göre yorumdan çıkarın)
// const API_URL = 'http://10.0.2.2:5000/api'; // Android Emülatör için

// Axios instance oluşturma
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - her istekte token ekleme
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: async (email: string, password: string, name: string, phone?: string, fcmToken?: string | null) => {
    try {
      // FCM token verilmemişse yine de AsyncStorage'dan almaya çalış (geriye dönük uyumluluk için)
      let tokenToSend = fcmToken;
      if (!tokenToSend) {
        console.log('Register için FCM token alınıyor...');
        tokenToSend = await AsyncStorage.getItem('fcmToken');
        console.log('Register için FCM token:', tokenToSend);
      }
      
      const response = await axiosInstance.post('/users/register', {
        email,
        password,
        name,
        phone,
        fcmToken: tokenToSend // FCM token'ı direkt gönder
      });
      
      // Önemli: Backend'den dönen yanıt yapısını kontrol edelim
      console.log('Register API yanıtı:', response.data);
      
      // Token ve kullanıcı bilgilerini AsyncStorage'a kaydet
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        
        // Backend'den gelen kullanıcı yapısına göre düzenleme
        const userData = response.data.user || response.data;
        console.log('Kaydedilecek kullanıcı verileri:', userData);
        
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        // Token'ı da userData'ya ekleyip döndürelim
        return {
          ...response,
          data: {
            ...userData,
            token: response.data.token
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },
  
  login: async (email: string, password: string, fcmToken?: string | null) => {
    try {
      // FCM token verilmemişse yine de AsyncStorage'dan almaya çalış (geriye dönük uyumluluk için)
      let tokenToSend = fcmToken;
      if (!tokenToSend) {
        console.log('Login için FCM token alınıyor...');
        tokenToSend = await AsyncStorage.getItem('fcmToken');
        console.log('Login için FCM token:', tokenToSend);
      }
      
      const response = await axiosInstance.post('/users/login', {
        email,
        password,
        fcmToken: tokenToSend // FCM token'ı direkt gönder
      });
      
      // Önemli: Backend'den dönen yanıt yapısını kontrol edelim
      console.log('Login API yanıtı:', response.data);
      
      // Token ve kullanıcı bilgilerini AsyncStorage'a kaydet
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        
        // Backend'den gelen kullanıcı yapısına göre düzenleme
        const userData = response.data.user || response.data;
        console.log('Kaydedilecek kullanıcı verileri:', userData);
        
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        // Token'ı da userData'ya ekleyip döndürelim
        return {
          ...response,
          data: {
            ...userData,
            token: response.data.token
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  resetPassword: async (email: string) => {
    try {
      const response = await axiosInstance.post('/users/reset-password', { email });
      return response;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      // Token ve kullanıcı bilgilerini temizle
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      return { data: { success: true } };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        return { data: JSON.parse(userStr) };
      }
      return { data: null };
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const response = await axiosInstance.post('/users/change-password', {
        currentPassword,
        newPassword
      });
      return response;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },
  
  updateProfile: async (userData: { name?: string; email?: string; phone?: string; photoURL?: string }) => {
    try {
      // Backend API entegrasyonu olmadığı için mock veri döndürelim
      // Gerçek API entegrasyonu için aşağıdaki kodu kullanabilirsiniz:
      /*
      const response = await axiosInstance.put('/users/profile', userData);
      
      // Güncellenmiş kullanıcı bilgilerini AsyncStorage'a kaydet
      if (response.data) {
        const currentUser = await AsyncStorage.getItem('user');
        if (currentUser) {
          const updatedUser = { ...JSON.parse(currentUser), ...response.data };
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
      
      return response;
      */
      
      // Mock implementation - yerel simülasyon
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        throw new Error('Kullanıcı bulunamadı.');
      }
      
      const currentUser = JSON.parse(userStr);
      const updatedUser = { ...currentUser, ...userData };
      
      // Güncellenmiş kullanıcıyı kaydet
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Başarılı yanıt döndür
      return { 
        data: updatedUser
      };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
};

// Payment services
export const paymentService = {
  getPayments: async () => {
    try {
      const response = await axiosInstance.get('/payments');
      return response;
    } catch (error) {
      console.error('Get payments error:', error);
      throw error;
    }
  },
  
  addPayment: async (paymentData: any) => {
    try {
      const response = await axiosInstance.post('/payments', paymentData);
      return response;
    } catch (error) {
      console.error('Add payment error:', error);
      throw error;
    }
  },
  
  updatePayment: async (id: string, paymentData: any) => {
    try {
      const response = await axiosInstance.put(`/payments/${id}`, paymentData);
      return response;
    } catch (error) {
      console.error('Update payment error:', error);
      throw error;
    }
  },
  
  deletePayment: async (id: string) => {
    try {
      const response = await axiosInstance.delete(`/payments/${id}`);
      return response;
    } catch (error) {
      console.error('Delete payment error:', error);
      throw error;
    }
  },
  
  getPaymentById: async (id: string) => {
    try {
      const response = await axiosInstance.get(`/payments/${id}`);
      return response;
    } catch (error) {
      console.error('Get payment by id error:', error);
      throw error;
    }
  },

  getUpcomingPayments: async () => {
    try {
      const response = await axiosInstance.get('/payments/upcoming');
      return response;
    } catch (error) {
      console.error('Get upcoming payments error:', error);
      throw error;
    }
  },
  
  markAsCompleted: async (id: string) => {
    try {
      console.log(`Attempting to mark payment ${id} as completed`);
      
      // Backend'in gerçek endpoint'ini ve beklediği formatı kullan
      // Bu endpoint'in adı veya format farklı olabilir
      // Ya /payments/{id}/complete veya /payments/{id}/status olabilir
      
      // Birkaç olası format deneyelim, biri çalışacaktır:
      
      // 1. Deneme: /payments/{id}/status endpoint'i
      const response = await axiosInstance.put(`/payments/${id}/status`, { 
        status: 'PAID' 
      });
      
      // Eğer yukarıdaki çalışmazsa, bu kodu aktifleştirebilirsiniz:
      /*
      // 2. Deneme: /payments/{id}/complete endpoint'i
      const response = await axiosInstance.post(`/payments/${id}/complete`, { 
        status: 'PAID' 
      });
      
      // 3. Deneme: /payments/{id} üzerinden tam update
      const response = await axiosInstance.put(`/payments/${id}`, {
        status: 'PAID'
      });
      */
      
      console.log('Mark as completed response:', response.data);
      return response;
    } catch (error) {
      console.error('Mark payment as completed error:', error);
      throw error;
    }
  },

  // Bildirim tercihleri ile ilgili yeni metodlar
  setNotificationPreferences: async (preferences: {
    enableNotifications: boolean;
    dayBeforeReminder: boolean;
    notificationTime: string; // "09:00" formatında
  }) => {
    try {
      const response = await axiosInstance.post('/users/notification-preferences', preferences);
      return response;
    } catch (error) {
      console.error('Set notification preferences error:', error);
      throw error;
    }
  },
  
  getNotificationPreferences: async () => {
    try {
      const response = await axiosInstance.get('/users/notification-preferences');
      return response;
    } catch (error) {
      console.error('Get notification preferences error:', error);
      throw error;
    }
  },
  
  // Bildirim için ödeme işlevlerini genişletelim
  addPaymentWithNotification: async (paymentData: any, scheduleNotification: boolean = true) => {
    try {
      const response = await axiosInstance.post('/payments', {
        ...paymentData,
        scheduleNotification
      });
      return response;
    } catch (error) {
      console.error('Add payment with notification error:', error);
      throw error;
    }
  },
  
  updatePaymentWithNotification: async (id: string, paymentData: any, updateNotification: boolean = true) => {
    try {
      const response = await axiosInstance.put(`/payments/${id}`, {
        ...paymentData,
        updateNotification
      });
      return response;
    } catch (error) {
      console.error('Update payment with notification error:', error);
      throw error;
    }
  },
  
  // FCM token güncelleme - Artık login/register içinde gerçekleştirilecek
  updateFCMToken: async (token: string) => {
    try {
      const response = await axiosInstance.post('/users/fcm-token', { token });
      return response.data;
    } catch (error) {
      console.error('Update FCM token error:', error);
      throw error;
    }
  }
};

// Notification services
export const notificationService = {
  getNotifications: async () => {
    // Bildirim servisi henüz backend'de uygulanmadı
    // Geçici çözüm
    return { data: [] };
  },
  
  markAsRead: async (id: string) => {
    // Bildirim servisi henüz backend'de uygulanmadı
    return { data: { success: true } };
  },
  
  deleteNotification: async (id: string) => {
    // Bildirim servisi henüz backend'de uygulanmadı
    return { data: { success: true } };
  },
  
  // FCM API direkt çağrısı ile bildirim gönderme
  sendDirectNotification: async (token: string, title: string, body: string, data: any = {}) => {
    try {
      const response = await axiosInstance.post('/notifications/send', {
        token,
        title,
        body,
        data
      });
      return response.data;
    } catch (error) {
      console.error('Send direct notification error:', error);
      throw error;
    }
  }
};

export default {
  authService,
  paymentService,
  notificationService
}; 