import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Brain, Send, Sparkles, Navigation, Zap, Search } from 'lucide-react';
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
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `Hey ${user?.name || 'there'}! 👋 I'm MELA AI - your comprehensive productivity assistant with full access to your entire app.

I can analyze everything across your workspace and help with:

🚀 **Full App Navigation** - "Take me to projects" or "Show me my documents"
📊 **Complete Analysis** - "What's my overall progress?" or "Analyze all my data"
✨ **Cross-Page Insights** - "Compare my projects and goals" or "What needs attention?"
💡 **Smart Recommendations** - "What should I prioritize?" or "Optimize my workflow"
🌐 **Internet Research** - I can search the web for accurate, up-to-date information

I have access to all your pages, data, and can move between sections. Just ask me anything - I'll provide comprehensive insights based on your entire workspace!`,
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Complete navigation system
  const navigationCommands = {
    'home': '/', 'dashboard': '/', 'main': '/',
    'projects': '/projects', 'project': '/projects',
    'goals': '/goals', 'goal': '/goals', 'objectives': '/goals',
    'documents': '/documents', 'files': '/documents', 'uploads': '/documents',
    'notepad': '/notepad', 'notes': '/notepad', 'editor': '/notepad',
    'reports': '/reports', 'analytics': '/reports', 'stats': '/reports',
    'inbox': '/inbox', 'messages': '/inbox', 'chat': '/inbox', 'team': '/inbox',
    'meetings': '/meetings', 'meeting': '/meetings', 'calendar': '/meetings',
    'settings': '/settings', 'preferences': '/settings', 'config': '/settings',
    'trash': '/trash', 'deleted': '/trash', 'recycle': '/trash'
  };

  // Get comprehensive app data for AI analysis
  const getAppData = () => {
    return {
      user: user,
      currentPath: window.location.pathname,
      availablePages: Object.keys(navigationCommands),
      pageContent: document.body.innerText,
      timestamp: new Date().toISOString()
    };
  };

  // Full App AI using backend service
  const processAIRequest = async (userMessage) => {
    const msg = userMessage.toLowerCase();

    // Check for navigation requests first
    for (const [key, path] of Object.entries(navigationCommands)) {
      if (msg.includes(key) && (msg.includes('go') || msg.includes('take') || msg.includes('show') || msg.includes('open') || msg.includes('navigate'))) {
        setTimeout(() => navigate(path), 2000);
        return `🚀 **Navigating to ${key.charAt(0).toUpperCase() + key.slice(1)}**\n\nTaking you there now. The page will load with all relevant tools and information.`;
      }
    }

    console.log('Sending Full App AI request:', userMessage);

    try {
      const appData = getAppData();
      const response = await askAppAI(userMessage, appData);
      return `${response}\n\n*Powered by MELA AI - Full App Analysis*`;
    } catch (error) {
      console.log('App AI error:', error);
      return `Hello! I'm MELA AI with full app access. I'm currently experiencing technical difficulties but I can still help with navigation and basic assistance. Please try again in a moment.\n\n*MELA AI - Connection Issue*`;
    }
  };

  // Fallback function - not used when backend is working
  const generateSmartResponse = (userMessage) => {
    return `Backend AI service unavailable. Please start the backend server.\n\n*Fallback Response*`;
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Professional AI processing
      const aiContent = await processAIRequest(currentMessage);

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
      setIsTyping(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' : 'bg-gradient-to-br from-white via-blue-50 to-purple-50'
      }`}>

      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 ${isDarkMode ? 'bg-gradient-to-br from-purple-400/20 to-blue-600/20' : 'bg-gradient-to-br from-purple-300/30 to-blue-500/30'
          } rounded-full blur-3xl animate-pulse`}></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 max-w-4xl mx-auto h-screen flex flex-col">

        {/* Header - Mobile optimized */}
        <div className="flex items-center mb-4 sm:mb-6">
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
            <div>
              <h1 className={`text-2xl sm:text-4xl font-black ${isDarkMode ? 'bg-gradient-to-r from-white via-purple-400 to-blue-400 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-gray-900 via-purple-600 to-blue-600 bg-clip-text text-transparent'
                }`}>
                AI Assistant
              </h1>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center space-x-1 sm:space-x-2`}>
                <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>MELA AI - Full App Analysis & Internet Search</span>
              </p>
            </div>
          </div>
        </div>

        {/* Chat Messages - Mobile optimized */}
        <div className={`flex-1 rounded-2xl sm:rounded-3xl ${isDarkMode ? 'bg-white/5 border border-white/10 backdrop-blur-sm' : 'bg-white/70 border border-white/20 backdrop-blur-sm'
          } p-3 sm:p-6 shadow-xl sm:shadow-2xl overflow-y-auto mb-4 sm:mb-6`}>

          <div className="space-y-4 sm:space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                <div className={`max-w-full sm:max-w-3xl p-3 sm:p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${msg.type === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : isDarkMode
                      ? 'bg-gray-800/80 text-gray-200 border border-gray-700/50'
                      : 'bg-white/90 text-gray-800 border border-gray-200/50 shadow-md'
                  }`}>
                  {msg.type === 'ai' && (
                    <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                      <div className="p-1 rounded-full bg-gradient-to-r from-purple-400 to-blue-500">
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                        MELA AI - Full App
                      </span>
                      {msg.content.includes('Taking you to') && (
                        <Navigation className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 animate-pulse" />
                      )}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{msg.content}</p>
                  <p className={`text-xs mt-2 sm:mt-3 opacity-60 flex items-center space-x-1`}>
                    <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.type === 'ai' && msg.content.includes('Taking you to') && (
                      <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400" />
                    )}
                  </p>
                </div>
              </div>
            ))}

            {(isLoading || isTyping) && (
              <div className="flex justify-start animate-fadeIn">
                <div className={`p-3 sm:p-4 rounded-2xl ${isDarkMode ? 'bg-gray-800/80 border border-gray-700/50' : 'bg-white/90 border border-gray-200/50'
                  }`}>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs sm:text-sm text-purple-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Professional Quick Actions - Hidden on mobile as requested */}
        <div className="hidden sm:flex flex-wrap gap-2 mb-3 sm:mb-4">
          {[
            'Analyze my entire workspace',
            'Navigate to projects',
            'What needs my attention?',
            'Compare all my progress',
            'Search latest productivity trends',
            'Optimize my workflow'
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setMessage(suggestion);
                setTimeout(handleSendMessage, 100);
              }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 hover:scale-105 ${isDarkMode
                  ? 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
                  : 'bg-white/60 text-gray-700 hover:bg-white/80 border border-gray-200/50'
                }`}
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Input Area - Mobile optimized */}
        <div className={`rounded-2xl ${isDarkMode ? 'bg-white/5 border border-white/10 backdrop-blur-sm' : 'bg-white/70 border border-white/20 backdrop-blur-sm'
          } p-3 sm:p-4 shadow-xl`}>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              placeholder="Ask me anything or request navigation..."
              className={`flex-1 p-3 sm:p-4 rounded-xl border-0 outline-none transition-all duration-300 focus:ring-2 focus:ring-purple-400/50 text-sm sm:text-base ${isDarkMode ? 'bg-gray-800 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-500'
                }`}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AIAssistantPage;