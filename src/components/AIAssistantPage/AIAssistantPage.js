import React, { useState } from 'react';
import { ArrowLeft, Brain, Send, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';

const AIAssistantPage = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `Hello ${user?.name || 'there'}! I'm your AI assistant. I can help you with:

• Project management and planning
• Task organization and prioritization  
• Document analysis and summaries
• Meeting notes and action items
• Productivity tips and workflows
• Data insights and reporting

What would you like assistance with today?`,
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateAIResponse(message),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (userMessage) => {
    const responses = {
      project: "I can help you create and manage projects effectively. Would you like me to suggest a project structure, help with task breakdown, or provide timeline recommendations?",
      task: "For task management, I recommend prioritizing by impact and urgency. Would you like me to help organize your current tasks or create a productivity workflow?",
      document: "I can assist with document organization, analysis, and summaries. What type of documents are you working with?",
      meeting: "I can help you prepare meeting agendas, take structured notes, and track action items. What kind of meeting support do you need?",
      report: "I can help generate insights from your data and create comprehensive reports. What metrics or areas would you like to analyze?",
      default: "I understand you're looking for assistance. Could you provide more details about what you'd like help with? I'm here to support your productivity and project management needs."
    };

    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('project')) return responses.project;
    if (lowerMessage.includes('task')) return responses.task;
    if (lowerMessage.includes('document')) return responses.document;
    if (lowerMessage.includes('meeting')) return responses.meeting;
    if (lowerMessage.includes('report')) return responses.report;
    return responses.default;
  };

  return (
    <div className={`min-h-screen ${
      isDarkMode ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' : 'bg-gradient-to-br from-white via-blue-50 to-purple-50'
    }`}>
      
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 ${
          isDarkMode ? 'bg-gradient-to-br from-purple-400/20 to-blue-600/20' : 'bg-gradient-to-br from-purple-300/30 to-blue-500/30'
        } rounded-full blur-3xl animate-pulse`}></div>
      </div>

      <div className="relative z-10 p-8 max-w-4xl mx-auto h-screen flex flex-col">
        
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={() => window.history.back()}
            className={`p-3 rounded-xl ${
              isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white/60 hover:bg-white/80'
            } transition-all duration-300 mr-4`}
          >
            <ArrowLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
          </button>
          <div className="flex items-center space-x-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-black ${
                isDarkMode ? 'bg-gradient-to-r from-white via-purple-400 to-blue-400 bg-clip-text text-transparent'
                           : 'bg-gradient-to-r from-gray-900 via-purple-600 to-blue-600 bg-clip-text text-transparent'
              }`}>
                AI Assistant
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your intelligent productivity companion
              </p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className={`flex-1 rounded-3xl ${
          isDarkMode ? 'bg-white/5 border border-white/10 backdrop-blur-sm' : 'bg-white/70 border border-white/20 backdrop-blur-sm'
        } p-6 shadow-2xl overflow-y-auto mb-6`}>
          
          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl p-4 rounded-2xl ${
                  msg.type === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : isDarkMode 
                    ? 'bg-gray-800 text-gray-200' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {msg.type === 'ai' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-400">AI Assistant</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-2 opacity-60`}>
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className={`p-4 rounded-2xl ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className={`rounded-2xl ${
          isDarkMode ? 'bg-white/5 border border-white/10 backdrop-blur-sm' : 'bg-white/70 border border-white/20 backdrop-blur-sm'
        } p-4 shadow-xl`}>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything about your projects, tasks, or productivity..."
              className={`flex-1 p-4 rounded-xl border-0 outline-none ${
                isDarkMode ? 'bg-gray-800 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-500'
              }`}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIAssistantPage;