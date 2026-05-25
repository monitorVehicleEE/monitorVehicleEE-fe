// components/vehicle/VehicleList.jsx
import React, { useState, useMemo } from "react";

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "in", label: "Xe vào cổng" },
  { key: "out", label: "Xe ra cổng" },
  { key: "route", label: "Tuyến đường" },
];

// Demo data – sau này thay bằng props từ API
const MOCK_VEHICLES = [
  {
    id: 1,
    plate: "VN-ABC123",
    driver: "Nguyễn Văn A",
    direction: "IN", // IN / OUT
    gate: "Cổng A",
    route: "Tuyến 1",
    time: "08:32",
    status: "normal", // normal / moving / warning
  },
  {
    id: 2,
    plate: "VN-XYZ789",
    driver: "Trần Văn B",
    direction: "OUT",
    gate: "Cổng A",
    route: "Tuyến 2",
    time: "09:15",
    status: "moving",
  },
  {
    id: 3,
    plate: "VN-DEF456",
    driver: "Lê Thị C",
    direction: "IN",
    gate: "Cổng B",
    route: "Tuyến 3",
    time: "09:40",
    status: "warning",
  },
];

function VehicleList({ vehicles = MOCK_VEHICLES }) {
  const [activeTab, setActiveTab] = useState("all");

  const filteredVehicles = useMemo(() => {
    switch (activeTab) {
      case "in":
        return vehicles.filter((v) => v.direction === "IN");
      case "out":
        return vehicles.filter((v) => v.direction === "OUT");
      case "route":
        // ví dụ: lọc theo các xe đang chạy trên tuyến (status = moving)
        return vehicles.filter((v) => v.status === "moving");
      case "all":
      default:
        return vehicles;
    }
  }, [vehicles, activeTab]);

  return (
    <div className="vehicle-list">
      <div className="vehicle-list-header">
        <h4>Danh sách xe</h4>
        <button className="vehicle-list-link">Xem tất cả &gt;</button>
      </div>

      {/* Tabs */}
      <div className="vehicle-tab">
        <ul>
          {TABS.map((tab) => (
            <li
              key={tab.key}
              className={tab.key === activeTab ? "active" : ""}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </li>
          ))}
        </ul>
      </div>

      {/* List */}
      <div className="vehicle-items">
        {filteredVehicles.map((v) => (
          <div key={v.id} className="vehicle-item">
            <div className="vehicle-item-main">
              {/* Icon / avatar placeholder */}
              <div className="vehicle-icon">
                {/* Có thể thay bằng icon SVG sau */}
                <span>🚗</span>
              </div>

              <div className="vehicle-info">
                <div className="vehicle-plate">{v.plate}</div>
                <div className="vehicle-meta">
                  <span>{v.driver}</span>
                  <span className="dot">•</span>
                  <span>{v.gate}</span>
                  <span className="dot">•</span>
                  <span>{v.route}</span>
                </div>
                <div className="vehicle-meta">
                  <span>{v.time}</span>
                  <span className="dot">•</span>
                  <span>
                    {v.direction === "IN" ? "Xe vào cổng" : "Xe ra cổng"}
                  </span>
                </div>
              </div>
            </div>

            {/* Trạng thái màu theo image */}
            <div className="vehicle-status-wrapper">
              {v.status === "normal" && (
                <span className="vehicle-status badge-normal">Đang đỗ</span>
              )}
              {v.status === "moving" && (
                <span className="vehicle-status badge-moving">Chuyển động</span>
              )}
              {v.status === "warning" && (
                <span className="vehicle-status badge-warning">Cảnh báo</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VehicleList;
