import React, { useState } from 'react';
import { Card, Badge, Tag, Gauge } from '../components/ui.jsx';
import { HistoryChart } from '../components/Chart.jsx';
import { Icon } from '../icons.jsx';
import { tempInfo, isIntegratedGpu } from '../utils.js';

export default function GpuPanel({ staticInfo, data, history }) {
  const controllers = staticInfo?.graphics?.controllers || [];
  const rt = data?.gpu || [];

  const [hiddenGpus, setHiddenGpus] = useState(() => {
    try {
      const stored = localStorage.getItem('pclens_hidden_gpus');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  function toggleGpu(index) {
    const newHidden = { ...hiddenGpus, [index]: !hiddenGpus[index] };
    setHiddenGpus(newHidden);
    localStorage.setItem('pclens_hidden_gpus', JSON.stringify(newHidden));
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <Card
        icon="gpu"
        title="Gráficas (GPU)"
        badge={
          <Badge>
            {controllers.length === 1 ? '1 gráfica' : `${controllers.length} gráficas`}
          </Badge>
        }
      >
        {controllers.length === 0 ? (
          <div className="text-[12.5px] text-muted">No se detectaron gráficas.</div>
        ) : (
          controllers.map((gpu, i) => {
            const isHidden = hiddenGpus[i];
            const live = rt[i] || {};
            const integrated = isIntegratedGpu(gpu);
            const gpuName = gpu.model || gpu.name || `GPU ${i + 1}`;
            
            if (isHidden) {
              return (
                <div key={i} className="py-3 border-b border-edge last:border-b-0 first:pt-0 last:pb-0 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-muted line-through">{gpuName}</span>
                    <span className="text-[11px] text-muted">(Oculta)</span>
                  </div>
                  <button onClick={() => toggleGpu(i)} className="p-1.5 rounded hover:bg-card2 text-muted hover:text-txt transition-colors" title="Mostrar gráfica">
                    <Icon name="eye" className="w-[15px] h-[15px]" />
                  </button>
                </div>
              );
            }

            const temp = tempInfo(live.temperatureGpu);
            const usage = live.utilizationGpu != null ? Math.round(live.utilizationGpu) : null;

            let memText = 'N/D';
            let memPct = 0;
            if (live.memoryUsed != null && live.memoryTotal) {
              memPct = Math.round((live.memoryUsed / live.memoryTotal) * 100);
              memText = `${(live.memoryUsed / 1024).toFixed(1)} / ${(live.memoryTotal / 1024).toFixed(1)} GB`;
            } else if (gpu.vram) {
              memText = `${(gpu.vram / 1024).toFixed(1)} GB total`;
            }

            return (
              <div
                key={i}
                className="py-[14px] border-b border-edge last:border-b-0 first:pt-0 last:pb-0 group"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="text-[17px] font-bold flex items-center gap-2">
                      {gpuName}
                      <Tag tone={integrated ? 'blue' : 'pink'}>
                        {integrated ? 'Integrada' : 'Dedicada'}
                      </Tag>
                      <button onClick={() => toggleGpu(i)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-card2 text-muted hover:text-danger transition-all" title="Ocultar gráfica">
                        <Icon name="eyeOff" className="w-[14px] h-[14px]" />
                      </button>
                    </div>
                    <div className="text-[12.5px] text-muted mt-1">
                      {gpu.vendor || ''}
                      {gpu.vram ? ` · ${gpu.vram} MB VRAM` : ''}
                    </div>
                  </div>
                  <Badge tone={temp.tone}>{temp.text}</Badge>
                </div>

                <div className="flex gap-[18px] mt-[14px]">
                  <Gauge
                    label="Uso GPU"
                    value={usage || 0}
                    valueText={usage != null ? `${usage}%` : 'N/D'}
                    variant="gpu"
                  />
                  <Gauge label="Memoria VRAM" value={memPct} valueText={memText} variant="gpu" />
                </div>
              </div>
            );
          })
        )}
      </Card>

      <Card icon="gpu" title="Uso de GPU (histórico)" collapsible>
        <HistoryChart data={history} series={[{ key: 'gpu', name: 'GPU', color: '#db61a2' }]} />
      </Card>
    </div>
  );
}
