import React from 'react';
import useDeviceStore from '../store/deviceStore';

const badgeColors = {
  warning: 'bg-amber-500/20 text-amber-300 border border-amber-400/40',
  info: 'bg-sky-500/20 text-sky-200 border border-sky-400/40',
};

const Alerts = () => {
  const alerts = useDeviceStore((state) => state.alerts);

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg bg-slate-800 p-4 text-sm text-slate-300 shadow-md">
        All readings are within safe thresholds.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={`${alert.device_id}-${alert.timestamp}-${alert.message}`}
          className={`rounded-lg px-4 py-3 text-sm shadow-inner ${badgeColors[alert.level]}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-100">Device {alert.device_id}</p>
              <p className="text-slate-200">{alert.message}</p>
            </div>
            <span className="text-xs text-slate-300">{new Date(alert.timestamp).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Alerts;
