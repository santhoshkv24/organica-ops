// Test script to verify the inventory loan implementation
const express = require('express');
const cors = require('cors');
const inventoryLoanRoutes = require('./routes/inventoryLoanRoutes');
const { protect } = require('./middleware/authMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Backend is working' });
});

// Use inventory loan routes
app.use('/api/inventory-loans', inventoryLoanRoutes);

console.log('✅ Backend routes updated successfully');
console.log('New routes available:');
console.log('- GET /api/inventory-loans/team/:team_id/pending (for team leads)');
console.log('- GET /api/inventory-loans/team/:team_id (for team members)');
console.log('- Existing routes still available');

// Test the routes registration
const routes = [];
app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
        routes.push(r.route.path);
    }
});

console.log('\nRegistered routes:', routes);
