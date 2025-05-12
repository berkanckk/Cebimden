'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Önce sütunların var olup olmadığını kontrol et
      const tableInfo = await queryInterface.describeTable('Users');
      
      // enableNotifications sütunu
      if (!tableInfo.enableNotifications) {
        await queryInterface.addColumn('Users', 'enableNotifications', {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
        });
      }
      
      // dayBeforeReminder sütunu
      if (!tableInfo.dayBeforeReminder) {
        await queryInterface.addColumn('Users', 'dayBeforeReminder', {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
        });
      }
      
      // notificationTime sütunu
      if (!tableInfo.notificationTime) {
        await queryInterface.addColumn('Users', 'notificationTime', {
          type: Sequelize.STRING,
          defaultValue: '09:00',
          allowNull: false
        });
      }
      
      // fcmToken sütunu
      if (!tableInfo.fcmToken) {
        await queryInterface.addColumn('Users', 'fcmToken', {
          type: Sequelize.STRING,
          allowNull: true
        });
      }
      
      // enableFirebaseNotifications sütunu
      if (!tableInfo.enableFirebaseNotifications) {
        await queryInterface.addColumn('Users', 'enableFirebaseNotifications', {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
        });
      }
      
      console.log('Bildirim alanları başarıyla eklendi');
      return Promise.resolve();
    } catch (error) {
      console.error('Migration hatası:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.removeColumn('Users', 'enableNotifications');
      await queryInterface.removeColumn('Users', 'dayBeforeReminder');
      await queryInterface.removeColumn('Users', 'notificationTime');
      await queryInterface.removeColumn('Users', 'fcmToken');
      await queryInterface.removeColumn('Users', 'enableFirebaseNotifications');
      
      console.log('Bildirim alanları başarıyla kaldırıldı');
      return Promise.resolve();
    } catch (error) {
      console.error('Migration geri alma hatası:', error);
      return Promise.reject(error);
    }
  }
}; 