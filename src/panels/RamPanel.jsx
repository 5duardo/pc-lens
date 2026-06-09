import React from 'react';
import { Badge, Tag, KV, Ring, Card } from '../components/ui.jsx';
import { HistoryChart } from '../components/Chart.jsx';
import { Icon } from '../icons.jsx';
import { bytesToGB } from '../utils.js';

export default function RamPanel({ staticInfo, data, history }) {
  const mem = data?.memData || {};
  const total = staticInfo?.mem?.total || mem.total;
  const usedPct = mem.total ? Math.round((mem.active / mem.total) * 100) : 0;
  const ringColor = usedPct >= 85 ? '#f85149' : usedPct >= 65 ? '#d29922' : '#3fb950';

  const memLayout = staticInfo?.memLayout || [];
  const baseboard = staticInfo?.baseboard || {};
  const totalSlots = baseboard.memSlots || '?';
  const usedSlots = memLayout.length;
  const maxRam = baseboard.memMax ? bytesToGB(baseboard.memMax) : '?';

  // Tipo DDR (tomar del primer módulo)
  const ddrType = memLayout[0]?.type || '?';
  const clockSpeed = memLayout[0]?.clockSpeed || null;

  return (
    <div className="flex flex-col gap-[32px]">
      {/* Resumen General */}
      <section>
        <div className="flex items-center gap-3 mb-[18px]">
          <div className="p-2 bg-accent/10 rounded-lg text-accent">
            <Icon name="ram" className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[18px] font-black tracking-tight text-txt">Memoria RAM</h2>
          <Badge tone="blue">{bytesToGB(total)} GB</Badge>
        </div>

        <div className="flex flex-col lg:flex-row gap-[18px]">
          {/* Tarjeta de uso principal */}
          <div className="flex-1 flex items-center gap-8 p-[28px] bg-card2 border border-edge rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-accent rounded-full blur-3xl opacity-[0.08]"></div>
            
            <div className="relative z-10 shrink-0">
              <Ring percent={usedPct} color={ringColor} />
            </div>
            
            <div className="relative z-10 flex-1 min-w-0">
              <div className="text-[32px] font-black tracking-tight text-txt leading-none mb-1">
                {bytesToGB(mem.active)} <span className="text-[18px] text-muted font-bold">GB</span>
              </div>
              <div className="text-[13px] text-muted font-bold uppercase tracking-wider mb-5">Usada de {bytesToGB(total)} GB</div>
              
              <div className="flex flex-wrap gap-2">
                <Tag tone="accent">Libre: {bytesToGB(mem.available)} GB</Tag>
                <Tag tone="base">{ddrType}</Tag>
                {clockSpeed && <Tag tone="blue">{clockSpeed} MHz</Tag>}
              </div>
            </div>
          </div>

          {/* Detalles del sistema */}
          <div className="lg:w-[35%] flex flex-col p-[22px] bg-card border border-edge rounded-2xl shadow-sm justify-center">
            <KV
              rows={[
                { k: 'Ranuras usadas', v: `${usedSlots} de ${totalSlots}` },
                { k: 'Max RAM soportada', v: maxRam !== '?' ? `${maxRam} GB` : 'Desconocido' },
                { k: 'Tipo base', v: ddrType },
                { k: 'Frecuencia base', v: clockSpeed ? `${clockSpeed} MHz` : 'Desconocido' }
              ]}
            />
          </div>
        </div>
      </section>

      {/* Módulos Instalados */}
      {memLayout.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-[18px]">
            <div className="p-2 bg-accent2/10 rounded-lg text-accent2">
              <Icon name="board" className="w-[18px] h-[18px]" strokeWidth={2.5} />
            </div>
            <h2 className="text-[18px] font-black tracking-tight text-txt">Módulos Instalados</h2>
            <Badge tone="blue">{memLayout.length} detectados</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[18px]">
            {memLayout.map((m, i) => (
              <div key={i} className="flex items-center gap-5 p-[20px] bg-card2 border border-edge rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-[0.15] transition-opacity duration-300 bg-accent2"></div>
                
                <div className="w-[46px] h-[46px] rounded-xl flex items-center justify-center bg-accent2/10 text-accent2 shrink-0">
                  <Icon name="ram" className="w-[22px] h-[22px]" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14.5px] font-extrabold text-txt truncate">{m.bank || `Slot ${i}`}</div>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    {m.type && <Tag tone="base">{m.type}</Tag>}
                    {m.clockSpeed && <Badge tone="blue">{m.clockSpeed} MHz</Badge>}
                    <Tag tone="accent2">{bytesToGB(m.size)} GB</Tag>
                  </div>
                  {m.manufacturer && (
                    <div className="text-[12px] text-muted mt-[6px] truncate">
                      {m.manufacturer} {m.partNum ? `(P/N: ${m.partNum.trim()})` : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gráfico */}
      <section>
        <Card icon="activity" title="Uso de RAM (histórico)" collapsible>
          <HistoryChart data={history} series={[{ key: 'ram', name: 'RAM', color: '#3fb950' }]} />
        </Card>
      </section>
    </div>
  );
}
