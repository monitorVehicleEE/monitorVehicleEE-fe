import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Vehicles API
export const vehiclesAPI = {
  list: (params) => api.get('/vehicles', { params }),
  get: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  search: (plateNumber, params) => api.get('/vehicles/search/plate', { params: { plate_number: plateNumber, ...params } }),
};

// Cameras API
export const camerasAPI = {
  list: (params) => api.get('/cameras', { params }),
  get: (id) => api.get(`/cameras/${id}`),
  create: (data) => api.post('/cameras', data),
  update: (id, data) => api.put(`/cameras/${id}`, data),
  delete: (id) => api.delete(`/cameras/${id}`),
  updateStatus: (id, status) => api.put(`/cameras/${id}/status`, null, { params: { status } }),
};

// Plates API
export const platesAPI = {
  list: (params) => api.get('/plates', { params }),
  get: (id) => api.get(`/plates/${id}`),
  checkBlacklist: (plateNumber) => api.get(`/plates/blacklist/${plateNumber}`),
  listBlacklist: (params) => api.get('/plates/blacklist', { params }),
  addToBlacklist: (data) => api.post('/plates/blacklist', data),
  removeFromBlacklist: (id) => api.delete(`/plates/blacklist/${id}`),
};

// Alerts API
export const alertsAPI = {
  list: (params) => api.get('/alerts', { params }),
  get: (id) => api.get(`/alerts/${id}`),
  create: (data) => api.post('/alerts', data),
  resolve: (id, resolvedBy) => api.put(`/alerts/${id}/resolve`, null, { params: { resolved_by: resolvedBy } }),
  delete: (id) => api.delete(`/alerts/${id}`),
};

// Statistics API
export const statisticsAPI = {
  daily: (params) => api.get('/statistics/daily', { params }),
  hourly: (params) => api.get('/statistics/hourly', { params }),
  byType: (params) => api.get('/statistics/by-type', { params }),
  camera: (cameraId, params) => api.get(`/statistics/camera/${cameraId}`, { params }),
  summary: () => api.get('/statistics/summary'),
};

export default api;
