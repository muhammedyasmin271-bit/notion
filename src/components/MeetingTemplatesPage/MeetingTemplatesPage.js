import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Plus, Search, Filter, Edit, Trash2, Copy, Users, Globe, Lock, Calendar, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMeetingTemplates, createMeetingTemplate, deleteMeetingTemplate } from '../../services/api';

const MeetingTemplatesPage = () => {
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterVisibility, setFilterVisibility] = useState('all');
    const [loading, setLoading] = useState(true);

    // Type Filter Selector Component
    const TypeFilterSelector = ({ value, onChange }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef(null);

        const typeOptions = [
            { value: 'all', label: 'All Types', hoverColor: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100' },
            { value: 'Standup', label: 'Standup', hoverColor: isDarkMode ? 'hover:bg-blue-500/20' : 'hover:bg-blue-50' },
            { value: 'Planning', label: 'Planning', hoverColor: isDarkMode ? 'hover:bg-purple-500/20' : 'hover:bg-purple-50' },
            { value: 'Review', label: 'Review', hoverColor: isDarkMode ? 'hover:bg-yellow-500/20' : 'hover:bg-yellow-50' },
            { value: 'Retro', label: 'Retro', hoverColor: isDarkMode ? 'hover:bg-green-500/20' : 'hover:bg-green-50' }
        ];

        const currentType = typeOptions.find(option => option.value === value) || typeOptions[0];

        useEffect(() => {
            const handleClickOutside = (event) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700 focus:ring-white/20' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 focus:ring-black/20'} w-full`}
                >
                    <span>{currentType.label}</span>
                    <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
                {isOpen && (
                    <div className={`absolute left-0 mt-1 rounded-xl shadow-2xl z-50 overflow-hidden ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} w-full min-w-[140px]`}>
                        <div className="py-1">
                            {typeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center px-3 py-2 text-left ${option.hoverColor} transition-colors ${isDarkMode ? 'text-gray-200' : 'text-black'}`}
                                >
                                    <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Visibility Filter Selector Component
    const VisibilityFilterSelector = ({ value, onChange }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef(null);

        const visibilityOptions = [
            { value: 'all', label: 'All Visibility', hoverColor: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100' },
            { value: 'public', label: 'Public', hoverColor: isDarkMode ? 'hover:bg-green-500/20' : 'hover:bg-green-50' },
            { value: 'private', label: 'Private', hoverColor: isDarkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-50' }
        ];

        const currentVisibility = visibilityOptions.find(option => option.value === value) || visibilityOptions[0];

        useEffect(() => {
            const handleClickOutside = (event) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700 focus:ring-white/20' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 focus:ring-black/20'} w-full`}
                >
                    <span>{currentVisibility.label}</span>
                    <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
                {isOpen && (
                    <div className={`absolute left-0 mt-1 rounded-xl shadow-2xl z-50 overflow-hidden ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} w-full min-w-[140px]`}>
                        <div className="py-1">
                            {visibilityOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center px-3 py-2 text-left ${option.hoverColor} transition-colors ${isDarkMode ? 'text-gray-200' : 'text-black'}`}
                                >
                                    <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        description: '',
        type: 'Standup',
        defaultDuration: '30',
        isPublic: false
    });

    // Load templates from API
    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const data = await getMeetingTemplates();
            setTemplates(data);
        } catch (error) {
            console.error('Error loading templates:', error);
            // Fallback to sample data
            setTemplates([
                {
                    _id: 1,
                    name: 'Weekly Standup',
                    description: 'Daily team sync meeting',
                    type: 'Standup',
                    defaultDuration: '15',
                    isPublic: true,
                    createdBy: { name: 'System' },
                    createdAt: '2024-01-15T09:00:00Z',
                    tags: ['daily', 'team']
                },
                {
                    _id: 2,
                    name: 'Project Planning',
                    description: 'Project kickoff and planning session',
                    type: 'Planning',
                    defaultDuration: '60',
                    isPublic: true,
                    createdBy: { name: 'System' },
                    createdAt: '2024-01-16T14:00:00Z',
                    tags: ['planning', 'project']
                },
                {
                    _id: 3,
                    name: 'Retrospective',
                    description: 'Team retrospective meeting',
                    type: 'Retro',
                    defaultDuration: '90',
                    isPublic: false,
                    createdBy: { name: 'You' },
                    createdAt: '2024-01-14T11:00:00Z',
                    tags: ['retro', 'team']
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || template.type === filterType;
        const matchesVisibility = filterVisibility === 'all' ||
            (filterVisibility === 'public' && template.isPublic) ||
            (filterVisibility === 'private' && !template.isPublic);
        return matchesSearch && matchesType && matchesVisibility;
    });

    const getTypeColor = (type) => {
        switch (type) {
            case 'Standup': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            case 'Planning': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
            case 'Review': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
            case 'Retro': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const handleCreateTemplate = async () => {
        if (!newTemplate.name.trim()) return;

        try {
            const templateData = {
                ...newTemplate,
                tags: newTemplate.name.toLowerCase().split(' ')
            };

            await createMeetingTemplate(templateData);
            setShowCreateModal(false);
            setNewTemplate({
                name: '',
                description: '',
                type: 'Standup',
                defaultDuration: '30',
                isPublic: false
            });
            loadTemplates(); // Refresh the list
        } catch (error) {
            console.error('Error creating template:', error);
            alert('Failed to create template. Please try again.');
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            try {
                await deleteMeetingTemplate(templateId);
                loadTemplates(); // Refresh the list
            } catch (error) {
                console.error('Error deleting template:', error);
                alert('Failed to delete template. Please try again.');
            }
        }
    };

    const handleUseTemplate = (template) => {
        navigate('/meeting-new', { state: { template } });
    };

    const TemplateCard = ({ template }) => (
        <div className={`rounded-lg border transition-all duration-200 hover:shadow-md ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {template.name}
                        </h3>
                        <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {template.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(template.type)}`}>
                                {template.type}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                <Calendar className="w-3 h-3" />
                                {template.defaultDuration} min
                            </span>
                            {template.isPublic ? (
                                <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${isDarkMode ? 'bg-white/30 text-white' : 'bg-black/30 text-black'}`}>
                                    <Globe className="w-3 h-3" />
                                    Public
                                </span>
                            ) : (
                                <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                    <Lock className="w-3 h-3" />
                                    Private
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button
                                onClick={() => handleUseTemplate(template)}
                                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${isDarkMode ? 'bg-[#141414] hover:bg-gray-800 text-white border border-white' : 'bg-white hover:bg-gray-100 text-black border border-black'}`}
                style={isDarkMode ? { backgroundColor: '#141414' } : {}}
                            >
                                Use
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            by {template.createdBy.name}
                        </span>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            •
                        </span>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {new Date(template.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleUseTemplate(template)}
                            className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                            title="Use template"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                        {template.createdBy.name === 'You' && (
                            <>
                                <button
                                    className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                                    title="Edit template"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteTemplate(template._id)}
                                    className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                                    title="Delete template"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-[#141414] text-white' : 'bg-gray-50 text-gray-900'}`}
          style={isDarkMode ? { backgroundColor: '#141414' } : {}}
        >
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Meeting Templates</h1>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Create and manage meeting templates for your team
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isDarkMode ? 'bg-[#141414] hover:bg-gray-800 text-white border border-white' : 'bg-white hover:bg-gray-100 text-black border border-black'}`}
                style={isDarkMode ? { backgroundColor: '#141414' } : {}}
                    >
                        <Plus className="w-4 h-4" />
                        New Template
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-white' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-black'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-white/20' : 'focus:ring-black/20'}`}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <TypeFilterSelector
                            value={filterType}
                            onChange={setFilterType}
                        />
                        <VisibilityFilterSelector
                            value={filterVisibility}
                            onChange={setFilterVisibility}
                        />
                    </div>
                </div>

                {/* Templates Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
                    </div>
                ) : filteredTemplates.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredTemplates.map(template => (
                            <TemplateCard key={template._id} template={template} />
                        ))}
                    </div>
                ) : (
                    <div className={`text-center py-12 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <Calendar className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                        <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {searchTerm || filterType !== 'all' || filterVisibility !== 'all' ? 'No templates found' : 'No templates yet'}
                        </h3>
                        <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mb-4`}>
                            {searchTerm || filterType !== 'all' || filterVisibility !== 'all'
                                ? 'Try adjusting your search or filter criteria'
                                : 'Create your first template to get started'
                            }
                        </p>
                        {!searchTerm && filterType === 'all' && filterVisibility === 'all' && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-[#141414] hover:bg-gray-800 text-white border border-white' : 'bg-white hover:bg-gray-100 text-black border border-black'}`}
                style={isDarkMode ? { backgroundColor: '#141414' } : {}}
                            >
                                Create Template
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Create Template Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
                        }`}>
                        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Create New Template
                                </h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Template Name *
                                </label>
                                <input
                                    type="text"
                                    value={newTemplate.name}
                                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter template name"
                                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-white' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-black'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-white/20' : 'focus:ring-black/20'}`}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Description
                                </label>
                                <textarea
                                    value={newTemplate.description}
                                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Enter template description"
                                    rows={3}
                                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-white/20' : 'focus:ring-black/20'}`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Meeting Type
                                    </label>
                                    <select
                                        value={newTemplate.type}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, type: e.target.value }))}
                                        className={`w-full px-3 py-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                    >
                                        <option value="Standup">Standup</option>
                                        <option value="Planning">Planning</option>
                                        <option value="Review">Review</option>
                                        <option value="Retro">Retrospective</option>
                                        <option value="Presentation">Presentation</option>
                                        <option value="Brainstorming">Brainstorming</option>
                                        <option value="Client Meeting">Client Meeting</option>
                                        <option value="Team Sync">Team Sync</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Default Duration (min)
                                    </label>
                                    <select
                                        value={newTemplate.defaultDuration}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, defaultDuration: e.target.value }))}
                                        className={`w-full px-3 py-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                    >
                                        <option value="15">15 minutes</option>
                                        <option value="30">30 minutes</option>
                                        <option value="45">45 minutes</option>
                                        <option value="60">1 hour</option>
                                        <option value="90">1.5 hours</option>
                                        <option value="120">2 hours</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isPublic"
                                        checked={newTemplate.isPublic}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, isPublic: e.target.checked }))}
                                        className={`w-4 h-4 rounded border-gray-300 ${isDarkMode ? 'text-white focus:ring-white bg-gray-700 border-gray-600' : 'text-black focus:ring-black'}`}
                                    />
                                    <label htmlFor="isPublic" className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Make public
                                    </label>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateTemplate}
                                        disabled={!newTemplate.name.trim()}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white' : 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white'}`}
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingTemplatesPage;