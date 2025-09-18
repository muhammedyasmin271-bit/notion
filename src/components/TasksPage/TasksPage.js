import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Plus, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const TasksPage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Sample task - implement user authentication', completed: false },
    { id: 2, text: 'Design database schema', completed: true },
    { id: 3, text: 'Create API endpoints', completed: false }
  ]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = () => {
    if (newTaskText.trim()) {
      setTasks([...tasks, {
        id: Date.now(),
        text: newTaskText.trim(),
        completed: false
      }]);
      setNewTaskText('');
      setShowAddTask(false);
    }
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const progressPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className={`${isDarkMode ? 'bg-black text-gray-100' : 'bg-white text-black'} min-h-screen font-sans`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Tasks</h1>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white/70 border-gray-200/50'} backdrop-blur-sm p-6 rounded-2xl border shadow-lg mb-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Progress</h2>
            <span className="text-sm text-gray-500">{completedCount}/{tasks.length} completed</span>
          </div>
          <div className={`w-full bg-gray-200 rounded-full h-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{Math.round(progressPercentage)}% complete</p>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white/70 border-gray-200/50'} backdrop-blur-sm p-6 rounded-2xl border shadow-lg`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Project Tasks</h2>
            <button 
              onClick={() => setShowAddTask(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
          
          {showAddTask && (
            <div className={`p-4 rounded-lg border mb-4 ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addTask();
                    if (e.key === 'Escape') { setShowAddTask(false); setNewTaskText(''); }
                  }}
                  placeholder="Enter task description..."
                  className={`flex-1 px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                  autoFocus
                />
                <button
                  onClick={addTask}
                  className={`px-4 py-2 rounded transition-colors ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
                >
                  Add
                </button>
                <button
                  onClick={() => { setShowAddTask(false); setNewTaskText(''); }}
                  className={`px-3 py-2 rounded transition-colors ${isDarkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-400 hover:bg-gray-500'} text-white`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="w-4 h-4" 
                  />
                  <span className={task.completed ? 'line-through text-gray-500' : ''}>
                    {task.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;