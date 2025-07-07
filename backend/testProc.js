// Script to test the sp_CreateProject procedure

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'c2c',
  multipleStatements: true
};

console.log('Database config:', { 
  host: dbConfig.host, 
  user: dbConfig.user, 
  database: dbConfig.database 
});

async function testProcedure() {
  console.log('Testing sp_CreateProject procedure...');
  let connection;

  try {
    // Create database connection
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Test parameters matching the error in user query
    const params = [
      'Test Project',
      2,  // branch_id
      1,  // team_id
      'Test Description',
      'in_progress',  // status that was causing the error
      '2025-01-01',  // start_date
      '2025-06-01',  // end_date
      10  // project_manager_id
    ];

    console.log('Calling sp_CreateProject with params:', params);
    
    // Call the procedure
    const [result] = await connection.query('CALL sp_CreateProject(?, ?, ?, ?, ?, ?, ?, ?)', params);
    console.log('Procedure call successful, result:', result);

    // Now let's test with all status values from the frontend
    const statusValues = ['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled'];
    
    for (const status of statusValues) {
      console.log(`Testing with status: ${status}`);
      params[4] = status;
      try {
        const [statusResult] = await connection.query('CALL sp_CreateProject(?, ?, ?, ?, ?, ?, ?, ?)', params);
        console.log(`Status '${status}' works correctly`);
      } catch (err) {
        console.error(`Error with status '${status}':`, err.message);
      }
    }

    console.log('All tests completed');
  } catch (err) {
    console.error('Error calling procedure:', err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the test function
testProcedure().catch(err => {
  console.error('Unhandled error in test script:', err);
}); 