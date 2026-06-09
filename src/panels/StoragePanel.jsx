import React from 'react';
import { Card, Bar } from '../components/ui.jsx';
import { bytesToGB, loadColor } from '../utils.js';

function formatSpeed(bytesPerSec) {
  if (bytesPerSec >= 1024 * 1024 * 1024) return `${(bytesPerSec / (1024 * 1024 * 1024)).toFixed(1)} GB/s`;
  if (bytesPerSec >= 1024 * 1024) return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  return `${bytesPerSec} B/s`;
}

export default function StoragePanel({ staticInfo, data }) {
  const fsList = data?.fsSize || [];
  const diskActivity = data?.diskActivity || [];
  const layout = staticInfo?.diskLayout || [];
  const blocks = staticInfo?.blockDevices || [];

  // Mapa mount -> label para mostrar nombre de volumen
  const labelMap = {};
  for (const b of blocks) {
    if (b.mount && b.label) {
      labelMap[b.mount] = b.label;
    }
  }

  // Mapa mount -> actividad de disco
  const activityMap = {};
  for (const d of diskActivity) {
    activityMap[d.name] = d;
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <Card icon="storage" title="Volúmenes">
        <div className="flex flex-col gap-[18px]">
          {fsList.length === 0 && <div className="text-[12.5px] text-muted">Sin datos.</div>}
          {fsList.map((d, i) => {
            const pct = Math.round(d.use || 0);
            const mount = d.mount || d.fs || `Disco ${i}`;
            const label = labelMap[mount];
            const displayName = label ? `${label} (${mount})` : mount;
            const activity = activityMap[mount] || {};
            const actPct = Math.round(activity.activity || 0);

            return (
              <div key={i} className="pb-[14px] border-b border-edge last:border-0 last:pb-0">
                <div className="flex justify-between text-[13px] mb-[6px]">
                  <span className="font-semibold">{displayName}</span>
                  <span className="text-muted">
                    {bytesToGB(d.used)} / {bytesToGB(d.size)} GB
                  </span>
                </div>
                <div className="mb-[8px]">
                  <div className="flex justify-between text-[11.5px] text-muted mb-[3px]">
                    <span>Espacio usado</span>
                    <span>{pct}%</span>
                  </div>
                  <Bar value={pct} color={loadColor(pct)} />
                </div>
                <div>
                  <div className="flex justify-between text-[11.5px] text-muted mb-[3px]">
                    <span>Actividad</span>
                    <span className="flex gap-3">
                      <span>R: {formatSpeed(activity.readSpeed || 0)}</span>
                      <span>W: {formatSpeed(activity.writeSpeed || 0)}</span>
                      <span>{actPct}%</span>
                    </span>
                  </div>
                  <Bar value={actPct} color={loadColor(actPct)} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {layout.length > 0 && (
        <Card icon="storage" title="Discos físicos">
          <div className="flex flex-col gap-[14px]">
            {layout.map((d, i) => (
              <div key={i} className="text-[13px]">
                <div className="font-semibold">{d.name || `Disco ${i}`}</div>
                <div className="text-muted text-[12.5px] mt-1">
                  {d.type || ''} {d.interfaceType ? `· ${d.interfaceType}` : ''} ·{' '}
                  {bytesToGB(d.size)} GB
                  {d.vendor ? ` · ${d.vendor}` : ''}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
