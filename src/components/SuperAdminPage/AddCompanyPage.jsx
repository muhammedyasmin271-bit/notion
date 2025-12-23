import React, { useState } from 'react';
import { Building2, Users, Plus, X, Upload, Copy, Link as LinkIcon, CheckCircle, AlertCircle, User, Lock, DollarSign, Phone } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import NavBar from '../NavBar/NavBar';

const AddCompanyPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '', adminEmail: '', adminPhone: '', maxUsers: 50, maxStorage: 5368709120, adminUsername: '', adminPassword: '', logo: '', selectedPlan: 'free_trial', pointsEnabled: true
  });
  const [logoFile, setLogoFile] = useState(null);
  const [createdCompany, setCreatedCompany] = useState(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({...formData, logo: reader.result});
        setLogoFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const createCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:9000/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedCompany(data);
      } else {
        setError(data.message || 'Failed to create company');
      }
    } catch (error) {
      setError('Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#141414]' : 'bg-white'}`}
      style={isDarkMode ? { backgroundColor: '#141414' } : {}}
    >
      <NavBar />
      
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white' : 'bg-black'} shadow-xl`}>
              <Building2 size={32} className={isDarkMode ? 'text-black' : 'text-white'} />
            </div>
            <div>
              <h1 className={`text-4xl sm:text-5xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {createdCompany ? '🎉 Company Created!' : 'Add New Company'}
              </h1>
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {createdCompany ? 'Successfully set up new organization' : 'Create a new organization with admin access'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/xq7m9k2p8n4r6t1w')} 
            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${isDarkMode ? 'bg-gray-900 hover:bg-gray-800 text-white border border-gray-800' : 'bg-white hover:bg-gray-50 text-black border-2 border-gray-200 shadow-md'}`}
          >
            <X size={20} /> Back
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className={`mb-6 p-4 rounded-2xl border-2 backdrop-blur-sm flex items-center gap-3 animate-slideDown ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-300'}`}>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <AlertCircle className={isDarkMode ? 'text-white' : 'text-black'} size={20} />
            </div>
            <span className={`flex-1 font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>{error}</span>
            <button onClick={() => setError('')} className={`p-2 rounded-lg hover:bg-opacity-20 transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}>
              <X size={18} className={isDarkMode ? 'text-white' : 'text-black'} />
            </button>
          </div>
        )}
        {success && (
          <div className={`mb-6 p-4 rounded-2xl border-2 backdrop-blur-sm flex items-center gap-3 animate-slideDown ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-300'}`}>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <CheckCircle className={isDarkMode ? 'text-white' : 'text-black'} size={20} />
            </div>
            <span className={`flex-1 font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>{success}</span>
            <button onClick={() => setSuccess('')} className={`p-2 rounded-lg hover:bg-opacity-20 transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}>
              <X size={18} className={isDarkMode ? 'text-white' : 'text-black'} />
            </button>
          </div>
        )}

        {createdCompany ? (
          /* Success View */
          <div className={`${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200'} border-2 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 space-y-5 sm:space-y-6`}>
            {/* Success Animation */}
            <div className="text-center py-4">
              <div className="relative inline-block">
                <div className={`w-24 h-24 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center mb-4 animate-bounce`}>
                  <CheckCircle size={56} className={`${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-green-500 opacity-20 animate-ping"></div>
              </div>
              <h3 className={`text-3xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{createdCompany.company.name}</h3>
              <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Company created and ready to use!</p>
            </div>

            {/* Info Cards */}
            <div className="space-y-4">
              <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg hover:shadow-xl transition-all duration-300`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <Building2 size={18} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'} />
                  </div>
                  <label className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Company ID</label>
                </div>
                <div className="flex items-center gap-2">
                  <code className={`flex-1 font-mono text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} p-3 rounded-lg ${isDarkMode ? 'bg-gray-900/50' : 'bg-white'}`}>{createdCompany.company.companyId}</code>
                  <button onClick={() => copyToClipboard(createdCompany.company.companyId)} className={`p-3 ${isDarkMode ? 'hover:bg-gray-700 bg-gray-700/50' : 'hover:bg-gray-200 bg-gray-200/50'} rounded-lg transition-all active:scale-95`}>
                    <Copy size={18} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </button>
                </div>
              </div>

              <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg hover:shadow-xl transition-all duration-300`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <User size={18} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'} />
                  </div>
                  <label className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Admin Username</label>
                </div>
                <div className="flex items-center gap-2">
                  <code className={`flex-1 font-mono text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} p-3 rounded-lg ${isDarkMode ? 'bg-gray-900/50' : 'bg-white'}`}>{createdCompany.adminUsername}</code>
                  <button onClick={() => copyToClipboard(createdCompany.adminUsername)} className={`p-3 ${isDarkMode ? 'hover:bg-gray-700 bg-gray-700/50' : 'hover:bg-gray-200 bg-gray-200/50'} rounded-lg transition-all active:scale-95`}>
                    <Copy size={18} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </button>
                </div>
              </div>

              <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg hover:shadow-xl transition-all duration-300`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <LinkIcon size={18} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'} />
                  </div>
                  <label className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Company Login Link</label>
                </div>
                <div className="flex items-center gap-2">
                  <code className={`flex-1 font-mono text-xs sm:text-sm break-all ${isDarkMode ? 'text-white' : 'text-gray-900'} p-3 rounded-lg ${isDarkMode ? 'bg-gray-900/50' : 'bg-white'}`}>{createdCompany.companyLink}</code>
                  <button onClick={() => copyToClipboard(createdCompany.companyLink)} className={`p-3 ${isDarkMode ? 'hover:bg-gray-700 bg-gray-700/50' : 'hover:bg-gray-200 bg-gray-200/50'} rounded-lg transition-all active:scale-95 flex-shrink-0`}>
                    <Copy size={18} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </button>
                </div>
              </div>
            </div>

            <button onClick={() => navigate('/xq7m9k2p8n4r6t1w')} className={`w-full ${isDarkMode ? 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700' : 'bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900'} text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95`}>
              Done
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={createCompany} className={`${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200'} border-2 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 space-y-5 sm:space-y-6`}>
            {/* Logo Upload Section */}
            <div>
              <label className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <Upload size={18} />
                Company Logo
              </label>
              <div className={`relative border-3 border-dashed rounded-2xl p-8 text-center ${isDarkMode ? 'border-gray-700 hover:border-gray-600 bg-gray-800/30' : 'border-gray-300 hover:border-gray-400 bg-gray-50'} transition-all duration-300 cursor-pointer group hover:scale-[1.02]`}>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  {formData.logo ? (
                    <div className="relative inline-block">
                      <img src={formData.logo} alt="Logo" className="w-28 h-28 mx-auto object-contain rounded-2xl shadow-lg" />
                      <div className={`absolute inset-0 rounded-2xl ${isDarkMode ? 'bg-gray-900/50' : 'bg-white/50'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
                        <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Change Logo</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4">
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Upload size={32} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      </div>
                      <p className={`text-base font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Click to upload logo</p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>PNG, JPG, SVG up to 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Company Information */}
            <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
              <h3 className={`text-base font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Building2 size={18} />
                Company Information
              </h3>
              <div className="space-y-3">
                <div className="relative">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Building2 size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Company Name *" 
                    value={formData.name} 
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-base font-medium ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-gray-600' : 'focus:ring-gray-400'} transition-all`} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Admin Contact */}
            <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
              <h3 className={`text-base font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <User size={18} />
                Admin Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative sm:col-span-2">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Users size={18} />
                  </div>
                  <input 
                    type="email" 
                    placeholder="Admin Email *" 
                    value={formData.adminEmail} 
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-base font-medium ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-gray-600' : 'focus:ring-gray-400'} transition-all`} 
                    onChange={e => setFormData({...formData, adminEmail: e.target.value})} 
                    required 
                  />
                </div>
                <div className="relative sm:col-span-2">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Phone size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Admin Phone *" 
                    value={formData.adminPhone} 
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-base font-medium ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-gray-600' : 'focus:ring-gray-400'} transition-all`} 
                    onChange={e => setFormData({...formData, adminPhone: e.target.value})} 
                    required
                  />
                </div>
              </div>
            </div>

            {/* Plan Selection */}
            <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-2 border-blue-700/50' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300'}`}>
              <h3 className={`text-base font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <DollarSign size={18} />
                Subscription Plan
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 'free_trial', label: 'Free Trial', period: '7 days' },
                  { value: 'one_month', label: '1 Month', period: '1 month' },
                  { value: 'three_month', label: '3 Months', period: '3 months' },
                  { value: 'six_month', label: '6 Months', period: '6 months' }
                ].map(plan => (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => setFormData({...formData, selectedPlan: plan.value})}
                    className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                      formData.selectedPlan === plan.value
                        ? isDarkMode
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg scale-105'
                          : 'bg-blue-600 border-blue-500 text-white shadow-lg scale-105'
                        : isDarkMode
                          ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-bold">{plan.label}</div>
                    <div className="text-xs opacity-75">{plan.period}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* User Limit */}
            <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
              <h3 className={`text-base font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Users size={18} />
                User Limit
              </h3>
              <div className="relative">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Users size={18} />
                </div>
                <input 
                  type="number" 
                  placeholder="Maximum number of users *" 
                  value={formData.maxUsers} 
                  min="1"
                  className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-base font-medium ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-gray-600' : 'focus:ring-gray-400'} transition-all`} 
                  onChange={e => setFormData({...formData, maxUsers: parseInt(e.target.value) || 1})} 
                  required 
                />
              </div>
              <p className={`text-xs mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Maximum number of users allowed for this company
              </p>
            </div>

            {/* Points Rating System Toggle */}
            <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-purple-900/20 border-2 border-purple-700/50' : 'bg-purple-50 border-2 border-purple-300'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-base font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Points Rating System
                  </h3>
                  <p className={`text-xs ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                    Track team performance with automatic point scoring
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, pointsEnabled: !prev.pointsEnabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    formData.pointsEnabled
                      ? 'bg-purple-600'
                      : isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.pointsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className={`text-xs mt-3 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {formData.pointsEnabled 
                  ? '✅ Points system will be enabled for this company' 
                  : '❌ Points system will be disabled - no performance tracking'
                }
              </p>
            </div>

            {/* Admin Credentials */}
            <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-white/10 border-2 border-white/20' : 'bg-black/10 border-2 border-black/20'}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                  <Lock size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                </div>
                <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Admin Login Credentials</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Username *" 
                    value={formData.adminUsername} 
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-base font-medium ${isDarkMode ? 'bg-gray-900/50 border-blue-700/50 text-white placeholder-gray-500 focus:border-blue-600' : 'bg-white border-blue-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-blue-700' : 'focus:ring-blue-400'} transition-all`} 
                    onChange={e => setFormData({...formData, adminUsername: e.target.value})} 
                    required 
                  />
                </div>
                <div className="relative">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    <Lock size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Password *" 
                    value={formData.adminPassword} 
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-base font-medium ${isDarkMode ? 'bg-gray-900/50 border-blue-700/50 text-white placeholder-gray-500 focus:border-blue-600' : 'bg-white border-blue-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-blue-700' : 'focus:ring-blue-400'} transition-all`} 
                    onChange={e => setFormData({...formData, adminPassword: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <p className={`text-xs mt-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} flex items-start gap-2`}>
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>These credentials will be used by the company admin to access their account.</span>
              </p>
            </div>
            
            {error && (
              <div className={`p-4 rounded-xl border-2 ${isDarkMode ? 'bg-red-900/20 border-red-700/50' : 'bg-red-50 border-red-300'} flex items-center gap-3`}>
                <AlertCircle className={isDarkMode ? 'text-red-400' : 'text-red-600'} size={20} />
                <p className={`text-sm font-medium ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                type="submit" 
                disabled={loading} 
                className={`flex-1 flex items-center justify-center gap-2 ${isDarkMode ? 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700' : 'bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900'} text-white py-4 rounded-xl font-black text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Company...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Create Company
                  </>
                )}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/xq7m9k2p8n4r6t1w')} 
                className={`sm:w-32 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} py-4 rounded-xl font-bold transition-all duration-200 active:scale-95`}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddCompanyPage;