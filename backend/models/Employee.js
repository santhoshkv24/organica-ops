const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Employee = sequelize.define('Employee', {
  employee_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Department',
      key: 'department_id'
    }
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Company',
      key: 'company_id'
    }
  },
  team_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Team',
      key: 'team_id'
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_email_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  qualification: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'employee',
  timestamps: true,
  paranoid: true
});

module.exports = Employee;
