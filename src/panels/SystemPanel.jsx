import React from 'react';
import { Card, KV } from '../components/ui.jsx';

export default function SystemPanel({ staticInfo }) {
  const sys = staticInfo?.system || {};
  const bb = staticInfo?.baseboard || {};
  const bios = staticInfo?.bios || {};
  const os = staticInfo?.osInfo || {};

  return (
    <div className="flex flex-col gap-[18px]">
      <Card icon="board" title="Placa base y Equipo">
        <KV
          rows={[
            { k: 'Fabricante', v: sys.manufacturer },
            { k: 'Modelo', v: sys.model },
            { k: 'Placa base', v: `${bb.manufacturer || ''} ${bb.model || ''}`.trim() },
            { k: 'Versión placa', v: bb.version }
          ]}
        />
      </Card>

      <Card icon="board" title="BIOS y Sistema operativo">
        <KV
          rows={[
            { k: 'BIOS', v: `${bios.vendor || ''} ${bios.version || ''}`.trim() },
            { k: 'Fecha BIOS', v: bios.releaseDate },
            { k: 'Sistema', v: `${os.distro || ''} ${os.release || ''}`.trim() },
            { k: 'Arquitectura', v: os.arch },
            { k: 'Hostname', v: os.hostname }
          ]}
        />
      </Card>
    </div>
  );
}
