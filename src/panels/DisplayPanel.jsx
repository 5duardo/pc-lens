import React from 'react';
import { Card, Badge, Tag, KV } from '../components/ui.jsx';

export default function DisplayPanel({ staticInfo }) {
  const displays = staticInfo?.displays || [];

  return (
    <div className="flex flex-col gap-[18px]">
      <Card
        icon="display"
        title="Pantallas"
        badge={
          <Badge>{displays.length === 1 ? '1 pantalla' : `${displays.length} pantallas`}</Badge>
        }
      >
        {displays.length === 0 ? (
          <div className="text-[12.5px] text-muted">No se detectaron pantallas.</div>
        ) : (
          <div className="flex flex-col gap-[24px]">
            {displays.map((d, i) => {
              const name = d.model && d.model !== 'Monitor predeterminado'
                ? d.model
                : `Pantalla ${i + 1}`;
              // Tamaño físico en pulgadas (diagonal) a partir de sizeX/sizeY en cm
              let diagInch = null;
              if (d.sizeX && d.sizeY) {
                const diagCm = Math.sqrt(d.sizeX ** 2 + d.sizeY ** 2);
                diagInch = (diagCm / 2.54).toFixed(1);
              }

              return (
                <div
                  key={i}
                  className="flex gap-6 pb-[24px] border-b border-edge last:border-0 last:pb-0"
                >
                  <div className="flex-shrink-0 flex flex-col items-center justify-center w-36 h-36 bg-surface border border-edge rounded-xl shadow-sm">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mb-2 drop-shadow-md">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                    <div className="text-[13px] font-mono text-muted font-semibold tracking-wider">
                      {d.resolutionX && d.resolutionY ? `${d.resolutionX}×${d.resolutionY}` : `DISP ${i+1}`}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start gap-3 mb-[14px]">
                      <div className="text-[16px] font-bold flex items-center flex-wrap gap-2">
                        {name}
                        {d.main && <Tag tone="base">Principal</Tag>}
                        {d.builtin && <Tag tone="blue">Integrada</Tag>}
                      </div>
                      {d.currentRefreshRate ? (
                        <Badge tone="blue">{d.currentRefreshRate} Hz</Badge>
                      ) : null}
                    </div>
                    <KV
                      rows={[
                        {
                          k: 'Resolución actual',
                          v: d.currentResX && d.currentResY
                            ? `${d.currentResX} × ${d.currentResY}`
                            : (d.resolutionX ? `${d.resolutionX} × ${d.resolutionY}` : '--')
                        },
                        {
                          k: 'Resolución nativa',
                          v: d.resolutionX ? `${d.resolutionX} × ${d.resolutionY}` : '--'
                        },
                        { k: 'Frecuencia', v: d.currentRefreshRate ? `${d.currentRefreshRate} Hz` : '--' },
                        { k: 'Conexión', v: d.connection || '--' },
                        { k: 'Profundidad de color', v: d.pixelDepth ? `${d.pixelDepth} bits` : '--' },
                        { k: 'Tamaño', v: diagInch ? `${diagInch}"` : '--' },
                        { k: 'Fabricante', v: d.vendor || '--' }
                      ]}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
