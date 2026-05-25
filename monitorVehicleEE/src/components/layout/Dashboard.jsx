import React from "react";

import DashboardNavbar from "./DashboardNavbar";
import DashboardLayout from "./DashboardLayout";

function Dashboard({ user, onLogout }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
      }}
    >
      <DashboardNavbar user={user} onLogout={onLogout} />

      <DashboardLayout />
    </div>
  );
}

export default Dashboard;
