import { useEffect } from 'react';
import useDeviceStore from '../store/deviceStore';

const POLL_INTERVAL_MS = 10_000;

const useDeviceData = () => {
  const devices = useDeviceStore((state) => state.devices);
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId);
  const setSelectedDevice = useDeviceStore((state) => state.setSelectedDevice);
  const fetchDevices = useDeviceStore((state) => state.fetchDevices);
  const fetchReadings = useDeviceStore((state) => state.fetchReadings);

  useEffect(() => {
    let isMounted = true;

    const prime = async () => {
      const nextSelection = await fetchDevices();
      if (isMounted) {
        await fetchReadings(nextSelection || selectedDeviceId);
      }
    };

    prime();

    const interval = setInterval(async () => {
      const nextSelection = await fetchDevices();
      await fetchReadings(nextSelection || selectedDeviceId);
    }, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchDevices, fetchReadings, selectedDeviceId]);

  useEffect(() => {
    if (!selectedDeviceId && devices.length > 0) {
      setSelectedDevice(devices[0].device_id);
    }
  }, [devices, selectedDeviceId, setSelectedDevice]);
};

export default useDeviceData;
