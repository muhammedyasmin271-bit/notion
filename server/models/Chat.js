const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'link'],
    default: 'text'
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    type: String
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

messageSchema.index({ chat: 1, createdAt: -1 });

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'admin', 'moderator'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  name: {
    type: String,
    trim: true,
    required: function() {
      return this.type === 'group';
    }
  },
  description: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  settings: {
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    allowReactions: {
      type: Boolean,
      default: true
    },
    allowEditing: {
      type: Boolean,
      default: true
    },
    messageRetention: {
      type: Number, // days
      default: 365
    }
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Virtual for unread message count per user
chatSchema.virtual('unreadCount').get(function() {
  // This would be calculated based on user's last read timestamp
  return 0;
});

// Method to add participant
chatSchema.methods.addParticipant = function(userId, role = 'member') {
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      role,
      joinedAt: new Date()
    });
  }
  return this.save();
};

// Method to remove participant
chatSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.user.toString() !== userId.toString());
  return this.save();
};

// Method to update participant role
chatSchema.methods.updateParticipantRole = function(userId, newRole) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (participant) {
    participant.role = newRole;
  }
  return this.save();
};

// Method to soft delete
chatSchema.methods.softDelete = function() {
  this.deleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to restore
chatSchema.methods.restore = function() {
  this.deleted = false;
  this.deletedAt = undefined;
  return this.save();
};

// Static method to find chats by user
chatSchema.statics.findByUser = function(userId) {
  return this.find({
    'participants.user': userId,
    deleted: false
  }).populate('participants.user', 'name email avatar role');
};

// Static method to find direct chat between two users
chatSchema.statics.findDirectChat = function(user1Id, user2Id) {
  return this.findOne({
    type: 'direct',
    'participants.user': { $all: [user1Id, user2Id] },
    deleted: false
  });
};

// Indexes for better performance
chatSchema.index({ 'participants.user': 1, deleted: 1 });
chatSchema.index({ type: 1, deleted: 1 });
chatSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('Chat', chatSchema);
module.exports.Message = mongoose.model('Message', messageSchema);
