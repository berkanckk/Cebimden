const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.ENUM('TRY', 'USD', 'EUR'),
    defaultValue: 'TRY'
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  paymentType: {
    type: DataTypes.ENUM('CREDIT_CARD', 'BANK_ACCOUNT', 'OTHER'),
    defaultValue: 'CREDIT_CARD',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED'),
    defaultValue: 'PENDING'
  },
  recurringType: {
    type: DataTypes.ENUM('ONCE', 'WEEKLY', 'MONTHLY', 'YEARLY', 'weekly', 'monthly', 'yearly'),
    defaultValue: 'ONCE'
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'GENERAL'
  },
  notificationEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  dayBeforeReminder: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notificationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notificationSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

// İlişkiler
Payment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Payment, {
  foreignKey: 'userId',
  as: 'payments'
});

module.exports = Payment;