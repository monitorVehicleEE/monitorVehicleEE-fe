import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Camera,
  Car,
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
import VehiclePanel from '../components/VehiclePanel';
import { alertsAPI } from '../api/api';
import { formatVietnamTime } from '../utils/format';

const navItems = [
  { path: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/cameras', label: 'Quản lý camera', icon: Camera, adminOnly: true },
  { path: '/vehicles', label: 'Quản lý phương tiện', icon: Car, adminOnly: true },
  { path: '/live', label: 'Giám sát trực tiếp', icon: Video },
  { path: '/alerts', label: 'Cảnh báo', icon: AlertTriangle },
  { path: '/history', label: 'Lịch sử phương tiện', icon: History },
  { path: '/search', label: 'Tra cứu biển số', icon: Search },
  { path: '/statistics', label: 'Thống kê', icon: BarChart3 },
];

const pageTitles = {
  '/dashboard': 'Trung tâm giám sát phương tiện',
  '/cameras': 'Quản lý camera',
  '/vehicles': 'Quản lý phương tiện',
  '/live': 'Giám sát trực tiếp',
  '/alerts': 'Quản lý cảnh báo',
  '/history': 'Lịch sử phương tiện ra/vào',
  '/search': 'Tra cứu biển số',
  '/statistics': 'Thống kê lưu lượng',
};

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = localStorage.getItem('user');
  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (err) {
    console.error(err);
  }

  const userName = user?.username || user?.name || user?.email || 'Người dùng';
  const isAdmin = Number(user?.role) === 1;
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);
  const [alertCount, setAlertCount] = useState(0);
  const restrictedPaths = new Set(['/cameras', '/vehicles']);
  const currentPath = !isAdmin && restrictedPaths.has(location.pathname)
    ? '/dashboard'
    : location.pathname;

  useEffect(() => {
    let mounted = true;

    const loadAlertCount = async () => {
      try {
        const response = await alertsAPI.list({ is_resolved: false });
        if (!mounted) return;
        const items = Array.isArray(response.data) ? response.data : [];
        setAlertCount(items.length);
      } catch (error) {
        if (mounted) {
          console.error('Failed to load alert count:', error);
        }
      }
    };

    loadAlertCount();
    const interval = setInterval(loadAlertCount, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="monitor-shell">
      <Sidebar
        userName={userName}
        onLogout={handleLogout}
        navItems={visibleNavItems}
        alertCount={alertCount}
      />
      <div className="monitor-workspace">
        <TopBar currentPath={currentPath} alertCount={alertCount} />
        <main className="monitor-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/cameras"
              element={isAdmin ? <CameraPanel /> : <Navigate to="/dashboard" replace />}
            />
            <Route
              path="/vehicles"
              element={isAdmin ? <VehiclePanel /> : <Navigate to="/dashboard" replace />}
            />
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

function Sidebar({ userName, onLogout, navItems, alertCount }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <aside className={`monitor-sidebar ${menuOpen ? 'nav-open' : ''}`}>
      <div className="brand-block">
        <div className="brand-mark">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1>NQ MOVEE</h1>
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
          const isAlertTab = item.path === '/alerts';

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''} ${isAlertTab && alertCount > 0 ? 'alert-flash' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {isAlertTab && alertCount > 0 && (
                <strong className="nav-badge">{alertCount}</strong>
              )}
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

function TopBar({ currentPath, alertCount }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="monitor-topbar">
      <div>
        <p className="topbar-kicker">TRẠM KIỂM SOÁT RA/VÀO</p>
        <h2>{pageTitles[currentPath] || 'NQ MOVEE'}</h2>
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
        <button className="icon-button alert-icon-button" aria-label="Cảnh báo">
          <Bell className="w-5 h-5" />
          {alertCount > 0 && <strong className="topbar-badge">{alertCount}</strong>}
        </button>
      </div>
    </header>
  );
}

export default HomePage;
