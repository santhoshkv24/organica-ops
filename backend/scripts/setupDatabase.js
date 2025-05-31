require('dotenv').config();
const { connectDB } = require('../config/database');
const initializeDatabase = require('../config/initDb');
const seedData = require('../config/seedData');

const setupDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize database schema
    await initializeDatabase();
    console.log('Database schema initialized successfully');
    
    // Seed sample data
    await seedData();
    console.log('Sample data seeded successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
};

setupDatabase(); 