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
    const [deletingDocs, setDeletingDocs] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [recentFiles, setRecentFiles] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    const canManage = user && (user.role === 'admin' || user.role === 'manager');
    const canUpload = user; // All authenticated users can upload documents

    useEffect(() => {
        const fetchDocuments = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await get('/documents');
                const enhancedData = data.map(doc => ({
                    ...doc,
                    sharedWith: Array.isArray(doc.sharedWith) ? doc.sharedWith.map(item =>
                        item.user ? item : { user: item }
                    ) : [],
                    collaborators: Array.isArray(doc.collaborators) ? doc.collaborators : [],
                    author: doc.author || { name: 'Unknown', _id: null }
                }));
                setDocuments(enhancedData);
            } catch (err) {
                console.error('Error fetching documents:', err);
                setError('Failed to load documents');
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

    useEffect(() => {
        if (documents.length > 0) {
            try {
                localStorage.setItem('documents_cache', JSON.stringify(documents));
            } catch (e) {
                console.warn('Failed to cache documents:', e);
            }
        }
    }, [documents]);

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
        if (files.length > 0 && canUpload) {
            setShowUploadModal(true);
        }
    }, [canManage]);

    const filteredDocuments = documents
        .filter(doc => {
            if (filter === 'owned') {
                return doc.author?._id === user?.id || doc.author?.id === user?.id;
            } else if (filter === 'shared') {
                const isSharedWithUser = doc.sharedWith?.some(sharedUser =>
                    sharedUser.user?._id === user?.id || sharedUser.user?.id === user?.id
                );
                const isCollaborator = doc.collaborators?.some(collab =>
                    collab.user?._id === user?.id || collab.user?.id === user?.id
                );
                const isPublic = doc.isPublic && (
                    doc.shareType === 'all' ||
                    (doc.shareType === 'all-users' && user?.role !== 'admin' && user?.role !== 'manager') ||
                    (doc.shareType === 'all-managers' && (user?.role === 'admin' || user?.role === 'manager'))
                );
                const isOwner = doc.author?._id === user?.id || doc.author?.id === user?.id;
                return (isSharedWithUser || isCollaborator || isPublic) && !isOwner;
            }

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
                    const aSize = a.attachments?.[0]?.size || 0;
                    const bSize = b.attachments?.[0]?.size || 0;
                    return sortOrder === 'desc' ? bSize - aSize : aSize - bSize;
                case 'owner':
                    aVal = a.author?.name || '';
                    bVal = b.author?.name || '';
                    break;
                default:
                    aVal = new Date(a.updatedAt || a.createdAt);
                    bVal = new Date(b.updatedAt || b.createdAt);
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

    const [uploadForm, setUploadForm] = useState({
        title: '',
        description: '',
        file: null,
        sendTo: '',
        forGroup: ''
    });
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [showUserPicker, setShowUserPicker] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadForm(prev => ({
                ...prev,
                file,
                title: file.name.replace(/\.[^/.]+$/, '')
            }));
        }
    };

    const handleUploadSubmit = async () => {
        if (!uploadForm.file || !uploadForm.title.trim()) {
            addNotification({
                type: 'error',
                title: 'Missing information',
                message: 'Please select a file and enter a title'
            });
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', uploadForm.file);
            formData.append('title', uploadForm.title);
            formData.append('content', uploadForm.description);

            formData.append('type', getFileType(uploadForm.file.type));
            formData.append('sendTo', uploadForm.sendTo);
            formData.append('forGroup', uploadForm.forGroup);
            
            const response = await fetch('http://localhost:5000/api/documents', {
                method: 'POST',
                headers: {
                    'x-auth-token': localStorage.getItem('token')
                },
                body: formData
            });
            
            if (response.ok) {
                const newDoc = await response.json();
                setDocuments(prev => [newDoc, ...prev]);
                setShowUploadModal(false);
                setUploadForm({ title: '', description: '', file: null, sendTo: '', forGroup: '' });
                addNotification({
                    type: 'success',
                    title: 'Upload successful',
                    message: 'Document uploaded successfully'
                });
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            addNotification({
                type: 'error',
                title: 'Upload failed',
                message: 'Failed to upload document'
            });
        } finally {
            setUploading(false);
        }
    };
    
    const fetchUsersForPicker = async () => {
        setLoadingUsers(true);
        try {
            const response = await fetch('http://localhost:5000/api/auth/users', {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            
            if (response.ok) {
                const allUsers = await response.json();
                console.log('All users:', allUsers);
                console.log('Current user:', user);
                const filteredUsers = allUsers.filter(u => 
                    u._id !== user?._id
                );
                console.log('Filtered users:', filteredUsers);
                setAvailableUsers(filteredUsers);
            } else {
                console.error('Failed to fetch users:', response.status);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setAvailableUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    };

    const selectUserForSharing = (selectedUser) => {
        const userName = selectedUser.name || selectedUser.username;
        const currentSelected = uploadForm.forGroup ? uploadForm.forGroup.split(', ').filter(v => v) : [];
        const isSelected = currentSelected.includes(userName);
        
        let newSelected;
        if (isSelected) {
            newSelected = currentSelected.filter(v => v !== userName);
        } else {
            newSelected = [...currentSelected, userName];
        }
        
        setUploadForm(prev => ({ ...prev, forGroup: newSelected.join(', ') }));
    };

    const getFileType = (mimeType) => {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType === 'application/pdf') return 'pdf';
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'excel';
        return 'document';
    };

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

    const handleDeleteDocument = async (docId) => {
        if (!canManage) return;

        const docToDelete = documents.find(doc => doc._id === docId);
        const docTitle = docToDelete?.title || 'this document';

        const confirmed = window.confirm(
            `Are you sure you want to permanently delete "${docTitle}"? This action cannot be undone and the document will be removed from the database.`
        );
        if (!confirmed) return;

        try {
            setDeletingDocs(prev => [...prev, docId]);

            const isAlreadyDeleted = docToDelete?.deleted;

            if (isAlreadyDeleted) {
                await deleteRequest(`/documents/trash/${docId}`);
            } else {
                await deleteRequest(`/documents/${docId}`);
                await deleteRequest(`/documents/trash/${docId}`);
            }

            setDocuments(prev => prev.filter(doc => doc._id !== docId));
            setDeletingDocs(prev => prev.filter(id => id !== docId));
            addNotification({
                type: 'success',
                title: 'Document deleted',
                message: `"${docTitle}" has been permanently deleted from the database`
            });
        } catch (err) {
            console.error('Error deleting document:', err);
            setDeletingDocs(prev => prev.filter(id => id !== docId));
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
            setDeletingDocs(prev => [...prev, ...selectedDocs]);

            let successCount = 0;
            const errors = [];

            for (const id of selectedDocs) {
                try {
                    const docToDelete = documents.find(doc => doc._id === id);
                    const isAlreadyDeleted = docToDelete?.deleted;

                    if (isAlreadyDeleted) {
                        await deleteRequest(`/documents/trash/${id}`);
                    } else {
                        await deleteRequest(`/documents/${id}`);
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
            setDeletingDocs(prev => prev.filter(id => !selectedDocs.includes(id)));

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
            setDeletingDocs(prev => prev.filter(id => !selectedDocs.includes(id)));
            addNotification({
                type: 'error',
                title: 'Delete failed',
                message: 'Failed to permanently delete documents'
            });
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

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

    const toggleFavorite = (docId) => {
        setFavorites(prev => 
            prev.includes(docId) 
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        );
    };

    const addToRecent = (doc) => {
        setRecentFiles(prev => {
            const filtered = prev.filter(d => d._id !== doc._id);
            return [doc, ...filtered].slice(0, 10);
        });
    };

    const openPreview = (doc) => {
        setPreviewDoc(doc);
        setShowPreview(true);
        addToRecent(doc);
    };

    const getThumbnail = (doc) => {
        const attachment = doc.attachments?.[0];
        if (attachment?.mimeType?.startsWith('image/')) {
            return attachment.url;
        }
        return null;
    };

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
            className={`min-h-screen font-['Inter'] ${isDarkMode
                ? 'bg-black text-white'
                : 'bg-white text-black'
                }`}
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="p-6 lg:p-8">
                {dragOver && canUpload && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
                        <div className={`p-12 rounded-2xl border-2 border-dashed ${isDarkMode ? 'bg-gray-800 border-blue-500' : 'bg-white border-blue-400'}`}>
                            <Upload className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                            <h3 className="text-2xl font-bold text-center mb-2">Drop files here</h3>
                            <p className="text-center">Release to upload your documents</p>
                        </div>
                    </div>
                )}

                <div className="mb-12">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-10">
                        <div className="flex items-start gap-6">
                            <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl ${isDarkMode 
                                ? 'bg-gray-800 border border-gray-700' 
                                : 'bg-gray-100 border border-gray-300'
                            }`}>
                                <FolderOpen className={`w-10 h-10 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">{filteredDocuments.length}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h1 className={`text-4xl lg:text-5xl font-black leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    Documents
                                </h1>
                                <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Organize, share, and collaborate on your files
                                </p>
                                <div className="flex items-center gap-4 text-sm">
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        <span className="font-semibold">{filteredDocuments.length} documents</span>
                                    </div>
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                        <Users className="w-3 h-3" />
                                        <span>Team workspace</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {canUpload && (
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className={`group flex items-center gap-3 px-6 py-3.5 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] ${isDarkMode
                                    ? 'bg-white text-black hover:bg-gray-100'
                                    : 'bg-black text-white hover:bg-gray-900'
                                }`}
                            >
                                <Upload className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                Upload Document
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="relative flex-1 max-w-2xl">
                            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                            <input
                                type="text"
                                placeholder="Search documents, descriptions, tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full pl-12 pr-6 py-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 ${isDarkMode
                                    ? 'bg-black border-gray-700 text-white placeholder-gray-400'
                                    : 'bg-white border-gray-300 text-black placeholder-gray-400'
                                }`}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className={`flex items-center rounded-2xl p-1 border-2 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}>
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

                            <div className={`flex items-center rounded-2xl p-1 border-2 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}>
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

                {loading && (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {error && (
                    <div className={`p-6 rounded-xl mb-6 flex items-center gap-4 ${isDarkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                        <AlertCircle className={`w-6 h-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                        <div>
                            <h3 className="font-semibold">Error loading documents</h3>
                            <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
                        </div>
                    </div>
                )}

                {!loading && (
                    <>
                        {filteredDocuments.length === 0 ? (
                            <div className="text-center py-20">
                                <FolderOpen className={`w-20 h-20 mx-auto mb-6 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                                <h3 className="text-2xl font-bold mb-2">No documents found</h3>
                                <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {searchQuery ? 'Try adjusting your search' : 'Get started by uploading your first document'}
                                </p>
                                {canUpload && (
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
                        ) : (
                            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
                                {filteredDocuments.map((doc) => (
                                    <div key={doc._id} className={`group relative rounded-xl border transition-all duration-200 hover:shadow-lg ${isDarkMode ? 'bg-gray-900 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`p-3 rounded-lg ${getFileTypeColor(doc.type)}`}>
                                                    {getFileTypeIcon(doc.type)}
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                                                        <Share2 className="w-4 h-4" />
                                                    </button>
                                                    {canManage && (
                                                        <button 
                                                            onClick={() => handleDeleteDocument(doc._id)}
                                                            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-red-900 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <h3 className={`font-semibold mb-2 truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{doc.title}</h3>
                                            <p className={`text-sm mb-3 line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{doc.content || 'No description'}</p>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{formatFileSize(doc.attachments?.[0]?.size)}</span>
                                                <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 z-50 flex">
                        <div className="w-1/2 h-full" onClick={() => setShowUploadModal(false)} />
                        <div className={`w-1/2 h-full ${isDarkMode ? 'bg-gray-900' : 'bg-white'} shadow-2xl overflow-y-auto`}>
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Upload Document</h2>
                                    <button
                                        onClick={() => setShowUploadModal(false)}
                                        className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <div className="space-y-6">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Title *</label>
                                        <input
                                            type="text"
                                            value={uploadForm.title}
                                            onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                                            className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                            placeholder="Enter document title"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Description</label>
                                        <textarea
                                            value={uploadForm.description}
                                            onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                                            rows={4}
                                            className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                            placeholder="Enter document description"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Share with</label>
                                        <input
                                            type="text"
                                            value={uploadForm.forGroup}
                                            onChange={(e) => setUploadForm(prev => ({ ...prev, forGroup: e.target.value }))}
                                            className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                            placeholder="Type usernames separated by commas (e.g., john, mary, alex)"
                                        />
                                    </div>

                                    {canManage && (
                                        <>
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Send To</label>
                                                <select
                                                    value={uploadForm.sendTo}
                                                    onChange={(e) => setUploadForm(prev => ({ ...prev, sendTo: e.target.value }))}
                                                    className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                >
                                                    <option value="">Select recipient</option>
                                                    <option value="all">All Users</option>
                                                    <option value="managers">All Managers</option>
                                                    <option value="users">All Regular Users</option>
                                                    <option value="specific">Specific User</option>
                                                </select>
                                            </div>
                                            
                                            <div className="relative">
                                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>For</label>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-wrap gap-1 flex-1 min-h-[48px] px-4 py-3 rounded-lg border items-center" style={{backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#d1d5db'}}>
                                                        {uploadForm.forGroup ? (
                                                            uploadForm.forGroup.split(', ').filter(p => p).map((person, index) => (
                                                                <span key={index} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                                                    {person}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No people selected</span>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowUserPicker(!showUserPicker);
                                                            if (!showUserPicker) fetchUsersForPicker();
                                                        }}
                                                        className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                                                    >
                                                        Pick
                                                    </button>
                                                </div>
                                                
                                                {/* User Picker Dropdown */}
                                                {showUserPicker && (
                                                    <div className={`absolute top-full left-0 right-0 mt-2 z-50 w-full border rounded-xl shadow-xl max-h-64 overflow-y-auto ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                                                        <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                                            <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                                Select People to Share With
                                                            </span>
                                                        </div>
                                                        {loadingUsers ? (
                                                            <div className={`p-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                                                <span className="text-sm">Loading users...</span>
                                                            </div>
                                                        ) : availableUsers.length > 0 ? (
                                                            <div className="py-1.5">
                                                                {availableUsers.map((user) => {
                                                                    const userName = user.name || user.username;
                                                                    const isSelected = uploadForm.forGroup && uploadForm.forGroup.split(', ').includes(userName);
                                                                    
                                                                    return (
                                                                        <button
                                                                            key={user._id || user.username}
                                                                            onClick={() => selectUserForSharing(user)}
                                                                            className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                                                                                isSelected 
                                                                                    ? (isDarkMode ? 'bg-blue-900/30 border-l-4 border-blue-500' : 'bg-blue-50 border-l-4 border-blue-500')
                                                                                    : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50')
                                                                            }`}
                                                                        >
                                                                            <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                                                                {userName.charAt(0).toUpperCase()}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className={`text-sm font-medium truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                                                                    {userName}
                                                                                </div>
                                                                                <div className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                                    {user.email} • {user.role}
                                                                                </div>
                                                                            </div>
                                                                            {isSelected && (
                                                                                <div className="text-blue-500">
                                                                                    <CheckCircle className="w-4 h-4" />
                                                                                </div>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                                <div className={`px-4 py-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                                                                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                        Click to select/deselect people
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setShowUserPicker(false)}
                                                                        className={`px-3 py-1 text-xs rounded ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
                                                                    >
                                                                        Confirm
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className={`p-6 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                No users available
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>File *</label>
                                        <div className={`border-2 border-dashed rounded-lg p-8 text-center ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
                                            {uploadForm.file ? (
                                                <div className="space-y-2">
                                                    <div className={`p-3 rounded-lg inline-block ${getFileTypeColor(getFileType(uploadForm.file.type))}`}>
                                                        {getFileTypeIcon(getFileType(uploadForm.file.type))}
                                                    </div>
                                                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{uploadForm.file.name}</p>
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatFileSize(uploadForm.file.size)}</p>
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                                                    >
                                                        Change file
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <Upload className={`w-12 h-12 mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                                                    <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Choose a file to upload</p>
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="text-blue-500 hover:text-blue-600 font-medium"
                                                    >
                                                        Browse files
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 mt-8">
                                    <button
                                        onClick={() => setShowUploadModal(false)}
                                        className={`flex-1 px-6 py-3 rounded-lg font-medium ${isDarkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUploadSubmit}
                                        disabled={uploading || !uploadForm.file || !uploadForm.title.trim()}
                                        className={`flex-1 px-6 py-3 rounded-lg font-medium text-white ${uploading || !uploadForm.file || !uploadForm.title.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                                    >
                                        {uploading ? 'Uploading...' : 'Upload Document'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                

                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="*/*"
                />
            </div>
        </div>
    );
};

export default DocumentsPage;