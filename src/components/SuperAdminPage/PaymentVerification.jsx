import React, { useState, useEffect } from 'react';
import {
  DollarSign, CheckCircle, XCircle, Clock, Eye, Filter,
  Calendar, Building2, User, AlertCircle, FileText
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const PaymentVerification = () => {
  const { isDarkMode } = useTheme();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [verifyAction, setVerifyAction] = useState('approved');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, filterStatus]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:9000/api/payments/all?status=${filterStatus}`,
        { headers: { 'x-auth-token': token } }
      );
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      showMessage('error', 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    if (filterStatus === 'all') {
      setFilteredPayments(payments);
    } else {
      setFilteredPayments(payments.filter(p => p.status === filterStatus));
    }
  };

  const handleVerify = async () => {
    if (verifyAction === 'rejected' && !rejectionReason.trim()) {
      showMessage('error', 'Please provide a rejection reason');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:9000/api/payments/${selectedPayment._id}/verify`,
        {
          method: 'PUT',
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: verifyAction,
            rejectionReason: verifyAction === 'rejected' ? rejectionReason : undefined
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify payment');
      }

      showMessage('success', `Payment ${verifyAction} successfully`);
      setShowVerifyModal(false);
      setSelectedPayment(null);
      setRejectionReason('');
      fetchPayments();
    } catch (error) {
      console.error('Error verifying payment:', error);
      showMessage('error', error.message || 'Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const openVerifyModal = (payment, action) => {
    setSelectedPayment(payment);
    setVerifyAction(action);
    setRejectionReason('');
    setShowVerifyModal(true);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
    }
  };

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    approved: payments.filter(p => p.status === 'approved').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
    totalAmount: payments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0)
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-8 h-8 text-green-500" />
            <h1 className="text-3xl font-bold">Payment Verification</h1>
          </div>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Review and verify company payment submissions
          </p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500'
              : 'bg-red-500/20 text-red-400 border border-red-500'
          }`}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className={`p-4 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Submissions</div>
          </div>
          <div className={`p-4 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending</div>
          </div>
          <div className={`p-4 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Approved</div>
          </div>
          <div className={`p-4 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rejected</div>
          </div>
          <div className={`p-4 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="text-2xl font-bold text-green-400">${stats.totalAmount.toFixed(2)}</div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Approved</div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending Only</option>
              <option value="approved">Approved Only</option>
              <option value="rejected">Rejected Only</option>
            </select>
            <button
              onClick={fetchPayments}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Payments List */}
        <div className={`rounded-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-6">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  No payments found
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment._id}
                    className={`p-4 rounded-lg border ${
                      isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">${payment.amount.toFixed(2)}</h3>
                          {getStatusBadge(payment.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="w-4 h-4" />
                            <span>{payment.companyName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4" />
                            <span>{payment.submittedBy?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {payment.period.months && payment.period.months.length > 0
                                ? payment.period.months.map(m => 
                                    new Date(2000, m - 1).toLocaleString('default', { month: 'short' })
                                  ).join(', ') + ' ' + payment.period.year
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4" />
                            <span>{payment.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                          </div>
                        </div>

                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Payment Date: {new Date(payment.paymentDate).toLocaleDateString()}
                        </div>

                        {payment.note && (
                          <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <strong>Note:</strong> {payment.note}
                          </div>
                        )}

                        {payment.rejectionReason && (
                          <div className="mt-2 p-3 bg-red-500/20 border border-red-500 rounded-lg">
                            <p className="text-sm text-red-400 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span><strong>Rejection Reason:</strong> {payment.rejectionReason}</span>
                            </p>
                          </div>
                        )}

                        <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          Submitted: {new Date(payment.createdAt).toLocaleString()}
                          {payment.verifiedAt && (
                            <span> • Verified: {new Date(payment.verifiedAt).toLocaleString()} by {payment.verifiedBy?.name}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <a
                          href={`http://localhost:9000${payment.screenshotUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </a>

                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openVerifyModal(payment, 'approved')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => openVerifyModal(payment, 'rejected')}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verify Modal */}
      {showVerifyModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-lg p-6 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4">
              {verifyAction === 'approved' ? 'Approve Payment' : 'Reject Payment'}
            </h2>

            <div className="mb-4">
              <p><strong>Company:</strong> {selectedPayment.companyName}</p>
              <p><strong>Amount:</strong> ${selectedPayment.amount.toFixed(2)}</p>
              <p><strong>Period:</strong> {selectedPayment.period.months && selectedPayment.period.months.length > 0
                ? selectedPayment.period.months.map(m => 
                    new Date(2000, m - 1).toLocaleString('default', { month: 'short' })
                  ).join(', ') + ' ' + selectedPayment.period.year
                : 'N/A'}</p>
            </div>

            {verifyAction === 'rejected' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Explain why this payment is being rejected..."
                  required
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleVerify}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                  verifyAction === 'approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {loading ? 'Processing...' : `Confirm ${verifyAction === 'approved' ? 'Approval' : 'Rejection'}`}
              </button>
              <button
                onClick={() => setShowVerifyModal(false)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                } disabled:opacity-50 transition-colors`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVerification;

