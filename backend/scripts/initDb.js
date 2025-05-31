require('dotenv').config();
const { connectDB } = require('../config/database');
const initializeDatabase = require('../config/initDb');
const seedData = require('../config/seedData');

const initDb = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize database schema
    await initializeDatabase();

    // Seed sample data
    await seedData();

    console.log('Database initialized and seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

initDb(); 