const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { QueryTypes } = require('sequelize');

// Doğrudan bağlantı bilgileri
const sequelize = new Sequelize('cebimden', 'postgres', '741852Welbek.', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: console.log
});

// Migrations klasörü yolu
const migrationsPath = path.join(__dirname, '../migrations');

async function runMigration(migrationFile) {
  try {
    // Migration dosyasını yükle
    const migration = require(path.join(migrationsPath, migrationFile));
    
    // Migration'ı çalıştır
    console.log(`Migrating: ${migrationFile}`);
    await migration.up(sequelize.getQueryInterface(), sequelize);
    console.log(`Migration başarılı: ${migrationFile}`);
    
    return true;
  } catch (error) {
    console.error(`Migration hatası (${migrationFile}):`, error);
    return false;
  }
}

async function runMigrations() {
  try {
    console.log('Migrationlar başlatılıyor...');
    
    // Database'e bağlanalım
    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı.');
    
    // SequelizeMeta tablosunu kontrol et ve gerekirse oluştur
    try {
      await sequelize.query(
        'CREATE TABLE IF NOT EXISTS "SequelizeMeta" (name VARCHAR(255) PRIMARY KEY);',
        { type: QueryTypes.RAW }
      );
    } catch (error) {
      console.error('SequelizeMeta tablosu oluşturma hatası:', error);
    }
    
    // Önceden çalıştırılan migration'ları al
    let executedMigrations = [];
    try {
      const result = await sequelize.query(
        'SELECT name FROM "SequelizeMeta";',
        { type: QueryTypes.SELECT }
      );
      executedMigrations = result.map(item => item.name);
    } catch (error) {
      console.error('Çalıştırılan migrationları alma hatası:', error);
    }
    
    console.log('Önceden çalıştırılan migrationlar:', executedMigrations);
    
    // Migration dosyalarını oku
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.js'));
    
    // Çalıştırılmamış migrationları çalıştır
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        const success = await runMigration(file);
        
        if (success) {
          // Migration başarılı ise kaydet
          await sequelize.query(
            'INSERT INTO "SequelizeMeta" (name) VALUES (:name);',
            { 
              replacements: { name: file },
              type: QueryTypes.INSERT 
            }
          );
        } else {
          console.error(`Migration kaydedilemedi: ${file}`);
        }
      } else {
        console.log(`Migration zaten çalıştırılmış: ${file}`);
      }
    }
    
    console.log('Tüm migrationlar tamamlandı.');
  } catch (error) {
    console.error('Migration hatası:', error);
  } finally {
    // İşlem tamamlandığında bağlantıyı kapat
    await sequelize.close();
  }
}

// Script doğrudan çalıştırıldığında migrationları başlat
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration işlemi tamamlandı.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration işlemi başarısız:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations }; 