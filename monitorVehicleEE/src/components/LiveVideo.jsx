import React, { useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Camera, CircleDot, Maximize2, Radio, Video, Wifi, WifiOff } from 'lucide-react';
import { camerasAPI } from '../services/api';
import websocketService from '../services/websocket';
import { formatVehicleType, formatVietnamTime } from '../utils/format';
import LoadingCamera from './LoadingCamera';

const HLS_BASE_URL = import.meta.env.VITE_HLS_BASE_URL || 'http://localhost:8888';
const OVERLAY_DELAY_MS = Number(import.meta.env.VITE_OVERLAY_DELAY_MS || 1800);
const MAX_FRAME_QUEUE = 80;

const LiveVideo = () => {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [frameData, setFrameData] = useState({});
  const [connected, setConnected] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const frameQueueRef = useRef([]);
  const activeCameraRef = useRef(null);
  const overlayTimerRef = useRef(null);

  useEffect(() => {
    loadCameras();

    return () => {
      cleanupTimers();
      destroyHls();
      if (activeCameraRef.current) {
        websocketService.disconnect(`stream-${activeCameraRef.current}`);
      }
    };
  }, []);

  // useEffect(() => {
  //   if (!selectedCamera) return;
  //   connectToCamera(selectedCamera.id);
  //   attachHlsStream(selectedCamera);
  // }, [selectedCamera]);
  useEffect(() => {
    if (!selectedCamera) return;

    const cameraId = selectedCamera.id;

    connectToCamera(cameraId);
    attachHlsStream(selectedCamera);

    return () => {
      websocketService.disconnect(`stream-${cameraId}`);
    };
  }, [selectedCamera]);

  const streamUrl = useMemo(() => {
    if (!selectedCamera) return '';
    return getHlsUrl(selectedCamera);
  }, [selectedCamera]);

  const cleanupTimers = () => {
    if (overlayTimerRef.current) clearInterval(overlayTimerRef.current);
    overlayTimerRef.current = null;
  };

  const destroyHls = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  const loadCameras = async () => {
    try {
      const response = await camerasAPI.list({ status: 'active' });
      setCameras(response.data);
      if (response.data.length > 0) setSelectedCamera(response.data[0]);
    } catch (error) {
      console.error('Failed to load cameras:', error);
    } finally {
      setLoading(false);
    }
  };

  const attachHlsStream = (camera) => {
    const video = videoRef.current;
    if (!video) return;

    setVideoReady(false);
    destroyHls();
    video.removeAttribute('src');
    video.load();

    const url = getHlsUrl(camera);
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play().catch(() => {});
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: false,
        liveSyncDurationCount: 3,
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hlsRef.current = hls;
    }
  };

  const connectToCamera = (cameraId) => {
    cleanupTimers();
    frameQueueRef.current = [];
    activeCameraRef.current = cameraId;
    setFrameData({});

    overlayTimerRef.current = setInterval(() => {
      const targetTime = Date.now() - OVERLAY_DELAY_MS;
      const queue = frameQueueRef.current;
      let selectedIndex = -1;

      for (let index = queue.length - 1; index >= 0; index -= 1) {
        if (queue[index].receivedAt <= targetTime) {
          selectedIndex = index;
          break;
        }
      }

      if (selectedIndex >= 0) {
        setFrameData(queue[selectedIndex].data);
        frameQueueRef.current = queue.slice(Math.max(0, selectedIndex - 2));
      }
    }, 120);

    cameras.forEach(camera => {
      if (camera.id !== cameraId) websocketService.disconnect(`stream-${camera.id}`);
    });

    websocketService.connectToCamera(
      cameraId,
      (message) => {
        if (message.type !== 'frame') return;
        frameQueueRef.current.push({
          data: message.data,
          receivedAt: Date.now(),
        });

        if (frameQueueRef.current.length > MAX_FRAME_QUEUE) {
          frameQueueRef.current = frameQueueRef.current.slice(-MAX_FRAME_QUEUE);
        }
      },
      () => setConnected(true),
      () => setConnected(false),
      () => setConnected(false),
    );
  };

  const overlayWidth = frameData.frame_width || 1920;
  const overlayHeight = frameData.frame_height || 1080;
  const detections = frameData.detections || [];

  if (loading) return (
    <div className="page-loading">
      <LoadingCamera />;
    </div>
  );

  return (
    <div className="ops-page live-page">
      <section className="camera-strip">
        {cameras.map(camera => (
          <button
            key={camera.id}
            className={`camera-tile ${selectedCamera?.id === camera.id ? 'active' : ''}`}
            onClick={() => setSelectedCamera(camera)}
          >
            <Camera className="w-5 h-5" />
            <div>
              <strong>{camera.name}</strong>
              <span>{camera.location || 'Không có vị trí'}</span>
            </div>
            <em>{camera.status}</em>
          </button>
        ))}
      </section>

      <section className="live-grid">
        <div className="video-panel">
          <div className="video-toolbar">
            <div>
              <strong>{selectedCamera?.name || 'Camera'}</strong>
              <span>{streamUrl || 'Không có HLS stream'}</span>
            </div>
            <div className={`live-indicator ${connected && videoReady ? 'online' : 'offline'}`}>
              {connected && videoReady ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {connected && videoReady ? 'Live 30 FPS' : 'Đang kết nối'}
            </div>
          </div>

          <div className="video-stage">
            {/* <video
              ref={videoRef}
              className={videoReady ? 'visible' : ''}
              muted
              playsInline
              autoPlay
              controls={false}
              onCanPlay={() => setVideoReady(true)}
              onPlaying={() => setVideoReady(true)}
              onWaiting={() => setVideoReady(false)}
              onError={() => setVideoReady(false)}
            /> */}

            <svg className="detection-overlay" viewBox={`0 0 ${overlayWidth} ${overlayHeight}`} preserveAspectRatio="xMidYMid meet">
              {detections.map((det, index) => {
                if (!det.bbox || det.bbox.length < 4) return null;
                const [x1, y1, x2, y2] = det.bbox;
                const width = Math.max(1, x2 - x1);
                const height = Math.max(1, y2 - y1);
                return (
                  <g key={`${det.track_id}-${index}`}>
                    <rect x={x1} y={y1} width={width} height={height} />
                    <text x={x1} y={Math.max(18, y1 - 8)}>
                      {formatVehicleType(det.class_name)} #{det.track_id}
                    </text>
                  </g>
                );
              })}
            </svg>

            {!videoReady && (
              <div className="video-empty">
                <Video className="w-16 h-16" />
                <p>Đang tải luồng camera</p>
              </div>
            )}
            <div className="video-overlay top-left">
              <span><CircleDot className="w-4 h-4" /> Camera {selectedCamera?.id || '-'}</span>
              <span>{formatVietnamTime(frameData.timestamp)}</span>
            </div>
            <button className="video-expand" aria-label="Phóng to video">
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <aside className="ops-panel live-side-panel">
          <div className="panel-header">
            <div>
              <h3>Telemetry</h3>
              <p>Dữ liệu xử lý realtime</p>
            </div>
          </div>

          <div className="telemetry-grid">
            <Telemetry label="AI FPS" value={frameData.fps?.toFixed(1) || '0.0'} />
            <Telemetry label="Video" value={videoReady ? '25-30' : '0'} />
            <Telemetry label="Track" value={frameData.active_tracks || 0} />
            <Telemetry label="Delay" value={`${(OVERLAY_DELAY_MS / 1000).toFixed(1)}s`} />
          </div>

          <div className="feed-header">
            <Radio className="w-4 h-4" />
            Phát hiện hiện tại
          </div>

          <div className="detection-feed">
            {detections.length > 0 ? detections.map((det, index) => (
              <div key={`${det.track_id}-${index}`} className="detection-card">
                <div>
                  <strong>{formatVehicleType(det.class_name)}</strong>
                  <span>Track #{det.track_id}</span>
                </div>
                <em>{(det.confidence * 100).toFixed(1)}%</em>
                {det.plate?.plate_number && <p>Biển số: {det.plate.plate_number}</p>}
              </div>
            )) : (
              <div className="empty-state">Chưa phát hiện phương tiện trong khung hình</div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
};

const getHlsUrl = (camera) => {
  const fallbackPath = `camera${camera.id}`;
  const streamUrl = camera.stream_url || '';
  const match = streamUrl.match(/\/([^/?#]+)$/);
  const path = match?.[1] || fallbackPath;
  return `${HLS_BASE_URL}/${path}/index.m3u8`;
};

const Telemetry = ({ label, value }) => (
  <div className="telemetry-card">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export default LiveVideo;
