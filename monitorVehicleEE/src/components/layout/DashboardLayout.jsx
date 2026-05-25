import React from "react";

import StatsCards from "../stats/StatsCards";
import CameraGrid from "../camera/CameraGrid";
import VehicleList from "../vehicle/VehicleList";
import RightSidebar from "./RightSidebar";
import AlertPanel from "../alert/AlertPanel";

function DashboardLayout() {
  return (
    <div style={{ padding: 20 }}>
      <div className="dashboard-grid">
        <div>
          <StatsCards />
          {/* <div style={{ marginTop: 20 }}>
            <AlertPanel />
          </div> */}

          <div style={{ marginTop: 20 }}>
            <CameraGrid />
          </div>
          <div style={{ marginTop: 20 }}>
            <VehicleList />
          </div>
        </div>
      </div>
    </div>
  );
}
export default DashboardLayout;
