import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { AlertCircle, CreditCard, Lock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const PaymentRestriction = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAppContext();
  const { isDarkMode } = useTheme();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentPage, setIsPaymentPage] = useState(false);

  useEffect(() => {
    // Check if current route is payment-related - ONLY allow payment pages when payment is needed
    const allowedPaymentRoutes = ['/payment-reminder', '/admin/payments'];
    const isOnPaymentRoute = allowedPaymentRoutes.some(route => location.pathname.includes(route));
    setIsPaymentPage(isOnPaymentRoute);
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role === 'superadmin') {
      setLoading(false);
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const envBackendUrl = process.env.REACT_APP_BACKEND_URL;
        const fallbackUrl = 'https://notion-l9ti.onrender.com';
        let backendUrl = fallbackUrl;
        if (envBackendUrl && envBackendUrl !== 'undefined' && envBackendUrl.startsWith('http')) {
          backendUrl = envBackendUrl;
        }
        
        const response = await fetch(`${backendUrl}/api/company/my-company`, {
          headers: { 'x-auth-token': token }
        });

        if (response.ok) {
          const companyData = await response.json();
          setCompany(companyData);
          
          // Check if company is paused - block ALL users including admin
          if (companyData.status === 'paused') {
            // Company is paused, show pause message
            return;
          }
          
          // Check payment status and grace period
          const now = new Date();
          const paymentDeadline = companyData.paymentDeadline ? new Date(companyData.paymentDeadline) : null;
          const gracePeriodDeadline = companyData.gracePeriodDeadline ? new Date(companyData.gracePeriodDeadline) : null;
          
          // Check if payment deadline has passed (deadline month)
          const deadlinePassed = paymentDeadline && now >= paymentDeadline && 
                                 companyData.paymentMode === 'paid' && 
                                 !companyData.hasPaid;
          
          // Grace period: payment deadline has passed, but grace period hasn't
          const inGracePeriod = deadlinePassed && 
                               gracePeriodDeadline && now < gracePeriodDeadline;
          
          // Grace period expired - company should be paused
          const gracePeriodExpired = gracePeriodDeadline && now >= gracePeriodDeadline && 
                                    companyData.paymentMode === 'paid' && 
                                    !companyData.hasPaid;
          
          // 24-hour countdown active - optional payment window
          const paymentCountdownStart = companyData.paymentCountdownStart ? new Date(companyData.paymentCountdownStart) : null;
          const is24HourCountdownActive = (paymentCountdownStart || (paymentDeadline && paymentDeadline > now)) && !companyData.hasPaid;
          
          // Redirect to reminder page if:
          // 1. Grace period expired (blocked)
          // 2. OR 24-hour window is active (for awareness)
          const urlParams = new URLSearchParams(location.search);
          const hasBeenReminded = urlParams.get('reminded') === 'true';
          const needsReminder = (gracePeriodExpired || (is24HourCountdownActive && companyData.paymentMode === 'paid')) && !hasBeenReminded;
          
          // If reminder is needed and not on allowed payment pages, redirect
          if (needsReminder && !isPaymentPage) {
            console.log('🔄 PaymentRestriction: Redirecting to reminder page');
            // Redirect to payment reminder with company ID in URL
            navigate(`/payment-reminder?company=${user.companyId}`, { 
              state: { 
                companyId: user.companyId,
                paymentInfo: {
                  ...companyData,
                  isDeadlinePassed,
                  inGracePeriod,
                  gracePeriodExpired,
                  is24HourCountdownActive,
                  isWithin24Hours: is24HourCountdownActive && paymentDeadline && !isDeadlinePassed
                },
                from: location.pathname
              },
              replace: true // Replace history to prevent back navigation
            });
            return; // Don't continue rendering
          }
          
          // Block ALL users (including admin) when deadline passes - until super admin clicks play
          // Block if: deadline passed OR company is paused (due to deadline)
          if (deadlinePassed || companyData.status === 'paused') {
            // Company deadline passed or is paused - ALL users blocked until super admin unpauses
            return;
          }
          
          // Block ALL users (including admin) after grace period expires
          if (gracePeriodExpired) {
            // Grace period expired - block all access until super admin unpauses
            return;
          }
          
          // Check if payment is required (after grace period expires)
          const needsPayment = gracePeriodExpired;
          
          // If payment is needed and not on allowed payment pages, redirect
          if (needsPayment && !isPaymentPage) {
            // Redirect to payment reminder with company ID in URL - block ALL other pages
            navigate(`/payment-reminder?company=${user.companyId}`, { 
              state: { 
                companyId: user.companyId,
                from: location.pathname
              },
              replace: true // Replace history to prevent back navigation
            });
            return; // Don't continue rendering
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [isAuthenticated, user, navigate, location.pathname, isPaymentPage]);

  // Check grace period and expiration status
  const now = new Date();
  const paymentDeadline = company?.paymentDeadline ? new Date(company.paymentDeadline) : null;
  const gracePeriodDeadline = company?.gracePeriodDeadline ? new Date(company.gracePeriodDeadline) : null;
  
  // Check if payment deadline has passed (deadline month)
  const deadlinePassed = paymentDeadline && now >= paymentDeadline && 
                        company?.paymentMode === 'paid' && 
                        !company?.hasPaid;
  
  // Grace period: payment deadline has passed, but grace period hasn't
  const inGracePeriod = deadlinePassed && 
                       gracePeriodDeadline && now < gracePeriodDeadline;
  
  // Grace period expired
  const gracePeriodExpired = gracePeriodDeadline && now >= gracePeriodDeadline && 
                            company?.paymentMode === 'paid' && 
                            !company?.hasPaid;
  
  // Block ALL users (including admin) when deadline passes OR company is paused
  // This happens until super admin clicks "Play" button
  if (deadlinePassed || company?.status === 'paused') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}>
        <div className={`max-w-2xl w-full ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-3xl shadow-2xl p-8 sm:p-10`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
              <Lock size={32} className="text-red-500" />
            </div>
            <div>
              <h1 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Payment Deadline Passed
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Company has been paused
              </p>
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Access Suspended
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Your company's payment deadline has passed and the account has been paused. Please contact the super administrator to reactivate your account.
                </p>
                <p className={`text-sm mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Once reactivated, you will have 24 hours to complete payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (inGracePeriod && user?.role !== 'admin') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}>
        <div className={`max-w-2xl w-full ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-3xl shadow-2xl p-8 sm:p-10`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
              <Lock size={32} className="text-orange-500" />
            </div>
            <div>
              <h1 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Grace Period Active
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Payment deadline has passed
              </p>
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-orange-50 border border-orange-200'}`}>
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Admin Access Only
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Your company is in a grace period. Only the administrator can log in to complete payment. Please contact your administrator to make the payment.
                </p>
                <p className={`text-sm mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  If payment is not completed within the grace period, the company will be paused.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If company is paused, show pause message
  if (company && company.status === 'paused') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}>
        <div className={`max-w-2xl w-full ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-3xl shadow-2xl p-8 sm:p-10`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
              <Lock size={32} className="text-red-500" />
            </div>
            <div>
              <h1 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Company Paused
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your company account has been paused
              </p>
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Payment Required
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Your company has been paused due to unpaid subscription. Please contact the super administrator to unpause your account and complete payment.
                </p>
                <p className={`text-sm mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Once unpaused, you will have 24 hours to complete payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-gray-800 border-t-transparent rounded-full animate-spin absolute"></div>
      </div>
    );
  }

  // If grace period expired, show payment required message
  if (gracePeriodExpired) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}>
        <div className={`max-w-2xl w-full ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-3xl shadow-2xl p-8 sm:p-10`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
              <Lock size={32} className="text-red-500" />
            </div>
            <div>
              <h1 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Payment Required
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Grace period has expired
              </p>
            </div>
          </div>
          <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Access Suspended
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  The 7-day grace period has expired. Payment is now required to continue using the application.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If payment is required and not on payment page, block access and redirect
  if (company && gracePeriodExpired && !isPaymentPage) {
    // Don't render children - redirect will happen in useEffect
    // Show a blocking message while redirecting
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}>
        <div className={`max-w-2xl w-full ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-3xl shadow-2xl p-8 sm:p-10 text-center`}>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Redirecting to payment page...
          </p>
        </div>
      </div>
    );
  }

  // Otherwise, render children
  return <>{children}</>;
};

export default PaymentRestriction;

