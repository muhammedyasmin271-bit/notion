const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
// Configure CORS to allow all origins
app.use(cors({
  origin: '*', // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  exposedHeaders: ['x-auth-token']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// MongoDB Connection with retry logic
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notion-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Ensure initial admin user exists
    await ensureInitialAdmin();
    await ensureEmailIndexIsSparse();
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.log('Server will continue without database connection');
    console.log('Please start MongoDB or update MONGODB_URI in .env file');
  }
};

// Start MongoDB connection (non-blocking)
connectDB();

// Ensure an initial admin exists so you can sign in without manual creation
async function ensureInitialAdmin() {
  try {
    const username = 'aymen';
    const name = 'Aymen Arega';
    const plainPassword = '7749';

    let user = await User.findOne({ username }).select('+password');
    if (user) {
      // Ensure role is manager and password matches desired one
      let updated = false;
      const matches = await bcrypt.compare(plainPassword, user.password || '');
      if (!matches) {
        user.password = plainPassword; // pre-save hook will hash
        updated = true;
      }
      if (user.role !== 'manager') {
        user.role = 'manager';
        updated = true;
      }
      if (user.isActive !== true) {
        user.isActive = true;
        updated = true;
      }
      if (user.status !== 'approved') {
        user.status = 'approved';
        updated = true;
      }
      if (updated) {
        await user.save();
        console.log('Initial manager user normalized (password/role/active)');
      }
      return; // User already exists (ensured password/role)
    }

    // Do NOT hash here. The User model pre-save hook will hash the password.
    user = new User({
      name,
      username,
      password: plainPassword,
      role: 'manager',
      isActive: true,
      status: 'approved',
    });

    await user.save();
    console.log('Initial admin user created:', { username, role: user.role });
  } catch (e) {
    console.error('Failed to ensure initial admin user:', e.message);
  }
}

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const goalRoutes = require('./routes/goals');
const documentRoutes = require('./routes/documents');
const meetingRoutes = require('./routes/meetings');
const meetingTemplateRoutes = require('./routes/meetingTemplates');
const notepadRoutes = require('./routes/notepad');
const chatRoutes = require('./routes/chat');
const notificationRoutes = require('./routes/notifications');
const aiRoutes = require('./routes/ai');
const uploadRoutes = require('./routes/upload');
const taskRoutes = require('./routes/tasks');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/meeting-templates', meetingTemplateRoutes);
app.use('/api/notepad', notepadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tasks', taskRoutes);

// Database status middleware
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database unavailable',
      error: 'Please start MongoDB or check database connection'
    });
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Notion App Backend is running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API available at: http://localhost:${PORT}/api`);
});

// Ensure the email index is unique and sparse to allow multiple null/undefined emails
async function ensureEmailIndexIsSparse() {
  try {
    const indexes = await User.collection.indexes();
    const emailIdx = indexes.find((i) => i.name === 'email_1');
    // If an email index exists but not sparse unique as desired, drop and recreate
    if (emailIdx && !(emailIdx.unique && emailIdx.sparse)) {
      try {
        await User.collection.dropIndex('email_1');
        console.log('Dropped non-sparse email index');
      } catch (e) {
        console.warn('Could not drop email_1 index (may not exist):', e.message);
      }
    }
    // Create desired index (idempotent)
    await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    console.log('Ensured email_1 index is unique & sparse');
  } catch (e) {
    console.error('Failed to ensure email index:', e.message);
  }
}