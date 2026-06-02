import React, { useEffect, useState } from 'react';
import { Check, Download, Filter, Pencil, X } from 'lucide-react';

import { buildEventMediaUrl } from '../api/camAPI';
import { camerasAPI, vehicleEventsAPI } from '../services/api';
import Loading from './Loading';
import { formatVehicleType, formatVietnamDateTime, VEHICLE_TYPES } from '../utils/format';
import {
  formatEventStatus,
  formatEventType,
  formatPercent,
  getEventTime,
  getPlateConfidence,
  getVehicleConfidence,
} from '../utils/vehicleEvent';

const vehicleTypeFilterAliases = {
  motorbike: ['motorbike', 'motorcycle', 'xm', '1'],
  car: ['car', 'oto', '2'],
  truck: ['truck', 'xt', 'xe-tai', '3'],
  container: ['container', 'xctn', 'xe-container', '4'],
};

const getVehicleTypeValue = (event) => event.vehicle_type_id ?? event.vehicle_type;

const matchesVehicleType = (event, vehicleType) => {
  if (!vehicleType) return true;

  const eventType = String(getVehicleTypeValue(event) || '').trim().toLowerCase();
  const aliases = vehicleTypeFilterAliases[vehicleType] || [vehicleType];
  return aliases.includes(eventType);
};

const isHistoryEvent = (event) => event.status !== 'PENDING';

const filterVehicleEvents = (events, params) => {
  const startDate = params.start_date ? new Date(params.start_date) : null;
  const endDate = params.end_date ? new Date(params.end_date) : null;
  const skip = Number(params.skip || 0);
  const limit = Number(params.limit || events.length);

  return events
    .filter((event) => {
      const eventTime = getEventTime(event);
      const eventDate = eventTime ? new Date(eventTime) : null;

      return (
        isHistoryEvent(event) &&
        (!params.camera_id || Number(event.camera_id) === Number(params.camera_id)) &&
        matchesVehicleType(event, params.vehicle_type) &&
        (!startDate || (eventDate && eventDate >= startDate)) &&
        (!endDate || (eventDate && eventDate <= endDate))
      );
    })
    .sort((a, b) => new Date(getEventTime(b) || 0) - new Date(getEventTime(a) || 0))
    .slice(skip, skip + limit);
};

const loadVehicleEvents = async (params) => {
  try {
    const response = await vehicleEventsAPI.list(params);
    const events = Array.isArray(response.data) ? response.data : response.data?.items || [];
    return filterVehicleEvents(events, params);
  } catch {
    const response = await vehicleEventsAPI.liveFeed();
    const approved = Array.isArray(response.data?.approved) ? response.data.approved : [];
    return filterVehicleEvents(approved, params);
  }
};

const HistoryImage = ({ src, alt, onPreview }) => {
  const imageUrl = buildEventMediaUrl(src);

  if (!imageUrl) {
    return <span className="text-sm text-gray-400">N/A</span>;
  }

  return (
    <button
      type="button"
      onClick={() => onPreview(imageUrl, alt)}
      className="border border-gray-200 rounded overflow-hidden bg-gray-50"
      style={{ width: 88, height: 56 }}
      title={alt}
    >
      <img src={imageUrl} alt={alt} className="w-full h-full object-cover" loading="lazy" />
    </button>
  );
};

const History = () => {
  const [vehicles, setVehicles] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingPlate, setEditingPlate] = useState('');
  const [savingPlate, setSavingPlate] = useState(false);
  const [plateEditError, setPlateEditError] = useState('');
  const [filters, setFilters] = useState({
    camera_id: '',
    vehicle_type: '',
    start_date: '',
    end_date: '',
    skip: 0,
    limit: '',
  });

  const loadCameras = async () => {
    try {
      const response = await camerasAPI.list();
      setCameras(response.data);
    } catch (error) {
      console.error('Failed to load cameras:', error);
    }
  };

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== ''),
      );
      const response = await loadVehicleEvents(params);
      setVehicles(response);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCameras();
    loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, skip: 0 }));
  };

  const startEditPlate = (vehicle) => {
    setEditingEventId(vehicle.id);
    setEditingPlate(vehicle.plate || '');
    setPlateEditError('');
  };

  const cancelEditPlate = () => {
    setEditingEventId(null);
    setEditingPlate('');
    setPlateEditError('');
  };

  const savePlate = async (vehicle) => {
    const nextPlate = editingPlate.trim().toUpperCase();

    if (!nextPlate) {
      setPlateEditError('Vui long nhap bien so');
      return;
    }

    try {
      setSavingPlate(true);
      setPlateEditError('');
      const response = await vehicleEventsAPI.update(vehicle.id, {
        plate: nextPlate,
        vehicle_type_id: vehicle.vehicle_type_id ?? null,
        status: vehicle.status ?? null,
      });
      const updatedVehicle = response.data || { ...vehicle, plate: nextPlate };

      setVehicles((current) =>
        current.map((item) =>
          item.id === vehicle.id
            ? { ...item, ...updatedVehicle, plate: updatedVehicle.plate ?? nextPlate }
            : item,
        ),
      );
      cancelEditPlate();
    } catch (error) {
      console.error('Failed to update plate:', error);
      setPlateEditError('Khong the cap nhat bien so');
    } finally {
      setSavingPlate(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      'ID',
      'Camera',
      'Anh xe',
      'Anh bien so',
      'Loai xe',
      'Bien so',
      'Thoi gian',
      'Huong',
      'Trang thai',
      'Do tin cay xe',
      'Do tin cay bien so',
    ];
    const rows = vehicles.map((vehicle) => [
      vehicle.id,
      vehicle.camera_id,
      buildEventMediaUrl(vehicle.image_path),
      buildEventMediaUrl(vehicle.plate_image_path),
      formatVehicleType(vehicle.vehicle_type_id ?? vehicle.vehicle_type),
      vehicle.plate || '',
      formatVietnamDateTime(getEventTime(vehicle)),
      formatEventType(vehicle.event_type || vehicle.direction),
      formatEventStatus(vehicle.status),
      getVehicleConfidence(vehicle),
      getPlateConfidence(vehicle),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vehicle_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Lịch sử phương tiện ra/vào</h1>
        <button
          type="button"
          onClick={exportCSV}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Xuất CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Bộ lọc</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <select
            value={filters.camera_id}
            onChange={(event) => handleFilterChange('camera_id', event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Tất cả camera</option>
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.name}
              </option>
            ))}
          </select>

          <select
            value={filters.vehicle_type}
            onChange={(event) => handleFilterChange('vehicle_type', event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Tất cả loại xe</option>
            {VEHICLE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={filters.start_date}
            onChange={(event) => handleFilterChange('start_date', event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="datetime-local"
            value={filters.end_date}
            onChange={(event) => handleFilterChange('end_date', event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />

          <button
            type="button"
            onClick={loadVehicles}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Áp dụng
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Camera</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ảnh xe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ảnh biển số</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại xe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biển số</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hướng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Độ tin cậy xe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Độ tin cậy biển số</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Camera {vehicle.camera_id || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <HistoryImage
                        src={vehicle.image_path}
                        alt={`Ảnh xe #${vehicle.id}`}
                        onPreview={(src, title) => setPreviewImage({ src, title })}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <HistoryImage
                        src={vehicle.plate_image_path}
                        alt={`Ảnh biển số #${vehicle.id}`}
                        onPreview={(src, title) => setPreviewImage({ src, title })}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {formatVehicleType(vehicle.vehicle_type_id ?? vehicle.vehicle_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                      {editingEventId === vehicle.id ? (
                        <div className="flex flex-col gap-1">
                          <input
                            value={editingPlate}
                            onChange={(event) => setEditingPlate(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                savePlate(vehicle);
                              }
                              if (event.key === 'Escape') {
                                cancelEditPlate();
                              }
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm font-semibold text-blue-600 min-w-[120px]"
                            placeholder="Nhập biển số"
                            autoFocus
                          />
                          {plateEditError && (
                            <span className="text-xs font-normal text-red-600">{plateEditError}</span>
                          )}
                        </div>
                      ) : (
                        vehicle.plate || 'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatVietnamDateTime(getEventTime(vehicle))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {formatEventType(vehicle.event_type || vehicle.direction)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatEventStatus(vehicle.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPercent(getVehicleConfidence(vehicle))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPercent(getPlateConfidence(vehicle))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingEventId === vehicle.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => savePlate(vehicle)}
                            disabled={savingPlate}
                            className="p-2 rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                            title="Lưu biển số"
                            aria-label="Lưu biển số"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditPlate}
                            disabled={savingPlate}
                            className="p-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                            title="Hủy sửa"
                            aria-label="Hủy sửa"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditPlate(vehicle)}
                          className="p-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                          title="Sửa biển số"
                          aria-label="Sửa biển số"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {previewImage && (
        <button
          className="image-preview-backdrop"
          type="button"
          onClick={() => setPreviewImage(null)}
        >
          <span className="image-preview-dialog">
            <img src={previewImage.src} alt={previewImage.title} />
            <span>{previewImage.title}</span>
          </span>
        </button>
      )}
    </div>
  );
};

export default History;
