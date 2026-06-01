export const VEHICLE_TYPES = [
  { value: "motorbike", label: "Xe máy" },
  { value: "car", label: "Ô tô con" },
  { value: "truck", label: "Xe tải" },
  { value: "container", label: "Xe container" },
];

const VEHICLE_LABELS = {
  1: "Xe máy",
  2: "Ô tô con",
  3: "Xe tải",
  4: "Xe container",

  motorbike: "Xe máy",
  motorcycle: "Xe máy",
  xm: "Xe máy",

  car: "Ô tô con",
  oto: "Ô tô con",

  truck: "Xe tải",
  xt: "Xe tải",
  "xe-tai": "Xe tải",

  container: "Xe container",
  xctn: "Xe container",
  "xe-container": "Xe container",

  unknown: "Không xác định",
};

export function formatVehicleType(type) {
  const key = String(type || "")
    .trim()
    .toLowerCase();
  return VEHICLE_LABELS[key] || "Không xác định";
}

export function getVehicleCount(byType, keys) {
  const aliases = {
    motorbike: ["motorbike", "motorcycle", "XM", "xm", 1, "1"],
    motorcycle: ["motorbike", "motorcycle", "XM", "xm", 1, "1"],
    car: ["car", "oto", "OTO", 2, "2"],
    truck: ["truck", "xe-tai", "XT", "xt", 3, "3"],
    container: ["container", "xe-container", "XCTN", "xctn", 4, "4"],
  };

  return keys.reduce((total, key) => {
    const lookupKeys = aliases[key] || [key];
    const uniqueLookupKeys = [...new Set(lookupKeys.map((lookupKey) => String(lookupKey)))];
    return (
      total +
      uniqueLookupKeys.reduce((sum, lookupKey) => sum + (byType?.[lookupKey] || 0), 0)
    );
  }, 0);
}

export function formatVietnamDateTime(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

export function formatVietnamTime(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

export function getVietnamDateString(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
