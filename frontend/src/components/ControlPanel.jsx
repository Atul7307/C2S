import React, { useState } from 'react';
import useDeviceStore from '../store/deviceStore';

const ControlPanel = () => {
  const [saving, setSaving] = useState(false);
  const devices = useDeviceStore((state) => state.devices);
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId);
  const setSelectedDevice = useDeviceStore((state) => state.setSelectedDevice);
  const toggleRelay = useDeviceStore((state) => state.toggleRelay);

  const selectedDevice = devices.find((device) => device.device_id === selectedDeviceId);

  const handleToggle = async () => {
    if (!selectedDevice) {
      return;
    }
    setSaving(true);
    const nextState = selectedDevice.relay_state === 'on' ? 'off' : 'on';
    try {
      await toggleRelay(selectedDevice.device_id, nextState);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg bg-slate-800 p-4 shadow-md">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold text-slate-100">Control Panel</h3>
        <select
          value={selectedDeviceId || ''}
          onChange={(event) => setSelectedDevice(event.target.value)}
          className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none sm:w-auto"
        >
          <option value="" disabled>
            Select device
          </option>
          {devices.map((device) => (
            <option key={device.device_id} value={device.device_id}>
              {device.device_id} • {device.location}
            </option>
          ))}
        </select>
      </div>

      {selectedDevice ? (
        <div className="space-y-3 text-sm text-slate-200">
          <p>
            <span className="text-slate-400">Location:</span> {selectedDevice.location}
          </p>
          <p>
            <span className="text-slate-400">Last seen:</span>{' '}
            {selectedDevice.last_seen ? new Date(selectedDevice.last_seen).toLocaleString() : '—'}
          </p>
          <button
            type="button"
            onClick={handleToggle}
            disabled={saving}
            className={`mt-4 w-full rounded-md py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
              selectedDevice.relay_state === 'on'
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400'
            } ${saving ? 'opacity-70' : ''}`}
          >
            {saving ? 'Updating…' : selectedDevice.relay_state === 'on' ? 'Turn Off Relay' : 'Turn On Relay'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-300">Select a device to issue commands.</p>
      )}
    </div>
  );
};

export default ControlPanel;
