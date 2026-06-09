import React from 'react';
import { Card, Badge, Tag } from '../components/ui.jsx';
import { Icon } from '../icons.jsx';

function DeviceRow({ name, sub, tag, tagTone }) {
  return (
    <div className="flex justify-between items-center py-[10px] border-b border-edge last:border-0">
      <div className="flex items-center gap-[10px] min-w-0">
        <Icon name="device" className="w-[16px] h-[16px] text-muted shrink-0" />
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold truncate">{name}</div>
          {sub && <div className="text-[11.5px] text-muted truncate">{sub}</div>}
        </div>
      </div>
      {tag && <Tag tone={tagTone || 'blue'}>{tag}</Tag>}
    </div>
  );
}

export default function PeripheralsPanel({ staticInfo }) {
  const usb = staticInfo?.usb || [];
  const audio = staticInfo?.audio || [];
  const bluetooth = staticInfo?.bluetoothDevices || [];

  // USB: filtrar concentradores/controladores, quedarnos con dispositivos reales
  const usbDevices = usb.filter((u) => {
    const t = (u.type || '').toLowerCase();
    return t !== 'hub' && t !== 'controller' && u.name;
  });

  // Audio: dispositivos con nombre, ignorar drivers genéricos repetidos
  const audioDevices = audio.filter((a) => a.name);

  // Bluetooth: filtrar entradas que son "servicios" y no dispositivos
  const btDevices = bluetooth.filter(
    (b) => b.name && !/servicio/i.test(b.name)
  );

  return (
    <div className="flex flex-col gap-[18px]">
      <Card
        icon="device"
        title="Dispositivos USB"
        badge={<Badge>{usbDevices.length}</Badge>}
      >
        {usbDevices.length === 0 ? (
          <div className="text-[12.5px] text-muted">No se detectaron dispositivos USB.</div>
        ) : (
          usbDevices.map((u, i) => (
            <DeviceRow
              key={i}
              name={u.name}
              sub={u.manufacturer || u.vendor || ''}
              tag={u.type}
              tagTone="blue"
            />
          ))
        )}
      </Card>

      <Card
        icon="device"
        title="Dispositivos de audio"
        badge={<Badge>{audioDevices.length}</Badge>}
      >
        {audioDevices.length === 0 ? (
          <div className="text-[12.5px] text-muted">No se detectaron dispositivos de audio.</div>
        ) : (
          audioDevices.map((a, i) => (
            <DeviceRow
              key={i}
              name={a.name}
              sub={a.manufacturer || ''}
              tag={a.type || null}
              tagTone="pink"
            />
          ))
        )}
      </Card>

      <Card
        icon="device"
        title="Dispositivos Bluetooth"
        badge={<Badge>{btDevices.length}</Badge>}
      >
        {btDevices.length === 0 ? (
          <div className="text-[12.5px] text-muted">No se detectaron dispositivos Bluetooth.</div>
        ) : (
          btDevices.map((b, i) => (
            <DeviceRow
              key={i}
              name={b.name}
              sub={b.manufacturer || ''}
              tag={b.type || null}
              tagTone="base"
            />
          ))
        )}
      </Card>
    </div>
  );
}
