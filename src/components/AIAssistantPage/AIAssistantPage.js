import React, { useState, useRef, useEffect } from 'react';
import { Brain, Send, Sparkles, Zap, Lightbulb, Globe, Code, ArrowRight, FileText } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { askAppAI } from '../../services/aiService';
import './AIAssistant.css';

const AIAssistantPage = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Suggestion chips for welcome screen
  const suggestions = [
    { text: 'How do I create a report?', icon: FileText },
    { text: 'What can you help me with?', icon: Lightbulb },
    { text: 'Explain the latest AI trends', icon: Globe },
    { text: 'Help me navigate the app', icon: ArrowRight },
  ];

  // Navigation commands
  const navigationCommands = {
    'home': '/', 'dashboard': '/', 'main': '/',
    'projects': '/projects', 'project': '/projects',
    'goals': '/goals', 'goal': '/goals',
    'documents': '/documents', 'files': '/documents',
    'notepad': '/notepad', 'notes': '/notepad',
    'reports': '/reports', 'analytics': '/reports',
    'meetings': '/meeting-notes', 'meeting': '/meeting-notes',
    'settings': '/settings'
  };

  const getAppData = async () => {
    const token = localStorage.getItem('token');
    const appData = {
      user: user,
      currentPath: window.location.pathname,
      availablePages: Object.keys(navigationCommands),
      pageContent: document.body.innerText,
      timestamp: new Date().toISOString()
    };

    // Fetch real app data if token is available
    if (token) {
      try {
        // Fetch projects with full details and their tasks
        try {
          const projectsResponse = await fetch('http://localhost:9000/api/projects', {
            headers: { 'x-auth-token': token }
          });
          if (projectsResponse.ok) {
            const projects = await projectsResponse.json();
            
            // Fetch detailed information for each project
            const projectsWithDetails = await Promise.all(
              projects.map(async (p) => {
                const projectId = p._id || p.id;
                try {
                  const detailResponse = await fetch(`http://localhost:9000/api/projects/${projectId}`, {
                    headers: { 'x-auth-token': token }
                  });
                  if (detailResponse.ok) {
                    const details = await detailResponse.json();
                    return {
                      id: projectId,
                      name: p.name || p.title,
                      status: p.status,
                      owner: p.owner?.name || p.owner,
                      createdAt: p.createdAt,
                      description: details.description || details.content,
                      goal: details.goal,
                      notes: details.notes,
                      assignedTo: details.assignedTo,
                      viewers: details.viewers,
                      priority: details.priority
                    };
                  }
                } catch (e) {
                  console.error(`Error fetching details for project ${projectId}:`, e);
                }
                return {
                  id: projectId,
                  name: p.name || p.title,
                  status: p.status,
                  owner: p.owner?.name || p.owner,
                  createdAt: p.createdAt
                };
              })
            );

            appData.projects = {
              count: projects.length,
              list: projectsWithDetails
            };

            // Fetch tasks from all projects
            const allTasks = [];
            for (const project of projects) {
              try {
                const projectId = project._id || project.id;
                const tasksResponse = await fetch(`http://localhost:9000/api/projects/${projectId}/data`, {
                  headers: { 'x-auth-token': token }
                });
                if (tasksResponse.ok) {
                  const projectData = await tasksResponse.json();
                  const tasks = projectData.tasks || [];
                  tasks.forEach(task => {
                    // Tasks use 'text' field for the task content/description
                    // 'completed' field indicates status
                    const taskText = task.text || task.title || task.name || task.description || '';
                    const taskStatus = task.completed ? 'Done' : (task.status || 'Not started');
                    
                    allTasks.push({
                      id: task._id || task.id,
                      title: taskText,
                      text: taskText, // The actual task content
                      description: taskText, // Alias for description
                      status: taskStatus,
                      completed: task.completed || false,
                      priority: task.priority || 'medium',
                      projectId: projectId,
                      projectName: project.name || project.title,
                      createdBy: task.createdBy?.name || task.createdBy,
                      createdAt: task.createdAt,
                      updatedAt: task.updatedAt,
                      dueDate: task.dueDate,
                      comments: task.comments || []
                    });
                  });
                }
              } catch (e) {
                console.error(`Error fetching tasks for project ${project._id || project.id}:`, e);
              }
            }

            appData.tasks = {
              count: allTasks.length,
              list: allTasks,
              byStatus: {
                'Not started': allTasks.filter(t => t.status === 'Not started' || !t.status).length,
                'In Progress': allTasks.filter(t => t.status === 'In Progress').length,
                'Done': allTasks.filter(t => t.status === 'Done').length
              },
              byProject: projects.map(p => ({
                projectId: p._id || p.id,
                projectName: p.name || p.title,
                taskCount: allTasks.filter(t => (t.projectId === (p._id || p.id))).length
              }))
            };
          }
        } catch (e) {
          console.error('Error fetching projects:', e);
        }

        // Fetch documents with full details
        try {
          const documentsResponse = await fetch('http://localhost:9000/api/documents', {
            headers: { 'x-auth-token': token }
          });
          if (documentsResponse.ok) {
            const documents = await documentsResponse.json();
            appData.documents = {
              count: documents.length,
              list: documents.map(d => ({
                id: d._id || d.id,
                title: d.title,
                type: d.type,
                content: d.content || d.blocks,
                description: d.description,
                author: d.author?.name || d.author,
                sharedWith: d.sharedWith,
                createdAt: d.createdAt,
                updatedAt: d.updatedAt
              }))
            };
          }
        } catch (e) {
          console.error('Error fetching documents:', e);
        }

        // Fetch reports with full details including notes and content
        try {
          const reportsResponse = await fetch('http://localhost:9000/api/reports', {
            headers: { 'x-auth-token': token }
          });
          if (reportsResponse.ok) {
            const reportsData = await reportsResponse.json();
            const reports = reportsData.reports || reportsData || [];
            
            // Fetch detailed information for each report
            const reportsWithDetails = await Promise.all(
              reports.map(async (r) => {
                const reportId = r._id || r.id;
                try {
                  const detailResponse = await fetch(`http://localhost:9000/api/reports/${reportId}`, {
                    headers: { 'x-auth-token': token }
                  });
                  if (detailResponse.ok) {
                    const detailData = await detailResponse.json();
                    const report = detailData.report || detailData;
                    return {
                      id: reportId,
                      title: r.title || report.title,
                      status: r.status || report.status,
                      createdAt: r.createdAt || report.createdAt,
                      blocks: report.blocks || [],
                      content: report.content,
                      notes: report.notes,
                      owner: report.owner?.name || report.owner,
                      sharedWith: report.sharedWith
                    };
                  }
                } catch (e) {
                  console.error(`Error fetching details for report ${reportId}:`, e);
                }
                return {
                  id: reportId,
                  title: r.title,
                  status: r.status,
                  createdAt: r.createdAt
                };
              })
            );

            appData.reports = {
              count: reportsWithDetails.length,
              list: reportsWithDetails
            };
          }
        } catch (e) {
          console.error('Error fetching reports:', e);
        }

        // Fetch goals
        try {
          const goalsResponse = await fetch('http://localhost:9000/api/goals', {
            headers: { 'x-auth-token': token }
          });
          if (goalsResponse.ok) {
            const goals = await goalsResponse.json();
            appData.goals = {
              count: goals.length,
              list: goals.map(g => ({
                id: g._id || g.id,
                title: g.title || g.name,
                status: g.status,
                createdAt: g.createdAt
              }))
            };
          }
        } catch (e) {
          console.error('Error fetching goals:', e);
        }

        // Fetch meeting notes with full content
        try {
          const meetingsResponse = await fetch('http://localhost:9000/api/meetings', {
            headers: { 'x-auth-token': token }
          });
          if (meetingsResponse.ok) {
            const meetings = await meetingsResponse.json();
            
            // Fetch detailed information for each meeting
            const meetingsWithDetails = await Promise.all(
              meetings.map(async (m) => {
                const meetingId = m._id || m.id;
                try {
                  const detailResponse = await fetch(`http://localhost:9000/api/meetings/${meetingId}`, {
                    headers: { 'x-auth-token': token }
                  });
                  if (detailResponse.ok) {
                    const details = await detailResponse.json();
                    return {
                      id: meetingId,
                      title: m.title || details.title,
                      date: details.date || m.date,
                      notes: details.notes || m.notes,
                      summary: details.summary || m.summary,
                      blocks: details.blocks || [],
                      type: details.type || m.type,
                      status: details.status || m.status,
                      participants: details.sharedWith || m.sharedWith,
                      project: details.project,
                      createdAt: m.createdAt || details.createdAt
                    };
                  }
                } catch (e) {
                  console.error(`Error fetching details for meeting ${meetingId}:`, e);
                }
                return {
                  id: meetingId,
                  title: m.title,
                  createdAt: m.createdAt
                };
              })
            );

            appData.meetings = {
              count: meetingsWithDetails.length,
              list: meetingsWithDetails
            };
          }
        } catch (e) {
          console.error('Error fetching meetings:', e);
        }

        // Fetch notepad notes with full content
        try {
          const notepadResponse = await fetch('http://localhost:9000/api/notepad', {
            headers: { 'x-auth-token': token }
          });
          if (notepadResponse.ok) {
            const notes = await notepadResponse.json();
            appData.notepadNotes = {
              count: notes.length,
              list: notes.map(n => ({
                id: n._id || n.id,
                title: n.title,
                content: n.content,
                category: n.category,
                tags: n.tags || [],
                isPinned: n.isPinned,
                isArchived: n.isArchived,
                author: n.author?.name || n.createdByName || n.author,
                sharedWith: n.sharedWith,
                createdAt: n.createdAt,
                updatedAt: n.updatedAt
              }))
            };
          }
        } catch (e) {
          console.error('Error fetching notepad notes:', e);
        }
      } catch (error) {
        console.error('Error fetching app data:', error);
      }
    }

    return appData;
  };

  // Simple markdown renderer
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    // Split by double newlines for paragraphs
    const paragraphs = text.split('\n\n');
    
    return paragraphs.map((para, idx) => {
      // Handle bold text **text**
      para = para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Handle italic text *text*
      para = para.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Handle code `code`
      para = para.replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');
      // Handle links [text](url)
      para = para.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-link">$1</a>');
      
      // Check if it's a heading
      if (para.startsWith('#')) {
        const level = para.match(/^#+/)[0].length;
        const content = para.replace(/^#+\s*/, '');
        return React.createElement(`h${Math.min(level, 6)}`, { 
          key: idx, 
          className: `markdown-heading markdown-h${level}` 
        }, <span dangerouslySetInnerHTML={{ __html: content }} />);
      }
      
      // Check if it's a list item
      if (para.trim().startsWith('- ') || para.trim().startsWith('* ')) {
        const items = para.split(/\n(?=-|\*)/).filter(item => item.trim());
        return (
          <ul key={idx} className="markdown-list">
            {items.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: item.replace(/^[-*]\s*/, '') }} />
            ))}
          </ul>
        );
      }
      
      return (
        <p key={idx} className="markdown-paragraph" dangerouslySetInnerHTML={{ __html: para }} />
      );
    });
  };

  const processAIRequest = async (userMessage) => {
    const msg = userMessage.toLowerCase().trim();

    // Check for simple greetings - return friendly response without fetching app data
    const simpleGreetings = ['hi', 'hello', 'hey', 'hey there', 'hi there', 'greetings', 'good morning', 'good afternoon', 'good evening', 'howdy', 'sup', 'what\'s up', 'yo'];
    const isSimpleGreeting = simpleGreetings.some(greeting => {
      const trimmedMsg = msg.replace(/[^\w\s]/g, '').trim();
      return trimmedMsg === greeting || trimmedMsg.startsWith(greeting + ' ') || trimmedMsg === greeting.replace(/\s+/g, '');
    });

    if (isSimpleGreeting) {
      const userName = user?.name || user?.username || 'there';
      const greetings = [
        `Hi ${userName}! 👋\n\nHow can I help you today?`,
        `Hello ${userName}! 👋\n\nWhat can I assist you with?`,
        `Hey ${userName}! 👋\n\nHow can I help you today?`,
        `Hi there, ${userName}! 👋\n\nWhat would you like to know?`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Check for navigation requests
    for (const [key, path] of Object.entries(navigationCommands)) {
      if (msg.includes(key) && (msg.includes('go') || msg.includes('take') || msg.includes('show') || msg.includes('open') || msg.includes('navigate'))) {
        setTimeout(() => navigate(path), 2000);
        const displayName = (key === 'home' || key === 'dashboard' || key === 'main') ? 'MELA AI' : key.charAt(0).toUpperCase() + key.slice(1);
        return `🚀 **Navigating to ${displayName}**\n\nTaking you there now.`;
      }
    }

    // For other queries, fetch app data and get detailed response
    try {
      const appData = await getAppData();
      const response = await askAppAI(userMessage, appData);
      return response;
    } catch (error) {
      console.log('App AI error:', error);
      return `Hello! I'm MELA AI with full app access. I'm currently experiencing technical difficulties but I can still help with navigation and basic assistance. Please try again in a moment.`;
    }
  };

  const handleSendMessage = async (msg = null) => {
    const messageToSend = msg || message;
    if (!messageToSend.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const aiContent = await processAIRequest(messageToSend);
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${isDarkMode ? 'bg-[#141414]' : 'bg-gradient-to-br from-gray-50 via-white to-blue-50'}`}>
      {/* Main Content Area - Account for navbar */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 md:px-6 pb-32 sm:pb-36 pt-20 sm:pt-24 lg:pt-6 lg:pl-64">
        {messages.length === 0 ? (
          /* Beautiful Welcome Screen */
          <div className="text-center max-w-4xl mx-auto animate-fadeIn w-full px-2 lg:-ml-32">
            {/* Animated AI Icon */}
            <div className="mb-6 sm:mb-8 flex justify-center">
              <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                <Brain className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600" />
              </div>
            </div>

            {/* Welcome Text */}
            <h1 className={`text-3xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-r ${isDarkMode ? 'from-purple-400 via-blue-400 to-purple-400' : 'from-purple-600 via-blue-600 to-purple-600'} bg-clip-text text-transparent`}>
              MELA AI
            </h1>
            <p className={`text-lg sm:text-xl md:text-2xl mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Your Intelligent Assistant
            </p>
            <p className={`text-sm sm:text-base md:text-lg mb-4 px-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Ask me anything about this app, or get help with general questions
            </p>
            <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-8 sm:mb-12 ${isDarkMode ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-purple-100 border border-purple-200'}`}>
              <Sparkles className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                Powered by GPT-4o with Advanced Reasoning
              </span>
            </div>

            {/* Suggestion Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 max-w-2xl mx-auto">
              {suggestions.map((suggestion, idx) => {
                const Icon = suggestion.icon || Sparkles;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className={`group flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                      isDarkMode
                        ? 'bg-gray-800/50 border-gray-700 hover:border-purple-500 hover:bg-gray-800 text-gray-200'
                        : 'bg-white border-gray-200 hover:border-purple-400 hover:bg-purple-50 text-gray-800'
                    }`}
                  >
                    <div className={`p-1.5 sm:p-2 rounded-lg ${isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="flex-1 text-left text-sm sm:text-base font-medium">{suggestion.text}</span>
                    <ArrowRight className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </button>
                );
              })}
            </div>

            {/* Features */}
            <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
              {[
                { icon: Globe, title: 'World Knowledge', desc: 'Real-time information & current events' },
                { icon: Code, title: 'App Expert', desc: 'Advanced reasoning for app features' },
                { icon: Zap, title: 'Smart Responses', desc: 'Context-aware with conversation memory' }
              ].map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all duration-300 ${
                      isDarkMode
                        ? 'bg-gray-800/30 border-gray-700 hover:border-purple-500'
                        : 'bg-white/80 border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${
                      isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                    }`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className={`text-sm sm:text-base font-semibold mb-1 sm:mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {feature.title}
                    </h3>
                    <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {feature.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="w-full max-w-4xl space-y-4 sm:space-y-6 py-4 sm:py-8 px-2 sm:px-0">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className={`flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar - Hidden on mobile, shown on desktop */}
                  {msg.type === 'ai' && (
                    <div className={`hidden sm:flex flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full items-center justify-center ${
                      isDarkMode ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-blue-500'
                    } shadow-lg`}>
                      <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  )}
                  
                  {/* Message Bubble */}
                  <div
                    className={`rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 shadow-sm ${
                      msg.type === 'user'
                        ? isDarkMode 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-gray-100 text-gray-900'
                        : isDarkMode 
                          ? 'bg-gray-800 text-gray-100' 
                          : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    {msg.type === 'ai' && (
                      <div className="hidden sm:flex items-center gap-2 mb-1.5 sm:mb-2 pb-1.5 sm:pb-2 border-b border-gray-700/50">
                        <span className={`text-xs font-semibold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                          MELA AI
                        </span>
                        <div className="flex gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-green-400' : 'bg-green-500'} animate-pulse`}></div>
                        </div>
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none text-sm sm:text-base whitespace-pre-wrap break-words">
                      {renderMarkdown(msg.content)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex gap-2 sm:gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-blue-500'
                  } shadow-lg`}>
                    <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
                  </div>
                  <div className={`rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2.5 sm:py-4 shadow-lg ${
                    isDarkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white border border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-purple-400' : 'bg-purple-500'}`} style={{ animationDelay: '0s' }}></div>
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-purple-400' : 'bg-purple-500'}`} style={{ animationDelay: '0.2s' }}></div>
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-purple-400' : 'bg-purple-500'}`} style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>MELA AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Input Bar - Fixed */}
      <div className={`fixed bottom-0 left-0 right-0 border-t backdrop-blur-xl p-3 sm:p-4 transition-colors z-[60] lg:left-64 ${
        isDarkMode 
          ? 'bg-[#141414] border-gray-700/50' 
          : 'bg-white border-gray-200/50'
      }`}>
        <div className="max-w-4xl mx-auto">
          <div className={`relative flex items-center rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 border-2 transition-all duration-300 shadow-lg ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700 focus-within:border-purple-500 focus-within:shadow-purple-500/20' 
              : 'bg-white border-gray-300 focus-within:border-purple-400 focus-within:shadow-purple-400/20'
          }`}>
            {/* Input Field */}
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              placeholder="Ask MELA AI anything..."
              className={`flex-1 outline-none text-base sm:text-base bg-transparent min-h-[44px] ${
                isDarkMode 
                  ? 'text-white placeholder-gray-500' 
                  : 'text-gray-900 placeholder-gray-400'
              }`}
            />

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!message.trim() || isLoading}
              className={`ml-3 w-12 h-12 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-110 active:scale-95 flex-shrink-0 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/30' 
                  : 'bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/30'
              }`}
            >
              <Send className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
