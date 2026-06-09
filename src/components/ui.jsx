import React, { useState } from 'react';
import { Icon } from '../icons.jsx';

export function Card({ icon, title, badge, children, collapsible = false, defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="bg-card border border-edge rounded-xl overflow-hidden">
      <div className="flex justify-between items-center px-[18px] py-[14px] border-b border-edge bg-card2">
        <h2 className="text-[15px] font-semibold flex items-center gap-[9px]">
          {icon && <Icon name={icon} className="w-[18px] h-[18px] text-muted" />}
          {title}
        </h2>
        <div className="flex items-center gap-[10px]">
          {badge}
          {collapsible && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="inline-flex items-center gap-[5px] text-[12px] text-muted hover:text-txt border border-edge rounded-lg px-[9px] py-[4px] transition-colors"
              title={collapsed ? 'Mostrar' : 'Ocultar'}
            >
              <Icon name="eye" className="w-[14px] h-[14px]" />
              {collapsed ? 'Mostrar' : 'Ocultar'}
            </button>
          )}
        </div>
      </div>
      {!collapsed && <div className="p-[18px]">{children}</div>}
    </div>
  );
}

const TONES = {
  base: 'bg-accent/[0.12] text-accent border-accent/30',
  warm: 'bg-warn/[0.14] text-warn border-warn/30',
  hot: 'bg-danger/[0.14] text-danger border-danger/30',
  blue: 'bg-accent2/[0.14] text-accent2 border-accent2/30',
  pink: 'bg-gpu/[0.14] text-gpu border-gpu/30'
};

export function Badge({ children, tone = 'base' }) {
  return (
    <span className={`text-[13px] font-bold px-[10px] py-[4px] rounded-lg border ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Tag({ children, tone = 'blue' }) {
  return (
    <span
      className={`text-[10.5px] font-bold px-2 py-[2px] rounded-full border align-middle ml-[6px] ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function Bar({ value = 0, color = '#4f8cff', variant }) {
  const bg = variant === 'freq' ? '#a371f7' : variant === 'gpu' ? '#db61a2' : color;
  return (
    <div className="h-3 bg-track border border-edge rounded-md overflow-hidden">
      <div
        className="h-full rounded-md transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: bg }}
      />
    </div>
  );
}

export function Gauge({ label, value, valueText, color, variant }) {
  return (
    <div className="flex-1">
      <div className="text-[12px] text-muted mb-[6px]">{label}</div>
      <Bar value={value} color={color} variant={variant} />
      <div className="text-[14px] font-bold mt-[6px]">{valueText}</div>
    </div>
  );
}

export function KV({ rows }) {
  return (
    <ul className="list-none">
      {rows.map((r, i) => (
        <li
          key={i}
          className="flex justify-between py-2 border-b border-edge last:border-b-0 text-[13px]"
        >
          <span className="text-muted">{r.k}</span>
          <b className="font-semibold text-right max-w-[60%]">{r.v || '--'}</b>
        </li>
      ))}
    </ul>
  );
}

export function Ring({ percent = 0, color = '#3fb950' }) {
  return (
    <div
      className="w-[130px] h-[130px] rounded-full flex items-center justify-center transition-all duration-500"
      style={{ background: `conic-gradient(${color} ${percent * 3.6}deg, #0e1320 0deg)` }}
    >
      <div className="w-[96px] h-[96px] bg-card rounded-full flex flex-col items-center justify-center">
        <span className="text-[24px] font-extrabold">{percent}%</span>
        <small className="text-[11px] text-muted">en uso</small>
      </div>
    </div>
  );
}
