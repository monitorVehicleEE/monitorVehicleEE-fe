import axios from "axios";

const API_URL = import.meta.env.VITE_STREAM_API_URL || "http://localhost:8001";

export const getCameraStatus = async (camId) => {
  const res = await axios.get(`${API_URL}/camera-status/${camId}`);

  return res.data;
};

export const startCamera = async (camId) => {
  const res = await axios.post(`${API_URL}/start-stream/${camId}`);

  return res.data;
};

export const stopCamera = async (camId) => {
  const res = await axios.post(`${API_URL}/stop-stream/${camId}`);

  return res.data;
};

export const buildCameraStreamUrl = (camId, width = 480) => {
  return `${API_URL}/stream/${camId}?w=${width}&t=${Date.now()}`;
};
