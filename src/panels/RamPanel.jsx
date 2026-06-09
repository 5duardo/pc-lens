import React from 'react';
import { Card, Badge, KV, Ring } from '../components/ui.jsx';
import { HistoryChart } from '../components/Chart.jsx';
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
    <div className="flex flex-col gap-[18px]">
      <Card
        icon="ram"
        title="Memoria RAM"
        badge={<Badge>{bytesToGB(total)} GB</Badge>}
      >
        <div className="flex justify-center mb-4">
          <Ring percent={usedPct} color={ringColor} />
        </div>
        <KV
          rows={[
            { k: 'Usada', v: `${bytesToGB(mem.active)} GB` },
            { k: 'Libre', v: `${bytesToGB(mem.available)} GB` },
            { k: 'Total', v: `${bytesToGB(total)} GB` },
            { k: 'Tipo', v: `${ddrType}${clockSpeed ? ` @ ${clockSpeed} MHz` : ''}` },
            { k: 'Módulos instalados', v: `${usedSlots} de ${totalSlots} slots` },
            { k: 'Máxima RAM soportada', v: `${maxRam} GB` }
          ]}
        />
      </Card>

      {memLayout.length > 0 && (
        <Card icon="ram" title="Módulos instalados">
          <div className="flex flex-col gap-[14px]">
            {memLayout.map((m, i) => (
              <div key={i} className="text-[13px] pb-[10px] border-b border-edge last:border-0 last:pb-0">
                <div className="font-semibold">
                  {m.bank || `Slot ${i}`} — {bytesToGB(m.size)} GB
                </div>
                <div className="text-muted text-[12.5px] mt-1">
                  {m.type || '?'} · {m.clockSpeed ? `${m.clockSpeed} MHz` : '?'}
                  {m.manufacturer ? ` · ${m.manufacturer}` : ''}
                  {m.formFactor ? ` · ${m.formFactor}` : ''}
                </div>
                {m.partNum && (
                  <div className="text-muted text-[11.5px] mt-[2px]">
                    P/N: {m.partNum.trim()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card icon="ram" title="Uso de RAM (histórico)" collapsible>
        <HistoryChart data={history} series={[{ key: 'ram', name: 'RAM', color: '#3fb950' }]} />
      </Card>
    </div>
  );
}
