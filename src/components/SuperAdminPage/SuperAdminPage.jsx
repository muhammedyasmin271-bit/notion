import React, { useState, useEffect } from 'react';
import { Building2, Users, Pause, Play, Trash2, Plus, X, TrendingUp, DollarSign, Activity, AlertCircle, CheckCircle, Upload, Copy, Link as LinkIcon, Eye, XCircle, Settings, Phone, User, Lock, ToggleLeft, ToggleRight, Mail } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import CompanyCalendar from '../CompanyCalendar/CompanyCalendar';

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

  const [editingLimits, setEditingLimits] = useState(false);
  const [limitsForm, setLimitsForm] = useState({ maxUsers: 50, maxStorage: 5368709120 });
  const [updatingPaymentMode, setUpdatingPaymentMode] = useState(false);

  // Define fetchCompanies before useEffects to avoid hooks order issues
  const fetchCompanies = React.useCallback(async () => {
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
        navigate('/super-admin/login', { replace: true });
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
          navigate('/super-admin/login', { replace: true });
          return;
        }

        // All checks passed - authorize access
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error verifying super admin access:', error);
        navigate('/super-admin/login', { replace: true });
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

  // Don't render anything until authorized
  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
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
    setFormData({ name: '', adminEmail: '', adminPhone: '', maxUsers: 50, maxStorage: 5368709120, adminUsername: '', adminPassword: '', logo: '', selectedPlan: 'free_trial' });
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

  const handleTogglePaymentMode = async () => {
    setUpdatingPaymentMode(true);
    try {
      const token = localStorage.getItem('token');
      const currentMode = selectedCompany.paymentMode || 'paid'; // Default to 'paid' if undefined
      const newMode = currentMode === 'paid' ? 'free' : 'paid';
      
      const response = await fetch(`http://localhost:9000/api/admin/companies/${selectedCompany.companyId}/payment-mode`, {
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

  const unpauseCompany = async (companyId) => {
    try {
      const response = await fetch(`http://localhost:9000/api/admin/companies/${companyId}/unpause`, {
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

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white' : 'bg-black'} shadow-xl`}>
              <Building2 size={32} className={isDarkMode ? 'text-black' : 'text-white'} />
            </div>
            <div>
              <h1 className={`text-4xl sm:text-5xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Super Admin
              </h1>
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage all companies and subscriptions</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/super-admin/messages')} 
              className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${isDarkMode ? 'bg-gray-900 hover:bg-gray-800 text-white border border-gray-800' : 'bg-white hover:bg-gray-50 text-black border-2 border-gray-200 shadow-md'}`}
            >
              <Mail size={20} /> <span className="hidden sm:inline">Messages</span>
            </button>
            <button 
              onClick={() => {
                const token = new URLSearchParams(window.location.search).get('token');
                navigate(`/super-admin/settings${token ? `?token=${token}` : ''}`);
              }} 
              className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${isDarkMode ? 'bg-gray-900 hover:bg-gray-800 text-white border border-gray-800' : 'bg-white hover:bg-gray-50 text-black border-2 border-gray-200 shadow-md'}`}
            >
              <Settings size={20} /> <span className="hidden sm:inline">Settings</span>
            </button>
            <button 
              onClick={() => setShowModal(true)} 
              className={`flex items-center gap-2 ${isDarkMode ? 'bg-white hover:bg-gray-100 text-black' : 'bg-black hover:bg-gray-900 text-white'} px-6 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
            >
              <Plus size={20} /> <span className="hidden sm:inline">Add Company</span>
            </button>
          </div>
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

        {/* Companies List */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="text-center">
              <div className="relative inline-block">
                <div className={`w-20 h-20 border-4 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} rounded-full`}></div>
                <div className={`w-20 h-20 border-4 ${isDarkMode ? 'border-white' : 'border-black'} border-t-transparent rounded-full animate-spin absolute top-0 left-0`}></div>
              </div>
              <p className={`mt-6 text-lg font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading companies...</p>
            </div>
          </div>
        ) : companies.length === 0 ? (
          <div className={`text-center py-24 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-2 rounded-3xl shadow-2xl`}>
            <div className={`inline-flex p-8 rounded-3xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} mb-6 shadow-lg`}>
              <Building2 size={72} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <p className={`text-2xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>No companies yet</p>
            <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>Create your first company to get started</p>
            <button 
              onClick={() => setShowModal(true)} 
              className={`inline-flex items-center gap-2 ${isDarkMode ? 'bg-white hover:bg-gray-100 text-black' : 'bg-black hover:bg-gray-900 text-white'} px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
            >
              <Plus size={20} /> Create First Company
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {companies.map(company => (
              <div 
                key={company.companyId} 
                className={`group relative overflow-hidden ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-2 rounded-3xl p-6 sm:p-8 shadow-2xl hover:shadow-3xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1`} 
                onClick={() => viewCompanyDetails(company.companyId)}
              >
                {/* Status indicator line */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${company.status === 'active' ? (isDarkMode ? 'bg-white' : 'bg-black') : 'bg-gray-500'} shadow-lg`}></div>
                
                <div className="relative flex flex-col gap-6">
                  <div className="flex flex-col items-center gap-4">
                    {/* Logo Section */}
                    <div className="relative flex-shrink-0">
                      {company.branding?.logo ? (
                        <div className="relative">
                          <img src={company.branding.logo} alt={company.name} className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-2xl p-3 bg-white/90 shadow-xl border-2 border-gray-200" onError={(e) => { e.target.parentElement.innerHTML = `<div class="w-24 h-24 sm:w-28 sm:h-28 p-4 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-2xl shadow-xl flex items-center justify-center border-2 border-gray-200"><svg class="w-10 h-10 ${isDarkMode ? 'text-black' : 'text-white'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path></svg></div>`; }} />
                          <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${company.status === 'active' ? (isDarkMode ? 'bg-white' : 'bg-black') : 'bg-gray-500'} border-2 ${isDarkMode ? 'border-gray-900' : 'border-white'} shadow-lg animate-pulse`}></div>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className={`w-24 h-24 sm:w-28 sm:h-28 p-4 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-2xl shadow-xl flex items-center justify-center border-2 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                            <Building2 size={40} className={isDarkMode ? 'text-black' : 'text-white'} />
                          </div>
                          <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${company.status === 'active' ? (isDarkMode ? 'bg-white' : 'bg-black') : 'bg-gray-500'} border-2 ${isDarkMode ? 'border-gray-900' : 'border-white'} shadow-lg animate-pulse`}></div>
                        </div>
                      )}
                    </div>

                    {/* Company Info */}
                    <div className="flex flex-col items-center w-full gap-3">
                      <h3 className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} text-center leading-tight`}>
                        {company.name}
                      </h3>
                      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl w-full ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'} justify-center`}>
                        <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <Users size={14} className={isDarkMode ? 'text-white' : 'text-black'} />
                        </div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} truncate`}>
                          {company.adminEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className={`relative flex gap-2.5 w-full pt-5 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => viewCompanyDetails(company.companyId)} 
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-white hover:bg-gray-100 text-black' : 'bg-black hover:bg-gray-900 text-white'} shadow-lg hover:shadow-xl hover:scale-105`}
                    >
                      <Eye size={18} />
                      <span className="hidden sm:inline">View</span>
                    </button>
                    <button 
                      onClick={() => toggleStatus(company.companyId, company.status)} 
                      className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-black'} shadow-lg hover:shadow-xl hover:scale-105`} 
                      title={company.status === 'active' ? 'Pause Company' : 'Activate Company'}
                    >
                      {company.status === 'active' ? <Pause size={18}/> : <Play size={18}/>}
                      <span className="hidden sm:inline">{company.status === 'active' ? 'Pause' : 'Play'}</span>
                    </button>
                    <button 
                      onClick={() => deleteCompany(company.companyId)} 
                      className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold transition-all duration-300 active:scale-95 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-300 hover:bg-gray-400 text-black'} shadow-lg hover:shadow-xl hover:scale-105`} 
                      title="Delete Company"
                    >
                      <Trash2 size={18}/>
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
            <div className={`${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200'} border-2 rounded-2xl sm:rounded-3xl w-full max-w-3xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 hover:shadow-3xl`}>
              {/* Header */}
              <div className={`flex justify-between items-center p-5 sm:p-7 border-b-2 ${isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-white/50'} sticky top-0 backdrop-blur-sm z-10`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 sm:p-4 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-800 to-black'} shadow-lg`}>
                    <Building2 size={28} className="text-white" />
                  </div>
                  <div>
                    <h2 className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {createdCompany ? '🎉 Company Created!' : 'Add New Company'}
                    </h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                      {createdCompany ? 'Successfully set up new organization' : 'Create a new organization with admin access'}
                    </p>
                  </div>
                </div>
                <button onClick={closeModal} className={`p-3 rounded-xl ${isDarkMode ? 'hover:bg-gray-800 bg-gray-800/50' : 'hover:bg-gray-100 bg-gray-100/50'} active:scale-95 transition-all duration-200`}>
                  <X size={22} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>
              
              {createdCompany ? (
                <div className="p-5 sm:p-7 space-y-5 sm:space-y-6">
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

                    {/* Next Steps */}
                    <div className={`p-5 rounded-2xl border-2 ${isDarkMode ? 'bg-white/10 border-white/20' : 'bg-black/10 border-black/20'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'} flex-shrink-0`}>
                          <AlertCircle size={20} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                        </div>
                        <div>
                          <h4 className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Next Steps</h4>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Share the company link and admin credentials with the client. They can login immediately and manage their own users.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button onClick={closeModal} className={`w-full ${isDarkMode ? 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700' : 'bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900'} text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95`}>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className={`p-4 sm:p-5 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg hover:shadow-xl transition-all`}>
                    <div className={`p-2 rounded-lg ${selectedCompany.status === 'active' ? 'bg-green-500/20' : 'bg-orange-500/20'} inline-block mb-2`}>
                      <Activity size={18} className={selectedCompany.status === 'active' ? 'text-green-500' : 'text-orange-500'} />
                    </div>
                    <p className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Status</p>
                    <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black uppercase ${selectedCompany.status === 'active' ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') : (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-black')}`}>
                      {selectedCompany.status}
                    </span>
                    {/* Unpause button for paused companies */}
                    {selectedCompany.status === 'paused' && (
                      <button
                        onClick={() => unpauseCompany(selectedCompany.companyId)}
                        className={`mt-3 w-full ${isDarkMode ? 'bg-white hover:bg-gray-200 text-black' : 'bg-black hover:bg-gray-800 text-white'} px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2`}
                      >
                        <Play size={16} />
                        Unpause Company (24h to pay)
                      </button>
                    )}
                  </div>
                  <div className={`p-4 sm:p-5 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg hover:shadow-xl transition-all`}>
                    <div className={`p-2 rounded-lg ${selectedCompany.subscriptionStatus === 'paid' ? 'bg-green-500/20' : 'bg-gray-500/20'} inline-block mb-2`}>
                      <DollarSign size={18} className={selectedCompany.subscriptionStatus === 'paid' ? 'text-green-500' : 'text-gray-500'} />
                    </div>
                    <p className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Subscription</p>
                    <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black uppercase ${selectedCompany.subscriptionStatus === 'paid' ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg' : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg'}`}>
                      {selectedCompany.subscriptionStatus}
                    </span>
                  </div>
                  <div className={`p-4 sm:p-5 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg hover:shadow-xl transition-all sm:col-span-2`}>
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'} inline-block mb-2`}>
                      <Users size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    </div>
                    <p className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Admin Contact</p>
                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>{selectedCompany.adminEmail}</p>
                    {selectedCompany.adminPhone && (
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-1 mt-1`}>
                        <Phone size={12} />
                        {selectedCompany.adminPhone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Mode Toggle */}
                <div className={`p-4 sm:p-5 rounded-xl border-2 ${isDarkMode ? 'bg-white/10 border-white/20' : 'bg-black/10 border-black/20'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                        <DollarSign className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <h3 className={`text-base sm:text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Payment Mode
                        </h3>
                        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {(selectedCompany.paymentMode || 'paid') === 'paid' 
                            ? 'Company needs payment to work' 
                            : 'Company is free - no payment required'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleTogglePaymentMode}
                      disabled={updatingPaymentMode}
                      className={`flex items-center gap-3 px-5 py-3 rounded-xl font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 ${
                        (selectedCompany.paymentMode || 'paid') === 'paid'
                          ? isDarkMode
                            ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white'
                            : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                          : isDarkMode
                            ? 'bg-white hover:bg-gray-200 text-black'
                            : 'bg-black hover:bg-gray-800 text-white'
                      }`}
                    >
                      {updatingPaymentMode ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          {(selectedCompany.paymentMode || 'paid') === 'paid' ? (
                            <>
                              <ToggleLeft className="w-5 h-5" />
                              <span>Switch to Free</span>
                            </>
                          ) : (
                            <>
                              <ToggleRight className="w-5 h-5" />
                              <span>Switch to Paid</span>
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                  <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Current Mode:
                      </span>
                      <span className={`px-4 py-1.5 rounded-lg text-sm font-bold ${
                        (selectedCompany.paymentMode || 'paid') === 'paid'
                          ? isDarkMode
                            ? 'bg-orange-900/30 text-orange-300 border border-orange-500/50'
                            : 'bg-orange-100 text-orange-700 border border-orange-300'
                          : isDarkMode
                            ? 'bg-green-900/30 text-green-300 border border-green-500/50'
                            : 'bg-green-100 text-green-700 border border-green-300'
                      }`}>
                        {(selectedCompany.paymentMode || 'paid') === 'paid' ? 'PAID' : 'FREE'}
                      </span>
                    </div>
                  </div>
                </div>



                {/* Company Limits */}
                <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-gray-100 border border-gray-300'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                    <div className="flex items-center gap-2">
                      <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <h3 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Company Limits</h3>
                    </div>
                    {!editingLimits && (
                      <button
                        onClick={() => setEditingLimits(true)}
                        className={`self-start sm:self-auto px-3 py-1.5 sm:py-1 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 hover:bg-gray-900'} text-white text-xs sm:text-sm rounded-lg transition-colors`}
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
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max Users</p>
                      <p className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
                      <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-gray-100 border border-gray-300'}`}>
                        <Users size={20} className={`sm:w-6 sm:h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`} />
                        <p className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{companyDetails.userCount}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
                      </div>
                      <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-gray-100 border border-gray-300'}`}>
                        <Activity size={20} className={`sm:w-6 sm:h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`} />
                        <p className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{companyDetails.activeUsers}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Users</p>
                      </div>
                      <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl col-span-2 sm:col-span-1 ${isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-gray-100 border border-gray-300'}`}>
                        <Building2 size={20} className={`sm:w-6 sm:h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`} />
                        <p className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedCompany.limits?.maxUsers || 50}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>User Limit</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Company Calendar */}
                <CompanyCalendar company={selectedCompany} />

                {/* Company Link */}
                <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>COMPANY LOGIN LINK</p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <code className={`flex-1 font-mono text-xs break-all ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedCompany.companyLink}</code>
                    <button onClick={() => copyToClipboard(selectedCompany.companyLink)} className={`p-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} rounded-lg transition-colors flex-shrink-0 self-start sm:self-auto`}>
                      <Copy size={16} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
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
                                  {payment.amount.toFixed(2)} ETB
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
                              {payment.note && payment.paymentMethod !== 'chapa' && (
                                <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} line-clamp-2`}>
                                  <strong>Note:</strong> {payment.note}
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
