const { pool } = require('./database');
const fs = require('fs');
const path = require('path');

const setupStoredProcedures = async () => {
  try {
    console.log('Setting up stored procedures...');
    const proceduresDir = path.join(__dirname, 'stored_procedures');
    
    // Get all SQL files in the stored_procedures directory
    const sqlFiles = fs.readdirSync(proceduresDir)
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => {
        // Optional: Define execution order if needed
        const order = ['users', 'branches', 'teams', 'employees', 'projects', 'projectTeams', 'meeting', 'trackentries', 'customers'];
        const aIndex = order.indexOf(a.replace('.sql', ''));
        const bIndex = order.indexOf(b.replace('.sql', ''));
        return aIndex - bIndex;
      });

    // Get a connection from the pool
    const connection = await pool.getConnection();
    
    try {
      // First drop all existing procedures to avoid conflicts
      const [procedures] = await connection.query(`
        SELECT ROUTINE_NAME 
        FROM information_schema.ROUTINES 
        WHERE ROUTINE_TYPE='PROCEDURE' 
        AND ROUTINE_SCHEMA=DATABASE()
      `);
      
      for (const proc of procedures) {
        await connection.query(`DROP PROCEDURE IF EXISTS ${proc.ROUTINE_NAME}`);
        console.log(`Dropped existing procedure: ${proc.ROUTINE_NAME}`);
      }
      
      // Process each SQL file
      for (const file of sqlFiles) {
        console.log(`Processing file: ${file}`);
        const filePath = path.join(proceduresDir, file);
        let sql = fs.readFileSync(filePath, 'utf8');
        
        // Split into individual procedure statements
        const procedureStatements = sql.split(/(?=CREATE PROCEDURE)/i);
        
        // Create each procedure
        for (const statement of procedureStatements) {
          if (statement.trim() && statement.includes('CREATE PROCEDURE')) {
            try {
              // Extract procedure name for logging
              const procedureName = statement.match(/CREATE\s+PROCEDURE\s+([^\s(]+)/i)[1];
              
              // Clean up the statement
              let cleanedStatement = statement
                .replace(/DELIMITER \/\/|\/\/|DELIMITER ;/g, '')
                .replace(/END\s*\/\//g, 'END')
                .trim();
              
              if (cleanedStatement.endsWith(';')) {
                cleanedStatement = cleanedStatement.slice(0, -1);
              }
              
              await connection.query(cleanedStatement);
              console.log(`  Created stored procedure: ${procedureName}`);
            } catch (error) {
              console.error(`  Error creating procedure from ${file}:`, error.message);
              throw error; // Stop execution on error
            }
          }
        }
      }
      
      console.log('All stored procedures have been set up successfully');
    } finally {
      // Always release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error('Error setting up stored procedures:', error);
    throw error;
  }
};

module.exports = { setupStoredProcedures };