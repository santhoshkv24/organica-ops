require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDB } = require('./config/database');
const { callProcedure } = require('./utils/dbUtils')
const corsOptions = require('./config/corsConfig');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const teamRoutes = require('./routes/teamRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const projectTeamMemberRoutes = require('./routes/projectTeamMemberRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const customerCompanyRoutes = require('./routes/customerCompanyRoutes');
const customerDetailsRoutes = require('./routes/customerDetailsRoutes');
const customerEmployeeRoutes = require('./routes/customerEmployeeRoutes');
const customerTeamRoutes = require('./routes/customerTeamRoutes');
const trackEntryRoutes = require('./routes/trackEntryRoutes');
const customerTrackEntryRoutes = require('./routes/customerTrackEntryRoutes');
const patchMovementRoutes = require('./routes/patchMovementRoutes');
const inventoryLoanRoutes = require('./routes/inventoryLoanRoutes');

// Connect to database
connectDB();

const app = express();

// CORS configuration - Must be before other middleware
app.use(cors(corsOptions));

// Security middleware with adjusted settings for development
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

// Parse URL-encoded bodies (for form data)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parse JSON bodies (for API requests)
app.use(express.json({ limit: '10mb' }));

// Rate limiting - More lenient in development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests per minute in development
  message: {
    status: 429,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to auth routes only
app.use('/api/auth', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cookie parser
app.use(cookieParser());

// Serve static files from uploads directory with CORS
app.use('/uploads', 
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
  }),
  (req, res, next) => {
    // Set Content-Type for image files
    const ext = path.extname(req.url).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
      res.type('image/jpeg');
    } else if (ext === '.png') {
      res.type('image/png');
    } else if (ext === '.gif') {
      res.type('image/gif');
    } else if (ext === '.svg') {
      res.type('image/svg+xml');
    } else if (ext === '.webp') {
      res.type('image/webp');
    } else if (ext === '.bmp') {
      res.type('image/bmp');
    }
    next();
  },
  express.static(path.join(__dirname, '../uploads'))
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/branches', companyRoutes); // Renamed from companies to branches
app.use('/api/teams', teamRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project-team-members', projectTeamMemberRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/customer-companies', customerCompanyRoutes);
app.use('/api/customer-details', customerDetailsRoutes);
app.use('/api/customer-employees', customerEmployeeRoutes);
app.use('/api/customer-teams', customerTeamRoutes);
app.use('/api/track-entries', trackEntryRoutes);
app.use('/api/customer-track-entries', customerTrackEntryRoutes);
app.use('/api/patch-movements', patchMovementRoutes);
app.use('/api/inventory-loans', inventoryLoanRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Public API endpoint for React Native testing - No authentication required
  app.get('/api/react-native/employees', async (req, res) => {
    try {
      const employees = await callProcedure('sp_GetAllEmployees', []);
      
      res.status(200).json({
        success: true,
        count: employees.length,
        data: employees
      });
    } catch (error) {
      console.error('Error getting employees for React Native:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;