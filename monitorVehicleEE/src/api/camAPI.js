import axios from "axios";

const API_URL =
  import.meta.env.VITE_STREAM_API_URL || "http://localhost:8001"; //10.60.229.211

export const getCameraStatus = async (camId) => {
  const res = await axios.get(`${API_URL}/camera-status/${camId}`);

  return res.data;
};

export const startCamera = async (camId, sendEvent = true, cameraPayload = null) => {
  const eventFlag = sendEvent ? "true" : "false";
  const res = await axios.post(`${API_URL}/start-stream/${camId}/${eventFlag}`, cameraPayload);

  return res.data;
};

export const stopCamera = async (camId, sendEvent = true) => {
  const eventFlag = sendEvent ? "true" : "false";
  const res = await axios.post(`${API_URL}/stop-stream/${camId}/${eventFlag}`);

  return res.data;
};

export const buildCameraStreamUrl = (camId, width = 480) => {
  return `${API_URL}/stream/${camId}?w=${width}&t=${Date.now()}`;
};

export const buildEventMediaUrl = (path) => {
  if (!path) return "";

  const normalizedPath = String(path).replaceAll("\\", "/");

  if (/^https?:\/\//i.test(normalizedPath)) {
    try {
      const url = new URL(normalizedPath);

      if (
        (url.hostname === "localhost" ||
          url.hostname === "127.0.0.1" ||
          url.hostname === "10.60.229.211") &&
        url.pathname.startsWith("/event-images/")
      ) {
        return `${API_URL}${url.pathname}${url.search}`;
      }
    } catch (error) {
      console.error("Invalid event media URL:", normalizedPath, error);
    }

    return normalizedPath;
  }

  const eventsIndex = normalizedPath.indexOf("events/");

  if (eventsIndex >= 0) {
    return `${API_URL}/event-images/${normalizedPath.slice(eventsIndex + 7)}`;
  }

  if (normalizedPath.startsWith("/event-images/")) {
    return `${API_URL}${normalizedPath}`;
  }

  return normalizedPath;
};
