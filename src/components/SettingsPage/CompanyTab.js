import React, { useState, useEffect } from 'react';
import { Save, Building2, Star, BarChart3, Users, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const CompanyTab = () => {
  const [companyData, setCompanyData] = useState({
    name: '',
    adminEmail: '',
    adminPhone: '',
    pointsEnabled: true,
    rating: 0,
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);

  // Load company data
  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL || 'https://notion-l9ti.onrender.com'}/api/company/my-company`, {
          headers: { 'x-auth-token': token }
        });
        
        setCompanyData({
          name: response.data.name || '',
          adminEmail: response.data.adminEmail || '',
          adminPhone: response.data.adminPhone || '',
          pointsEnabled: response.data.pointsEnabled !== false,
          rating: response.data.rating || 0,
          status: response.data.status || 'active'
        });
      } catch (error) {
        console.error('Error loading company data:', error);
        setMessage('Failed to load company data');
      } finally {
        setInitialLoad(false);
      }
    };
    
    loadCompanyData();
  }, []);

  const handlePointsToggle = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const newPointsEnabled = !companyData.pointsEnabled;
      
      const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL || 'https://notion-l9ti.onrender.com'}/api/company/points-system`, 
        { pointsEnabled: newPointsEnabled },
        { headers: { 'x-auth-token': token } }
      );
      
      setCompanyData(prev => ({
        ...prev,
        pointsEnabled: newPointsEnabled
      }));
      
      setMessage(response.data.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating points system:', error);
      setMessage(error.response?.data?.message || 'Failed to update points system');
    } finally {
      setLoading(false);
    }
  };

  const handleContactUpdate = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL || 'https://notion-l9ti.onrender.com'}/api/company/contact`, 
        { 
          adminEmail: companyData.adminEmail,
          adminPhone: companyData.adminPhone
        },
        { headers: { 'x-auth-token': token } }
      );
      
      setMessage('Contact information updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating contact info:', error);
      setMessage(error.response?.data?.message || 'Failed to update contact information');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Company Settings
        </h2>
        
        {message && (
          <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 ${
            message.includes('Failed') || message.includes('error') 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-green-500/20 text-green-400'
          }`}>
            {message.includes('Failed') || message.includes('error') ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* Company Info */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Company Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                <input
                  type="text"
                  value={companyData.name}
                  disabled
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Company name cannot be changed</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Admin Email</label>
                <input
                  type="email"
                  value={companyData.adminEmail}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, adminEmail: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Admin Phone</label>
                <input
                  type="tel"
                  value={companyData.adminPhone}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, adminPhone: e.target.value }))}
                  placeholder="+251912345678"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={handleContactUpdate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Updating...' : 'Update Contact Info'}
              </button>
            </div>
          </div>

          {/* Points Rating System */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Points Rating System
              </h3>
              <button
                onClick={handlePointsToggle}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
                  companyData.pointsEnabled
                    ? 'bg-indigo-600'
                    : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    companyData.pointsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                {companyData.pointsEnabled 
                  ? '✅ Points system is enabled - team performance is being tracked'
                  : '❌ Points system is disabled - no performance tracking'
                }
              </p>
              
              {companyData.pointsEnabled && (
                <div className="p-3 bg-gray-600/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Current Company Rating
                    </span>
                    <span className="text-lg font-bold text-yellow-500">
                      {companyData.rating.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Based on average team member performance points
                  </p>
                </div>
              )}
              
              <div className="text-xs text-gray-400 space-y-1">
                <p><strong>How it works:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Team members earn points for completing projects on time</li>
                  <li>Early completion gives bonus points, late completion reduces points</li>
                  <li>Project priority affects point multipliers</li>
                  <li>Company rating is calculated from average team performance</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Company Status */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Company Status
            </h3>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                companyData.status === 'active' ? 'bg-green-500' :
                companyData.status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium capitalize">{companyData.status}</span>
              <span className="text-xs text-gray-400">
                {companyData.status === 'active' && '• All systems operational'}
                {companyData.status === 'paused' && '• Company operations paused'}
                {companyData.status === 'suspended' && '• Company access suspended'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyTab;