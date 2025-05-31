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
  phone_no: Joi.string().max(20).allow(null, ''),
  founded_date: Joi.date().allow(null),
  email: Joi.string().email().max(255).allow(null, ''),
  fax: Joi.string().max(20).allow(null, ''),
  branch_code: Joi.string().max(50).allow(null, '')
});

// Department validation schema
const departmentSchema = Joi.object({
  company_id: Joi.number().integer().required(),
  name: Joi.string().required().max(255),
  description: Joi.string().allow(null, '')
});

// Team validation schema
const teamSchema = Joi.object({
  department_id: Joi.number().integer().required(),
  company_id: Joi.number().integer().required(),
  name: Joi.string().required().max(255),
  description: Joi.string().allow(null, '')
});

// Employee validation schema
const employeeSchema = Joi.object({
  department_id: Joi.number().integer().allow(null),
  company_id: Joi.number().integer().required(),
  team_id: Joi.number().integer().allow(null),
  name: Joi.string().required().max(255),
  age: Joi.number().integer().min(18).max(100).allow(null),
  gender: Joi.string().valid('Male', 'Female', 'Other').allow(null, ''),
  phone_number: Joi.string().max(20).allow(null, ''),
  email: Joi.string().email().max(255).allow(null, ''),
  role: Joi.string().max(50).allow(null, ''),
  address: Joi.string().allow(null, ''),
  company_email_id: Joi.string().email().max(255).allow(null, ''),
  qualification: Joi.string().max(255).allow(null, '')
});

// CustomerCompany validation schema
const customerCompanySchema = Joi.object({
  name: Joi.string().required().max(255),
  address: Joi.string().allow(null, ''),
  phone_no: Joi.string().max(20).allow(null, ''),
  email: Joi.string().email().max(255).allow(null, ''),
  industry: Joi.string().max(100).allow(null, '')
});

// CustomerDetails validation schema
const customerDetailsSchema = Joi.object({
  customer_company_id: Joi.number().integer().allow(null),
  name: Joi.string().required().max(255),
  gender: Joi.string().valid('Male', 'Female', 'Other').allow(null, ''),
  designation: Joi.string().max(50).allow(null, ''),
  address: Joi.string().allow(null, ''),
  mobile_no: Joi.string().max(20).allow(null, ''),
  email: Joi.string().email().max(255).allow(null, '')
});

// User validation schema
const userSchema = Joi.object({
  username: Joi.string().required().min(3).max(50),
  email: Joi.string().required().email().max(255),
  password: Joi.string().required().min(6).max(255),
  role: Joi.string().valid('admin', 'employee', 'customer').default('employee'),
  employee_id: Joi.number().integer().allow(null),
  customer_id: Joi.number().integer().allow(null)
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required()
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
  loginSchema
};
