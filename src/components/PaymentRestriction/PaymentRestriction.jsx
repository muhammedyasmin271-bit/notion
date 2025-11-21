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
        const response = await fetch('http://localhost:9000/api/company/my-company', {
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
          
          // Check if in grace period (only admin can login during grace period)
          const now = new Date();
          const paymentDeadline = companyData.paymentDeadline ? new Date(companyData.paymentDeadline) : null;
          const gracePeriodDeadline = companyData.gracePeriodDeadline ? new Date(companyData.gracePeriodDeadline) : null;
          // Grace period: payment deadline has passed, but grace period hasn't
          const inGracePeriod = paymentDeadline && now >= paymentDeadline && 
                               gracePeriodDeadline && now < gracePeriodDeadline && 
                               companyData.paymentMode === 'paid' && 
                               companyData.selectedPlan !== 'free_trial' && 
                               !companyData.hasPaid;
          
          if (inGracePeriod && user.role !== 'admin') {
            // Non-admin users cannot login during grace period
            return;
          }
          
          // Check if payment is required
          // Only require payment if paymentMode is 'paid' AND (selectedPlan is not free_trial AND hasPaid is false)
          const needsPayment = companyData.paymentMode === 'paid' && 
                               companyData.selectedPlan !== 'free_trial' && 
                               !companyData.hasPaid;
          
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

  // Check if in grace period and user is not admin
  const now = new Date();
  const paymentDeadline = company?.paymentDeadline ? new Date(company.paymentDeadline) : null;
  const gracePeriodDeadline = company?.gracePeriodDeadline ? new Date(company.gracePeriodDeadline) : null;
  // Grace period: payment deadline has passed, but grace period hasn't
  const inGracePeriod = paymentDeadline && now >= paymentDeadline && 
                       gracePeriodDeadline && now < gracePeriodDeadline && 
                       company?.paymentMode === 'paid' && 
                       company?.selectedPlan !== 'free_trial' && 
                       !company?.hasPaid;
  
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

  // If payment is required and not on payment page, block access and redirect
  // Only require payment if paymentMode is 'paid'
  if (company && company.paymentMode === 'paid' && company.selectedPlan !== 'free_trial' && !company.hasPaid && !isPaymentPage) {
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

