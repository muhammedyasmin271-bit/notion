import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import {
  DollarSign, Calendar, CheckCircle,
  XCircle, Clock, CreditCard, AlertCircle, X, Sparkles,
  ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown,
  Info, ArrowRight, Lock, ChevronUp, ChevronDown
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import CompanyCalendar from '../CompanyCalendar/CompanyCalendar';

const PaymentSubmission = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const params = useParams();
  const [searchParams] = useSearchParams();
  // Get company ID from path parameter (/:companyId/admin/payments) or query parameter (?company=xxx)
  const companyIdFromPath = params.companyId;
  const companyIdFromQuery = searchParams.get('company');
  const companyIdFromUrl = companyIdFromPath || companyIdFromQuery;
  const [payments, setPayments] = useState([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showInstructions, setShowInstructions] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  const [showMonthlyPlans, setShowMonthlyPlans] = useState(false);
  const [selectedMonthlyPlan, setSelectedMonthlyPlan] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit');
  const [paymentSettings, setPaymentSettings] = useState({
    pricePerUserPerMonth: 1,
    currency: 'ETB'
  });
  const [companyData, setCompanyData] = useState({
    userLimit: 50,
    selectedPlan: 'one_month',
    createdAt: null,
    paymentDeadline: null,
    paymentPeriodEnd: null,
    gracePeriodDeadline: null,
    hasPaid: false,
    status: 'active',
    paymentMode: 'paid', // 'paid' or 'free'
    payments: []
  });

  // Calculate price based on: (User Limit × Price Per User × Months) - Discount
  const calculatePrice = React.useCallback((months, discount = 0) => {
    const basePrice = companyData.userLimit * paymentSettings.pricePerUserPerMonth * months;
    const discountedPrice = basePrice * (1 - discount / 100);
    return Math.round(discountedPrice);
  }, [companyData.userLimit, paymentSettings.pricePerUserPerMonth]);

  // Subscription plans - recalculates when company data or payment settings change
  const plans = React.useMemo(() => [
    { 
      id: 'one_month', 
      name: 'One Month Plan', 
      months: 1, 
      price: calculatePrice(1),
      planId: 'one_month'
    },
    { 
      id: 'three_month', 
      name: 'Three Month Plan', 
      months: 3, 
      price: calculatePrice(3, 5),
      discount: 5,
      planId: 'three_month'
    },
    { 
      id: 'six_month', 
      name: 'Six Month Plan', 
      months: 6, 
      price: calculatePrice(6, 10),
      discount: 10,
      planId: 'six_month'
    }
  ], [calculatePrice]);

  // Calculate monthly EMI plans - Only 3 plans
  const basePrice = calculatePrice(1); // One month base price
  const monthlyPlans = React.useMemo(() => {
    const totalPrice = selectedPlan ? selectedPlan.price : basePrice;
    const priceWithFee = totalPrice + 1200; // Add fee like in the image
    return [
      { emis: 9, perMonth: Math.round(priceWithFee / 9) },
      { emis: 6, perMonth: Math.round(priceWithFee / 6) },
      { emis: 6, perMonth: Math.round(priceWithFee / 6) }
    ];
  }, [basePrice, selectedPlan]);

  const [formData, setFormData] = useState({
    months: [],
    year: new Date().getFullYear()
  });

  const verifyPaymentStatus = async (txRef) => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Verifying payment with tx_ref:', txRef);
      
      // Show verification status on page
      setVerificationStatus({ status: 'checking', message: 'Verifying payment with Chapa...' });
      
      const response = await fetch(`http://localhost:9000/api/payments/chapa/verify/${txRef}`, {
        headers: { 'x-auth-token': token }
      });
      
      const data = await response.json();
      console.log('🔍 Verification response:', data);
      
      if (response.ok) {
        // STRICT CHECK: Only show success if payment is explicitly approved
        if (data.status === 'approved' && data.verified === true) {
          const successStatus = { 
            status: 'success', 
            message: '✅ Payment completed and verified successfully! Payment will appear in history shortly.',
            txRef: txRef,
            timestamp: new Date().toISOString()
          };
          setVerificationStatus(successStatus);
          // Store in localStorage so it persists across reloads
          localStorage.setItem('paymentVerificationStatus', JSON.stringify(successStatus));
          showMessage('success', 'Payment completed and verified successfully!');
          
          // Refresh payments list and company data immediately
          await Promise.all([
            fetchPayments(),
            fetchPaymentSettings() // This fetches company data including paymentPeriodEnd, hasPaid, etc.
          ]);
          
          // Refresh multiple times to ensure backend has updated the company dates
          setTimeout(async () => {
            await Promise.all([
              fetchPayments(),
              fetchPaymentSettings()
            ]);
          }, 2000);
          
          setTimeout(async () => {
            await Promise.all([
              fetchPayments(),
              fetchPaymentSettings()
            ]);
          }, 4000);
          
          // Give a moment for state to update, then reload to ensure calendar updates
          setTimeout(() => {
            localStorage.removeItem('paymentVerificationStatus');
            setVerificationStatus(null); // Clear status before reload
            window.location.reload();
          }, 6000); // Increased to 6 seconds to allow multiple refreshes
        } else if (data.status === 'pending') {
          // Payment is still pending - not completed yet
          const pendingStatus = { 
            status: 'pending', 
            message: '⏳ Payment is still pending. If you completed payment, please wait a moment and refresh the page.',
            txRef: txRef,
            timestamp: new Date().toISOString()
          };
          setVerificationStatus(pendingStatus);
          localStorage.setItem('paymentVerificationStatus', JSON.stringify(pendingStatus));
          showMessage('error', 'Payment is still pending. Please complete the payment on Chapa or wait a moment and refresh.');
        } else {
          // Payment failed or rejected
          const failedStatus = { 
            status: 'failed', 
            message: `❌ Payment status: ${data.status || 'unknown'}. Payment was not completed successfully.`,
            txRef: txRef,
            timestamp: new Date().toISOString()
          };
          setVerificationStatus(failedStatus);
          localStorage.setItem('paymentVerificationStatus', JSON.stringify(failedStatus));
          showMessage('error', `Payment status: ${data.status || 'unknown'}. Payment was not completed successfully.`);
        }
      } else {
        const errorStatus = { 
          status: 'error', 
          message: `❌ ${data.message || 'Payment verification failed. Please contact support.'}`,
          txRef: txRef,
          timestamp: new Date().toISOString()
        };
        setVerificationStatus(errorStatus);
        localStorage.setItem('paymentVerificationStatus', JSON.stringify(errorStatus));
        showMessage('error', data.message || 'Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setVerificationStatus({ 
        status: 'error', 
        message: 'Failed to verify payment status. Please refresh the page or contact support.' 
      });
      showMessage('error', 'Failed to verify payment status. Please refresh the page.');
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchPaymentSettings();
    
    // Check for payment success from localStorage (set by PaymentReturn page)
    const paymentSuccess = localStorage.getItem('paymentSuccess');
    if (paymentSuccess) {
      try {
        const successData = JSON.parse(paymentSuccess);
        setVerificationStatus({
          status: 'success',
          message: '✅ Payment completed successfully! Your subscription has been activated.',
          txRef: successData.txRef,
          timestamp: successData.timestamp
        });
        
        // Clear after 10 seconds
        setTimeout(() => {
          localStorage.removeItem('paymentSuccess');
          setVerificationStatus(null);
          // Refresh data to show updated payment
          fetchPayments();
          fetchPaymentSettings();
        }, 10000);
      } catch (e) {
        localStorage.removeItem('paymentSuccess');
      }
    }

    // Check for payment verification status from localStorage
    const storedStatus = localStorage.getItem('paymentVerificationStatus');
    if (storedStatus) {
      try {
        const status = JSON.parse(storedStatus);
        setVerificationStatus(status);
        
        // If status is checking, verify payment
        if (status.status === 'checking' && status.txRef) {
          verifyPaymentStatus(status.txRef);
        }
      } catch (e) {
        console.error('Error parsing stored verification status:', e);
      }
    }

    // Check URL for payment return
    const urlParams = new URLSearchParams(window.location.search);
    const txRef = urlParams.get('tx_ref');
    const status = urlParams.get('status');
    
    if (txRef && status === 'success') {
      verifyPaymentStatus(txRef);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, companyIdFromUrl]);

  // Recalculate plans when company data or payment settings change
  useEffect(() => {
    // Plans will automatically recalculate via useMemo when companyData or paymentSettings change
  }, [companyData, paymentSettings]);

  const fetchPaymentSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch price per user per month from settings
      const globalResponse = await fetch('http://localhost:9000/api/settings/payment', {
        headers: { 'x-auth-token': token }
      });
      const globalData = await globalResponse.json();
      
      // Fetch company data to get user limit
      const userResponse = await fetch('http://localhost:9000/api/auth/me', {
        headers: { 'x-auth-token': token }
      });
      const userData = await userResponse.json();
      
      const companyResponse = await fetch(`http://localhost:9000/api/admin/companies/${userData.companyId}`, {
        headers: { 'x-auth-token': token }
      });
      const companyResponseData = await companyResponse.json();
      
      // Also fetch from my-company endpoint to ensure we have all fields
      const myCompanyResponse = await fetch('http://localhost:9000/api/company/my-company', {
        headers: { 'x-auth-token': token }
      });
      const myCompanyData = myCompanyResponse.ok ? await myCompanyResponse.json() : {};
      
      // Fetch company payments
      const paymentsResponse = await fetch('http://localhost:9000/api/payments/all', {
        headers: { 'x-auth-token': token }
      });
      const allPayments = paymentsResponse.ok ? await paymentsResponse.json() : [];
      const companyPayments = allPayments.filter(p => p.companyId === userData.companyId);
      
      // Merge data from both endpoints to ensure we have all fields
      const mergedCompanyData = {
        ...companyResponseData,
        ...myCompanyData,
        createdAt: companyResponseData.createdAt || myCompanyData.createdAt,
        paymentDeadline: companyResponseData.paymentDeadline || myCompanyData.paymentDeadline,
        paymentPeriodEnd: companyResponseData.paymentPeriodEnd || myCompanyData.paymentPeriodEnd,
        gracePeriodDeadline: companyResponseData.gracePeriodDeadline || myCompanyData.gracePeriodDeadline,
        hasPaid: companyResponseData.hasPaid !== undefined ? companyResponseData.hasPaid : (myCompanyData.hasPaid !== undefined ? myCompanyData.hasPaid : false),
        status: companyResponseData.status || myCompanyData.status,
        paymentMode: companyResponseData.paymentMode || myCompanyData.paymentMode || 'paid'
      };
      
      console.log('Company data for calendar:', {
        createdAt: mergedCompanyData.createdAt,
        paymentDeadline: mergedCompanyData.paymentDeadline,
        paymentPeriodEnd: mergedCompanyData.paymentPeriodEnd,
        hasPaid: mergedCompanyData.hasPaid,
        gracePeriodDeadline: mergedCompanyData.gracePeriodDeadline,
        payments: companyPayments.length
      });
      
      setPaymentSettings({
        pricePerUserPerMonth: globalData.pricePerUserPerMonth || 1,
        currency: globalData.currency || 'ETB'
      });
      
      setCompanyData({
        userLimit: mergedCompanyData.limits?.maxUsers || 50,
        selectedPlan: mergedCompanyData.selectedPlan || 'one_month',
        createdAt: mergedCompanyData.createdAt,
        paymentDeadline: mergedCompanyData.paymentDeadline,
        paymentPeriodEnd: mergedCompanyData.paymentPeriodEnd,
        gracePeriodDeadline: mergedCompanyData.gracePeriodDeadline,
        hasPaid: mergedCompanyData.hasPaid,
        status: mergedCompanyData.status,
        paymentMode: mergedCompanyData.paymentMode || 'paid',
        payments: companyPayments
      });
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:9000/api/payments/my-company', {
        headers: { 'x-auth-token': token }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      
      const data = await response.json();
      
      // Ensure payments is always an array
      let paymentsArray = [];
      if (Array.isArray(data)) {
        paymentsArray = data;
      } else if (data && Array.isArray(data.payments)) {
        paymentsArray = data.payments;
      } else if (data && Array.isArray(data.data)) {
        paymentsArray = data.data;
      } else {
        console.warn('Payments data is not an array:', data);
        paymentsArray = [];
      }
      
      // Filter: Only show successful payments (approved only)
      // Hide pending and rejected payments
      const filteredPayments = paymentsArray.filter(payment => {
        // Only show approved payments
        return payment.status === 'approved';
      });
      
      // Check if there's a new approved payment that wasn't there before
      const previousPaymentsCount = payments.length;
      const newPaymentsCount = filteredPayments.length;
      
      setPayments(filteredPayments);
      
      // If a new payment was approved, refresh company data to update calendar
      if (newPaymentsCount > previousPaymentsCount && previousPaymentsCount > 0) {
        console.log('🔄 New payment approved, refreshing company data...');
        setTimeout(() => {
          fetchPaymentSettings();
        }, 1000);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      showMessage('error', 'Failed to load payment history');
      setPayments([]); // Ensure it's always an array even on error
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setSelectedMonthlyPlan(null); // Clear monthly plan when selecting regular plan
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const months = [];
    for (let i = 0; i < plan.months; i++) {
      const monthNum = (currentMonth + i - 1) % 12 + 1;
      const yearOffset = Math.floor((currentMonth + i - 1) / 12);
      const year = currentYear + yearOffset;
      if (year === currentYear) {
        months.push(monthNum);
      }
    }
    setFormData({ 
      months: months.length > 0 ? months : [currentMonth],
      year: currentYear 
    });
  };

  const handlePayWithChapa = async () => {
    if (!selectedPlan && !selectedMonthlyPlan) {
      showMessage('error', 'Please select a subscription plan');
      return;
    }

    // If monthly plan is selected, use the first EMI amount
    const planToUse = selectedMonthlyPlan ? {
      ...selectedPlan || plans[0],
      price: selectedMonthlyPlan.perMonth,
      months: 1 // First payment is for 1 month
    } : selectedPlan;

    let monthsToUse = formData.months;
    if (!monthsToUse || monthsToUse.length === 0) {
      const currentMonth = new Date().getMonth() + 1;
      const months = [];
      for (let i = 0; i < planToUse.months; i++) {
        const monthNum = (currentMonth + i - 1) % 12 + 1;
        months.push(monthNum);
      }
      monthsToUse = months;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      // Price is already calculated with discount in the plan object
      const finalPrice = planToUse.price;

      const paymentPayload = {
        amount: finalPrice,
        months: monthsToUse,
        year: formData.year,
        planName: planToUse.name,
        isMonthlyPlan: !!selectedMonthlyPlan,
        monthlyPlanDetails: selectedMonthlyPlan ? {
          totalEMIs: selectedMonthlyPlan.emis,
          perMonth: selectedMonthlyPlan.perMonth
        } : null
      };

      const response = await fetch('http://localhost:9000/api/payments/chapa/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(paymentPayload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        let errorMessage = 'Failed to initialize payment';
        
        // Try to get the most helpful error message
        if (data.message) {
          if (typeof data.message === 'object') {
            errorMessage = JSON.stringify(data.message);
          } else {
            errorMessage = data.message;
          }
        } else if (data.error) {
          if (typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (data.error.message) {
            errorMessage = data.error.message;
          } else {
            errorMessage = JSON.stringify(data.error);
          }
        } else if (data.setupInstructions) {
          errorMessage = `${data.message || 'Payment gateway not configured'}\n\n${data.setupInstructions}`;
        }
        
        // Log full error for debugging
        console.error('❌ Payment initialization error:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        throw new Error(errorMessage);
      }

      if (data.success && data.checkoutUrl) {
        showMessage('success', 'Redirecting to Chapa payment page...');
        setTimeout(() => {
          window.location.href = data.checkoutUrl;
        }, 1000);
      } else {
        throw new Error(data.message || 'Invalid response from payment gateway');
      }
    } catch (error) {
      let errorMessage = 'Failed to initialize payment';
      
      // Log the full error for debugging
      console.error('❌ Payment error details:', error);
      
      if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('token') || error.message.includes('Authentication')) {
        errorMessage = 'Authentication error. Please refresh the page and try again.';
      } else if (error.message.includes('CHAPA_TOKEN') || error.message.includes('not configured')) {
        errorMessage = 'Payment gateway is not configured. Please contact the administrator to set up Chapa payment gateway.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      }
      
      showMessage('error', errorMessage);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      months: [],
      year: new Date().getFullYear()
    });
    setSelectedPlan(null);
    setDiscountCode('');
    setShowMonthlyPlans(false);
    setSelectedMonthlyPlan(null);
    setSelectedPaymentMethod('credit');
  };

  const handleApplyDiscount = () => {
    // Discount code logic can be added here
    if (discountCode.trim()) {
      showMessage('success', 'Discount code applied successfully!');
    } else {
      showMessage('error', 'Please enter a discount code');
    }
  };

  const calculateDiscount = () => {
    if (selectedPlan && selectedPlan.discount) {
      // Calculate discount amount from the original price before discount
      const originalPrice = companyData.userLimit * paymentSettings.pricePerUserPerMonth * selectedPlan.months;
      const discountAmount = originalPrice * (selectedPlan.discount / 100);
      return Math.round(discountAmount);
    }
    return 0;
  };

  const calculateTotal = () => {
    if (selectedMonthlyPlan) {
      return selectedMonthlyPlan.perMonth * selectedMonthlyPlan.emis;
    }
    if (selectedPlan) {
      return selectedPlan.price; // Price already includes discount
    }
    return basePrice;
  };

  const calculateFirstEMI = () => {
    if (selectedMonthlyPlan) {
      return selectedMonthlyPlan.perMonth;
    }
    if (selectedPlan) {
      return selectedPlan.price;
    }
    return basePrice;
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className={`flex items-center gap-1 px-4 py-2 ${isDarkMode ? 'bg-green-900/50 border-green-700 text-green-300' : 'bg-green-100 border-green-300 text-green-800'} border rounded-full text-sm font-semibold`}>
            <CheckCircle className="w-4 h-4" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className={`flex items-center gap-1 px-4 py-2 ${isDarkMode ? 'bg-red-900/50 border-red-700 text-red-300' : 'bg-red-100 border-red-300 text-red-800'} border rounded-full text-sm font-semibold`}>
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      default:
        return (
          <span className={`flex items-center gap-1 px-4 py-2 ${isDarkMode ? 'bg-yellow-900/50 border-yellow-700 text-yellow-300' : 'bg-yellow-100 border-yellow-300 text-yellow-800'} border rounded-full text-sm font-semibold`}>
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
    }
  };

  // Calculate totals
  const totalAmountReceived = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const totalAmountWithdrawn = 0; // No withdrawal functionality currently
  const currentBalance = totalAmountReceived - totalAmountWithdrawn;
  
  // Calculate percentage changes (mock for now, can be enhanced with historical data)
  const receivedChange = payments.length > 0 ? 11 : 0; // Mock percentage
  const withdrawnChange = 0; // Mock percentage

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#141414]' : 'bg-white'}`}
      style={isDarkMode ? { backgroundColor: '#141414' } : {}}
    >

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-5 sm:p-6 rounded-2xl shadow-2xl border-2 backdrop-blur-sm animate-fadeIn ${
            message.type === 'success'
              ? isDarkMode
                ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500/50 text-green-300'
                : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-800'
              : isDarkMode
                ? 'bg-gradient-to-r from-red-900/30 to-pink-900/30 border-red-500/50 text-red-300'
                : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300 text-red-800'
          }`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? 
                <CheckCircle className={`w-6 h-6 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} /> : 
                <AlertCircle className={`w-6 h-6 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              }
              <span className="font-bold text-base sm:text-lg">{message.text}</span>
            </div>
          </div>
        )}

        {/* Verification Status Banner - Persists across reloads */}
        {verificationStatus && (
          <div className={`mb-6 p-5 sm:p-6 rounded-2xl shadow-2xl border-2 backdrop-blur-sm animate-fadeIn ${
            verificationStatus.status === 'success'
              ? isDarkMode
                ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500/50 text-green-300'
                : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-800'
              : verificationStatus.status === 'checking'
              ? isDarkMode
                ? 'bg-gradient-to-r from-white/30 to-gray-300/30 border-white/50 text-white'
                : 'bg-gradient-to-r from-black/50 to-gray-700/50 border-black/50 text-black'
              : isDarkMode
                ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/50 text-yellow-300'
                : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 text-yellow-800'
          }`}>
            <div className="flex items-start gap-3">
              {verificationStatus.status === 'success' ? 
                <CheckCircle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} /> :
              verificationStatus.status === 'checking' ?
                <Clock className={`w-6 h-6 flex-shrink-0 mt-0.5 animate-spin ${isDarkMode ? 'text-white' : 'text-black'}`} /> :
                <AlertCircle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />}
              <div className="flex-1">
                <span className="font-bold text-base sm:text-lg block">{verificationStatus.message}</span>
                {verificationStatus.txRef && (
                  <span className={`text-xs mt-2 block ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Transaction: {verificationStatus.txRef}
                  </span>
                )}
                {verificationStatus.status === 'checking' && (
                  <span className="text-sm opacity-75 mt-1 block">Please wait while we verify with Chapa...</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Payment Page - Two Column Layout */}
        <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg`}>
          <div className="flex flex-col lg:flex-row">
            {/* Left Side - Course/Subscription Info */}
            <div className={`flex-1 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* Simple Payment Calendar */}
              <div className={`mb-6 p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                  <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Payment Information
                  </h3>
                </div>
                <div className="space-y-2 text-sm">
                  {(() => {
                    // Calculate remaining days
                    let deadline = null;
                    let label = '';
                    
                    if (companyData.paymentPeriodEnd && companyData.hasPaid) {
                      deadline = companyData.paymentPeriodEnd;
                      label = 'Period Ends';
                    } else if (companyData.paymentDeadline && !companyData.hasPaid) {
                      deadline = companyData.paymentDeadline;
                      label = 'Payment Deadline';
                    } else if (companyData.gracePeriodDeadline) {
                      deadline = companyData.gracePeriodDeadline;
                      label = 'Grace Period';
                    }
                    
                    let remainingDays = null;
                    if (deadline) {
                      const now = new Date();
                      const deadlineDate = new Date(deadline);
                      const diff = deadlineDate - now;
                      
                      if (diff <= 0) {
                        remainingDays = 0;
                      } else {
                        remainingDays = Math.floor(diff / (1000 * 60 * 60 * 24)); // Match CompanyCalendar calculation
                      }
                    }
                    
                    return (
                      <>
                        {deadline && (
                          <div className="flex justify-between items-center">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{label}:</span>
                            <div className="flex items-center gap-2">
                              <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{new Date(deadline).toLocaleDateString()}</span>
                              {remainingDays !== null && (
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  remainingDays <= 0 
                                    ? isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
                                    : remainingDays <= 7
                                    ? isDarkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700'
                                    : isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                                }`}>
                                  {remainingDays <= 0 ? 'Expired' : remainingDays === 1 ? '1 day left' : `${remainingDays} days left`}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {companyData.createdAt && (
                          <div className="flex justify-between">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Created:</span>
                            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{new Date(companyData.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className={`flex justify-between pt-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Status:</span>
                          <span className={`font-semibold ${
                            companyData.paymentMode === 'free' || companyData.hasPaid 
                              ? (isDarkMode ? 'text-green-400' : 'text-green-600') 
                              : (isDarkMode ? 'text-yellow-400' : 'text-yellow-600')
                          }`}>
                            {companyData.paymentMode === 'free' ? 'Paid' : (companyData.hasPaid ? 'Paid' : 'Pending')}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Course Title */}
              <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Subscription Plan - Complete Package ({companyData.userLimit} Users)
              </h2>

              {/* Details */}
              <div className="space-y-2 mb-6">
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Created by: {user?.name || 'Admin'}
                </p>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  {companyData.userLimit} seats available
                      </p>
                    </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'} flex items-center justify-center`}>
                    <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Lifetime Access to Subscription
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'} flex items-center justify-center`}>
                    <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Support and Assistance
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'} flex items-center justify-center`}>
                    <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Premium Features Included
                  </span>
                  </div>
                </div>

            </div>

            {/* Right Sidebar - Billing Summary */}
            <div className={`w-full lg:w-[500px] p-6 lg:p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} border-t lg:border-t-0 lg:border-l ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* Subscription Plans - 3 Cards (1 Month, 3 Months, 6 Months) */}
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-3">
                  {plans.map((plan) => {
                    const isSelected = selectedPlan?.id === plan.id && !selectedMonthlyPlan;
                    return (
                      <button
                        key={plan.id}
                        onClick={() => {
                          handlePlanSelect(plan);
                          setSelectedMonthlyPlan(null);
                        }}
                        className={`relative p-5 rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${
                          isSelected 
                            ? isDarkMode 
                              ? 'border-white bg-gradient-to-br from-white/50 to-gray-300/50 shadow-md'
                              : 'border-black bg-gradient-to-br from-black/50 to-gray-700/50 shadow-md'
                            : isDarkMode 
                            ? 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-750'
                            : 'border-gray-200 bg-white hover:border-black hover:bg-black/10'
                        }`}
                      >
                        {/* Discount Badge */}
                        {plan.discount && (
                          <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold shadow-lg ${
                            isDarkMode 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          }`}>
                            {plan.discount}% OFF
                          </div>
                        )}
                        
                        {/* Plan Duration */}
                        <div className={`text-xl font-bold mb-2 ${isSelected ? (isDarkMode ? 'text-white' : 'text-black') : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {plan.months === 1 ? '1' : plan.months === 3 ? '3' : '6'} Monthly
                        </div>
                        
                        {/* Price */}
                        <div className={`text-sm font-semibold ${isSelected ? (isDarkMode ? 'text-white' : 'text-black') : isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {paymentSettings.currency} {plan.price.toLocaleString()}
                        </div>
                        
                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="mt-3 flex items-center justify-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                              style={isDarkMode ? { backgroundColor: '#ffffff' } : { backgroundColor: '#000000' }}
                            >
                              <CheckCircle className={`w-4 h-4 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Billing Summary */}
              <div className="mb-6">
                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Billing Summary
                </h3>
                <div className="space-y-3 mb-4">
                        <div className="flex justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedMonthlyPlan 
                        ? `${paymentSettings.currency}${selectedMonthlyPlan.perMonth.toLocaleString()} x ${selectedMonthlyPlan.emis}`
                        : selectedPlan
                        ? `${paymentSettings.currency}${selectedPlan.price.toLocaleString()}`
                        : `${paymentSettings.currency}${basePrice.toLocaleString()}`
                      }
                    </span>
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {paymentSettings.currency} {calculateTotal().toLocaleString()}
                    </span>
                        </div>
                        <div className="flex justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Discount:</span>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      - {paymentSettings.currency} {calculateDiscount().toLocaleString()}
                    </span>
                        </div>
                  <div className="flex justify-between pt-3 border-t border-gray-300">
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Amount to be paid:
                    </span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {paymentSettings.currency} {calculateTotal().toLocaleString()}
                    </span>
                      </div>
                        </div>
                          </div>

              {/* First EMI Details */}
              {selectedMonthlyPlan && (
                <div className={`mb-6 p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {paymentSettings.currency} {selectedMonthlyPlan.perMonth.toLocaleString()}
                      </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedMonthlyPlan.emis} monthly EMIs
                    </div>
                  <div className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    To be Paid Now
                    </div>
                  </div>
                )}

              {/* Pay Button */}
              {(selectedPlan || selectedMonthlyPlan) && (
                    <button
                      onClick={handlePayWithChapa}
                      disabled={loading}
                  className={`w-full py-4 rounded-lg font-bold text-lg disabled:opacity-50 transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${isDarkMode ? 'bg-[#141414] hover:bg-gray-800 text-white border border-white' : 'bg-white hover:bg-gray-100 text-black border border-black'}`}
                  style={isDarkMode ? { backgroundColor: '#141414' } : {}}
                    >
                      {loading ? (
                        <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                      PAY {paymentSettings.currency} {calculateFirstEMI().toLocaleString()}
                        </>
                      )}
                    </button>
                  )}

              {/* Secure Checkout */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <Lock className="w-4 h-4 text-gray-500" />
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Secure Checkout
                </span>
                </div>
              </div>
          </div>
        </div>



        {/* Recent Transactions */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
          <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Transactions
            </h2>
          </div>

          <div className="p-6">
            {!Array.isArray(payments) || payments.length === 0 ? (
              <div className="text-center py-12">
                <div className={`inline-flex p-6 rounded-xl mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <DollarSign className={`w-12 h-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  No transactions yet
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Click the Subscribe button to make your first payment
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(payments) && payments.slice(0, 10).map((payment, index) => {
                  // Alternate between "Transferred to" and "Received from" for visual variety
                  // In reality, all payments are outgoing (transferred)
                  const isTransfer = index % 2 === 0;
                  const paymentDate = new Date(payment.paymentDate || payment.createdAt);
                  const formattedDate = paymentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                  
                  return (
                  <div
                    key={payment._id}
                      className={`flex items-center gap-4 p-4 rounded-lg ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      } transition-colors`}
                    >
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isTransfer 
                          ? isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
                          : isDarkMode ? 'bg-orange-900/50' : 'bg-orange-100'
                      }`}>
                        {isTransfer ? (
                          <ArrowDownRight className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                        ) : (
                          <ArrowUpRight className={`w-6 h-6 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                          )}
                        </div>

                      {/* Transaction Details */}
                      <div className="flex-1">
                        <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {isTransfer ? 'Transferred to' : 'Received from'} **** **** {payment._id.slice(-4).toUpperCase()}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formattedDate}
                        </p>
                    </div>

                      {/* Amount */}
                      <div className="text-right">
                        <p className={`font-semibold ${
                          isTransfer 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {isTransfer ? '+' : '-'}{payment.amount.toFixed(2)} {paymentSettings.currency}
                        </p>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* How It Works Modal */}
        {showInstructions && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowInstructions(false)}>
            <div className="bg-white border-2 border-black rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b-2 border-black sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-black">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-black">How It Works</h2>
                </div>
                <button onClick={() => setShowInstructions(false)} className="p-2 rounded-lg hover:bg-gray-100 border-2 border-black">
                  <X size={24} className="text-black" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="p-5 rounded-xl bg-gray-100 border-2 border-black">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-black">
                    <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">1</span>
                    Select Your Plan
                  </h3>
                  <p className="ml-10 text-black">
                    Choose from Monthly, Quarterly, or Yearly subscription plans. Yearly plans offer the best value with discounts.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-gray-100 border-2 border-black">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-black">
                    <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">2</span>
                    Pay Securely with Chapa
                  </h3>
                  <p className="ml-10 text-black">
                    Click "Pay with Chapa" to be redirected to Chapa's secure payment page. Complete your payment using your preferred method.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-gray-100 border-2 border-black">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-black">
                    <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">3</span>
                    Automatic Verification
                  </h3>
                  <p className="ml-10 text-black">
                    Once payment is successful, your subscription will be automatically verified and activated. No manual approval needed!
                  </p>
                </div>

                <button
                  onClick={() => setShowInstructions(false)}
                  className="w-full py-3 bg-black border-2 border-black text-white rounded-xl font-semibold hover:bg-gray-900 transition-all duration-200 shadow-lg"
                >
                  Got it, Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSubmission;