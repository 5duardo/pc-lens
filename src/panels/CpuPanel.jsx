import React from 'react';
import { Card, Badge, Gauge } from '../components/ui.jsx';
import { HistoryChart } from '../components/Chart.jsx';
import { loadColor, tempInfo } from '../utils.js';

function formatCache(bytes) {
  if (!bytes || bytes <= 0) return '--';
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} kB`;
  // systeminformation a veces devuelve KB directamente (valores pequeños)
  // Si el valor es < 1024 y razonable como KB, mostrarlo así
  return `${bytes} B`;
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
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
  // Techo para la barra: el boost real suele superar el speedMax estático,
  // así que usamos ~1.4x la frecuencia base como referencia visual.
  const baseFreq = cpu.speed || 3.9;
  const maxFreq = Math.max(cpu.speedMax || 0, baseFreq * 1.4, currentFreq);
  const freqPct = maxFreq > 0 ? Math.min(100, (currentFreq / maxFreq) * 100) : 0;

  return (
    <div className="flex flex-col gap-[18px]">
      <Card
        icon="cpu"
        title="Procesador (CPU)"
        badge={<Badge tone={temp.tone}>{temp.text}</Badge>}
      >
        <div className="text-[17px] font-bold">
          {`${cpu.manufacturer || ''} ${cpu.brand || ''}`.trim() || '--'}
        </div>
        <div className="text-[12.5px] text-muted mt-1">
          {cpu.physicalCores || '?'} núcleos · {cpu.cores || '?'} hilos · base{' '}
          {cpu.speed || '?'} GHz · máx {cpu.speedMax || cpu.speed || '?'} GHz
        </div>

        <div className="flex gap-[18px] mt-[18px]">
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

        <div className="grid gap-2 mt-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(54px, 1fr))' }}>
          {cores.map((c, i) => {
            const p = Math.round(c.load || 0);
            return (
              <div key={i} className="bg-track border border-edge rounded-lg py-[7px] px-1 text-center">
                <span className="block text-[12px] font-bold">{p}%</span>
                <span className="text-[9px] text-muted">Hilo {i}</span>
                <div className="h-1 bg-[#1c2434] rounded mt-[5px] overflow-hidden">
                  <i className="block h-full transition-all duration-300" style={{ width: `${p}%`, background: loadColor(p) }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Detalles técnicos del procesador */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-[6px] mt-[18px] text-[12.5px]">
          <DetailRow label="Velocidad de base" value={cpu.speed ? `${cpu.speed.toFixed(2)} GHz` : '--'} />
          <DetailRow label="Sockets" value={cpu.processors || '1'} />
          <DetailRow label="Núcleos" value={cpu.physicalCores || '--'} />
          <DetailRow label="Procesadores lógicos" value={cpu.cores || '--'} />
          <DetailRow label="Virtualización" value={cpu.virtualization ? 'Habilitado' : 'No disponible'} />
          <DetailRow label="Socket" value={cpu.socket || '--'} />
          <DetailRow label="Caché L1" value={formatCache(cache.l1d + cache.l1i)} />
          <DetailRow label="Caché L2" value={formatCache(cache.l2)} />
          <DetailRow label="Caché L3" value={formatCache(cache.l3)} />
        </div>
      </Card>

      <Card icon="cpu" title="Uso del CPU (histórico)" collapsible>
        <HistoryChart
          data={history}
          series={[{ key: 'cpu', name: 'CPU', color: '#4f8cff' }]}
        />
      </Card>
    </div>
  );
}
