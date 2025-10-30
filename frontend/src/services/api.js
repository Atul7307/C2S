import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000/api',
  timeout: 8000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // eslint-disable-next-line no-console
      console.error('API error:', error.response.status, error.response.data);
    } else {
      // eslint-disable-next-line no-console
      console.error('Network error:', error.message);
    }
    return Promise.reject(error);
  },
);

export const getDevices = () => api.get('/devices');

export const getDeviceReadings = (deviceId, limit = 20) =>
  api.get(`/data/${encodeURIComponent(deviceId)}`, {
    params: { limit },
  });

export const updateRelayState = (deviceId, relayState) =>
  api.put(`/devices/led/${encodeURIComponent(deviceId)}`, { relay_state: relayState });

export default api;
