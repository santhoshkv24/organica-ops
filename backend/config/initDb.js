const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

const initializeDatabase = async () => {
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .filter(statement => statement.trim())
      .map(statement => statement.trim() + ';');

    // Execute each statement
    for (const statement of statements) {
      await pool.execute(statement);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

module.exports = initializeDatabase; 