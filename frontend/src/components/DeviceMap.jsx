import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';
import useDeviceStore from '../store/deviceStore';

const markerIcon = new L.Icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const fallbackCoordinates = {
  'Gorakhpur District': { lat: 26.7606, lng: 83.3732 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Varanasi': { lat: 25.3176, lng: 82.9739 },
  'Prayagraj': { lat: 25.4480, lng: 81.8462 } 
};

const extractCoordinates = (device) => {
  if (device.metadata?.coordinates) {
    const { lat, lng } = device.metadata.coordinates;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng };
    }
  }
  if (typeof device.metadata?.lat === 'number' && typeof device.metadata?.lng === 'number') {
    return { lat: device.metadata.lat, lng: device.metadata.lng };
  }
  if (fallbackCoordinates[device.location]) {
    return fallbackCoordinates[device.location];
  }
  return null;
};

const DeviceMap = () => {
  const devices = useDeviceStore((state) => state.devices);

  const markers = useMemo(
    () =>
      devices
        .map((device) => ({
          device,
          coords: extractCoordinates(device),
        }))
        .filter((entry) => entry.coords),
    [devices],
  );

  if (typeof window === 'undefined') {
    return null;
  }

  if (markers.length === 0) {
    return (
      <div className="rounded-lg bg-slate-800 p-4 text-sm text-slate-300 shadow-md">
        Provide coordinates in device metadata to unlock the map view.
      </div>
    );
  }

  const center = markers[0].coords;

  return (
    <div className="h-[320px] overflow-hidden rounded-lg shadow-md">
      <MapContainer center={center} zoom={6} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map(({ device, coords }) => (
          <Marker key={device.device_id} position={coords} icon={markerIcon}>
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">Device {device.device_id}</p>
                <p>Location: {device.location}</p>
                {device.last_reading ? (
                  <>
                    <p>Humidity: {device.last_reading.humidity?.toFixed?.(1)}%</p>
                    <p>Fluoride: {device.last_reading.fluoride?.toFixed?.(2)} mg/L</p>
                  </>
                ) : (
                  <p>No readings yet</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default DeviceMap;
