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
            const needsPayment = companyData.selectedPlan !== 'free_trial' && !companyData.hasPaid;
            const now = new Date();
            const paymentDeadline = companyData.paymentDeadline ? new Date(companyData.paymentDeadline) : null;
            const isDeadlinePassed = paymentDeadline && paymentDeadline < now;
            
            setPaymentInfo({
              paymentDeadline: paymentDeadline,
              isDeadlinePassed: isDeadlinePassed,
              needsPayment: needsPayment,
              selectedPlan: companyData.selectedPlan,
              subscriptionStatus: companyData.subscriptionStatus,
              hasPaid: companyData.hasPaid,
              status: companyData.status
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
    // Only allow continue if payment is not needed or already paid
    if (paymentInfo && paymentInfo.needsPayment && !paymentInfo.hasPaid) {
      // Don't allow continue if payment is required
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
              You selected the <strong>{planNames[paymentInfo.selectedPlan] || paymentInfo.selectedPlan}</strong> plan. 
              {paymentInfo.selectedPlan === 'free_trial' 
                ? ' Your 7-day free trial period is active.' 
                : ' Please complete payment within 24 hours to activate your subscription.'}
            </p>
          </div>

          {/* Deadline Info */}
          <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <Clock size={24} className="text-red-500" />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Payment Deadline
              </h2>
            </div>
            <div className="space-y-2">
              <p className={`text-2xl font-black ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                {timeRemaining || 'Calculating...'}
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Deadline: {formatDeadline(paymentInfo.paymentDeadline)}
              </p>
              {paymentInfo.selectedPlan !== 'free_trial' && (
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  ⚠️ Your account will be paused if payment is not completed by the deadline.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
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
          {(!paymentInfo.needsPayment || paymentInfo.hasPaid) && (
            <button
              onClick={handleContinue}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              Continue to App
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default PaymentReminder;

