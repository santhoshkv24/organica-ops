# C2C Portal

A comprehensive project management and collaboration platform designed to streamline team communication, task management, and project tracking.

## 🌟 Features

### 🔐 Authentication & Authorization
- User registration and login with JWT authentication
- Role-based access control (Admin, Manager, Team Lead, Employee, Customer)
- Password reset functionality
- Secure session management

### 📊 Dashboard
- Overview of projects, tasks, and team activities
- Quick access to recent updates and notifications
- Performance metrics and statistics

### 👥 User Management
- Employee profiles with detailed information
- Role assignment and permission management
- User activity tracking

### 🏢 Company & Team Management
- Create and manage multiple companies/divisions
- Team creation and management
- Department and role assignment

### 📋 Project Management
- Project creation and tracking
- Task assignment and status updates (Both Internal and Customer)
- Time tracking and logging

### 👨‍💼 Customer Management
- Customer company profiles
- Customer employee management
- Customer-specific project tracking

### 📅 Meeting Management
- Schedule and manage meetings
- Meeting invitations and reminders
- Meeting minutes and follow-ups

### 📊 Task Management (Both Internal and Customer)
- Create and assign tasks
- Task prioritization and deadlines
- Progress tracking
- Task transfer between team members

### 📈 Reporting
- Project progress reports
- Team performance analytics
- Time tracking reports
- Custom report generation

## 🛠️ Tech Stack

### Frontend
- React 19
- Material-UI (MUI) v7
- React Router v7
- Formik & Yup for form handling
- Axios for API requests
- Redux for state management
- React Big Calendar for scheduling

### Backend
- Node.js with Express.js
- MySQL database
- JWT for authentication
- Bcrypt for password hashing
- Nodemailer for email notifications
- Multer for file uploads

### Development Tools
- Git for version control
- Nodemon for development server
- ESLint for code linting
- Prettier for code formatting

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/c2c-portal.git
   cd c2c-portal
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your database credentials
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   # Update .env with your API endpoint
   ```

4. **Database Setup**
   - Create a new MySQL database
   - Import the database schema from `backend/database/schema.sql`

5. **Running the Application**
   - Start the backend server:
     ```bash
     cd backend
     npm run dev
     ```
   - Start the frontend development server:
     ```bash
     cd ../frontend
     npm start
     ```

6. **Access the Application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser

## 📂 Project Structure

```
c2c-portal/
├── backend/                 # Backend server code
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── .env                # Environment variables
│   └── server.js           # Server entry point
│
├── frontend/               # Frontend React application
│   ├── public/             # Static files
│   └── src/
│       ├── components/     # Reusable components
│       ├── context/        # React context
│       ├── hooks/          # Custom hooks
│       ├── layouts/        # Layout components
│       ├── services/       # API services
│       ├── utils/          # Utility functions
│       └── views/          # Page components
│
├── .gitignore
└── README.md
```

## 🔒 Security

- Password hashing using bcrypt
- JWT authentication with refresh tokens
- Rate limiting on authentication endpoints
- Input validation and sanitization
- CORS policy configuration
- Helmet.js for securing HTTP headers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

For any inquiries or support, please contact [santhoshvedakrishnan@gmail.com](mailto:santhoshvedakrishnan@gmail.com)

---

<div align="center">
  Made with ❤️ by K V Santhosh
</div>
