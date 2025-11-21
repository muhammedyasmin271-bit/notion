import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DollarSign, Calendar, CheckCircle,
  XCircle, Clock, CreditCard, AlertCircle, X, Sparkles
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import CompanyCalendar from '../CompanyCalendar/CompanyCalendar';

const PaymentSubmission = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const [searchParams] = useSearchParams();
  const companyIdFromUrl = searchParams.get('company');
  const [payments, setPayments] = useState([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState({
    pricePerUserPerMonth: 1,
    currency: 'ETB'
  });
  const [companyData, setCompanyData] = useState({
    userLimit: 50,
    selectedPlan: 'one_month',
    createdAt: null,
    paymentDeadline: null,
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

  const [formData, setFormData] = useState({
    months: [],
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchPayments();
    fetchPaymentSettings();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'success') {
      showMessage('success', 'Payment completed successfully! Your payment is being verified.');
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchPayments();
    }
  }, [user]);

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
        paymentDeadline: companyResponseData.paymentDeadline || myCompanyData.paymentDeadline
      };
      
      console.log('Company data for calendar:', {
        createdAt: mergedCompanyData.createdAt,
        paymentDeadline: mergedCompanyData.paymentDeadline,
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
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      showMessage('error', 'Failed to load payment history');
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
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
    if (!selectedPlan) {
      showMessage('error', 'Please select a subscription plan');
      return;
    }

    let monthsToUse = formData.months;
    if (!monthsToUse || monthsToUse.length === 0) {
      const currentMonth = new Date().getMonth() + 1;
      const months = [];
      for (let i = 0; i < selectedPlan.months; i++) {
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
      const finalPrice = selectedPlan.price;

      const paymentPayload = {
        amount: finalPrice,
        months: monthsToUse,
        year: formData.year,
        planName: selectedPlan.name
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
        if (data.message && typeof data.message === 'object') {
          errorMessage = JSON.stringify(data.message);
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error?.message) {
          errorMessage = data.error.message;
        }
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
      
      if (error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('token')) {
        errorMessage = 'Authentication error. Please refresh the page and try again.';
      } else {
        errorMessage = error.message;
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
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-4 py-2 bg-green-100 border border-green-300 text-green-800 rounded-full text-sm font-semibold">
            <CheckCircle className="w-4 h-4" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-4 py-2 bg-red-100 border border-red-300 text-red-800 rounded-full text-sm font-semibold">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-4 py-2 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-full text-sm font-semibold">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      {/* Fixed Payment Button */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => {
            setShowSubmitForm(!showSubmitForm);
            if (showSubmitForm) resetForm();
          }}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-full font-bold shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${
            showSubmitForm
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
          }`}
        >
          {showSubmitForm ? (
            <>
              <X className="w-5 h-5" />
              <span className="hidden sm:inline">Close</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span className="hidden sm:inline">Subscribe</span>
              <span className="sm:hidden">Pay</span>
            </>
          )}
        </button>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className={`p-4 sm:p-5 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30' : 'bg-gradient-to-r from-blue-600 to-purple-600'} shadow-2xl backdrop-blur-sm`}>
              <DollarSign className={`w-10 h-10 sm:w-12 sm:h-12 ${isDarkMode ? 'text-blue-400' : 'text-white'}`} />
            </div>
            <div>
              <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black mb-2 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
              }`}>
                Payment Center
              </h1>
              <p className={`text-base sm:text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                Manage your subscription with secure payments
              </p>
            </div>
          </div>
        </div>

        {/* Company Calendar */}
        <div className="mb-8">
          <CompanyCalendar company={companyData} />
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-8 p-5 sm:p-6 rounded-2xl shadow-2xl border-2 backdrop-blur-sm animate-fadeIn ${
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

        {/* Subscription Plans Modal */}
        {showSubmitForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-fadeIn">
            <div className={`${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700' : 'bg-white'} rounded-3xl shadow-2xl border-2 w-full max-w-5xl max-h-[90vh] overflow-y-auto`}>
              <div className="p-6 sm:p-8 lg:p-10">
                <div className="text-center mb-8">
                  <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-4">
                    <div className={`p-3 sm:p-4 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30' : 'bg-gradient-to-r from-blue-600 to-purple-600'} shadow-xl`}>
                      <CreditCard className={`w-8 h-8 sm:w-10 sm:h-10 ${isDarkMode ? 'text-blue-400' : 'text-white'}`} />
                    </div>
                    <div>
                      <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-2 ${
                        isDarkMode 
                          ? 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' 
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
                      }`}>
                        Choose Your Plan
                      </h2>
                      <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Select the perfect subscription plan for your needs
                      </p>
                    </div>
                  </div>
                </div>

                {/* Plan Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
                  {plans.map((plan) => {
                    // Price is already calculated with discount in the plan object
                    const finalPrice = plan.price;
                    const isSelected = selectedPlan?.id === plan.id;
                    
                    // Calculate original price before discount for display
                    const originalPrice = plan.discount 
                      ? Math.round(plan.price / (1 - plan.discount / 100))
                      : plan.price;
                    
                    return (
                      <div
                        key={plan.id}
                        onClick={() => handlePlanSelect(plan)}
                        className={`relative p-5 sm:p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 ${
                          isSelected
                            ? isDarkMode
                              ? 'bg-gradient-to-br from-blue-600 to-purple-600 border-blue-400 text-white shadow-2xl scale-105 ring-4 ring-blue-500/30'
                              : 'bg-gradient-to-br from-blue-600 to-purple-600 border-transparent text-white shadow-2xl scale-105 ring-4 ring-blue-500/30'
                            : isDarkMode
                              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 text-gray-200 hover:border-blue-500/50 hover:shadow-xl'
                              : 'bg-white border-gray-200 text-gray-800 hover:border-blue-300 hover:shadow-xl'
                        }`}
                      >
                        {plan.discount && (
                          <div className={`absolute -top-3 -right-3 ${isDarkMode ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-red-500'} text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-lg z-10`}>
                            {plan.discount}% OFF
                          </div>
                        )}
                        <div className="text-center">
                          <h3 className={`text-lg sm:text-xl font-bold mb-3 ${isSelected ? 'text-white' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {plan.name}
                          </h3>
                          <div className="mb-4">
                            <div className={`text-3xl sm:text-4xl font-black mb-1 ${isSelected ? 'text-white' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {finalPrice.toLocaleString()}
                              <span className={`text-base sm:text-lg font-normal ml-1 ${isSelected ? 'text-blue-100' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {paymentSettings.currency}
                              </span>
                            </div>
                            {plan.discount && (
                              <div className={`text-xs sm:text-sm line-through mb-1 ${isSelected ? 'text-blue-200' : isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                {originalPrice.toLocaleString()} {paymentSettings.currency}
                              </div>
                            )}
                            <div className={`text-xs mt-2 px-3 py-1.5 rounded-lg inline-block ${
                              isSelected 
                                ? 'bg-white/20 text-blue-100' 
                                : isDarkMode 
                                  ? 'bg-gray-700/50 text-gray-400' 
                                  : 'bg-gray-100 text-gray-600'
                            }`}>
                              {companyData.userLimit} users × {paymentSettings.pricePerUserPerMonth} ETB × {plan.months} {plan.months === 1 ? 'month' : 'months'}
                              {plan.discount ? ` - ${plan.discount}%` : ''}
                            </div>
                            <div className={`text-sm mt-3 font-semibold ${isSelected ? 'text-blue-100' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {plan.months} {plan.months === 1 ? 'month' : 'months'} subscription
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex items-center justify-center gap-2 text-sm font-bold mt-4 pt-4 border-t border-white/20">
                              <CheckCircle className="w-5 h-5" />
                              Selected
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Plan Summary & Payment */}
                {selectedPlan && (
                  <div className={`${isDarkMode ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-2 border-blue-500/30' : 'bg-gradient-to-r from-blue-50 to-purple-50'} rounded-2xl p-5 sm:p-6 mb-6`}>
                    <h3 className={`text-lg sm:text-xl font-bold mb-4 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Payment Summary
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Plan:</span>
                          <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedPlan.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Duration:</span>
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{selectedPlan.months} {selectedPlan.months === 1 ? 'month' : 'months'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Period:</span>
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-800'}>{formData.months.map(m => 
                            new Date(2000, m - 1).toLocaleString('default', { month: 'short' })
                          ).join(', ')} {formData.year}</span>
                        </div>
                        {selectedPlan.discount && (
                          <div className={`flex justify-between ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                            <span>Discount:</span>
                            <span className="font-bold">-{selectedPlan.discount}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`border-t ${isDarkMode ? 'border-blue-500/30' : 'border-blue-200'} pt-4`}>
                      <div className={`flex justify-between items-center text-xl sm:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <span>Total:</span>
                        <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>
                          {selectedPlan.price.toLocaleString()} {paymentSettings.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {selectedPlan && (
                    <button
                      onClick={handlePayWithChapa}
                      disabled={loading}
                      className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-base sm:text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <>
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                          Pay with Chapa
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowSubmitForm(false);
                      resetForm();
                    }}
                    disabled={loading}
                    className={`px-6 sm:px-8 py-4 rounded-2xl font-bold hover:opacity-80 disabled:opacity-50 transition-all duration-300 active:scale-95 ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className={`${isDarkMode ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-2xl border-2 overflow-hidden`}>
          <div className={`${isDarkMode ? 'bg-gradient-to-r from-blue-600/80 to-purple-600/80 border-b border-gray-700' : 'bg-gradient-to-r from-blue-600 to-purple-600'} p-6 sm:p-8`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className={`p-3 sm:p-4 rounded-2xl ${isDarkMode ? 'bg-white/10 backdrop-blur-sm border border-white/20' : 'bg-white/20 backdrop-blur-sm'}`}>
                <Clock className={`w-7 h-7 sm:w-8 sm:h-8 ${isDarkMode ? 'text-blue-300' : 'text-white'}`} />
              </div>
              <div>
                <h2 className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-white'} mb-1`}>
                  Payment History
                </h2>
                <p className={`text-sm sm:text-base ${isDarkMode ? 'text-blue-200' : 'text-blue-100'}`}>
                  Track all your subscription payments
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {payments.length === 0 ? (
              <div className="text-center py-12 sm:py-20">
                <div className={`inline-flex p-6 sm:p-8 rounded-2xl mb-6 ${isDarkMode ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30' : 'bg-gradient-to-r from-blue-100 to-purple-100'} shadow-xl`}>
                  <DollarSign className={`w-16 h-16 sm:w-20 sm:h-20 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h3 className={`text-xl sm:text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  No payments yet
                </h3>
                <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Click the Subscribe button to make your first payment
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {payments.map((payment) => (
                  <div
                    key={payment._id}
                    className={`p-5 sm:p-6 rounded-2xl border-2 ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 hover:border-blue-500/50' 
                        : 'bg-gradient-to-r from-white to-gray-50 border-gray-200 hover:border-blue-300'
                    } hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                          <div className={`px-5 sm:px-6 py-3 sm:py-4 rounded-2xl ${isDarkMode ? 'bg-gradient-to-r from-blue-600/80 to-purple-600/80' : 'bg-gradient-to-r from-blue-600 to-purple-600'} shadow-lg`}>
                            <h3 className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-white'}`}>
                              {payment.amount.toFixed(2)} {paymentSettings.currency}
                            </h3>
                          </div>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className={`space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <div className="flex items-center gap-2">
                            <Calendar className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                              <span className="font-semibold">For:</span> {payment.period.months && payment.period.months.length > 0
                                ? payment.period.months.map(m => 
                                    new Date(2000, m - 1).toLocaleString('default', { month: 'short' })
                                  ).join(', ') + ' ' + payment.period.year
                                : 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`} />
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              <span className="font-semibold">Paid:</span> {new Date(payment.paymentDate).toLocaleDateString()}
                            </p>
                          </div>
                          {payment.paymentMethod === 'chapa' && (
                            <div className="flex items-center gap-2">
                              <CreditCard className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Paid via Chapa
                              </p>
                            </div>
                          )}
                        </div>
                        {payment.note && (
                          <div className={`mt-3 p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
                            <p className={`text-sm flex items-start gap-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                              <span><strong>Note:</strong> {payment.note}</span>
                            </p>
                          </div>
                        )}
                        {payment.rejectionReason && (
                          <div className={`mt-3 p-3 rounded-xl ${isDarkMode ? 'bg-red-900/20 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                            <p className={`text-sm flex items-start gap-2 font-medium ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                              <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                              <span><strong>Rejection Reason:</strong> {payment.rejectionReason}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`text-xs mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
                      <span className="font-semibold">Submitted:</span> {new Date(payment.createdAt).toLocaleString()}
                      {payment.verifiedAt && (
                        <span> • <span className="font-semibold">Verified:</span> {new Date(payment.verifiedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
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