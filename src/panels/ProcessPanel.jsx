import React, { useState, useMemo } from 'react';
import { Icon } from '../icons.jsx';

export default function ProcessPanel({ staticInfo, proc }) {
  const [sortConfig, setSortConfig] = useState({ key: 'mem', dir: 'desc' });

  const totalMem = staticInfo?.mem?.total || 1;
  const numCores = staticInfo?.cpu?.cores || 1;
  const error = proc?.error;
  const list = proc?.list || [];

  // Función auxiliar para convertir RAM a MB
  const memMB = (p) => {
    if (totalMem > 1 && p.mem) return (totalMem * p.mem) / 100 / 1024 ** 2;
    if (p.memRss) return p.memRss / 1024;
    return 0;
  };

  const processedGroups = useMemo(() => {
    const groups = {};
    for (const p of list) {
      // CORRECCIÓN DE "USOS FALSOS": % global
      let realCpu = (p.cpu || 0) / numCores;
      realCpu = Math.max(0, realCpu);
      const mb = memMB(p);

      const key = p.name || 'Desconocido';
      if (!groups[key]) {
        groups[key] = {
          name: key,
          count: 1,
          realCpu: realCpu,
          realMemMB: mb,
          disk: 0,
          net: 0,
          gpu: 0
        };
      } else {
        groups[key].count += 1;
        groups[key].realCpu += realCpu;
        groups[key].realMemMB += mb;
      }
    }
    return Object.values(groups);
  }, [list, numCores, totalMem]);

  const top = useMemo(() => {
    const sorted = [...processedGroups].sort((a, b) => {
      let valA, valB;
      switch (sortConfig.key) {
        case 'cpu': valA = a.realCpu; valB = b.realCpu; break;
        case 'mem': valA = a.realMemMB; valB = b.realMemMB; break;
        default: valA = a.realMemMB; valB = b.realMemMB; break;
      }
      return sortConfig.dir === 'desc' ? valB - valA : valA - valB;
    });
    return sorted; // Mostrar todos los procesos (agrupados)
  }, [processedGroups, sortConfig]);

  if (!proc) {
    return (
      <div className="flex items-center justify-center h-full text-[13px] text-muted">
        Cargando lista de procesos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-[13px] text-danger py-4">{error}</div>
    );
  }

  function handleSort(key) {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc'
    }));
  }

  const SortHeader = ({ id, label, className }) => (
    <div 
      className={`${className} py-[6px] px-3 cursor-pointer transition-colors border-l border-edge flex flex-col items-end justify-between hover:bg-edge/30 select-none`}
      onClick={() => handleSort(id)}
    >
      <div className="text-[10px] text-muted mb-1 flex items-center gap-1">
        {sortConfig.key === id && <Icon name={sortConfig.dir === 'desc' ? 'down' : 'up'} className="w-[10px] h-[10px]" />}
        {label}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-card border border-edge rounded-lg overflow-hidden font-segoe shadow-sm">
      
      {/* Encabezados de tabla tipo Windows */}
      <div className="flex items-end border-b border-edge bg-track text-[12px] text-txt">
        <div className="flex-1 py-[6px] px-3 font-semibold flex items-center gap-2 border-r border-edge">
          Nombre
        </div>
        <SortHeader id="cpu" label="CPU" className="w-[100px]" />
        <SortHeader id="mem" label="Memoria" className="w-[120px]" />
      </div>

      {/* Lista de procesos */}
      <div className="flex-1 overflow-y-auto bg-card">
        {top.map((p, i) => {
          const cpu = p.realCpu;
          const mb = p.realMemMB;

          // Cálculo de color Heatmap (azul oscuro a azul claro/naranja)
          const cpuHeat = Math.min(100, (cpu / 10) * 100);
          const cpuBg = cpu > 0.1 ? `rgba(45, 130, 210, ${cpuHeat / 100})` : 'transparent';
          
          const memHeat = Math.min(100, (mb / 1000) * 100);
          const memBg = mb > 50 ? `rgba(45, 130, 210, ${memHeat / 100})` : 'transparent';

          return (
            <div
              key={i}
              className="flex items-stretch border-b border-edge/50 hover:bg-track text-[12.5px] transition-colors text-txt"
            >
              <div className="flex-1 py-1.5 px-3 flex items-center gap-2 min-w-0 border-r border-edge/50">
                <Icon name="activity" className="w-[14px] h-[14px] text-accent2 shrink-0 opacity-70" />
                <span className="truncate font-semibold">{p.name}</span>
                {p.count > 1 && <span className="text-[11px] text-muted">({p.count})</span>}
              </div>
              
              <div 
                className="w-[100px] py-1.5 px-3 text-right"
                style={{ backgroundColor: cpuBg }}
              >
                {cpu > 0 ? `${cpu < 0.1 ? '< 0.1' : cpu.toFixed(1)}%` : '0%'}
              </div>
              
              <div 
                className="w-[120px] py-1.5 px-3 text-right border-l border-edge/50"
                style={{ backgroundColor: memBg }}
              >
                {mb.toFixed(1)} MB
              </div>
            </div>
          );
        })}

        {top.length === 0 && (
          <div className="text-[13px] text-muted py-4 text-center">
            Sin datos de procesos.
          </div>
        )}
      </div>
    </div>
  );
}
