import React, { useMemo } from 'react';
import useDeviceStore from '../store/deviceStore';

const StatCard = ({ label, value, unit, accent }) => (
  <div className="rounded-lg bg-slate-800 p-4 shadow-md">
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className={`mt-2 text-3xl font-semibold ${accent}`}>{value}</p>
    {unit ? <span className="text-sm text-slate-400">{unit}</span> : null}
  </div>
);

const StatCards = () => {
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId);
  const readings = useDeviceStore((state) =>
    state.readings.filter((reading) => reading.device_id === state.selectedDeviceId),
  );

  const stats = useMemo(() => {
    if (readings.length === 0) {
      return null;
    }

    const latest = readings[0];
    const humidityValues = readings.map((reading) => reading.humidity).filter((value) => typeof value === 'number');
    const fluorideValues = readings.map((reading) => reading.fluoride).filter((value) => typeof value === 'number');

    const avgHumidity =
      humidityValues.length > 0
        ? humidityValues.reduce((sum, value) => sum + value, 0) / humidityValues.length
        : null;
    const avgFluoride =
      fluorideValues.length > 0
        ? fluorideValues.reduce((sum, value) => sum + value, 0) / fluorideValues.length
        : null;

    return {
      latestHumidity: latest.humidity,
      latestFluoride: latest.fluoride,
      avgHumidity,
      avgFluoride,
      lastTimestamp: latest.timestamp,
    };
  }, [readings]);

  if (!selectedDeviceId) {
    return null;
  }

  if (!stats) {
    return (
      <div className="rounded-lg bg-slate-800 p-4 text-sm text-slate-300 shadow-md">
        Waiting for readings from {selectedDeviceId}.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Latest humidity"
        value={`${stats.latestHumidity?.toFixed?.(1) ?? '—'}`}
        unit="%"
        accent="text-sky-300"
      />
      <StatCard
        label="Latest fluoride"
        value={`${stats.latestFluoride?.toFixed?.(2) ?? '—'}`}
        unit="mg/L"
        accent="text-amber-300"
      />
      <StatCard
        label="Average humidity"
        value={`${stats.avgHumidity?.toFixed?.(1) ?? '—'}`}
        unit="%"
        accent="text-emerald-300"
      />
      <StatCard
        label="Average fluoride"
        value={`${stats.avgFluoride?.toFixed?.(2) ?? '—'}`}
        unit="mg/L"
        accent="text-rose-300"
      />
    </div>
  );
};

export default StatCards;
