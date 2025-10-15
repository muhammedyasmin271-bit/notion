import React, { useState, useEffect } from 'react';
import {
  Building2, Image, Palette, Phone, Mail, Users, BarChart3,
  Save, Upload, X, Check, AlertCircle, Settings
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import RoleGuard from '../common/RoleGuard';

const CompanySettings = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState('branding');
  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Branding state
  const [brandingForm, setBrandingForm] = useState({
    companyName: '',
    primaryColor: '#3B82F6',
    logo: null
  });
  const [logoPreview, setLogoPreview] = useState(null);

  // Contact state
  const [contactForm, setContactForm] = useState({
    adminEmail: '',
    adminPhone: ''
  });

  useEffect(() => {
    fetchCompanyData();
    fetchCompanyStats();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:9000/api/company/my-company', {
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) throw new Error('Failed to fetch company data');

      const data = await response.json();
      setCompany(data);

      // Initialize forms with existing data
      setBrandingForm({
        companyName: data.branding?.companyName || data.name || '',
        primaryColor: data.branding?.primaryColor || '#3B82F6',
        logo: null
      });

      setContactForm({
        adminEmail: data.adminEmail || '',
        adminPhone: data.adminPhone || ''
      });

      if (data.branding?.logo) {
        setLogoPreview(data.branding.logo);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching company:', error);
      showMessage('error', 'Failed to load company data');
      setLoading(false);
    }
  };

  const fetchCompanyStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:9000/api/company/stats', {
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'Logo file size must be less than 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        showMessage('error', 'Only image files (JPEG, PNG, GIF, SVG) are allowed');
        return;
      }

      setBrandingForm({ ...brandingForm, logo: file });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = async () => {
    try {
      console.log('🎨 Starting branding save...');
      console.log('Form data:', {
        companyName: brandingForm.companyName,
        primaryColor: brandingForm.primaryColor,
        hasLogo: !!brandingForm.logo
      });

      const formData = new FormData();
      formData.append('companyName', brandingForm.companyName);
      formData.append('primaryColor', brandingForm.primaryColor);
      if (brandingForm.logo) {
        formData.append('logo', brandingForm.logo);
      }

      const token = localStorage.getItem('token');
      console.log('Sending request to backend...');
      
      const response = await fetch('http://localhost:9000/api/company/branding', {
        method: 'PUT',
        headers: {
          'x-auth-token': token
        },
        body: formData
      });

      console.log('Response status:', response.status);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned invalid response. Please make sure the backend server is running on port 9000.');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update branding');
      }

      const data = await response.json();
      console.log('✅ Backend response:', data);

      showMessage('success', 'Company branding saved to database successfully!');

      // Refresh company data to verify
      console.log('Refreshing company data to verify save...');
      await fetchCompanyData();

      console.log('✅ Branding update complete!');

      // Reload page to update navbar branding
      setTimeout(() => {
        console.log('Reloading page to apply changes...');
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('❌ Error saving branding:', error);
      showMessage('error', error.message || 'Failed to update branding');
    }
  };

  const handleSaveContact = async () => {
    try {
      console.log('📧 Starting contact info save...');
      console.log('Form data:', contactForm);

      const token = localStorage.getItem('token');
      console.log('Sending request to backend...');
      
      const response = await fetch('http://localhost:9000/api/company/contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(contactForm)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update contact information');
      }

      const data = await response.json();
      console.log('✅ Backend response:', data);

      showMessage('success', 'Contact information saved to database successfully!');
      
      console.log('Refreshing company data to verify save...');
      await fetchCompanyData();
      
      console.log('✅ Contact info update complete!');
    } catch (error) {
      console.error('❌ Error saving contact:', error);
      showMessage('error', error.message || 'Failed to update contact information');
    }
  };

  const tabs = [
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'contact', label: 'Contact Info', icon: Mail },
    { id: 'overview', label: 'Overview', icon: BarChart3 }
  ];

  const renderBrandingTab = () => (
    <div className="space-y-6">
      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium mb-3">Company Logo</label>
        <div className="flex items-center space-x-6">
          <div className={`w-32 h-32 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <Image className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            )}
          </div>
          <div className="flex-1">
            <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4 mr-2" />
              Upload Logo
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Recommended: Square image, max 5MB (JPEG, PNG, GIF, SVG)
            </p>
          </div>
        </div>
      </div>

      {/* Company Name */}
      <div>
        <label className="block text-sm font-medium mb-2">Company Display Name</label>
        <input
          type="text"
          value={brandingForm.companyName}
          onChange={(e) => setBrandingForm({ ...brandingForm, companyName: e.target.value })}
          placeholder="Enter company name"
          className={`w-full px-4 py-3 rounded-lg border ${isDarkMode
            ? 'bg-gray-800 border-gray-700 text-white'
            : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        />
      </div>

      {/* Primary Color */}
      <div>
        <label className="block text-sm font-medium mb-2">Primary Brand Color</label>
        <div className="flex items-center space-x-4">
          <input
            type="color"
            value={brandingForm.primaryColor}
            onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
            className="h-12 w-20 rounded-lg cursor-pointer"
          />
          <input
            type="text"
            value={brandingForm.primaryColor}
            onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
            placeholder="#3B82F6"
            className={`flex-1 px-4 py-3 rounded-lg border ${isDarkMode
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <button
          onClick={handleSaveBranding}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-5 h-5 mr-2" />
          Save Branding
        </button>
      </div>
    </div>
  );

  const renderContactTab = () => (
    <div className="space-y-6">
      {/* Admin Email */}
      <div>
        <label className="block text-sm font-medium mb-2">Admin Email</label>
        <div className="relative">
          <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="email"
            value={contactForm.adminEmail}
            onChange={(e) => setContactForm({ ...contactForm, adminEmail: e.target.value })}
            placeholder="admin@company.com"
            className={`w-full pl-12 pr-4 py-3 rounded-lg border ${isDarkMode
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
      </div>

      {/* Admin Phone */}
      <div>
        <label className="block text-sm font-medium mb-2">Admin Phone</label>
        <div className="relative">
          <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="tel"
            value={contactForm.adminPhone}
            onChange={(e) => setContactForm({ ...contactForm, adminPhone: e.target.value })}
            placeholder="+251 912 345 678"
            className={`w-full pl-12 pr-4 py-3 rounded-lg border ${isDarkMode
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <button
          onClick={handleSaveContact}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-5 h-5 mr-2" />
          Save Contact Info
        </button>
      </div>
    </div>
  );

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Company Info */}
      <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <h3 className="text-lg font-semibold mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Company ID
            </label>
            <p className="font-medium">{company?.companyId || 'N/A'}</p>
          </div>
          <div>
            <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Status
            </label>
            <p className="font-medium">
              <span className={`px-2 py-1 rounded-full text-xs ${company?.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                {company?.status || 'Unknown'}
              </span>
            </p>
          </div>
          <div>
            <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Created
            </label>
            <p className="font-medium">
              {company?.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Subscription
            </label>
            <p className="font-medium capitalize">{company?.subscriptionStatus || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Users
                </p>
                <p className="text-3xl font-bold mt-1">{stats.users?.total || 0}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Limit: {stats.users?.limit || 50}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Active Users
                </p>
                <p className="text-3xl font-bold mt-1 text-green-500">{stats.users?.active || 0}</p>
                {stats.users?.pending > 0 && (
                  <p className="text-sm text-yellow-500 mt-1">
                    {stats.users.pending} pending
                  </p>
                )}
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Projects
                </p>
                <p className="text-3xl font-bold mt-1">{stats.resources?.projects || 0}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.resources?.documents || 0} documents
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'branding':
        return renderBrandingTab();
      case 'contact':
        return renderContactTab();
      case 'overview':
        return renderOverviewTab();
      default:
        return renderBrandingTab();
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard requiredRole="admin" fallback={
      <div className="p-8 text-center">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">You need admin privileges to access company settings.</p>
      </div>
    }>
      <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Settings className="w-8 h-8 mr-3 text-blue-500" />
              <h1 className="text-3xl font-bold">Company Settings</h1>
            </div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your company's branding, contact information, and settings
            </p>
          </div>

          {/* Message Alert */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg flex items-center ${message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
              {message.type === 'success' ? (
                <Check className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {message.text}
            </div>
          )}

          {/* Tabs and Content */}
          <div className={`rounded-2xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {/* Tabs */}
            <div className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 font-medium flex items-center justify-center transition-colors ${activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-750'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};

export default CompanySettings;

