import React from 'react';
import useDeviceData from './hooks/useDeviceData';
import useDeviceStore from './store/deviceStore';
import DeviceTable from './components/DeviceTable.jsx';
import DataCharts from './components/DataCharts.jsx';
import DeviceMap from './components/DeviceMap.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import Alerts from './components/Alerts.jsx';
import StatCards from './components/StatCards.jsx';

const App = () => {
  useDeviceData();

  const loading = useDeviceStore((state) => state.loading);
  const error = useDeviceStore((state) => state.error);
  const lastUpdated = useDeviceStore((state) => state.lastUpdated);

  return (
    <div className="min-h-screen bg-slate-950 pb-12">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Smart Water Monitoring Dashboard</h1>
            <p className="text-sm text-slate-400">
              Track humidity & fluoride levels from your ESP32/NodeMCU fleet in near real-time.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            {loading ? 'Refreshing data…' : lastUpdated ? `Last synced ${new Date(lastUpdated).toLocaleTimeString()}` : 'Idle'}
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 flex max-w-7xl flex-col gap-8 px-6">
        {error ? (
          <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <StatCards />

        <section className="grid gap-8 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <DeviceTable />
          </div>
          <div className="space-y-6">
            <ControlPanel />
            <Alerts />
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <DataCharts />
          <DeviceMap />
        </section>
      </main>
    </div>
  );
};

export default App;
