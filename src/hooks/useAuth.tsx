import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import { UserType } from '../types';

interface AuthContextData {
  user: UserType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  register: (email: string, password: string, name: string, phone?: string, fcmToken?: string | null) => Promise<void>;
  login: (email: string, password: string, fcmToken?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (userData: { name?: string; email?: string; phone?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');

      if (storedUser && token) {
        const userData = JSON.parse(storedUser);
        console.log('Yüklenen kullanıcı verileri:', userData);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, phone?: string, fcmToken?: string | null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // FCM token kullanıcı tarafından sağlanmamışsa AsyncStorage'dan al
      let tokenToUse = fcmToken;
      if (!tokenToUse) {
        tokenToUse = await AsyncStorage.getItem('fcmToken');
      }
      
      const response = await authService.register(email, password, name, phone, tokenToUse);
      console.log('Register response:', response.data);
      
      // API yanıtı ile kullanıcı verilerini ayarla
      if (response.data) {
        setUser(response.data);
        console.log('Register sonrası user state:', response.data);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Kayıt sırasında bir hata oluştu');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, fcmToken?: string | null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // FCM token kullanıcı tarafından sağlanmamışsa AsyncStorage'dan al
      let tokenToUse = fcmToken;
      if (!tokenToUse) {
        tokenToUse = await AsyncStorage.getItem('fcmToken');
      }
      
      const response = await authService.login(email, password, tokenToUse);
      console.log('Login response:', response.data);
      
      // API yanıtı ile kullanıcı verilerini ayarla
      if (response.data) {
        setUser(response.data);
        console.log('Login sonrası user state:', response.data);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Giriş sırasında bir hata oluştu');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Logout başlatıldı');
      setIsLoading(true);
      
      // Önce api servisi ile logout işlemini yap (başarısız olsa bile devam et)
      try {
        await authService.logout();
        console.log('API logout başarılı');
      } catch (error) {
        console.error('API logout hatası:', error);
      }
      
      // AsyncStorage'dan kullanıcı bilgilerini temizle
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      console.log('AsyncStorage temizlendi');
      
      // State'i temizle
      setUser(null);
      console.log('Kullanıcı state temizlendi');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.resetPassword(email);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Şifre sıfırlama sırasında bir hata oluştu');
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (userData: { name?: string; email?: string; phone?: string; photoURL?: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Gerçek bir backend API'si olsaydı, şu şekilde kullanılabilirdi:
      // const response = await authService.updateProfile(userData);
      // setUser(response.data);
      
      // Şimdilik sadece yerel kullanıcı verisini güncelleyelim
      if (user) {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Profil güncellenirken bir hata oluştu');
      console.error('Update profile error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        register,
        login,
        logout,
        resetPassword,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 