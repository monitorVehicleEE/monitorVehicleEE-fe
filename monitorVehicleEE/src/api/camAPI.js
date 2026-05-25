import axios from "axios";

const API_URL = "http://localhost:8000";

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
