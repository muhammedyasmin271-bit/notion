import React, { useState, useEffect } from 'react';
import { 
  Trash2, RotateCcw, Search, FileText, FolderOpen, 
  Calendar, Target, File, AlertTriangle, CheckCircle2,
  Clock, X, RefreshCw
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

const TrashPage = () => {
  const { user } = useAppContext();
  const { isDarkMode } = useTheme();
  const [deletedItems, setDeletedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    loadDeletedItems();
  }, []);

  const loadDeletedItems = () => {
    const projects = JSON.parse(localStorage.getItem('deletedProjects') || '[]');
    const notes = JSON.parse(localStorage.getItem('deletedNotes') || '[]');
    const meetingNotes = JSON.parse(localStorage.getItem('deletedMeetingNotes') || '[]');
    const documents = JSON.parse(localStorage.getItem('deletedDocuments') || '[]');
    const goals = JSON.parse(localStorage.getItem('deletedGoals') || '[]');
    
    const allItems = [
      ...projects.map(item => ({ ...item, type: 'project', deletedAt: item.deletedAt || new Date().toISOString() })),
      ...notes.map(item => ({ ...item, type: 'note', deletedAt: item.deletedAt || new Date().toISOString() })),
      ...meetingNotes.map(item => ({ ...item, type: 'meeting', deletedAt: item.deletedAt || new Date().toISOString() })),
      ...documents.map(item => ({ ...item, type: 'document', deletedAt: item.deletedAt || new Date().toISOString() })),
      ...goals.map(item => ({ ...item, type: 'goal', deletedAt: item.deletedAt || new Date().toISOString() }))
    ].sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
    
    setDeletedItems(allItems);
  };

  const filteredItems = deletedItems.filter(item => {
    const matchesSearch = (item.title || item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleRestore = (item) => {
    if (!window.confirm(`Restore "${item.title || item.name}"?`)) return;

    const updatedDeletedItems = deletedItems.filter(deletedItem => 
      !(deletedItem.id === item.id && deletedItem.type === item.type)
    );
    setDeletedItems(updatedDeletedItems);

    const { deletedAt, ...itemToRestore } = item;

    switch (item.type) {
      case 'project':
        const projects = JSON.parse(localStorage.getItem('projects') || '[]');
        localStorage.setItem('projects', JSON.stringify([...projects, itemToRestore]));
        localStorage.setItem('deletedProjects', JSON.stringify(
          JSON.parse(localStorage.getItem('deletedProjects') || '[]').filter(p => p.id !== item.id)
        ));
        break;
      case 'note':
        const notes = JSON.parse(localStorage.getItem('notepadNotes') || '[]');
        localStorage.setItem('notepadNotes', JSON.stringify([...notes, itemToRestore]));
        localStorage.setItem('deletedNotes', JSON.stringify(
          JSON.parse(localStorage.getItem('deletedNotes') || '[]').filter(n => n.id !== item.id)
        ));
        break;
      case 'meeting':
        const meetingNotes = JSON.parse(localStorage.getItem('meetingNotes') || '[]');
        localStorage.setItem('meetingNotes', JSON.stringify([...meetingNotes, itemToRestore]));
        localStorage.setItem('deletedMeetingNotes', JSON.stringify(
          JSON.parse(localStorage.getItem('deletedMeetingNotes') || '[]').filter(m => m.id !== item.id)
        ));
        break;
      case 'document':
        const documents = JSON.parse(localStorage.getItem('documents') || '[]');
        localStorage.setItem('documents', JSON.stringify([...documents, itemToRestore]));
        localStorage.setItem('deletedDocuments', JSON.stringify(
          JSON.parse(localStorage.getItem('deletedDocuments') || '[]').filter(d => d.id !== item.id)
        ));
        break;
      case 'goal':
        const goals = JSON.parse(localStorage.getItem('goals') || '[]');
        localStorage.setItem('goals', JSON.stringify([...goals, itemToRestore]));
        localStorage.setItem('deletedGoals', JSON.stringify(
          JSON.parse(localStorage.getItem('deletedGoals') || '[]').filter(g => g.id !== item.id)
        ));
        break;
    }
  };

  const handlePermanentDelete = (item) => {
    if (!window.confirm(`Permanently delete "${item.title || item.name}"? This cannot be undone.`)) return;

    const updatedDeletedItems = deletedItems.filter(deletedItem => 
      !(deletedItem.id === item.id && deletedItem.type === item.type)
    );
    setDeletedItems(updatedDeletedItems);

    switch (item.type) {
      case 'project':
        localStorage.setItem('deletedProjects', JSON.stringify(
          JSON.parse(localStorage.getItem('deletedProjects') || '[]').filter(p => p.id !== item.id)
        ));
        break;
      case 'note':
        localStorage.setItem('deletedNotes', JSON.stringify(
          JSON.parse(localStorage.getItem('deletedNotes') || '[]').filter(n => n.id !== item.id)
        ));
        break;
      case 'meeting':
        localStorage.setItem('deletedMeetingNotes', JSON.stringify(
          JSON.parse(localStorage.getItem('deletedMeetingNotes') || '[]').filter(m => m.id !== item.id)
        ));
        break;
      case 'document':
        localStorage.setItem('deletedDocuments', JSON.stringify(
          JSON.parse(localStorage.getItem('deletedDocuments') || '[]').filter(d => d.id !== item.id)
        ));
        break;
      case 'goal':
        localStorage.setItem('deletedGoals', JSON.stringify(
          JSON.parse(localStorage.getItem('deletedGoals') || '[]').filter(g => g.id !== item.id)
        ));
        break;
    }
  };

  const handleBulkRestore = () => {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`Restore ${selectedItems.length} selected items?`)) return;

    selectedItems.forEach(itemId => {
      const item = deletedItems.find(i => i.id === itemId);
      if (item) handleRestore(item);
    });
    setSelectedItems([]);
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedItems.length} selected items? This cannot be undone.`)) return;

    selectedItems.forEach(itemId => {
      const item = deletedItems.find(i => i.id === itemId);
      if (item) handlePermanentDelete(item);
    });
    setSelectedItems([]);
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'project': return FolderOpen;
      case 'note': return FileText;
      case 'meeting': return Calendar;
      case 'document': return File;
      case 'goal': return Target;
      default: return FileText;
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      project: isDarkMode ? 'bg-blue-900 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-300',
      note: isDarkMode ? 'bg-green-900 text-green-300 border-green-700' : 'bg-green-100 text-green-800 border-green-300',
      meeting: isDarkMode ? 'bg-purple-900 text-purple-300 border-purple-700' : 'bg-purple-100 text-purple-800 border-purple-300',
      document: isDarkMode ? 'bg-orange-900 text-orange-300 border-orange-700' : 'bg-orange-100 text-orange-800 border-orange-300',
      goal: isDarkMode ? 'bg-indigo-900 text-indigo-300 border-indigo-700' : 'bg-indigo-100 text-indigo-800 border-indigo-300'
    };
    return colors[type] || (isDarkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-300');
  };

  const stats = {
    total: deletedItems.length,
    projects: deletedItems.filter(item => item.type === 'project').length,
    notes: deletedItems.filter(item => item.type === 'note').length,
    meetings: deletedItems.filter(item => item.type === 'meeting').length,
    documents: deletedItems.filter(item => item.type === 'document').length,
    goals: deletedItems.filter(item => item.type === 'goal').length
  };

  return (
    <div className={`content p-6 lg:p-8 font-sans min-h-screen ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Professional Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-6 shadow-lg transition-all duration-300 ${
              isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
            }`}>
              <Trash2 className={`w-8 h-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Trash
              </h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Restore or permanently delete removed items
              </p>
            </div>
          </div>
          
          <button
            onClick={loadDeletedItems}
            className={`flex items-center px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 ${
              isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className={`p-4 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="text-center">
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.total}</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Items</p>
            </div>
          </div>
          
          <div className={`p-4 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="text-center">
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{stats.projects}</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Projects</p>
            </div>
          </div>
          
          <div className={`p-4 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="text-center">
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.notes}</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Notes</p>
            </div>
          </div>
          
          <div className={`p-4 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="text-center">
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{stats.meetings}</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Meetings</p>
            </div>
          </div>
          
          <div className={`p-4 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="text-center">
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>{stats.documents}</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Documents</p>
            </div>
          </div>
          
          <div className={`p-4 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="text-center">
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{stats.goals}</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Goals</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            {[
              { key: 'all', label: 'All Items', icon: Trash2 },
              { key: 'project', label: 'Projects', icon: FolderOpen },
              { key: 'note', label: 'Notes', icon: FileText },
              { key: 'meeting', label: 'Meetings', icon: Calendar },
              { key: 'document', label: 'Documents', icon: File },
              { key: 'goal', label: 'Goals', icon: Target }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={`flex items-center px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 ${
                  filterType === key
                    ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white')
                    : (isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </div>

          {selectedItems.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedItems.length} selected
              </span>
              <button
                onClick={handleBulkRestore}
                className={`flex items-center px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 ${
                  isDarkMode ? 'bg-green-900 text-green-300 hover:bg-green-800' : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore All
              </button>
              <button
                onClick={handleBulkDelete}
                className={`flex items-center px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 ${
                  isDarkMode ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-400'
          }`} />
          <input
            type="text"
            placeholder="Search deleted items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-sm border ${
              isDarkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
      </div>

      {/* Items List */}
      <div className={`rounded-2xl shadow-lg border overflow-hidden ${
        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <Trash2 className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {searchQuery || filterType !== 'all' ? 'No items found' : 'Trash is empty'}
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Deleted items will appear here for recovery.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredItems.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              const isSelected = selectedItems.includes(item.id);
              
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`group flex items-center justify-between p-6 transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                    isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                  } ${isSelected ? (isDarkMode ? 'bg-gray-800' : 'bg-blue-50') : ''}`}
                  onClick={() => toggleItemSelection(item.id)}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isDarkMode ? 'bg-white' : 'bg-black'
                    }`}>
                      <TypeIcon className={`w-6 h-6 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`font-semibold text-lg truncate ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {item.title || item.name || 'Untitled'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getTypeColor(item.type)}`}>
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 opacity-50" />
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                            Deleted {formatDate(item.deletedAt)}
                          </span>
                        </div>
                        {item.description && (
                          <span className={`truncate max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(item);
                      }}
                      className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-105 ${
                        isDarkMode ? 'bg-green-900 text-green-300 hover:bg-green-800' : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePermanentDelete(item);
                      }}
                      className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-105 ${
                        isDarkMode ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrashPage;