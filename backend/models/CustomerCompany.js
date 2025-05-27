const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CustomerCompany = sequelize.define('CustomerCompany', {
  customer_company_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  phone_no: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  industry: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'customer_company',
  timestamps: true,
  paranoid: true
});

module.exports = CustomerCompany;
