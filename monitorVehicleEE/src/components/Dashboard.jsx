import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Calendar, Camera, Car, Server, TrendingUp } from 'lucide-react';

import { camerasAPI, statisticsAPI, vehicleEventsAPI } from '../services/api';
import { formatVehicleType, formatVietnamDateTime, getVehicleCount } from '../utils/format';
import {
  formatEventStatus,
  formatEventType,
  formatPercent,
  getEventTime,
  getPlateConfidence,
  getVehicleConfidence,
} from '../utils/vehicleEvent';
import Loading from './Loading';

const DASHBOARD_PERIODS = [
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'year', label: 'Năm này' },
];

const formatDateParam = (date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const getDashboardRange = (period) => {
  const end = new Date();
  const start = new Date(end);

  if (period === 'year') {
    start.setMonth(0, 1);
  } else if (period === 'month') {
    start.setDate(1);
  } else {
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
  }

  return {
    startDate: formatDateParam(start),
    endDate: formatDateParam(end),
  };
};

const Dashboard = () => {
  const [period, setPeriod] = useState('week');
  const [summary, setSummary] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [recentVehicles, setRecentVehicles] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const selectedRange = getDashboardRange(period);
  const periodLabel =
    DASHBOARD_PERIODS.find((item) => item.value === period)?.label || 'Tuần này';

  const loadDashboardData = async () => {
    try {
      const rangeParams = {
        start_date: selectedRange.startDate,
        end_date: selectedRange.endDate,
      };
      const historyParams = {
        start_date: `${selectedRange.startDate}T00:00:00`,
        end_date: `${selectedRange.endDate}T23:59:59`,
        limit: 8,
      };
      const [summaryRes, dailyRes, vehiclesRes, camerasRes] = await Promise.all([
        statisticsAPI.summary(rangeParams),
        statisticsAPI.daily({
          ...rangeParams,
          group_by: period === 'year' ? 'month' : 'day',
        }),
        vehicleEventsAPI.list(historyParams),
        camerasAPI.list(),
      ]);
      const activeCameras = Array.isArray(camerasRes.data)
        ? camerasRes.data.filter((camera) => camera.status === 1)
        : [];

      setSummary(summaryRes.data);
      setDailyStats(dailyRes.data);
      setRecentVehicles(vehiclesRes.data);
      setCameras(activeCameras);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="ops-page">
      <section className="dashboard-filter">
        <div>
          <Calendar className="w-5 h-5" />
          <span>{selectedRange.startDate} - {selectedRange.endDate}</span>
        </div>
        <div className="segmented-control">
          {DASHBOARD_PERIODS.map((item) => (
            <button
              key={item.value}
              className={period === item.value ? 'active' : ''}
              type="button"
              onClick={() => setPeriod(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="kpi-grid">
        <MetricCard
          icon={TrendingUp}
          label="Hôm nay"
          value={summary?.today || 0}
          hint="Tổng lưu lượng"
          tone="blue"
        />
        <MetricCard
          icon={Car}
          label="Tuần này"
          value={summary?.this_week || 0}
          hint="Tính từ thứ hai"
          tone="green"
        />
        <MetricCard
          icon={Activity}
          label="Tháng này"
          value={summary?.this_month || 0}
          hint="Theo giờ Việt Nam"
          tone="amber"
        />
        <MetricCard
          icon={Camera}
          label="Camera hoạt động"
          value={cameras.length}
          hint="Không tính camera đã xóa"
          tone="red"
        />
      </section>

      <section className="ops-grid">
        <div className="ops-panel span-2">
          <PanelHeader
            title={`Lưu lượng ${periodLabel.toLowerCase()}`}
            subtitle="Phân nhóm theo phạm vi phương tiện vận hành"
          />
          <div className="traffic-bars">
            {dailyStats.length > 0 ? (
              dailyStats.map((stat) => {
                const max = Math.max(...dailyStats.map((item) => item.total), 1);
                return (
                  <div className="traffic-row" key={stat.date}>
                    <div className="traffic-date">{stat.date}</div>
                    <div className="traffic-track">
                      <div
                        className="traffic-fill"
                        style={{ width: `${Math.max(4, (stat.total / max) * 100)}%` }}
                      />
                    </div>
                    <div className="traffic-total">{stat.total}</div>
                  </div>
                );
              })
            ) : (
              <EmptyState text="Chưa có dữ liệu lưu lượng" />
            )}
          </div>
          <div className="type-summary">
            <TypeBox label="Xe máy" value={sumType(dailyStats, ['motorbike'])} />
            <TypeBox label="Ô tô con" value={sumType(dailyStats, ['car'])} />
            <TypeBox label="Xe tải" value={sumType(dailyStats, ['truck'])} />
            <TypeBox label="Xe container" value={sumType(dailyStats, ['container'])} />
          </div>
        </div>

        <div className="ops-panel">
          <PanelHeader
            title="Tình trạng camera"
            subtitle="Chỉ hiển thị nguồn video còn hoạt động"
          />
          <div className="camera-list">
            {cameras.length > 0 ? (
              cameras.map((camera) => (
                <div className="camera-row" key={camera.id}>
                  <div className="camera-icon">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <strong>{camera.name}</strong>
                    <span>{camera.location || 'Chưa gán vị trí'}</span>
                  </div>
                  <em className="badge ok">Còn hoạt động</em>
                </div>
              ))
            ) : (
              <EmptyState text="Không có camera hoạt động" />
            )}
          </div>
        </div>

        <div className="ops-panel span-2">
          <PanelHeader
            title="Phương tiện gần đây"
            subtitle="Bản ghi mới nhất từ AI service"
          />
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Biển số</th>
                  <th>Loại xe</th>
                  <th>Camera</th>
                  <th>Hướng</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                  <th>Độ tin cậy xe</th>
                  <th>Độ tin cậy biển số</th>
                </tr>
              </thead>
              <tbody>
                {recentVehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>#{vehicle.id}</td>
                    <td>{vehicle.plate || 'N/A'}</td>
                    <td>
                      <span className="badge info">
                        {formatVehicleType(vehicle.vehicle_type_id ?? vehicle.vehicle_type)}
                      </span>
                    </td>
                    <td>Camera {vehicle.camera_id || 'N/A'}</td>
                    <td>{formatEventType(vehicle.event_type)}</td>
                    <td>{formatEventStatus(vehicle.status)}</td>
                    <td>{formatVietnamDateTime(getEventTime(vehicle))}</td>
                    <td>{formatPercent(getVehicleConfidence(vehicle))}</td>
                    <td>{formatPercent(getPlateConfidence(vehicle))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ops-panel system-panel">
          <PanelHeader
            title="Trạng thái dịch vụ"
            subtitle="Các khối xử lý chính"
          />
          <ServiceRow icon={Server} label="Backend API" value="Online" />
          <ServiceRow icon={Activity} label="AI Processor" value="Streaming" />
          <ServiceRow icon={AlertTriangle} label="Cảnh báo" value="Sẵn sàng" />
        </div>
      </section>
    </div>
  );
};

const MetricCard = ({ icon, label, value, hint, tone }) => (
  <div className={`metric-card ${tone}`}>
    <div className="metric-icon">
      {React.createElement(icon, { className: 'w-6 h-6' })}
    </div>
    <div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{hint}</span>
    </div>
  </div>
);

const PanelHeader = ({ title, subtitle }) => (
  <div className="panel-header">
    <div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  </div>
);

const TypeBox = ({ label, value }) => (
  <div className="type-box">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const ServiceRow = ({ icon, label, value }) => (
  <div className="service-row">
    {React.createElement(icon, { className: 'w-5 h-5' })}
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const EmptyState = ({ text }) => <div className="empty-state">{text}</div>;

function sumType(stats, keys) {
  return stats.reduce((total, stat) => total + getVehicleCount(stat.by_type, keys), 0);
}

export default Dashboard;
