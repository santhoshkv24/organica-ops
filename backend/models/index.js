// Import models
const Company = require('./Company');
const CustomerCompany = require('./CustomerCompany');
const CustomerDetails = require('./CustomerDetails');
const Department = require('./Department');
const Team = require('./Team');
const Employee = require('./Employee');
const User = require('./User');

// Define associations

// Company - Department (One-to-Many)
Company.hasMany(Department, { foreignKey: 'company_id' });
Department.belongsTo(Company, { foreignKey: 'company_id' });

// Company - Team (One-to-Many)
Company.hasMany(Team, { foreignKey: 'company_id' });
Team.belongsTo(Company, { foreignKey: 'company_id' });

// Department - Team (One-to-Many)
Department.hasMany(Team, { foreignKey: 'department_id' });
Team.belongsTo(Department, { foreignKey: 'department_id' });

// Company - Employee (One-to-Many)
Company.hasMany(Employee, { foreignKey: 'company_id' });
Employee.belongsTo(Company, { foreignKey: 'company_id' });

// Department - Employee (One-to-Many)
Department.hasMany(Employee, { foreignKey: 'department_id' });
Employee.belongsTo(Department, { foreignKey: 'department_id' });

// Team - Employee (One-to-Many)
Team.hasMany(Employee, { foreignKey: 'team_id' });
Employee.belongsTo(Team, { foreignKey: 'team_id' });

// CustomerCompany - CustomerDetails (One-to-Many)
CustomerCompany.hasMany(CustomerDetails, { foreignKey: 'customer_company_id' });
CustomerDetails.belongsTo(CustomerCompany, { foreignKey: 'customer_company_id' });

// Employee - User (One-to-One)
Employee.hasOne(User, { foreignKey: 'employee_id' });
User.belongsTo(Employee, { foreignKey: 'employee_id' });

// CustomerDetails - User (One-to-One)
CustomerDetails.hasOne(User, { foreignKey: 'customer_id' });
User.belongsTo(CustomerDetails, { foreignKey: 'customer_id' });

module.exports = {
  Company,
  CustomerCompany,
  CustomerDetails,
  Department,
  Team,
  Employee,
  User
};
