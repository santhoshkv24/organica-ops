# C2C Portal Backend

A Company-to-Company (C2C) Portal backend built with Node.js, Express, and MySQL.

## Features

- Complete authentication system with JWT
- Role-based access control (Admin, Employee, Customer)
- Company management
- Department management
- Team management
- Employee management
- Customer company management
- Customer details management
- Raw SQL queries for better performance
- Input validation using Joi
- Security features (helmet, rate limiting, CORS)

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd c2c-portal
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=c2c_portal
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d
FRONTEND_URL=http://localhost:3000
```

4. Initialize the database:
```bash
npm run init-db
```

This will:
- Create all necessary tables
- Seed the database with sample data
- Create two default users:
  - Admin: admin@techcorp.com / admin123
  - Employee: employee@techcorp.com / employee123

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Documentation

### Authentication Endpoints
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- POST /api/auth/logout - Logout user
- GET /api/auth/me - Get current user

### Company Endpoints
- GET /api/companies - Get all companies
- GET /api/companies/:id - Get single company
- POST /api/companies - Create company (Admin only)
- PUT /api/companies/:id - Update company (Admin only)
- DELETE /api/companies/:id - Delete company (Admin only)

### Department Endpoints
- GET /api/departments - Get all departments
- GET /api/departments/:id - Get single department
- POST /api/departments - Create department (Admin only)
- PUT /api/departments/:id - Update department (Admin only)
- DELETE /api/departments/:id - Delete department (Admin only)

### Team Endpoints
- GET /api/teams - Get all teams
- GET /api/teams/:id - Get single team
- POST /api/teams - Create team (Admin only)
- PUT /api/teams/:id - Update team (Admin only)
- DELETE /api/teams/:id - Delete team (Admin only)

### Employee Endpoints
- GET /api/employees - Get all employees
- GET /api/employees/:id - Get single employee
- POST /api/employees - Create employee (Admin only)
- PUT /api/employees/:id - Update employee (Admin only)
- DELETE /api/employees/:id - Delete employee (Admin only)

### Customer Company Endpoints
- GET /api/customer-companies - Get all customer companies
- GET /api/customer-companies/:id - Get single customer company
- POST /api/customer-companies - Create customer company (Admin only)
- PUT /api/customer-companies/:id - Update customer company (Admin only)
- DELETE /api/customer-companies/:id - Delete customer company (Admin only)

### Customer Details Endpoints
- GET /api/customer-details - Get all customers
- GET /api/customer-details/:id - Get single customer
- POST /api/customer-details - Create customer (Admin only)
- PUT /api/customer-details/:id - Update customer (Admin only)
- DELETE /api/customer-details/:id - Delete customer (Admin only)

## Security Features

- JWT authentication
- Password hashing using bcrypt
- Rate limiting
- Helmet security headers
- CORS configuration
- Input validation
- Role-based access control