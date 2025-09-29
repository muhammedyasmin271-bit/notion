const mongoose = require('mongoose');

const meetingTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Template name is required'],
        trim: true,
        maxlength: [100, 'Template name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Template description cannot exceed 500 characters']
    },
    type: {
        type: String,
        enum: ['Standup', 'Planning', 'Review', 'Retro', 'Presentation', 'Brainstorming', 'Client Meeting', 'Team Sync'],
        default: 'Team Sync'
    },
    agenda: [{
        topic: String,
        duration: String,
        presenter: String
    }],
    defaultDuration: {
        type: String,
        default: '30'
    },
    tags: [{
        type: String,
        trim: true
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Template creator is required']
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for better query performance
meetingTemplateSchema.index({ createdBy: 1 });
meetingTemplateSchema.index({ type: 1 });
meetingTemplateSchema.index({ isPublic: 1 });
meetingTemplateSchema.index({ deleted: 1 });

module.exports = mongoose.model('MeetingTemplate', meetingTemplateSchema);