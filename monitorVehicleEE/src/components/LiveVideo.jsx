import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, ExternalLink, X } from "lucide-react";

import {
  buildCameraStreamUrl,
  getCameraStatus,
  startCamera,
  stopCamera,
} from "../api/camAPI";
import { camerasAPI, vehicleEventsAPI } from "../services/api";
import { formatVehicleType, formatVietnamDateTime } from "../utils/format";
import {
  formatEventType,
  formatPercent,
  getEventTime,
  getPlateConfidence,
  getVehicleConfidence,
} from "../utils/vehicleEvent";
import LoadingCamera from "./LoadingCamera";

const cameraRoleLabels = {
  0: "Cổng vào",
  1: "Cổng ra",
  2: "Noi bo",
  ENTRY: "Cong vao",
  EXIT: "Cong ra",
  INTERNAL: "Noi bo",
};

function LiveVideo() {
  const screenRef = useRef(null);
  const streamWidthRef = useRef(960);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [streamUrl, setStreamUrl] = useState("");
  const [screenWidth, setScreenWidth] = useState(960);
  const [cameraRunning, setCameraRunning] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingStream, setLoadingStream] = useState(false);
  const [error, setError] = useState("");
  const [pendingEvents, setPendingEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [plateInput, setPlateInput] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const getStreamWidth = useCallback(() => {
    return Math.max(480, Math.min(960, Math.round(screenWidth || 960)));
  }, [screenWidth]);

  const buildSelectedStreamUrl = useCallback(
    (camera = selectedCamera) => {
      if (!camera) return "";
      const width = getStreamWidth();
      streamWidthRef.current = width;
      return buildCameraStreamUrl(camera.id, width);
    },
    [getStreamWidth, selectedCamera],
  );

  const loadCameras = useCallback(async () => {
    try {
      setError("");
      const res = await camerasAPI.list();
      const activeCameras = Array.isArray(res.data)
        ? res.data.filter((camera) => camera.status !== 10)
        : [];

      setCameras(activeCameras);
      setSelectedCamera((current) => {
        if (current && activeCameras.some((camera) => camera.id === current.id)) {
          return current;
        }

        return activeCameras[0] || null;
      });
    } catch (err) {
      console.error("Failed to load cameras:", err);
      setError("Khong the tai danh sach camera");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadPendingEvents = useCallback(async () => {
    try {
      const res = await vehicleEventsAPI.getPending();
      const events = Array.isArray(res.data) ? res.data : [];
      setPendingEvents(events);
      setSelectedEvent((current) => {
        if (current && events.some((event) => event.id === current.id)) {
          return current;
        }

        const firstEvent = events[0] || null;
        setPlateInput(firstEvent?.plate || "");
        return firstEvent;
      });
      setReviewError("");
    } catch (err) {
      console.error("Failed to load pending vehicle events:", err);
      setPendingEvents([]);
    }
  }, []);

  const checkSelectedCameraStatus = useCallback(async () => {
    if (!selectedCamera) {
      setCameraRunning(false);
      setStreamUrl("");
      return;
    }

    try {
      const res = await getCameraStatus(selectedCamera.id);

      if (res.running) {
        setCameraRunning(true);
        setLoadingStream(true);
        setStreamUrl(buildSelectedStreamUrl(selectedCamera));
      } else {
        setCameraRunning(false);
        setLoadingStream(false);
        setStreamUrl("");
      }
    } catch (err) {
      console.error("Failed to check camera status:", err);
      setCameraRunning(false);
      setLoadingStream(false);
      setStreamUrl("");
    }
  }, [buildSelectedStreamUrl, selectedCamera]);

  const handleSelectCamera = (camera) => {
    setSelectedCamera(camera);
    setStreamUrl("");
    setCameraRunning(false);
  };

  const handleStart = async () => {
    if (!selectedCamera) return;

    try {
      setLoadingStream(true);
      await startCamera(selectedCamera.id);
      setCameraRunning(true);
      setStreamUrl(buildSelectedStreamUrl(selectedCamera));
    } catch (err) {
      console.error("Failed to start camera:", err);
      setCameraRunning(false);
      setLoadingStream(false);
    }
  };

  const handleStop = async () => {
    if (!selectedCamera) return;

    try {
      setLoadingStream(true);
      await stopCamera(selectedCamera.id);
      setCameraRunning(false);
      setStreamUrl("");
    } catch (err) {
      console.error("Failed to stop camera:", err);
    } finally {
      setLoadingStream(false);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setPlateInput(event.plate || "");
    setReviewError("");
  };

  const handleApprove = async () => {
    if (!selectedEvent) return;

    try {
      setReviewing(true);
      setReviewError("");
      await vehicleEventsAPI.approve(selectedEvent.id, {
        plate: plateInput.trim().toUpperCase() || selectedEvent.plate,
        vehicle_type: selectedEvent.vehicle_type,
        status: "MANUAL_APPROVED",
      });
      await loadPendingEvents();
    } catch (err) {
      console.error("Failed to approve event:", err);
      setReviewError("Duyet event that bai");
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEvent) return;

    try {
      setReviewing(true);
      setReviewError("");
      await vehicleEventsAPI.reject(selectedEvent.id, {
        status: "REJECTED",
      });
      await loadPendingEvents();
    } catch (err) {
      console.error("Failed to reject event:", err);
      setReviewError("Tu choi event that bai");
    } finally {
      setReviewing(false);
    }
  };

  useEffect(() => {
    loadCameras();
    loadPendingEvents();

    const interval = setInterval(loadPendingEvents, 5000);
    return () => clearInterval(interval);
  }, [loadCameras, loadPendingEvents]);

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

  useEffect(() => {
    checkSelectedCameraStatus();
  }, [checkSelectedCameraStatus]);

  useEffect(() => {
    const nextWidth = getStreamWidth();
    if (cameraRunning && streamUrl && nextWidth !== streamWidthRef.current) {
      setStreamUrl(buildSelectedStreamUrl());
    }
  }, [buildSelectedStreamUrl, cameraRunning, getStreamWidth, streamUrl]);

  if (loadingList) {
    return (
      <div className="page-loading">
        <LoadingCamera />
      </div>
    );
  }

  return (
    <div className="ops-page live-page">
      {error && <div className="camera-error">{error}</div>}

      {cameras.length > 0 ? (
        <>
          <section className="camera-strip">
            {cameras.map((camera) => (
              <button
                key={camera.id}
                className={`camera-tile ${selectedCamera?.id === camera.id ? "active" : ""}`}
                type="button"
                onClick={() => handleSelectCamera(camera)}
              >
                <Camera className="w-5 h-5" />
                <div>
                  <strong>{camera.name || `Camera ${camera.id}`}</strong>
                  <span>{camera.location || "Chua gan vi tri"}</span>
                </div>
                <em>{cameraRoleLabels[camera.camera_role] || "Camera"}</em>
              </button>
            ))}
          </section>

          <section className="live-grid">
            <div className="video-panel">
              <div className="video-toolbar">
                <div>
                  <strong>{selectedCamera?.name || "Camera"}</strong>
                  <span>{streamUrl || "Chưa có stream đang chạy"}</span>
                </div>
                <div className="camera-monitor-actions">
                  <span className={`camera-status-badge live-status-badge ${cameraRunning ? "online" : "offline"}`}>
                    {cameraRunning ? "Online" : "Offline"}
                  </span>

                  {streamUrl && (
                    <a
                      className="icon-button"
                      href={streamUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Mo stream camera"
                      title={streamUrl}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {cameraRunning ? (
                    <button
                      className="camera-action-button stop"
                      onClick={handleStop}
                      disabled={loadingStream}
                    >
                      Dừng
                    </button>
                  ) : (
                    <button
                      className="camera-action-button start"
                      onClick={handleStart}
                      disabled={loadingStream || !selectedCamera}
                    >
                      {loadingStream ? "Đang mở..." : "Xem"}
                    </button>
                  )}
                </div>
              </div>

              <div className={`camera-monitor-screen ${streamUrl ? "streaming" : ""}`} ref={screenRef}>
                {streamUrl ? (
                  <img
                    src={streamUrl}
                    alt={selectedCamera?.name || "Camera"}
                    onLoad={() => setLoadingStream(false)}
                    onError={() => setLoadingStream(false)}
                  />
                ) : (
                  <div className="video-empty">
                    <Camera className="w-16 h-16" />
                    <p>{loadingStream ? "Camera đang khởi động" : "Chọn camera và bấm xem"}</p>
                  </div>
                )}

                {loadingStream && (
                  <div className="camera-loading-overlay">
                    <LoadingCamera />
                  </div>
                )}
              </div>
            </div>

            <aside className="ops-panel live-side-panel">
              <div className="panel-header">
                <div>
                  <h3>Chờ duyệt</h3>

                </div>
              </div>

              <div className="detection-feed">
                {pendingEvents.length > 0 ? (
                  pendingEvents.map((event) => (
                    <button
                      key={event.id}
                      className={`detection-card ${selectedEvent?.id === event.id ? "active" : ""}`}
                      type="button"
                      onClick={() => handleSelectEvent(event)}
                    >
                      <div>
                        <strong>{event.plate || "Chua co bien so"}</strong>
                        <span>
                          Camera {event.camera_id || "N/A"} - {formatEventType(event.event_type)}
                        </span>
                        <p>{formatVietnamDateTime(getEventTime(event))}</p>
                      </div>
                      <em>{formatPercent(getPlateConfidence(event) ?? getVehicleConfidence(event))}</em>
                    </button>
                  ))
                ) : (
                  <div className="empty-state">Không có xe chờ duyệt</div>
                )}
              </div>

              {selectedEvent && (
                <div className="review-panel">
                  <div className="panel-header">
                    <div>
                      <h3>Chi tiet event</h3>
                      <p>#{selectedEvent.id}</p>
                    </div>
                  </div>

                  {selectedEvent.plate_image_path && (
                    <img
                      className="review-image"
                      src={selectedEvent.plate_image_path}
                      alt={`Plate ${selectedEvent.plate || selectedEvent.id}`}
                    />
                  )}

                  <label className="review-field">
                    <span>Bien so</span>
                    <input
                      value={plateInput}
                      onChange={(event) => setPlateInput(event.target.value)}
                      placeholder="Nhap bien so"
                    />
                  </label>

                  <div className="telemetry-grid">
                    <Telemetry label="Loai xe" value={formatVehicleType(selectedEvent.vehicle_type)} />
                    <Telemetry
                      label="Vehicle"
                      value={formatPercent(getVehicleConfidence(selectedEvent))}
                    />
                    <Telemetry
                      label="Plate OCR"
                      value={formatPercent(getPlateConfidence(selectedEvent))}
                    />
                    <Telemetry label="Huong" value={formatEventType(selectedEvent.event_type)} />
                  </div>

                  {reviewError && <div className="camera-error">{reviewError}</div>}

                  <div className="review-actions">
                    <button
                      className="camera-action-button start"
                      type="button"
                      onClick={handleApprove}
                      disabled={reviewing}
                    >
                      <Check className="w-4 h-4" />
                      Duyet
                    </button>
                    <button
                      className="camera-action-button stop"
                      type="button"
                      onClick={handleReject}
                      disabled={reviewing}
                    >
                      <X className="w-4 h-4" />
                      Tu choi
                    </button>
                  </div>
                </div>
              )}
            </aside>
          </section>
        </>
      ) : (
        <div className="empty-state">Chua co camera nao dang hoat dong</div>
      )}
    </div>
  );
}

const Telemetry = ({ label, value }) => (
  <div className="telemetry-card">
    <span>{label}</span>
    <strong>{value || "N/A"}</strong>
  </div>
);

export default LiveVideo;
