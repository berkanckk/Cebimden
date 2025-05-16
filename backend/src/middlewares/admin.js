/**
 * Admin yetki kontrolü middleware'i
 * Sadece admin kullanıcıların erişebileceği rotalar için kullanılır
 */
const adminMiddleware = (req, res, next) => {
  // Auth middleware'i req.user'ı set etmiş olmalı
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Yetkilendirme eksik, önce giriş yapmalısınız' 
    });
  }
  
  // Kullanıcının admin yetkisi var mı kontrol et
  if (!req.user.isAdmin) {
    console.log(`Admin olmayan kullanıcı erişim denemesi: ${req.user.id} (${req.user.email})`);
    return res.status(403).json({ 
      success: false, 
      message: 'Bu işlem için admin yetkisi gerekli' 
    });
  }
  
  // Admin ise sonraki middleware'e geç
  next();
};

module.exports = adminMiddleware; 