import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getPointsStats } from '../../services/api';

const PointsChart = () => {
  const { isDarkMode } = useTheme();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPointsStats();
      
      // Check if points are blocked (company paused or points disabled)
      if (data?.isPointsBlocked) {
        setError('POINTS_BLOCKED'); // Special error code
        setLoading(false);
        return;
      }
      
      // Handle case where data structure is different than expected
      if (!data) {
        console.error('📊 No data received from API');
        throw new Error('No data received from server');
      }
      
      // monthlyData should always be an array (even if empty)
      if (!Array.isArray(data.monthlyData)) {
        console.error('📊 monthlyData is not an array:', typeof data.monthlyData, data.monthlyData);
        throw new Error('Invalid data format: monthlyData is not an array');
      }
      
      // Check if we have real data or just placeholder zeros
      const hasRealData = data.hasRealData === true && data.recordsFound > 0;
      
      const formattedData = data.monthlyData.map((month) => {
        // Backend returns 'totalPoints', map it to 'points' for the chart
        const points = month.totalPoints !== undefined ? month.totalPoints : (month.points || 0);
        
        return {
          month: month.monthName || month.month,
          monthKey: month.month, // Keep full month key for sorting
          monthName: month.monthName || month.month, // Add monthName for display
          points: points, // Sum of points gained in this month
        };
      });
      
      // Store metadata about whether we have real data
      setChartData(formattedData);
      
      // Log validation summary
      const totalPoints = formattedData.reduce((sum, d) => sum + d.points, 0);
      const isPlaceholder = !hasRealData || (totalPoints === 0 && data.recordsFound === 0);
      
      console.log('📊 Chart data validation:', {
        hasRealData,
        recordsFound: data.recordsFound,
        totalPointsInChart: totalPoints,
        isPlaceholder,
        message: isPlaceholder ? '⚠️ Showing placeholder data (zeros)' : '✅ Showing real data from database'
      });
    } catch (err) {
      console.error('Error loading points stats:', err);
      console.error('Error details:', err.message, err.response?.data);
      
      // Provide more detailed error message
      let errorMessage = 'Failed to load points data';
      if (err.response?.status === 403) {
        errorMessage = 'Access denied - Admin/Manager permissions required';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // If it's a permission error, still show the chart with sample data
      if (err.response?.status === 403) {
        console.log('📊 Permission denied, showing empty chart');
        setChartData([]); // This will trigger the empty chart display
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChartData();
    // Auto-refresh every 30 seconds to show new points as they're awarded
    const interval = setInterval(() => {
      loadChartData();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      const value = payload[0]?.value || 0;
      const isPositive = value >= 0;
      
      return (
        <div className={`p-4 rounded-lg border shadow-xl ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <p className="text-sm font-semibold mb-3 text-gray-500">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <div>
                <p className="text-xs text-gray-500 mb-1">{entry.name}</p>
                <p className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {value.toLocaleString()} points earned
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md border ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      } p-6`}>
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    // Special handling for blocked points
    if (error === 'POINTS_BLOCKED') {
      return (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md border ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        } p-6`}>
          <div className="text-center py-12">
            <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${
              isDarkMode ? 'text-orange-400' : 'text-orange-600'
            }`} />
            <h3 className={`text-xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Pointing is Blocked
            </h3>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            } mb-4`}>
              The points system is currently disabled for this company. 
              Contact your administrator to enable points.
            </p>
            <button
              onClick={loadChartData}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md border ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      } p-6`}>
        <div className="text-center py-8">
          <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'} mb-2`}>{error}</p>
          <button
            onClick={loadChartData}
            className={`mt-4 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show sample data if no real data exists (12 months)
  const displayData = chartData.length === 0 ? [
    { monthName: 'JAN 24', points: 0 },
    { monthName: 'FEB 24', points: 0 },
    { monthName: 'MAR 24', points: 0 },
    { monthName: 'APR 24', points: 0 },
    { monthName: 'MAY 24', points: 0 },
    { monthName: 'JUN 24', points: 0 },
    { monthName: 'JUL 24', points: 0 },
    { monthName: 'AUG 24', points: 0 },
    { monthName: 'SEP 24', points: 0 },
    { monthName: 'OCT 24', points: 0 },
    { monthName: 'NOV 24', points: 0 },
    { monthName: 'DEC 24', points: 0 }
  ] : chartData;

  if (chartData.length === 0) {
    return (
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md border ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      } p-4 sm:p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
            <div>
              <h3 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Company Points Overview
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                No data available - Complete projects to see statistics
              </p>
            </div>
          </div>
          <button
            onClick={loadChartData}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Chart - Show empty chart with sample data */}
        <div className="w-full overflow-x-auto" style={{ height: '500px' }}>
          <div style={{ minWidth: '1200px', height: '100%' }}>
            <ResponsiveContainer width="100%" height={500}>
              <LineChart
                data={displayData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <XAxis
                  dataKey="monthName"
                  stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                  tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
                />
                <YAxis
                  stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                  tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
                  domain={[0, 100]}
                  tickFormatter={(value) => value.toString()}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: '10px',
                    fontSize: '14px'
                  }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="points"
                  name="Points Earned This Month"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {error && (
          <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              Error: {error}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md border ${
      isDarkMode ? 'border-gray-700' : 'border-gray-200'
    } p-4 sm:p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
          <div>
            <h3 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Company Points Overview
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Scroll to view all months and see negative/positive points
            </p>
          </div>
        </div>
        <button
          onClick={loadChartData}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Chart - Scrollable */}
      <div className="w-full overflow-x-auto" style={{ height: '500px' }}>
        <div style={{ minWidth: `${Math.max(1200, chartData.length * 100)}px`, height: '100%' }}>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <XAxis
                dataKey="monthName"
                stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
              />
              <YAxis
                stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
                tickFormatter={(value) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  if (value <= -1000) return `${(value / 1000).toFixed(0)}K`;
                  return value.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  paddingTop: '10px',
                  fontSize: '14px'
                }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="points"
                name="Points Earned This Month"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PointsChart;

