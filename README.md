# My Notion App

A comprehensive, full-stack application built with React frontend and Node.js backend, designed to provide a Notion-like experience for team collaboration, project management, and personal productivity.

## ✨ Features

### 🏠 **HomePage**

- **Team Member Counts**: Separate statistics for managers and regular users
- **Beautiful Design**: Modern UI with gradients, shadows, and hover effects
- **Quick Actions**: Easy navigation to all app sections
- **Statistics Dashboard**: Visual progress tracking for projects and goals

### 📄 **DocumentsPage**

- **All File Types**: Support for PDF, Excel, PowerPoint, Word, Images, Videos, and Links
- **Professional Upload**: Drag & drop interface with file type validation
- **Enhanced UI**: Beautiful cards with type-specific icons and colors
- **Upper New Button**: Prominently placed document creation button

### 📝 **NotepadPage**

- **Professional Typing**: Enhanced textarea with Inter font and proper spacing
- **Working Formatting**: Functional toolbar for bold, italic, headings, lists, quotes, and code
- **Auto-Block Creation**: Automatic completion when typing markdown patterns
- **Beautiful Rendering**: Professional markdown rendering with proper typography

### 📊 **ReportsPage**

- **Analytics Dashboard**: Comprehensive metrics and KPI tracking
- **Interactive Charts**: Progress bars, completion rates, and visual data representation
- **Multi-Tab Interface**: Overview, Projects, Team Performance, and Productivity tabs
- **Data Export**: Export reports in JSON format with date range filtering
- **Real-time Metrics**: Live calculation of project completion rates and team statistics
- **Professional Visualizations**: Color-coded charts and progress indicators

### 💬 **InboxPage**

- **Team Member Lists**: Beautiful sections for managers and regular users
- **Chat Integration**: Direct chat buttons for each team member
- **User Management**: Separate displays for different user roles
- **Modern Design**: Consistent with the overall app aesthetic

### 🔧 **Backend & Database**

- **Full-Stack Architecture**: Node.js/Express backend with MongoDB
- **JWT Authentication**: Secure user authentication and authorization
- **Role-Based Access**: Manager, user, and admin role management
- **RESTful API**: Complete CRUD operations for all entities
- **Security Features**: Rate limiting, CORS, input validation, password hashing
- **SMS Notifications**: Twilio integration for SMS alerts and notifications

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file (see server/README.md for details)
# Start MongoDB service
mongod

# Start backend server
npm run dev
```

### Full-Stack Development

```bash
# From root directory - runs both frontend and backend
npm run dev
```

## 🏗️ Architecture

### Frontend (React)

- **Components**: Modular, reusable React components
- **State Management**: Context API for global state
- **Styling**: Tailwind CSS for modern, responsive design
- **Icons**: Lucide React for consistent iconography

### Backend (Node.js + Express)

- **Server**: Express.js with middleware stack
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Validation**: Express-validator for input sanitization
- **Security**: Helmet, CORS, rate limiting

### Database Models

- **User**: Authentication, roles, preferences
- **Project**: Project management, team collaboration
- **Goal**: Goal tracking and management
- **Document**: File management and organization
- **Meeting**: Meeting notes and scheduling
- **Notepad**: Personal notes and organization
- **Chat**: Real-time messaging system

## 📱 Pages & Features

| Page                 | Features                               | Status      |
| -------------------- | -------------------------------------- | ----------- |
| **HomePage**         | Team counts, statistics, quick actions | ✅ Complete |
| **InboxPage**        | User lists, chat functionality         | ✅ Complete |
| **ProjectsPage**     | CRUD operations, status management     | ✅ Complete |
| **GoalsPage**        | Goal tracking with notes field         | ✅ Complete |
| **DocumentsPage**    | File uploads, all types supported      | ✅ Complete |
| **MeetingNotesPage** | Notion-like database view              | ✅ Complete |
| **NotepadPage**      | Professional editor, formatting        | ✅ Complete |
| **ReportsPage**      | Analytics, charts, data visualization  | ✅ Complete |
| **SettingsPage**     | User preferences                       | ✅ Complete |
| **TrashPage**        | Soft delete management                 | ✅ Complete |

## 🔐 Authentication & Security

- **JWT Tokens**: Secure, stateless authentication
- **Password Security**: bcrypt hashing with salt rounds
- **Role-Based Access**: Granular permission control
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: DDoS protection and abuse prevention
- **CORS Protection**: Cross-origin resource sharing control
- **SMS Security**: Secure SMS notifications via Twilio

## 🎨 Design System

- **Color Palette**: Consistent blue, purple, and gray scheme
- **Typography**: Inter font family for readability
- **Spacing**: 8px grid system for consistent layouts
- **Shadows**: Subtle depth with hover effects
- **Gradients**: Modern gradient backgrounds
- **Responsive**: Mobile-first responsive design

## 🚧 Development Status

### ✅ Completed

- Frontend UI/UX improvements
- Team member management
- Document type support
- Notepad formatting functionality
- Backend architecture setup
- Database models and schemas
- Authentication system
- Basic API structure

### 🔄 In Progress

- Full API implementation
- Real-time chat system
- File upload handling
- Advanced search and filtering

### 📋 Planned

- WebSocket integration
- Email notifications
- Advanced analytics
- Mobile app
- API documentation
- Testing suite

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful, consistent icons
- **Context API** - State management

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens
- **bcryptjs** - Password hashing
- **Express-validator** - Input validation

### Development Tools

- **Concurrently** - Run multiple commands
- **Nodemon** - Auto-restart on file changes
- **ESLint** - Code quality and consistency

## 📖 API Documentation

### Base URL

```
http://localhost:9000/api
```

### Authentication

All protected routes require the `x-auth-token` header with a valid JWT token.

### Endpoints

- **Auth**: `/auth/*` - Registration, login, token management
- **Users**: `/users/*` - User management and statistics
- **Projects**: `/projects/*` - Project CRUD operations
- **Goals**: `/goals/*` - Goal tracking and management
- **Documents**: `/documents/*` - File upload and management
- **Meetings**: `/meetings/*` - Meeting notes and scheduling
- **Notepad**: `/notepad/*` - Personal note management
- **Chat**: `/chat/*` - Real-time messaging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the documentation in each component
- Review the server/README.md for backend details
- Open an issue for bugs or feature requests

---

**Built with ❤️ using modern web technologies**
