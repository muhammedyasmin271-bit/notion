import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, CalendarDays, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const CompanyCalendar = ({ company }) => {
  const { isDarkMode } = useTheme();
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    // If company is in free mode, don't show any countdown
    if (company?.paymentMode === 'free') {
      setTimeRemaining(null);
      return;
    }
    
    // Determine which deadline to use based on company status
    let deadline = null;
    
    if (company?.paymentPeriodEnd && company?.hasPaid) {
      // If paid, show time until payment period ends
      deadline = company.paymentPeriodEnd;
    } else if (company?.paymentDeadline && !company?.hasPaid) {
      // If not paid, always show payment deadline (24h for paid plans)
      deadline = company.paymentDeadline;
    } else if (company?.gracePeriodDeadline) {
      // Only show grace period if payment deadline has passed
      deadline = company.gracePeriodDeadline;
    }
    
    if (!deadline) return;

    const updateTimer = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate - now;

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, passed: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, passed: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [company?.paymentDeadline, company?.gracePeriodDeadline, company?.paymentPeriodEnd, company?.hasPaid, company?.paymentMode]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get last payment date from payments array or company data
  const getLastPaymentDate = () => {
    if (company?.lastPaymentDate) {
      return company.lastPaymentDate;
    }
    if (!company?.payments || company.payments.length === 0) return null;
    const approvedPayments = company.payments
      .filter(p => p.status === 'approved')
      .sort((a, b) => new Date(b.createdAt || b.paymentDate) - new Date(a.createdAt || a.paymentDate));
    return approvedPayments.length > 0 ? (approvedPayments[0].createdAt || approvedPayments[0].paymentDate) : null;
  };

  const lastPaymentDate = getLastPaymentDate();
  const isWithin24Hours = timeRemaining && timeRemaining.days === 0 && !timeRemaining.passed;
  
  // Determine what deadline we're showing
  const getCurrentDeadline = () => {
    if (company?.hasPaid && company?.paymentPeriodEnd) {
      return { date: company.paymentPeriodEnd, label: 'Payment Period Ends' };
    } else if (company?.paymentDeadline && !company?.hasPaid) {
      if (company.selectedPlan === 'free_trial') {
        return { date: company.paymentDeadline, label: 'Free Trial Ends' };
      } else {
        return { date: company.paymentDeadline, label: 'Payment Deadline' };
      }
    } else if (company?.gracePeriodDeadline) {
      return { date: company.gracePeriodDeadline, label: 'Grace Period Ends' };
    }
    return null;
  };
  
  const currentDeadline = getCurrentDeadline();

  return (
    <div className={`p-5 sm:p-6 rounded-2xl border-2 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/60' 
        : 'bg-gradient-to-br from-white via-gray-50/50 to-white border-gray-200/80'
    } shadow-xl`}>
      <div className="flex items-center gap-3 mb-5">
        <div className={`p-3 rounded-xl ${
          isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
        }`}>
          <CalendarDays className={`w-6 h-6 ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`} />
        </div>
        <h3 className={`text-xl font-black ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Payment Timeline
        </h3>
      </div>

      <div className="space-y-4">
        {/* Company Created Date */}
        <div className={`p-4 rounded-xl ${
          isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <Calendar className={`w-5 h-5 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`} />
            <span className={`text-sm font-bold ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Company Created
            </span>
          </div>
          <p className={`text-base font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {formatDate(company?.createdAt)}
          </p>
        </div>

        {/* Last Payment Date */}
        {lastPaymentDate ? (
          <div className={`p-4 rounded-xl ${
            isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className={`w-5 h-5 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <span className={`text-sm font-bold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Last Payment
              </span>
            </div>
            <p className={`text-base font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {formatDate(lastPaymentDate)}
            </p>
          </div>
        ) : (
          <div className={`p-4 rounded-xl ${
            isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className={`w-5 h-5 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <span className={`text-sm font-bold ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Last Payment
              </span>
            </div>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
              No payments yet
            </p>
          </div>
        )}

        {/* Free Mode Display */}
        {company?.paymentMode === 'free' && (
          <div className={`p-5 sm:p-6 rounded-xl border-2 ${
            isDarkMode 
              ? 'bg-green-900/20 border-green-700/50' 
              : 'bg-green-50 border-green-300'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className={`w-6 h-6 sm:w-7 sm:h-7 text-green-500`} />
              <span className={`text-lg sm:text-xl font-black ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Company Status
              </span>
            </div>
            <div className="text-center">
              <p className={`text-5xl sm:text-6xl font-black mb-3 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                FREE
              </p>
              <p className={`text-base sm:text-lg font-bold mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                No Payment Required
              </p>
              <p className={`text-sm sm:text-base font-semibold ${
                isDarkMode ? 'text-green-300' : 'text-green-600'
              }`}>
                ✅ Company can operate without restrictions
              </p>
            </div>
          </div>
        )}

        {/* Time Remaining Display - Shows hours for unpaid paid plans, days for free trial/paid periods */}
        {company?.paymentMode !== 'free' && timeRemaining && !timeRemaining.passed && (
          <div className={`p-5 sm:p-6 rounded-xl border-2 ${
            timeRemaining.days === 0
              ? isDarkMode 
                ? 'bg-red-900/30 border-red-700/70' 
                : 'bg-red-100 border-red-400'
              : timeRemaining.days <= 3
              ? isDarkMode 
                ? 'bg-orange-900/30 border-orange-700/70' 
                : 'bg-orange-100 border-orange-400'
              : isDarkMode 
                ? 'bg-blue-900/20 border-blue-700/50' 
                : 'bg-blue-50 border-blue-300'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <Clock className={`w-6 h-6 sm:w-7 sm:h-7 ${
                timeRemaining.days === 0 
                  ? 'text-red-500' 
                  : timeRemaining.days <= 3
                  ? 'text-orange-500'
                  : 'text-blue-500'
              }`} />
              <span className={`text-lg sm:text-xl font-black ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {company?.hasPaid && company?.paymentPeriodEnd
                  ? 'Days Remaining Until Payment Period Ends'
                  : company?.selectedPlan === 'free_trial'
                  ? 'Days Remaining Until Free Trial Ends'
                  : company?.gracePeriodDeadline
                  ? 'Days Remaining Until Company Paused'
                  : 'Hours Remaining Until Payment Deadline'
                }
              </span>
            </div>
            <div className="text-center">
              {/* Show hours for unpaid paid plans (within 24 hours), days otherwise */}
              {!company?.hasPaid && company?.selectedPlan !== 'free_trial' && timeRemaining.days === 0 ? (
                <>
                  <p className={`text-5xl sm:text-6xl font-black mb-3 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {timeRemaining.hours}
                  </p>
                  <p className={`text-base sm:text-lg font-bold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {timeRemaining.hours === 1 ? 'Hour' : 'Hours'} Remaining
                  </p>
                  {timeRemaining.hours === 0 && (
                    <p className={`text-sm sm:text-base font-semibold ${
                      isDarkMode ? 'text-red-300' : 'text-red-600'
                    }`}>
                      ⚠️ Less than 1 hour remaining!
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className={`text-5xl sm:text-6xl font-black mb-3 ${
                    timeRemaining.days === 0 
                      ? isDarkMode ? 'text-red-400' : 'text-red-600'
                      : timeRemaining.days <= 3
                      ? isDarkMode ? 'text-orange-400' : 'text-orange-600'
                      : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {timeRemaining.days}
                  </p>
                  <p className={`text-base sm:text-lg font-bold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {timeRemaining.days === 1 ? 'Day' : 'Days'} Remaining
                  </p>
                  {timeRemaining.days === 0 && timeRemaining.hours > 0 && (
                    <p className={`text-sm sm:text-base font-semibold ${
                      isDarkMode ? 'text-red-300' : 'text-red-600'
                    }`}>
                      ⚠️ Only {timeRemaining.hours} {timeRemaining.hours === 1 ? 'hour' : 'hours'} left!
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Current Deadline */}
        {company?.paymentMode !== 'free' && currentDeadline && (
          <div className={`p-4 rounded-xl border-2 ${
            isWithin24Hours
              ? isDarkMode 
                ? 'bg-red-900/20 border-red-700/50' 
                : 'bg-red-50 border-red-300'
              : isDarkMode 
                ? 'bg-orange-900/20 border-orange-700/50' 
                : 'bg-orange-50 border-orange-300'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <Clock className={`w-5 h-5 ${
                isWithin24Hours 
                  ? 'text-red-500' 
                  : isDarkMode ? 'text-orange-400' : 'text-orange-600'
              }`} />
              <span className={`text-sm font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {currentDeadline.label}
              </span>
            </div>
            <p className={`text-base font-semibold mb-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {formatDate(currentDeadline.date)}
            </p>
            
            {timeRemaining && (
              <div className="mt-3 pt-3 border-t border-current/20">
                {timeRemaining.passed ? (
                  <div className={`text-center p-3 rounded-lg ${
                    isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
                  }`}>
                    <p className={`text-lg font-black ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      ⚠️ Deadline Passed
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {timeRemaining.days > 0 && (
                      <div className={`text-center p-2 rounded-lg ${
                        isDarkMode ? 'bg-gray-800' : 'bg-white'
                      }`}>
                        <p className={`text-2xl font-black ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {timeRemaining.days}
                        </p>
                        <p className={`text-xs font-semibold ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {timeRemaining.days === 1 ? 'Day' : 'Days'}
                        </p>
                      </div>
                    )}
                    {isWithin24Hours && (
                      <>
                        <div className={`text-center p-2 rounded-lg ${
                          isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                          <p className={`text-2xl font-black ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {timeRemaining.hours}
                          </p>
                          <p className={`text-xs font-semibold ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {timeRemaining.hours === 1 ? 'Hour' : 'Hours'}
                          </p>
                        </div>
                        <div className={`text-center p-2 rounded-lg ${
                          isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                          <p className={`text-2xl font-black ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {timeRemaining.minutes}
                          </p>
                          <p className={`text-xs font-semibold ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {timeRemaining.minutes === 1 ? 'Min' : 'Mins'}
                          </p>
                        </div>
                        <div className={`text-center p-2 rounded-lg ${
                          isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                          <p className={`text-2xl font-black ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {timeRemaining.seconds}
                          </p>
                          <p className={`text-xs font-semibold ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {timeRemaining.seconds === 1 ? 'Sec' : 'Secs'}
                          </p>
                        </div>
                      </>
                    )}
                    {!isWithin24Hours && timeRemaining.days > 0 && (
                      <div className={`text-center p-2 rounded-lg col-span-2 ${
                        isDarkMode ? 'bg-gray-800' : 'bg-white'
                      }`}>
                        <p className={`text-sm font-semibold ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Remaining
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyCalendar;

