const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: {
        args: /^[0-9]{10}$/i,
        msg: 'Telefon numarası 10 haneli olmalıdır'
      },
      notEmpty: function(value) {
        // Eğer değer boş string ise, null olarak ayarla (boş string'i kabul etme)
        if (value === '') {
          this.setDataValue('phone', null);
        }
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Admin yetkisi
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Bildirim tercihleri
  enableNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  dayBeforeReminder: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notificationTime: {
    type: DataTypes.STRING, // "HH:MM" formatında saat
    defaultValue: '09:00'
  },
  fcmToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  enableFirebaseNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  firebaseAccessToken: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      // Phone boş string ise null yap
      if (user.phone === '') {
        user.phone = null;
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      // Phone boş string ise null yap
      if (user.phone === '') {
        user.phone = null;
      }
    }
  }
});

// Model metotları
User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User; 