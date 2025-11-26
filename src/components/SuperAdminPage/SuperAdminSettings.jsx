import React, { useState, useEffect } from 'react';
import {
  Settings, DollarSign, Save, RefreshCw, CheckCircle, AlertCircle, Mail, Phone, MapPin
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const SuperAdminSettings = () => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [paymentSettings, setPaymentSettings] = useState({
    pricePerUserPerMonth: 1
  });

  const [contactSettings, setContactSettings] = useState({
    email: 'support@melanote.com',
    phone: '+251 911 234 567',
    address: 'Addis Ababa, Ethiopia'
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
      
      // Convert settings array to objects
      const paymentSettings = { pricePerUserPerMonth: 1 };
      const contactSettings = {
        email: 'support@melanote.com',
        phone: '+251 911 234 567',
        address: 'Addis Ababa, Ethiopia'
      };
      
      data.forEach(setting => {
        if (setting.settingKey === 'payment.pricePerUserPerMonth') {
          paymentSettings.pricePerUserPerMonth = setting.value;
        } else if (setting.settingKey === 'contact.email') {
          contactSettings.email = setting.value;
        } else if (setting.settingKey === 'contact.phone') {
          contactSettings.phone = setting.value;
        } else if (setting.settingKey === 'contact.address') {
          contactSettings.address = setting.value;
        }
      });
      
      setPaymentSettings(paymentSettings);
      setContactSettings(contactSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:9000/api/settings/payment.pricePerUserPerMonth', {
        method: 'PUT',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: parseFloat(paymentSettings.pricePerUserPerMonth) })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save payment settings');
      }

      showMessage('success', 'Payment settings saved successfully!');
    } catch (error) {
      console.error('Error saving payment settings:', error);
      showMessage('error', error.message || 'Failed to save payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Save all contact settings
      const updates = [
        fetch('http://localhost:9000/api/settings/contact.email', {
          method: 'PUT',
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ value: contactSettings.email })
        }),
        fetch('http://localhost:9000/api/settings/contact.phone', {
          method: 'PUT',
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ value: contactSettings.phone })
        }),
        fetch('http://localhost:9000/api/settings/contact.address', {
          method: 'PUT',
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ value: contactSettings.address })
        })
      ];

      const responses = await Promise.all(updates);
      
      for (const response of responses) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to save contact settings');
        }
      }

      showMessage('success', 'Contact information saved successfully!');
    } catch (error) {
      console.error('Error saving contact settings:', error);
      showMessage('error', error.message || 'Failed to save contact settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-white' : 'bg-black'} shadow-lg`}>
              <Settings className={`w-8 h-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
              ? isDarkMode ? 'bg-white/10 text-white border border-white/50' : 'bg-black/10 text-black border border-black/50'
              : isDarkMode ? 'bg-gray-700/50 text-white border border-gray-500/50' : 'bg-gray-300/50 text-black border border-gray-500/50'
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
              Configure the price per user per month for payment calculations
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Price Per User Per Month - Prominent Section */}
            <div className={`p-5 rounded-xl border-2 ${isDarkMode ? 'bg-white/10 border-white/30' : 'bg-black/10 border-black/30'}`}>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <label className="block text-lg font-bold">
                  Price Per User Per Month (ETB) *
                </label>
              </div>
              <div className="relative mb-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentSettings.pricePerUserPerMonth}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, pricePerUserPerMonth: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border-2 text-lg font-semibold ${
                    isDarkMode
                      ? 'bg-gray-700 border-blue-500/50 text-white focus:border-blue-400'
                      : 'bg-white border-blue-300 text-gray-900 focus:border-blue-500'
                  }`}
                  placeholder="1"
                  required
                />
                <span className={`absolute right-4 top-3 font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  ETB/user/month
                </span>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                💡 This is used to calculate payment: <strong>(User Limit × Price Per User × Months) - Discount</strong>
              </p>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-blue-400/80' : 'text-blue-600/80'}`}>
                Example: If user limit is 10 and price per user is {paymentSettings.pricePerUserPerMonth} ETB, then 1 month = 10 × {paymentSettings.pricePerUserPerMonth} = {10 * parseFloat(paymentSettings.pricePerUserPerMonth || 1)} ETB
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSavePayment}
                disabled={loading}
                className={`flex-1 md:flex-none px-8 py-3 ${isDarkMode ? 'bg-white hover:bg-gray-200 text-black' : 'bg-black hover:bg-gray-800 text-white'} rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Payment Settings
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

        {/* Contact Information Settings */}
        <div className={`mt-8 rounded-2xl border backdrop-blur-sm shadow-xl ${
          isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200/50'
        }`}>
          <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold">Contact Information</h2>
            </div>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Configure contact information displayed on the landing page
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Email */}
            <div>
              <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <Mail className="inline w-4 h-4 mr-2" />
                Email Address *
              </label>
              <input
                type="email"
                value={contactSettings.email}
                onChange={(e) => setContactSettings({ ...contactSettings, email: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border-2 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-blue-600' : 'focus:ring-blue-400'}`}
                placeholder="support@melanote.com"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <Phone className="inline w-4 h-4 mr-2" />
                Phone Number *
              </label>
              <input
                type="tel"
                value={contactSettings.phone}
                onChange={(e) => setContactSettings({ ...contactSettings, phone: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border-2 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-blue-600' : 'focus:ring-blue-400'}`}
                placeholder="+251 911 234 567"
                required
              />
            </div>

            {/* Address */}
            <div>
              <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <MapPin className="inline w-4 h-4 mr-2" />
                Address *
              </label>
              <input
                type="text"
                value={contactSettings.address}
                onChange={(e) => setContactSettings({ ...contactSettings, address: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border-2 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-blue-600' : 'focus:ring-blue-400'}`}
                placeholder="Addis Ababa, Ethiopia"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveContact}
                disabled={loading}
                className={`flex-1 md:flex-none px-8 py-3 ${isDarkMode ? 'bg-white hover:bg-gray-200 text-black' : 'bg-black hover:bg-gray-800 text-white'} rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Contact Information
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

