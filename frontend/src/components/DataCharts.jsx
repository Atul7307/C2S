import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import useDeviceStore from '../store/deviceStore';

const formatTimestamp = (value) => new Date(value).toLocaleTimeString();

const DataCharts = ({ className = '' }) => {
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId);
  const readings = useDeviceStore((state) =>
    state.readings.filter((reading) => reading.device_id === state.selectedDeviceId),
  );

  const chartData = useMemo(
    () =>
      readings
        .slice()
        .reverse()
        .map((reading) => ({
          ...reading,
          timestampLabel: formatTimestamp(reading.timestamp),
        })),
    [readings],
  );

  if (!selectedDeviceId) {
    return (
      <div className={`rounded-lg bg-slate-800 p-6 text-center text-slate-300 shadow-md ${className}`}>
        Select a device to view detailed trends.
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className={`rounded-lg bg-slate-800 p-6 text-center text-slate-300 shadow-md ${className}`}>
        No readings available yet for {selectedDeviceId}.
      </div>
    );
  }

  return (
    <div className={`grid gap-6 md:grid-cols-2 ${className}`}>
      <div className="rounded-lg bg-slate-800 p-4 shadow-md">
        <h3 className="mb-2 text-sm font-semibold text-slate-300">Humidity</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="timestampLabel" stroke="#94a3b8" />
            <YAxis domain={[0, 100]} stroke="#94a3b8" unit="%" />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }}
            />
            <Legend />
            <Line type="monotone" dataKey="humidity" stroke="#38bdf8" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg bg-slate-800 p-4 shadow-md">
        <h3 className="mb-2 text-sm font-semibold text-slate-300">Fluoride</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="timestampLabel" stroke="#94a3b8" />
            <YAxis domain={[0, 'auto']} stroke="#94a3b8" unit=" mg/L" />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }}
            />
            <Legend />
            <Line type="monotone" dataKey="fluoride" stroke="#f97316" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DataCharts;
