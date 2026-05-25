import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Clock,
  History,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Video,
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import LiveVideo from './components/LiveVideo';
import Statistics from './components/Statistics';
import SearchPage from './components/Search';
import HistoryPage from './components/History';
import Alerts from './components/Alerts';
import { formatVietnamTime } from './utils/format';
import CameraPanel from './components/CameraPanel'

const navItems = [
  { path: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/live', label: 'Giám sát trực tiếp', icon: Video },
  { path: '/alerts', label: 'Cảnh báo', icon: AlertTriangle },
  { path: '/history', label: 'Lịch sử phương tiện', icon: History },
  { path: '/search', label: 'Tra cứu biển số', icon: Search },
  { path: '/statistics', label: 'Thống kê', icon: BarChart3 },
];

const pageTitles = {
  '/': 'Trung tâm giám sát phương tiện',
  '/live': 'Giám sát camera trực tiếp',
  '/alerts': 'Quản lý cảnh báo',
  '/history': 'Lịch sử phương tiện ra/vào',
  '/search': 'Tra cứu biển số',
  '/statistics': 'Thống kê lưu lượng',
};

function App() {
  return (
    <Router>
      <div className="monitor-shell">
        <Sidebar />
        <div className="monitor-workspace">
          <TopBar />
          <main className="monitor-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/live" element={<CameraPanel />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/alerts" element={<Alerts />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="monitor-sidebar">
      <div className="brand-block">
        <div className="brand-mark">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1>VehicleOps</h1>
          <p>Factory Gate Security</p>
        </div>
      </div>

      <nav className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link key={item.path} to={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-status">
        <div className="status-dot online" />
        <div>
          <strong>Hệ thống online</strong>
          <span>AI stream</span>
        </div>
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

export default App;
