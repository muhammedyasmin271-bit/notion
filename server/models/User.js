const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // Only validate if email is provided (not empty or undefined)
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [4, 'Password must be at least 4 characters'],
    select: false
  },
  companyId: {
    type: String,
    default: 'default',
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'manager', 'admin', 'superadmin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending'
  },
  avatar: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  phone: {
    type: String,
    default: ''
  },
  jobTitle: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  files: [{
    name: String,
    type: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    quietHours: {
      enabled: { type: Boolean, default: true },
      start: { type: String, default: '22:00' },
      end: { type: String, default: '08:00' }
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
// Compound index: email must be unique per company (not globally)
userSchema.index({ email: 1, companyId: 1 }, { unique: true, sparse: true });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ status: 1 });
userSchema.index({ companyId: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Virtual for user initials
userSchema.virtual('initials').get(function () {
  return this.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

// Virtual for email notifications preference
userSchema.virtual('emailNotifications').get(function () {
  return this.preferences?.notifications?.email !== false;
});

// Virtual for push notifications preference
userSchema.virtual('pushNotifications').get(function () {
  return this.preferences?.notifications?.push !== false;
});

// Virtual for SMS notifications preference
userSchema.virtual('smsNotifications').get(function () {
  return this.preferences?.notifications?.sms === true;
});

// Static method to find users by role
userSchema.statics.findByRole = function (role) {
  return this.find({ role, isActive: true });
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);