import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

// Gráfica de área para el histórico (uso %, velocidad, etc.)
export function HistoryChart({ data, series, unit = '%', domain = [0, 100], height = 200 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.04} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a313c" vertical={false} />
          <XAxis dataKey="t" tick={{ fill: '#8b97ad', fontSize: 10 }} minTickGap={28} stroke="#2a313c" />
          <YAxis
            domain={domain}
            tick={{ fill: '#8b97ad', fontSize: 10 }}
            stroke="#2a313c"
            width={42}
            tickFormatter={(v) => `${v}${unit === '%' ? '' : ''}`}
          />
          <Tooltip
            contentStyle={{
              background: '#161b22',
              border: '1px solid #2a313c',
              borderRadius: 8,
              color: '#e6ebf5',
              fontSize: 12
            }}
            formatter={(value, name) => [`${value}${unit}`, name]}
            labelStyle={{ color: '#8b97ad' }}
          />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              isAnimationActive={false}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
