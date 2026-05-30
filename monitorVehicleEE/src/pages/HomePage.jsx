import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Camera,
  Clock,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Video,
} from 'lucide-react';

import Alerts from '../components/Alerts';
import CameraPanel from '../components/CameraPanel';
import Dashboard from '../components/Dashboard';
import HistoryPage from '../components/History';
import LiveVideo from '../components/LiveVideo';
import SearchPage from '../components/Search';
import Statistics from '../components/Statistics';
import { formatVietnamTime } from '../utils/format';

const navItems = [
  { path: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/cameras', label: 'Quản lý camera', icon: Camera },
  { path: '/live', label: 'Giám sát trực tiếp', icon: Video },
  { path: '/alerts', label: 'Cảnh báo', icon: AlertTriangle },
  { path: '/history', label: 'Lịch sử phương tiện', icon: History },
  { path: '/search', label: 'Tra cứu biển số', icon: Search },
  { path: '/statistics', label: 'Thống kê', icon: BarChart3 },
];

const pageTitles = {
  '/dashboard': 'Trung tâm giám sát phương tiện',
  '/cameras': 'Quản lý camera',
  '/live': 'Giám sát trực tiếp',
  '/alerts': 'Quản lý cảnh báo',
  '/history': 'Lịch sử phương tiện ra/vào',
  '/search': 'Tra cứu biển số',
  '/statistics': 'Thống kê lưu lượng',
};

function HomePage() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('user');
  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (err) {
    console.error(err);
  }

  const userName = user?.username || user?.name || user?.email || 'Người dùng';

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="monitor-shell">
      <Sidebar userName={userName} onLogout={handleLogout} />
      <div className="monitor-workspace">
        <TopBar />
        <main className="monitor-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cameras" element={<CameraPanel />} />
            <Route path="/live" element={<LiveVideo />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function Sidebar({ userName, onLogout }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <aside className={`monitor-sidebar ${menuOpen ? 'nav-open' : ''}`}>
      <div className="brand-block">
        <div className="brand-mark">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1>VehicleOps</h1>
          <p>Factory Gate Security</p>
        </div>
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Mở menu"
          aria-expanded={menuOpen}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <nav className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-status">
        <div className="status-dot online" />
        <div className="sidebar-user">
          <strong>{userName}</strong>
          <span>Đã đăng nhập</span>
        </div>
        <button
          type="button"
          className="sidebar-logout"
          onClick={onLogout}
          aria-label="Đăng xuất"
          title="Đăng xuất"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

function TopBar() {
  const location = useLocation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="monitor-topbar">
      <div>
        <p className="topbar-kicker">TRẠM KIỂM SOÁT RA/VÀO</p>
        <h2>{pageTitles[location.pathname] || 'VehicleOps'}</h2>
      </div>
      <div className="topbar-actions">
        <div className="status-pill">
          <Clock className="w-4 h-4" />
          {formatVietnamTime(now)}
        </div>
        <div className="status-pill success">
          <span className="status-dot online" />
          Vận hành
        </div>
        <button className="icon-button" aria-label="Cảnh báo">
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

export default HomePage;
