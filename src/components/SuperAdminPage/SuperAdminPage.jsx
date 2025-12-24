import React, { useState, useEffect } from 'react';
import { Building2, Users, Pause, Play, Trash2, Plus, X, TrendingUp, DollarSign, Activity, AlertCircle, CheckCircle, Upload, Copy, Link as LinkIcon, Eye, XCircle, Settings, Phone, User, Lock, ToggleLeft, ToggleRight, Mail, Clock, MessageCircle, Info } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import CompanyCalendar from '../CompanyCalendar/CompanyCalendar';
import CompanyPaymentStatus from '../CompanyPaymentStatus/CompanyPaymentStatus';

const SuperAdminPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAppContext();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '', adminEmail: '', adminPhone: '', maxUsers: 50, maxStorage: 5368709120, adminUsername: '', adminPassword: '', logo: '', selectedPlan: 'free_trial'
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
  const [openMenuId, setOpenMenuId] = useState(null);

  const [editingLimits, setEditingLimits] = useState(false);
  const [limitsForm, setLimitsForm] = useState({ maxUsers: 50, maxStorage: 5368709120 });
  const [updatingPaymentMode, setUpdatingPaymentMode] = useState(false);
  const [updatingPointsToggle, setUpdatingPointsToggle] = useState(false);

  // Define fetchCompanies before useEffects to avoid hooks order issues
  const fetchCompanies = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('https://melaback.vercel.app/api/admin/companies', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const data = await res.json();
      setCompanies(data);
    } catch (error) {
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, []);

  // Security check - verify user is authenticated super admin
  useEffect(() => {
    const verifySuperAdminAccess = () => {
      // Wait for auth to initialize
      if (authLoading) {
        return;
      }

      // Check authentication
      if (!isAuthenticated) {
        // Redirect to super admin login page
        navigate('/xq7m9k2p8n4r6t1w/login', { replace: true });
        return;
      }

      // Verify token exists
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token || !storedUser) {
        navigate('/', { replace: true });
        return;
      }

      // Parse and verify user data
      try {
        const userData = JSON.parse(storedUser);
        
        // Double-check role is superadmin
        if (userData.role !== 'superadmin' || user?.role !== 'superadmin') {
          navigate('/xq7m9k2p8n4r6t1w/login', { replace: true });
          return;
        }

        // All checks passed - authorize access
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error verifying super admin access:', error);
        navigate('/xq7m9k2p8n4r6t1w/login', { replace: true });
      }
    };

    verifySuperAdminAccess();
  }, [authLoading, isAuthenticated, user, navigate]);

  // Fetch companies when authorized
  useEffect(() => {
    if (isAuthorized && !authLoading) {
      fetchCompanies();
    }
  }, [isAuthorized, authLoading, fetchCompanies]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // Don't render anything until authorized
  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={isDarkMode ? { backgroundColor: '#141414' } : {}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Verifying access...</p>
        </div>
      </div>
    );
  }

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
      const res = await fetch('https://melaback.vercel.app/api/admin/companies', {
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
    setFormData({ name: '', adminEmail: '', adminPhone: '', maxUsers: 50, maxStorage: 5368709120, adminUsername: '', adminPassword: '', logo: '', selectedPlan: 'free_trial' });
    setLogoFile(null);
  };

  const viewCompanyDetails = async (companyId) => {
    setLoading(true);
    try {
      const res = await fetch(`https://melaback.vercel.app/api/admin/companies/${companyId}/stats`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const data = await res.json();
      setCompanyDetails(data);
      const company = companies.find(c => c.companyId === companyId);
      setSelectedCompany(company);
      
      // Set limits form with company's current limits
      setLimitsForm({
        maxUsers: company.limits?.maxUsers || 50,
        maxStorage: company.limits?.maxStorage || 5368709120
      });
      
      // Fetch company payments
      const paymentsRes = await fetch('https://melaback.vercel.app/api/payments/all', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const paymentsData = await paymentsRes.json();
      
      // Filter by company and only show successful payments (approved/rejected)
      // Hide ALL pending payments - they will only appear after Chapa confirms success
      const filteredPayments = paymentsData.filter(p => {
        if (p.companyId !== companyId) return false;
        
        // Only show approved or rejected payments (no pending payments)
        return p.status === 'approved' || p.status === 'rejected';
      });
      
      setCompanyPayments(filteredPayments);
      
      // Add payments to company object for calendar component
      company.payments = filteredPayments;
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
    setEditingLimits(false);
  };



  const handleUpdateLimits = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://melaback.vercel.app/api/admin/companies/${selectedCompany.companyId}/limits`, {
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

  const handleTogglePaymentMode = async () => {
    setUpdatingPaymentMode(true);
    try {
      const token = localStorage.getItem('token');
      const currentMode = selectedCompany.paymentMode || 'paid'; // Default to 'paid' if undefined
      const newMode = currentMode === 'paid' ? 'free' : 'paid';
      
      const response = await fetch(`https://melaback.vercel.app/api/admin/companies/${selectedCompany.companyId}/payment-mode`, {
        method: 'PATCH',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentMode: newMode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update payment mode');
      }

      setSuccess(`Company payment mode updated to ${newMode === 'paid' ? 'Paid' : 'Free'}!`);
      setTimeout(() => setSuccess(''), 3000);
      fetchCompanies(); // Refresh companies list
      viewCompanyDetails(selectedCompany.companyId); // Refresh details
    } catch (error) {
      console.error('Error updating payment mode:', error);
      setError(error.message || 'Failed to update payment mode');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingPaymentMode(false);
    }
  };

  const handleTogglePoints = async () => {
    setUpdatingPointsToggle(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://melaback.vercel.app/api/admin/companies/${selectedCompany.companyId}/points-toggle`, {
        method: 'PATCH',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle points');
      }

      const newStatus = data.pointsEnabled;
      setSuccess(`Points system ${newStatus ? 'ENABLED' : 'DISABLED'} for this company!`);
      setTimeout(() => setSuccess(''), 3000);
      fetchCompanies(); // Refresh companies list
      viewCompanyDetails(selectedCompany.companyId); // Refresh details
    } catch (error) {
      console.error('Error toggling points:', error);
      setError(error.message || 'Failed to toggle points');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingPointsToggle(false);
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
        `https://melaback.vercel.app/api/payments/${selectedPayment._id}/verify`,
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
      
      // Refresh company details to show updated payment and calendar
      if (selectedCompany) {
        // Refresh immediately
        viewCompanyDetails(selectedCompany.companyId);
        // Refresh again after a delay to ensure backend has updated
        setTimeout(() => {
          viewCompanyDetails(selectedCompany.companyId);
        }, 2000);
      }
      
      // Also refresh the companies list to update calendar data
      fetchCompanies();
    } catch (error) {
      console.error('Error verifying payment:', error);
      setError(error.message || 'Failed to verify payment');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (companyId, currentStatus) => {
    try {
      if (currentStatus === 'active') {
        // Pause the company
        await fetch(`https://melaback.vercel.app/api/payments/company/${companyId}/pause`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') }
        });
        setSuccess('Company paused successfully!');
      } else {
        // Reactivate the company (24-hour window)
        await fetch(`https://melaback.vercel.app/api/payments/company/${companyId}/play`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') }
        });
        setSuccess('Company reactivated for 24 hours!');
      }
      fetchCompanies();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update status');
    }
  };

  const unpauseCompany = async (companyId) => {
    try {
      const response = await fetch(`https://melaback.vercel.app/api/admin/companies/${companyId}/unpause`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Company unpaused successfully! Company has 24 hours to complete payment.');
        fetchCompanies();
        if (selectedCompany && selectedCompany.companyId === companyId) {
          viewCompanyDetails(companyId); // Refresh details
        }
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.message || 'Failed to unpause company');
      }
    } catch (error) {
      setError('Failed to unpause company');
    }
  };

  const deleteCompany = async (companyId) => {
    if (!window.confirm('⚠️ Delete this company and ALL its data? This cannot be undone!')) return;
    try {
      await fetch(`https://melaback.vercel.app/api/admin/companies/${companyId}`, {
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

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-[#141414]' 
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
    }`}
    style={isDarkMode ? { backgroundColor: '#141414' } : {}}
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Beautiful Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div className="flex items-center gap-5">
              <div className={`relative p-4 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode 
                  ? 'bg-[#141414] shadow-gray-500/25' 
                  : 'bg-white shadow-gray-500/30'
              }`}
              style={isDarkMode ? { backgroundColor: '#141414' } : {}}
              >
                <Building2 size={32} className={isDarkMode ? 'text-white' : 'text-black'} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className={`text-4xl font-black mb-2 bg-gradient-to-r ${
                  isDarkMode 
                    ? 'from-white via-blue-100 to-purple-200 text-transparent bg-clip-text' 
                    : 'from-gray-900 via-blue-800 to-indigo-900 text-transparent bg-clip-text'
                }`}>
                  Super Admin
                </h1>
                <p className={`text-base font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  ✨ Master Control Center • Manage companies with elegance
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => navigate('/xq7m9k2p8n4r6t1w/messages')} 
                className={`group flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  isDarkMode 
                    ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-600 backdrop-blur-sm' 
                    : 'bg-white/80 hover:bg-white text-gray-700 border border-gray-200 backdrop-blur-sm shadow-sm'
                }`}
              >
                <Mail size={16} className="group-hover:animate-pulse" /> 
                <span className="hidden sm:inline">Messages</span>
              </button>
              <button 
                onClick={() => {
                  const token = new URLSearchParams(window.location.search).get('token');
                  navigate(`/xq7m9k2p8n4r6t1w/settings${token ? `?token=${token}` : ''}`);
                }} 
                className={`group flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  isDarkMode 
                    ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-600 backdrop-blur-sm' 
                    : 'bg-white/80 hover:bg-white text-gray-700 border border-gray-200 backdrop-blur-sm shadow-sm'
                }`}
              >
                <Settings size={16} className="group-hover:rotate-90 transition-transform duration-300" /> 
                <span className="hidden sm:inline">Settings</span>
              </button>
              <button 
                onClick={() => navigate('/xq7m9k2p8n4r6t1w/add-company')} 
                className={`group flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                  isDarkMode 
                    ? 'bg-[#141414] hover:bg-gray-800 text-white shadow-gray-500/25' 
                    : 'bg-white hover:bg-gray-100 text-black shadow-gray-500/30'
                }`}
                style={isDarkMode ? { backgroundColor: '#141414' } : {}}
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /> 
                <span className="hidden sm:inline">Add Company</span>
              </button>
            </div>
          </div>
        </div>

        {/* Beautiful Alerts */}
        {error && (
          <div className={`mb-6 p-4 rounded-2xl border-2 flex items-center gap-4 animate-in slide-in-from-top-2 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-red-900/30 to-red-800/30 border-red-600/50 shadow-red-500/25 backdrop-blur-sm' 
              : 'bg-gradient-to-r from-red-50 to-red-100 border-red-300 shadow-red-500/25 backdrop-blur-sm'
          } shadow-lg`}>
            <div className={`p-2 rounded-xl ${
              isDarkMode ? 'bg-red-600/20' : 'bg-red-100'
            }`}>
              <AlertCircle className={isDarkMode ? 'text-red-400' : 'text-red-600'} size={20} />
            </div>
            <span className={`flex-1 text-sm font-bold ${
              isDarkMode ? 'text-red-300' : 'text-red-700'
            }`}>
              ⚠️ {error}
            </span>
            <button 
              onClick={() => setError('')} 
              className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                isDarkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-200'
              }`}
            >
              <X size={18} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
            </button>
          </div>
        )}
        {success && (
          <div className={`mb-6 p-4 rounded-2xl border-2 flex items-center gap-4 animate-in slide-in-from-top-2 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-green-900/30 to-green-800/30 border-green-600/50 shadow-green-500/25 backdrop-blur-sm' 
              : 'bg-gradient-to-r from-green-50 to-green-100 border-green-300 shadow-green-500/25 backdrop-blur-sm'
          } shadow-lg`}>
            <div className={`p-2 rounded-xl ${
              isDarkMode ? 'bg-green-600/20' : 'bg-green-100'
            }`}>
              <CheckCircle className={isDarkMode ? 'text-green-400' : 'text-green-600'} size={20} />
            </div>
            <span className={`flex-1 text-sm font-bold ${
              isDarkMode ? 'text-green-300' : 'text-green-700'
            }`}>
              ✅ {success}
            </span>
            <button 
              onClick={() => setSuccess('')} 
              className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                isDarkMode ? 'hover:bg-green-900/30' : 'hover:bg-green-200'
              }`}
            >
              <X size={18} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
            </button>
          </div>
        )}



        {/* Companies List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className={`w-12 h-12 border-3 ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                } border-t-blue-600 rounded-full animate-spin`}></div>
              </div>
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Loading companies...
              </p>
            </div>
          </div>
        ) : companies.length === 0 ? (
          <div className={`text-center py-20 px-6 rounded-3xl border-2 border-dashed transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-600 hover:border-blue-500/50 backdrop-blur-sm' 
              : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-300 hover:border-blue-400 backdrop-blur-sm'
          }`}>
            <div className={`inline-flex p-6 rounded-full mb-6 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/25' 
                : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30'
            }`}>
              <Building2 size={48} className="text-white" />
            </div>
            <h3 className={`text-2xl font-black mb-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              No Companies Yet
            </h3>
            <p className={`text-base font-medium mb-8 max-w-md mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              ✨ Ready to get started? Create your first company and begin managing subscriptions with style!
            </p>
            <button 
              onClick={() => navigate('/xq7m9k2p8n4r6t1w/add-company')} 
              className={`group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-black transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-500/25' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/30'
              }`}
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> 
              Create First Company
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {companies.map(company => (
              <div 
                key={company.companyId} 
                onClick={() => viewCompanyDetails(company.companyId)}
                className={`relative rounded-2xl border shadow-lg transition-all duration-300 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 backdrop-blur-sm' 
                    : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50 backdrop-blur-sm'
                }`}
              >


                {/* Beautiful Card Content */}
                <div className="p-6 pt-8">
                  {/* Enhanced Profile Picture (Logo) */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      {company.branding?.logo ? (
                        <img 
                          src={company.branding.logo} 
                          alt={company.name} 
                          className="w-24 h-24 rounded-2xl object-cover border-3 border-white shadow-xl"
                          onError={(e) => { 
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }} 
                        />
                      ) : null}
                      <div 
                        className={`w-24 h-24 rounded-2xl flex items-center justify-center border-3 shadow-xl ${
                          isDarkMode 
                            ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600' 
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
                        }`}
                        style={{ display: company.branding?.logo ? 'none' : 'flex' }}
                      >
                        <Building2 size={36} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                      </div>
                      {/* Beautiful Status indicator */}
                      <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-3 shadow-lg ${
                        isDarkMode ? 'border-gray-800' : 'border-white'
                      } ${
                        company.status === 'active' 
                          ? 'bg-gradient-to-r from-green-400 to-green-500 animate-pulse' 
                          : 'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}>
                        <div className={`absolute inset-1 rounded-full ${
                          company.status === 'active' ? 'bg-green-300 animate-ping' : 'bg-gray-300'
                        }`}></div>
                      </div>
                    </div>
                  </div>

                  {/* Beautiful Company Name */}
                  <h3 className={`text-lg font-black text-center mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {company.name}
                  </h3>

                  {/* Enhanced Admin Email */}
                  <p className={`text-sm text-center mb-4 font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {company.adminEmail}
                  </p>

                  {/* Beautiful Company ID */}
                  <div className={`text-xs text-center mb-3 px-3 py-2 rounded-xl font-mono font-bold ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-200 border border-gray-600' 
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300'
                  }`}>
                    {company.companyId}
                  </div>

                  {/* Status Badge */}
                  <div className="flex justify-center mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      company.status === 'active'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/25'
                        : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-gray-500/25'
                    } shadow-lg`}>
                      {company.status === 'active' ? '🟢 Active' : '⏸️ Paused'}
                    </span>
                  </div>

                  {/* Created Date */}
                  {company.createdAt && (
                    <p className={`text-xs text-center mb-6 font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      📅 Created {new Date(company.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className={`grid grid-cols-2 gap-3 pt-6 mt-4 border-t ${
                    isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
                  }`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Use actual company status for toggle
                        toggleStatus(company.companyId, company.status);
                      }}
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                        isDarkMode ? 'bg-gray-800' : 'bg-white'
                      } ${
                        (() => {
                          // Calculate effective status for styling
                          const now = new Date();
                          const paymentDeadline = company.paymentDeadline ? new Date(company.paymentDeadline) : null;
                          const gracePeriodDeadline = company.gracePeriodDeadline ? new Date(company.gracePeriodDeadline) : null;
                          const deadlinePassed = paymentDeadline && now >= paymentDeadline && 
                                                company.paymentMode === 'paid' && !company.hasPaid;
                          const gracePeriodExpired = gracePeriodDeadline && now >= gracePeriodDeadline && 
                                                     company.paymentMode === 'paid' && !company.hasPaid;
                          
                          const effectiveStatus = (gracePeriodExpired || company.status === 'paused') ? 'paused' : 'active';
                          
                          return effectiveStatus === 'active'
                            ? isDarkMode
                              ? 'border-orange-500 text-orange-400 hover:bg-orange-900/20'
                              : 'border-orange-500 text-orange-600 hover:bg-orange-50'
                            : isDarkMode
                              ? 'border-green-500 text-green-400 hover:bg-green-900/20'
                              : 'border-green-500 text-green-600 hover:bg-green-50';
                        })()
                      }`}
                    >
                      {(() => {
                        // Calculate effective status based on grace period and deadline
                        const now = new Date();
                        const paymentDeadline = company.paymentDeadline ? new Date(company.paymentDeadline) : null;
                        const gracePeriodDeadline = company.gracePeriodDeadline ? new Date(company.gracePeriodDeadline) : null;
                        const deadlinePassed = paymentDeadline && now >= paymentDeadline && 
                                              company.paymentMode === 'paid' && !company.hasPaid;
                        const gracePeriodExpired = gracePeriodDeadline && now >= gracePeriodDeadline && 
                                                   company.paymentMode === 'paid' && !company.hasPaid;
                        
                        // If grace period expired, company should be paused
                        const effectiveStatus = (gracePeriodExpired || company.status === 'paused') ? 'paused' : 'active';
                        return effectiveStatus === 'active' ? (
                          <>
                            <Pause size={16}/>
                            Pause
                          </>
                        ) : (
                          <>
                            <Play size={16}/>
                            Activate
                          </>
                        );
                      })()}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCompany(company.companyId);
                      }}
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-500 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                        isDarkMode 
                          ? 'bg-gray-800 text-red-400 hover:bg-red-900/20' 
                          : 'bg-white text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <Trash2 size={16}/>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } rounded-lg border ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            } w-full max-w-2xl max-h-[90vh] shadow-lg overflow-y-auto`}>
              {/* Header */}
              <div className={`flex justify-between items-center p-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <Building2 size={20} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'} />
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {createdCompany ? 'Company Created!' : 'Add New Company'}
                    </h2>
                    <p className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {createdCompany ? 'Successfully set up new organization' : 'Create a new organization with admin access'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={closeModal} 
                  className={`p-1.5 rounded transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>
              
              {createdCompany ? (
                <div className="p-5 space-y-4">
                  {/* Success Animation */}
                  <div className="text-center py-4">
                    <div className={`w-16 h-16 rounded-full ${
                      isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                    } flex items-center justify-center mx-auto mb-3`}>
                      <CheckCircle size={32} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
                    </div>
                    <h3 className={`text-xl font-semibold mb-1 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {createdCompany.company.name}
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Company created and ready to use!
                    </p>
                  </div>

                  {/* Info Cards */}
                  <div className="space-y-3">
                    <div className={`p-4 rounded-lg border ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                        <label className={`text-xs font-semibold ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Company ID
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className={`flex-1 font-mono text-sm font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        } p-2 rounded ${
                          isDarkMode ? 'bg-gray-900' : 'bg-white'
                        }`}>
                          {createdCompany.company.companyId}
                        </code>
                        <button 
                          onClick={() => copyToClipboard(createdCompany.company.companyId)} 
                          className={`p-2 rounded transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                          }`}
                        >
                          <Copy size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                        </button>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <User size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                        <label className={`text-xs font-semibold ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Admin Username
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className={`flex-1 font-mono text-sm font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        } p-2 rounded ${
                          isDarkMode ? 'bg-gray-900' : 'bg-white'
                        }`}>
                          {createdCompany.adminUsername}
                        </code>
                        <button 
                          onClick={() => copyToClipboard(createdCompany.adminUsername)} 
                          className={`p-2 rounded transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                          }`}
                        >
                          <Copy size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                        </button>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <LinkIcon size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                        <label className={`text-xs font-semibold ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Company Login Link
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className={`flex-1 font-mono text-xs break-all ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        } p-2 rounded ${
                          isDarkMode ? 'bg-gray-900' : 'bg-white'
                        }`}>
                          {createdCompany.companyLink}
                        </code>
                        <button 
                          onClick={() => copyToClipboard(createdCompany.companyLink)} 
                          className={`p-2 rounded transition-colors flex-shrink-0 ${
                            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                          }`}
                        >
                          <Copy size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                        </button>
                      </div>
                    </div>

                    {/* Next Steps */}
                    <div className={`p-4 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-blue-900/20 border-blue-700/30' 
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded ${
                          isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                        } flex-shrink-0`}>
                          <AlertCircle size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                        </div>
                        <div>
                          <h4 className={`text-sm font-semibold mb-1 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Next Steps
                          </h4>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Share the company link and admin credentials with the client. They can login immediately and manage their own users.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={closeModal} 
                    className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={createCompany} className="p-5 sm:p-7 space-y-5 sm:space-y-6">
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
                      onClick={closeModal} 
                      className={`sm:w-32 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} py-4 rounded-xl font-bold transition-all duration-200 active:scale-95`}
                    >
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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn" onClick={closeDetailsModal}>
            <div className={`${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200'} border-2 rounded-2xl sm:rounded-3xl w-full max-w-5xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className={`flex justify-between items-center p-5 sm:p-7 border-b-2 ${isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-white/50'} sticky top-0 backdrop-blur-sm z-10`}>
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {selectedCompany.branding?.logo ? (
                    <div className="relative flex-shrink-0">
                      <img src={selectedCompany.branding.logo} alt="Logo" className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-2xl p-2 bg-white shadow-lg" onError={(e) => { e.target.parentElement.innerHTML = `<div class="p-4 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-800 to-black'} shadow-lg flex-shrink-0"><svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path></svg></div>`; }} />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${selectedCompany.status === 'active' ? 'bg-green-500' : 'bg-orange-500'} border-2 ${isDarkMode ? 'border-gray-900' : 'border-white'} shadow-lg`}></div>
                    </div>
                  ) : (
                    <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-800 to-black'} shadow-lg flex-shrink-0`}>
                      <Building2 size={28} className="text-white" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate mb-1`}>{selectedCompany.name}</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-mono bg-black/20 px-3 py-1 rounded-lg inline-block`}>{selectedCompany.companyId}</p>
                  </div>
                </div>
                <button onClick={closeDetailsModal} className={`p-3 rounded-xl ${isDarkMode ? 'hover:bg-gray-800 bg-gray-800/50' : 'hover:bg-gray-100 bg-gray-100/50'} active:scale-95 transition-all duration-200 flex-shrink-0`}>
                  <X size={22} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>

              <div className="p-5 sm:p-7 space-y-5 sm:space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className={`p-4 rounded-lg border transition-all ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className={`p-2 rounded-lg inline-block mb-2 ${
                      selectedCompany.status === 'active' 
                        ? (isDarkMode ? 'bg-green-900/30' : 'bg-green-100') 
                        : (isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100')
                    }`}>
                      <Activity size={16} className={
                        selectedCompany.status === 'active' 
                          ? (isDarkMode ? 'text-green-400' : 'text-green-600') 
                          : (isDarkMode ? 'text-orange-400' : 'text-orange-600')
                      } />
                    </div>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Status
                    </p>
                    <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold uppercase ${
                      selectedCompany.status === 'active' 
                        ? (isDarkMode ? 'bg-green-600 text-white' : 'bg-green-600 text-white')
                        : (isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-900')
                    }`}>
                      {selectedCompany.status}
                    </span>
                    {/* Unpause button for paused companies */}
                    {selectedCompany.status === 'paused' && (
                      <button
                        onClick={() => unpauseCompany(selectedCompany.companyId)}
                        className={`mt-3 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          isDarkMode 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } flex items-center justify-center gap-1.5`}
                      >
                        <Play size={14} />
                        Unpause (24h)
                      </button>
                    )}
                  </div>
                  <div className={`p-4 rounded-lg border transition-all ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className={`p-2 rounded-lg inline-block mb-2 ${
                      selectedCompany.subscriptionStatus === 'paid' 
                        ? (isDarkMode ? 'bg-green-900/30' : 'bg-green-100') 
                        : (isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100')
                    }`}>
                      <DollarSign size={16} className={
                        selectedCompany.subscriptionStatus === 'paid' 
                          ? (isDarkMode ? 'text-green-400' : 'text-green-600') 
                          : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
                      } />
                    </div>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Subscription
                    </p>
                    <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold uppercase ${
                      selectedCompany.subscriptionStatus === 'paid' 
                        ? (isDarkMode ? 'bg-green-600 text-white' : 'bg-green-600 text-white')
                        : (isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-900')
                    }`}>
                      {selectedCompany.subscriptionStatus}
                    </span>
                  </div>
                  <div className={`p-4 rounded-lg border transition-all sm:col-span-2 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className={`p-2 rounded-lg inline-block mb-2 ${
                      isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                    }`}>
                      <Users size={16} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    </div>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Admin Contact
                    </p>
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    } truncate`}>
                      {selectedCompany.adminEmail}
                    </p>
                    {selectedCompany.adminPhone && (
                      <p className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      } flex items-center gap-1 mt-1`}>
                        <Phone size={12} />
                        {selectedCompany.adminPhone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Mode Toggle */}
                <div className={`p-4 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-blue-900/20 border-blue-700/30' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                      }`}>
                        <DollarSign className={`w-5 h-5 ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className={`text-base font-semibold mb-1 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Payment Mode
                        </h3>
                        <p className={`text-xs ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {(selectedCompany.paymentMode || 'paid') === 'paid' 
                            ? 'Requires payment' 
                            : 'Free mode - no payment required'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleTogglePaymentMode}
                      disabled={updatingPaymentMode}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                        (selectedCompany.paymentMode || 'paid') === 'paid'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                    >
                      {updatingPaymentMode ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          {(selectedCompany.paymentMode || 'paid') === 'paid' ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Make FREE</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4" />
                              <span>Make PAID</span>
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Points System Toggle */}
                <div className={`p-4 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-purple-900/20 border-purple-700/30' 
                    : 'bg-purple-50 border-purple-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'
                      }`}>
                        <TrendingUp className={`w-5 h-5 ${
                          isDarkMode ? 'text-purple-400' : 'text-purple-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className={`text-base font-semibold mb-1 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Points System
                        </h3>
                        <p className={`text-xs ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {(selectedCompany.pointsEnabled !== false) 
                            ? 'Points are being awarded' 
                            : 'Points are disabled - no points will be awarded'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleTogglePoints}
                      disabled={updatingPointsToggle}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                        (selectedCompany.pointsEnabled !== false)
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {updatingPointsToggle ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          {(selectedCompany.pointsEnabled !== false) ? (
                            <>
                              <Pause className="w-4 h-4" />
                              <span>Disable Points</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              <span>Enable Points</span>
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Payment Status with Countdown */}
                <CompanyPaymentStatus 
                  company={selectedCompany} 
                  onRefresh={() => viewCompanyDetails(selectedCompany.companyId)} 
                />



                {/* Company Limits */}
                <div className={`p-4 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Users className={`w-5 h-5 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`} />
                      <h3 className={`text-base font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Company Limits
                      </h3>
                    </div>
                    {!editingLimits && (
                      <button
                        onClick={() => setEditingLimits(true)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                        }`}
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
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={handleUpdateLimits}
                          disabled={loading}
                          className={`flex-1 px-4 py-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-900 hover:bg-black'} text-white text-sm rounded-lg transition-colors disabled:opacity-50`}
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
                    <div className={`p-3 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <p className={`text-xs font-medium mb-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Max Users
                      </p>
                      <p className={`text-xl font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {selectedCompany.limits?.maxUsers || 50}
                      </p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                {companyDetails && (
                  <div>
                    <h3 className={`text-base font-semibold mb-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Company Statistics
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className={`p-4 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                      }`}>
                        <Users size={20} className={`${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        } mb-2`} />
                        <p className={`text-xl font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {companyDetails.userCount}
                        </p>
                        <p className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Total Users
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                      }`}>
                        <Activity size={20} className={`${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        } mb-2`} />
                        <p className={`text-xl font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {companyDetails.activeUsers}
                        </p>
                        <p className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Active Users
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg border col-span-2 sm:col-span-1 ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                      }`}>
                        <Building2 size={20} className={`${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        } mb-2`} />
                        <p className={`text-xl font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {selectedCompany.limits?.maxUsers || 50}
                        </p>
                        <p className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          User Limit
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Company Calendar */}
                <CompanyCalendar company={selectedCompany} />

                {/* Company Link */}
                <div className={`p-4 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Company Login Link
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <code className={`flex-1 font-mono text-xs break-all p-2 rounded-md ${
                      isDarkMode 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-white text-gray-900'
                    }`}>
                      {selectedCompany.companyLink}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(selectedCompany.companyLink)} 
                      className={`p-2 rounded-md transition-colors flex-shrink-0 ${
                        isDarkMode 
                          ? 'hover:bg-gray-700 bg-gray-700/50' 
                          : 'hover:bg-gray-200 bg-gray-200/50'
                      }`}
                    >
                      <Copy size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                    </button>
                  </div>
                </div>

                {/* Payments Section */}
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                      <DollarSign size={18} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} sm:w-5 sm:h-5`} />
                      <span className="hidden sm:inline">Payment History</span>
                      <span className="sm:hidden">Payments</span>
                    </h3>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      {companyPayments.length}
                    </span>
                  </div>
                  
                  {companyPayments.length === 0 ? (
                    <div className={`p-8 rounded-xl text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <DollarSign size={48} className={`mx-auto mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No payments submitted yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {companyPayments.map((payment) => (
                        <div
                          key={payment._id}
                          className={`p-4 rounded-lg border transition-all ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-lg font-bold ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {payment.amount.toFixed(2)} ETB
                                </span>
                                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                                  payment.status === 'approved'
                                    ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                                    : (isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
                                }`}>
                                  {payment.status}
                                </span>
                              </div>
                              <p className={`text-xs mb-1 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                <span className="font-medium">Period:</span> {payment.period.months && payment.period.months.length > 0
                                  ? payment.period.months.map(m => 
                                      new Date(2000, m - 1).toLocaleString('default', { month: 'short' })
                                    ).join(', ') + ' ' + payment.period.year
                                  : 'N/A'}
                              </p>
                              <p className={`text-xs ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                <span className="font-medium">Submitted:</span> {new Date(payment.createdAt).toLocaleDateString()}
                              </p>
                              {payment.note && payment.paymentMethod !== 'chapa' && (
                                <p className={`text-xs mt-2 p-2 rounded-md ${
                                  isDarkMode 
                                    ? 'bg-gray-700 text-gray-300' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  <span className="font-medium">Note:</span> {payment.note}
                                </p>
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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn" onClick={() => setShowVerifyModal(false)}>
            <div className={`${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200'} border-2 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl animate-scaleIn`} onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className={`p-5 sm:p-7 border-b-2 ${isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-white/50'} backdrop-blur-sm`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${verifyAction === 'approved' ? (isDarkMode ? 'bg-white' : 'bg-black') : (isDarkMode ? 'bg-gray-700' : 'bg-gray-400')} shadow-lg`}>
                    {verifyAction === 'approved' ? <CheckCircle size={28} className={isDarkMode ? 'text-black' : 'text-white'} /> : <XCircle size={28} className={isDarkMode ? 'text-white' : 'text-black'} />}
                  </div>
                  <div>
                    <h2 className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {verifyAction === 'approved' ? 'Approve Payment' : 'Reject Payment'}
                    </h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                      {verifyAction === 'approved' ? 'Confirm payment approval' : 'Provide rejection reason'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 sm:p-7 space-y-4 sm:space-y-5">
                {/* Payment Info Card */}
                <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                      <DollarSign size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    </div>
                    <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Payment Details</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Company</span>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedPayment.companyName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Amount</span>
                      <span className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedPayment.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Period</span>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} px-3 py-1 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        {selectedPayment.period.months && selectedPayment.period.months.length > 0
                          ? selectedPayment.period.months.map(m => 
                              new Date(2000, m - 1).toLocaleString('default', { month: 'short' })
                            ).join(', ') + ' ' + selectedPayment.period.year
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rejection Reason */}
                {verifyAction === 'rejected' && (
                  <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-red-900/20 to-orange-900/20 border-2 border-red-700/50' : 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'}`}>
                        <AlertCircle size={18} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
                      </div>
                      <label className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Rejection Reason *
                      </label>
                    </div>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                      className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium ${
                        isDarkMode
                          ? 'bg-gray-900/50 border-red-700/50 text-white placeholder-gray-500 focus:border-red-600'
                          : 'bg-white border-red-300 text-gray-900 placeholder-gray-400 focus:border-red-500'
                      } focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-red-700/50' : 'focus:ring-red-400/50'} transition-all`}
                      placeholder="Provide a clear reason for rejecting this payment..."
                      required
                    />
                    <p className={`text-xs mt-2 ${isDarkMode ? 'text-red-400' : 'text-red-700'} flex items-start gap-1`}>
                      <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                      <span>This reason will be sent to the company admin.</span>
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleVerifyPayment}
                    disabled={loading}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-white text-base font-black shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      verifyAction === 'approved'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/50'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/50'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        {verifyAction === 'approved' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                        Confirm {verifyAction === 'approved' ? 'Approval' : 'Rejection'}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowVerifyModal(false)}
                    disabled={loading}
                    className={`sm:w-32 px-4 py-4 rounded-xl text-base font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                      isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
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
