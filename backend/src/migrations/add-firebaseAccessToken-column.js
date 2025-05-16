'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Users tablosuna firebaseAccessToken sütunu ekle
    await queryInterface.addColumn('Users', 'firebaseAccessToken', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    console.log('firebaseAccessToken sütunu eklendi');
  },

  down: async (queryInterface, Sequelize) => {
    // Sütunu kaldır
    await queryInterface.removeColumn('Users', 'firebaseAccessToken');
  }
}; 