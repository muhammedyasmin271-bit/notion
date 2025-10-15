import React, { useState, useEffect } from 'react';
import { Building2, Users, Pause, Play, Trash2, Plus, X, TrendingUp, DollarSign, Activity, AlertCircle, CheckCircle, Upload, Copy, Link as LinkIcon, Eye, XCircle, Settings } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const SuperAdminPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '', adminEmail: '', adminPhone: '', subdomain: '', maxUsers: 50, maxStorage: 5368709120, adminUsername: '', adminPassword: '', logo: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [createdCompany, setCreatedCompany] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [companyPayments, setCompanyPayments] = useState([]);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [verifyAction, setVerifyAction] = useState('approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [editingPricing, setEditingPricing] = useState(false);
  const [pricingForm, setPricingForm] = useState({ monthlyAmount: 1000, currency: 'ETB' });
  const [editingLimits, setEditingLimits] = useState(false);
  const [limitsForm, setLimitsForm] = useState({ maxUsers: 50, maxStorage: 5368709120 });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:9000/api/admin/companies', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const data = await res.json();
      setCompanies(data);
    } catch (error) {
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

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
        fetchCompanies();
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

  const closeModal = () => {
    setShowModal(false);
    setCreatedCompany(null);
    setFormData({ name: '', adminEmail: '', adminPhone: '', subdomain: '', maxUsers: 50, maxStorage: 5368709120, adminUsername: '', adminPassword: '', logo: '' });
    setLogoFile(null);
  };

  const viewCompanyDetails = async (companyId) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:9000/api/admin/companies/${companyId}/stats`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const data = await res.json();
      setCompanyDetails(data);
      const company = companies.find(c => c.companyId === companyId);
      setSelectedCompany(company);
      
      // Set pricing form with company's current pricing
      setPricingForm({
        monthlyAmount: company.pricing?.monthlyAmount || 1000,
        currency: company.pricing?.currency || 'ETB'
      });
      
      // Set limits form with company's current limits
      setLimitsForm({
        maxUsers: company.limits?.maxUsers || 50,
        maxStorage: company.limits?.maxStorage || 5368709120
      });
      
      // Fetch company payments
      const paymentsRes = await fetch('http://localhost:9000/api/payments/all', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const paymentsData = await paymentsRes.json();
      const filteredPayments = paymentsData.filter(p => p.companyId === companyId);
      setCompanyPayments(filteredPayments);
    } catch (error) {
      setError('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setSelectedCompany(null);
    setCompanyDetails(null);
    setCompanyPayments([]);
    setEditingPricing(false);
    setEditingLimits(false);
  };

  const handleUpdatePricing = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:9000/api/admin/companies/${selectedCompany.companyId}/pricing`, {
        method: 'PATCH',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pricingForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update pricing');
      }

      setSuccess('Company pricing updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setEditingPricing(false);
      fetchCompanies(); // Refresh companies list
    } catch (error) {
      console.error('Error updating pricing:', error);
      setError(error.message || 'Failed to update pricing');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimits = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:9000/api/admin/companies/${selectedCompany.companyId}/limits`, {
        method: 'PATCH',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(limitsForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update limits');
      }

      setSuccess('Company limits updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setEditingLimits(false);
      fetchCompanies(); // Refresh companies list
      viewCompanyDetails(selectedCompany.companyId); // Refresh details
    } catch (error) {
      console.error('Error updating limits:', error);
      setError(error.message || 'Failed to update limits');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const openVerifyModal = (payment, action) => {
    setSelectedPayment(payment);
    setVerifyAction(action);
    setRejectionReason('');
    setShowVerifyModal(true);
  };

  const handleVerifyPayment = async () => {
    if (verifyAction === 'rejected' && !rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:9000/api/payments/${selectedPayment._id}/verify`,
        {
          method: 'PUT',
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: verifyAction,
            rejectionReason: verifyAction === 'rejected' ? rejectionReason : undefined
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify payment');
      }

      setSuccess(`Payment ${verifyAction} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      setShowVerifyModal(false);
      setSelectedPayment(null);
      setRejectionReason('');
      
      // Refresh company details to show updated payment
      if (selectedCompany) {
        viewCompanyDetails(selectedCompany.companyId);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setError(error.message || 'Failed to verify payment');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (companyId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await fetch(`http://localhost:9000/api/admin/companies/${companyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') },
        body: JSON.stringify({ status: newStatus })
      });
      setSuccess(`Company ${newStatus === 'active' ? 'activated' : 'paused'}!`);
      fetchCompanies();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update status');
    }
  };

  const deleteCompany = async (companyId) => {
    if (!window.confirm('⚠️ Delete this company and ALL its data? This cannot be undone!')) return;
    try {
      await fetch(`http://localhost:9000/api/admin/companies/${companyId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      setSuccess('Company deleted successfully!');
      fetchCompanies();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to delete company');
    }
  };

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    paused: companies.filter(c => c.status === 'paused').length,
    totalUsers: companies.reduce((sum, c) => sum + (c.userCount || 0), 0)
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'}`}>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-3xl sm:text-4xl font-black ${isDarkMode ? 'bg-gradient-to-r from-white via-blue-400 to-purple-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent'}`}>
              Super Admin Dashboard
            </h1>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage all companies and subscriptions</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/super-admin/settings')} 
              className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Settings size={20} /> Settings
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              <Plus size={20} /> Add Company
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <span className="text-red-500 font-medium">{error}</span>
            <button onClick={() => setError('')} className="ml-auto"><X size={16} className="text-red-500" /></button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
            <CheckCircle className="text-green-500" size={20} />
            <span className="text-green-500 font-medium">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto"><X size={16} className="text-green-500" /></button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { label: 'Total Companies', value: stats.total, icon: Building2, color: 'blue' },
            { label: 'Active', value: stats.active, icon: Activity, color: 'green' },
            { label: 'Paused', value: stats.paused, icon: Pause, color: 'orange' },
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'purple' }
          ].map(stat => (
            <div key={stat.label} className={`${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/70 border-white/20'} border backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:scale-105 transition-all duration-300 shadow-lg`}>
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`text-${stat.color}-500`} size={20} />
                <div className={`w-2 h-2 rounded-full bg-${stat.color}-500 animate-pulse`}></div>
              </div>
              <div className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
              <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Companies List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : companies.length === 0 ? (
          <div className={`text-center py-20 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/70 border-white/20'} border backdrop-blur-sm rounded-2xl`}>
            <Building2 size={64} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-xl font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No companies yet</p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>Create your first company to get started</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {companies.map(company => (
              <div key={company.companyId} className={`${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/70 border-white/20 hover:bg-white/90'} border backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer`} onClick={() => viewCompanyDetails(company.companyId)}>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-3 sm:gap-4 flex-1">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex-shrink-0">
                      <Building2 size={24} className="text-white sm:w-8 sm:h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>{company.name}</h3>
                      <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-mono truncate`}>{company.companyId}</p>
                      <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-1 truncate`}>{company.adminEmail}</p>
                      <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
                        <span className={`flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                          <Users size={12} className="sm:w-3.5 sm:h-3.5"/> {company.userCount || 0} users
                        </span>
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${company.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
                          {company.status.toUpperCase()}
                        </span>
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${company.subscriptionStatus === 'paid' ? 'bg-blue-500/20 text-blue-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                          {company.subscriptionStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => toggleStatus(company.companyId, company.status)} className={`flex-1 p-3 rounded-lg sm:rounded-xl transition-all duration-200 active:scale-95 ${company.status === 'active' ? 'bg-orange-500/20 hover:bg-orange-500/30' : 'bg-green-500/20 hover:bg-green-500/30'}`} title={company.status === 'active' ? 'Pause' : 'Activate'}>
                      {company.status === 'active' ? <Pause size={18} className="text-orange-500 mx-auto"/> : <Play size={18} className="text-green-500 mx-auto"/>}
                    </button>
                    <button onClick={() => deleteCompany(company.companyId)} className="flex-1 p-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg sm:rounded-xl transition-all duration-200 active:scale-95" title="Delete">
                      <Trash2 size={18} className="text-red-500 mx-auto"/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
            <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-xl sm:rounded-2xl w-full max-w-2xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto`}>
              <div className={`flex justify-between items-center p-4 sm:p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} sticky top-0 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} z-10`}>
                <h2 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{createdCompany ? 'Company Created!' : 'Add New Company'}</h2>
                <button onClick={closeModal} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} active:scale-95`}>
                  <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>
              
              {createdCompany ? (
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="text-center">
                    <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                    <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{createdCompany.company.name}</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Company created successfully!</p>
                  </div>

                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <label className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 block`}>COMPANY ID</label>
                      <div className="flex items-center gap-2">
                        <code className={`flex-1 font-mono text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{createdCompany.company.companyId}</code>
                        <button onClick={() => copyToClipboard(createdCompany.company.companyId)} className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors">
                          <Copy size={16} className="text-blue-500" />
                        </button>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <label className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 block`}>ADMIN USERNAME</label>
                      <div className="flex items-center gap-2">
                        <code className={`flex-1 font-mono text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{createdCompany.adminUsername}</code>
                        <button onClick={() => copyToClipboard(createdCompany.adminUsername)} className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors">
                          <Copy size={16} className="text-blue-500" />
                        </button>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <label className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 block`}>COMPANY LOGIN LINK</label>
                      <div className="flex items-center gap-2">
                        <code className={`flex-1 font-mono text-xs break-all ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{createdCompany.companyLink}</code>
                        <button onClick={() => copyToClipboard(createdCompany.companyLink)} className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors">
                          <Copy size={16} className="text-blue-500" />
                        </button>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border-2 ${isDarkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'}`}>
                      <p className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                        <strong>Next Steps:</strong> Share the company link and admin credentials with the client. They can login and manage their own users.
                      </p>
                    </div>
                  </div>

                  <button onClick={closeModal} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 font-bold shadow-lg hover:shadow-xl transition-all duration-200">
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={createCompany} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div>
                    <label className={`text-sm font-bold mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Company Logo</label>
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center ${isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-300 hover:border-gray-400'} transition-colors cursor-pointer`}>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        {formData.logo ? (
                          <img src={formData.logo} alt="Logo" className="w-24 h-24 mx-auto object-contain rounded-lg" />
                        ) : (
                          <div>
                            <Upload size={32} className={`mx-auto mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Click to upload logo</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <input type="text" placeholder="Company Name" value={formData.name} className={`sm:col-span-2 p-3 border-2 rounded-lg sm:rounded-xl text-sm sm:text-base ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-blue-500`} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <input type="email" placeholder="Admin Email" value={formData.adminEmail} className={`p-3 border-2 rounded-lg sm:rounded-xl text-sm sm:text-base ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-blue-500`} onChange={e => setFormData({...formData, adminEmail: e.target.value})} required />
                    <input type="text" placeholder="Admin Phone" value={formData.adminPhone} className={`p-3 border-2 rounded-lg sm:rounded-xl text-sm sm:text-base ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-blue-500`} onChange={e => setFormData({...formData, adminPhone: e.target.value})} />
                  </div>

                  <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${isDarkMode ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
                    <p className={`text-xs font-bold mb-2 sm:mb-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>ADMIN CREDENTIALS</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <input type="text" placeholder="Admin Username" value={formData.adminUsername} className={`p-3 border-2 rounded-lg sm:rounded-xl text-sm sm:text-base ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-blue-500`} onChange={e => setFormData({...formData, adminUsername: e.target.value})} required />
                      <input type="text" placeholder="Admin Password" value={formData.adminPassword} className={`p-3 border-2 rounded-lg sm:rounded-xl text-sm sm:text-base ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-blue-500`} onChange={e => setFormData({...formData, adminPassword: e.target.value})} required />
                    </div>
                  </div>

                  <input type="text" placeholder="Subdomain (optional)" value={formData.subdomain} className={`w-full p-3 border-2 rounded-lg sm:rounded-xl text-sm sm:text-base ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-blue-500`} onChange={e => setFormData({...formData, subdomain: e.target.value})} />
                  
                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 active:scale-95 text-sm sm:text-base">
                      {loading ? 'Creating...' : 'Create Company'}
                    </button>
                    <button type="button" onClick={closeModal} className={`flex-1 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} py-3 rounded-lg sm:rounded-xl font-bold transition-all duration-200 active:scale-95 text-sm sm:text-base`}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Company Details Modal */}
        {selectedCompany && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50" onClick={closeDetailsModal}>
            <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-xl sm:rounded-2xl w-full max-w-4xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
              <div className={`flex justify-between items-center p-4 sm:p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} sticky top-0 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} z-10`}>
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                  {selectedCompany.branding?.logo && (
                    <img src={selectedCompany.branding.logo} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-lg flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className={`text-lg sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>{selectedCompany.name}</h2>
                    <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-mono truncate`}>{selectedCompany.companyId}</p>
                  </div>
                </div>
                <button onClick={closeDetailsModal} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} active:scale-95 flex-shrink-0`}>
                  <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Company Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>STATUS</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedCompany.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
                      {selectedCompany.status.toUpperCase()}
                    </span>
                  </div>
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>SUBSCRIPTION</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedCompany.subscriptionStatus === 'paid' ? 'bg-blue-500/20 text-blue-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                      {selectedCompany.subscriptionStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>ADMIN EMAIL</p>
                    <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedCompany.adminEmail}</p>
                  </div>
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>ADMIN PHONE</p>
                    <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedCompany.adminPhone || 'N/A'}</p>
                  </div>
                </div>

                {/* Company Pricing */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30' : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Monthly Subscription</h3>
                    </div>
                    {!editingPricing && (
                      <button
                        onClick={() => setEditingPricing(true)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Edit Pricing
                      </button>
                    )}
                  </div>
                  
                  {editingPricing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Monthly Amount
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={pricingForm.monthlyAmount}
                            onChange={(e) => setPricingForm({ ...pricingForm, monthlyAmount: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg border text-sm ${
                              isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Currency
                          </label>
                          <input
                            type="text"
                            value={pricingForm.currency}
                            onChange={(e) => setPricingForm({ ...pricingForm, currency: e.target.value })}
                            className={`w-full px-3 py-2 rounded-lg border text-sm ${
                              isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdatePricing}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingPricing(false);
                            setPricingForm({
                              monthlyAmount: selectedCompany.pricing?.monthlyAmount || 1000,
                              currency: selectedCompany.pricing?.currency || 'ETB'
                            });
                          }}
                          className={`px-4 py-2 text-sm rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className={`flex-1 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monthly Fee</p>
                        <p className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {selectedCompany.pricing?.monthlyAmount || 1000} {selectedCompany.pricing?.currency || 'ETB'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Company Limits */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30' : 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-500" />
                      <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Company Limits</h3>
                    </div>
                    {!editingLimits && (
                      <button
                        onClick={() => setEditingLimits(true)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Edit Limits
                      </button>
                    )}
                  </div>
                  
                  {editingLimits ? (
                    <div className="space-y-3">
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Max Users
                        </label>
                        <input
                          type="number"
                          value={limitsForm.maxUsers}
                          onChange={(e) => setLimitsForm({ ...limitsForm, maxUsers: e.target.value })}
                          className={`w-full px-3 py-2 rounded-lg border text-sm ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateLimits}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingLimits(false);
                            setLimitsForm({
                              maxUsers: selectedCompany.limits?.maxUsers || 50,
                              maxStorage: selectedCompany.limits?.maxStorage || 5368709120
                            });
                          }}
                          className={`px-4 py-2 text-sm rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max Users</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                        {selectedCompany.limits?.maxUsers || 50}
                      </p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                {companyDetails && (
                  <div>
                    <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Company Statistics</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
                        <Users size={24} className="text-blue-500 mb-2" />
                        <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{companyDetails.userCount}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
                      </div>
                      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
                        <Activity size={24} className="text-green-500 mb-2" />
                        <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{companyDetails.activeUsers}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Users</p>
                      </div>
                      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'}`}>
                        <Building2 size={24} className="text-purple-500 mb-2" />
                        <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedCompany.limits?.maxUsers || 50}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>User Limit</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Company Link */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>COMPANY LOGIN LINK</p>
                  <div className="flex items-center gap-2">
                    <code className={`flex-1 font-mono text-xs break-all ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedCompany.companyLink}</code>
                    <button onClick={() => copyToClipboard(selectedCompany.companyLink)} className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors">
                      <Copy size={16} className="text-blue-500" />
                    </button>
                  </div>
                </div>

                {/* Payments Section */}
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                      <DollarSign size={18} className="text-green-500 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Payment History</span>
                      <span className="sm:hidden">Payments</span>
                    </h3>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      {companyPayments.length}
                    </span>
                  </div>
                  
                  {companyPayments.length === 0 ? (
                    <div className={`p-8 rounded-xl text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <DollarSign size={48} className={`mx-auto mb-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No payments submitted yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
                      {companyPayments.map((payment) => (
                        <div
                          key={payment._id}
                          className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  ${payment.amount.toFixed(2)}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  payment.status === 'approved' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : payment.status === 'rejected'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {payment.status.toUpperCase()}
                                </span>
                              </div>
                              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>For:</strong> {payment.period.months && payment.period.months.length > 0
                                  ? payment.period.months.map(m => 
                                      new Date(2000, m - 1).toLocaleString('default', { month: 'short' })
                                    ).join(', ') + ' ' + payment.period.year
                                  : 'N/A'}
                              </p>
                              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <strong>Submitted:</strong> {new Date(payment.createdAt).toLocaleDateString()}
                              </p>
                              {payment.note && (
                                <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} line-clamp-2`}>
                                  <strong>Note:</strong> {payment.note}
                                </p>
                              )}
                            </div>
                            <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                              <a
                                href={`http://localhost:9000${payment.screenshotUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 sm:gap-2 justify-center active:scale-95"
                              >
                                <Eye size={14} className="sm:w-4 sm:h-4" />
                                View
                              </a>
                              {payment.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => openVerifyModal(payment, 'approved')}
                                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 sm:gap-2 justify-center active:scale-95"
                                  >
                                    <CheckCircle size={14} className="sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Approve</span>
                                    <span className="sm:hidden">✓</span>
                                  </button>
                                  <button
                                    onClick={() => openVerifyModal(payment, 'rejected')}
                                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 sm:gap-2 justify-center active:scale-95"
                                  >
                                    <XCircle size={14} className="sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Reject</span>
                                    <span className="sm:hidden">✗</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Verification Modal */}
        {showVerifyModal && selectedPayment && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50" onClick={() => setShowVerifyModal(false)}>
            <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-xl sm:rounded-2xl w-full max-w-md shadow-2xl`} onClick={(e) => e.stopPropagation()}>
              <div className={`p-4 sm:p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {verifyAction === 'approved' ? '✅ Approve Payment' : '❌ Reject Payment'}
                </h2>
              </div>

              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    <strong>Company:</strong> {selectedPayment.companyName}
                  </p>
                  <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    <strong>Amount:</strong> ${selectedPayment.amount.toFixed(2)}
                  </p>
                  <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong>Period:</strong> {selectedPayment.period.months && selectedPayment.period.months.length > 0
                      ? selectedPayment.period.months.map(m => 
                          new Date(2000, m - 1).toLocaleString('default', { month: 'short' })
                        ).join(', ') + ' ' + selectedPayment.period.year
                      : 'N/A'}
                  </p>
                </div>

                {verifyAction === 'rejected' && (
                  <div>
                    <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Rejection Reason *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border text-sm sm:text-base ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Explain why this payment is being rejected..."
                      required
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={handleVerifyPayment}
                    disabled={loading}
                    className={`flex-1 px-4 py-3 rounded-lg sm:rounded-xl text-white text-sm sm:text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      verifyAction === 'approved'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                        : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
                    }`}
                  >
                    {loading ? 'Processing...' : `Confirm ${verifyAction === 'approved' ? 'Approval' : 'Rejection'}`}
                  </button>
                  <button
                    onClick={() => setShowVerifyModal(false)}
                    disabled={loading}
                    className={`px-4 py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-colors disabled:opacity-50 active:scale-95 ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPage;
