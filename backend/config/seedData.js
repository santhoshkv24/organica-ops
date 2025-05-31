const bcrypt = require('bcrypt');
const { pool } = require('./database');

const seedData = async () => {
  try {
    // Create a company
    const [companyResult] = await pool.execute(`
      INSERT INTO companies (name, address, contact_email, contact_phone)
      VALUES ('Tech Corp', '123 Tech St', 'contact@techcorp.com', '123-456-7890')
    `);
    const companyId = companyResult.insertId;

    // Create departments
    const [deptResult1] = await pool.execute(`
      INSERT INTO departments (name, company_id, description)
      VALUES ('Engineering', ?, 'Software development department')
    `, [companyId]);
    const engineeringDeptId = deptResult1.insertId;

    const [deptResult2] = await pool.execute(`
      INSERT INTO departments (name, company_id, description)
      VALUES ('Sales', ?, 'Sales and marketing department')
    `, [companyId]);
    const salesDeptId = deptResult2.insertId;

    // Create teams
    const [teamResult1] = await pool.execute(`
      INSERT INTO teams (name, department_id, description)
      VALUES ('Backend Team', ?, 'Backend development team')
    `, [engineeringDeptId]);
    const backendTeamId = teamResult1.insertId;

    const [teamResult2] = await pool.execute(`
      INSERT INTO teams (name, department_id, description)
      VALUES ('Frontend Team', ?, 'Frontend development team')
    `, [engineeringDeptId]);
    const frontendTeamId = teamResult2.insertId;

    // Create employees
    const [empResult1] = await pool.execute(`
      INSERT INTO employees (first_name, last_name, email, phone, hire_date, team_id, department_id, position)
      VALUES ('John', 'Doe', 'john@techcorp.com', '123-456-7891', NOW(), ?, ?, 'Senior Developer')
    `, [backendTeamId, engineeringDeptId]);
    const employeeId1 = empResult1.insertId;

    const [empResult2] = await pool.execute(`
      INSERT INTO employees (first_name, last_name, email, phone, hire_date, team_id, department_id, position)
      VALUES ('Jane', 'Smith', 'jane@techcorp.com', '123-456-7892', NOW(), ?, ?, 'Frontend Developer')
    `, [frontendTeamId, engineeringDeptId]);
    const employeeId2 = empResult2.insertId;

    // Create customer company
    const [custCompResult] = await pool.execute(`
      INSERT INTO customer_companies (name, industry, address, contact_email, contact_phone)
      VALUES ('Client Corp', 'Technology', '456 Client St', 'contact@clientcorp.com', '987-654-3210')
    `);
    const customerCompanyId = custCompResult.insertId;

    // Create customer details
    await pool.execute(`
      INSERT INTO customer_details (customer_company_id, first_name, last_name, email, phone, position)
      VALUES (?, 'Bob', 'Johnson', 'bob@clientcorp.com', '987-654-3211', 'CTO')
    `, [customerCompanyId]);

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.execute(`
      INSERT INTO users (username, email, password, role, employee_id)
      VALUES ('admin', 'admin@techcorp.com', ?, 'admin', ?)
    `, [hashedPassword, employeeId1]);

    // Create employee user
    const empPassword = await bcrypt.hash('employee123', 10);
    await pool.execute(`
      INSERT INTO users (username, email, password, role, employee_id)
      VALUES ('employee', 'employee@techcorp.com', ?, 'employee', ?)
    `, [empPassword, employeeId2]);

    console.log('Sample data seeded successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
};

module.exports = seedData; 