import React, { useCallback, useEffect, useState } from 'react';
import { statisticsAPI } from '../services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';
import { formatVehicleType, getVietnamDateString } from '../utils/format';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Statistics = () => {
  const [dailyStats, setDailyStats] = useState([]);
  const [hourlyStats, setHourlyStats] = useState([]);
  const [typeStats, setTypeStats] = useState([]);
  const [startDate, setStartDate] = useState(getVietnamDateString(-7));
  const [endDate, setEndDate] = useState(getVietnamDateString(0));
  const [loading, setLoading] = useState(true);

  const loadStatistics = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const [dailyRes, hourlyRes, typeRes] = await Promise.all([
        statisticsAPI.daily({ start_date: startDate, end_date: endDate }),
        statisticsAPI.hourly({ target_date: endDate }),
        statisticsAPI.byType({ start_date: startDate, end_date: endDate })
      ]);

      setDailyStats(dailyRes.data);
      setHourlyStats(hourlyRes.data);
      setTypeStats(typeRes.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadStatistics();

    const interval = setInterval(() => {
      loadStatistics({ showLoading: false });
    }, 5000);

    return () => clearInterval(interval);
  }, [loadStatistics]);

  if (loading) {
    return <div className="p-6">Đang tải thống kê...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Thống kê</h1>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <label className="text-sm font-medium">Từ ngày:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Đến ngày:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            onClick={loadStatistics}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Cập nhật
          </button>
        </div>
      </div>

      {/* Daily Statistics Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Thống kê theo ngày</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#8884d8" name="Tổng số xe" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly Statistics Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Thống kê theo giờ (ngày {endDate})</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" label={{ value: 'Giờ', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Số lượng xe', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#82ca9d" name="Số xe" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Vehicle Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Phân bố theo loại xe</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeStats}
                dataKey="count"
                nameKey="vehicle_type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${formatVehicleType(entry.vehicle_type_id ?? entry.vehicle_type)}: ${entry.count}`}
              >
                {typeStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Chi tiết theo loại xe</h2>
          <div className="space-y-3">
            {typeStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium">{formatVehicleType(stat.vehicle_type_id ?? stat.vehicle_type)}</span>
                </div>
                <span className="text-2xl font-bold">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
