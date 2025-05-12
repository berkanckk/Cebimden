const { sequelize } = require('../config/db');
const { QueryTypes } = require('sequelize');

async function addColumns() {
  try {
    console.log('Veritabanı tablolarına eksik sütunları ekleme işlemi başlatılıyor...');
    
    // 1. enableNotifications sütunu
    try {
      await sequelize.query(
        'ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "enableNotifications" BOOLEAN DEFAULT TRUE;',
        { type: QueryTypes.RAW }
      );
      console.log('enableNotifications sütunu eklendi veya zaten mevcut.');
    } catch (err) {
      console.error('enableNotifications sütunu eklenirken hata:', err);
    }
    
    // 2. dayBeforeReminder sütunu
    try {
      await sequelize.query(
        'ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "dayBeforeReminder" BOOLEAN DEFAULT TRUE;',
        { type: QueryTypes.RAW }
      );
      console.log('dayBeforeReminder sütunu eklendi veya zaten mevcut.');
    } catch (err) {
      console.error('dayBeforeReminder sütunu eklenirken hata:', err);
    }
    
    // 3. notificationTime sütunu
    try {
      await sequelize.query(
        'ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "notificationTime" VARCHAR(255) DEFAULT \'09:00\';',
        { type: QueryTypes.RAW }
      );
      console.log('notificationTime sütunu eklendi veya zaten mevcut.');
    } catch (err) {
      console.error('notificationTime sütunu eklenirken hata:', err);
    }
    
    // 4. fcmToken sütunu
    try {
      await sequelize.query(
        'ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "fcmToken" VARCHAR(255);',
        { type: QueryTypes.RAW }
      );
      console.log('fcmToken sütunu eklendi veya zaten mevcut.');
    } catch (err) {
      console.error('fcmToken sütunu eklenirken hata:', err);
    }
    
    // 5. enableFirebaseNotifications sütunu
    try {
      await sequelize.query(
        'ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "enableFirebaseNotifications" BOOLEAN DEFAULT TRUE;',
        { type: QueryTypes.RAW }
      );
      console.log('enableFirebaseNotifications sütunu eklendi veya zaten mevcut.');
    } catch (err) {
      console.error('enableFirebaseNotifications sütunu eklenirken hata:', err);
    }
    
    // Önce UUID extension'ını yükleyin
    try {
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', { type: QueryTypes.RAW });
      console.log('uuid-ossp eklentisi yüklendi veya zaten mevcut.');
    } catch (err) {
      console.error('uuid-ossp eklentisi yüklenirken hata:', err);
    }
    
    // Payments tablosunu temizle ve yeniden oluştur
    try {
      // İlişkileri düzgün kaldırabilmek için foreign key constraint'i kaldır
      await sequelize.query(`
        ALTER TABLE IF EXISTS "Payments" 
        DROP CONSTRAINT IF EXISTS "Payments_userId_fkey";
      `, { type: QueryTypes.RAW });
      
      // Tabloyu tamamen kaldır (varsa)
      await sequelize.query('DROP TABLE IF EXISTS "Payments";', { type: QueryTypes.RAW });
      console.log('Eski Payments tablosu silindi (varsa).');
      
      // Yeni tabloyu oluştur
      await sequelize.query(`
        CREATE TABLE "Payments" (
          "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "title" VARCHAR(255) NOT NULL,
          "description" TEXT,
          "amount" DECIMAL(10,2) NOT NULL,
          "currency" VARCHAR(3) DEFAULT 'TRY',
          "paymentDate" TIMESTAMP WITH TIME ZONE NOT NULL,
          "paymentType" VARCHAR(20) DEFAULT 'CREDIT_CARD',
          "status" VARCHAR(20) DEFAULT 'PENDING',
          "recurringType" VARCHAR(20) DEFAULT 'ONCE',
          "category" VARCHAR(50) DEFAULT 'GENERAL',
          "notificationEnabled" BOOLEAN DEFAULT TRUE,
          "dayBeforeReminder" BOOLEAN DEFAULT TRUE,
          "notificationDate" TIMESTAMP WITH TIME ZONE,
          "notificationSent" BOOLEAN DEFAULT FALSE,
          "reminderSent" BOOLEAN DEFAULT FALSE,
          "userId" UUID NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE CASCADE
        );
      `, { type: QueryTypes.RAW });
      
      console.log('Yeni Payments tablosu başarıyla oluşturuldu.');
    } catch (err) {
      console.error('Payments tablosunu güncellerken hata:', err);
    }
    
    console.log('Veritabanı güncelleme işlemi tamamlandı.');
    
  } catch (error) {
    console.error('Veritabanı güncelleme hatası:', error);
  } finally {
    await sequelize.close();
  }
}

// Script doğrudan çalıştırıldığında sütunları ekleyelim
if (require.main === module) {
  addColumns()
    .then(() => {
      console.log('Veritabanı güncellemesi tamamlandı.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Veritabanı güncellemesi başarısız:', error);
      process.exit(1);
    });
}

module.exports = { addColumns }; 