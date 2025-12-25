import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const PaymentReturn = () => {
  const { isDarkMode } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Verifying your payment...');
  const [retryCount, setRetryCount] = useState(0);
  const [txRef, setTxRef] = useState(null);

  const maxRetries = 40; // Try for up to 120 seconds (40 retries × 3 seconds)

  const verifyPayment = async (tx_ref, attempt = 1) => {
    try {
      const token = localStorage.getItem('token');
      
      console.log(`🔍 Payment verification attempt ${attempt} for tx_ref:`, tx_ref);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'https://notion-l9ti.onrender.com'}/api/payments/chapa/verify/${tx_ref}`, {
        headers: { 'x-auth-token': token }
      });
      
      const data = await response.json();
      console.log(`📡 Verification attempt ${attempt} response:`, data);
      
      if (response.ok) {
        if (data.status === 'approved' && data.verified === true) {
          // Payment successful!
          setStatus('success');
          setMessage('✅ Payment completed successfully! Your subscription has been activated.');
          
          // Store success status
          localStorage.setItem('paymentSuccess', JSON.stringify({
            status: 'success',
            txRef: tx_ref,
            timestamp: new Date().toISOString()
          }));
          
          // Redirect to payment page after 3 seconds
          setTimeout(() => {
            const companyParam = searchParams.get('company');
            navigate(companyParam ? `/${companyParam}/admin/payments` : '/admin/payments');
          }, 3000);
          
          return true; // Success - stop retrying
        } else if (data.status === 'pending') {
          // Still pending - continue retrying
          if (attempt < maxRetries) {
            setMessage(`⏳ Payment is being processed... (Attempt ${attempt}/${maxRetries}) - Checking for up to 2 minutes due to connection delays`);
            setRetryCount(attempt);
            
            // Wait 3 seconds before next attempt
            setTimeout(() => {
              verifyPayment(tx_ref, attempt + 1);
            }, 3000);
            
            return false; // Continue retrying
          } else {
            // Max retries reached
            setStatus('timeout');
            setMessage('⏰ Payment verification is taking longer than expected. Please check your payment history or contact support.');
            return false;
          }
        } else {
          // Payment failed or rejected
          setStatus('failed');
          setMessage(`❌ Payment was not successful. Status: ${data.status || 'unknown'}`);
          return false;
        }
      } else {
        // API error
        if (attempt < maxRetries) {
          setMessage(`🔄 Verification failed, retrying... (Attempt ${attempt}/${maxRetries})`);
          setRetryCount(attempt);
          
          setTimeout(() => {
            verifyPayment(tx_ref, attempt + 1);
          }, 3000);
          
          return false;
        } else {
          setStatus('error');
          setMessage('❌ Unable to verify payment. Please check your payment history or contact support.');
          return false;
        }
      }
    } catch (error) {
      console.error(`❌ Verification attempt ${attempt} error:`, error);
      
      if (attempt < maxRetries) {
        setMessage(`🔄 Connection error, retrying... (Attempt ${attempt}/${maxRetries})`);
        setRetryCount(attempt);
        
        setTimeout(() => {
          verifyPayment(tx_ref, attempt + 1);
        }, 3000);
        
        return false;
      } else {
        setStatus('error');
        setMessage('❌ Connection error. Please check your internet connection and try again.');
        return false;
      }
    }
  };

  useEffect(() => {
    const tx_ref = searchParams.get('tx_ref');
    const chapaStatus = searchParams.get('status');
    
    console.log('🔍 Payment return page loaded:', { tx_ref, chapaStatus });
    
    if (tx_ref) {
      setTxRef(tx_ref);
      verifyPayment(tx_ref);
    } else {
      setStatus('error');
      setMessage('❌ No transaction reference found. Please try making the payment again.');
    }
  }, [searchParams]);

  const handleRetry = () => {
    if (txRef) {
      setStatus('checking');
      setMessage('Verifying your payment...');
      setRetryCount(0);
      verifyPayment(txRef);
    }
  };

  const handleGoToPayments = () => {
    const companyParam = searchParams.get('company');
    navigate(companyParam ? `/${companyParam}/admin/payments` : '/admin/payments');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'timeout':
        return <Clock className="w-16 h-16 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-16 h-16 text-red-500" />;
      default:
        return <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return isDarkMode 
          ? 'from-green-900/30 to-emerald-900/30 border-green-500/50' 
          : 'from-green-50 to-emerald-50 border-green-300';
      case 'failed':
      case 'error':
        return isDarkMode 
          ? 'from-red-900/30 to-pink-900/30 border-red-500/50' 
          : 'from-red-50 to-pink-50 border-red-300';
      case 'timeout':
        return isDarkMode 
          ? 'from-yellow-900/30 to-orange-900/30 border-yellow-500/50' 
          : 'from-yellow-50 to-orange-50 border-yellow-300';
      default:
        return isDarkMode 
          ? 'from-blue-900/30 to-indigo-900/30 border-blue-500/50' 
          : 'from-blue-50 to-indigo-50 border-blue-300';
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      <div className={`max-w-md w-full bg-gradient-to-r ${getStatusColor()} rounded-3xl shadow-2xl border-2 p-8 text-center`}>
        <div className="mb-6">
          {getStatusIcon()}
        </div>
        
        <h1 className={`text-2xl font-bold mb-4 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Payment Verification
        </h1>
        
        <p className={`text-lg mb-6 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {message}
        </p>
        
        {status === 'checking' && retryCount > 0 && (
          <div className={`mb-6 p-4 rounded-xl ${
            isDarkMode ? 'bg-blue-900/20 border border-blue-500/30' : 'bg-blue-100 border border-blue-200'
          }`}>
            <p className={`text-sm ${
              isDarkMode ? 'text-blue-300' : 'text-blue-800'
            }`}>
              Chapa payments can take up to 2 minutes to process due to connection delays. We're checking every 3 seconds...
            </p>
          </div>
        )}
        
        {txRef && (
          <div className={`mb-6 p-3 rounded-lg ${
            isDarkMode ? 'bg-gray-800/50 border border-gray-600' : 'bg-gray-100 border border-gray-200'
          }`}>
            <p className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Transaction: {txRef}
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          {(status === 'timeout' || status === 'error') && (
            <button
              onClick={handleRetry}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              Try Again
            </button>
          )}
          
          <button
            onClick={handleGoToPayments}
            className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Go to Payment History
          </button>
        </div>
        
        {status === 'success' && (
          <p className={`text-sm mt-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Redirecting to payment history in 3 seconds...
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentReturn;