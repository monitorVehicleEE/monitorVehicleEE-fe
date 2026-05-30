import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Camera, Car, Server, TrendingUp } from 'lucide-react';
import { camerasAPI, statisticsAPI, vehiclesAPI } from '../services/api';
import { formatVehicleType, formatVietnamDateTime, getVehicleCount } from '../utils/format';
import {
  formatEventStatus,
  formatEventType,
  formatPercent,
  getEventTime,
  getPlateConfidence,
  getVehicleConfidence,
} from '../utils/vehicleEvent';
import LoadingCamera from "../components/LoadingCamera";

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [recentVehicles, setRecentVehicles] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const formatCameraStatus = (status) => {
    if (status === 1) return "Còn hoạt động";
    if (status === 10) return "Đã xóa";
    return "Không xác định";
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);



  const loadDashboardData = async () => {
    try {
      const [summaryRes, dailyRes, vehiclesRes, camerasRes] = await Promise.all([
        statisticsAPI.summary(),
        statisticsAPI.daily({ limit: 7 }),
        vehiclesAPI.list({ limit: 8 }),
        camerasAPI.list(),
      ]);
      setSummary(summaryRes.data);
      setDailyStats(dailyRes.data);
      setRecentVehicles(vehiclesRes.data);
      setCameras(camerasRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    
    return <LoadingCamera />;
  }

  return (
    <div className="ops-page">
      <section className="kpi-grid">
        <MetricCard
          icon={Car}
          label="Hôm nay"
          value={summary?.today || 0}
          hint="Lượt phương tiện"
          tone="blue"
        />
        <MetricCard
          icon={TrendingUp}
          label="Tuần này"
          value={summary?.this_week || 0}
          hint="Tổng lưu lượng"
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
          value={`${summary?.active_cameras || 0}/${summary?.total_cameras || 0}`}
          hint="Nguồn giám sát"
          tone="red"
        />
      </section>

      <section className="ops-grid">
        <div className="ops-panel span-2">
          <PanelHeader
            title="Lưu lượng 7 ngày"
            subtitle="Phân nhóm theo phạm vi phương tiện vận hành"
          />
          <div className="traffic-bars">
            {dailyStats.length > 0 ? (
              dailyStats.map((stat) => {
                const max = Math.max(
                  ...dailyStats.map((item) => item.total),
                  1,
                );
                return (
                  <div className="traffic-row" key={stat.date}>
                    <div className="traffic-date">{stat.date}</div>
                    <div className="traffic-track">
                      <div
                        className="traffic-fill"
                        style={{
                          width: `${Math.max(4, (stat.total / max) * 100)}%`,
                        }}
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
            <TypeBox
              label="Xe máy"
              value={sumType(dailyStats, ["motorbike", "motorcycle"])}
            />
            <TypeBox label="Ô tô con" value={sumType(dailyStats, ["car"])} />
            <TypeBox label="Xe tải" value={sumType(dailyStats, ["truck"])} />
            <TypeBox
              label="Xe container"
              value={sumType(dailyStats, ["container", "bus"])}
            />
          </div>
        </div>

        <div className="ops-panel">
          <PanelHeader
            title="Tình trạng camera"
            subtitle="Nguồn video đang cấu hình"
          />
          <div className="camera-list">
            {cameras.map((camera) => (
              <div className="camera-row" key={camera.id}>
                <div className="camera-icon">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <strong>{camera.name}</strong>
                  <span>{camera.location || "Chưa gán vị trí"}</span>
                </div>
                <em
                  className={camera.status === 1 ? "badge ok" : "badge muted"}
                >
                  {formatCameraStatus(camera.status)}
                </em>
              </div>
            ))}
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
                    <td>{vehicle.plate || "N/A"}</td>
                    <td>
                      <span className="badge info">
                        {formatVehicleType(vehicle.vehicle_type)}
                      </span>
                    </td>
                    <td>Camera {vehicle.camera_id || "N/A"}</td>
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

// eslint-disable-next-line no-unused-vars
const MetricCard = ({ icon: Icon, label, value, hint, tone }) => (
  <div className={`metric-card ${tone}`}>
    <div className="metric-icon"><Icon className="w-6 h-6" /></div>
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

// eslint-disable-next-line no-unused-vars
const ServiceRow = ({ icon: Icon, label, value }) => (
  <div className="service-row">
    <Icon className="w-5 h-5" />
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const EmptyState = ({ text }) => <div className="empty-state">{text}</div>;

function sumType(stats, keys) {
  return stats.reduce((total, stat) => total + getVehicleCount(stat.by_type, keys), 0);
}

export default Dashboard;
