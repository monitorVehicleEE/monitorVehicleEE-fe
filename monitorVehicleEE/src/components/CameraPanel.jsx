import React, { useEffect, useState } from "react";

import axios from "axios";
import { Badge } from "react-bootstrap";

import LoadingCamera from "./LoadingCamera";

function CameraPanel({ camId = 27}) {
  const [streamUrl, setStreamUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraRunning, setCameraRunning] = useState(false);

  const buildStreamUrl = () => {
    return `http://localhost:8000/stream/${camId}?w=480&t=${Date.now()}`;
  };

  const checkCameraStatus = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/camera-status/${camId}`,
      );

      if (res.data.running) {
        setCameraRunning(true);
        setStreamUrl(buildStreamUrl());
      } else {
        setCameraRunning(false);
        setStreamUrl("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStart = async () => {
    try {
      setLoading(true);

      await axios.post(`http://localhost:8000/start-stream/${camId}`);

      setCameraRunning(true);

      setStreamUrl(buildStreamUrl());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setLoading(true);

      await axios.post(`http://localhost:8000/stop-stream/${camId}`);

      setCameraRunning(false);

      setStreamUrl("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkCameraStatus();
  }, [camId]);

  return (
    <div style={{ position: "relative" }}>
      {/* TOP BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          {cameraRunning ? (
            <Badge bg="success">Camera Online</Badge>
          ) : (
            <Badge bg="secondary">Camera Offline</Badge>
          )}
        </div>

        <div className="camera-panel-actions">
          {!cameraRunning ? (
            <button
              className="btn btn-primary"
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? "Starting..." : "Xem"}
            </button>
          ) : (
            <button
              className="btn btn-danger"
              onClick={handleStop}
              disabled={loading}
            >
              Stop Camera
            </button>
          )}
        </div>
      </div>

      {/* CAMERA BOX */}
      <div
        style={{
          width: "100%",
          background: "#0f172a",
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",

          /*
            GIỚI HẠN KÍCH THƯỚC
          */
          maxHeight: 420,
          minHeight: 320,
        }}
      >
        {streamUrl ? (
          <img
            src={streamUrl}
            alt="camera"
            style={{
              width: "100%",

              /*
                QUAN TRỌNG
              */
              maxWidth: 640,

              /*
                KHÔNG PHÓNG QUÁ TO
              */
              maxHeight: 420,

              objectFit: "contain",

              display: "block",
              borderRadius: 12,
            }}
          />
        ) : (
          <div
            style={{
              color: "#fff",
              opacity: 0.7,
              fontSize: 18,
            }}
          >
            Camera chưa khởi động
          </div>
        )}

        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <LoadingCamera />
          </div>
        )}
      </div>
    </div>
  );
}

export default CameraPanel;
