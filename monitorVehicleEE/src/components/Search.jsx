import React, { useState } from 'react';
import { buildEventMediaUrl } from '../api/camAPI';
import { vehicleEventsAPI } from '../services/api';
import { Search as SearchIcon, X } from 'lucide-react';
import { formatVehicleType, formatVietnamDateTime } from '../utils/format';
import Loading from './Loading';
import {
  formatEventStatus,
  formatEventType,
  formatPercent,
  getEventTime,
  getPlateConfidence,
  getVehicleConfidence,
} from '../utils/vehicleEvent';

const normalizePlate = (value) => value.trim().toUpperCase().replace(/[\s.-]/g, '');

const getResultPlate = (result) => result.plate?.plate_number || result.plate || 'N/A';

const getResultVehicleType = (result) => {
  return result.vehicle?.vehicle_type_id ??
    result.vehicle?.vehicle_type ??
    result.vehicle_type_id ??
    result.vehicle_type;
};

const getResultEventType = (result) => {
  return result.vehicle?.event_type || result.event_type || result.vehicle?.direction;
};

const SearchImage = ({ src, alt, onPreview }) => {
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

const Search = () => {
  const [plateNumber, setPlateNumber] = useState('');
  const [statusFilter, setStatusFilter] = useState('history');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!plateNumber.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await vehicleEventsAPI.getByPlate(normalizePlate(plateNumber));
      const events = Array.isArray(response.data) ? response.data : [response.data].filter(Boolean);
      setResults(
        events
          .filter((event) => statusFilter === 'all' || event.status !== 'PENDING')
          .sort((a, b) => new Date(getEventTime(b) || 0) - new Date(getEventTime(a) || 0))
      );
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setPlateNumber('');
    setResults([]);
    setSearched(false);
    setPreviewImage(null);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Tra cứu biển số xe</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="Nhập biển số xe (VD: 29A12345, 30B-67890)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg"
          >
            <option value="history">Chỉ xe đã duyệt</option>
            <option value="all">Tất cả trạng thái</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 flex items-center gap-2"
          >
            <SearchIcon className="w-5 h-5" />
            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
          </button>
          {searched && (
            <button
              type="button"
              onClick={clearSearch}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Xóa
            </button>
          )}
        </form>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-xl">Đang tìm kiếm...</div>
        </div>
      ) : searched ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">
              Kết quả tìm kiếm: {results.length} bản ghi
            </h2>
          </div>
          {results.length > 0 ? (
            <div className="overflow-x-auto" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biển số</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ảnh xe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ảnh biển số</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại xe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Camera</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hướng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Độ tin cậy</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr key={result.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-blue-600">
                          {getResultPlate(result)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <SearchImage
                          src={result.image_path || result.vehicle?.image_path}
                          alt={`Ảnh xe #${result.id || index + 1}`}
                          onPreview={(src, title) => setPreviewImage({ src, title })}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <SearchImage
                          src={result.plate_image_path || result.vehicle?.plate_image_path}
                          alt={`Ảnh biển số #${result.id || index + 1}`}
                          onPreview={(src, title) => setPreviewImage({ src, title })}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {formatVehicleType(getResultVehicleType(result))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Camera {result.vehicle?.camera_id || result.camera_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatVietnamDateTime(getEventTime(result.vehicle || result))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          getResultEventType(result) === 'IN' ? 'bg-green-100 text-green-800' :
                          getResultEventType(result) === 'OUT' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {formatEventType(getResultEventType(result))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatEventStatus(result.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPercent(getPlateConfidence(result) ?? getVehicleConfidence(result.vehicle || result))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">Không tìm thấy kết quả</p>
              <p className="mt-2">Thử tìm kiếm với biển số khác hoặc đổi bộ lọc trạng thái</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">Nhập biển số xe để tìm kiếm</p>
        </div>
      )}

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

export default Search;
