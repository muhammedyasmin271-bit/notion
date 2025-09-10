import React, { useState, useEffect } from 'react';
import {
  Flag, User, Calendar, Users, CheckCircle, Clock, AlertCircle, X,
  BarChart3, MessageSquare, Paperclip, Activity, Send, Plus,
  Target, TrendingUp, Award, FileText, Edit3, Save, ArrowLeft,
  Star, Zap, Timer, Eye, Heart, Share2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

const GoalDetailsPage = ({ goal, onClose, onUpdate, isManager, isNewGoal = false }) => {
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Enhanced goal data
  const [goalData, setGoalData] = useState({
    ...goal,
    progress: getProgressPercentage(goal.status),
    milestones: [
      { id: 1, title: 'Initial Planning', completed: true, date: '2024-01-15' },
      { id: 2, title: 'Resource Allocation', completed: true, date: '2024-01-20' },
      { id: 3, title: 'Implementation Phase', completed: false, date: '2024-02-01' },
      { id: 4, title: 'Review & Optimization', completed: false, date: '2024-02-15' }
    ],
    metrics: {
      timeSpent: '24h 30m',
      completionRate: getProgressPercentage(goal.status),
      daysRemaining: getDaysRemaining(goal.dueDate),
      priority: goal.priority || 'Medium'
    },
    team: [
      { id: 1, name: 'John Doe', role: 'Lead', avatar: 'JD', status: 'active' },
      { id: 2, name: 'Jane Smith', role: 'Developer', avatar: 'JS', status: 'active' },
      { id: 3, name: 'Mike Johnson', role: 'Designer', avatar: 'MJ', status: 'away' }
    ]
  });

  const [tasks, setTasks] = useState([
    { id: 1, text: 'Define success criteria', completed: true, assignee: 'John Doe', priority: 'High', dueDate: '2024-01-20' },
    { id: 2, text: 'Create action plan', completed: false, assignee: 'Jane Smith', priority: 'Medium', dueDate: '2024-01-25' },
    { id: 3, text: 'Set up tracking system', completed: false, assignee: 'Mike Johnson', priority: 'Low', dueDate: '2024-01-30' }
  ]);

  const [comments, setComments] = useState([
    { id: 1, text: 'This goal aligns perfectly with our Q1 objectives. Great work on the planning phase!', user: 'Manager', timestamp: new Date().toISOString(), reactions: ['👍', '🎯'] },
    { id: 2, text: 'I suggest we add more specific metrics to track our progress better.', user: 'John Doe', timestamp: new Date().toISOString(), reactions: ['💡'] }
  ]);

  const [activities, setActivities] = useState([
    { id: 1, user: 'John Doe', action: 'completed milestone "Initial Planning"', timestamp: new Date().toISOString(), type: 'milestone' },
    { id: 2, user: 'Jane Smith', action: 'added 3 new tasks', timestamp: new Date().toISOString(), type: 'task' },
    { id: 3, user: 'Manager', action: 'updated priority to High', timestamp: new Date().toISOString(), type: 'update' }
  ]);

  const [newComment, setNewComment] = useState('');
  const [newTask, setNewTask] = useState({ text: '', assignee: '', priority: 'Medium', dueDate: '' });
  const [showAddTask, setShowAddTask] = useState(false);
  const [showDescriptionMenu, setShowDescriptionMenu] = useState(false);
  const navigate = useNavigate();

  // Listen for selected users from user management page
  useEffect(() => {
    const selectedUsers = sessionStorage.getItem('selectedGoalUsers');
    if (selectedUsers) {
      // Use the new delimiter to split user names
      const updatedGoal = { ...goalData, forPerson: selectedUsers.replace(/; /g, ', ') };
      setGoalData(updatedGoal);
      onUpdate && onUpdate(updatedGoal);
      sessionStorage.removeItem('selectedGoalUsers');
    }
  }, []);

  function getProgressPercentage(status) {
    switch (status) {
      case 'Done': return 100;
      case 'In progress': return 60;
      case 'Not started': return 0;
      default: return 0;
    }
  }

  function getDaysRemaining(dueDate) {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  const handleFieldEdit = (field, value) => {
    setEditingField(field);
    setEditValue(value || '');
  };

  const handleFieldSave = (field) => {
    const updatedGoal = { ...goalData, [field]: editValue };
    setGoalData(updatedGoal);
    onUpdate && onUpdate(updatedGoal);
    setEditingField(null);
    setEditValue('');
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: Date.now(),
      text: newComment,
      user: user?.name || 'You',
      timestamp: new Date().toISOString(),
      reactions: []
    };
    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  const addTask = () => {
    if (!newTask.text.trim()) return;
    const task = {
      id: Date.now(),
      ...newTask,
      completed: false
    };
    setTasks(prev => [...prev, task]);
    setNewTask({ text: '', assignee: '', priority: 'Medium', dueDate: '' });
    setShowAddTask(false);
  };

  const toggleTask = (taskId) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return 'text-green-600 bg-green-100';
      case 'In progress': return 'text-blue-600 bg-blue-100';
      case 'Not started': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`flex-shrink-0 border-b backdrop-blur-sm ${isDarkMode ? 'bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 border-gray-700' : 'bg-gradient-to-r from-white/95 via-blue-50/95 to-white/95 border-gray-200'
        }`}>
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gradient-to-br from-blue-500/30 to-purple-500/30' : 'bg-gradient-to-br from-blue-100 to-purple-100'}`}>
                  <Target className={`w-8 h-8 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    {editingField === 'name' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className={`text-3xl font-bold bg-transparent border-b-2 focus:outline-none ${isDarkMode ? 'border-blue-400 text-white' : 'border-blue-500 text-gray-900'
                            }`}
                          onKeyPress={(e) => e.key === 'Enter' && handleFieldSave('name')}
                        />
                        <button onClick={() => handleFieldSave('name')} className="p-1 text-green-600">
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold">{goalData.name || (isNewGoal ? 'New Goal' : 'Untitled Goal')}</h1>
                        {isManager && (
                          <button
                            onClick={() => handleFieldEdit('name', goalData.name)}
                            className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                              }`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(goalData.status)}`}>
                      {goalData.status}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(goalData.priority)}`}>
                      {goalData.priority} Priority
                    </span>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Eye className="w-4 h-4" />
                      <span>Last viewed 2 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isNewGoal ? (
                <button
                  onClick={() => {
                    if (goalData.name.trim()) {
                      onUpdate && onUpdate(goalData);
                    }
                  }}
                  disabled={!goalData.name.trim()}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${goalData.name.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  Create Goal
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <button className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                      <Heart className="w-5 h-5" />
                    </button>
                    <button className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className={`h-8 w-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
                  <div className="flex items-center gap-2">

                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-8 pb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Overall Progress
            </span>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{goalData.progress}%</span>
          </div>
          <div className={`w-full h-4 rounded-full shadow-inner ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div
              className="h-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-700 shadow-lg"
              style={{ width: `${goalData.progress}%` }}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <nav className="flex space-x-8 px-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'milestones', label: 'Milestones', icon: Target },
              { id: 'tasks', label: 'Tasks', icon: CheckCircle, count: tasks.length },

              { id: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
              { id: 'files', label: 'Files', icon: Paperclip },
              { id: 'activity', label: 'Activity', icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                      ? (isDarkMode ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600')
                      : (isDarkMode ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700')
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                      }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8 pb-16">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Timer className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Time Spent</span>
                    </div>
                    <p className="text-2xl font-bold">{goalData.metrics.timeSpent}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Completion</span>
                    </div>
                    <p className="text-2xl font-bold">{goalData.metrics.completionRate}%</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Days Left</span>
                    </div>
                    <p className="text-2xl font-bold">{goalData.metrics.daysRemaining || 'N/A'}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Priority</span>
                    </div>
                    <p className="text-2xl font-bold">{goalData.priority}</p>
                  </div>
                </div>

                {/* Goal Description */}
                <div className={`p-8 rounded-3xl border-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                      <FileText className="w-6 h-6 text-blue-500" />
                      Description
                    </h3>
                    {isManager && (
                      <div className="relative">
                        <button
                          onClick={() => setShowDescriptionMenu(!showDescriptionMenu)}
                          className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                            }`}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        {showDescriptionMenu && (
                          <div className={`absolute right-0 top-12 w-64 rounded-xl border shadow-lg z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            }`}>
                            <div className="p-4">
                              <h4 className="font-semibold mb-3">Templates</h4>
                              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                                <button
                                  onClick={() => {
                                    const template = `## Goal Overview\n\n**Objective:** \n\n**Success Criteria:**\n- \n- \n\n**Key Milestones:**\n1. \n2. \n\n**Resources Needed:**\n- `;
                                    const updatedGoal = { ...goalData, description: template };
                                    setGoalData(updatedGoal);
                                    onUpdate && onUpdate(updatedGoal);
                                    setShowDescriptionMenu(false);
                                  }}
                                  className={`w-full text-left p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm ${isDarkMode ? 'hover:bg-blue-900/20 hover:text-blue-400' : ''
                                    }`}
                                >
                                  📋 Goal Template
                                </button>
                                <button
                                  onClick={() => {
                                    const template = `## Project Plan\n\n**Phase 1: Planning**\n- [ ] Define requirements\n- [ ] Set timeline\n\n**Phase 2: Execution**\n- [ ] Start development\n- [ ] Regular check-ins\n\n**Phase 3: Review**\n- [ ] Testing\n- [ ] Final review`;
                                    const updatedGoal = { ...goalData, description: template };
                                    setGoalData(updatedGoal);
                                    onUpdate && onUpdate(updatedGoal);
                                    setShowDescriptionMenu(false);
                                  }}
                                  className={`w-full text-left p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm ${isDarkMode ? 'hover:bg-blue-900/20 hover:text-blue-400' : ''
                                    }`}
                                >
                                  🚀 Project Template
                                </button>
                                <button
                                  onClick={() => {
                                    const template = `## Meeting Notes\n\n**Date:** ${new Date().toLocaleDateString()}\n**Attendees:** \n\n**Agenda:**\n1. \n2. \n\n**Discussion Points:**\n- \n\n**Action Items:**\n- [ ] \n- [ ] \n\n**Next Steps:**\n`;
                                    const updatedGoal = { ...goalData, description: template };
                                    setGoalData(updatedGoal);
                                    onUpdate && onUpdate(updatedGoal);
                                    setShowDescriptionMenu(false);
                                  }}
                                  className={`w-full text-left p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm ${isDarkMode ? 'hover:bg-blue-900/20 hover:text-blue-400' : ''
                                    }`}
                                >
                                  📝 Meeting Notes
                                </button>
                                <button
                                  onClick={() => {
                                    const template = `## SMART Goal\n\n**Specific:** What exactly will be accomplished?\n\n**Measurable:** How will progress be measured?\n\n**Achievable:** Is this goal realistic?\n\n**Relevant:** Why is this goal important?\n\n**Time-bound:** When will this be completed?\n\n**Success Metrics:**\n- \n- `;
                                    const updatedGoal = { ...goalData, description: template };
                                    setGoalData(updatedGoal);
                                    onUpdate && onUpdate(updatedGoal);
                                    setShowDescriptionMenu(false);
                                  }}
                                  className={`w-full text-left p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm ${isDarkMode ? 'hover:bg-blue-900/20 hover:text-blue-400' : ''
                                    }`}
                                >
                                  🎯 SMART Goal
                                </button>
                                <button
                                  onClick={() => {
                                    const template = `## Weekly Report\n\n**Week of:** ${new Date().toLocaleDateString()}\n\n**Accomplishments:**\n- \n- \n\n**Challenges:**\n- \n\n**Next Week's Focus:**\n- [ ] \n- [ ] \n\n**Metrics:**\n- Progress: %\n- Quality: /10`;
                                    const updatedGoal = { ...goalData, description: template };
                                    setGoalData(updatedGoal);
                                    onUpdate && onUpdate(updatedGoal);
                                    setShowDescriptionMenu(false);
                                  }}
                                  className={`w-full text-left p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm ${isDarkMode ? 'hover:bg-blue-900/20 hover:text-blue-400' : ''
                                    }`}
                                >
                                  📊 Weekly Report
                                </button>
                                <button
                                  onClick={() => {
                                    const template = `## Risk Assessment\n\n**High Risk Items:**\n- ⚠️ \n\n**Medium Risk Items:**\n- ⚡ \n\n**Low Risk Items:**\n- ✅ \n\n**Mitigation Strategies:**\n1. \n2. \n\n**Contingency Plans:**\n- `;
                                    const updatedGoal = { ...goalData, description: template };
                                    setGoalData(updatedGoal);
                                    onUpdate && onUpdate(updatedGoal);
                                    setShowDescriptionMenu(false);
                                  }}
                                  className={`w-full text-left p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm ${isDarkMode ? 'hover:bg-blue-900/20 hover:text-blue-400' : ''
                                    }`}
                                >
                                  ⚠️ Risk Assessment
                                </button>
                              </div>
                              <h4 className="font-semibold mb-3">Formatting</h4>
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => {
                                    const textarea = document.querySelector('textarea');
                                    const start = textarea.selectionStart;
                                    const end = textarea.selectionEnd;
                                    const text = goalData.description || '';
                                    const newText = text.substring(0, start) + '**Bold Text**' + text.substring(end);
                                    const updatedGoal = { ...goalData, description: newText };
                                    setGoalData(updatedGoal);
                                    onUpdate && onUpdate(updatedGoal);
                                  }}
                                  className={`p-2 rounded-lg hover:bg-gray-100 text-sm font-bold ${isDarkMode ? 'hover:bg-gray-700' : ''
                                    }`}
                                  title="Bold"
                                >
                                  B
                                </button>
                                <button
                                  onClick={() => {
                                    const textarea = document.querySelector('textarea');
                                    const start = textarea.selectionStart;
                                    const end = textarea.selectionEnd;
                                    const text = goalData.description || '';
                                    const newText = text.substring(0, start) + '*Italic Text*' + text.substring(end);
                                    const updatedGoal = { ...goalData, description: newText };
                                    setGoalData(updatedGoal);
                                    onUpdate && onUpdate(updatedGoal);
                                  }}
                                  className={`p-2 rounded-lg hover:bg-gray-100 text-sm italic ${isDarkMode ? 'hover:bg-gray-700' : ''
                                    }`}
                                  title="Italic"
                                >
                                  I
                                </button>
                                <button
                                  onClick={() => {
                                    const textarea = document.querySelector('textarea');
                                    const start = textarea.selectionStart;
                                    const text = goalData.description || '';
                                    const newText = text.substring(0, start) + '\n## Heading\n' + text.substring(start);
                                    const updatedGoal = { ...goalData, description: newText };
                                    setGoalData(updatedGoal);
                                    onUpdate && onUpdate(updatedGoal);
                                  }}
                                  className={`p-2 rounded-lg hover:bg-gray-100 text-sm ${isDarkMode ? 'hover:bg-gray-700' : ''
                                    }`}
                                  title="Heading"
                                >
                                  H1
                                </button>
                                <button
                                  onClick={() => {
                                    const textarea = document.querySelector('textarea');
                                    const start = textarea.selectionStart;
                                    const text = goalData.description || '';
                                    const newText = text.substring(0, start) + '\n### Subheading\n' + text.substring(start);
                                    const updatedGoal = { ...goalData, description: newText };
                                    setGoalData(updatedGoal);
                                    onUpdate && onUpdate(updatedGoal);
                                  }}
                                  className={`p-2 rounded-lg hover:bg-gray-100 text-sm ${isDarkMode ? 'hover:bg-gray-700' : ''
                                    }`}
                                  title="Subheading"
                                >
                                  H2
                                </button>
                                <button
                                  onClick={() => {
                                    const textarea = document.querySelector('textarea');
                                    const start = textarea.selectionStart;
                                    const text = goalData.description || '';
                                    const newText = text.substring(0, start) + '\n- List item\n' + text.substring(start);
                                    const updatedGoal = { ...goalData, description: newText };
                                    setGoalData(updatedGoal);
                                    onUpdate && onUpdate(updatedGoal);
                                  }}
                                  className={`p-2 rounded-lg hover:bg-gray-100 text-sm ${isDarkMode ? 'hover:bg-gray-700' : ''
                                    }`}
                                  title="Bullet List"
                                >
                                  •
                                </button>
                                <button
                                  onClick={() => {
                                    const textarea = document.querySelector('textarea');
                                    const start = textarea.selectionStart;
                                    const text = goalData.description || '';
                                    const newText = text.substring(0, start) + '\n1. Numbered item\n' + text.substring(start);
                                    const updatedGoal = { ...goalData, description: newText };
                                    setGoalData(updatedGoal);
                                    onUpdate && onUpdate(updatedGoal);
                                  }}
                                  className={`p-2 rounded-lg hover:bg-gray-100 text-sm ${isDarkMode ? 'hover:bg-gray-700' : ''
                                    }`}
                                  title="Numbered List"
                                >
                                  1.
                                </button>
                                <button
                                  onClick={() => {
                                    const textarea = document.querySelector('textarea');
                                    const start = textarea.selectionStart;
                                    const text = goalData.description || '';
                                    const newText = text.substring(0, start) + '\n- [ ] Task\n' + text.substring(start);
                                    const updatedGoal = { ...goalData, description: newText };
                                    setGoalData(updatedGoal);
                                    onUpdate && onUpdate(updatedGoal);
                                  }}
                                  className={`p-2 rounded-lg hover:bg-gray-100 text-sm ${isDarkMode ? 'hover:bg-gray-700' : ''
                                    }`}
                                  title="Checkbox"
                                >
                                  ☐
                                </button>
                                <button
                                  onClick={() => {
                                    const textarea = document.querySelector('textarea');
                                    const start = textarea.selectionStart;
                                    const text = goalData.description || '';
                                    const newText = text.substring(0, start) + '\n> Quote or important note\n' + text.substring(start);
                                    const updatedGoal = { ...goalData, description: newText };
                                    setGoalData(updatedGoal);
                                    onUpdate && onUpdate(updatedGoal);
                                  }}
                                  className={`p-2 rounded-lg hover:bg-gray-100 text-sm ${isDarkMode ? 'hover:bg-gray-700' : ''
                                    }`}
                                  title="Quote"
                                >
                                  "
                                </button>
                                <button
                                  onClick={() => {
                                    const textarea = document.querySelector('textarea');
                                    const start = textarea.selectionStart;
                                    const text = goalData.description || '';
                                    const newText = text.substring(0, start) + '\n---\n' + text.substring(start);
                                    const updatedGoal = { ...goalData, description: newText };
                                    setGoalData(updatedGoal);
                                    onUpdate && onUpdate(updatedGoal);
                                  }}
                                  className={`p-2 rounded-lg hover:bg-gray-100 text-sm ${isDarkMode ? 'hover:bg-gray-700' : ''
                                    }`}
                                  title="Divider"
                                >
                                  ─
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {isManager ? (
                    <textarea
                      value={goalData.description || ''}
                      onChange={(e) => {
                        const updatedGoal = { ...goalData, description: e.target.value };
                        setGoalData(updatedGoal);
                        onUpdate && onUpdate(updatedGoal);
                      }}
                      placeholder="Describe the goal objectives, success criteria, key milestones, and any important details..."
                      rows={10}
                      className={`w-full p-6 rounded-2xl border-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg leading-relaxed transition-all duration-200 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                        }`}
                      style={{ fontFamily: 'Inter, system-ui, sans-serif', minHeight: '200px' }}
                    />
                  ) : (
                    <div className={`p-6 rounded-2xl border-2 min-h-[200px] ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50/50 border-gray-200'
                      }`}>
                      {goalData.description ? (
                        <p className={`text-lg leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                          {goalData.description}
                        </p>
                      ) : (
                        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">No description provided yet.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>


              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Goal Info */}
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className="text-lg font-semibold mb-4">Goal Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Owner</label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {goalData.owner?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="font-medium">{goalData.owner?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Due Date</label>
                      {isManager ? (
                        <input
                          type="date"
                          value={goalData.dueDate ? String(goalData.dueDate).slice(0, 10) : ''}
                          onChange={(e) => {
                            const updatedGoal = { ...goalData, dueDate: e.target.value };
                            setGoalData(updatedGoal);
                            onUpdate && onUpdate(updatedGoal);
                          }}
                          className={`w-full mt-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                            }`}
                        />
                      ) : (
                        <p className="font-medium mt-1">{goalData.dueDate ? new Date(goalData.dueDate).toLocaleDateString() : 'No due date'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Priority</label>
                      {isManager ? (
                        <select
                          value={goalData.priority || 'Medium'}
                          onChange={(e) => {
                            const updatedGoal = { ...goalData, priority: e.target.value };
                            setGoalData(updatedGoal);
                            onUpdate && onUpdate(updatedGoal);
                          }}
                          className={`w-full mt-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                            }`}
                        >
                          <option value="High">🔴 High Priority</option>
                          <option value="Medium">🟡 Medium Priority</option>
                          <option value="Low">🟢 Low Priority</option>
                        </select>
                      ) : (
                        <p className="font-medium mt-1">{goalData.priority || 'Medium'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <select
                        value={goalData.status || 'Not started'}
                        onChange={(e) => {
                          const updatedGoal = { ...goalData, status: e.target.value };
                          setGoalData(updatedGoal);
                          onUpdate && onUpdate(updatedGoal);
                        }}
                        className={`w-full mt-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                          }`}
                      >
                        <option value="Not started">⏸️ Not Started</option>
                        <option value="In progress">▶️ In Progress</option>
                        <option value="Done">✅ Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <p className="font-medium mt-1">{new Date(goalData.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assigned To</label>
                      {isManager ? (
                        <div className="flex gap-2 mt-1">
                          <input
                            type="text"
                            value={goalData.forPerson || ''}
                            onChange={(e) => {
                              const updatedGoal = { ...goalData, forPerson: e.target.value };
                              setGoalData(updatedGoal);
                              onUpdate && onUpdate(updatedGoal);
                            }}
                            placeholder="Team or person"
                            className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'
                              }`}
                          />
                          <button
                            onClick={() => {
                              // Store current goal data in sessionStorage for return
                              sessionStorage.setItem('goalPickerReturn', JSON.stringify({
                                type: 'goal',
                                id: goalData.id,
                                currentAssignment: goalData.forPerson || ''
                              }));
                              navigate('/users?picker=1');
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Pick
                          </button>
                        </div>
                      ) : (
                        <p className="font-medium mt-1">{goalData.forPerson || 'Not assigned'}</p>
                      )}
                    </div>
                  </div>
                </div>



                {/* Quick Actions */}
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full p-3 text-left rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Milestone
                    </button>
                    <button className="w-full p-3 text-left rounded-lg hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Add Task
                    </button>

                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Milestones</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Add Milestone
                </button>
              </div>

              <div className="space-y-4">
                {goalData.milestones.map((milestone, index) => (
                  <div key={milestone.id} className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${milestone.completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                        {milestone.completed ? <CheckCircle className="w-5 h-5" /> : <span className="font-bold">{index + 1}</span>}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${milestone.completed ? 'line-through opacity-75' : ''}`}>
                          {milestone.title}
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Due: {new Date(milestone.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${milestone.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {milestone.completed ? 'Completed' : 'Pending'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Tasks</h2>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>

              {showAddTask && (
                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Task description"
                      value={newTask.text}
                      onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
                      className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <select
                        value={newTask.assignee}
                        onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                        className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                      >
                        <option value="">Select assignee</option>
                        {goalData.team.map(member => (
                          <option key={member.id} value={member.name}>{member.name}</option>
                        ))}
                      </select>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                        className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                      >
                        <option value="High">High Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="Low">Low Priority</option>
                      </select>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={addTask}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add Task
                      </button>
                      <button
                        onClick={() => setShowAddTask(false)}
                        className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                          }`}
                      >
                        {task.completed && <CheckCircle className="w-4 h-4" />}
                      </button>
                      <div className="flex-1">
                        <p className={`font-medium ${task.completed ? 'line-through opacity-75' : ''}`}>
                          {task.text}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Assigned to: {task.assignee || 'Unassigned'}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {activeTab === 'comments' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Comments</h2>

              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {user?.name?.charAt(0) || 'Y'}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className={`w-full p-4 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                        }`}
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={addComment}
                        disabled={!newComment.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-bold">
                        {comment.user.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{comment.user}</span>
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{comment.text}</p>
                        {comment.reactions && comment.reactions.length > 0 && (
                          <div className="flex gap-1 mt-3">
                            {comment.reactions.map((reaction, index) => (
                              <span key={index} className="text-lg">{reaction}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Files & Attachments</h2>
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                  <Paperclip className="w-4 h-4" />
                  Upload File
                  <input type="file" className="hidden" />
                </label>
              </div>

              <div className="text-center py-12">
                <Paperclip className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No files uploaded yet</h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Upload documents, images, or other files related to this goal
                </p>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Activity Timeline</h2>

              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'milestone' ? 'bg-green-100 text-green-600' :
                          activity.type === 'task' ? 'bg-blue-100 text-blue-600' :
                            'bg-purple-100 text-purple-600'
                        }`}>
                        {activity.type === 'milestone' ? <Target className="w-5 h-5" /> :
                          activity.type === 'task' ? <CheckCircle className="w-5 h-5" /> :
                            <Zap className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <span className="font-semibold">{activity.user}</span> {activity.action}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default GoalDetailsPage;