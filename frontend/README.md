# C2C Portal Frontend

## Overview
This is the frontend for the C2C (Company to Customer) Portal application. It's built using React with CoreUI for React as the UI framework.

## Features
- Modern UI components with CoreUI React
- Responsive design
- Authentication and authorization
- Dynamic forms and data grids
- Company, department, team, and employee management
- Customer and customer company management

## Technologies
- React 19
- CoreUI for React
- React Router v7
- Axios for API calls

## Getting Started

### Prerequisites
- Node.js (v16+)
- NPM (v8+)

### Installation
1. Clone the repository
2. Navigate to the frontend directory:
```bash
cd frontend
```
3. Install dependencies:
```bash
npm install
```
4. Start the development server:
```bash
npm start
```
The application will be available at http://localhost:3000

## Architecture
The frontend follows a modern React application structure:
- `src/components/` - Reusable UI components
- `src/views/` - Page components
- `src/contexts/` - React context providers
- `src/services/` - API service calls
- `src/utils/` - Utility functions
- `src/routes/` - Route definitions
- `src/assets/` - Static assets like images and styles

## Key Components
- `ResizableGrid` - A resizable data grid component
- `EnhancedForm` - A dynamic form builder with validation
- `FormGrid` - A combined form and grid component for CRUD operations

## Development Notes
- The application uses stored procedures in the backend for database operations
- User authentication is handled through JWT tokens
- Role-based access control is implemented for admin vs. regular users

## Environment Variables
Create a `.env` file in the frontend directory with the following variables:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Building for Production
```bash
npm run build
```
The built files will be in the `build/` directory.

## License
This project is proprietary and confidential.
