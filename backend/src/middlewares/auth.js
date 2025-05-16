const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * JWT token doğrulama middleware'i
 * Koruma gerektiren rotalarda kullanılır
 */
const authMiddleware = async (req, res, next) => {
  try {
    let token;
    
    // Header'dan Bearer token'ı al
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Token yoksa yetkilendirme hatası
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Bu işlem için yetkilendirme gerekli' 
      });
    }
    
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kullanıcıyı bul
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz token, kullanıcı bulunamadı' 
      });
    }
    
    // Kullanıcı aktif değilse
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Hesabınız aktif değil' 
      });
    }
    
    // Kullanıcı bilgisini ekle
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Hatası:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token süresi dolmuş, lütfen tekrar giriş yapın' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
};

module.exports = authMiddleware; 