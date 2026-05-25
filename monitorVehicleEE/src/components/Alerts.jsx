import React, { useState, useEffect } from 'react';
import { alertsAPI } from '../services/api';
import websocketService from '../services/websocket';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unresolved, resolved
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
    connectWebSocket();

    return () => {
      websocketService.disconnect('alerts');
    };
  }, [filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === 'unresolved') params.is_resolved = false;
      if (filter === 'resolved') params.is_resolved = true;

      const response = await alertsAPI.list(params);
      setAlerts(response.data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    websocketService.connect(
      'alerts',
      (message) => {
        if (message.type === 'alert') {
          // Play sound notification
          playNotificationSound();
          // Add new alert to list
          setAlerts(prev => [message.data, ...prev]);
        }
      }
    );
  };

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(err => console.log('Audio play failed:', err));
  };

  const handleResolve = async (alertId) => {
    try {
      await alertsAPI.resolve(alertId, 'user');
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, is_resolved: true } : alert
      ));
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleDelete = async (alertId) => {
    if (!confirm('Bạn có chắc muốn xóa cảnh báo này?')) return;

    try {
      await alertsAPI.delete(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-6 h-6" />;
      case 'medium':
        return <Clock className="w-6 h-6" />;
      default:
        return <AlertTriangle className="w-6 h-6" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Cảnh báo realtime</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('unresolved')}
            className={`px-4 py-2 rounded-lg ${filter === 'unresolved' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Chưa xử lý
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-lg ${filter === 'resolved' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Đã xử lý
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Đang tải...</div>
      ) : (
        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map(alert => (
              <div
                key={alert.id}
                className={`bg-white rounded-lg shadow border-l-4 p-6 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${getSeverityColor(alert.severity)}`}>
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold capitalize">{alert.alert_type}</h3>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        {alert.is_resolved && (
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Đã xử lý
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-3">{alert.message}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Camera {alert.camera_id}</span>
                        <span>•</span>
                        <span>{new Date(alert.timestamp).toLocaleString('vi-VN')}</span>
                        {alert.vehicle_id && (
                          <>
                            <span>•</span>
                            <span>Vehicle ID: {alert.vehicle_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!alert.is_resolved && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Xử lý
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">Không có cảnh báo</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Alerts;
