import React, { useState, useEffect } from 'react';
import {
  Settings, DollarSign, Save, RefreshCw, CheckCircle, AlertCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const SuperAdminSettings = () => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [paymentSettings, setPaymentSettings] = useState({
    monthlyAmount: 1000,
    bankName: 'Commercial Bank of Ethiopia',
    accountName: 'Mela Note Services',
    accountNumber: '1000123456789',
    teleBirrPhone: '+251912345678',
    currency: 'ETB'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:9000/api/settings/all', {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      
      // Convert settings array to object
      const settings = {};
      data.forEach(setting => {
        const key = setting.settingKey.replace('payment.', '');
        settings[key] = setting.value;
      });
      
      setPaymentSettings(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:9000/api/settings/payment/bulk', {
        method: 'PUT',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentSettings)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save settings');
      }

      showMessage('success', 'Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', error.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' : 'bg-gradient-to-br from-blue-500 to-purple-500'} shadow-lg`}>
              <Settings className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-white'}`} />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${isDarkMode ? 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' : 'text-gray-900'}`}>
                Super Admin Settings
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Configure system-wide payment settings
              </p>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl shadow-lg ${
            message.type === 'success'
              ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/50'
              : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/50'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Payment Settings */}
        <div className={`rounded-2xl border backdrop-blur-sm shadow-xl ${
          isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200/50'
        }`}>
          <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold">Payment Settings</h2>
            </div>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              These settings will be displayed to all company admins in the "How to Pay" section
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Monthly Subscription Amount *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={paymentSettings.monthlyAmount}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, monthlyAmount: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                  <span className={`absolute right-4 top-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {paymentSettings.currency || 'ETB'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Currency</label>
                <input
                  type="text"
                  value={paymentSettings.currency}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, currency: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="ETB"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Bank Name *</label>
              <input
                type="text"
                value={paymentSettings.bankName}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, bankName: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="e.g., Commercial Bank of Ethiopia"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Account Name *</label>
              <input
                type="text"
                value={paymentSettings.accountName}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, accountName: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="e.g., Mela Note Services"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Bank Account Number *</label>
                <input
                  type="text"
                  value={paymentSettings.accountNumber}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, accountNumber: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border font-mono text-lg ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-green-400'
                      : 'bg-white border-gray-300 text-green-600'
                  }`}
                  placeholder="e.g., 1000123456789"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Tele Birr Phone Number *</label>
                <input
                  type="text"
                  value={paymentSettings.teleBirrPhone}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, teleBirrPhone: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border font-mono text-lg ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-blue-400'
                      : 'bg-white border-gray-300 text-blue-600'
                  }`}
                  placeholder="e.g., +251912345678"
                  required
                />
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-start gap-2">
                <AlertCircle className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} flex-shrink-0 mt-0.5`} />
                <div className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  <strong>Note:</strong> These settings will be displayed to all company admins when they click "How to Pay" on the payment submission page.
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 md:flex-none px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Settings
                  </>
                )}
              </button>
              <button
                onClick={fetchSettings}
                disabled={loading}
                className={`px-6 py-3 rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                <RefreshCw className="w-5 h-5" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettings;

