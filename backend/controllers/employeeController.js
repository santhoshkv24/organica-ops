const {
  query,
  getOne,
  insert,
  update,
  remove,
  callProcedure,
  getOneProcedure,
} = require("../utils/dbUtils");
const bcrypt = require("bcryptjs");

// Get all employees
const getEmployees = async (req, res) => {
  try {
    const employees = await callProcedure("sp_GetAllEmployees", []);

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error("Error getting employees:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get single employee
const getEmployee = async (req, res) => {
  try {
    const employee = await getOneProcedure("sp_GetEmployeeById", [
      req.params.id,
    ]);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error("Error getting employee:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create employee
const createEmployee = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      hire_date,
      team_id,
      position,
    } = req.body;

    // Check if email is already in use
    const emailCheck = await callProcedure("sp_CheckEmployeeEmailExists", [
      email,
      0,
    ]);

    if (emailCheck[0]?.email_count > 0) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    // Check if team exists
    if (team_id) {
      const team = await getOneProcedure("sp_GetTeamById", [team_id]);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
    }

    // Create employee using stored procedure
    const result = await callProcedure("sp_CreateEmployee", [
      first_name,
      last_name,
      email,
      phone,
      hire_date,
      team_id,
      position,
    ]);

    const employeeId = result[0]?.employee_id;

    // Get the created employee
    const employee = await getOneProcedure("sp_GetEmployeeById", [employeeId]);

    // Automatically create a user account for the new employee
    try {
      // Generate username from first and last name
      const username = `${first_name.toLowerCase()}.${last_name.toLowerCase()}`;

      // Use phone number as password
      const password = phone;

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user account with 'employee' role
      await callProcedure("sp_CreateUser", [
        username,
        email,
        hashedPassword,
        "employee",
        employeeId,
      ]);

      console.log(`User account created for employee ID: ${employeeId}`);
    } catch (userError) {
      console.error("Error creating user account for employee:", userError);
      // Continue with the response even if user creation fails
    }

    res.status(201).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      hire_date,
      team_id,
      position,
    } = req.body;

    // Check if employee exists
    const employee = await getOneProcedure("sp_GetEmployeeById", [
      req.params.id,
    ]);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if email is already in use (by another employee)
    if (email && email !== employee.email) {
      const emailCheck = await callProcedure("sp_CheckEmployeeEmailExists", [
        email,
        req.params.id,
      ]);

      if (emailCheck[0]?.email_count > 0) {
        return res.status(400).json({ message: "Email is already in use" });
      }
    }

    // Check if team exists
    if (team_id) {
      const team = await getOneProcedure("sp_GetTeamById", [team_id]);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
    }

    // Update employee using stored procedure
    await callProcedure("sp_UpdateEmployee", [
      req.params.id,
      first_name,
      last_name,
      email,
      phone,
      hire_date,
      team_id,
      position,
    ]);

    // Get the updated employee
    const updatedEmployee = await getOneProcedure("sp_GetEmployeeById", [
      req.params.id,
    ]);

    res.status(200).json({
      success: true,
      data: updatedEmployee,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    // Check if employee exists
    const employee = await getOneProcedure("sp_GetEmployeeById", [
      req.params.id,
    ]);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if employee has a user account
    const user = await callProcedure("sp_GetUserByEmployeeId", [req.params.id]);

    if (user.length > 0) {
      // Delete the user account first
      await callProcedure("sp_DeleteUser", [user[0].user_id]);
    }

    // Delete the employee
    const result = await callProcedure("sp_DeleteEmployee", [req.params.id]);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get employees by team
const getEmployeesByTeam = async (req, res) => {
  try {
    const employees = await callProcedure("sp_GetEmployeesByTeam", [
      req.params.teamId,
    ]);

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error("Error getting team employees:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get employees by branch
const getEmployeesByBranch = async (req, res) => {
  try {
    const employees = await callProcedure("sp_GetEmployeesByBranch", [
      req.params.branchId,
    ]);

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error("Error getting branch employees:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const xlsx = require("xlsx");

const importEmployees = async (req, res) => {
  console.log("Starting employee import process...");
  try {
    if (!req.file) {
      console.log("No file uploaded.");
      return res.status(400).json({ message: "No file uploaded." });
    }

    const { team_id } = req.body;
    console.log(`Received team_id: ${team_id}`);
    if (!team_id) {
      console.log("Team ID is required.");
      return res.status(400).json({ message: "Team ID is required." });
    }

    console.log("Parsing Excel file...");
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const employees = xlsx.utils.sheet_to_json(worksheet);
    console.log("Parsed employees from Excel:", employees);

    if (employees.length === 0) {
      console.log("The Excel file is empty.");
      return res.status(400).json({ message: "The Excel file is empty." });
    }

    const importResults = {
      success: [],
      errors: [],
    };

    console.log("Processing each employee...");
    for (const [index, employee] of employees.entries()) {
      try {
        console.log(`Processing row ${index + 2}...`);
        const { first_name, last_name, email, phone, hire_date, position } =
          employee;
        if (!first_name || !last_name || !email) {
          throw new Error(
            "Missing required fields (first_name, last_name, email)."
          );
        }

        function excelDateToJSDate(hire_date) {
          const utc_days = Math.floor(hire_date - 25569);
          const date = new Date(utc_days * 86400 * 1000);
          return date.toISOString().split("T")[0]; // returns "YYYY-MM-DD"
        }

        const employeeData = {
          first_name,
          last_name,
          email,
          phone: String(phone) || null,
          hire_date: excelDateToJSDate(hire_date) || null,
          position: position || null,
          team_id,
        };

        console.log(`Creating employee with data:`, employeeData);
        const result = await createEmployeeInternal(employeeData);
        console.log(
          `Successfully created employee for row ${index + 2}:`,
          result
        );
        importResults.success.push({ row: index + 2, data: result });
      } catch (error) {
        console.error(
          `Error creating employee for row ${index + 2}:`,
          error.message
        );
        importResults.errors.push({ row: index + 2, message: error.message });
      }
    }

    console.log("Import process completed. Final results:", importResults);
    res
      .status(201)
      .json({
        success: true,
        message: "Import process completed.",
        results: importResults,
      });
  } catch (error) {
    console.error("Error importing employees:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Internal function to create an employee without sending a response
const createEmployeeInternal = async (employeeData) => {
  const { first_name, last_name, email, phone, hire_date, team_id, position } =
    employeeData;

  const emailCheck = await callProcedure("sp_CheckEmployeeEmailExists", [
    email,
    0,
  ]);
  if (emailCheck[0]?.email_count > 0) {
    throw new Error("Email is already in use");
  }

  if (team_id) {
    const team = await getOneProcedure("sp_GetTeamById", [team_id]);
    if (!team) {
      throw new Error("Team not found");
    }
  }

  const result = await callProcedure("sp_CreateEmployee", [
    first_name,
    last_name,
    email,
    phone,
    hire_date,
    team_id,
    position,
  ]);

  const employeeId = result[0]?.employee_id;
  const employee = await getOneProcedure("sp_GetEmployeeById", [employeeId]);

  const username = `${first_name.toLowerCase()}.${last_name.toLowerCase()}`;
  const password = phone;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await callProcedure("sp_CreateUser", [
    username,
    email,
    hashedPassword,
    "employee",
    employeeId,
  ]);

  return employee;
};

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeesByTeam,
  getEmployeesByBranch,
  importEmployees,
};
