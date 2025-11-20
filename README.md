# Todo Task Application

A full-stack todo task management web application built with TypeScript, Express, Vue, and MySQL.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Development](#development)

## 🎯 Overview

This is a simple yet elegant todo task management application where users can create, view, and complete tasks. The application follows modern web development best practices with a clean separation of concerns between the database, backend API, and frontend UI.

## ✨ Features

### Core Functionality
- ✅ Create tasks with title and optional description
- ✅ View the 5 most recent uncompleted tasks
- ✅ Mark tasks as completed with a single click
- ✅ Completed tasks are automatically hidden from view
- ✅ Interactive statistics dashboard showing pending, completed, overdue, and total tasks
- ✅ **Click on "Pending" or "Completed" stats cards** to toggle between viewing active and completed tasks
- ✅ Mark completed tasks as incomplete (uncomplete functionality)

### User Experience
- ✅ Clean and intuitive user interface with smooth animations
- ✅ Real-time task updates
- ✅ Responsive design that works on all devices
- ✅ Dark mode support with theme toggle
- ✅ Visual feedback for all user actions
- ✅ Error handling and loading states

### Advanced Features
- ✅ Task priority levels (High, Medium, Low)
- ✅ Due dates with overdue indicators
- ✅ Task categories (Work, Personal, Shopping, Health, Learning, Other)
- ✅ Task tags for better organization
- ✅ Search functionality across task titles and descriptions
- ✅ Filter tasks by priority and category
- ✅ Edit existing tasks
- ✅ Delete tasks with confirmation modal
- ✅ Persistent data storage across restarts

## 🛠 Tech Stack

### Database
- **MySQL 8.0** - Relational database for persistent storage
- **Prisma** - Modern ORM for type-safe database access

### Backend
- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe JavaScript
- **Express 5** - Web application framework
- **Prisma Client** - Database client
- **Jest** - Testing framework
- **Supertest** - HTTP assertions for integration tests

### Frontend
- **Astro** - Modern web framework
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Vitest** - Testing framework for Vue components

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 📦 Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Docker** (v20.10 or higher)
- **Docker Compose** (v2.0 or higher)
- **Git** (for cloning the repository)

That's it! Docker will handle all other dependencies.

### For Local Development (Optional)

If you want to run the application without Docker:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MySQL** (v8.0 or higher)

## 📁 Project Structure

```
todo-assessment/
├── docker-compose.yml          # Multi-container orchestration
├── README.md                   # This file
│
├── backend/                    # Backend API
│   ├── Dockerfile             # Backend container configuration
│   ├── package.json           # Backend dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── jest.config.js         # Jest test configuration
│   ├── prisma.config.ts       # Prisma configuration
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── src/
│       ├── index.ts           # Application entry point
│       ├── app.ts             # Express app configuration
│       ├── routes/
│       │   └── tasks.ts       # Task API routes
│       └── tests/
│           ├── tasks.integration.test.ts  # Integration tests
│           └── tasks.unit.test.ts         # Unit tests
│
└── frontend/                  # Frontend UI
    ├── Dockerfile             # Frontend container configuration
    └── zapping-zero/          # Astro project
        ├── package.json       # Frontend dependencies
        ├── astro.config.mjs   # Astro configuration
        ├── vitest.config.ts   # Vitest test configuration
        ├── tsconfig.json      # TypeScript configuration
        └── src/
            ├── pages/
            │   └── index.astro        # Main page
            └── components/
                ├── TodoApp.vue        # Main Vue component
                └── TodoApp.test.ts    # Component tests
```

## 🚀 Getting Started

### Option 1: Using Docker (Recommended)

This is the easiest way to run the application. All components will be built and started automatically.

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd todo-assessment
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

   This will:
   - Build the backend and frontend Docker images
   - Start the MySQL database
   - Run database migrations
   - Start the backend API server on port 4000
   - Start the frontend development server on port 3000

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Database: localhost:3306

4. **Stop the application**
   ```bash
   docker-compose down
   ```

   To also remove the database volume:
   ```bash
   docker-compose down -v
   ```

### Option 2: Local Development (Without Docker)

#### Database Setup

1. **Install and start MySQL**
   ```bash
   # macOS with Homebrew
   brew install mysql
   brew services start mysql

   # Ubuntu/Debian
   sudo apt-get install mysql-server
   sudo systemctl start mysql
   ```

2. **Create the database**
   ```bash
   mysql -u root -p
   ```
   ```sql
   CREATE DATABASE todo;
   CREATE USER 'todo_user'@'localhost' IDENTIFIED BY 'todo_pass';
   GRANT ALL PRIVILEGES ON todo.* TO 'todo_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   Create a `.env` file:
   ```bash
   DATABASE_URL="mysql://todo_user:todo_pass@localhost:3306/todo"
   PORT=4000
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate deploy
   ```

5. **Start the backend server**
   ```bash
   npx ts-node-dev src/index.ts
   ```

   The backend will be available at http://localhost:4000

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend/zapping-zero
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment (optional)**
   The frontend defaults to `http://localhost:4000` for the API URL.

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The frontend will be available at http://localhost:3000

## 🧪 Running Tests

### Backend Tests

The backend has comprehensive unit and integration tests with high code coverage.

#### Using Docker

```bash
# Run tests in the backend container
docker-compose exec backend npm test

# Run tests with watch mode
docker-compose exec backend npm run test:watch
```

#### Local Development

```bash
cd backend
npm test                # Run all tests with coverage
npm run test:watch      # Run tests in watch mode
```

**Test Coverage Includes:**
- GET /tasks endpoint (filtering, pagination, ordering)
- POST /tasks endpoint (validation, creation)
- POST /tasks/:id/done endpoint (completion, error handling)
- Edge cases and error scenarios
- Database integration tests

### Frontend Tests

The frontend has component tests for the Vue TodoApp component.

#### Using Docker

```bash
# Run tests in the frontend container
docker-compose exec frontend npm test

# Run tests with watch mode
docker-compose exec frontend npm run test:watch
```

#### Local Development

```bash
cd frontend/zapping-zero
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
```

**Test Coverage Includes:**
- Component rendering
- Task creation
- Task completion
- Loading states
- Error handling
- User interactions

### End-to-End Tests (E2E)

Comprehensive E2E tests using Playwright that test the complete user flow across all browsers.

#### Prerequisites

```bash
cd e2e
npm install
npx playwright install  # Install browser binaries
```

#### Running E2E Tests

**Important:** Ensure the application is running via docker-compose before running E2E tests.

```bash
# Start the application first
docker-compose up

# In another terminal, run E2E tests
cd e2e
npm test                # Run all E2E tests
npm run test:ui         # Run with Playwright UI
npm run test:headed     # Run in headed mode (see the browser)
```

**E2E Test Coverage:**
- Complete user journey (create, view, complete tasks)
- Task creation with various inputs
- Task completion and removal
- Task list ordering and pagination (5 task limit)
- Form validation and error handling
- Loading and empty states
- Browser compatibility (Chromium, Firefox, Safari)
- Responsive design testing
- Keyboard navigation and accessibility
- Special characters and edge cases

## 📡 API Documentation

### Base URL
```
http://localhost:4000
```

### Endpoints

#### Get Tasks
```http
GET /tasks
```

Returns the 5 most recent uncompleted tasks, ordered by creation date (newest first).

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Task title",
    "description": "Task description",
    "completed": false,
    "createdAt": "2025-11-18T10:00:00.000Z",
    "updatedAt": "2025-11-18T10:00:00.000Z"
  }
]
```

#### Create Task
```http
POST /tasks
Content-Type: application/json

{
  "title": "New task",
  "description": "Optional description"
}
```

Creates a new task. Title is required, description is optional.

**Response:** `201 Created`
```json
{
  "id": 2,
  "title": "New task",
  "description": "Optional description",
  "completed": false,
  "createdAt": "2025-11-18T11:00:00.000Z",
  "updatedAt": "2025-11-18T11:00:00.000Z"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "error": "title required"
}
```

#### Mark Task as Done
```http
POST /tasks/:id/done
```

Marks a task as completed. Completed tasks will no longer appear in the GET /tasks response.

**Response:** `204 No Content`

**Error Responses:**
- `400 Bad Request` - Invalid task ID
```json
{
  "error": "invalid id"
}
```

- `404 Not Found` - Task doesn't exist
```json
{
  "error": "task not found"
}
```

## 🏗 Architecture

The application follows a three-tier architecture:

### Database Layer
- MySQL 8.0 relational database
- Single `task` table with columns: id, title, description, completed, createdAt, updatedAt
- Managed via Prisma ORM for type-safe database access

### Backend Layer (REST API)
- Express.js web server
- RESTful API design
- CORS enabled for cross-origin requests
- Prisma Client for database operations
- TypeScript for type safety
- Comprehensive error handling

### Frontend Layer (SPA)
- Astro framework with Vue 3 components
- Single Page Application (SPA)
- Reactive state management
- Responsive design with modern CSS
- Smooth animations and transitions
- Error handling and loading states

### Containerization
- Each layer runs in its own Docker container
- docker-compose orchestrates all containers
- Containers communicate via Docker networking
- Database data persists in a Docker volume

## 💻 Development

### Backend Development

The backend uses `ts-node-dev` for development with automatic reloading.

```bash
cd backend
npm install
npx ts-node-dev src/index.ts
```

### Frontend Development

The frontend uses Astro's development server with hot module replacement.

```bash
cd frontend/zapping-zero
npm install
npm run dev
```

### Database Migrations

When you make changes to the Prisma schema:

```bash
cd backend
npx prisma migrate dev --name migration_name
```

To view the database:

```bash
npx prisma studio
```

### Code Quality

The project follows these principles:

- **Clean Code**: Meaningful names, small functions, DRY principle
- **SOLID Principles**: Single responsibility, dependency injection
- **Type Safety**: Full TypeScript coverage
- **Testing**: Comprehensive unit and integration tests
- **Error Handling**: Graceful error handling throughout

### Environment Variables

#### Backend
- `DATABASE_URL` - MySQL connection string
- `PORT` - Backend server port (default: 4000)

#### Frontend
- `VITE_API_URL` - Backend API URL (default: http://localhost:4000)

## 🐛 Troubleshooting

### Docker Issues

**Port already in use:**
```bash
# Check what's using the port
lsof -i :3000  # or :4000, :3306

# Stop docker-compose and remove containers
docker-compose down
```

**Database connection issues:**
```bash
# Check if database is ready
docker-compose logs db

# Restart all services
docker-compose restart
```

**Permission issues:**
```bash
# Remove volumes and restart
docker-compose down -v
docker-compose up --build
```

### Local Development Issues

**Backend won't start:**
- Ensure MySQL is running
- Verify DATABASE_URL in .env
- Run `npx prisma generate`

**Frontend won't start:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check that backend is running on the correct port

**Tests failing:**
- Ensure test database is accessible
- Clear jest cache: `npx jest --clearCache`

## 📝 License

This project is created for assessment purposes.

## 👥 Author

Nipul Kanishka

---

**Note:** This application was built as part of a take-home assessment for a Full Stack Engineer position.
