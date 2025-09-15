import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FileText,
    Plus,
    Search,
    Trash2,
    Edit3,
    Download,
    Share2,
    User,
    Upload,
    Image,
    Video,
    FileSpreadsheet,
    Globe,
    CheckCircle,
    Filter,
    Grid,
    List,
    Eye,
    Star,
    Clock,
    Users,
    FolderOpen,
    Archive,
    Copy,
    Move,
    Tag,
    Calendar,
    Shield,
    X,
    Maximize2,
    AlertCircle,
    Check,
    AlertTriangle
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { get, post, put, deleteRequest, upload as uploadFile } from '../../services/api';
import { addNotification } from '../../utils/notifications';

const DocumentsPage = () => {
    const { user } = useAppContext();
    const { isDarkMode } = useTheme();
    const [documents, setDocuments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedDocs, setSelectedDocs] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('lastModified');
    const [sortOrder, setSortOrder] = useState('desc');
    const [filter, setFilter] = useState('all');
    const [deletingDocs, setDeletingDocs] = useState([]); // Track documents being deleted
    const [favorites, setFavorites] = useState([]);
    const [recentFiles, setRecentFiles] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    // Check if user has permission to manage documents
    const canManage = user && (user.role === 'admin' || user.role === 'manager');

    // Load documents
    useEffect(() => {
        const fetchDocuments = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await get('/documents');
                // Enhance documents with better sharing information
                const enhancedData = data.map(doc => ({
                    ...doc,
                    // Ensure sharedWith and collaborators are properly structured
                    sharedWith: Array.isArray(doc.sharedWith) ? doc.sharedWith.map(item =>
                        item.user ? item : { user: item }
                    ) : [],
                    collaborators: Array.isArray(doc.collaborators) ? doc.collaborators : [],
                    // Add author info if missing
                    author: doc.author || { name: 'Unknown', _id: null }
                }));
                setDocuments(enhancedData);
            } catch (err) {
                console.error('Error fetching documents:', err);
                setError('Failed to load documents');
                // Try to load from cache
                const cached = localStorage.getItem('documents_cache');
                if (cached) {
                    try {
                        setDocuments(JSON.parse(cached) || []);
                    } catch (e) {
                        setDocuments([]);
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    // Save to cache when documents change
    useEffect(() => {
        if (documents.length > 0) {
            try {
                localStorage.setItem('documents_cache', JSON.stringify(documents));
            } catch (e) {
                console.warn('Failed to cache documents:', e);
            }
        }
    }, [documents]);

    // Drag and drop handlers
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0 && canManage) {
            // For now, we'll just open the upload modal
            // In a more advanced implementation, we could auto-upload
            setShowUploadModal(true);
        }
    }, [canManage]);

    // Filter and sort documents
    const filteredDocuments = documents
        .filter(doc => {
            // Apply filter
            if (filter === 'owned') {
                return doc.author?._id === user?.id || doc.author?.id === user?.id;
            } else if (filter === 'shared') {
                // Show documents shared with the user
                const isSharedWithUser = doc.sharedWith?.some(sharedUser =>
                    sharedUser.user?._id === user?.id || sharedUser.user?.id === user?.id
                );
                const isCollaborator = doc.collaborators?.some(collab =>
                    collab.user?._id === user?.id || collab.user?.id === user?.id
                );
                // Check if document is public and shared with current user's role
                const isPublic = doc.isPublic && (
                    doc.shareType === 'all' ||
                    (doc.shareType === 'all-users' && user?.role !== 'admin' && user?.role !== 'manager') ||
                    (doc.shareType === 'all-managers' && (user?.role === 'admin' || user?.role === 'manager'))
                );
                // Make sure the user is not the owner
                const isOwner = doc.author?._id === user?.id || doc.author?.id === user?.id;
                return (isSharedWithUser || isCollaborator || isPublic) && !isOwner;
            }
            // 'all' filter shows everything including public documents

            // Apply search
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                (doc.title && doc.title.toLowerCase().includes(query)) ||
                (doc.content && doc.content.toLowerCase().includes(query)) ||
                (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(query)))
            );
        })
        .sort((a, b) => {
            let aVal, bVal;

            switch (sortBy) {
                case 'name':
                    aVal = a.title?.toLowerCase() || '';
                    bVal = b.title?.toLowerCase() || '';
                    break;
                case 'type':
                    aVal = a.type || '';
                    bVal = b.type || '';
                    break;
                case 'size':
                    // Extract numeric size from string like "2.4 MB"
                    const aSize = a.attachments?.[0]?.size || 0;
                    const bSize = b.attachments?.[0]?.size || 0;
                    return sortOrder === 'desc' ? bSize - aSize : aSize - bSize;
                case 'owner':
                    aVal = a.author?.name || '';
                    bVal = b.author?.name || '';
                    break;
                default: // lastModified
                    aVal = new Date(a.updatedAt || a.createdAt);
                    bVal = new Date(b.updatedAt || b.createdAt);
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

    // Handle file selection
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0 && canManage) {
            setShowUploadModal(true);
        }
    };

    // Handle document selection
    const toggleDocumentSelection = (docId) => {
        setSelectedDocs(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        );
    };

    const selectAllDocuments = () => {
        if (selectedDocs.length === filteredDocuments.length) {
            setSelectedDocs([]);
        } else {
            setSelectedDocs(filteredDocuments.map(doc => doc._id));
        }
    };

    // Document actions
    const handleDeleteDocument = async (docId) => {
        if (!canManage) return;

        const docToDelete = documents.find(doc => doc._id === docId);
        const docTitle = docToDelete?.title || 'this document';

        const confirmed = window.confirm(
            `Are you sure you want to permanently delete "${docTitle}"? This action cannot be undone and the document will be removed from the database.`
        );
        if (!confirmed) return;

        try {
            // Add to deleting state
            setDeletingDocs(prev => [...prev, docId]);

            // First, check if document is already in trash (deleted flag is true)
            const isAlreadyDeleted = docToDelete?.deleted;

            if (isAlreadyDeleted) {
                // Permanently delete from database
                await deleteRequest(`/documents/trash/${docId}`);
            } else {
                // Soft delete first (move to trash)
                await deleteRequest(`/documents/${docId}`);
                // Then permanently delete from database
                await deleteRequest(`/documents/trash/${docId}`);
            }

            setDocuments(prev => prev.filter(doc => doc._id !== docId));
            setDeletingDocs(prev => prev.filter(id => id !== docId)); // Remove from deleting state
            addNotification({
                type: 'success',
                title: 'Document deleted',
                message: `"${docTitle}" has been permanently deleted from the database`
            });
        } catch (err) {
            console.error('Error deleting document:', err);
            setDeletingDocs(prev => prev.filter(id => id !== docId)); // Remove from deleting state
            addNotification({
                type: 'error',
                title: 'Delete failed',
                message: `Failed to permanently delete "${docTitle}"`
            });
        }
    };

    const handleBulkDelete = async () => {
        if (!canManage || selectedDocs.length === 0) return;

        const confirmed = window.confirm(
            `Are you sure you want to permanently delete ${selectedDocs.length} documents? This action cannot be undone and the documents will be removed from the database.`
        );
        if (!confirmed) return;

        try {
            // Add all to deleting state
            setDeletingDocs(prev => [...prev, ...selectedDocs]);

            // Process each document
            let successCount = 0;
            const errors = [];

            for (const id of selectedDocs) {
                try {
                    // First, check if document is already in trash (deleted flag is true)
                    const docToDelete = documents.find(doc => doc._id === id);
                    const isAlreadyDeleted = docToDelete?.deleted;

                    if (isAlreadyDeleted) {
                        // Permanently delete from database
                        await deleteRequest(`/documents/trash/${id}`);
                    } else {
                        // Soft delete first (move to trash)
                        await deleteRequest(`/documents/${id}`);
                        // Then permanently delete from database
                        await deleteRequest(`/documents/trash/${id}`);
                    }
                    successCount++;
                } catch (err) {
                    console.error(`Error deleting document ${id}:`, err);
                    errors.push(id);
                }
            }

            setDocuments(prev => prev.filter(doc => !selectedDocs.includes(doc._id)));
            setSelectedDocs([]);
            setDeletingDocs(prev => prev.filter(id => !selectedDocs.includes(id))); // Remove from deleting state

            if (successCount > 0) {
                addNotification({
                    type: 'success',
                    title: 'Documents deleted',
                    message: `${successCount} documents have been permanently deleted from the database`
                });
            }

            if (errors.length > 0) {
                addNotification({
                    type: 'error',
                    title: 'Delete failed',
                    message: `Failed to permanently delete ${errors.length} documents`
                });
            }
        } catch (err) {
            console.error('Error deleting documents:', err);
            setDeletingDocs(prev => prev.filter(id => !selectedDocs.includes(id))); // Remove from deleting state
            addNotification({
                type: 'error',
                title: 'Delete failed',
                message: 'Failed to permanently delete documents'
            });
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    // Get file type icon with enhanced styling
    const getFileTypeIcon = (type, size = "w-5 h-5") => {
        switch (type?.toLowerCase()) {
            case 'pdf': return <FileText className={`${size} text-red-500`} />;
            case 'image': return <Image className={`${size} text-purple-500`} />;
            case 'video': return <Video className={`${size} text-pink-500`} />;
            case 'excel':
            case 'spreadsheet': return <FileSpreadsheet className={`${size} text-green-500`} />;
            default: return <FileText className={`${size} text-blue-500`} />;
        }
    };

    // Toggle favorite
    const toggleFavorite = (docId) => {
        setFavorites(prev => 
            prev.includes(docId) 
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        );
    };

    // Add to recent files
    const addToRecent = (doc) => {
        setRecentFiles(prev => {
            const filtered = prev.filter(d => d._id !== doc._id);
            return [doc, ...filtered].slice(0, 10);
        });
    };

    // Open preview modal
    const openPreview = (doc) => {
        setPreviewDoc(doc);
        setShowPreview(true);
        addToRecent(doc);
    };

    // Get thumbnail for file
    const getThumbnail = (doc) => {
        const attachment = doc.attachments?.[0];
        if (attachment?.mimeType?.startsWith('image/')) {
            return attachment.url;
        }
        return null;
    };

    // Get file type color
    const getFileTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'pdf': return 'bg-red-100 text-red-800 border-red-200';
            case 'image': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'video': return 'bg-pink-100 text-pink-800 border-pink-200';
            case 'excel':
            case 'spreadsheet': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    return (
        <div
            className={`min-h-screen p-6 lg:p-8 font-sans ${isDarkMode
                ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20 text-white'
                : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900'
                }`}
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag overlay */}
            {dragOver && canManage && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
                    <div className={`p-12 rounded-2xl border-2 border-dashed ${isDarkMode ? 'bg-gray-800 border-blue-500' : 'bg-white border-blue-400'
                        }`}>
                        <Upload className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'
                            }`} />
                        <h3 className="text-2xl font-bold text-center mb-2">Drop files here</h3>
                        <p className="text-center">Release to upload your documents</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                    <div className="flex items-center gap-8">
                        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl border-2 ${isDarkMode ? 'bg-gradient-to-br from-blue-600 to-purple-600 border-blue-400/30' : 'bg-gradient-to-br from-blue-500 to-purple-500 border-blue-400/30'
                            }`}>
                            <FolderOpen className="w-12 h-12 text-white" />
                        </div>
                        <div>
                            <h1 className="text-5xl md:text-6xl font-black mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Documents
                            </h1>
                            <p className={`text-xl font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Manage and organize your files • <span className="font-bold text-blue-600">{filteredDocuments.length}</span> documents
                            </p>
                        </div>
                    </div>

                    {canManage && (
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all duration-300 hover:scale-105 shadow-2xl ${isDarkMode
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 border border-blue-400/30'
                                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 border border-blue-400/30'
                                }`}
                        >
                            <Upload className="w-6 h-6" />
                            Upload Document
                        </button>
                    )}
                </div>

                {/* Quick Actions Bar */}
                <div className={`mb-6 p-4 rounded-2xl border backdrop-blur-sm ${isDarkMode ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold">Quick Actions</h3>
                        <div className="flex items-center gap-2">
                            {selectedDocs.length > 0 && (
                                <>
                                    <button
                                        onClick={() => {
                                            selectedDocs.forEach(id => {
                                                const doc = documents.find(d => d._id === id);
                                                if (doc) toggleFavorite(id);
                                            });
                                        }}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-yellow-900 text-yellow-300 hover:bg-yellow-800' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                                    >
                                        ⭐ Favorite ({selectedDocs.length})
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                    >
                                        🗑️ Delete ({selectedDocs.length})
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {/* Recent Files */}
                    {recentFiles.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-sm font-semibold mb-2 text-gray-600">📁 Recent Files</h4>
                            <div className="flex gap-2 overflow-x-auto">
                                {recentFiles.slice(0, 5).map(doc => (
                                    <div key={doc._id} className={`flex-shrink-0 p-2 rounded-lg border cursor-pointer hover:scale-105 transition-transform ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                         onClick={() => openPreview(doc)}>
                                        <div className="text-xs font-medium truncate w-20">{doc.title}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Favorites */}
                    {favorites.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2 text-gray-600">⭐ Favorites</h4>
                            <div className="flex gap-2 overflow-x-auto">
                                {favorites.slice(0, 5).map(docId => {
                                    const doc = documents.find(d => d._id === docId);
                                    return doc ? (
                                        <div key={doc._id} className={`flex-shrink-0 p-2 rounded-lg border cursor-pointer hover:scale-105 transition-transform ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                             onClick={() => openPreview(doc)}>
                                            <div className="text-xs font-medium truncate w-20">{doc.title}</div>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Search and filters */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="relative flex-1 max-w-2xl">
                        <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'
                            }`} />
                        <input
                            type="text"
                            placeholder="Search documents, descriptions, tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-12 pr-6 py-4 rounded-2xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 ${isDarkMode
                                ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                }`}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Filter buttons */}
                        <div className={`flex items-center rounded-2xl p-1 border-2 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                            }`}>
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${filter === 'all'
                                    ? (isDarkMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-500 text-white shadow-lg')
                                    : (isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
                                    }`}
                            >
                                All Documents
                            </button>
                            <button
                                onClick={() => setFilter('owned')}
                                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${filter === 'owned'
                                    ? (isDarkMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-500 text-white shadow-lg')
                                    : (isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
                                    }`}
                            >
                                Owned by Me
                            </button>
                            <button
                                onClick={() => setFilter('shared')}
                                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${filter === 'shared'
                                    ? (isDarkMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-500 text-white shadow-lg')
                                    : (isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
                                    }`}
                            >
                                Shared with Me
                            </button>
                        </div>

                        <div className={`flex items-center rounded-2xl p-1 border-2 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                            }`}>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-3 rounded-xl transition-all duration-200 ${viewMode === 'grid'
                                    ? (isDarkMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-500 text-white shadow-lg')
                                    : (isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
                                    }`}
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-3 rounded-xl transition-all duration-200 ${viewMode === 'list'
                                    ? (isDarkMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-500 text-white shadow-lg')
                                    : (isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
                                    }`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>

                        {canManage && selectedDocs.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode
                                    ? 'bg-red-900 text-red-200 hover:bg-red-800'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    }`}
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete ({selectedDocs.length})
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className={`p-6 rounded-xl mb-6 flex items-center gap-4 ${isDarkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'
                    }`}>
                    <AlertCircle className={`w-6 h-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                    <div>
                        <h3 className="font-semibold">Error loading documents</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
                    </div>
                </div>
            )}

            {/* Documents grid/list */}
            {!loading && (
                <>
                    {filteredDocuments.length === 0 ? (
                        <div className="text-center py-20">
                            <FolderOpen className={`w-20 h-20 mx-auto mb-6 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'
                                }`} />
                            <h3 className="text-2xl font-bold mb-2">No documents found</h3>
                            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {searchQuery ? 'Try adjusting your search' : 'Get started by uploading your first document'}
                            </p>
                            {canManage && (
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${isDarkMode
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                        }`}
                                >
                                    <Upload className="w-5 h-5" />
                                    Upload Document
                                </button>
                            )}
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredDocuments.map((doc) => (
                                <DocumentCard
                                    key={doc._id}
                                    document={doc}
                                    isSelected={selectedDocs.includes(doc._id)}
                                    onSelect={toggleDocumentSelection}
                                    onDelete={handleDeleteDocument}
                                    canManage={canManage}
                                    isDarkMode={isDarkMode}
                                    formatFileSize={formatFileSize}
                                    getFileTypeIcon={getFileTypeIcon}
                                    getFileTypeColor={getFileTypeColor}
                                    user={user}
                                    isDeleting={deletingDocs.includes(doc._id)} // Pass deleting state
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className={`hidden md:grid grid-cols-12 gap-4 px-6 py-3 rounded-xl font-semibold ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                                }`}>
                                <div className="col-span-5">Name</div>
                                <div className="col-span-2">Type</div>
                                <div className="col-span-2">Owner</div>
                                <div className="col-span-2">Last Modified</div>
                                <div className="col-span-1 text-right">Actions</div>
                            </div>
                            {filteredDocuments.map((doc) => (
                                <DocumentListItem
                                    key={doc._id}
                                    document={doc}
                                    isSelected={selectedDocs.includes(doc._id)}
                                    onSelect={toggleDocumentSelection}
                                    onDelete={handleDeleteDocument}
                                    canManage={canManage}
                                    isDarkMode={isDarkMode}
                                    formatFileSize={formatFileSize}
                                    getFileTypeIcon={getFileTypeIcon}
                                    getFileTypeColor={getFileTypeColor}
                                    user={user}
                                    isDeleting={deletingDocs.includes(doc._id)}
                                    isFavorite={favorites.includes(doc._id)}
                                    onToggleFavorite={() => toggleFavorite(doc._id)}
                                    onPreview={() => openPreview(doc)}
                                    getThumbnail={getThumbnail}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <UploadModal
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={(newDoc) => {
                        const enhancedDoc = {
                            ...newDoc,
                            sharedWith: Array.isArray(newDoc.sharedWith) ? newDoc.sharedWith.map(item =>
                                item.user ? item : { user: item }
                            ) : [],
                            collaborators: Array.isArray(newDoc.collaborators) ? newDoc.collaborators : [],
                            author: newDoc.author || { name: user?.name || 'You', _id: user?.id }
                        };
                        setDocuments(prev => [enhancedDoc, ...prev]);
                        setShowUploadModal(false);
                    }}
                    isDarkMode={isDarkMode}
                    user={user}
                />
            )}

            {/* Preview Modal */}
            {showPreview && previewDoc && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/90' : 'bg-black/60'}`} onClick={() => setShowPreview(false)} />
                    <div className="relative min-h-screen flex items-center justify-center p-4">
                        <div className={`w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
                            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                        {getFileTypeIcon(previewDoc.attachments?.[0]?.mimeType?.split('/')[1] || 'document', "w-6 h-6")}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{previewDoc.title}</h2>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Document Preview</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowPreview(false)}
                                    className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-bold mb-4">Document Information</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Type:</span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getFileTypeColor(previewDoc.attachments?.[0]?.mimeType?.split('/')[1] || 'document')}`}>
                                                    {(previewDoc.attachments?.[0]?.mimeType?.split('/')[1] || 'document').toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Size:</span>
                                                <span>{formatFileSize(previewDoc.attachments?.[0]?.size)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Owner:</span>
                                                <span>{previewDoc.author?.name || 'Unknown'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold mb-4">Description</h3>
                                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {previewDoc.content || 'No description available'}
                                        </p>
                                    </div>
                                </div>
                                {previewDoc.attachments?.[0]?.url && (
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <div className="flex gap-3">
                                            <a 
                                                href={previewDoc.attachments[0].url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                View File
                                            </a>
                                            <a 
                                                href={previewDoc.attachments[0].url} 
                                                download
                                                className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Download
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Document Card Component
const DocumentCard = ({
    document,
    isSelected,
    onSelect,
    onDelete,
    canManage,
    isDarkMode,
    formatFileSize,
    getFileTypeIcon,
    getFileTypeColor,
    user,
    isDeleting,
    isFavorite,
    onToggleFavorite,
    onPreview,
    getThumbnail
}) => {
    const attachment = document.attachments?.[0];
    const fileType = attachment?.mimeType?.split('/')[1] || document.type || 'document';

    // Check if document is shared with current user
    const isSharedWithMe = document.sharedWith?.some(sharedUser =>
        sharedUser.user?._id === user?.id || sharedUser.user?.id === user?.id
    ) || document.collaborators?.some(collab =>
        collab.user?._id === user?.id || collab.user?.id === user?.id
    );

    // Check if current user is the owner
    const isOwner = document.author?._id === user?.id || document.author?.id === user?.id;

    return (
        <div className={`group relative rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-xl ${isSelected
            ? (isDarkMode ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-900/10' : 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50')
            : (isDarkMode ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-gray-200 bg-white hover:border-gray-300')
            } ${isDeleting ? 'opacity-50' : ''}`}>
            {/* Selection checkbox */}
            {canManage && (
                <div className="absolute top-3 left-3 z-10">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(document._id);
                        }}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected
                            ? (isDarkMode ? 'bg-blue-600 border-blue-600' : 'bg-blue-500 border-blue-500')
                            : (isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white')
                            }`}
                        disabled={isDeleting}
                    >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                    </button>
                </div>
            )}

            {/* Favorite star */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                }}
                className={`absolute top-3 right-3 p-1 rounded-full transition-colors ${
                    isFavorite 
                        ? 'text-yellow-500 hover:text-yellow-600' 
                        : (isDarkMode ? 'text-gray-600 hover:text-yellow-500' : 'text-gray-400 hover:text-yellow-500')
                }`}
                disabled={isDeleting}
            >
                <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Shared indicator */}
            {isSharedWithMe && !isOwner && (
                <div className={`absolute top-3 right-10 px-2 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800'
                    }`}>
                    Shared
                </div>
            )}

            {/* Document preview */}
            <div className="p-5" onClick={() => onPreview()}>
                <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                        {getThumbnail && getThumbnail(document) ? (
                            <img 
                                src={getThumbnail(document)} 
                                alt={document.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div className={getThumbnail && getThumbnail(document) ? 'hidden' : 'flex'} style={{alignItems: 'center', justifyContent: 'center'}}>
                            {getFileTypeIcon(fileType)}
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate group-hover:text-blue-500 transition-colors">
                            {document.title}
                        </h3>
                        <p className={`text-sm truncate mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            {document.content?.substring(0, 60) || 'No description'}...
                        </p>
                    </div>
                </div>

                {/* File info */}
                <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getFileTypeColor(fileType)
                        }`}>
                        {fileType.toUpperCase()}
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatFileSize(attachment?.size)}
                    </span>
                </div>

                {/* Owner and sharing info */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                            }`}>
                            {document.author?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm truncate">
                            {document.author?.name || 'Unknown'}
                        </span>
                    </div>

                    {isSharedWithMe && !isOwner && (
                        <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                            Shared with you
                        </span>
                    )}
                </div>

                {/* Tags */}
                {document.tags && document.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {document.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                    }`}
                            >
                                #{tag}
                            </span>
                        ))}
                        {document.tags.length > 3 && (
                            <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                +{document.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className={`pt-4 border-t flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <div className="text-xs text-gray-500">
                        {new Date(document.updatedAt || document.createdAt).toLocaleDateString()}
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onPreview) onPreview();
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'
                                }`}
                            title="Preview"
                            disabled={isDeleting}
                        >
                            <Eye className="w-4 h-4" />
                        </button>

                        {onToggleFavorite && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite();
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${
                                    isFavorite 
                                        ? 'text-yellow-500 hover:text-yellow-600' 
                                        : (isDarkMode ? 'text-gray-400 hover:text-yellow-500' : 'text-gray-500 hover:text-yellow-500')
                                }`}
                                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                disabled={isDeleting}
                            >
                                <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                            </button>
                        )}

                        {attachment?.url && (
                            <a
                                href={attachment.url}
                                download
                                onClick={(e) => e.stopPropagation()}
                                className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'
                                    }`}
                                title="Download"
                                disabled={isDeleting}
                            >
                                <Download className="w-4 h-4" />
                            </a>
                        )}

                        {canManage && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(document._id);
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-red-900/50 hover:text-red-400' : 'text-gray-500 hover:bg-red-100 hover:text-red-600'
                                    } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={isDeleting ? "Deleting..." : "Delete"}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Deleting overlay */}
            {isDeleting && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-2xl z-20">
                    <div className="text-white font-semibold flex items-center">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Deleting...
                    </div>
                </div>
            )}
        </div>
    );
};

// Document List Item Component
const DocumentListItem = ({
    document,
    isSelected,
    onSelect,
    onDelete,
    canManage,
    isDarkMode,
    formatFileSize,
    getFileTypeIcon,
    getFileTypeColor,
    user,
    isDeleting,
    isFavorite,
    onToggleFavorite,
    onPreview,
    getThumbnail
}) => {
    const attachment = document.attachments?.[0];
    const fileType = attachment?.mimeType?.split('/')[1] || document.type || 'document';

    // Check if document is shared with current user
    const isSharedWithMe = document.sharedWith?.some(sharedUser =>
        sharedUser.user?._id === user?.id || sharedUser.user?.id === user?.id
    ) || document.collaborators?.some(collab =>
        collab.user?._id === user?.id || collab.user?.id === user?.id
    );

    // Check if current user is the owner
    const isOwner = document.author?._id === user?.id || document.author?.id === user?.id;

    return (
        <div className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border transition-all duration-200 hover:shadow-md relative ${isSelected
            ? (isDarkMode ? 'border-blue-500 bg-blue-900/10' : 'border-blue-500 bg-blue-50')
            : (isDarkMode ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-gray-200 bg-white hover:border-gray-300')
            } ${isDeleting ? 'opacity-50' : ''}`}>
            <div className="md:col-span-5 flex items-center gap-4">
                {canManage && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(document._id);
                        }}
                        className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${isSelected
                            ? (isDarkMode ? 'bg-blue-600 border-blue-600' : 'bg-blue-500 border-blue-500')
                            : (isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white')
                            }`}
                        disabled={isDeleting}
                    >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                    </button>
                )}

                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                    {getFileTypeIcon(fileType)}
                </div>

                <div className="min-w-0">
                    <h3 className="font-semibold truncate">{document.title}</h3>
                    <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        {document.content?.substring(0, 50) || 'No description'}...
                    </p>
                </div>
            </div>

            <div className="md:col-span-2">
                <span className={`px-2 py-1 rounded text-xs font-medium border ${getFileTypeColor(fileType)
                    }`}>
                    {fileType.toUpperCase()}
                </span>
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                    }`}>
                    {document.author?.name?.charAt(0) || 'U'}
                </div>
                <span className="truncate text-sm">
                    {document.author?.name || 'Unknown'}
                </span>
                {isSharedWithMe && !isOwner && (
                    <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                        Shared
                    </span>
                )}
            </div>

            <div className="md:col-span-2 text-sm">
                {new Date(document.updatedAt || document.createdAt).toLocaleDateString()}
            </div>

            <div className="md:col-span-1 flex justify-end">
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // Preview functionality would go here
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'
                            }`}
                        title="Preview"
                        disabled={isDeleting}
                    >
                        <Eye className="w-4 h-4" />
                    </button>

                    {attachment?.url && (
                        <a
                            href={attachment.url}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'
                                }`}
                            title="Download"
                            disabled={isDeleting}
                        >
                            <Download className="w-4 h-4" />
                        </a>
                    )}

                    {canManage && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(document._id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-red-900/50 hover:text-red-400' : 'text-gray-500 hover:bg-red-100 hover:text-red-600'
                                } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={isDeleting ? "Deleting..." : "Delete"}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Deleting overlay */}
            {isDeleting && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-xl z-20">
                    <div className="text-white font-semibold flex items-center">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Deleting...
                    </div>
                </div>
            )}
        </div>
    );
};

// Upload Modal Component
const UploadModal = ({ onClose, onSuccess, isDarkMode, user }) => {
    const [uploadForm, setUploadForm] = useState({
        title: '',
        content: '',
        file: null,
        isPublic: false,
        tags: []
    });
    const [currentTag, setCurrentTag] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [shareWith, setShareWith] = useState(''); // New state for sharing
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const file = files[0];
            setUploadForm(prev => ({
                ...prev,
                file,
                title: prev.title || file.name.replace(/\.[^/.]+$/, '')
            }));
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadForm(prev => ({
                ...prev,
                file,
                title: prev.title || file.name.replace(/\.[^/.]+$/, '')
            }));
        }
    };

    const addTag = () => {
        if (currentTag.trim() && !uploadForm.tags.includes(currentTag.trim())) {
            setUploadForm(prev => ({
                ...prev,
                tags: [...prev.tags, currentTag.trim()]
            }));
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove) => {
        setUploadForm(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleUpload = async () => {
        if (!uploadForm.title.trim()) {
            setError('Please enter a document title');
            return;
        }

        if (!uploadForm.file) {
            setError('Please select a file to upload');
            return;
        }

        setUploading(true);
        setError('');

        try {
            // First create the document
            const documentData = {
                title: uploadForm.title,
                content: uploadForm.content || '',
                type: uploadForm.file.type.split('/')[0] || 'document',
                isPublic: uploadForm.isPublic,
                tags: uploadForm.tags
            };

            const docResponse = await post('/documents', documentData);

            // Then upload the file as an attachment
            const formData = new FormData();
            formData.append('file', uploadForm.file);

            const attachmentResponse = await uploadFile(`/documents/${docResponse._id}/attachments`, formData);

            // Update the document with attachment info
            let updatedDoc = {
                ...docResponse,
                attachments: [attachmentResponse.attachment],
                sharedWith: [],
                collaborators: [],
                author: { name: user?.name || 'You', _id: user?.id }
            };

            // If user wants to share the document, update it to be public or shared
            if (shareWith) {
                try {
                    // Update document to be public if sharing with everyone
                    if (shareWith === 'all' || shareWith === 'all-users' || shareWith === 'all-managers') {
                        const updateResponse = await put(`/documents/${docResponse._id}`, { 
                            isPublic: true,
                            shareType: shareWith 
                        });
                        updatedDoc = {
                            ...updatedDoc,
                            isPublic: true,
                            shareType: shareWith
                        };
                    }
                } catch (shareError) {
                    console.error('Error sharing document:', shareError);
                    addNotification({
                        type: 'error',
                        title: 'Sharing failed',
                        message: 'Document uploaded but sharing failed'
                    });
                }
            }
            
            // Ensure proper structure
            updatedDoc.sharedWith = Array.isArray(updatedDoc.sharedWith) ? updatedDoc.sharedWith : [];
            updatedDoc.collaborators = Array.isArray(updatedDoc.collaborators) ? updatedDoc.collaborators : [];

            onSuccess(updatedDoc);

            addNotification({
                type: 'success',
                title: 'Document uploaded',
                message: 'Document has been successfully uploaded' + (shareWith ? ' and shared' : '')
            });
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload document');

            addNotification({
                type: 'error',
                title: 'Upload failed',
                message: err.message || 'Failed to upload document'
            });
        } finally {
            setUploading(false);
        }
    };

    const getFileIcon = (file) => {
        if (!file) return <FileText className="w-8 h-8" />;

        const type = file.type.toLowerCase();
        if (type.includes('image')) return <Image className="w-8 h-8 text-purple-500" />;
        if (type.includes('video')) return <Video className="w-8 h-8 text-pink-500" />;
        if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
        if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
        return <FileText className="w-8 h-8 text-blue-500" />;
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 Bytes';
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className={`absolute inset-0 ${isDarkMode ? 'bg-black/80' : 'bg-black/60'
                    }`}
                onClick={onClose}
            />

            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                    }`}>
                    {/* Header */}
                    <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-gray-800 bg-gray-800' : 'border-gray-200 bg-gray-50'
                        }`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                                }`}>
                                <Upload className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                    }`} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Upload Document</h2>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Add a new file to your workspace
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={uploading}
                            className={`p-2 rounded-lg transition-colors ${isDarkMode
                                ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'
                                }`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className={`px-6 py-3 flex items-center gap-3 ${isDarkMode ? 'bg-red-900/30 border-b border-red-800' : 'bg-red-50 border-b border-red-200'
                            }`}>
                            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'
                                }`} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <div className="p-6 space-y-6">
                        {/* File upload area */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Select File *
                            </label>
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver
                                    ? (isDarkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50')
                                    : (isDarkMode ? 'border-gray-700 hover:border-gray-600 bg-gray-800' : 'border-gray-300 hover:border-gray-400 bg-gray-50')
                                    }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {uploadForm.file ? (
                                    <div className="flex flex-col items-center">
                                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                            }`}>
                                            {getFileIcon(uploadForm.file)}
                                        </div>
                                        <h3 className="font-semibold truncate max-w-full">
                                            {uploadForm.file.name}
                                        </h3>
                                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                            {formatFileSize(uploadForm.file.size)}
                                        </p>
                                        <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                            }`}>
                                            Click to change file
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                            }`} />
                                        <h3 className="font-semibold mb-2">Drag & drop your file</h3>
                                        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                            or click to browse from your computer
                                        </p>
                                        <button
                                            type="button"
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode
                                                ? 'bg-gray-700 text-white hover:bg-gray-600'
                                                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                                                }`}
                                        >
                                            Choose File
                                        </button>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </div>
                        </div>

                        {/* Document details */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Document Title *
                                </label>
                                <input
                                    type="text"
                                    value={uploadForm.title}
                                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Enter document title"
                                    disabled={uploading}
                                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        }`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={uploadForm.content}
                                    onChange={(e) => setUploadForm(prev => ({ ...prev, content: e.target.value }))}
                                    placeholder="Add a description (optional)"
                                    rows={3}
                                    disabled={uploading}
                                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${isDarkMode
                                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        }`}
                                />
                            </div>

                            {/* Sharing options */}
                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Share with (optional)
                                </label>
                                <select
                                    value={shareWith}
                                    onChange={(e) => setShareWith(e.target.value)}
                                    disabled={uploading}
                                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        }`}
                                >
                                    <option value="">Don't share</option>
                                    <option value="all-users">All Users</option>
                                    <option value="all-managers">All Managers</option>
                                    <option value="all">Everyone</option>
                                </select>
                                {shareWith && (
                                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        This document will be shared with {shareWith === 'all' ? 'everyone' : shareWith === 'all-users' ? 'all users' : 'all managers'} after upload.
                                    </p>
                                )}
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Tags
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={currentTag}
                                        onChange={(e) => setCurrentTag(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        placeholder="Add a tag"
                                        disabled={uploading}
                                        className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={addTag}
                                        disabled={!currentTag.trim() || uploading}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode
                                            ? 'bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50'
                                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:opacity-50'
                                            }`}
                                    >
                                        Add
                                    </button>
                                </div>
                                {uploadForm.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {uploadForm.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                <Tag className="w-3 h-3" />
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    disabled={uploading}
                                                    className="hover:text-red-500 disabled:opacity-50"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isPublic"
                                        checked={uploadForm.isPublic}
                                        onChange={(e) => setUploadForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                                        disabled={uploading}
                                        className={`w-4 h-4 rounded ${isDarkMode
                                            ? 'bg-gray-800 border-gray-700 text-blue-500 focus:ring-blue-500'
                                            : 'border-gray-300 text-blue-600 focus:ring-blue-500'
                                            }`}
                                    />
                                    <label htmlFor="isPublic" className="ml-2 text-sm font-medium">
                                        Make this document public
                                    </label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={uploading}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode
                                            ? 'bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50'
                                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:opacity-50'
                                            }`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleUpload}
                                        disabled={!uploadForm.title.trim() || !uploadForm.file || uploading}
                                        className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${isDarkMode
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                                            : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50'
                                            }`}
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                Upload
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentsPage;