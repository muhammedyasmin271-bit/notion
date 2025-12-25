import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Lock,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Users
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const CreateCompanyPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'free_trial';
  const { isDarkMode } = useTheme();
  
  const [formData, setFormData] = useState({
    companyName: '',
    adminEmail: '',
    adminPhone: '',
    adminUsername: '',
    adminPassword: '',
    logo: '',
    maxUsers: 10,
    pointsEnabled: true
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [createdCompany, setCreatedCompany] = useState(null);

  const plans = {
    free_trial: { name: 'Free Trial', period: '7 days', color: 'green' },
    one_month: { name: 'One Month Plan', period: 'month', color: 'blue' },
    three_month: { name: 'Three Month Plan', period: '3 months', color: 'indigo' },
    six_month: { name: 'Six Month Plan', period: '6 months', color: 'gray' }
  };

  const currentPlan = plans[selectedPlan] || plans.free_trial;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({...prev, logo: reader.result}));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.adminEmail || !formData.adminPhone || !formData.adminUsername || !formData.adminPassword) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    if (formData.maxUsers < 1) {
      setMessage({ type: 'error', text: 'User limit must be at least 1' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const submitData = {
        companyName: formData.companyName,
        companyEmail: formData.adminEmail,
        companyPhone: formData.adminPhone,
        selectedPlan: selectedPlan,
        maxUsers: formData.maxUsers,
        adminFirstName: formData.companyName.split(' ')[0] || 'Admin',
        adminLastName: 'Admin',
        adminEmail: formData.adminEmail,
        adminPhone: formData.adminPhone,
        adminPassword: formData.adminPassword,
        adminUsername: formData.adminUsername,
        logo: formData.logo,
        pointsEnabled: formData.pointsEnabled
      };

      const envBackendUrl = process.env.REACT_APP_BACKEND_URL;
      const fallbackUrl = 'https://notion-l9ti.onrender.com';
      let backendUrl = fallbackUrl;
      if (envBackendUrl && envBackendUrl !== 'undefined' && envBackendUrl.startsWith('http')) {
        backendUrl = envBackendUrl;
      }

      const response = await fetch(`${backendUrl}/api/company/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (response.ok) {
        setCreatedCompany({
          companyId: data.companyId,
          companyName: data.companyName,
          adminUsername: data.adminUsername || formData.adminUsername,
          companyLink: data.companyLink
        });
        setMessage({ type: 'success', text: 'Company created successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create company' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copied to clipboard!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const closeModal = () => {
    navigate('/');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-100 text-gray-900'
    }`} style={!isDarkMode ? {
      backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23999\" fill-opacity=\"0.4\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"1.5\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
    } : {}}>
      <div className="relative max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`p-2 rounded-xl transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
            } shadow-md`}>
              <img 
                src="/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png" 
                alt="Mela Note Logo" 
                className={`h-12 w-12 object-contain transition-all duration-300 ${
                  isDarkMode ? 'brightness-0 invert' : ''
                }`}
              />
            </div>
            <h1 className={`text-3xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Create Your Workspace
            </h1>
          </div>
          <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
            Set up your company account and start collaborating with your team
          </p>
        </div>

        {/* Selected Plan Badge */}
        <div className={`mb-8 p-5 rounded-xl border shadow-sm transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-800/80 border-gray-700 backdrop-blur-sm' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                selectedPlan === 'free_trial' ? 'bg-green-500' :
                selectedPlan === 'one_month' ? 'bg-blue-500' :
                selectedPlan === 'three_month' ? 'bg-indigo-500' : 'bg-gray-500'
              }`}></div>
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {currentPlan.name}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedPlan === 'free_trial' 
                    ? 'Free for 7 days'
                    : `Billed per ${currentPlan.period}`
                  }
                </p>
              </div>
            </div>
            <Link 
              to="/#pricing" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Change Plan
            </Link>
          </div>
        </div>

        {/* Main Form Card */}
        <div className={`rounded-xl border shadow-lg transition-all duration-300 overflow-hidden ${
          isDarkMode 
            ? 'bg-gray-800/80 border-gray-700 backdrop-blur-sm' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Card Header */}
          {!createdCompany && (
            <div className={`px-6 py-5 border-b ${
              isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Company Details
                </h2>
                <Link 
                  to="/" 
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-gray-700 text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X size={18} />
                </Link>
              </div>
            </div>
          )}

          {createdCompany ? (
            /* Success View */
            <div className="p-8 space-y-6">
              {/* Success Animation */}
              <div className="text-center py-6">
                <div className="relative inline-block mb-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                  }`}>
                    <CheckCircle size={48} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
                  </div>
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {createdCompany.companyName}
                </h3>
                <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Company created successfully!
                </p>
              </div>

              {/* Info Cards */}
              <div className="space-y-3">
                <div className={`p-4 rounded-lg border transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Company ID
                  </label>
                  <div className="flex items-center gap-2">
                    <code className={`flex-1 font-mono text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    } p-2.5 rounded-md ${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                      {createdCompany.companyId}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(createdCompany.companyId)} 
                      className={`p-2.5 rounded-md transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-gray-600 bg-gray-600/50' 
                          : 'hover:bg-gray-200 bg-gray-200/50'
                      }`}
                    >
                      <CheckCircle size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                    </button>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Admin Username
                  </label>
                  <div className="flex items-center gap-2">
                    <code className={`flex-1 font-mono text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    } p-2.5 rounded-md ${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                      {createdCompany.adminUsername}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(createdCompany.adminUsername)} 
                      className={`p-2.5 rounded-md transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-gray-600 bg-gray-600/50' 
                          : 'hover:bg-gray-200 bg-gray-200/50'
                      }`}
                    >
                      <CheckCircle size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                    </button>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Company Login Link
                  </label>
                  <div className="flex items-center gap-2">
                    <code className={`flex-1 font-mono text-xs break-all ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    } p-2.5 rounded-md ${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                      {createdCompany.companyLink}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(createdCompany.companyLink)} 
                      className={`p-2.5 rounded-md transition-colors flex-shrink-0 ${
                        isDarkMode 
                          ? 'hover:bg-gray-600 bg-gray-600/50' 
                          : 'hover:bg-gray-200 bg-gray-200/50'
                      }`}
                    >
                      <CheckCircle size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
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
                    <AlertCircle size={18} className={`flex-shrink-0 mt-0.5 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <div>
                      <h4 className={`text-sm font-semibold mb-1 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Next Steps
                      </h4>
                      <p className={`text-xs ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        An SMS with your login credentials has been sent. Use the company link above to access your workspace.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {selectedPlan !== 'free_trial' && (
                  <button 
                    onClick={() => {
                      // Redirect to login with company ID and redirect parameter
                      const loginUrl = createdCompany.companyLink.includes('?') 
                        ? `${createdCompany.companyLink}&redirect=payment`
                        : `${createdCompany.companyLink}?redirect=payment`;
                      window.location.href = loginUrl;
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Login & Pay Now
                  </button>
                )}
                <button 
                  onClick={() => {
                    // Redirect to login with company ID
                    window.location.href = createdCompany.companyLink;
                  }}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  {selectedPlan === 'free_trial' ? 'Login Now' : 'Login Later'}
                </button>
              </div>
            </div>
          ) : (
            /* Form View */
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              {/* Error/Success Messages */}
              {message.text && (
                <div className={`p-4 rounded-lg border flex items-center ${
                  message.type === 'success'
                    ? (isDarkMode ? 'bg-green-900/20 border-green-700/50 text-green-300' : 'bg-green-50 border-green-200 text-green-700')
                    : (isDarkMode ? 'bg-red-900/20 border-red-700/50 text-red-300' : 'bg-red-50 border-red-200 text-red-700')
                }`}>
                  {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />}
                  <span className="text-sm font-medium">{message.text}</span>
                </div>
              )}

              {/* Logo Upload Section */}
              <div>
                <label className={`text-sm font-semibold mb-3 block ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Company Logo <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <div className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer group ${
                  isDarkMode 
                    ? 'border-gray-700 hover:border-gray-600 bg-gray-800/30' 
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}>
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
              <div className="space-y-4">
                <div>
                  <label className={`text-sm font-semibold mb-2 block ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      <Building2 size={18} />
                    </div>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Enter company name"
                      required
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Admin Contact Information */}
              <div className="space-y-4">
                <div>
                  <label className={`text-sm font-semibold mb-2 block ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Admin Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleInputChange}
                      placeholder="admin@company.com"
                      required
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-sm font-semibold mb-2 block ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Admin Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      name="adminPhone"
                      value={formData.adminPhone}
                      onChange={handleInputChange}
                      placeholder="+251912345678"
                      required
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Admin Login Credentials */}
              <div className="space-y-4">
                <div>
                  <label className={`text-sm font-semibold mb-2 block ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      name="adminUsername"
                      value={formData.adminUsername}
                      onChange={handleInputChange}
                      placeholder="Choose a username"
                      required
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-sm font-semibold mb-2 block ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      name="adminPassword"
                      value={formData.adminPassword}
                      onChange={handleInputChange}
                      placeholder="Create a password"
                      required
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* User Limit */}
              <div className={`p-4 rounded-lg border ${
                isDarkMode 
                  ? 'bg-blue-900/20 border-blue-700/30' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <label className={`text-sm font-semibold mb-2 block ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Maximum Users <span className="text-red-500">*</span>
                </label>
                <p className={`text-xs mb-3 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  Payment = User Limit × Price Per User × Subscription Period
                </p>
                <div className="relative">
                  <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <Users size={18} />
                  </div>
                  <input
                    type="number"
                    name="maxUsers"
                    value={formData.maxUsers}
                    onChange={handleInputChange}
                    placeholder="10"
                    min="1"
                    required
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
                <p className={`text-xs mt-2 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  Example: {formData.maxUsers || 10} users × price per user × {currentPlan.period}
                </p>
              </div>

              {/* Points Rating System Toggle */}
              <div className={`p-4 rounded-lg border ${
                isDarkMode 
                  ? 'bg-indigo-900/20 border-indigo-700/30' 
                  : 'bg-indigo-50 border-indigo-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <label className={`text-sm font-semibold block ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Points Rating System
                    </label>
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                    }`}>
                      Track team performance with automatic point scoring
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, pointsEnabled: !prev.pointsEnabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      formData.pointsEnabled
                        ? 'bg-indigo-600'
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
                <p className={`text-xs mt-2 ${
                  isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                }`}>
                  {formData.pointsEnabled 
                    ? '✅ Points system will be enabled for your company' 
                    : '❌ Points system will be disabled - no performance tracking'
                  }
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg ${
                  loading
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
                } text-white`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Company...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Create Company
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Back to Landing */}
        <div className="text-center mt-8">
          <Link 
            to="/" 
            className={`inline-flex items-center gap-2 font-semibold transition-colors ${
              isDarkMode 
                ? 'text-blue-400 hover:text-blue-300' 
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            ← Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreateCompanyPage;
