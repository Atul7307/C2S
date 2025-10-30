import { create } from 'zustand';
import { getDevices, getDeviceReadings, updateRelayState } from '../services/api';

const SAFE_RANGES = {
  humidity: { min: 30, max: 70 },
  fluoride: { max: 1.5 },
};

const formatAlert = (device, reading, type, value) => {
  const base = {
    device_id: device.device_id,
    location: device.location,
    timestamp: reading?.timestamp || device.last_seen,
    value,
  };
  switch (type) {
    case 'fluoride':
      return { ...base, level: 'warning', message: `Fluoride ${value.toFixed(2)} mg/L exceeds safe limit` };
    case 'humidity-high':
      return { ...base, level: 'info', message: `Humidity ${value.toFixed(1)}% above ${SAFE_RANGES.humidity.max}%` };
    case 'humidity-low':
      return { ...base, level: 'info', message: `Humidity ${value.toFixed(1)}% below ${SAFE_RANGES.humidity.min}%` };
    default:
      return null;
  }
};

const computeAlerts = (devices, readingsMap) => {
  const alerts = [];

  devices.forEach((device) => {
    const reading = readingsMap[device.device_id] || device.last_reading;
    if (!reading) {
      return;
    }

    if (typeof reading.fluoride === 'number' && reading.fluoride > SAFE_RANGES.fluoride.max) {
      alerts.push(formatAlert(device, reading, 'fluoride', reading.fluoride));
    }

    if (typeof reading.humidity === 'number') {
      if (reading.humidity > SAFE_RANGES.humidity.max) {
        alerts.push(formatAlert(device, reading, 'humidity-high', reading.humidity));
      }
      if (reading.humidity < SAFE_RANGES.humidity.min) {
        alerts.push(formatAlert(device, reading, 'humidity-low', reading.humidity));
      }
    }
  });

  return alerts;
};

const buildReadingsMap = (readings) =>
  readings.reduce((acc, reading) => {
    if (!acc[reading.device_id] || new Date(acc[reading.device_id].timestamp) < new Date(reading.timestamp)) {
      acc[reading.device_id] = reading;
    }
    return acc;
  }, {});

const useDeviceStore = create((set, get) => ({
  devices: [],
  readings: [],
  selectedDeviceId: null,
  alerts: [],
  loading: false,
  error: null,
  lastUpdated: null,

  setSelectedDevice: (deviceId) => set({ selectedDeviceId: deviceId }),

  fetchDevices: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getDevices();
      const devices = response.data.devices || [];
      const currentSelection = get().selectedDeviceId;
      const nextSelection = currentSelection && devices.some((d) => d.device_id === currentSelection)
        ? currentSelection
        : devices[0]?.device_id || null;

      const readingsMap = buildReadingsMap(get().readings);
      const alerts = computeAlerts(devices, readingsMap);

      set({
        devices,
        selectedDeviceId: nextSelection,
        alerts,
        lastUpdated: new Date().toISOString(),
        loading: false,
      });

      return nextSelection;
    } catch (error) {
      set({ error: error.message || 'Failed to fetch devices', loading: false });
      throw error;
    }
  },

  fetchReadings: async (deviceId, limit = 50) => {
    if (!deviceId) {
      return [];
    }

    try {
      const response = await getDeviceReadings(deviceId, limit);
      const readings = response.data.readings || [];
      const allReadings = [...get().readings.filter((r) => r.device_id !== deviceId), ...readings];
      const readingsMap = buildReadingsMap(allReadings);
      const alerts = computeAlerts(get().devices, readingsMap);

      set({ readings: allReadings, alerts, lastUpdated: new Date().toISOString() });

      return readings;
    } catch (error) {
      set({ error: error.message || 'Failed to fetch readings' });
      throw error;
    }
  },

  toggleRelay: async (deviceId, desiredState) => {
    if (!deviceId) {
      return null;
    }

    await updateRelayState(deviceId, desiredState);

    set((state) => ({
      devices: state.devices.map((device) =>
        device.device_id === deviceId ? { ...device, relay_state: desiredState, last_seen: new Date().toISOString() } : device,
      ),
    }));

    return desiredState;
  },
}));

export default useDeviceStore;
