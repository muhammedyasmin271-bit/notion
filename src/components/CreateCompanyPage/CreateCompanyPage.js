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
    maxUsers: 10
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [createdCompany, setCreatedCompany] = useState(null);

  const plans = {
    free_trial: { name: 'Free Trial', period: '7 days', color: 'green' },
    one_month: { name: 'One Month Plan', period: 'month', color: 'blue' },
    three_month: { name: 'Three Month Plan', period: '3 months', color: 'purple' },
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
        logo: formData.logo
      };

      const response = await fetch('http://localhost:9000/api/company/create', {
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
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'} relative overflow-hidden py-8 px-4`}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png" 
              alt="Mela Note Logo" 
              className={`h-16 w-16 drop-shadow-lg ${isDarkMode ? 'filter brightness-0 invert' : ''}`}
            />
            <h1 className={`text-4xl font-black ${isDarkMode ? 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' : 'text-gray-900'}`}>
              Mela Note
            </h1>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Create your workspace and start collaborating
          </p>
        </div>

        {/* Selected Plan Badge */}
        <div className={`mb-8 p-6 rounded-2xl border-2 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'} backdrop-blur-sm shadow-xl`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${
                  selectedPlan === 'free_trial' ? 'bg-green-400' :
                  selectedPlan === 'one_month' ? 'bg-blue-400' :
                  selectedPlan === 'three_month' ? 'bg-purple-400' : 'bg-gray-400'
                } animate-pulse`}></div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Selected Plan: {currentPlan.name}
                </h3>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedPlan === 'free_trial' 
                  ? '✨ Free for 7 days, then choose a plan'
                  : `💰 Price: User Limit × Price/User × ${currentPlan.period}`
                }
              </p>
            </div>
            <Link 
              to="/#pricing" 
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              Change Plan
            </Link>
          </div>
        </div>

        {/* Main Form Card */}
        <div className={`rounded-3xl border-2 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200'} shadow-2xl overflow-hidden`}>
          {/* Card Header */}
          <div className={`flex justify-between items-center p-7 border-b-2 ${isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-white/50'} backdrop-blur-sm`}>
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-800 to-black'} shadow-lg`}>
                <Building2 size={28} className="text-white" />
              </div>
              <div>
                <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
            /* Success View */
            <div className="p-7 space-y-6">
              {/* Success Animation */}
              <div className="text-center py-4">
                <div className="relative inline-block">
                  <div className={`w-24 h-24 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center mb-4 animate-bounce`}>
                    <CheckCircle size={56} className={`${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 rounded-full bg-green-500 opacity-20 animate-ping"></div>
                </div>
                <h3 className={`text-3xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{createdCompany.companyName}</h3>
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
                    <code className={`flex-1 font-mono text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} p-3 rounded-lg ${isDarkMode ? 'bg-gray-900/50' : 'bg-white'}`}>{createdCompany.companyId}</code>
                    <button onClick={() => copyToClipboard(createdCompany.companyId)} className={`p-3 ${isDarkMode ? 'hover:bg-gray-700 bg-gray-700/50' : 'hover:bg-gray-200 bg-gray-200/50'} rounded-lg transition-all active:scale-95`}>
                      <CheckCircle size={18} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
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
                    <code className={`flex-1 font-mono text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} p-3 rounded-lg ${isDarkMode ? 'bg-gray-900/50' : 'bg-white'}`}>{createdCompany.adminUsername}</code>
                    <button onClick={() => copyToClipboard(createdCompany.adminUsername)} className={`p-3 ${isDarkMode ? 'hover:bg-gray-700 bg-gray-700/50' : 'hover:bg-gray-200 bg-gray-200/50'} rounded-lg transition-all active:scale-95`}>
                      <CheckCircle size={18} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    </button>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} shadow-lg hover:shadow-xl transition-all duration-300`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <Mail size={18} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'} />
                    </div>
                    <label className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Company Login Link</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className={`flex-1 font-mono text-sm break-all ${isDarkMode ? 'text-white' : 'text-gray-900'} p-3 rounded-lg ${isDarkMode ? 'bg-gray-900/50' : 'bg-white'}`}>{createdCompany.companyLink}</code>
                    <button onClick={() => copyToClipboard(createdCompany.companyLink)} className={`p-3 ${isDarkMode ? 'hover:bg-gray-700 bg-gray-700/50' : 'hover:bg-gray-200 bg-gray-200/50'} rounded-lg transition-all active:scale-95 flex-shrink-0`}>
                      <CheckCircle size={18} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    </button>
                  </div>
                </div>

                {/* Next Steps */}
                <div className={`p-5 rounded-2xl border-2 ${isDarkMode ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-700/50' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-300'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'} flex-shrink-0`}>
                      <AlertCircle size={20} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    </div>
                    <div>
                      <h4 className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Next Steps</h4>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        An SMS with your login credentials has been sent to your phone. Use the company link to access your workspace.
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
                    className={`flex-1 ${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'} text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95`}
                  >
                    Login & Pay Now
                  </button>
                )}
                <button 
                  onClick={() => {
                    // Redirect to login with company ID
                    window.location.href = createdCompany.companyLink;
                  }}
                  className={`flex-1 ${isDarkMode ? 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700' : 'bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900'} text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95`}
                >
                  {selectedPlan === 'free_trial' ? 'Login Now' : 'Login Later'}
                </button>
              </div>
            </div>
          ) : (
            /* Form View */
            <form onSubmit={handleSubmit} className="p-7 space-y-6">
              {/* Error/Success Messages */}
              {message.text && (
                <div className={`p-4 rounded-xl border-2 flex items-center ${
                  message.type === 'success'
                    ? (isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700')
                    : (isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700')
                }`}>
                  {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />}
                  <span className="text-sm font-medium">{message.text}</span>
                </div>
              )}

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
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Company Name *"
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Admin Contact Information */}
              <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                <h3 className={`text-base font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Phone size={18} />
                  Admin Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="relative">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleInputChange}
                      placeholder="Admin Email *"
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  <div className="relative">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      name="adminPhone"
                      value={formData.adminPhone}
                      onChange={handleInputChange}
                      placeholder="Admin Phone (e.g. +251912345678) *"
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Admin Login Credentials */}
              <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                <h3 className={`text-base font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Lock size={18} />
                  Admin Login Credentials
                </h3>
                <p className={`text-xs mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  These credentials will be used by the company admin to access their account.
                </p>
                <div className="space-y-3">
                  <div className="relative">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      name="adminUsername"
                      value={formData.adminUsername}
                      onChange={handleInputChange}
                      placeholder="Username *"
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  <div className="relative">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      name="adminPassword"
                      value={formData.adminPassword}
                      onChange={handleInputChange}
                      placeholder="Password *"
                      required
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* User Limit */}
              <div className={`p-5 rounded-2xl border-2 ${isDarkMode ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-700/50' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-300'}`}>
                <h3 className={`text-base font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Users size={18} />
                  User Limit
                </h3>
                <p className={`text-xs mb-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  💡 Payment is calculated based on: <strong>User Limit × Price Per User × Subscription Period</strong>
                </p>
                <div className="relative">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Users size={18} />
                  </div>
                  <input
                    type="number"
                    name="maxUsers"
                    value={formData.maxUsers}
                    onChange={handleInputChange}
                    placeholder="Maximum number of users"
                    min="1"
                    required
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 text-base font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <p className={`text-xs mt-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Example: {formData.maxUsers || 10} users will determine your subscription cost
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                  loading
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                } text-white`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Company...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
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
            className={`inline-flex items-center gap-2 font-bold text-lg transition-all hover:scale-105 ${
              isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
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
