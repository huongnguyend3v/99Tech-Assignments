# Express.js CRUD API with TypeScript

A simple backend server built with Express.js and TypeScript, providing CRUD operations for user management with SQLite database persistence.

## Features

- **Create**: Add new users
- **Read**: List users with optional filtering, get user details by ID
- **Update**: Modify user information
- **Delete**: Remove users
- **API Documentation**: Interactive Swagger UI at `/api-docs`

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd problem-5
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the project root with:
     ```env
     PORT=3000
     URL=http://localhost:3000
     ```

4. Build the project:
   ```bash
   npm run build
   ```

## Running the Application

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` unless you override `PORT` in `.env`

## API Documentation

Interactive API documentation is available at `http://localhost:3000/api-docs` using Swagger UI. You can test all endpoints directly from the browser.

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Users

- `GET /api/users` - List all users
  - Query parameters:
    - `limit` (optional): Number of users to return (default: 10)
    - `offset` (optional): Number of users to skip (default: 0)
    - `filterColumn` (optional): Column to filter by ("name" or "email")
    - `filterValue` (optional): Value to filter by (partial match, requires filterColumn)
    - `sortColumn` (optional): Column to sort by ("name" or "email", defaults to "created_at")
    - `sortOrder` (optional): Sort order ("ASC" or "DESC", default: "DESC")

- `GET /api/users/:id` - Get user by ID

- `POST /api/users` - Create a new user
  - Body: `{ "name": "string", "email": "string" }`

- `PUT /api/users/:id` - Update user by ID
  - Body: `{ "name": "string", "email": "string" }` (partial update allowed)

- `DELETE /api/users/:id` - Delete user by ID

## Example Requests

### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

### Get Users with Filter and Sort
```bash
curl "http://localhost:3000/api/users?filterColumn=name&filterValue=John&sortColumn=name&sortOrder=ASC&limit=5"
```

### Update User
```bash
curl -X PUT http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"name": "John Smith"}'
```

## Project Structure

```
src/
├── controllers/
│   └── userController.ts               # Request handlers
├── middlewares/                        # Middlewares
|   └── validations/
|       ├── commonValidation.ts         # Common validation for apis
|       └── userValidation.ts           # Validations for user's apis
├── models/
│   ├── db.ts                           # Database connection
│   └── user.ts                         # User model and DB operations
├── routes/
│   └── userRoutes.ts                   # User routes
└── server.ts                           # Main server file
```

## Database

The application uses SQLite for data persistence. The database file `data.db` is created automatically in the project root when the server starts.

## Development

- TypeScript for type safety
- ESLint for code linting (if configured)
- Nodemon for development with auto-restart

## Scripts

- `npm run build` - Compile TypeScript
- `npm run dev` - Run in development mode
- `npm start` - Run production build
- `npm test` - Run tests (placeholder)