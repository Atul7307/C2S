import React from 'react';
import clsx from 'clsx';
import useDeviceStore from '../store/deviceStore';

const DeviceTable = () => {
  const devices = useDeviceStore((state) => state.devices);
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId);
  const setSelectedDevice = useDeviceStore((state) => state.setSelectedDevice);
  const toggleRelay = useDeviceStore((state) => state.toggleRelay);

  const handleToggle = async (event, device) => {
    event.stopPropagation();
    const nextState = device.relay_state === 'on' ? 'off' : 'on';
    await toggleRelay(device.device_id, nextState);
  };

  if (devices.length === 0) {
    return (
      <div className="rounded-lg bg-slate-800 p-6 text-center text-slate-300 shadow-md">
        No devices have reported data yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg bg-slate-800 shadow-md lg:hidden">
        <div className="divide-y divide-slate-700">
          {devices.map((device) => {
            const isSelected = device.device_id === selectedDeviceId;
            const humidity = device.last_reading?.humidity ?? '—';
            const fluoride = device.last_reading?.fluoride ?? '—';
            const lastUpdate = device.last_reading?.timestamp || device.last_seen;

            return (
              <div
                key={`${device.device_id}-card`}
                className={clsx('space-y-3 p-4 transition-colors', {
                  'bg-slate-700/30 ring-1 ring-slate-600': isSelected,
                  'hover:bg-slate-700/40': !isSelected,
                })}
                onClick={() => setSelectedDevice(device.device_id)}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{device.device_id}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{device.location}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {lastUpdate ? new Date(lastUpdate).toLocaleString() : '—'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                  <div>
                    <p className="text-xs uppercase text-slate-500">Humidity</p>
                    <p className="text-base text-slate-100">
                      {typeof humidity === 'number' ? `${humidity.toFixed(1)}%` : humidity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500">Fluoride</p>
                    <p className="text-base text-slate-100">
                      {typeof fluoride === 'number' ? `${fluoride.toFixed(2)} mg/L` : fluoride}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className={clsx(
                    'w-full rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors',
                    device.relay_state === 'on'
                      ? 'bg-emerald-500 text-slate-900 hover:bg-emerald-400'
                      : 'bg-rose-500 text-white hover:bg-rose-600',
                  )}
                  onClick={(event) => handleToggle(event, device)}
                >
                  {device.relay_state === 'on' ? 'Turn Off Relay' : 'Turn On Relay'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hidden overflow-x-auto rounded-lg bg-slate-800 shadow-md lg:block">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Device ID</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-center">Humidity (%)</th>
              <th className="px-4 py-3 text-center">Fluoride (mg/L)</th>
              <th className="px-4 py-3 text-left">Last Update</th>
              <th className="px-4 py-3 text-center">Relay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 text-sm">
            {devices.map((device) => {
              const isSelected = device.device_id === selectedDeviceId;
              const humidity = device.last_reading?.humidity ?? '—';
              const fluoride = device.last_reading?.fluoride ?? '—';
              const lastUpdate = device.last_reading?.timestamp || device.last_seen;

              return (
                <tr
                  key={device.device_id}
                  className={clsx('cursor-pointer transition-colors hover:bg-slate-700/40', {
                    'bg-slate-700/30': isSelected,
                  })}
                  onClick={() => setSelectedDevice(device.device_id)}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-100">
                    {device.device_id}
                  </td>
                  <td className="px-4 py-3 text-slate-200">{device.location}</td>
                  <td className="px-4 py-3 text-center text-slate-100">
                    {typeof humidity === 'number' ? humidity.toFixed(1) : humidity}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-100">
                    {typeof fluoride === 'number' ? fluoride.toFixed(2) : fluoride}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {lastUpdate ? new Date(lastUpdate).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      className={clsx(
                        'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors',
                        device.relay_state === 'on'
                          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30',
                      )}
                      onClick={(event) => handleToggle(event, device)}
                    >
                      {device.relay_state === 'on' ? 'On' : 'Off'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeviceTable;
