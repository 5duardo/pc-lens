import React from 'react';
import { Badge, Tag, KV, Card } from '../components/ui.jsx';
import { Icon } from '../icons.jsx';

export default function SystemPanel({ staticInfo }) {
  const sys = staticInfo?.system || {};
  const bb = staticInfo?.baseboard || {};
  const bios = staticInfo?.bios || {};
  const os = staticInfo?.osInfo || {};

  return (
    <div className="flex flex-col gap-[32px]">
      {/* Equipo */}
      <section>
        <div className="flex items-center gap-3 mb-[18px]">
          <div className="p-2 bg-accent/10 rounded-lg text-accent">
            <Icon name="board" className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[18px] font-black tracking-tight text-txt">Placa Base y Equipo</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-[18px]">
          <div className="flex-1 flex flex-col p-[24px] bg-card2 border border-edge rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-[0.15] transition-opacity duration-300 bg-accent"></div>
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-[48px] h-[48px] rounded-xl flex items-center justify-center bg-accent text-card shadow-sm shrink-0">
                <Icon name="board" className="w-[24px] h-[24px]" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="text-[17px] font-extrabold text-txt break-words leading-tight">{sys.manufacturer || 'Desconocido'}</div>
                <div className="text-[13px] text-muted font-bold mt-[2px]">{sys.model || 'Modelo genérico'}</div>
              </div>
            </div>

            <div className="relative z-10 bg-card rounded-xl border border-edge p-[16px] shadow-sm flex-1">
              <KV
                rows={[
                  { k: 'Placa base', v: `${bb.manufacturer || ''} ${bb.model || ''}`.trim() || '--' },
                  { k: 'Versión de placa', v: bb.version || '--' }
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* OS & BIOS */}
      <section>
        <div className="flex items-center gap-3 mb-[18px]">
          <div className="p-2 bg-gpu/10 rounded-lg text-gpu">
            <Icon name="settings" className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[18px] font-black tracking-tight text-txt">Sistema y BIOS</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
          <div className="flex flex-col p-[24px] bg-card2 border border-edge rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-[0.15] transition-opacity duration-300 bg-gpu"></div>
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-[48px] h-[48px] rounded-xl flex items-center justify-center bg-gpu text-white shadow-sm shrink-0">
                <Icon name="settings" className="w-[24px] h-[24px]" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="text-[17px] font-extrabold text-txt break-words leading-tight">Sistema Operativo</div>
                <div className="text-[13px] text-muted font-bold mt-[2px]">{os.distro || 'Desconocido'}</div>
              </div>
            </div>

            <div className="relative z-10 bg-card rounded-xl border border-edge p-[16px] shadow-sm flex-1">
              <KV
                rows={[
                  { k: 'Versión', v: os.release || '--' },
                  { k: 'Arquitectura', v: os.arch || '--' },
                  { k: 'Hostname', v: os.hostname || '--' }
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col p-[24px] bg-card2 border border-edge rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-[0.15] transition-opacity duration-300 bg-accent2"></div>
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-[48px] h-[48px] rounded-xl flex items-center justify-center bg-accent2 text-white shadow-sm shrink-0">
                <Icon name="cpu" className="w-[24px] h-[24px]" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="text-[17px] font-extrabold text-txt break-words leading-tight">BIOS</div>
                <div className="text-[13px] text-muted font-bold mt-[2px]">{bios.vendor || 'Desconocido'}</div>
              </div>
            </div>

            <div className="relative z-10 bg-card rounded-xl border border-edge p-[16px] shadow-sm flex-1">
              <KV
                rows={[
                  { k: 'Versión BIOS', v: bios.version || '--' },
                  { k: 'Fecha de lanzamiento', v: bios.releaseDate || '--' }
                ]}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
