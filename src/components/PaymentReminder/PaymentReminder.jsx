import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { AlertCircle, Clock, CreditCard, ArrowRight, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';

const PaymentReminder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isDarkMode } = useTheme();
  const { user, isAuthenticated } = useAppContext();
  const [timeRemaining, setTimeRemaining] = useState('');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get company ID from URL, state, or user context
  const companyId = searchParams.get('company') || location.state?.companyId || user?.companyId;

  useEffect(() => {
    // Fetch payment info if not in state
    const fetchPaymentInfo = async () => {
      try {
        // First try to get from location state
        if (location.state?.paymentInfo) {
          setPaymentInfo(location.state.paymentInfo);
          setLoading(false);
          return;
        }
        
        // Try to get from localStorage
        const storedPaymentInfo = localStorage.getItem('paymentInfo');
        if (storedPaymentInfo) {
          const parsed = JSON.parse(storedPaymentInfo);
          setPaymentInfo(parsed);
          setLoading(false);
          return;
        }
        
        // If user is authenticated, fetch from API
        if (isAuthenticated && user && user.companyId) {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:9000/api/company/my-company', {
            headers: { 'x-auth-token': token }
          });
          
          if (response.ok) {
            const companyData = await response.json();
            const now = new Date();
            const paymentDeadline = companyData.paymentDeadline ? new Date(companyData.paymentDeadline) : null;
            const isDeadlinePassed = paymentDeadline && paymentDeadline < now;
            
            // Payment flow:
            // 1. 24h window: can access app
            // 2. Grace period (7 days): only admin can access
            // 3. After grace: payment required for all
            const gracePeriodDeadline = companyData.gracePeriodDeadline ? new Date(companyData.gracePeriodDeadline) : null;
            const gracePeriodExpired = gracePeriodDeadline && now >= gracePeriodDeadline;
            const inGracePeriod = isDeadlinePassed && !gracePeriodExpired;
            
            const needsPayment = companyData.paymentMode === 'paid' && 
                                !companyData.hasPaid &&
                                gracePeriodExpired; // Only need payment AFTER grace period
            
            // Check if 24-hour countdown is active (paymentCountdownStart exists and payment not made)
            const paymentCountdownStart = companyData.paymentCountdownStart ? new Date(companyData.paymentCountdownStart) : null;
            const is24HourCountdownActive = paymentCountdownStart && !companyData.hasPaid;
            
            setPaymentInfo({
              paymentDeadline: paymentDeadline,
              gracePeriodDeadline: gracePeriodDeadline,
              isDeadlinePassed: isDeadlinePassed,
              inGracePeriod: inGracePeriod,
              gracePeriodExpired: gracePeriodExpired,
              needsPayment: needsPayment,
              selectedPlan: companyData.selectedPlan,
              subscriptionStatus: companyData.subscriptionStatus,
              hasPaid: companyData.hasPaid,
              status: companyData.status,
              paymentMode: companyData.paymentMode,
              paymentCountdownStart: paymentCountdownStart,
              is24HourCountdownActive: is24HourCountdownActive,
              isWithin24Hours: is24HourCountdownActive && paymentDeadline && !isDeadlinePassed // Within 24h window and countdown active
            });
          }
        }
      } catch (error) {
        console.error('Error fetching payment info:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaymentInfo();
  }, [location.state, isAuthenticated, user]);

  useEffect(() => {
    // If payment has been made or countdown is not active, redirect to home
    if (paymentInfo && (paymentInfo.hasPaid || !paymentInfo.is24HourCountdownActive)) {
      // Payment made or countdown not active - no need to show reminder
      if (isAuthenticated) {
        navigate(companyId ? `/home?company=${companyId}` : '/home');
      }
      return;
    }
    
    if (!paymentInfo || !paymentInfo.paymentDeadline) {
      // If no payment info and user is authenticated, check if they need payment
      if (isAuthenticated && user && user.role !== 'superadmin') {
        // Wait a bit for payment info to load
        return;
      }
      // No payment info and not authenticated, redirect to home
      if (!isAuthenticated) {
        navigate(companyId ? `/home?company=${companyId}` : '/home');
      }
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      
      // If in grace period, show grace period countdown
      if (paymentInfo.inGracePeriod && paymentInfo.gracePeriodDeadline) {
        const graceDeadline = new Date(paymentInfo.gracePeriodDeadline);
        const diff = graceDeadline - now;
        
        if (diff <= 0) {
          setTimeRemaining('Grace period expired');
          return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        setTimeRemaining(`${days}d ${hours}h remaining in grace period`);
        return;
      }
      
      // Otherwise show payment deadline countdown
      const deadline = new Date(paymentInfo.paymentDeadline);
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeRemaining('Payment deadline has passed');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s remaining`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s remaining`);
      } else {
        setTimeRemaining(`${seconds}s remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [paymentInfo, navigate, isAuthenticated, user, companyId]);

  const handleContinue = () => {
    // Allow continue if:
    // 1. Company is in free mode, OR
    // 2. Payment is not needed (deadline not passed), OR 
    // 3. Already paid, OR
    // 4. 24-hour countdown is not active (payment made or countdown cleared)
    const canContinue = paymentInfo?.paymentMode === 'free' || 
                       !paymentInfo?.needsPayment || 
                       paymentInfo?.hasPaid ||
                       !paymentInfo?.is24HourCountdownActive;
    
    if (!canContinue) {
      // Don't allow continue if payment is actually required (deadline passed)
      return;
    }
    
    // Navigate to home with company ID in URL
    if (companyId) {
      navigate(`/home?company=${companyId}`);
    } else {
      navigate('/home');
    }
  };

  const handleGoToPayment = () => {
    // Navigate to payment page with company ID in URL
    if (companyId) {
      navigate(`/admin/payments?company=${companyId}`);
    } else {
      navigate('/admin/payments');
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return '';
    const date = new Date(deadline);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const planNames = {
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
    free_trial: 'Free Trial'
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!paymentInfo) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}>
        <div className={`max-w-2xl w-full ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-3xl shadow-2xl p-8 sm:p-10 text-center`}>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Loading payment information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`}>
      <div className={`max-w-2xl w-full ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-3xl shadow-2xl p-8 sm:p-10`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
              <AlertCircle size={32} className="text-orange-500" />
            </div>
            <div>
              <h1 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Payment Required
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Complete your subscription to continue
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 mb-8">
          {/* Plan Info */}
          <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <CreditCard size={24} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {planNames[paymentInfo.selectedPlan] || 'Selected Plan'}
              </h2>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {paymentInfo.paymentMode === 'free' ? (
                <span>Your company is in <strong>FREE mode</strong>. No payment is required.</span>
              ) : paymentInfo.selectedPlan === 'free_trial' ? (
                <span>You selected the <strong>{planNames[paymentInfo.selectedPlan] || paymentInfo.selectedPlan}</strong> plan. Your 7-day free trial period is active.</span>
              ) : paymentInfo.isWithin24Hours ? (
                <span>You selected the <strong>{planNames[paymentInfo.selectedPlan] || paymentInfo.selectedPlan}</strong> plan. You have 24 hours to complete payment (optional during this period).</span>
              ) : (
                <span>You selected the <strong>{planNames[paymentInfo.selectedPlan] || paymentInfo.selectedPlan}</strong> plan. Payment is now required to continue.</span>
              )}
            </p>
          </div>

          {/* Deadline Info - Only show if not in free mode and 24-hour countdown is active */}
          {paymentInfo.paymentMode !== 'free' && paymentInfo.paymentDeadline && paymentInfo.is24HourCountdownActive && (
            <div className={`p-6 rounded-2xl ${paymentInfo.isWithin24Hours ? (isDarkMode ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-orange-50 border border-orange-200') : (isDarkMode ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200')}`}>
              <div className="flex items-center gap-3 mb-4">
                <Clock size={24} className={paymentInfo.isWithin24Hours ? 'text-orange-500' : 'text-red-500'} />
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {paymentInfo.isWithin24Hours ? '24-Hour Window' : 'Payment Deadline'}
                </h2>
              </div>
              <div className="space-y-2">
                <p className={`text-2xl font-black ${paymentInfo.isWithin24Hours ? (isDarkMode ? 'text-orange-400' : 'text-orange-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
                  {timeRemaining || 'Calculating...'}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Deadline: {formatDeadline(paymentInfo.paymentDeadline)}
                </p>
                {paymentInfo.isWithin24Hours ? (
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                    ℹ️ You can continue using the app during this 24-hour window.
                  </p>
                ) : (
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    ⚠️ Payment is now required to continue using the app.
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Free Mode Info */}
          {paymentInfo.paymentMode === 'free' && (
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <CreditCard size={24} className="text-green-500" />
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Free Access
                </h2>
              </div>
              <div className="space-y-2">
                <p className={`text-2xl font-black ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  No Payment Required
                </p>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  ✅ Your company has free access to all features.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Show payment button only if deadline has passed and not paid */}
          {paymentInfo.needsPayment && !paymentInfo.hasPaid && (
            <button
              onClick={handleGoToPayment}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CreditCard size={20} />
              Go to Payment
              <ArrowRight size={20} />
            </button>
          )}
          
          {/* Show continue button if: free mode, within 24h window, already paid, or countdown not active */}
          {(paymentInfo.paymentMode === 'free' || !paymentInfo.needsPayment || paymentInfo.hasPaid || !paymentInfo.is24HourCountdownActive) && (
            <button
              onClick={handleContinue}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                paymentInfo.paymentMode === 'free'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                  : isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              Continue to App
              <ArrowRight size={20} />
            </button>
          )}
          
          {/* Show both buttons if within 24h window and countdown is active (can continue OR pay early) */}
          {paymentInfo.isWithin24Hours && paymentInfo.paymentMode === 'paid' && !paymentInfo.hasPaid && paymentInfo.is24HourCountdownActive && (
            <button
              onClick={handleGoToPayment}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CreditCard size={20} />
              Pay Now (Optional)
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default PaymentReminder;

