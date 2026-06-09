import React from 'react';
import { Badge, Tag, Gauge, KV, Card } from '../components/ui.jsx';
import { HistoryChart } from '../components/Chart.jsx';
import { Icon } from '../icons.jsx';
import { loadColor, tempInfo } from '../utils.js';

function formatCache(bytes) {
  if (!bytes || bytes <= 0) return '--';
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${bytes} B`;
}

export default function CpuPanel({ staticInfo, data, history }) {
  const cpu = staticInfo?.cpu || {};
  const cache = cpu.cache || {};
  const load = data?.currentLoad || {};
  const speed = data?.cpuSpeed || {};
  const temp = tempInfo(data?.cpuTemp?.main);

  const cpuPct = Math.round(load.currentLoad ?? 0);
  const cores = load.cpus || [];
  const currentFreq = speed.avg || 0;
  const baseFreq = cpu.speed || 3.9;
  const maxFreq = Math.max(cpu.speedMax || 0, baseFreq * 1.4, currentFreq);
  const freqPct = maxFreq > 0 ? Math.min(100, (currentFreq / maxFreq) * 100) : 0;

  return (
    <div className="flex flex-col gap-[32px]">
      {/* Resumen Principal */}
      <section>
        <div className="flex items-center gap-3 mb-[18px]">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
            <Icon name="cpu" className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[18px] font-black tracking-tight text-txt">Procesador (CPU)</h2>
          <Badge tone={temp.tone}>{temp.text}</Badge>
        </div>

        <div className="flex flex-col xl:flex-row gap-[18px]">
          {/* Tarjeta de Monitoreo */}
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-8 p-[28px] bg-card2 border border-edge rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-300"></div>
            
            <div className="relative z-10 flex gap-[24px]">
               <Gauge
                label="Uso total"
                value={cpuPct}
                valueText={`${cpuPct}%`}
                color={loadColor(cpuPct)}
              />
              <Gauge
                label="Frecuencia"
                value={freqPct}
                valueText={currentFreq ? `${currentFreq.toFixed(2)} GHz` : '-- GHz'}
                variant="freq"
              />
            </div>
            
            <div className="relative z-10 flex-1 min-w-0 sm:border-l border-edge sm:pl-8 flex flex-col justify-center">
              <div className="text-[22px] font-black tracking-tight text-txt leading-tight mb-3 break-words">
                {`${cpu.manufacturer || ''} ${cpu.brand || ''}`.trim() || 'Procesador desconocido'}
              </div>
              <div className="flex flex-wrap gap-2">
                <Tag tone="base">{cpu.physicalCores || '?'} núcleos</Tag>
                <Tag tone="base">{cpu.cores || '?'} hilos</Tag>
                <Tag tone="blue">Base {cpu.speed || '?'} GHz</Tag>
                {cpu.speedMax && <Tag tone="pink">Turbo {cpu.speedMax} GHz</Tag>}
              </div>
            </div>
          </div>

          {/* Tarjeta de Detalles Técnicos */}
          <div className="xl:w-[40%] flex flex-col p-[22px] bg-card border border-edge rounded-2xl shadow-sm justify-center">
            <KV
              rows={[
                { k: 'Sockets', v: cpu.processors || '1' },
                { k: 'Socket actual', v: cpu.socket || '--' },
                { k: 'Virtualización', v: cpu.virtualization ? 'Habilitado' : 'No disponible' },
                { k: 'Caché L1', v: formatCache(cache.l1d + cache.l1i) },
                { k: 'Caché L2', v: formatCache(cache.l2) },
                { k: 'Caché L3', v: formatCache(cache.l3) }
              ]}
            />
          </div>
        </div>
      </section>

      {/* Hilos Logicos */}
      {cores.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-[18px]">
            <div className="p-2 bg-accent2/10 rounded-lg text-accent2">
              <Icon name="board" className="w-[18px] h-[18px]" strokeWidth={2.5} />
            </div>
            <h2 className="text-[18px] font-black tracking-tight text-txt">Carga por Hilos</h2>
            <Badge tone="blue">{cores.length} lógicos</Badge>
          </div>

          <div className="grid gap-[12px] p-[22px] bg-card2 border border-edge rounded-2xl shadow-sm" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))' }}>
            {cores.map((c, i) => {
              const p = Math.round(c.load || 0);
              return (
                <div key={i} className="bg-card border border-edge rounded-xl py-[12px] px-2 text-center hover:-translate-y-[2px] hover:shadow-md transition-all duration-200 cursor-default">
                  <span className="block text-[14px] font-black text-txt">{p}%</span>
                  <span className="text-[10px] font-bold text-muted uppercase mt-[2px] block">Hilo {i}</span>
                  <div className="h-1.5 bg-track rounded-full mt-[8px] overflow-hidden">
                    <div className="h-full transition-all duration-300" style={{ width: `${p}%`, background: loadColor(p) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Historial */}
      <section>
        <Card icon="activity" title="Uso del CPU (histórico)" collapsible>
          <HistoryChart
            data={history}
            series={[{ key: 'cpu', name: 'CPU', color: '#4f8cff' }]}
          />
        </Card>
      </section>
    </div>
  );
}
