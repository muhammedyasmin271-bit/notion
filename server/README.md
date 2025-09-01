# Notion App Backend

This is the backend server for the My Notion App, built with Node.js, Express, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: User registration, login, and profile management
- **Project Management**: CRUD operations for projects with team collaboration
- **Document Management**: File uploads and document organization
- **Real-time Chat**: WebSocket-based chat system
- **Security**: Rate limiting, CORS, helmet, input validation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Install dependencies:**

   ```bash
   cd server
   npm install
   ```

2. **Create environment file:**
   Create a `.env` file in the server directory with:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/notion-app

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # File Upload Configuration
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads

   # Security Configuration
   CORS_ORIGIN=http://localhost:3000
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

3. **Start MongoDB:**

   ```bash
   # Start MongoDB service
   mongod

   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

4. **Run the server:**

   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Users

- `GET /api/users` - Get all users (managers only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Projects

- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Documents

- `GET /api/documents` - Get all documents
- `POST /api/documents` - Upload document
- `GET /api/documents/:id` - Get document by ID
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Chat

- `GET /api/chat/conversations` - Get chat conversations
- `POST /api/chat/messages` - Send message
- `GET /api/chat/messages/:conversationId` - Get conversation messages

## Database Models

- **User**: Authentication, roles, preferences
- **Project**: Project management, team collaboration
- **Goal**: Goal tracking and management
- **Document**: File management and organization
- **Meeting**: Meeting notes and scheduling
- **Notepad**: Personal notes and organization
- **Chat**: Real-time messaging system

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Express-validator for request validation
- **Rate Limiting**: Prevent abuse and DDoS attacks
- **CORS Protection**: Cross-origin resource sharing control
- **Helmet**: Security headers for Express

## Development

### Project Structure

```
server/
├── models/          # Database models
├── routes/          # API route handlers
├── middleware/      # Custom middleware
├── controllers/     # Business logic (future)
├── utils/           # Utility functions (future)
├── uploads/         # File upload directory
├── index.js         # Main server file
├── package.json     # Dependencies
└── README.md        # This file
```

### Adding New Features

1. **Create Model**: Define schema in `models/` directory
2. **Create Routes**: Add API endpoints in `routes/` directory
3. **Add Middleware**: Implement custom middleware if needed
4. **Update Main Server**: Import and use new routes in `index.js`

### Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## Production Deployment

1. **Environment Variables**: Set production values in `.env`
2. **Database**: Use production MongoDB instance
3. **Security**: Change JWT secret and enable HTTPS
4. **Monitoring**: Add logging and monitoring tools
5. **Process Management**: Use PM2 or similar for process management

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**: Ensure MongoDB is running
2. **Port Already in Use**: Change PORT in .env file
3. **JWT Errors**: Check JWT_SECRET in .env file
4. **CORS Issues**: Verify CORS_ORIGIN setting

### Logs

Check console output for detailed error messages and debugging information.

## Contributing

1. Follow the existing code style
2. Add proper error handling
3. Include input validation
4. Write tests for new features
5. Update documentation

## License

MIT License - see LICENSE file for details
