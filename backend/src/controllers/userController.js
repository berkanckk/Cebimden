const jwt = require('jsonwebtoken');
const { User } = require('../models');
const firebaseTokenService = require('../services/firebaseTokenService');

// JWT token oluşturma
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'jwt_secret';
  console.log('JWT Secret used:', secret); // Debug için
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
};

// @desc    Kullanıcı kaydı
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, fcmToken } = req.body;
    
    console.log('Register request body:', { 
      name, 
      email, 
      phone, 
      fcmToken: fcmToken ? `FCM Token alındı: ${fcmToken}` : 'FCM Token alınamadı' 
    });

    // Email ve şifre zorunlu
    if (!email || !password) {
      return res.status(400).json({ message: 'Email ve şifre zorunlu' });
    }

    // Email kontrolü
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'Bu email adresi zaten kullanılıyor.' });
    }

    // Telefon kontrolü - eğer telefon alanı doldurulduysa ve format uygun değilse hata döndür
    if (phone && phone !== '' && !/^[0-9]{10}$/i.test(phone)) {
      return res.status(400).json({ message: 'Telefon numarası 10 haneli olmalıdır.' });
    }

    // Firebase Access Token'ı al
    let firebaseAccessToken = null;
    try {
      firebaseAccessToken = await firebaseTokenService.getFirebaseAccessToken();
      console.log('Yeni kullanıcı için Firebase Access Token alındı');
    } catch (tokenError) {
      console.error('Firebase token alınamadı:', tokenError);
    }

    // Kullanıcı oluşturma
    const userData = {
      name,
      email, 
      password,
      // telefon boş string ise null olarak gönder
      phone: phone === '' ? null : phone,
      // FCM token ekle (varsa)
      fcmToken: fcmToken || null,
      firebaseAccessToken,
      lastLogin: new Date(),
      isActive: true
    };

    console.log('Creating user with data:', { 
      ...userData, 
      password: '***',
      fcmToken: fcmToken ? `FCM Token: ${fcmToken}` : 'FCM Token yok' 
    });

    const user = await User.create(userData);

    if (user) {
      const token = generateToken(user.id);
      console.log('User created successfully:');
      console.log('- User ID:', user.id);
      console.log('- Email:', user.email);
      console.log('- FCM Token mevcut:', user.fcmToken ? 'Evet' : 'Hayır');
      
      if (user.fcmToken) {
        console.log('- FCM Token (TAM):', user.fcmToken);
      }
      
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        token: token
      });
    } else {
      res.status(400).json({ message: 'Geçersiz kullanıcı verileri' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Kullanıcı girişi
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    const { email, password, fcmToken } = req.body;
    
    // Email ve şifre zorunlu
    if (!email || !password) {
      return res.status(400).json({ message: 'Email ve şifre zorunlu' });
    }
    
    // Kullanıcıyı bul
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ message: 'Geçersiz email veya şifre' });
    }
    
    // Şifreyi doğrula
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Geçersiz email veya şifre' });
    }
    
    // FCM token'ı kaydet
    if (fcmToken) {
      user.fcmToken = fcmToken;
    }
    
    // Firebase Access Token'ı al ve kaydet
    try {
      const firebaseAccessToken = await firebaseTokenService.getFirebaseAccessToken();
      if (firebaseAccessToken) {
        user.firebaseAccessToken = firebaseAccessToken;
        console.log(`Kullanıcı ${user.id} için Firebase Access Token güncellendi (${firebaseAccessToken.substring(0, 10)}...)`);
      }
    } catch (tokenError) {
      console.error('Firebase token alınamadı:', tokenError);
    }
    
    // Son login zamanını güncelle
    user.lastLogin = new Date();
    await user.save();
    
    // JWT token oluştur
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin || false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Hassas bilgileri yanıttan çıkar
    const userWithoutPassword = { ...user.get() };
    delete userWithoutPassword.password;
    delete userWithoutPassword.resetPasswordToken;
    delete userWithoutPassword.resetPasswordExpire;
    
    res.status(200).json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Kullanıcı profili getirme
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Kullanıcı profili güncelleme
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        token: generateToken(updatedUser.id)
      });
    } else {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Şifre değiştirme
// @route   POST /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Kullanıcı ID'sini auth middleware'den alıyoruz
    const userId = req.user.id;
    
    // Mevcut kullanıcıyı bul (şifre dahil)
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Mevcut şifreyi kontrol et
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Mevcut şifre yanlış' });
    }
    
    // Yeni şifre doğrulaması
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır' });
    }
    
    // Şifreyi güncelle
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ message: 'Şifre başarıyla güncellendi' });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Bildirim tercihlerini ayarlama
// @route   POST /api/users/notification-preferences
// @access  Private
const setNotificationPreferences = async (req, res) => {
  try {
    const { enableNotifications, dayBeforeReminder, notificationTime, enableFirebaseNotifications } = req.body;
    
    // Kullanıcı ID'sini auth middleware'den alıyoruz
    const userId = req.user.id;
    
    // Mevcut kullanıcıyı bul
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Bildirim tercihlerini güncelle
    // Not: User modelde bu alanları önceden tanımlamış olmalıyız, 
    // eğer bu alanlar yoksa migration ile eklemek gerekir
    user.enableNotifications = enableNotifications !== undefined ? enableNotifications : user.enableNotifications;
    user.dayBeforeReminder = dayBeforeReminder !== undefined ? dayBeforeReminder : user.dayBeforeReminder;
    user.notificationTime = notificationTime || user.notificationTime;
    user.enableFirebaseNotifications = enableFirebaseNotifications !== undefined ? enableFirebaseNotifications : user.enableFirebaseNotifications;
    
    await user.save();
    
    res.status(200).json({ 
      message: 'Bildirim tercihleri güncellendi',
      preferences: {
        enableNotifications: user.enableNotifications,
        dayBeforeReminder: user.dayBeforeReminder,
        notificationTime: user.notificationTime,
        enableFirebaseNotifications: user.enableFirebaseNotifications
      }
    });
    
  } catch (error) {
    console.error('Set notification preferences error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    Bildirim tercihlerini getirme
// @route   GET /api/users/notification-preferences
// @access  Private
const getNotificationPreferences = async (req, res) => {
  try {
    // Kullanıcı ID'sini auth middleware'den alıyoruz
    const userId = req.user.id;
    
    // Mevcut kullanıcıyı bul
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Bildirim tercihlerini döndür
    res.status(200).json({ 
      enableNotifications: user.enableNotifications || true, // Varsayılan olarak açık
      dayBeforeReminder: user.dayBeforeReminder || true, // Varsayılan olarak açık
      notificationTime: user.notificationTime || '09:00', // Varsayılan saat
      enableFirebaseNotifications: user.enableFirebaseNotifications !== false // Varsayılan olarak açık
    });
    
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// @desc    FCM tokenı güncelleme
// @route   POST /api/users/fcm-token
// @access  Private
const updateFCMToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token gerekli' });
    }
    
    // Kullanıcı ID'sini auth middleware'den alıyoruz
    const userId = req.user.id;
    
    // Mevcut kullanıcıyı bul
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // FCM tokenı güncelle
    user.fcmToken = token;
    await user.save();
    
    res.status(200).json({ message: 'FCM token güncellendi' });
    
  } catch (error) {
    console.error('Update FCM token error:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  setNotificationPreferences,
  getNotificationPreferences,
  updateFCMToken
}; 