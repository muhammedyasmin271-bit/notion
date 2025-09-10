import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Plus, Search, Trash as TrashIcon, Edit2, Download, Share, User, Upload, Link, Image, Video, FileSpreadsheet, Globe, CheckCircle, Filter, Grid, List, Eye, Star, Clock, TrendingUp, Users, FolderOpen, Archive, Copy, Move, Tag, Calendar, BarChart3, Zap, Shield, AlertCircle, RefreshCw, SortAsc, SortDesc, ChevronDown, X, Maximize2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { addNotification } from '../../utils/notifications';
import { get, post, put, deleteRequest, upload } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import EnhancedUploadModal from './EnhancedUploadModal';

const DocumentsPage = () => {
  const { user } = useAppContext();
  const { isDarkMode } = useTheme();
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterOwner, setFilterOwner] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [sortBy, setSortBy] = useState('lastModified');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    file: null,
    permission: 'for-user',
    tags: []
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingDocument, setSharingDocument] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const canManage = !!(user && (user.role === 'admin' || user.role === 'manager' || user.isAdmin));

  // Cache helpers
  const CACHE_KEY = 'documents_cache_v1';
  const readCache = () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeCache = (docs) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(docs || []));
    } catch {}
  };

  // Drag and Drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
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
      setUploadForm(prev => ({ ...prev, file: files[0], name: files[0].name.replace(/\.[^/.]+$/, '') }));
      setShowUploadModal(true);
    }
  }, [canManage]);

  // Enhanced filtering and sorting
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesOwner = filterOwner === 'all' || doc.owner === filterOwner;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    
    let matchesDate = true;
    if (filterDate !== 'all') {
      const docDate = new Date(doc.lastModified);
      const now = new Date();
      const daysDiff = Math.floor((now - docDate) / (1000 * 60 * 60 * 24));
      
      switch (filterDate) {
        case 'today': matchesDate = daysDiff === 0; break;
        case 'week': matchesDate = daysDiff <= 7; break;
        case 'month': matchesDate = daysDiff <= 30; break;
        case 'year': matchesDate = daysDiff <= 365; break;
      }
    }
    
    return matchesSearch && matchesType && matchesOwner && matchesStatus && matchesDate;
  }).sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
      case 'type': aVal = a.type; bVal = b.type; break;
      case 'owner': aVal = a.owner; bVal = b.owner; break;
      case 'size': aVal = a.size; bVal = b.size; break;
      case 'status': aVal = a.status; bVal = b.status; break;
      default: aVal = new Date(a.lastModified); bVal = new Date(b.lastModified);
    }
    
    if (sortBy === 'lastModified') {
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    }
    
    if (aVal < bVal) return sortOrder === 'desc' ? 1 : -1;
    if (aVal > bVal) return sortOrder === 'desc' ? -1 : 1;
    return 0;
  });

  // Bulk operations
  const handleSelectAll = () => {
    if (selectedDocs.length === filteredDocuments.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(filteredDocuments.map(doc => doc.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!canManage || selectedDocs.length === 0) return;
    const confirmed = window.confirm(`Delete ${selectedDocs.length} documents permanently?`);
    if (!confirmed) return;
    
    try {
      await Promise.all(selectedDocs.map(id => deleteRequest(`/documents/${id}`)));
      setDocuments(prev => prev.filter(doc => !selectedDocs.includes(doc.id)));
      setSelectedDocs([]);
      addNotification({ type: 'success', title: 'Documents deleted', message: `${selectedDocs.length} documents deleted successfully` });
    } catch (error) {
      addNotification({ type: 'error', title: 'Delete failed', message: 'Failed to delete some documents' });
    }
  };

  const handleBulkShare = async (shareType) => {
    if (!canManage || selectedDocs.length === 0) return;
    
    try {
      await Promise.all(selectedDocs.map(id => post(`/documents/${id}/share`, { shareType })));
      setSelectedDocs([]);
      addNotification({ type: 'success', title: 'Documents shared', message: `${selectedDocs.length} documents shared successfully` });
    } catch (error) {
      addNotification({ type: 'error', title: 'Share failed', message: 'Failed to share some documents' });
    }
  };

  // Owner avatar helpers
  const ownerInitials = (name) => {
    if (!name) return '??';
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase() || first.toUpperCase();
  };

  const getOwnerColor = (name) => {
    const colors = [
      'bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500', 'bg-teal-500'
    ];
    let hash = 0;
    for (let i = 0; i < String(name || '').length; i++) hash = (hash + String(name)[i].charCodeAt(0)) % colors.length;
    return colors[hash];
  };

  // Type helpers
  const getTypeColor = (type) => {
    switch (type) {
      case 'PDF': return 'bg-red-100 text-red-800 border-red-200';
      case 'Excel': return 'bg-green-100 text-green-800 border-green-200';
      case 'PowerPoint': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Word': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Image': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Video': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Link': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'PDF': return <FileText className="h-5 w-5" />;
      case 'Excel': return <FileSpreadsheet className="h-5 w-5" />;
      case 'PowerPoint': return <FileText className="h-5 w-5" />;
      case 'Word': return <FileText className="h-5 w-5" />;
      case 'Image': return <Image className="h-5 w-5" />;
      case 'Video': return <Video className="h-5 w-5" />;
      case 'Link': return <Globe className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Published': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatBytes = (bytes) => {
    if (!bytes || typeof bytes !== 'number') return 'N/A';
    return bytes > 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  // Upload handler
  const handleUpload = async () => {
    if (!canManage) {
      addNotification({ type: 'error', title: 'Permission denied', message: 'You do not have permission to upload documents.' });
      return;
    }
    
    let docName = uploadForm.name && uploadForm.name.trim()
      ? uploadForm.name.trim()
      : (uploadForm.file ? (uploadForm.file.name.replace(/\.[^/.]+$/, '')) : '');
    
    if (!docName) {
      addNotification({ type: 'error', title: 'Missing information', message: 'Please enter a document name or choose a file' });
      return;
    }

    try {
      const payload = {
        title: docName || 'Untitled Document',
        content: uploadForm.description || '',
        isPublic: uploadForm.permission === 'for-all',
        tags: uploadForm.tags || []
      };
      
      const created = await post('/documents', payload);
      const mapped = {
        id: created._id,
        name: created.title,
        type: created.type || 'Document',
        owner: (created.author && (created.author.name || created.author.email)) || (user?.name || 'Me'),
        size: 'N/A',
        lastModified: created.updatedAt || created.createdAt || new Date().toISOString(),
        status: created.status || 'Draft',
        description: created.content || '',
        url: '',
        attachments: [],
        tags: created.tags || [],
        permission: created.isPublic ? 'for-all' : undefined,
      };

      // If a file is selected, upload it as an attachment
      if (uploadForm.file) {
        const formData = new FormData();
        formData.append('file', uploadForm.file);
        try {
          const resp = await upload(`/documents/${created._id}/attachments`, formData);
          if (resp && resp.attachment) {
            mapped.url = resp.attachment.url || '';
            const bytes = resp.attachment.size || 0;
            mapped.size = bytes > 1024 * 1024
              ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
              : `${Math.max(1, Math.round(bytes / 1024))} KB`;
            
            const mt = (resp.attachment.mimeType || '').toLowerCase();
            if (mt.includes('pdf')) mapped.type = 'PDF';
            else if (mt.includes('image')) mapped.type = 'Image';
            else if (mt.includes('video')) mapped.type = 'Video';
            else if (mt.includes('spreadsheet') || mt.includes('excel')) mapped.type = 'Excel';
            else if (mt.includes('word')) mapped.type = 'Word';
            
            mapped.attachments = [{
              url: resp.attachment.url,
              size: resp.attachment.size,
              mimeType: resp.attachment.mimeType,
              filename: resp.attachment.filename,
              originalName: resp.attachment.originalName,
            }];
          }
        } catch (uploadErr) {
          console.error('Attachment upload failed', uploadErr);
        }
      }
      
      const nextDocs = [...documents, mapped];
      setDocuments(nextDocs);
      writeCache(nextDocs);
      
      setUploadForm({
        name: '',
        description: '',
        file: null,
        permission: 'for-user',
        tags: []
      });
      
      addNotification({ type: 'success', title: 'Document uploaded', message: 'Document uploaded successfully!' });
    } catch (e) {
      console.error('Error creating document', e);
      addNotification({ type: 'error', title: 'Upload failed', message: e.message || 'Failed to create document' });
    }
  };

  // Delete handler
  const handleDeleteDocument = async (docId) => {
    if (!canManage) {
      addNotification({ type: 'error', title: 'Permission denied', message: 'You do not have permission to delete documents.' });
      return;
    }
    
    const confirmed = window.confirm('Delete this document permanently? This cannot be undone.');
    if (!confirmed) return;
    
    try {
      await deleteRequest(`/documents/${docId}`);
      await deleteRequest(`/documents/trash/${docId}`);
      const updatedDocs = documents.filter(doc => doc.id !== docId);
      setDocuments(updatedDocs);
      writeCache(updatedDocs);
      addNotification({ type: 'success', title: 'Document deleted', message: 'Document deleted successfully' });
    } catch (e) {
      console.error('Error deleting document', e);
      addNotification({ type: 'error', title: 'Delete failed', message: 'Failed to delete document' });
    }
  };

  // Toggle public/private
  const togglePublic = async (doc) => {
    try {
      const makePublic = doc.permission !== 'for-all';
      await put(`/documents/${doc.id}`, { isPublic: makePublic });
      setDocuments((prev) => {
        const updated = prev.map(d => d.id === doc.id ? { ...d, permission: makePublic ? 'for-all' : 'for-user' } : d);
        writeCache(updated);
        return updated;
      });
      addNotification({
        type: 'success',
        title: makePublic ? 'Document made public' : 'Document made private',
        message: makePublic ? 'All users can now see and download this document.' : 'Visibility limited to non-public again.'
      });
    } catch (e) {
      console.error('Failed to toggle public', e);
      addNotification({ type: 'error', title: 'Update failed', message: 'Failed to update visibility' });
    }
  };

  // Share handler
  const handleShareDocument = (document) => {
    setSharingDocument(document);
    setShowShareModal(true);
  };

  const handleShareWithGroup = async (shareType) => {
    if (!sharingDocument) return;
    
    try {
      await post(`/documents/${sharingDocument.id}/share`, { shareType });
      const recp = shareType === 'all-managers' ? 'All Managers' : shareType === 'all-users' ? 'All Users' : 'All Users & Managers';
      addNotification({ type: 'success', title: 'Document shared', message: `Document shared successfully with ${recp}!` });
      
      setDocuments((prev) => prev.map(d => {
        if (d.id !== sharingDocument.id) return d;
        if (shareType === 'all') return { ...d, permission: 'for-all' };
        if (shareType === 'all-users') return { ...d, permission: 'for-user' };
        if (shareType === 'all-managers') return { ...d, permission: 'for-manager' };
        return d;
      }));

      setShowShareModal(false);
      setSharingDocument(null);
    } catch (error) {
      console.error('Error sharing document:', error);
      addNotification({ type: 'error', title: 'Share failed', message: 'Failed to share document. Please try again.' });
    }
  };

  // Load documents
  useEffect(() => {
    const mapFromApi = (d) => {
      const atts = Array.isArray(d.attachments) ? d.attachments : [];
      const first = atts[0] || null;
      let derivedType = d.type || 'Document';
      if (first && first.mimeType) {
        const mt = first.mimeType.toLowerCase();
        if (mt.includes('pdf')) derivedType = 'PDF';
        else if (mt.includes('image')) derivedType = 'Image';
        else if (mt.includes('video')) derivedType = 'Video';
        else if (mt.includes('spreadsheet') || mt.includes('excel')) derivedType = 'Excel';
        else if (mt.includes('word')) derivedType = 'Word';
      }
      const totalBytes = atts.reduce((sum, a) => sum + (typeof a.size === 'number' ? a.size : 0), 0);
      const sizeStr = totalBytes > 0
        ? (totalBytes > 1024 * 1024
            ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
            : `${Math.max(1, Math.round(totalBytes / 1024))} KB`)
        : 'N/A';
      return {
        id: d._id,
        name: d.title,
        type: derivedType,
        owner: (d.author && (d.author.name || d.author.email)) || 'Me',
        size: sizeStr,
        lastModified: d.updatedAt || d.createdAt || new Date().toISOString(),
        status: d.status || 'Draft',
        description: d.content || '',
        url: first?.url || '',
        attachments: atts.map(a => ({
          url: a.url,
          size: a.size,
          mimeType: a.mimeType,
          filename: a.filename,
          originalName: a.originalName
        })),
        tags: d.tags || [],
        permission: d.isPublic ? 'for-all' : undefined,
      };
    };

    const cached = readCache();
    if (cached.length > 0) setDocuments(cached);

    const fetchDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await get('/documents');
        const mapped = Array.isArray(data) ? data.map(mapFromApi) : [];
        setDocuments(mapped);
        writeCache(mapped);
      } catch (e) {
        console.error('Failed to load documents', e);
        const msg = (e && e.message) ? e.message : '';
        setError(msg && msg.toLowerCase().includes('server error') ? 'Failed to load documents.' : (msg || 'Failed to load documents.'));
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  return (
    <div 
      className={`content p-4 lg:p-6 font-sans min-h-screen relative ${
        isDarkMode ? 'bg-black/60 text-white backdrop-blur-sm' : 'bg-white/60 text-gray-900 backdrop-blur-sm'
      }`}
      style={{
        backgroundImage: "url('/documents-bg.jpg')",
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundAttachment: 'fixed'
      }}
      ref={dropZoneRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {dragOver && canManage && (
        <div className="fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center">
          <div className={`p-12 rounded-3xl border-4 border-dashed border-blue-500 ${
            isDarkMode ? 'bg-gray-900/90' : 'bg-white/90'
          }`}>
            <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-blue-500 text-center">Drop files here to upload</h3>
          </div>
        </div>
      )}

      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mr-6 shadow-2xl border-2 ${
              isDarkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
            }`}>
              <FolderOpen className={`w-10 h-10 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
            <div>
              <h1 className={`text-5xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Documents</h1>
              <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage and organize your files • {filteredDocuments.length} documents
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`flex items-center px-6 py-3 text-sm font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 ${
                showAnalytics 
                  ? (isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                  : (isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </button>
            {canManage && (
              <button
                onClick={() => setShowUploadModal(true)}
                className={`flex items-center px-8 py-4 text-base font-bold rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 ${
                  isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'
                }`}
              >
                <Upload className="w-5 h-5 mr-3" />
                Upload Document
              </button>
            )}
          </div>
        </div>

        {/* Analytics Panel */}
        {showAnalytics && (
          <div className={`mb-8 p-8 rounded-3xl shadow-2xl border-2 ${
            isDarkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{documents.length}</p>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Files</p>
                  </div>
                  <FileText className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
              </div>
              <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {documents.filter(d => d.status === 'Published').length}
                    </p>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Published</p>
                  </div>
                  <CheckCircle className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
              </div>
              <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {new Set(documents.map(d => d.owner)).size}
                    </p>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Contributors</p>
                  </div>
                  <Users className={`h-8 w-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
              </div>
              <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {documents.filter(d => {
                        const daysDiff = Math.floor((new Date() - new Date(d.lastModified)) / (1000 * 60 * 60 * 24));
                        return daysDiff <= 7;
                      }).length}
                    </p>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>This Week</p>
                  </div>
                  <TrendingUp className={`h-8 w-8 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Controls */}
        <div className="space-y-6">
          {/* Search and View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search documents, descriptions, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-12 pr-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-96 text-base border-2 transition-all duration-200 ${
                    isDarkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
              
              <div className={`flex items-center rounded-2xl p-1 border-2 ${
                isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
              }`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white')
                      : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    viewMode === 'list' 
                      ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white')
                      : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black')
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {selectedDocs.length > 0 && canManage && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 ${
                  isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                }`}>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {selectedDocs.length} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleBulkShare('all')}
                    className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    <Share className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {filteredDocuments.length} of {documents.length} documents
              </span>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm border-2 ${
                isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Types</option>
              <option value="PDF">PDF Files</option>
              <option value="Image">Images</option>
              <option value="Video">Videos</option>
              <option value="Excel">Excel</option>
              <option value="Word">Word</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm border-2 ${
                isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Status</option>
              <option value="Draft">Draft</option>
              <option value="In Review">In Review</option>
              <option value="Published">Published</option>
            </select>

            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className={`px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm border-2 ${
                isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm border-2 ${
                  isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="lastModified">Last Modified</option>
                <option value="name">Name</option>
                <option value="type">Type</option>
                <option value="owner">Owner</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                  isDarkMode ? 'bg-gray-900 border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                }`}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>

            {canManage && (
              <button
                onClick={handleSelectAll}
                className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                  selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0
                    ? (isDarkMode ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-600 border-blue-600 text-white')
                    : (isDarkMode ? 'bg-gray-900 border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50')
                }`}
              >
                {selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0 ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6 mb-6`}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`rounded-3xl border-2 overflow-hidden animate-pulse ${
              isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <div className="h-2 w-full bg-gradient-to-r from-slate-300 to-gray-300" />
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-300/50" />
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-gray-300/60 rounded w-2/3" />
                    <div className="h-3 bg-gray-300/40 rounded w-1/3" />
                  </div>
                </div>
                <div className="h-3 bg-gray-300/40 rounded w-full" />
                <div className="h-3 bg-gray-300/40 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents Display */}
      {!loading && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredDocuments.map((doc) => (
                <DocumentCard 
                  key={doc.id} 
                  doc={doc} 
                  isDarkMode={isDarkMode}
                  canManage={canManage}
                  selectedDocs={selectedDocs}
                  setSelectedDocs={setSelectedDocs}
                  onEdit={() => {}}
                  onDelete={() => handleDeleteDocument(doc.id)}
                  onPreview={(doc) => {
                    setPreviewDoc(doc);
                    setShowPreview(true);
                  }}
                  onShare={() => handleShareDocument(doc)}
                  onTogglePublic={() => togglePublic(doc)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
                <DocumentListItem 
                  key={doc.id} 
                  doc={doc} 
                  isDarkMode={isDarkMode}
                  canManage={canManage}
                  selectedDocs={selectedDocs}
                  setSelectedDocs={setSelectedDocs}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && filteredDocuments.length === 0 && (
        <div className="text-center py-20">
          <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-8 ${
            isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
          }`}>
            <FolderOpen className={`w-16 h-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
          <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            No documents found
          </h3>
          <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {documents.length === 0 ? 'Get started by uploading your first document' : 'Try adjusting your filters or search terms'}
          </p>
          {canManage && (
            <button
              onClick={() => setShowUploadModal(true)}
              className={`inline-flex items-center px-8 py-4 text-base font-bold rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 ${
                isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'
              }`}
            >
              <Upload className="w-5 h-5 mr-3" />
              Upload Document
            </button>
          )}
        </div>
      )}

      {/* Enhanced Upload Modal */}
      <EnhancedUploadModal
        show={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
        isDarkMode={isDarkMode}
        uploadForm={uploadForm}
        setUploadForm={setUploadForm}
      />

      {/* Preview Modal */}
      {showPreview && previewDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className={`absolute inset-0 backdrop-blur-xl ${isDarkMode ? 'bg-black/90' : 'bg-white/90'}`} onClick={() => setShowPreview(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className={`w-full max-w-4xl max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden border-2 ${isDarkMode ? 'bg-black text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}>
              <div className={`flex items-center justify-between px-8 py-6 border-b-2 ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
                    <Eye className={`w-6 h-6 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{previewDoc.name}</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Document Preview</p>
                  </div>
                </div>
                <button onClick={() => setShowPreview(false)} className={`p-3 rounded-2xl transition-all duration-200 hover:scale-105 ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-black hover:bg-gray-300'}`}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Document Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Type:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'}`}>{previewDoc.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Size:</span>
                        <span className={isDarkMode ? 'text-white' : 'text-black'}>{previewDoc.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Owner:</span>
                        <span className={isDarkMode ? 'text-white' : 'text-black'}>{previewDoc.owner}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${previewDoc.status === 'Published' ? 'bg-green-100 text-green-800' : previewDoc.status === 'In Review' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{previewDoc.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Modified:</span>
                        <span className={isDarkMode ? 'text-white' : 'text-black'}>{new Date(previewDoc.lastModified).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Description</h3>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {previewDoc.description || 'No description available'}
                    </p>
                    {previewDoc.tags && previewDoc.tags.length > 0 && (
                      <div className="mt-6">
                        <h4 className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {previewDoc.tags.map((tag, idx) => (
                            <span key={idx} className={`px-3 py-1 text-xs font-medium rounded-full border ${isDarkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {previewDoc.url && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>File Access</h3>
                      <div className="flex gap-3">
                        <a href={previewDoc.url} target="_blank" rel="noopener noreferrer" className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View File
                        </a>
                        <a href={previewDoc.url} download className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-black hover:bg-gray-300'}`}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && sharingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-2xl p-8 w-full max-w-md mx-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Share Document</h3>
              <button onClick={() => setShowShareModal(false)} className={`transition-colors duration-200 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-6">
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                Share "<span className="font-semibold">{sharingDocument.name}</span>" with:
              </p>
              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => handleShareWithGroup('all-users')} className={`px-4 py-2 text-sm font-medium text-blue-600 rounded-lg transition-colors duration-200 text-left ${isDarkMode ? 'bg-blue-900/20 hover:bg-blue-900/30' : 'bg-blue-50 hover:bg-blue-100'}`}>
                  Share with All Users
                </button>
                <button onClick={() => handleShareWithGroup('all-managers')} className={`px-4 py-2 text-sm font-medium text-purple-600 rounded-lg transition-colors duration-200 text-left ${isDarkMode ? 'bg-purple-900/20 hover:bg-purple-900/30' : 'bg-purple-50 hover:bg-purple-100'}`}>
                  Share with All Managers
                </button>
                <button onClick={() => handleShareWithGroup('all')} className={`px-4 py-2 text-sm font-medium text-green-600 rounded-lg transition-colors duration-200 text-left ${isDarkMode ? 'bg-green-900/20 hover:bg-green-900/30' : 'bg-green-50 hover:bg-green-100'}`}>
                  Share with Everyone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Document Card Component
const DocumentCard = ({ doc, isDarkMode, canManage, selectedDocs, setSelectedDocs, onEdit, onDelete, onPreview, onShare, onTogglePublic }) => {
  const isSelected = selectedDocs.includes(doc.id);
  
  const toggleSelect = () => {
    if (isSelected) {
      setSelectedDocs(prev => prev.filter(id => id !== doc.id));
    } else {
      setSelectedDocs(prev => [...prev, doc.id]);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'PDF': return <FileText className="h-6 w-6" />;
      case 'Excel': return <FileSpreadsheet className="h-6 w-6" />;
      case 'Image': return <Image className="h-6 w-6" />;
      case 'Video': return <Video className="h-6 w-6" />;
      case 'Link': return <Globe className="h-6 w-6" />;
      default: return <FileText className="h-6 w-6" />;
    }
  };

  const ownerInitials = (name) => {
    if (!name) return '??';
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase() || first.toUpperCase();
  };

  const getOwnerColor = (name) => {
    const colors = [
      'bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500', 'bg-teal-500'
    ];
    let hash = 0;
    for (let i = 0; i < String(name || '').length; i++) hash = (hash + String(name)[i].charCodeAt(0)) % colors.length;
    return colors[hash];
  };

  return (
    <div className={`group relative rounded-3xl shadow-xl border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer ${
      isSelected 
        ? (isDarkMode ? 'bg-blue-900/50 border-blue-500 ring-2 ring-blue-500' : 'bg-blue-50 border-blue-500 ring-2 ring-blue-500')
        : (isDarkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300')
    }`}>
      {/* Type Color Bar */}
      <div className={`h-2 w-full ${
        doc.type === 'PDF' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
        doc.type === 'Excel' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
        doc.type === 'Image' ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500' :
        doc.type === 'Video' ? 'bg-gradient-to-r from-pink-500 to-rose-500' :
        'bg-gradient-to-r from-gray-400 to-gray-500'
      }`} />

      {/* Selection Checkbox */}
      {canManage && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSelect();
            }}
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
              isSelected 
                ? 'bg-blue-500 border-blue-500' 
                : (isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')
            }`}
          >
            {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
          </button>
        </div>
      )}



      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
            isDarkMode ? 'bg-white' : 'bg-black'
          }`}>
            {React.cloneElement(getTypeIcon(doc.type), { 
              className: `w-7 h-7 ${isDarkMode ? 'text-black' : 'text-white'}` 
            })}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-lg mb-2 truncate group-hover:text-blue-500 transition-colors ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {doc.name}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isDarkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}>
                {doc.type}
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {doc.size}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className={`text-sm leading-relaxed mb-4 line-clamp-3 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {doc.description || 'No description available'}
        </p>

        {/* Tags */}
        {doc.tags && doc.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {doc.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className={`px-2 py-1 text-xs font-medium rounded-lg border ${
                  isDarkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}>
                  #{tag}
                </span>
              ))}
              {doc.tags.length > 3 && (
                <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  +{doc.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`pt-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                getOwnerColor(doc.owner)
              }`}>
                {ownerInitials(doc.owner)}
              </div>
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {doc.owner}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date(doc.lastModified).toLocaleDateString()}
                </p>
              </div>
            </div>
            {doc.status !== 'Draft' && (
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                doc.status === 'Published' ? 'bg-green-100 text-green-800' :
                doc.status === 'In Review' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {doc.status}
              </span>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 ${
                    isDarkMode ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </a>
              )}
              {canManage && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePublic();
                    }}
                    className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 ${
                      isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title={doc.permission === 'for-all' ? 'Make Private' : 'Make Public'}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {doc.permission === 'for-all' ? 'Private' : 'Public'}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 ${
                      isDarkMode ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    <TrashIcon className="h-3 w-3 mr-1" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Document List Item Component
const DocumentListItem = ({ doc, isDarkMode, canManage, selectedDocs, setSelectedDocs }) => {
  const isSelected = selectedDocs.includes(doc.id);
  
  const toggleSelect = () => {
    if (isSelected) {
      setSelectedDocs(prev => prev.filter(id => id !== doc.id));
    } else {
      setSelectedDocs(prev => [...prev, doc.id]);
    }
  };

  return (
    <div className={`flex items-center gap-6 p-6 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg ${
      isSelected 
        ? (isDarkMode ? 'bg-blue-900/50 border-blue-500' : 'bg-blue-50 border-blue-500')
        : (isDarkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300')
    }`}>
      {canManage && (
        <button
          onClick={toggleSelect}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
            isSelected 
              ? 'bg-blue-500 border-blue-500' 
              : (isDarkMode ? 'border-gray-600' : 'border-gray-300')
          }`}
        >
          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
        </button>
      )}
      
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
        isDarkMode ? 'bg-white' : 'bg-black'
      }`}>
        <FileText className={`w-6 h-6 ${isDarkMode ? 'text-black' : 'text-white'}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold text-lg mb-1 truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {doc.name}
        </h3>
        <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {doc.description || 'No description'}
        </p>
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        <span className={`px-3 py-1 rounded-full font-medium ${
          isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
        }`}>
          {doc.type}
        </span>
        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
          {doc.size}
        </span>
        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
          {new Date(doc.lastModified).toLocaleDateString()}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          doc.status === 'Published' ? 'bg-green-100 text-green-800' :
          doc.status === 'In Review' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {doc.status}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        {doc.url && (
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Download className="w-4 h-4" />
          </a>
        )}
        <button className={`p-2 rounded-lg transition-colors ${
          isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}>
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DocumentsPage;