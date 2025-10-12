import React, { useState, useEffect } from 'react';
import { ArrowLeft, Brain, Zap, Target, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const HowItWorksPage = () => {
  const { isDarkMode } = useTheme();
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const fullText = `# Complete Guide: How Our Notion App Works

Welcome to your comprehensive productivity workspace! This detailed guide covers everything you need to master our platform.

## 🏠 Dashboard Overview - Your Command Center

Your home dashboard is the heart of your productivity system:

### Real-Time Statistics
- **Projects Counter**: Shows total active projects with completion percentages
- **Completed Tasks**: Visual progress tracking with trend indicators
- **Document Library**: File count with storage usage metrics
- **Meeting Tracker**: Scheduled and completed meetings overview
- **Pending Items**: Tasks awaiting your attention with priority levels
- **Task Management**: Total task count across all projects

### Smart Status Bar
- **System Health**: Real-time server status and uptime monitoring
- **AI Assistant**: Shows when AI features are active and available
- **Performance Metrics**: Live productivity and efficiency scores
- **Time Display**: Current time with timezone awareness

### Activity Feed
- **Real-Time Updates**: Live notifications of project changes
- **Priority Indicators**: Color-coded urgency levels (High/Medium/Low)
- **Team Activities**: See what your colleagues are working on
- **Smart Filtering**: Focus on relevant updates only

## 📊 Advanced Project Management

### Project Creation & Setup
1. **Click "Create Project"** from dashboard or navigation
2. **Define Project Details**: Name, description, objectives
3. **Set Timeline**: Start date, deadline, milestones
4. **Assign Team Members**: Add collaborators with specific roles
5. **Configure Settings**: Privacy, notifications, permissions

### Project Features
- **Status Tracking**: Draft → In Progress → Review → Completed
- **Progress Visualization**: Percentage completion with visual bars
- **Task Breakdown**: Divide projects into manageable tasks
- **Deadline Management**: Automatic reminders and alerts
- **Team Collaboration**: Comments, mentions, and discussions
- **File Attachments**: Link relevant documents to projects

### Project Views
- **List View**: Traditional project listing with filters
- **Kanban Board**: Drag-and-drop task management
- **Calendar View**: Timeline and deadline visualization
- **Split View**: Work on project details while browsing list

## 📁 Comprehensive Document Management

### Supported File Types
- **Documents**: PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx)
- **Images**: JPG, PNG, GIF, SVG, WebP
- **Videos**: MP4, AVI, MOV, WebM
- **Archives**: ZIP, RAR, 7Z
- **Code Files**: JS, Python, HTML, CSS, JSON
- **Web Links**: Automatic preview and metadata extraction

### Upload Methods
1. **Drag & Drop**: Simply drag files into the upload area
2. **Browse Files**: Click to select from your computer
3. **Bulk Upload**: Select multiple files simultaneously
4. **URL Import**: Add web links with automatic preview

### Organization Features
- **Smart Categories**: Automatic file type classification
- **Custom Tags**: Create your own organizational system
- **Search Functionality**: Find files by name, content, or metadata
- **Version Control**: Track file changes and revisions
- **Access Permissions**: Control who can view/edit documents
- **Storage Analytics**: Monitor usage and optimize space

## 📝 Professional Notepad System

### Rich Text Editor
- **Markdown Support**: Write with markdown syntax for quick formatting
- **Live Preview**: See formatted output as you type
- **Toolbar Options**: Bold, italic, headers, lists, quotes, code blocks
- **Auto-Completion**: Smart suggestions for markdown patterns
- **Syntax Highlighting**: Code blocks with language-specific coloring

### Advanced Features
- **Real-Time Collaboration**: Multiple users editing simultaneously
- **Version History**: Track all changes with timestamps
- **Export Options**: PDF, HTML, Markdown, Plain Text
- **Template System**: Pre-built note templates for common use cases
- **AI Writing Assistant**: Grammar suggestions and content improvements
- **Cross-References**: Link notes to projects and documents

### Note Organization
- **Folders & Subfolders**: Hierarchical organization system
- **Favorites**: Quick access to frequently used notes
- **Recent Notes**: Automatically track your latest work
- **Search & Filter**: Find notes by content, tags, or date
- **Sharing Options**: Collaborate with team members

## 📅 Comprehensive Meeting Management

### Meeting Creation
1. **Schedule New Meeting**: Set date, time, duration
2. **Add Participants**: Invite team members with roles
3. **Create Agenda**: Structure your meeting topics
4. **Attach Resources**: Link relevant documents and projects
5. **Set Reminders**: Automatic notifications for participants

### Meeting Templates
- **Daily Standup**: Quick team sync template
- **Project Review**: Progress assessment format
- **Brainstorming**: Creative session structure
- **Client Meeting**: Professional client interaction template
- **Retrospective**: Team improvement discussion format

### During Meetings
- **Live Note Taking**: Real-time collaborative notes
- **Action Items**: Assign tasks with deadlines
- **Decision Tracking**: Record important decisions
- **Time Management**: Built-in timer and agenda tracking
- **Screen Sharing**: Integration with video conferencing tools

### Post-Meeting
- **Automatic Summaries**: AI-generated meeting highlights
- **Action Item Distribution**: Automatic task assignment
- **Meeting Minutes**: Professional formatted output
- **Follow-up Reminders**: Ensure action items are completed

## 📈 Advanced Analytics & Reporting

### Dashboard Analytics
- **Productivity Trends**: Track your efficiency over time
- **Project Completion Rates**: Success metrics and patterns
- **Team Performance**: Individual and group statistics
- **Time Allocation**: See where you spend your time
- **Goal Achievement**: Progress toward objectives

### Custom Reports
- **Date Range Selection**: Analyze specific time periods
- **Filter Options**: Focus on specific projects, teams, or metrics
- **Visual Charts**: Graphs, pie charts, and progress bars
- **Export Formats**: PDF, Excel, CSV, JSON
- **Scheduled Reports**: Automatic report generation and delivery

### Key Metrics
- **Project Velocity**: How quickly you complete projects
- **Task Completion Rate**: Percentage of finished tasks
- **Collaboration Index**: Team interaction and communication levels
- **Document Usage**: Most accessed and shared files
- **Meeting Efficiency**: Time spent vs. outcomes achieved

## 🤖 AI-Powered Features

### Smart Suggestions
- **Task Prioritization**: AI recommends what to work on next
- **Project Insights**: Identify potential bottlenecks and risks
- **Content Recommendations**: Suggest relevant documents and notes
- **Team Optimization**: Improve collaboration and communication
- **Deadline Predictions**: Forecast project completion dates

### Automation Features
- **Smart Categorization**: Automatic file and project tagging
- **Duplicate Detection**: Find and merge similar content
- **Progress Tracking**: Automatic status updates based on activity
- **Reminder System**: Intelligent notification scheduling
- **Content Generation**: AI-assisted writing and documentation

## 🔧 Complete Getting Started Guide

### Initial Setup (5 minutes)
1. **Complete Profile**: Add your name, role, and preferences
2. **Set Timezone**: Ensure accurate time tracking
3. **Configure Notifications**: Choose how you want to be alerted
4. **Import Existing Data**: Upload current projects and documents
5. **Invite Team Members**: Add colleagues and set permissions

### First Week Workflow
**Day 1-2: Foundation**
- Create your first project with clear objectives
- Upload 5-10 important documents
- Write your first note using the rich text editor
- Schedule a team meeting to introduce the platform

**Day 3-4: Collaboration**
- Invite team members to your projects
- Practice real-time collaboration on notes
- Use the activity feed to stay updated
- Explore different project views (list, kanban, calendar)

**Day 5-7: Optimization**
- Review your first week's analytics
- Set up custom tags and categories
- Create meeting templates for recurring sessions
- Configure AI suggestions based on your workflow

### Advanced Usage (Week 2+)
- **Custom Workflows**: Adapt the system to your specific needs
- **Integration Setup**: Connect with external tools and services
- **Team Training**: Help colleagues maximize their productivity
- **Performance Monitoring**: Use analytics to continuously improve
- **Feature Exploration**: Discover advanced features as you grow

## 🎯 Pro Tips for Maximum Productivity

### Daily Habits
- **Morning Dashboard Check**: Review priorities and updates (2 minutes)
- **Afternoon Progress Update**: Mark completed tasks and add notes (3 minutes)
- **Evening Planning**: Set tomorrow's priorities using AI suggestions (5 minutes)

### Weekly Routines
- **Monday Planning**: Review project status and set weekly goals
- **Wednesday Check-in**: Assess progress and adjust priorities
- **Friday Review**: Analyze completed work and plan improvements

### Monthly Optimization
- **Analytics Review**: Study productivity trends and patterns
- **System Cleanup**: Archive completed projects and organize files
- **Feature Updates**: Explore new features and improvements
- **Team Feedback**: Gather input on workflow effectiveness

## 🚀 Ready to Transform Your Productivity?

You now have a complete understanding of our platform's capabilities. Start with the basics, gradually incorporate advanced features, and watch your productivity soar!

**Remember**: The key to success is consistent daily use. Begin with simple tasks, build habits, and let the AI features guide your optimization journey.

Welcome to your new productivity powerhouse! 🎉`;

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, fullText]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' : 'bg-gradient-to-br from-white via-blue-50 to-purple-50'
      }`}>

      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 ${isDarkMode ? 'bg-gradient-to-br from-purple-400/20 to-blue-600/20' : 'bg-gradient-to-br from-purple-300/30 to-blue-500/30'
          } rounded-full blur-3xl animate-pulse`}></div>
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 ${isDarkMode ? 'bg-gradient-to-br from-blue-400/15 to-purple-600/15' : 'bg-gradient-to-br from-blue-300/25 to-purple-500/25'
          } rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 max-w-4xl mx-auto">

        {/* Header - Mobile optimized */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => window.history.back()}
            className={`p-2 sm:p-3 rounded-xl ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white/60 hover:bg-white/80'
              } transition-all duration-300 mr-3 sm:mr-4`}
          >
            <ArrowLeft className={`w-5 h-5 sm:w-6 sm:h-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
          </button>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className={`text-2xl sm:text-4xl font-black ${isDarkMode ? 'bg-gradient-to-r from-white via-purple-400 to-blue-400 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-gray-900 via-purple-600 to-blue-600 bg-clip-text text-transparent'
              }`}>
              How It Works
            </h1>
          </div>
        </div>

        {/* Content - Mobile optimized */}
        <div className={`rounded-2xl sm:rounded-3xl ${isDarkMode ? 'bg-white/5 border border-white/10 backdrop-blur-sm' : 'bg-white/70 border border-white/20 backdrop-blur-sm'
          } p-4 sm:p-6 shadow-xl sm:shadow-2xl`}>

          <div className={`prose prose-sm sm:prose-lg max-w-none ${isDarkMode ? 'prose-invert' : ''
            }`}>
            <pre className={`whitespace-pre-wrap font-sans leading-relaxed text-sm sm:text-base ${isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
              {displayedText}
              <span className="animate-pulse">|</span>
            </pre>
          </div>

          {/* Progress Indicator - Mobile optimized */}
          <div className="mt-6 sm:mt-8">
            <div className={`w-full bg-gray-200 ${isDarkMode ? 'dark:bg-gray-700' : ''} rounded-full h-1.5 sm:h-2`}>
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentIndex / fullText.length) * 100}%` }}
              ></div>
            </div>
            <p className={`text-xs sm:text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {Math.round((currentIndex / fullText.length) * 100)}% complete
            </p>
          </div>

        </div>

        {/* Quick Actions - Mobile optimized */}
        {currentIndex >= fullText.length && (
          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up">
            {[
              { name: 'Start Project', icon: Target, path: '/projects' },
              { name: 'Upload Files', icon: Zap, path: '/documents' },
              { name: 'View Dashboard', icon: CheckCircle, path: '/home' }
            ].map((action, index) => (
              <button
                key={action.name}
                onClick={() => window.location.href = action.path}
                className={`p-4 sm:p-6 rounded-2xl ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white/60 hover:bg-white/80'
                  } transition-all duration-300 hover:scale-105 group`}
              >
                <action.icon className={`w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4 mx-auto ${isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  } group-hover:scale-110 transition-transform duration-300`} />
                <h3 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                  {action.name}
                </h3>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default HowItWorksPage;