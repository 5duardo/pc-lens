import React from 'react';
import { Badge, Tag, KV } from '../components/ui.jsx';
import { Icon } from '../icons.jsx';

export default function DisplayPanel({ staticInfo }) {
  const displays = staticInfo?.displays || [];

  return (
    <div className="flex flex-col gap-[32px]">
      <section>
        <div className="flex items-center gap-3 mb-[18px]">
          <div className="p-2 bg-accent2/10 rounded-lg text-accent2">
            <Icon name="display" className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[18px] font-black tracking-tight text-txt">Pantallas</h2>
          <Badge tone="blue">{displays.length === 1 ? '1 pantalla' : `${displays.length} pantallas`}</Badge>
        </div>

        {displays.length === 0 ? (
          <div className="text-[13.5px] text-muted font-medium p-5 bg-card2 rounded-2xl border border-edge text-center">No se detectaron pantallas.</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-[18px]">
            {displays.map((d, i) => {
              const name = d.model && d.model !== 'Monitor predeterminado'
                ? d.model
                : `Pantalla ${i + 1}`;
              
              let diagInch = null;
              if (d.sizeX && d.sizeY) {
                const diagCm = Math.sqrt(d.sizeX ** 2 + d.sizeY ** 2);
                diagInch = (diagCm / 2.54).toFixed(1);
              }

              return (
                <div
                  key={i}
                  className="flex flex-col p-[22px] bg-card2 border border-edge rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                >
                  {/* Glow effect suave en hover */}
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent2 rounded-full blur-3xl opacity-0 group-hover:opacity-[0.15] transition-opacity duration-300"></div>

                  <div className="flex flex-col sm:flex-row gap-6 mb-6 relative z-10">
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 bg-card border border-edge rounded-xl shadow-sm">
                      <Icon name="display" className="w-[32px] h-[32px] text-accent2 mb-2 drop-shadow-md" strokeWidth={1.5} />
                      <div className="text-[12.5px] font-mono text-muted font-bold tracking-wider">
                        {d.resolutionX && d.resolutionY ? `${d.resolutionX}×${d.resolutionY}` : `DISP ${i+1}`}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="text-[17px] font-black text-txt break-words leading-tight mb-3">
                        {name}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {d.main && <Tag tone="base">Principal</Tag>}
                        {d.builtin && <Tag tone="blue">Integrada</Tag>}
                        {d.currentRefreshRate ? (
                          <Badge tone="blue">{d.currentRefreshRate} Hz</Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 bg-card rounded-xl border border-edge p-2 shadow-sm">
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
                        { k: 'Prof. de color', v: d.pixelDepth ? `${d.pixelDepth} bits` : '--' },
                        { k: 'Tamaño físico', v: diagInch ? `${diagInch}"` : '--' },
                        { k: 'Fabricante', v: d.vendor || '--' }
                      ]}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
