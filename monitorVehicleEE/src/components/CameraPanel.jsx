import React, { useCallback, useEffect, useRef, useState } from "react";
import { camerasAPI } from "../services/api";
import {
  buildCameraStreamUrl,
  getCameraStatus,
  startCamera,
  stopCamera,
} from "../api/camAPI";
import LoadingCamera from "./LoadingCamera";

const emptyCameraForm = {
  name: "",
  location: "",
  camera_role: 0,
  source_type: "file",
  source_path: "",
};

const cameraRoleOptions = [
  { value: 0, label: "Cổng vào" },
  { value: 1, label: "Cổng ra" },
  { value: 2, label: "Nội bộ" },
];

const sourceTypeOptions = [
  { value: "file", label: "File" },
  { value: "rtsp", label: "RTSP" },
  { value: "http", label: "HTTP" },
];

const normalizeCameraRole = (role) => {
  const legacyRoleMap = {
    ENTRY: 0,
    EXIT: 1,
    INTERNAL: 2,
  };

  if (typeof role === "string" && role in legacyRoleMap) {
    return legacyRoleMap[role];
  }

  const numericRole = Number(role);
  return Number.isInteger(numericRole) ? numericRole : 0;
};

function CameraPanel() {
  const [cameras, setCameras] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyCameraForm);
  const [editingCameraId, setEditingCameraId] = useState(null);

  const loadCameras = useCallback(async () => {
    try {
      setError("");
      const res = await camerasAPI.list();
      const activeCameras = Array.isArray(res.data)
        ? res.data.filter((camera) => camera.status !== 10)
        : [];
      setCameras(activeCameras);
    } catch (err) {
      console.error("Failed to load cameras:", err);
      setError("Không thể tải danh sách camera");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const handleFormChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setEditingCameraId(null);
    setForm(emptyCameraForm);
  };

  const getErrorMessage = (err, fallback) => {
    const detail = err.response?.data?.detail;
    if (Array.isArray(detail)) {
      return detail.map((item) => `${item.loc?.join(".")}: ${item.msg}`).join("; ");
    }

    return detail || fallback;
  };

  const handleSubmitCamera = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        location: form.location.trim(),
        camera_role: normalizeCameraRole(form.camera_role),
        source_type: form.source_type,
        source_path: form.source_path.trim(),
      };

      if (editingCameraId) {
        await camerasAPI.update(editingCameraId, payload);
      } else {
        await camerasAPI.create(payload);
      }

      resetForm();
      await loadCameras();
    } catch (err) {
      console.error("Failed to save camera:", err);
      setError(getErrorMessage(err, "Lưu camera thất bại. Kiểm tra lại thông tin hoặc server."));
    } finally {
      setSaving(false);
    }
  };

  const handleEditCamera = (camera) => {
    setError("");
    setEditingCameraId(camera.id);
    setForm({
      name: camera.name || "",
      location: camera.location || "",
      camera_role: normalizeCameraRole(camera.camera_role),
      source_type: camera.source_type || "file",
      source_path: camera.source_path || "",
    });
  };

  const handleDeleteCamera = async (camera) => {
    const confirmed = window.confirm(`Xóa camera "${camera.name || camera.id}"?`);
    if (!confirmed) return;

    try {
      setError("");
      await camerasAPI.update(camera.id, { status: 10 });
      if (editingCameraId === camera.id) {
        resetForm();
      }
      await loadCameras();
    } catch (err) {
      console.error("Failed to delete camera:", err);
      setError(getErrorMessage(err, "Xóa camera thất bại. Kiểm tra lại server."));
    }
  };

  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

  if (loadingList) {
    return (
      <div className="page-loading">
        <LoadingCamera />
      </div>
    );
  }

  return (
    <div className="ops-page">
      <form className="camera-add-form" onSubmit={handleSubmitCamera}>
        <input
          placeholder="Tên camera"
          value={form.name}
          onChange={(e) => handleFormChange("name", e.target.value)}
          required
        />

        <input
          placeholder="Vị trí"
          value={form.location}
          onChange={(e) => handleFormChange("location", e.target.value)}
        />

        <select
          value={form.camera_role}
          onChange={(e) => handleFormChange("camera_role", Number(e.target.value))}
          required
        >
          {cameraRoleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={form.source_type}
          onChange={(e) => handleFormChange("source_type", e.target.value)}
          required
        >
          {sourceTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          className="camera-source-input"
          placeholder="Nguồn camera, ví dụ 27.mp4 hoặc rtsp://192.168.1.10:8554/cam1"
          value={form.source_path}
          onChange={(e) => handleFormChange("source_path", e.target.value)}
          required
        />

        <button className="camera-action-button start" type="submit" disabled={saving}>
          {saving
            ? editingCameraId
              ? "Đang lưu..."
              : "Đang thêm..."
            : editingCameraId
              ? "Lưu camera"
              : "Thêm camera"}
        </button>

        {editingCameraId && (
          <button
            className="camera-action-button cancel"
            type="button"
            onClick={resetForm}
            disabled={saving}
          >
            Hủy
          </button>
        )}
      </form>

      {error && <div className="camera-error">{error}</div>}

      {cameras.length > 0 ? (
        <div className="camera-monitor-grid">
          {cameras.map((camera) => (
            <CameraView
              key={camera.id}
              camera={camera}
              onEdit={handleEditCamera}
              onDelete={handleDeleteCamera}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">Chưa có camera nào trên server</div>
      )}
    </div>
  );
}

function CameraView({ camera, onEdit, onDelete }) {
  const screenRef = useRef(null);
  const streamWidthRef = useRef(640);
  const [streamUrl, setStreamUrl] = useState("");
  const [screenWidth, setScreenWidth] = useState(640);
  const [loading, setLoading] = useState(false);
  const [cameraRunning, setCameraRunning] = useState(false);

  const getStreamWidth = useCallback(() => {
    return Math.max(320, Math.min(640, Math.round(screenWidth || 640)));
  }, [screenWidth]);

  const buildStreamUrl = useCallback(() => {
    const width = getStreamWidth();
    streamWidthRef.current = width;
    return buildCameraStreamUrl(camera.id, width);
  }, [camera.id, getStreamWidth]);

  useEffect(() => {
    const element = screenRef.current;
    if (!element) return undefined;

    const updateWidth = () => {
      const nextWidth = element.clientWidth;
      if (nextWidth > 0) {
        setScreenWidth(nextWidth);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const checkCameraStatus = useCallback(async () => {
    try {
      const res = await getCameraStatus(camera.id);

      if (res.running) {
        setCameraRunning(true);
        setLoading(true);
        setStreamUrl(buildStreamUrl());
      } else {
        setCameraRunning(false);
        setLoading(false);
        setStreamUrl("");
      }
    } catch (err) {
      console.error("Failed to check camera status:", err);
      setCameraRunning(false);
      setLoading(false);
    }
  }, [buildStreamUrl, camera.id]);

  const handleStart = async () => {
    try {
      setLoading(true);
      await startCamera(camera.id);
      setCameraRunning(true);
      setStreamUrl(buildStreamUrl());
    } catch (err) {
      console.error("Failed to start camera:", err);
      setCameraRunning(false);
      setLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setLoading(true);
      await stopCamera(camera.id);
      setCameraRunning(false);
      setStreamUrl("");
    } catch (err) {
      console.error("Failed to stop camera:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkCameraStatus();
  }, [checkCameraStatus]);

  useEffect(() => {
    const nextWidth = getStreamWidth();
    if (cameraRunning && streamUrl && nextWidth !== streamWidthRef.current) {
      setStreamUrl(buildStreamUrl());
    }
  }, [buildStreamUrl, cameraRunning, getStreamWidth, streamUrl]);

  return (
    <section className="camera-monitor-card">
      <div className="camera-monitor-header">
        <div className="camera-monitor-info">
          <strong>{camera.name || `Camera ${camera.id}`}</strong>
          <span>{camera.location || "Chưa gán vị trí"}</span>
        </div>

        <div className="camera-monitor-actions">
          <span className={`camera-status-badge ${cameraRunning ? "online" : "offline"}`}>
            {cameraRunning ? "Online" : "Offline"}
          </span>

          <button
            className="camera-action-button edit"
            type="button"
            onClick={() => onEdit(camera)}
            disabled={loading}
          >
            Sửa
          </button>

          <button
            className="camera-action-button delete"
            type="button"
            onClick={() => onDelete(camera)}
            disabled={loading}
          >
            Xóa
          </button>

          {cameraRunning ? (
            <button className="camera-action-button stop" onClick={handleStop} disabled={loading}>
              Dừng
            </button>
          ) : (
            <button className="camera-action-button start" onClick={handleStart} disabled={loading}>
              {loading ? "Đang mở..." : "Xem"}
            </button>
          )}
        </div>
      </div>

      <div className={`camera-monitor-screen ${streamUrl ? "streaming" : ""}`} ref={screenRef}>
        {streamUrl ? (
          <img
            src={streamUrl}
            alt={camera.name || `Camera ${camera.id}`}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        ) : (
          <span>{loading ? "Camera đang khởi động" : "Camera chưa khởi động"}</span>
        )}

        {loading && (
          <div className="camera-loading-overlay">
            <LoadingCamera />
          </div>
        )}
      </div>
    </section>
  );
}

export default CameraPanel;
