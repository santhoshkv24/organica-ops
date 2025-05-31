require('dotenv').config();
const app = require('./app');
const { connectDB, pool } = require('./config/database');

const PORT = process.env.PORT || 5000;

const checkDatabaseTables = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT COUNT(*) as tableCount 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);
    return rows[0].tableCount > 0;
  } catch (error) {
    console.error('Error checking database tables:', error);
    return false;
  }
};

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Check if database is initialized
    const hasData = await checkDatabaseTables();
    if (!hasData) {
      console.warn(
        '\n⚠️  Database appears to be empty. If this is your first time running the server, please run:\n' +
        'node scripts/setupDatabase.js\n' +
        'to initialize the database schema and sample data.\n'
      );
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
};

startServer();
