const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CustomerDetails = sequelize.define('CustomerDetails', {
  customer_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_company_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'CustomerCompany',
      key: 'customer_company_id'
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  gender: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  designation: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  mobile_no: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'customer_details',
  timestamps: true,
  paranoid: true
});

module.exports = CustomerDetails;
