import React from 'react';
import { Badge, Ring, Tag } from '../components/ui.jsx';
import { Icon } from '../icons.jsx';
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

  const chassisType = staticInfo?.chassis?.type?.toLowerCase() || '';
  const isLaptop = chassisType.includes('laptop') || chassisType.includes('notebook') || chassisType.includes('portable') || staticInfo?.battery?.hasBattery;
  const deviceIcon = isLaptop ? 'laptop' : 'desktop';

  return (
    <div className="flex flex-col gap-[32px]">
      <section>
        <div className="flex items-center gap-3 mb-[18px]">
          <div className="p-2 bg-accent/10 rounded-lg text-accent">
            <Icon name={deviceIcon} className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[18px] font-black tracking-tight text-txt">Resumen del Sistema</h2>
          <Badge tone="blue">{isLaptop ? 'Laptop' : 'Escritorio'}</Badge>
        </div>

        {/* 4 Rings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
          {/* CPU */}
          <div className="flex flex-col items-center justify-center p-[24px] bg-card2 border border-edge rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group cursor-default">
             <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300 bg-blue-500"></div>
             <div className="text-[14px] font-extrabold text-txt mb-5 relative z-10 tracking-tight">Procesador</div>
             <div className="relative z-10"><Ring percent={cpuPct} color={loadColor(cpuPct)} /></div>
             <div className="mt-[20px] relative z-10">
                <Badge tone={temp.tone}>{temp.text}</Badge>
             </div>
          </div>

          {/* RAM */}
          <div className="flex flex-col items-center justify-center p-[24px] bg-card2 border border-edge rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group cursor-default">
             <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300 bg-accent"></div>
             <div className="text-[14px] font-extrabold text-txt mb-5 relative z-10 tracking-tight">Memoria RAM</div>
             <div className="relative z-10"><Ring percent={ramPct} color={loadColor(ramPct)} /></div>
             <div className="mt-[20px] relative z-10">
                <Tag tone="base">{bytesToGB(memActive)} / {bytesToGB(memTotal)} GB</Tag>
             </div>
          </div>

          {/* GPU */}
          <div className="flex flex-col items-center justify-center p-[24px] bg-card2 border border-edge rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group cursor-default">
             <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-[0.12] transition-opacity duration-300 bg-gpu"></div>
             <div className="text-[14px] font-extrabold text-txt mb-5 relative z-10 tracking-tight">Gráfica</div>
             <div className="relative z-10"><Ring percent={gpuPct} color="#db61a2" /></div>
             <div className="mt-[20px] relative z-10">
                <Badge tone={gpuTemp.tone}>{gpuTemp.text}</Badge>
             </div>
          </div>

          {/* Disco */}
          <div className="flex flex-col items-center justify-center p-[24px] bg-card2 border border-edge rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group cursor-default">
             <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300 bg-orange-500"></div>
             <div className="text-[14px] font-extrabold text-txt mb-5 relative z-10 tracking-tight">Discos</div>
             <div className="relative z-10"><Ring percent={diskPct} color={loadColor(diskPct)} /></div>
             <div className="mt-[20px] relative z-10">
                <Tag tone="base">{bytesToGB(diskUsed)} / {bytesToGB(diskTotal)} GB</Tag>
             </div>
          </div>
        </div>
      </section>

      {/* Red */}
      <section>
         <div className="flex items-center gap-3 mb-[18px]">
          <div className="p-2 bg-accent2/10 rounded-lg text-accent2">
            <Icon name="net" className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[18px] font-black tracking-tight text-txt">Actividad de Red</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-[18px]">
           <div className="flex-1 bg-card2 border border-edge p-[24px] rounded-2xl flex flex-col md:flex-row items-center shadow-sm relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-300 bg-accent2"></div>
              
              <div className="flex-1 w-full flex items-center justify-center gap-5 relative z-10 p-4 md:p-0">
                 <div className="p-[14px] bg-accent2/10 text-accent2 rounded-2xl shadow-sm">
                    <Icon name="down" className="w-[24px] h-[24px]" strokeWidth={2.5} />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[12px] text-muted font-bold uppercase tracking-wider">Descarga actual</span>
                   <span className="text-[26px] font-black text-txt tracking-tight leading-none mt-1">{formatSpeed(rx)}</span>
                 </div>
              </div>
              
              <div className="h-px w-full md:w-px md:h-[60px] bg-edge my-4 md:my-0 md:mx-6 relative z-10"></div>
              
              <div className="flex-1 w-full flex items-center justify-center gap-5 relative z-10 p-4 md:p-0">
                 <div className="p-[14px] bg-gpu/10 text-gpu rounded-2xl shadow-sm">
                    <Icon name="up" className="w-[24px] h-[24px]" strokeWidth={2.5} />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[12px] text-muted font-bold uppercase tracking-wider">Subida actual</span>
                   <span className="text-[26px] font-black text-txt tracking-tight leading-none mt-1">{formatSpeed(tx)}</span>
                 </div>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}
