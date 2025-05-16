const { sequelize } = require('./src/config/db');
const { User } = require('./src/models');

// Modeli ve eksik sütunları senkronize et
const syncDatabase = async () => {
  try {
    // Alternatif 1: Sadece eksik alanları güncelle (force: false)
    await sequelize.sync({ alter: true });
    console.log('Veritabanı güncellendi (alter: true)');

    // Admin kullanıcıyı ayarla
    const adminUser = await User.findOne({ where: { email: 'welceyn@gmail.com' } });
    if (adminUser) {
      adminUser.isAdmin = true;
      await adminUser.save();
      console.log('Admin kullanıcı ayarlandı');
    }

    console.log('İşlem tamamlandı');
    process.exit(0);
  } catch (error) {
    console.error('Senkronizasyon hatası:', error);
    process.exit(1);
  }
};

// Senkronizasyonu çalıştır
syncDatabase(); 