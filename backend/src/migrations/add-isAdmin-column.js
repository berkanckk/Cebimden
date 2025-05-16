'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Users tablosuna isAdmin sütunu ekle
    await queryInterface.addColumn('Users', 'isAdmin', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    
    // İlk admin kullanıcıyı ayarla (opsiyonel)
    // Email adresine göre kullanıcıyı bulup admin yap
    try {
      await queryInterface.sequelize.query(
        `UPDATE "Users" SET "isAdmin" = true WHERE "email" = 'welceyn@gmail.com'`
      );
      console.log('Admin kullanıcı ayarlandı');
    } catch (error) {
      console.error('Admin kullanıcı ayarlanırken hata:', error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Sütunu kaldır
    await queryInterface.removeColumn('Users', 'isAdmin');
  }
}; 