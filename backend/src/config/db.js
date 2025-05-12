const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'cebimden',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '741852Welbek.',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı.');
    
    // Geliştirme ortamında tabloları senkronize et
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync();
      console.log('Tüm modeller senkronize edildi.');
    }
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB }; 