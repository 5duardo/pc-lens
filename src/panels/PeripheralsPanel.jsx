import React from 'react';
import { Badge, Tag } from '../components/ui.jsx';
import { Icon } from '../icons.jsx';

function DeviceBox({ name, sub, tag, iconName, colorClass }) {
  return (
    <div className="flex flex-col p-[20px] bg-card2 border border-edge rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
      {/* Glow de fondo tenue en hover */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${colorClass.split(' ')[0]}`}></div>
      
      <div className={`w-[48px] h-[48px] rounded-xl flex items-center justify-center mb-5 ${colorClass} shadow-sm`}>
        <Icon name={iconName} className="w-[24px] h-[24px]" strokeWidth={2.2} />
      </div>
      
      <div className="text-[14.5px] font-extrabold text-txt break-words leading-tight" title={name}>{name}</div>
      <div className="text-[12.5px] text-muted break-words mt-[6px] font-medium leading-snug" title={sub}>{sub || 'Dispositivo estándar'}</div>
      
      {tag && (
        <div className="mt-[18px] flex items-center">
          <Tag tone="base">{tag}</Tag>
        </div>
      )}
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
    <div className="flex flex-col gap-[32px]">
      {/* USB Section */}
      <section>
        <div className="flex items-center gap-3 mb-[18px]">
          <div className="p-2 bg-accent/10 rounded-lg text-accent">
            <Icon name="device" className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[18px] font-black tracking-tight text-txt">USB</h2>
          <Badge tone="blue">{usbDevices.length}</Badge>
        </div>
        
        {usbDevices.length === 0 ? (
          <div className="text-[13.5px] text-muted font-medium p-5 bg-card2 rounded-2xl border border-edge text-center">No se detectaron dispositivos USB.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[16px]">
            {usbDevices.map((u, i) => (
              <DeviceBox
                key={i}
                name={u.name}
                sub={u.manufacturer || u.vendor || ''}
                tag={u.type}
                iconName="device"
                colorClass="bg-accent text-card"
              />
            ))}
          </div>
        )}
      </section>

      {/* Audio Section */}
      <section>
        <div className="flex items-center gap-3 mb-[18px]">
          <div className="p-2 bg-gpu/10 rounded-lg text-gpu">
            <Icon name="headphones" className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[18px] font-black tracking-tight text-txt">Audio</h2>
          <Badge tone="pink">{audioDevices.length}</Badge>
        </div>
        
        {audioDevices.length === 0 ? (
          <div className="text-[13.5px] text-muted font-medium p-5 bg-card2 rounded-2xl border border-edge text-center">No se detectaron dispositivos de audio.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[16px]">
            {audioDevices.map((a, i) => (
              <DeviceBox
                key={i}
                name={a.name}
                sub={a.manufacturer || ''}
                tag={a.type || null}
                iconName="headphones"
                colorClass="bg-gpu text-white"
              />
            ))}
          </div>
        )}
      </section>

      {/* Bluetooth Section */}
      <section>
        <div className="flex items-center gap-3 mb-[18px]">
          <div className="p-2 bg-accent2/10 rounded-lg text-accent2">
            <Icon name="bluetooth" className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[18px] font-black tracking-tight text-txt">Bluetooth</h2>
          <Badge tone="blue">{btDevices.length}</Badge>
        </div>
        
        {btDevices.length === 0 ? (
          <div className="text-[13.5px] text-muted font-medium p-5 bg-card2 rounded-2xl border border-edge text-center">No se detectaron dispositivos Bluetooth.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[16px]">
            {btDevices.map((b, i) => (
              <DeviceBox
                key={i}
                name={b.name}
                sub={b.manufacturer || ''}
                tag={b.type || null}
                iconName="bluetooth"
                colorClass="bg-accent2 text-white"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
