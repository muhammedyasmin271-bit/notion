import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const CompanyPaymentStatus = ({ company, onRefresh }) => {
  const { isDarkMode } = useTheme();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company?.companyId) {
      fetchPaymentStatus();
      // Update every minute if counting down
      const interval = setInterval(fetchPaymentStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [company?.companyId]);

  const fetchPaymentStatus = async () => {
    try {
      const response = await fetch(`http://localhost:9000/api/admin/companies/${company.companyId}/payment-status`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const data = await response.json();
      setPaymentStatus(data);
    } catch (error) {
      console.error('Error fetching payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} animate-pulse`}>
        <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded mb-2`}></div>
        <div className={`h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded`}></div>
      </div>
    );
  }

  if (!paymentStatus) return null;

  const { paymentMode, isCountingDown, hoursRemaining, minutesRemaining, isFree, expired } = paymentStatus;

  return (
    <div className={`p-4 rounded-xl border-2 ${
      isFree 
        ? isDarkMode 
          ? 'bg-green-900/20 border-green-500/50' 
          : 'bg-green-50 border-green-300'
        : isCountingDown
          ? isDarkMode
            ? 'bg-orange-900/20 border-orange-500/50'
            : 'bg-orange-50 border-orange-300'
          : expired
            ? isDarkMode
              ? 'bg-red-900/20 border-red-500/50'
              : 'bg-red-50 border-red-300'
            : isDarkMode
              ? 'bg-gray-800 border-gray-600'
              : 'bg-gray-100 border-gray-300'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${
          isFree 
            ? isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
            : isCountingDown
              ? isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'
              : expired
                ? isDarkMode ? 'bg-red-500/20' : 'bg-red-100'
                : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          {isFree ? (
            <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          ) : isCountingDown ? (
            <Clock className={`w-5 h-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
          ) : expired ? (
            <AlertTriangle className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
          ) : (
            <DollarSign className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          )}
        </div>
        <div>
          <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Payment Status
          </h4>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Current mode: {paymentMode.toUpperCase()}
          </p>
        </div>
      </div>

      {isFree ? (
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
              Company is FREE
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-200 text-green-800'}`}>
              No payment required
            </span>
          </div>
        </div>
      ) : isCountingDown ? (
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>
              Payment Required
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-200 text-orange-800'}`}>
              24 Hour Window
            </span>
          </div>
          <div className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {hoursRemaining}h {minutesRemaining}m remaining
          </div>
          <div className={`w-full bg-gray-300 rounded-full h-2 mt-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(0, ((hoursRemaining * 60 + minutesRemaining) / (24 * 60)) * 100)}%` }}
            ></div>
          </div>
        </div>
      ) : expired ? (
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
              Payment Window Expired
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-200 text-red-800'}`}>
              Action Required
            </span>
          </div>
        </div>
      ) : (
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Paid Mode Active
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
              Payment Required
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyPaymentStatus;