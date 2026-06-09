import React from 'react';
import { Card, Ring, Badge } from '../components/ui.jsx';
import { loadColor, tempInfo, bytesToGB, formatSpeed, isIntegratedGpu } from '../utils.js';

export default function HomePanel({ staticInfo, data }) {
  // CPU
  const load = data?.currentLoad || {};
  const cpuPct = Math.round(load.currentLoad ?? 0);
  const temp = tempInfo(data?.cpuTemp?.main);

  // RAM
  const memTotal = staticInfo?.mem?.total || data?.memData?.total;
  const memActive = data?.memData?.active || 0;
  const ramPct = memTotal ? Math.round((memActive / memTotal) * 100) : 0;

  // GPU
  const gpus = data?.gpu || [];
  const dedicatedGpu = gpus.find(g => !isIntegratedGpu(g));
  const primaryGpu = dedicatedGpu || gpus[0] || {};
  const gpuPct = primaryGpu.utilizationGpu != null ? Math.round(primaryGpu.utilizationGpu) : 0;
  const gpuTemp = tempInfo(primaryGpu.temperatureGpu);

  // Almacenamiento
  const fsSize = data?.fsSize || [];
  let diskTotal = 0;
  let diskUsed = 0;
  fsSize.forEach(d => {
    diskTotal += d.size || 0;
    diskUsed += d.used || 0;
  });
  const diskPct = diskTotal ? Math.round((diskUsed / diskTotal) * 100) : 0;

  // Red
  const net = data?.networkStats || [];
  let tx = 0;
  let rx = 0;
  net.forEach(n => {
    tx += n.tx_sec || 0;
    rx += n.rx_sec || 0;
  });

  return (
    <div className="flex flex-col gap-[18px]">
      <Card icon="home" title="Resumen del Sistema">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px]">
          {/* CPU */}
          <div className="flex flex-col items-center justify-center p-[20px] bg-card2 border border-edge rounded-xl shadow-sm">
             <div className="text-[14px] font-extrabold text-muted mb-4 uppercase tracking-wider">Procesador</div>
             <Ring percent={cpuPct} color={loadColor(cpuPct)} />
             <div className="mt-[18px] flex gap-2">
                <Badge tone={temp.tone}>{temp.text}</Badge>
             </div>
          </div>

          {/* RAM */}
          <div className="flex flex-col items-center justify-center p-[20px] bg-card2 border border-edge rounded-xl shadow-sm">
             <div className="text-[14px] font-extrabold text-muted mb-4 uppercase tracking-wider">Memoria</div>
             <Ring percent={ramPct} color={loadColor(ramPct)} />
             <div className="mt-[18px] text-[13px] font-semibold bg-surface border border-edge px-3 py-1 rounded-lg">
                {bytesToGB(memActive)} / {bytesToGB(memTotal)} GB
             </div>
          </div>

          {/* GPU */}
          <div className="flex flex-col items-center justify-center p-[20px] bg-card2 border border-edge rounded-xl shadow-sm">
             <div className="text-[14px] font-extrabold text-muted mb-4 uppercase tracking-wider">Gráfica</div>
             <Ring percent={gpuPct} color="#db61a2" />
             <div className="mt-[18px] flex gap-2">
                <Badge tone={gpuTemp.tone}>{gpuTemp.text}</Badge>
             </div>
          </div>

          {/* Disco */}
          <div className="flex flex-col items-center justify-center p-[20px] bg-card2 border border-edge rounded-xl shadow-sm">
             <div className="text-[14px] font-extrabold text-muted mb-4 uppercase tracking-wider">Discos</div>
             <Ring percent={diskPct} color={loadColor(diskPct)} />
             <div className="mt-[18px] text-[13px] font-semibold bg-surface border border-edge px-3 py-1 rounded-lg">
                {bytesToGB(diskUsed)} / {bytesToGB(diskTotal)} GB
             </div>
          </div>
        </div>

        <div className="mt-[18px] flex flex-col md:flex-row gap-[18px]">
           <div className="flex-1 bg-card2 border border-edge p-[18px] rounded-xl flex items-center shadow-sm">
              <div className="flex-1 flex items-center justify-center gap-4">
                 <div className="p-[10px] bg-accent2/10 text-accent2 rounded-xl">
                    <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[11.5px] text-muted font-bold uppercase tracking-wider">Descarga actual</span>
                   <span className="text-[20px] font-extrabold text-txt">{formatSpeed(rx)}</span>
                 </div>
              </div>
              <div className="h-[40px] w-px bg-edge mx-4"></div>
              <div className="flex-1 flex items-center justify-center gap-4">
                 <div className="p-[10px] bg-accent/10 text-accent rounded-xl">
                    <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[11.5px] text-muted font-bold uppercase tracking-wider">Subida actual</span>
                   <span className="text-[20px] font-extrabold text-txt">{formatSpeed(tx)}</span>
                 </div>
              </div>
           </div>
        </div>
      </Card>
    </div>
  );
}
