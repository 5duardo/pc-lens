import React from 'react';
import { Card, Badge } from '../components/ui.jsx';
import { Icon } from '../icons.jsx';
import { useUpdater } from '../hooks/useUpdater.js';

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-[46px] h-[26px] rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-edge'
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-[3px] left-[3px] w-[20px] h-[20px] bg-white rounded-full transition-transform ${
          checked ? 'translate-x-[20px]' : ''
        }`}
      />
    </button>
  );
}

function UpdateStatus({ status, info, onDownload, onInstall, onCheck }) {
  switch (status) {
    case 'checking':
      return <span className="text-[12.5px] text-muted">Comprobando actualizaciones...</span>;
    case 'available':
      return (
        <div className="flex items-center gap-3">
          <span className="text-[12.5px] text-accent">
            Nueva versión disponible: v{info.version}
          </span>
          <button
            onClick={onDownload}
            className="text-[12px] font-semibold bg-accent text-white rounded-lg px-[12px] py-[5px]"
          >
            Descargar
          </button>
        </div>
      );
    case 'downloading':
      return (
        <div className="w-full">
          <div className="text-[12.5px] text-muted mb-[5px]">
            Descargando... {info.percent || 0}%
          </div>
          <div className="h-2 bg-track border border-edge rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${info.percent || 0}%` }}
            />
          </div>
        </div>
      );
    case 'downloaded':
      return (
        <div className="flex items-center gap-3">
          <span className="text-[12.5px] text-accent">Listo para instalar v{info.version}</span>
          <button
            onClick={onInstall}
            className="text-[12px] font-semibold bg-accent text-white rounded-lg px-[12px] py-[5px]"
          >
            Reiniciar e instalar
          </button>
        </div>
      );
    case 'not-available':
      return <span className="text-[12.5px] text-muted">Ya tienes la última versión.</span>;
    case 'error':
      return (
        <div className="flex items-center gap-3">
          <span className="text-[12.5px] text-danger">Error: {info.message || 'desconocido'}</span>
          <button
            onClick={onCheck}
            className="text-[12px] font-semibold border border-edge rounded-lg px-[12px] py-[5px] text-muted hover:text-txt"
          >
            Reintentar
          </button>
        </div>
      );
    default:
      return (
        <button
          onClick={onCheck}
          className="inline-flex items-center gap-[6px] text-[12.5px] font-semibold border border-edge rounded-lg px-[12px] py-[6px] text-muted hover:text-txt transition-colors"
        >
          <Icon name="refresh" className="w-[14px] h-[14px]" />
          Buscar actualizaciones
        </button>
      );
  }
}

export default function SettingsPanel({ isLight, onToggleTheme }) {
  const { version, status, info, check, download, install } = useUpdater();

  return (
    <div className="flex flex-col gap-[18px]">
      <Card icon="settings" title="Apariencia">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-[10px]">
            <Icon name={isLight ? 'sun' : 'moon'} className="w-[18px] h-[18px] text-muted" />
            <div>
              <div className="text-[13.5px] font-semibold">Modo claro</div>
              <div className="text-[12px] text-muted">
                Cambia entre tema oscuro y claro
              </div>
            </div>
          </div>
          <Toggle checked={isLight} onChange={onToggleTheme} />
        </div>
      </Card>

      <Card
        icon="settings"
        title="Actualizaciones"
        badge={version ? <Badge>v{version}</Badge> : null}
      >
        <div className="flex flex-col gap-[14px]">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div>
              <div className="text-[13.5px] font-semibold">Versión instalada</div>
              <div className="text-[12px] text-muted">PC Lens v{version || '--'}</div>
            </div>
            <UpdateStatus
              status={status}
              info={info}
              onDownload={download}
              onInstall={install}
              onCheck={check}
            />
          </div>
          <div className="text-[11.5px] text-muted border-t border-edge pt-[12px]">
            Las actualizaciones se descargan desde GitHub Releases. PC Lens comprueba
            automáticamente al iniciar.
          </div>
        </div>
      </Card>

      <Card icon="settings" title="Acerca de">
        <div className="text-[13px] text-muted leading-relaxed">
          <b className="text-txt">PC Lens</b> — Visualizador de componentes de PC en tiempo real.
          <br />
          Construido con Electron, React y systeminformation.
        </div>
      </Card>
    </div>
  );
}
