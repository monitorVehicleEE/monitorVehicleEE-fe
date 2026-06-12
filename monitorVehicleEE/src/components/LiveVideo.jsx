import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Camera, Check, ExternalLink, Pencil, X } from "lucide-react";

import {
  buildCameraStreamUrl,
  buildEventMediaUrl,
  getCameraStatus,
  startCamera,
  stopCamera,
} from "../api/camAPI";
import { camerasAPI, vehicleEventsAPI } from "../api/api";
import { formatVehicleType, formatVietnamDateTime } from "../utils/format";
import { isSuspiciousPlateFormat } from "../utils/plateReview";
import {
  formatEventType,
  formatEventStatus,
  formatPercent,
  getEventTime,
  getPlateConfidence,
  getVehicleConfidence,
} from "../utils/vehicleEvent";
import LoadingCamera from "./LoadingCamera";
import Loading from "./Loading";

const LIVE_FEED_POLL_MS = 1000;

const cameraRoleLabels = {
  0: "Cổng vào",
  1: "Cổng ra",
  2: "Nội bộ",
  ENTRY: "Cổng vào",
  EXIT: "Cổng ra",
  INTERNAL: "Nội bộ",
};

const formatVehiclePlateTitle = (event) => {
  const vehicleType = formatVehicleType(event?.vehicle_type_id ?? event?.vehicle_type);
  const hasPlateEvidence =
    Boolean(event?.plate_image_path) || Number(event?.plate_confidence || 0) > 0;
  const plate = event?.plate || (
    hasPlateEvidence
      ? "Cần kiểm tra thủ công"
      : "Chưa có biển số"
  );
  return `${vehicleType} - ${plate}`;
};

const formatAlertSeverity = (severity) => {
  return String(severity || "high").toUpperCase();
};

const EventImages = ({ event, onPreview }) => {
  const vehicleImageUrl = buildEventMediaUrl(event?.image_path);
  const plateImageUrl = buildEventMediaUrl(event?.plate_image_path);

  if (!vehicleImageUrl && !plateImageUrl) return null;

  return (
    <div className="event-images">
      {vehicleImageUrl && (
        <button
          className="event-image-button vehicle-image-button"
          type="button"
          onClick={() => onPreview?.(vehicleImageUrl, "Ảnh xe")}
        >
          <img src={vehicleImageUrl} alt={`Vehicle ${event?.id || ""}`} />
        </button>
      )}
      {plateImageUrl && (
        <button
          className="event-image-button plate-image-button"
          type="button"
          onClick={() => onPreview?.(plateImageUrl, "Ảnh biển số")}
        >
          <img src={plateImageUrl} alt={`Plate ${event?.id || ""}`} />
        </button>
      )}
    </div>
  );
};

function LiveVideo() {
  const screenRef = useRef(null);
  const streamWidthRef = useRef(960);
  const selectedCameraIdRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [streamUrl, setStreamUrl] = useState("");
  const [screenWidth, setScreenWidth] = useState(960);
  const [cameraRunning, setCameraRunning] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingStream, setLoadingStream] = useState(false);
  const [error, setError] = useState("");
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [alertEvents, setAlertEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [plateInput, setPlateInput] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const plateInputTouchedRef = useRef(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [streamOrientation, setStreamOrientation] = useState("portrait");

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

  const selectedCameraRole = selectedCamera?.camera_role;
  const selectedCameraEventType =
    selectedCameraRole === 0 || selectedCameraRole === "0" || selectedCameraRole === "ENTRY"
      ? "IN"
      : selectedCameraRole === 1 || selectedCameraRole === "1" || selectedCameraRole === "EXIT"
        ? "OUT"
        : "DETECTED";
  const approvedFeedTitle =
    selectedCameraEventType === "OUT"
      ? "Xe ra"
      : selectedCameraEventType === "IN"
        ? "Xe vào"
        : "Xe phát hiện";

  const suspiciousPendingEvents = useMemo(
    () => pendingEvents.filter((event) => isSuspiciousPlateFormat(event.plate)),
    [pendingEvents],
  );

  const normalPendingEvents = useMemo(
    () => pendingEvents.filter((event) => !isSuspiciousPlateFormat(event.plate)),
    [pendingEvents],
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
      setError("Không thể tải danh sách camera");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadLiveFeed = useCallback(async () => {
    const selectedCameraId = selectedCamera?.id == null ? null : Number(selectedCamera.id);

    try {
      const res = await vehicleEventsAPI.liveFeed(
        selectedCameraId == null ? undefined : { camera_id: selectedCameraId },
      );

      if (selectedCameraIdRef.current !== selectedCameraId) {
        return;
      }

      const approved = Array.isArray(res.data?.approved) ? res.data.approved : [];
      const pending = Array.isArray(res.data?.pending) ? res.data.pending : [];
      const alerts = Array.isArray(res.data?.alerts) ? res.data.alerts : [];

      setApprovedEvents(approved);
      setPendingEvents(pending);
      setAlertEvents(alerts);
      setSelectedEvent((current) => {
        const mergedEvents = [...pending, ...approved];
        if (current) {
          const freshEvent = mergedEvents.find((event) => event.id === current.id);
          if (freshEvent) {
            if (!plateInputTouchedRef.current) {
              setPlateInput(freshEvent.plate || "");
            }
            return freshEvent;
          }
        }

        const firstEvent = pending[0] || null;
        setPlateInput(firstEvent?.plate || "");
        plateInputTouchedRef.current = false;
        return firstEvent;
      });
      setReviewError("");
    } catch (err) {
      if (selectedCameraIdRef.current !== selectedCameraId) {
        return;
      }

      console.error("Failed to load pending vehicle events:", err);
      setApprovedEvents([]);
      setPendingEvents([]);
      setAlertEvents([]);
    }
  }, [selectedCamera]);

  const checkSelectedCameraStatus = useCallback(async () => {
    if (!selectedCamera) {
      setCameraRunning(false);
      setStreamUrl("");
      return;
    }

    try {
      const res = await getCameraStatus(selectedCamera.id);

      if (res.running && res.send_vehicle_events) {
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
    selectedCameraIdRef.current = camera?.id == null ? null : Number(camera.id);
    setSelectedCamera(camera);
    setStreamUrl("");
    setCameraRunning(false);
    setSelectedEvent(null);
    setPlateInput("");
    plateInputTouchedRef.current = false;
    setReviewError("");
    setPendingEvents([]);
    setApprovedEvents([]);
    setAlertEvents([]);
  };

  const handleStart = async () => {
    if (!selectedCamera) return;

    try {
      setLoadingStream(true);
      await startCamera(selectedCamera.id, true, selectedCamera);
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
      await stopCamera(selectedCamera.id, true);
      setCameraRunning(false);
      setStreamUrl("");
    } catch (err) {
      console.error("Failed to stop camera:", err);
    } finally {
      setLoadingStream(false);
    }
  };

  const handleStreamLoad = (event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    setStreamOrientation(naturalWidth >= naturalHeight ? "landscape" : "portrait");
    setLoadingStream(false);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setPlateInput(event.plate || "");
    plateInputTouchedRef.current = false;
    setReviewError("");
  };

  const handlePreviewImage = (src, title) => {
    setPreviewImage({ src, title });
  };

  const handleCancelReview = () => {
    setPlateInput(selectedEvent?.plate || "");
    plateInputTouchedRef.current = false;
    setReviewError("");
    setSelectedEvent(null);
  };

  const handleApprove = async () => {
    if (!selectedEvent) return;

    try {
      setReviewing(true);
      setReviewError("");
      const payload = {
        plate: plateInput.trim().toUpperCase() || selectedEvent.plate,
        vehicle_type_id: selectedEvent.vehicle_type_id,
        status: 2,
      };

      if (Number(selectedEvent.status) === 0) {
        await vehicleEventsAPI.approve(selectedEvent.id, payload);
      } else {
        await vehicleEventsAPI.update(selectedEvent.id, payload);
      }

      await loadLiveFeed();
    } catch (err) {
      console.error("Failed to approve event:", err);
      setReviewError("Duyệt thất bại");
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEvent) return;

    try {
      setReviewing(true);
      setReviewError("");
      await vehicleEventsAPI.reject(selectedEvent.id, {});
      await loadLiveFeed();
    } catch (err) {
      console.error("Failed to reject event:", err);
      setReviewError("Từ chối event thất bại");
    } finally {
      setReviewing(false);
    }
  };

  const renderReviewPanel = ({ actionLabel = "Duyệt", showReject = true } = {}) => (
    <div className="review-panel">
      <div className="panel-header">
        <div>
          <h3>Chi tiết event</h3>
          <p>#{selectedEvent.id}</p>
        </div>
      </div>

      <EventImages event={selectedEvent} onPreview={handlePreviewImage} />

      <label className="review-field">
        <span>Biển số</span>
        <input
          value={plateInput}
          onChange={(event) => {
            setPlateInput(event.target.value);
            plateInputTouchedRef.current = true;
          }}
          placeholder="Nhập biển số"
        />
      </label>

      <div className="telemetry-grid">
        <Telemetry
          label="Loại xe"
          value={formatVehicleType(selectedEvent.vehicle_type_id ?? selectedEvent.vehicle_type)}
        />
        <Telemetry
          label="Độ tin cậy xe"
          value={formatPercent(getVehicleConfidence(selectedEvent))}
        />
        <Telemetry
          label="Độ tin cậy biển số"
          value={formatPercent(getPlateConfidence(selectedEvent))}
        />
        <Telemetry label="Hướng" value={formatEventType(selectedEvent.event_type)} />
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
          {actionLabel}
        </button>
        <button
          className="camera-action-button cancel"
          type="button"
          onClick={handleCancelReview}
          disabled={reviewing}
        >
          Hủy
        </button>
        {showReject && (
          <button
            className="camera-action-button stop"
            type="button"
            onClick={handleReject}
            disabled={reviewing}
          >
            <X className="w-4 h-4" />
            Từ chối
          </button>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

  useEffect(() => {
    selectedCameraIdRef.current = selectedCamera?.id == null ? null : Number(selectedCamera.id);
  }, [selectedCamera]);

  useEffect(() => {
    loadLiveFeed();

    const interval = setInterval(loadLiveFeed, LIVE_FEED_POLL_MS);
    return () => clearInterval(interval);
  }, [loadLiveFeed]);

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
    // return (
    //   <div className="page-loading">
    //     <Loading />
    //   </div>
    // );
    return (
      <Loading/>
    )
  }

  const selectedEventIsPending =
    selectedEvent && pendingEvents.some((event) => event.id === selectedEvent.id);

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
                  <span>{camera.location || "Chưa gắn vị trí"}</span>
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
                      aria-label="Mở stream camera"
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
                    className={`stream-${streamOrientation}`}
                    src={streamUrl}
                    alt={selectedCamera?.name || "Camera"}
                    onLoad={handleStreamLoad}
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

            <aside className="ops-panel live-side-panel pending-panel">
              <div className="panel-header">
                <div>
                  <h3>Chờ duyệt</h3>
                  <p>Cần nhân viên xác nhận</p>
                </div>
              </div>

              <div className={`pending-workspace ${selectedEventIsPending ? "reviewing" : ""}`}>
                <div className="detection-feed pending-feed">
                  {suspiciousPendingEvents.length > 0 && (
                    <div className="suspicious-plate-panel">
                      <div className="suspicious-plate-header">
                        <AlertTriangle className="w-4 h-4" />
                        <div>
                          <strong>Biển số nghi vấn</strong>
                          <span>Có thể thiếu ký tự  </span>
                        </div>
                      </div>

                      {suspiciousPendingEvents.map((event) => (
                        <button
                          key={event.id}
                          className={`detection-card suspicious ${
                            selectedEvent?.id === event.id ? "active" : ""
                          }`}
                          type="button"
                          onClick={() => handleSelectEvent(event)}
                        >
                          <div>
                            <strong>{formatVehiclePlateTitle(event)}</strong>
                            <span>
                              Camera {event.camera_id || "N/A"} - {formatEventType(event.event_type)}
                            </span>
                            <p>{formatVietnamDateTime(getEventTime(event))}</p>
                          </div>
                          <em>{formatPercent(getPlateConfidence(event) ?? getVehicleConfidence(event))}</em>
                        </button>
                      ))}
                    </div>
                  )}

                  {normalPendingEvents.length > 0 ? (
                    normalPendingEvents.map((event) => (
                      <button
                        key={event.id}
                        className={`detection-card ${selectedEvent?.id === event.id ? "active" : ""}`}
                        type="button"
                        onClick={() => handleSelectEvent(event)}
                      >
                        <div>
                          <strong>{formatVehiclePlateTitle(event)}</strong>
                          <span>
                            Camera {event.camera_id || "N/A"} - {formatEventType(event.event_type)}
                          </span>
                          <p>{formatVietnamDateTime(getEventTime(event))}</p>
                        </div>
                        <em>{formatPercent(getPlateConfidence(event) ?? getVehicleConfidence(event))}</em>
                      </button>
                    ))
                  ) : (
                    suspiciousPendingEvents.length === 0 && (
                      <div className="empty-state compact">Không có xe chờ duyệt</div>
                    )
                  )}
                </div>

                {selectedEventIsPending && renderReviewPanel()}
              </div>
            </aside>
          </section>

                    <section className="ops-panel blacklist-alert-panel">
            <div className="panel-header blacklist-alert-header">
              <div>
                <h3>Cảnh Báo</h3>
                <p>Xe vi phạm gần đây</p>
              </div>
              <strong>{alertEvents.length}</strong>
            </div>

            <div className="blacklist-alert-list">
              {alertEvents.length > 0 ? (
                alertEvents.map((alert) => (
                  <div key={alert.id} className="blacklist-alert-card">
                    <div className="blacklist-alert-icon">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="blacklist-alert-content">
                      <div className="blacklist-alert-title">
                        <strong>{alert.plate || "N/A"}</strong>
                        <span>{alert.alert_type || "BLACKLIST_DETECTED"}</span>
                      </div>
                      <p>{alert.message || "Phát hiện xe thuộc blacklist"}</p>
                      <div className="blacklist-alert-meta">
                        <span>Camera {alert.camera_id || "N/A"}</span>
                        <span>Thời gian: {formatVietnamDateTime(alert.timestamp || alert.date_new)}</span>
                      </div>
                    </div>
                    <div className="blacklist-alert-status">
                      <em>{formatAlertSeverity(alert.severity)}</em>
                      <span>{alert.is_resolved ? "Đã xử lý" : "Chưa xử lý"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="blacklist-alert-empty">Chưa có cảnh báo </div>
              )}
            </div>
          </section>

          <section className="ops-panel approved-panel">
            <div className="panel-header">
              <div>
                <h3>{approvedFeedTitle}</h3>
                <p>Tự động và vừa duyệt gần đây</p>
              </div>
            </div>

            <div className="approved-feed">
              {approvedEvents.length > 0 ? (
                approvedEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`detection-card approved ${
                      event.image_path || event.plate_image_path ? "has-media" : ""
                    }`}
                  >
                    <EventImages event={event} onPreview={handlePreviewImage} />
                    <div>
                      <strong>{formatVehiclePlateTitle(event)}</strong>
                      <span>
                        Camera {event.camera_id || "N/A"} - {formatEventType(event.event_type)}
                      </span>
                      <p>{formatVietnamDateTime(getEventTime(event))}</p>
                    </div>
                    <div className="approved-actions">
                      <em>{formatEventStatus(event.status)}</em>
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => handleSelectEvent(event)}
                        aria-label="Sửa event"
                        title="Sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                    {selectedEvent?.id === event.id && (
                      <div className="approved-edit-panel">
                        {renderReviewPanel({ actionLabel: "Lưu", showReject: false })}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state compact">Chưa có xe vừa duyệt</div>
              )}
            </div>
          </section>
        </>
      ) : (
        <div className="empty-state">Chưa có camera nào đang hoạt động</div>
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
}

const Telemetry = ({ label, value }) => (
  <div className="telemetry-card">
    <span>{label}</span>
    <strong>{value || "N/A"}</strong>
  </div>
);

export default LiveVideo;

