const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    next();
  };
};

// Company validation schema
const companySchema = Joi.object({
  name: Joi.string().required().max(255),
  address: Joi.string().allow(null, ''),
  contact_phone: Joi.string().max(20).allow(null, ''),
  contact_email: Joi.string().email().max(255).allow(null, '')
  // Removed fields not in the stored procedure: founded_date, fax, branch_code
});

// Department validation schema
const departmentSchema = Joi.object({
  company_id: Joi.number().integer().required(),
  name: Joi.string().required().max(255),
  description: Joi.string().allow(null, '')
});

// Team validation schema
const teamSchema = Joi.object({
  branch_id: Joi.number().integer().required(),
  name: Joi.string().required().max(255),
  description: Joi.string().allow(null, '')
  // Removed company_id as it's not directly used in team stored procedure
});

// Employee validation schema
const employeeSchema = Joi.object({
  first_name: Joi.string().required().max(255),
  last_name: Joi.string().required().max(255),
  email: Joi.string().email().max(255).required(),
  phone: Joi.string().max(20).allow(null, ''),
  hire_date: Joi.date().allow(null),
  department_id: Joi.number().integer().allow(null),
  team_id: Joi.number().integer().allow(null),
  position: Joi.string().max(255).allow(null, '')
  // Removed fields not in stored procedure: company_id, age, gender, etc.
});

// CustomerCompany validation schema
const customerCompanySchema = Joi.object({
  name: Joi.string().required().max(255),
  industry: Joi.string().max(100).allow(null, ''),
  address: Joi.string().allow(null, ''),
  contact_email: Joi.string().email().max(255).allow(null, ''),
  contact_phone: Joi.string().max(20).allow(null, '')
});

// CustomerDetails validation schema
const customerDetailsSchema = Joi.object({
  customer_company_id: Joi.number().integer().allow(null),
  first_name: Joi.string().required().max(255),
  last_name: Joi.string().required().max(255),
  email: Joi.string().email().max(255).required(),
  phone: Joi.string().max(20).allow(null, ''),
  position: Joi.string().max(50).allow(null, '')
  // Removed fields not in stored procedure: gender, address, etc.
});

// User validation schema
const userSchema = Joi.object({
  username: Joi.string().required().min(3).max(50),
  email: Joi.string().required().email().max(255),
  password: Joi.string().min(6).max(255).allow(null, ''),
  role: Joi.string().valid('admin', 'employee', 'manager').default('employee'),
  employee_id: Joi.number().integer().allow(null),
  customer_id: Joi.number().integer().allow(null)
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required(),
  'cf-turnstile-response': Joi.string().allow('')
});

// First-time password validation schema
const firstTimePasswordSchema = Joi.object({
  newPassword: Joi.string().required().min(6).max(255)
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});

const verifyResetCodeSchema = Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string().length(6).required(),
});

const resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required(),
});

module.exports = {
  validate,
  companySchema,
  departmentSchema,
  teamSchema,
  employeeSchema,
  customerCompanySchema,
  customerDetailsSchema,
  userSchema,
  loginSchema,
  firstTimePasswordSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema
};


