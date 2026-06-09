import React, { useState } from 'react';
import { Badge, Tag, Gauge, Card } from '../components/ui.jsx';
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
    <div className="flex flex-col gap-[32px]">
      <section>
        <div className="flex items-center gap-3 mb-[18px]">
          <div className="p-2 bg-gpu/10 rounded-lg text-gpu">
            <Icon name="gpu" className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[18px] font-black tracking-tight text-txt">Tarjetas Gráficas (GPU)</h2>
          <Badge tone="pink">{controllers.length === 1 ? '1 gráfica' : `${controllers.length} detectadas`}</Badge>
        </div>

        {controllers.length === 0 ? (
          <div className="text-[13.5px] text-muted font-medium p-5 bg-card2 rounded-2xl border border-edge text-center">No se detectaron gráficas.</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-[18px]">
            {controllers.map((gpu, i) => {
              const isHidden = hiddenGpus[i];
              const live = rt[i] || {};
              const integrated = isIntegratedGpu(gpu);
              const gpuName = gpu.model || gpu.name || `GPU ${i + 1}`;
              
              if (isHidden) {
                return (
                  <div key={i} className="flex items-center justify-between p-[16px] bg-card2 border border-edge rounded-2xl opacity-50 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-3">
                      <div className="w-[36px] h-[36px] rounded-lg bg-surface border border-edge flex items-center justify-center text-muted">
                        <Icon name="eyeOff" className="w-[18px] h-[18px]" />
                      </div>
                      <div>
                        <span className="text-[14.5px] font-bold text-muted line-through">{gpuName}</span>
                        <div className="text-[11.5px] text-muted">(Oculta)</div>
                      </div>
                    </div>
                    <button onClick={() => toggleGpu(i)} className="p-2 rounded-xl hover:bg-surface text-muted hover:text-txt transition-colors" title="Mostrar gráfica">
                      <Icon name="eye" className="w-[18px] h-[18px]" />
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
                <div key={i} className="flex flex-col p-[24px] bg-card2 border border-edge rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-[0.15] transition-opacity duration-300 bg-gpu"></div>
                  
                  <div className="flex justify-between items-start gap-3 mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-[48px] h-[48px] rounded-xl flex items-center justify-center bg-gpu text-white shadow-sm shrink-0">
                        <Icon name="gpu" className="w-[24px] h-[24px]" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[16.5px] font-extrabold text-txt break-words leading-tight flex items-center gap-2">
                          {gpuName}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-[6px]">
                          <Tag tone={integrated ? 'blue' : 'pink'}>{integrated ? 'Integrada' : 'Dedicada'}</Tag>
                          <Badge tone={temp.tone}>{temp.text}</Badge>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => toggleGpu(i)} className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-surface text-muted hover:text-danger transition-all shrink-0" title="Ocultar gráfica">
                      <Icon name="eyeOff" className="w-[18px] h-[18px]" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-[18px] relative z-10 p-[16px] bg-card border border-edge rounded-xl shadow-sm">
                    <Gauge
                      label="Uso GPU"
                      value={usage || 0}
                      valueText={usage != null ? `${usage}%` : 'N/D'}
                      variant="gpu"
                    />
                    <Gauge 
                      label="Memoria VRAM" 
                      value={memPct} 
                      valueText={memText} 
                      variant="gpu" 
                    />
                  </div>

                  <div className="text-[12px] text-muted mt-5 text-center font-medium relative z-10">
                    {gpu.vendor || 'Fabricante desconocido'} {gpu.vram ? `· ${gpu.vram} MB VRAM Base` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <Card icon="activity" title="Uso de GPU (histórico)" collapsible>
          <HistoryChart data={history} series={[{ key: 'gpu', name: 'GPU', color: '#db61a2' }]} />
        </Card>
      </section>
    </div>
  );
}
