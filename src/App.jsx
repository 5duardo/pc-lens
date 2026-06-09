import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './icons.jsx';
import logoUrl from './assets/logo.webp';
import { useStaticInfo, useRealtime, useProcesses } from './hooks/useHardware.js';
import { useTheme } from './hooks/useTheme.js';
import { formatUptime } from './utils.js';
import CpuPanel from './panels/CpuPanel.jsx';
import GpuPanel from './panels/GpuPanel.jsx';
import RamPanel from './panels/RamPanel.jsx';
import StoragePanel from './panels/StoragePanel.jsx';
import SystemPanel from './panels/SystemPanel.jsx';
import NetPanel from './panels/NetPanel.jsx';
import ProcessPanel from './panels/ProcessPanel.jsx';
import DisplayPanel from './panels/DisplayPanel.jsx';
import HomePanel from './panels/HomePanel.jsx';
import PeripheralsPanel from './panels/PeripheralsPanel.jsx';
import SettingsPanel from './panels/SettingsPanel.jsx';

const TABS = [
  { id: 'home', label: 'Inicio', icon: 'home' },
  { id: 'cpu', label: 'Procesador', icon: 'cpu' },
  { id: 'gpu', label: 'Gráficas', icon: 'gpu' },
  { id: 'ram', label: 'RAM', icon: 'ram' },
  { id: 'storage', label: 'Almacenamiento', icon: 'storage' },
  { id: 'display', label: 'Pantallas', icon: 'display' },
  { id: 'periph', label: 'Periféricos', icon: 'device' },
  { id: 'system', label: 'Placa y Sistema', icon: 'board' },
  { id: 'net', label: 'Red', icon: 'net' },
  { id: 'proc', label: 'Procesos', icon: 'proc' },
  { id: 'settings', label: 'Ajustes', icon: 'settings' }
];

export default function App() {
  const [tab, setTab] = useState('home');
  const [uptime, setUptime] = useState(0);
  const staticInfo = useStaticInfo();
  const { data, history } = useRealtime();
  const proc = useProcesses(tab === 'proc');
  const { isLight, toggleTheme } = useTheme();
  const notified = useRef(false);

  // Sync uptime y avanzar cada segundo
  useEffect(() => {
    if (data?.uptime) setUptime(data.uptime);
  }, [data?.uptime]);

  useEffect(() => {
    const t = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Avisa al proceso principal cuando ya hay datos -> cierra splash y muestra ventana
  useEffect(() => {
    if (!notified.current && staticInfo && data) {
      notified.current = true;
      window.hardware?.notifyReady?.();
    }
  }, [staticInfo, data]);

  const sys = staticInfo?.system || {};
  const machineName = `${sys.manufacturer || ''} ${sys.model || ''}`.trim() || 'Equipo desconocido';
  const hasError = data?.error;

  const panelProps = { staticInfo, data, history };

  return (
    <div className="min-h-full flex flex-col">
      {/* Topbar */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-edge bg-card sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-[14px]">
          <div className="relative">
            <img src={logoUrl} alt="PC Lens" className="w-[42px] h-[42px] object-contain drop-shadow-md" />
            <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full -z-10"></div>
          </div>
          <div>
            <h1 className="text-[20px] font-extrabold tracking-tight flex items-center gap-1">
              PC <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent2">Lens</span>
            </h1>
            <p className="text-[12px] text-muted mt-[1px] font-medium">{machineName}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-[2px]">Tiempo de actividad</span>
            <span className="text-[14px] font-bold text-txt font-mono tracking-tight">{formatUptime(uptime)}</span>
          </div>
          <div className="h-[28px] w-px bg-edge opacity-60" />
          <div className={`flex items-center gap-[6px] px-3 py-1.5 rounded-full border text-[12px] font-bold transition-colors ${
            hasError ? 'bg-danger/10 text-danger border-danger/20' : 'bg-accent/10 text-accent border-accent/20'
          }`}>
            <span className="relative flex h-2 w-2">
              {!hasError && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${hasError ? 'bg-danger' : 'bg-accent'}`}></span>
            </span>
            {hasError ? 'Desconectado' : 'Monitor activo'}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex items-center px-[22px] border-b border-edge bg-card overflow-x-auto sticky top-[73px] z-10">
        <div className="flex gap-[2px] flex-1 py-[8px]">
          {TABS.filter((t) => t.id !== 'settings').map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`nav-tab ${active ? 'nav-tab-active' : ''}`}
              >
                <Icon name={t.icon} className="w-4 h-4" strokeWidth={active ? 2.2 : 1.7} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Separador + botón de Ajustes diferenciado */}
        <div className="h-[24px] w-px bg-edge mx-[10px] shrink-0" />
        <button
          onClick={() => setTab('settings')}
          className={`nav-settings ${tab === 'settings' ? 'nav-settings-active' : ''}`}
          title="Ajustes"
        >
          <Icon name="settings" className="w-[18px] h-[18px]" strokeWidth={tab === 'settings' ? 2.2 : 1.7} />
        </button>
      </nav>

      {/* Content */}
      <main className="p-[22px] max-w-[1000px] mx-auto w-full flex-1">
        {tab === 'home' && <HomePanel {...panelProps} />}
        {tab === 'cpu' && <CpuPanel {...panelProps} />}
        {tab === 'gpu' && <GpuPanel {...panelProps} />}
        {tab === 'ram' && <RamPanel {...panelProps} />}
        {tab === 'storage' && <StoragePanel {...panelProps} />}
        {tab === 'display' && <DisplayPanel staticInfo={staticInfo} />}
        {tab === 'periph' && <PeripheralsPanel staticInfo={staticInfo} />}
        {tab === 'system' && <SystemPanel {...panelProps} />}
        {tab === 'net' && <NetPanel {...panelProps} />}
        {tab === 'proc' && <ProcessPanel staticInfo={staticInfo} proc={proc} />}
        {tab === 'settings' && (
          <SettingsPanel isLight={isLight} onToggleTheme={toggleTheme} />
        )}
      </main>

      {/* Footer */}
      <footer className="flex justify-between px-6 py-3 text-[12px] text-muted border-t border-edge">
        <span className="text-danger">{hasError || ''}</span>
        <span>Actualización cada 1.5s · systeminformation</span>
      </footer>
    </div>
  );
}
