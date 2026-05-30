import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    const token = localStorage.getItem('access_token');
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
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Vehicles API
export const vehiclesAPI = {
  list: (params) => api.get('/vehicles', { params }),
  get: (id) => api.get(`/vehicles/${id}`),
  getByPlate: (plate) => api.get(`/vehicles/plate/${plate}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  search: (plateNumber) => api.get(`/vehicles/plate/${plateNumber}`),
};

// Vehicle Types API
export const vehicleTypesAPI = {
  list: (params) => api.get('/vehicle-types', { params }),
  get: (id) => api.get(`/vehicle-types/${id}`),
  create: (data) => api.post('/vehicle-types', data),
};

// Cameras API
export const camerasAPI = {
  list: (params) => api.get('/cameras', { params }),
  get: (id) => api.get(`/cameras/${id}`),
  create: (data) => api.post('/cameras', data),
  update: (id, data) => api.put(`/cameras/${id}`, data),
};

const normalizeVehicleEventPayload = (data) => ({
  ...data,
  vehicle_confidence: data.vehicle_confidence ?? data.confidence,
  plate_confidence: data.plate_confidence ?? data.plate?.confidence,
});

// Vehicle Events API
export const vehicleEventsAPI = {
  getByPlate: (plate) => api.get(`/vehicle-events/plate/${plate}`),
  getLatestByPlate: (plate) => api.get(`/vehicle-events/plate/${plate}/latest`),
  getByCamera: (cameraId) => api.get(`/statistics/camera/${cameraId}`),
  getPending: () => api.get('/vehicle-events/pending'),
  approve: (id, data) => api.put(`/vehicle-events/${id}/approve`, data),
  reject: (id, data) => api.put(`/vehicle-events/${id}/reject`, data),
  create: (data) => api.post('/vehicle-events', normalizeVehicleEventPayload(data)),
};

// Vehicle Sessions API
export const vehicleSessionsAPI = {
  getOpen: (plate) => api.get(`/vehicle-sessions/open/${plate}`),
  create: (data) => api.post('/vehicle-sessions', data),
  close: (plate, data) => api.put(`/vehicle-sessions/${plate}/close`, data),
};

// Access Rules API
export const accessRulesAPI = {
  list: (params) => api.get('/access-rules', { params }),
  get: (id) => api.get(`/access-rules/${id}`),
  getByPlate: (plate) => api.get(`/access-rules/plate/${plate}`),
  create: (data) => api.post('/access-rules', data),
};

export const userAPI = {
  me: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
};

export const alertsAPI = {
  list: (params) => api.get('/alerts', { params }),
  get: (id) => api.get(`/alerts/${id}`),
  create: (data) => api.post('/alerts', data),
  resolve: (id, resolvedBy) => api.put(`/alerts/${id}/resolve`, null, { params: { resolved_by: resolvedBy } }),
  delete: (id) => api.delete(`/alerts/${id}`),
};

export const statisticsAPI = {
  daily: (params) => api.get('/statistics/daily', { params }),
  hourly: (params) => api.get('/statistics/hourly', { params }),
  byType: (params) => api.get('/statistics/by-type', { params }),
  camera: (cameraId, params) => api.get(`/statistics/camera/${cameraId}`, { params }),
  summary: () => api.get('/statistics/summary'),
};

export default api;
