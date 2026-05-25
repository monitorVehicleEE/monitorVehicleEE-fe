import React from "react";

import CameraCard from "./CameraCard";

function CameraGrid() {
  return (
    <div className="camera-grid">
      <CameraCard camId="27" title="Camera Cổng Vào" />

      <CameraCard camId="2" title="Camera Cổng Ra" />

      <CameraCard camId="1" title="Tuyến đường 1" />
    </div>
  );
}

export default CameraGrid;
