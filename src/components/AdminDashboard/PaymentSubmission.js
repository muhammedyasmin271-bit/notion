import React, { useState, useEffect } from 'react';
import {
  DollarSign, Upload, FileText, Calendar, CheckCircle,
  XCircle, Clock, Image, Trash2, Eye, AlertCircle, X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';

const PaymentSubmission = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const [payments, setPayments] = useState([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({
    monthlyAmount: 1000,
    bankName: 'Commercial Bank of Ethiopia',
    accountName: 'Mela Note Services',
    accountNumber: '1000123456789',
    teleBirrPhone: '+251912345678',
    currency: 'ETB'
  });

  const [formData, setFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    note: '',
    months: [new Date().getMonth() + 1], // Changed to array
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchPayments();
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // First, get global payment settings (bank details, phone)
      const globalResponse = await fetch('http://localhost:9000/api/settings/payment', {
        headers: { 'x-auth-token': token }
      });
      const globalData = await globalResponse.json();
      
      // Then, get current user's company info to get company-specific pricing
      const userResponse = await fetch('http://localhost:9000/api/auth/me', {
        headers: { 'x-auth-token': token }
      });
      const userData = await userResponse.json();
      
      // Get company details
      const companyResponse = await fetch(`http://localhost:9000/api/admin/companies/${userData.companyId}`, {
        headers: { 'x-auth-token': token }
      });
      const companyData = await companyResponse.json();
      
      // Combine global settings with company-specific pricing
      setPaymentSettings({
        ...globalData,
        monthlyAmount: companyData.pricing?.monthlyAmount || globalData.monthlyAmount || 1000,
        currency: companyData.pricing?.currency || globalData.currency || 'ETB'
      });
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      // Use default settings if fetch fails
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

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'File size must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedImage) {
      showMessage('error', 'Please upload payment screenshot');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showMessage('error', 'Please enter a valid amount');
      return;
    }

    if (!formData.months || formData.months.length === 0) {
      showMessage('error', 'Please select at least one month');
      return;
    }

    console.log('📤 Submitting payment:', {
      amount: formData.amount,
      paymentDate: formData.paymentDate,
      months: formData.months,
      year: formData.year,
      note: formData.note
    });

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const submitData = new FormData();
      submitData.append('screenshot', selectedImage);
      submitData.append('amount', formData.amount);
      submitData.append('paymentDate', formData.paymentDate);
      submitData.append('paymentMethod', formData.paymentMethod);
      submitData.append('note', formData.note);
      submitData.append('months', JSON.stringify(formData.months)); // Send as JSON array
      submitData.append('year', formData.year);

      const response = await fetch('http://localhost:9000/api/payments/submit', {
        method: 'POST',
        headers: {
          'x-auth-token': token
        },
        body: submitData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit payment');
      }

      showMessage('success', 'Payment submitted successfully! Waiting for super admin approval.');
      setShowSubmitForm(false);
      resetForm();
      fetchPayments();
    } catch (error) {
      console.error('Error submitting payment:', error);
      showMessage('error', error.message || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      note: '',
      months: [new Date().getMonth() + 1],
      year: new Date().getFullYear()
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment submission?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:9000/api/payments/${paymentId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete payment');
      }

      showMessage('success', 'Payment deleted successfully');
      fetchPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      showMessage('error', error.message || 'Failed to delete payment');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 rounded-full text-sm font-semibold border border-green-500/30 shadow-sm">
            <CheckCircle className="w-4 h-4" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 rounded-full text-sm font-semibold border border-red-500/30 shadow-sm">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 rounded-full text-sm font-semibold border border-yellow-500/30 shadow-sm animate-pulse">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className={`min-h-screen p-4 md:p-6 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' : 'bg-gradient-to-br from-green-500 to-emerald-500'} shadow-lg`}>
                  <DollarSign className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-white'}`} />
                </div>
                <div>
                  <h1 className={`text-3xl md:text-4xl font-bold ${isDarkMode ? 'bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent' : 'text-gray-900'}`}>
                    Payment Submission
                  </h1>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Submit your monthly payment proof to the super admin
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowInstructions(true)}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg ${
                  isDarkMode ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                }`}
              >
                <FileText className="w-5 h-5" />
                How to Pay
              </button>
              <button
                onClick={() => setShowSubmitForm(!showSubmitForm)}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg ${
                  showSubmitForm
                    ? isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                    : isDarkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                }`}
              >
                {showSubmitForm ? (
                  <>
                    <XCircle className="w-5 h-5" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Submit Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>


        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl shadow-lg backdrop-blur-sm animate-bounce-in ${
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

        {/* Submit Form */}
        {showSubmitForm && (
          <div className={`mb-8 p-6 md:p-8 rounded-2xl border backdrop-blur-sm shadow-2xl ${
            isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200/50'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <FileText className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <h2 className="text-2xl font-bold">Submit New Payment</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Payment Date *</label>
                  <input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Payment For (Months) *</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className={`w-24 px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Year"
                    />
                  </div>
                  <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 p-4 rounded-lg border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    {[...Array(12)].map((_, i) => {
                      const monthNum = i + 1;
                      const isSelected = formData.months.includes(monthNum);
                      return (
                        <label
                          key={monthNum}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : isDarkMode
                                ? 'bg-gray-600 hover:bg-gray-500'
                                : 'bg-white hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newMonths = e.target.checked
                                ? [...formData.months, monthNum].sort((a, b) => a - b)
                                : formData.months.filter(m => m !== monthNum);
                              setFormData({ ...formData, months: newMonths });
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-medium">
                            {new Date(2000, i).toLocaleString('default', { month: 'short' })}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Select one or more months this payment is for
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Add any additional notes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Screenshot *</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleImageSelect}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
                {imagePreview && (
                  <div className={`mt-4 p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Preview:
                    </p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full h-64 object-contain rounded-lg border border-gray-600 mx-auto shadow-lg"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 md:flex-none px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Submit Payment
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitForm(false);
                    resetForm();
                  }}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 font-semibold ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Payment History */}
        <div className={`rounded-2xl border backdrop-blur-sm shadow-xl ${
          isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200/50'
        }`}>
          <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                <Clock className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <h2 className="text-2xl font-bold">Payment History</h2>
            </div>
          </div>

          <div className="p-6">
            {payments.length === 0 ? (
              <div className="text-center py-16">
                <div className={`inline-flex p-6 rounded-full mb-4 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <FileText className={`w-16 h-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  No payments yet
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Submit your first payment to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment._id}
                    className={`p-5 rounded-xl border transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
                      isDarkMode ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' : 'bg-gradient-to-r from-gray-50 to-white border-gray-200 hover:shadow-xl'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`px-4 py-2 rounded-xl ${isDarkMode ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
                            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                              ${payment.amount.toFixed(2)}
                            </h3>
                          </div>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              For: {payment.period.months && payment.period.months.length > 0
                                ? payment.period.months.map(m => 
                                    new Date(2000, m - 1).toLocaleString('default', { month: 'short' })
                                  ).join(', ') + ' ' + payment.period.year
                                : 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Paid: {new Date(payment.paymentDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {payment.note && (
                          <div className={`mt-3 p-3 rounded-lg ${isDarkMode ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
                            <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'} flex items-start gap-2`}>
                              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span><strong>Note:</strong> {payment.note}</span>
                            </p>
                          </div>
                        )}
                        {payment.rejectionReason && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/50 rounded-xl shadow-md">
                            <p className="text-sm text-red-400 flex items-start gap-2 font-medium">
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span><strong>Rejection Reason:</strong> {payment.rejectionReason}</span>
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`http://localhost:9000${payment.screenshotUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110"
                          title="View Screenshot"
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                        {payment.status === 'pending' && (
                          <button
                            onClick={() => handleDelete(payment._id)}
                            className="p-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Submitted: {new Date(payment.createdAt).toLocaleString()}
                      {payment.verifiedAt && (
                        <span> • Verified: {new Date(payment.verifiedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* How to Pay Modal */}
        {showInstructions && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowInstructions(false)}>
            <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
              <div className={`flex justify-between items-center p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} sticky top-0 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} z-10`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-green-500/20' : 'bg-green-500'}`}>
                    <DollarSign className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-white'}`} />
                  </div>
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>How to Pay</h2>
                </div>
                <button onClick={() => setShowInstructions(false)} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                  <X size={24} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Step 1 - Payment Methods */}
                <div className={`p-5 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold">1</span>
                    Choose Payment Method
                  </h3>
                  
                  <div className="space-y-4 ml-10">
                    {/* Bank Transfer */}
                    <div className={`p-4 rounded-lg border-2 ${isDarkMode ? 'border-blue-500/30 bg-blue-500/5' : 'border-blue-200 bg-blue-50'}`}>
                      <h4 className="font-semibold mb-2 text-blue-400">Option A: Bank Transfer</h4>
                      <div className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="flex justify-between py-1 border-b border-gray-600">
                          <span className="font-medium">Bank Name:</span>
                          <span className="font-bold">{paymentSettings.bankName}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-600">
                          <span className="font-medium">Account Name:</span>
                          <span className="font-bold">{paymentSettings.accountName}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="font-medium">Account Number:</span>
                          <span className="font-bold text-green-400">{paymentSettings.accountNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tele Birr */}
                    <div className={`p-4 rounded-lg border-2 ${isDarkMode ? 'border-purple-500/30 bg-purple-500/5' : 'border-purple-200 bg-purple-50'}`}>
                      <h4 className="font-semibold mb-2 text-purple-400">Option B: Tele Birr</h4>
                      <div className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="flex justify-between py-1 border-b border-gray-600">
                          <span className="font-medium">Account Name:</span>
                          <span className="font-bold">{paymentSettings.accountName}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="font-medium">Phone Number:</span>
                          <span className="font-bold text-blue-400">{paymentSettings.teleBirrPhone}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                      <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        <strong>Monthly Amount:</strong> {paymentSettings.monthlyAmount} {paymentSettings.currency}
                      </p>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        Reference: Use your company name
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`p-5 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center justify-center font-bold">2</span>
                    Take Screenshot
                  </h3>
                  <p className={`ml-10 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    After completing the bank transfer, take a clear screenshot of:
                  </p>
                  <ul className={`ml-10 mt-2 space-y-1 list-disc list-inside ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>Transaction receipt</li>
                    <li>Confirmation message</li>
                    <li>Or bank statement showing the payment</li>
                  </ul>
                </div>

                {/* Step 3 */}
                <div className={`p-5 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white flex items-center justify-center font-bold">3</span>
                    Submit Payment Proof
                  </h3>
                  <p className={`ml-10 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Click the <strong>"Submit Payment"</strong> button, fill in:
                  </p>
                  <ul className={`ml-10 mt-2 space-y-1 list-disc list-inside ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>Payment amount</li>
                    <li>Payment date</li>
                    <li>Months you're paying for</li>
                    <li>Upload your screenshot</li>
                  </ul>
                </div>

                {/* Step 4 */}
                <div className={`p-5 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white flex items-center justify-center font-bold">4</span>
                    Wait for Verification
                  </h3>
                  <p className={`ml-10 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Our super admin will verify your payment within <strong>24 hours</strong>. You'll see the status update in the Payment History section below.
                  </p>
                </div>

                {/* Important Notes */}
                <div className={`p-5 rounded-xl border-2 ${isDarkMode ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-yellow-50 border-yellow-300'}`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-6 h-6 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} flex-shrink-0`} />
                    <div className={`${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                      <h4 className="font-bold mb-2">Important Requirements:</h4>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        <li>Screenshot must be clear and readable</li>
                        <li>Must show transaction date and time</li>
                        <li>Must show exact amount paid</li>
                        <li>Must show bank/payment reference number</li>
                        <li>File size maximum: 5MB</li>
                        <li>Accepted formats: JPG, PNG, PDF</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Payment Warning */}
                <div className={`p-5 rounded-xl border-2 ${isDarkMode ? 'bg-red-500/10 border-red-500/50' : 'bg-red-50 border-red-300'}`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-6 h-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'} flex-shrink-0`} />
                    <div className={`${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                      <h4 className="font-bold mb-2 text-lg">⚠️ Payment Deadline Warning!</h4>
                      <div className="text-sm space-y-2">
                        <p className="font-semibold">
                          If you do not pay by the end of each month:
                        </p>
                        <ul className="space-y-1 list-disc list-inside ml-2">
                          <li><strong>After 5 days:</strong> Your company will be <span className="font-bold underline">PAUSED</span></li>
                          <li className="ml-6">→ No users can log in</li>
                          <li className="ml-6">→ All data is preserved</li>
                        </ul>
                        <ul className="space-y-1 list-disc list-inside ml-2 mt-2">
                          <li><strong>After another 5 days (10 days total):</strong> Your company and <span className="font-bold underline">ALL FILES WILL BE DELETED</span></li>
                          <li className="ml-6">→ Company permanently removed</li>
                          <li className="ml-6">→ All projects, documents, notes deleted</li>
                          <li className="ml-6">→ Cannot be recovered!</li>
                        </ul>
                        <p className="font-bold mt-3 text-base">
                          💡 Please pay on time to avoid service interruption!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowInstructions(false)}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
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

