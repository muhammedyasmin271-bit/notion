import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, Video, FileSpreadsheet, Globe, Plus, Check, AlertCircle, Zap, Shield, Tag, Users, Calendar, Clock } from 'lucide-react';

const EnhancedUploadModal = ({ 
  show, 
  onClose, 
  onUpload, 
  isDarkMode, 
  uploadForm, 
  setUploadForm 
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentTag, setCurrentTag] = useState('');
  const fileInputRef = useRef(null);

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
    if (files.length > 0) {
      const file = files[0];
      setUploadForm(prev => ({ 
        ...prev, 
        file, 
        name: prev.name || file.name.replace(/\.[^/.]+$/, '')
      }));
    }
  }, [setUploadForm]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm(prev => ({ 
        ...prev, 
        file, 
        name: prev.name || file.name.replace(/\.[^/.]+$/, '')
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
    if (!uploadForm.name.trim()) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 20;
      });
    }, 200);

    try {
      await onUpload();
      setUploadProgress(100);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        onClose();
      }, 500);
    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
    }
    
    clearInterval(progressInterval);
  };

  const getFileIcon = (file) => {
    if (!file) return <FileText className="w-8 h-8" />;
    
    const type = file.type.toLowerCase();
    if (type.includes('image')) return <Image className="w-8 h-8" />;
    if (type.includes('video')) return <Video className="w-8 h-8" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="w-8 h-8" />;
    return <FileText className="w-8 h-8" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className={`absolute inset-0 backdrop-blur-xl ${isDarkMode ? 'bg-black/90' : 'bg-white/90'}`} onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className={`w-full max-w-4xl max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden border-2 ${
          isDarkMode ? 'bg-black text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
        }`}>
          
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b-2 ${
            isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
                <Upload className={`w-8 h-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
              </div>
              <div>
                <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Upload Document
                </h2>
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Add a new file to your workspace
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={uploading}
              className={`p-3 rounded-2xl transition-all duration-200 hover:scale-105 ${
                isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-black hover:bg-gray-300'
              } disabled:opacity-50`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className={`px-6 py-3 border-b ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Uploading...
                    </span>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
                <Zap className="w-5 h-5 text-blue-500 animate-pulse" />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[65vh]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column - File Upload */}
              <div className="space-y-6">
                <div>
                  <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    <Upload className="w-5 h-5" />
                    File Upload
                  </h3>
                  
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
                      dragOver 
                        ? (isDarkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50')
                        : (isDarkMode ? 'border-gray-600 hover:border-gray-500 bg-gray-900' : 'border-gray-300 hover:border-gray-400 bg-gray-50')
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                      uploadForm.file 
                        ? (isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-600')
                        : (isDarkMode ? 'bg-white' : 'bg-black')
                    }`}>
                      {uploadForm.file ? (
                        <Check className="w-10 h-10" />
                      ) : (
                        <Upload className={`w-10 h-10 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                      )}
                    </div>
                    
                    {uploadForm.file ? (
                      <div>
                        <h4 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          File Selected
                        </h4>
                        <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border ${
                          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                          {getFileIcon(uploadForm.file)}
                          <div className="text-left">
                            <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                              {uploadForm.file.name}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {formatFileSize(uploadForm.file.size)}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Click to change file
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h4 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          Drop files here
                        </h4>
                        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          or click to browse from your computer
                        </p>
                        <div className={`inline-flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${
                          isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-black hover:bg-gray-300'
                        }`}>
                          Choose File
                        </div>
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

                {/* File Info */}
                {uploadForm.file && (
                  <div className={`p-6 rounded-2xl border-2 ${
                    isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h4 className={`font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      <Shield className="w-4 h-4" />
                      File Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Type:</span>
                        <p className={isDarkMode ? 'text-white' : 'text-black'}>{uploadForm.file.type || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Size:</span>
                        <p className={isDarkMode ? 'text-white' : 'text-black'}>{formatFileSize(uploadForm.file.size)}</p>
                      </div>
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Modified:</span>
                        <p className={isDarkMode ? 'text-white' : 'text-black'}>
                          {new Date(uploadForm.file.lastModified).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
                        <p className="text-green-500 font-medium">Ready to upload</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Document Details */}
              <div className="space-y-6">
                <div>
                  <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    <FileText className="w-5 h-5" />
                    Document Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Document Name *
                      </label>
                      <input
                        type="text"
                        value={uploadForm.name}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter a descriptive name"
                        disabled={uploading}
                        className={`w-full px-4 py-3 rounded-xl text-base font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                            : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-black'
                        } disabled:opacity-50`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Description
                      </label>
                      <textarea
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        placeholder="Describe the purpose and content..."
                        disabled={uploading}
                        className={`w-full px-4 py-3 rounded-xl text-base font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 resize-none ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                            : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-black'
                        } disabled:opacity-50`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Tags
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={currentTag}
                          onChange={(e) => setCurrentTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                          placeholder="Add a tag"
                          disabled={uploading}
                          className={`flex-1 px-4 py-2 rounded-xl text-sm border-2 transition-all duration-200 focus:outline-none ${
                            isDarkMode 
                              ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                              : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-black'
                          } disabled:opacity-50`}
                        />
                        <button
                          onClick={addTag}
                          disabled={!currentTag.trim() || uploading}
                          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
                            isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-black hover:bg-gray-300'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {uploadForm.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {uploadForm.tags.map((tag, idx) => (
                            <span key={idx} className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium border ${
                              isDarkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>
                              <Tag className="w-3 h-3" />
                              {tag}
                              <button
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
                  </div>
                </div>

                {/* Access Control */}
                <div className={`p-6 rounded-2xl border-2 ${
                  isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    <Users className="w-4 h-4" />
                    Access Permissions
                  </h4>
                  <select
                    value={uploadForm.permission}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, permission: e.target.value }))}
                    disabled={uploading}
                    className={`w-full px-4 py-3 rounded-xl text-base font-medium border-2 transition-all duration-200 focus:outline-none ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-white' 
                        : 'bg-white border-gray-300 text-black focus:border-black'
                    } disabled:opacity-50`}
                  >
                    <option value="for-all">🌍 Everyone - Public access</option>
                    <option value="for-user">👥 Users - Regular users only</option>
                    <option value="for-manager">👑 Managers - Management only</option>
                  </select>
                  <div className={`mt-3 p-3 rounded-xl text-sm ${
                    isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                  }`}>
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    {uploadForm.permission === 'for-all' ? 'Everyone in the organization can view and download this document' :
                     uploadForm.permission === 'for-user' ? 'Only regular users can access this document' :
                     'Only managers and administrators can access this document'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className={`flex items-center justify-between px-6 py-4 border-t-2 ${
            isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                uploadForm.name.trim() && uploadForm.file 
                  ? 'bg-green-500' 
                  : 'bg-yellow-500'
              }`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {uploadForm.name.trim() && uploadForm.file 
                  ? 'Ready to upload' 
                  : 'Please complete all required fields'}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                disabled={uploading}
                className={`px-6 py-3 text-base font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
                  isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-black hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadForm.name.trim() || !uploadForm.file || uploading}
                className={`px-8 py-3 text-base font-bold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  isDarkMode 
                    ? 'bg-white text-black hover:bg-gray-100 shadow-white/20' 
                    : 'bg-black text-white hover:bg-gray-900 shadow-black/20'
                }`}
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </div>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2 inline" />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedUploadModal;