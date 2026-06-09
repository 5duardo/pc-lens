import React from 'react';
import { Badge, Tag, Bar } from '../components/ui.jsx';
import { Icon } from '../icons.jsx';
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
    <div className="flex flex-col gap-[32px]">
      {/* Volúmenes */}
      <section>
        <div className="flex items-center gap-3 mb-[18px]">
          <div className="p-2 bg-accent/10 rounded-lg text-accent">
            <Icon name="storage" className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[18px] font-black tracking-tight text-txt">Volúmenes Lógicos</h2>
          <Badge tone="blue">{fsList.length}</Badge>
        </div>

        {fsList.length === 0 ? (
          <div className="text-[13.5px] text-muted font-medium p-5 bg-card2 rounded-2xl border border-edge text-center">No se detectaron volúmenes.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[18px]">
            {fsList.map((d, i) => {
              const pct = Math.round(d.use || 0);
              const mount = d.mount || d.fs || `Disco ${i}`;
              const label = labelMap[mount];
              const displayName = label ? label : 'Disco Local';
              const activity = activityMap[mount] || {};
              const actPct = Math.round(activity.activity || 0);

              return (
                <div key={i} className="flex flex-col p-[22px] bg-card2 border border-edge rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-[0.15] transition-opacity duration-300 bg-accent"></div>
                  
                  <div className="flex items-center gap-4 mb-5 relative z-10">
                    <div className="w-[48px] h-[48px] rounded-xl flex items-center justify-center bg-accent text-card shadow-sm shrink-0">
                      <Icon name="storage" className="w-[24px] h-[24px]" strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] font-extrabold text-txt truncate">{displayName}</div>
                      <div className="text-[13px] font-mono text-muted font-bold mt-0.5">{mount}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 relative z-10">
                    <div>
                      <div className="flex justify-between text-[12.5px] text-muted font-medium mb-[6px]">
                        <span>Espacio ({bytesToGB(d.used)} / {bytesToGB(d.size)} GB)</span>
                        <span className="font-bold text-txt">{pct}%</span>
                      </div>
                      <Bar value={pct} color={loadColor(pct)} />
                    </div>

                    <div className="pt-4 border-t border-edge">
                      <div className="flex justify-between text-[12.5px] text-muted font-medium mb-[6px]">
                        <span>Actividad</span>
                        <span className="font-bold text-txt">{actPct}%</span>
                      </div>
                      <Bar value={actPct} color={loadColor(actPct)} />
                      <div className="flex justify-between text-[11.5px] font-mono text-muted mt-[8px]">
                        <span>R: {formatSpeed(activity.readSpeed || 0)}</span>
                        <span>W: {formatSpeed(activity.writeSpeed || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Discos Físicos */}
      {layout.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-[18px]">
            <div className="p-2 bg-gpu/10 rounded-lg text-gpu">
              <Icon name="board" className="w-[18px] h-[18px]" strokeWidth={2.5} />
            </div>
            <h2 className="text-[18px] font-black tracking-tight text-txt">Discos Físicos</h2>
            <Badge tone="pink">{layout.length}</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
            {layout.map((d, i) => (
              <div key={i} className="flex items-center gap-5 p-[20px] bg-card2 border border-edge rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-[0.15] transition-opacity duration-300 bg-gpu"></div>
                
                <div className="w-[46px] h-[46px] rounded-xl flex items-center justify-center bg-gpu/10 text-gpu shrink-0">
                  <Icon name="storage" className="w-[22px] h-[22px]" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14.5px] font-extrabold text-txt truncate" title={d.name}>{d.name || `Disco físico ${i}`}</div>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    {d.type && <Tag tone="base">{d.type}</Tag>}
                    {d.interfaceType && <Tag tone="blue">{d.interfaceType}</Tag>}
                    <Badge tone="base">{bytesToGB(d.size)} GB</Badge>
                  </div>
                  {d.vendor && <div className="text-[12px] text-muted mt-[6px] truncate">{d.vendor}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
