const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  company_id: {
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
  founded_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  fax: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  branch_code: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'company',
  timestamps: true,
  paranoid: true // Soft delete
});

module.exports = Company;
