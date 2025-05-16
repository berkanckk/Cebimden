// Login işlemi
const login = async (req, res) => {
  try {
    const { email, password, fcmToken, firebaseAccessToken } = req.body;
    
    // Debug bilgileri
    console.log('Login isteği:', {
      email,
      fcmTokenVarMi: !!fcmToken,
      firebaseAccessTokenVarMi: !!firebaseAccessToken,
      firebaseTokenUzunluk: firebaseAccessToken ? firebaseAccessToken.length : 0
    });
    
    // Kullanıcıyı bul
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ message: 'Email veya şifre hatalı' });
    }
    
    // Şifreyi doğrula
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Email veya şifre hatalı' });
    }
    
    // FCM token bilgisini güncelle
    if (fcmToken) {
      user.fcmToken = fcmToken;
      user.lastLogin = new Date();
      console.log(`Kullanıcı ${user.id} için FCM Token güncellendi`);
      
      // Firebase Access Token'ı da sakla (güvenli bir şekilde)
      if (firebaseAccessToken) {
        user.firebaseAccessToken = firebaseAccessToken;
        console.log(`Kullanıcı ${user.id} için Firebase Access Token güncellendi (${firebaseAccessToken.substring(0, 10)}...)`);
      } else {
        console.log(`Kullanıcı ${user.id} için Firebase Access Token alınamadı`);
      }
      
      await user.save();
    }
    
    // JWT token oluştur
    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Hassas bilgileri kaldır
    const userWithoutPassword = { ...user.get() };
    delete userWithoutPassword.password;
    
    res.status(200).json({
      message: 'Giriş başarılı',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Kayıt işlemi
const register = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name, 
      fcmToken, 
      firebaseAccessToken, 
      enableNotifications = true,
      enableFirebaseNotifications = true,
      notificationTime = '09:00' 
    } = req.body;
    
    // Email kullanımda mı kontrol et
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email zaten kullanılıyor' });
    }
    
    // Şifreyi hashleme
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Kullanıcı oluştur
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      fcmToken,
      firebaseAccessToken,
      enableNotifications,
      enableFirebaseNotifications,
      notificationTime,
      isActive: true,
      registeredAt: new Date(),
      lastLogin: new Date()
    });
    
    // JWT token oluştur
    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isAdmin || false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Hassas bilgileri kaldır
    const userWithoutPassword = { ...user.get() };
    delete userWithoutPassword.password;
    
    console.log(`Yeni kullanıcı kaydedildi: ID=${user.id}, Email=${email}, FCM Token=${fcmToken ? 'Var' : 'Yok'}`);
    
    res.status(201).json({
      message: 'Kayıt başarılı',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
}; 