import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Trash as TrashIcon, Edit2, Download, Share, User, Upload, Link, Image, Video, FileSpreadsheet, Globe, CheckCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { addNotification } from '../../utils/notifications';
import { get, post, put, deleteRequest, upload } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const DocumentsPage = () => {
  const { user } = useAppContext();
  const { isDarkMode } = useTheme();
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterOwner, setFilterOwner] = useState('all');
  const [editingDoc, setEditingDoc] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    file: null,
    permission: 'for-user'
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingDocument, setSharingDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Only admins or managers can manage documents (edit/delete/upload)
  const canManage = !!(user && (user.role === 'admin' || user.role === 'manager' || user.isAdmin));

  // --- Local cache helpers ---
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

  // Owner avatar color and initials
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
  const writeCache = (docs) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(docs || []));
    } catch {}
  };

  // Make Public/Private toggle at component scope so JSX can call it
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
      alert('Failed to update visibility');
    }
  };

  // Load documents from backend API
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

    // Show cached docs immediately (if any) to prevent empty UI on refresh/offline
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

  // No localStorage persistence; state is sourced from API

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

  // Card theming by type
  const getCardColor = (type) => {
    switch (type) {
      case 'PDF': return 'bg-red-50 border-red-200';
      case 'Excel': return 'bg-green-50 border-green-200';
      case 'PowerPoint': return 'bg-orange-50 border-orange-200';
      case 'Word': return 'bg-blue-50 border-blue-200';
      case 'Image': return 'bg-purple-50 border-purple-200';
      case 'Video': return 'bg-pink-50 border-pink-200';
      case 'Link': return 'bg-indigo-50 border-indigo-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getTypeGradient = (type) => {
    switch (type) {
      case 'PDF': return 'from-red-500 to-rose-500';
      case 'Excel': return 'from-green-500 to-emerald-500';
      case 'PowerPoint': return 'from-orange-500 to-amber-500';
      case 'Word': return 'from-blue-500 to-indigo-500';
      case 'Image': return 'from-purple-500 to-fuchsia-500';
      case 'Video': return 'from-pink-500 to-rose-500';
      case 'Link': return 'from-indigo-500 to-violet-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesOwner = filterOwner === 'all' || doc.owner === filterOwner;
    
    return matchesSearch && matchesType && matchesOwner;
  });

  const addNewDocument = () => {
    if (!canManage) {
      alert('You do not have permission to upload documents.');
      return;
    }
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    if (!canManage) {
      alert('You do not have permission to upload documents.');
      return;
    }
    // Auto-fill name from file if empty
    let docName = uploadForm.name && uploadForm.name.trim()
      ? uploadForm.name.trim()
      : (uploadForm.file ? (uploadForm.file.name.replace(/\.[^/.]+$/, '')) : '');
    if (!docName) {
      alert('Please enter a document name or choose a file');
      return;
    }

    try {
      const payload = {
        title: docName || 'Untitled Document',
        content: uploadForm.description || '',
        isPublic: uploadForm.permission === 'for-all',
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
            // show size in KB or MB
            const bytes = resp.attachment.size || 0;
            mapped.size = bytes > 1024 * 1024
              ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
              : `${Math.max(1, Math.round(bytes / 1024))} KB`;
            // infer type for display based on uploaded file mime
            const mt = (resp.attachment.mimeType || '').toLowerCase();
            if (mt.includes('pdf')) mapped.type = 'PDF';
            else if (mt.includes('image')) mapped.type = 'Image';
            else if (mt.includes('video')) mapped.type = 'Video';
            else if (mt.includes('spreadsheet') || mt.includes('excel')) mapped.type = 'Excel';
            else if (mt.includes('word')) mapped.type = 'Word';
            // populate attachments array for UI list
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
          // Continue even if attachment upload fails
        }
      }
      // Add locally for instant feedback
      const nextDocs = [...documents, mapped];
      setDocuments(nextDocs);
      writeCache(nextDocs);
      // Then refresh from server to ensure consistency (populated author, timestamps, attachments)
      try {
        const refreshed = await get('/documents');
        const mappedRef = Array.isArray(refreshed) ? refreshed.map((d) => {
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
            ? (totalBytes > 1024 * 1024 ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB` : `${Math.max(1, Math.round(totalBytes / 1024))} KB`)
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
            attachments: atts.map(a => ({ url: a.url, size: a.size, mimeType: a.mimeType, filename: a.filename, originalName: a.originalName })),
            tags: d.tags || [],
            permission: d.isPublic ? 'for-all' : undefined,
          };
        }) : [];
        setDocuments(mappedRef);
        writeCache(mappedRef);
      } catch (e) {
        // Non-fatal; UI already updated locally
        console.warn('Refresh after upload failed:', e?.message || e);
      }
      setShowUploadModal(false);
      setUploadForm({
        name: '',
        description: '',
        file: null,
        permission: 'for-user'
      });
      alert('Document uploaded successfully!');
    } catch (e) {
      console.error('Error creating document', e);
      alert(e.message || 'Failed to create document');
    }
  };

  const startEditing = (doc) => {
    setEditingDoc(doc.id);
    setEditForm({
      name: doc.name || '',
      description: doc.description || '',
      status: doc.status || 'Draft',
      permission: doc.permission || 'for-user'
    });
  };

  const saveEdit = async () => {
    try {
      const payload = {
        title: editForm.name,
        content: editForm.description,
        status: editForm.status,
        isPublic: editForm.permission === 'for-all',
      };
      await put(`/documents/${editingDoc}`, payload);
      const updatedDocs = documents.map(doc =>
        doc.id === editingDoc ? { ...doc, name: editForm.name, description: editForm.description, status: editForm.status, permission: editForm.permission } : doc
      );
      setDocuments(updatedDocs);
      setEditingDoc(null);
      setEditForm({});
      alert('Document updated successfully!');
    } catch (e) {
      console.error('Error updating document', e);
      alert(e.message || 'Failed to update document');
    }
  };

  const cancelEdit = () => {
    setEditingDoc(null);
    setEditForm({});
  };

  const deleteDocument = async (docId) => {
    if (!canManage) {
      alert('You do not have permission to delete documents.');
      return;
    }
    const ok = window.confirm('Delete this document permanently? This cannot be undone.');
    if (!ok) return;
    try {
      // Step 1: soft delete (move to trash)
      await deleteRequest(`/documents/${docId}`);
      // Step 2: permanent delete from trash
      await deleteRequest(`/documents/trash/${docId}`);
      const updatedDocs = documents.filter(doc => doc.id !== docId);
      setDocuments(updatedDocs);
      writeCache(updatedDocs);
    } catch (e) {
      console.error('Error deleting document', e);
      const msg = (e && e.message) ? e.message : '';
      alert(msg && msg.toLowerCase().includes('server error') ? 'Failed to delete document' : (msg || 'Failed to delete document'));
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

  const handleShareDocument = (document) => {
    setSharingDocument(document);
    setShowShareModal(true);
  };

  const handleShareWithGroup = async (shareType) => {
    if (!sharingDocument) return;
    
    try {
      // Call backend to share document with the selected group
      const res = await post(`/documents/${sharingDocument.id}/share`, { shareType });

      // Success UI feedback
      const recp = shareType === 'all-managers' ? 'All Managers' : shareType === 'all-users' ? 'All Users' : 'All Users & Managers';
      alert(`Document shared successfully with ${recp}!`);

      // Optionally reflect permission locally if sharing to everyone
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
      alert('Failed to share document. Please try again.');
    }
  };

  return (
    <div className={`content p-4 lg:p-6 font-sans min-h-screen ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Professional Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-6 shadow-lg ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
              <FileText className={`w-8 h-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Documents</h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage and organize your files</p>
            </div>
          </div>
          {canManage && (
            <button
              onClick={addNewDocument}
              className={`flex items-center px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 ${
                isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'
              }`}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </button>
          )}
        </div>

        {/* Professional Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{documents.length}</p>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Documents</p>
              </div>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
                <FileText className={`h-8 w-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
              </div>
            </div>
          </div>
          <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{documents.filter(d => d.type === 'PDF').length}</p>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>PDF Files</p>
              </div>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
                <FileText className={`h-8 w-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
              </div>
            </div>
          </div>
          <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{documents.filter(d => d.status === 'Published').length}</p>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Published</p>
              </div>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <CheckCircle className={`h-8 w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Professional Filter Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80 text-sm border ${
                  isDarkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm border ${
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
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {filteredDocuments.length} documents
            </span>
          </div>
        </div>
      </div>

      {/* Skeleton loaders (error banner hidden as requested) */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`rounded-2xl border overflow-hidden animate-pulse ${isDarkMode ? 'bg-white/5 border-white/10 backdrop-blur-md ring-1 ring-white/10' : 'bg-white/60 border-gray-200 ring-1 ring-black/5'}`}>
              <div className="h-1 w-full bg-gradient-to-r from-slate-300 to-gray-300" />
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
                <div className="flex items-center justify-between pt-3 border-t border-gray-200/40">
                  <div className="h-3 bg-gray-300/40 rounded w-1/3" />
                  <div className="h-3 bg-gray-300/40 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}



      {/* Compact Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDocuments.map((doc) => (
          <div key={doc.id} className={`group rounded-xl shadow-lg border overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            {/* Compact Header */}
            <div className={`p-4 border-b ${
              isDarkMode ? 'border-gray-800' : 'border-gray-100'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                    isDarkMode ? 'bg-white' : 'bg-black'
                  }`}>
                    {React.cloneElement(getTypeIcon(doc.type), { 
                      className: `w-6 h-6 ${isDarkMode ? 'text-black' : 'text-white'}` 
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm mb-1 truncate group-hover:text-blue-500 transition-colors ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {editingDoc === doc.id ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className={`w-full px-2 py-1 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 border border-gray-600 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
                        />
                      ) : (
                        doc.name
                      )}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
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
                {canManage && (
                  <div className="flex items-center space-x-1">
                    {editingDoc === doc.id ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                            isDarkMode ? 'bg-green-900 text-green-300 hover:bg-green-800' : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title="Save"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                            isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title="Cancel"
                        >
                          <Plus className="h-3 w-3 transform rotate-45" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(doc)}
                          className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                            isDarkMode ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                          title="Edit"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                            isDarkMode ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                          title="Delete"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Beautiful Content */}
            <div className="p-6">
              <div className="space-y-4">

                {/* Description */}
                <div>
                  <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</h4>
                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {editingDoc === doc.id ? (
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        className={`w-full px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 border border-gray-600 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
                        rows={3}
                        placeholder="Add a description..."
                      />
                    ) : (
                      doc.description || 'No description available'
                    )}
                  </p>
                </div>

                {/* File Link */}
                {doc.url && (
                  <div className={`p-3 rounded-xl border-2 ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
                      }`}>
                        <Link className={`h-4 w-4 ${
                          isDarkMode ? 'text-blue-300' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>File Link</p>
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`text-sm hover:underline truncate block ${
                            isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                          }`}
                        >
                          {doc.url.length > 40 ? `${doc.url.substring(0, 40)}...` : doc.url}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {Array.isArray(doc.attachments) && doc.attachments.length > 0 && (
                  <div>
                    <h4 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Attachments</h4>
                    <div className="space-y-2">
                      {doc.attachments.map((a, idx) => (
                        <div key={idx} className={`p-3 rounded-xl border transition-all duration-200 hover:scale-105 ${
                          isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className={`p-2 rounded-lg ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                              }`}>
                                <FileText className={`h-4 w-4 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <a
                                  href={a.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-sm font-medium hover:underline truncate block ${
                                    isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                                  }`}
                                  title={a.originalName || a.filename}
                                >
                                  {a.originalName || a.filename || 'Attachment'}
                                </a>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {formatBytes(a.size)}
                                </p>
                              </div>
                            </div>
                            <Download className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {Array.isArray(doc.tags) && doc.tags.length > 0 && (
                  <div>
                    <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {doc.tags.slice(0, 6).map((t, idx) => (
                        <span key={idx} className={`px-3 py-1 text-xs font-medium rounded-full border ${
                          isDarkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compact Footer */}
            <div className={`px-4 py-3 border-t ${
              isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${getOwnerColor(doc.owner)}`}>
                    {ownerInitials(doc.owner)}
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{doc.owner}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(doc.lastModified)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                    isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className={`flex items-center px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 ${
                        isDarkMode ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </a>
                  ) : (
                    <span className={`flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                      isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-500'
                    }`}>
                      <Download className="h-3 w-3 mr-1" />
                      No file
                    </span>
                  )}
                  {canManage && (
                    <>
                      <button 
                        onClick={() => togglePublic(doc)}
                        className={`flex items-center px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 ${
                          isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        title={doc.permission === 'for-all' ? 'Make Private' : 'Make Public'}
                      >
                        {doc.permission === 'for-all' ? 'Private' : 'Public'}
                      </button>
                      <button 
                        onClick={() => handleShareDocument(doc)}
                        className={`flex items-center px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 ${
                          isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <Share className="h-3 w-3 mr-1" />
                        Share
                      </button>
                    </>
                  )}
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {doc.size}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-16">
          <FileText className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No documents found</h3>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Get started by creating your first document.</p>
          <div className="mt-6">
            <button
              onClick={addNewDocument}
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Document
            </button>
          </div>
        </div>
      )}

      {/* Professional Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50">
          <div className={`absolute inset-0 backdrop-blur-md ${isDarkMode ? 'bg-black/80' : 'bg-white/80'}`} onClick={() => setShowUploadModal(false)} />
          <div className="relative h-full w-full flex items-center justify-center p-6">
            <div className={`flex flex-col w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border-2 ${
              isDarkMode ? 'bg-black text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
            }`}>
              <div className={`flex items-center justify-between px-8 py-6 border-b-2 ${
                isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${
                    isDarkMode ? 'bg-white' : 'bg-black'
                  }`}>
                    <Upload className={`w-8 h-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                  </div>
                  <div>
                    <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Upload Document</h2>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Add a new file to your workspace</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 ${
                    isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-black hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-8">
            
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Document Details</h3>
                    </div>
                    <div className="space-y-3">
                      <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Document Name *</label>
                      <input
                        type="text"
                        value={uploadForm.name}
                        onChange={(e) => setUploadForm({...uploadForm, name: e.target.value})}
                        placeholder="Enter a descriptive name for your document"
                        className={`w-full px-6 py-4 rounded-2xl text-lg font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                            : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-black'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Description</h3>
                    </div>
                    <div className="space-y-3">
                      <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Document Description</label>
                      <textarea
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                        rows={4}
                        placeholder="Describe the purpose and content of this document..."
                        className={`w-full px-6 py-4 rounded-2xl text-base font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 resize-none ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                            : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-black'
                        }`}
                      />
                    </div>
                  </div>
              
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Access Permissions</h3>
                    </div>
                    <div className="space-y-3">
                      <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Who can access this document?</label>
                      <select
                        value={uploadForm.permission}
                        onChange={(e) => setUploadForm({...uploadForm, permission: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl text-base font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white focus:border-white' 
                            : 'bg-gray-50 border-gray-300 text-black focus:border-black'
                        }`}
                      >
                        <option value="for-all">🌍 Everyone - Public access</option>
                        <option value="for-user">👥 Users - Regular users only</option>
                        <option value="for-manager">👑 Managers - Management only</option>
                      </select>
                      <div className={`p-4 rounded-xl border-2 ${
                        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <p className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <strong>Access Level:</strong> {
                            uploadForm.permission === 'for-all' ? 'Everyone in the organization can view and download this document' :
                            uploadForm.permission === 'for-user' ? 'Only regular users can access this document' :
                            'Only managers and administrators can access this document'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
              
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>File Upload</h3>
                    </div>
                    <div className="space-y-3">
                      <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Select File</label>
                      <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 hover:scale-105 ${
                        isDarkMode ? 'border-gray-600 hover:border-gray-500 bg-gray-900' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                      }`}>
                        <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                          isDarkMode ? 'bg-white' : 'bg-black'
                        }`}>
                          <Upload className={`h-8 w-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                        </div>
                        <h4 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Drop files here</h4>
                        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>or click to browse from your computer</p>
                        <input
                          type="file"
                          onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 inline-block ${
                            isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-black hover:bg-gray-300'
                          }`}>Choose File</span>
                        </label>
                        {uploadForm.file && (
                          <div className={`mt-6 p-4 rounded-xl border-2 ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isDarkMode ? 'bg-white' : 'bg-black'
                              }`}>
                                <FileText className={`w-5 h-5 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                              </div>
                              <div className="text-left">
                                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>{uploadForm.file.name}</p>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Size: {Math.round(uploadForm.file.size / 1024)} KB</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`flex items-center justify-between px-8 py-6 border-t-2 ${
                isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${uploadForm.name.trim() ? (isDarkMode ? 'bg-white' : 'bg-black') : 'bg-gray-400'}`} />
                  <span className={`text-sm font-medium ${
                    uploadForm.name.trim() 
                      ? (isDarkMode ? 'text-white' : 'text-black') 
                      : (isDarkMode ? 'text-gray-400' : 'text-gray-500')
                  }`}>
                    {uploadForm.name.trim() ? 'Ready to upload' : 'Document name required'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className={`px-6 py-3 text-base font-semibold rounded-xl transition-all duration-200 hover:scale-105 ${
                      isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-black hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!uploadForm.name.trim()}
                    className={`px-8 py-3 text-base font-bold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                      isDarkMode 
                        ? 'bg-white text-black hover:bg-gray-100 shadow-white/20' 
                        : 'bg-black text-white hover:bg-gray-900 shadow-black/20'
                    }`}
                  >
                    <Upload className="w-4 h-4 mr-2 inline" />
                    Upload Document
                  </button>
                </div>
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
              <button
                onClick={() => setShowShareModal(false)}
                className={`transition-colors duration-200 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Plus className="h-6 w-6 transform rotate-45" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                Share "<span className="font-semibold">{sharingDocument.name}</span>" with:
              </p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleShareWithGroup('all-users')}
                  className={`px-4 py-2 text-sm font-medium text-blue-600 rounded-lg transition-colors duration-200 text-left ${isDarkMode ? 'bg-blue-900/20 hover:bg-blue-900/30' : 'bg-blue-50 hover:bg-blue-100'}`}
                >
                  Share with All Users
                </button>
                <button
                  onClick={() => handleShareWithGroup('all-managers')}
                  className={`px-4 py-2 text-sm font-medium text-purple-600 rounded-lg transition-colors duration-200 text-left ${isDarkMode ? 'bg-purple-900/20 hover:bg-purple-900/30' : 'bg-purple-50 hover:bg-purple-100'}`}
                >
                  Share with All Managers
                </button>
                <button
                  onClick={() => handleShareWithGroup('all')}
                  className={`px-4 py-2 text-sm font-medium text-green-600 rounded-lg transition-colors duration-200 text-left ${isDarkMode ? 'bg-green-900/20 hover:bg-green-900/30' : 'bg-green-50 hover:bg-green-100'}`}
                >
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

export default DocumentsPage;
