const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  let token;

  // Bearer token kontrolü
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Token'ı al
      token = req.headers.authorization.split(' ')[1];
      
      console.log('Token received:', token); // Debug için

      // Token'ı doğrula
      const secret = process.env.JWT_SECRET || 'jwt_secret';
      console.log('Verifying with secret:', secret); // Debug için
      
      const decoded = jwt.verify(token, secret);
      console.log('Decoded token:', decoded); // Debug için
      
      // Kullanıcıyı bul (şifre hariç)
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ message: 'Yetkilendirme başarısız, token geçersiz' });
    }
  } else if (!token) {
    return res.status(401).json({ message: 'Yetkilendirme başarısız, token bulunamadı' });
  }
};

module.exports = { protect }; 