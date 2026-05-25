export const VEHICLE_TYPES = [
  { value: 'motorbike', label: 'Xe máy' },
  { value: 'car', label: 'Ô tô con' },
  { value: 'truck', label: 'Xe tải' },
  { value: 'container', label: 'Xe container' },
];

const VEHICLE_LABELS = {
  motorbike: 'Xe máy',
  motorcycle: 'Xe máy',
  car: 'Ô tô con',
  truck: 'Xe tải',
  container: 'Xe container',
};

export function formatVehicleType(type) {
  return VEHICLE_LABELS[type] || 'Không xác định';
}

export function getVehicleCount(byType, keys) {
  return keys.reduce((total, key) => total + (byType?.[key] || 0), 0);
}

export function formatVietnamDateTime(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export function formatVietnamTime(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export function getVietnamDateString(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
