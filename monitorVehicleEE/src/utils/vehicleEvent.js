export const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "N/A";
  return `${(numericValue * 100).toFixed(1)}%`;
};

export const getVehicleConfidence = (event) => {
  return event?.vehicle_confidence ?? event?.confidence ?? null;
};

export const getPlateConfidence = (event) => {
  return event?.plate_confidence ?? event?.plate?.confidence ?? null;
};

export const getEventTime = (event) => {
  return event?.event_time ?? event?.timestamp ?? null;
};

export const formatEventStatus = (status) => {
  const statusMap = {
    0: "Chờ xác nhận",
    1: "Tự động duyệt",
    2: "Đã xác nhận",
    PENDING: "Chờ xác nhận",
    AUTO_APPROVED: "Tự động duyệt",
    MANUAL_APPROVED: "Đã xác nhận",
    REJECTED: "Đã từ chối",
  };

  return statusMap[status] || status || "N/A";
};

export const formatEventType = (eventType) => {
  const eventTypeMap = {
    IN: "Vào",
    OUT: "Ra",
    DETECTED: "Phát hiện",
  };

  return eventTypeMap[eventType] || eventType || "N/A";
};
