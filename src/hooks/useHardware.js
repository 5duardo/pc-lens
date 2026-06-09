import { useState, useEffect, useRef } from 'react';

// Información estática del hardware (una sola consulta)
export function useStaticInfo() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (window.hardware?.getStaticInfo) {
      window.hardware.getStaticInfo().then((d) => {
        if (mounted) setInfo(d);
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  return info;
}

// Datos en tiempo real + histórico para las gráficas
export function useRealtime(intervalMs = 1500, historyLen = 40) {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    let timer;

    async function tick() {
      if (!window.hardware?.getRealtimeInfo) return;
      const d = await window.hardware.getRealtimeInfo();
      if (!active.current) return;

      setData(d);

      if (!d.error) {
        const gpu0 = (d.gpu && d.gpu[0]) || {};
        let bestNet = (d.networkStats && d.networkStats[0]) || {};
        for (const n of d.networkStats || []) {
          if ((n.rx_sec || 0) + (n.tx_sec || 0) > (bestNet.rx_sec || 0) + (bestNet.tx_sec || 0)) {
            bestNet = n;
          }
        }
        const point = {
          t: new Date().toLocaleTimeString(),
          cpu: Math.round(d.currentLoad?.currentLoad || 0),
          ram: d.memData?.total ? Math.round((d.memData.active / d.memData.total) * 100) : 0,
          gpu: Math.round(gpu0.utilizationGpu || 0),
          down: +((bestNet.rx_sec || 0) / 1024).toFixed(1),
          up: +((bestNet.tx_sec || 0) / 1024).toFixed(1)
        };
        setHistory((h) => [...h, point].slice(-historyLen));
      }

      timer = setTimeout(tick, intervalMs);
    }

    tick();
    return () => {
      active.current = false;
      clearTimeout(timer);
    };
  }, [intervalMs, historyLen]);

  return { data, history };
}

// Lista de procesos (qué programas consumen recursos).
// Solo consulta cuando `enabled` es true para no penalizar el rendimiento
// mientras se ven otras pestañas.
export function useProcesses(enabled = false, intervalMs = 2500) {
  const [data, setData] = useState(null);
  const active = useRef(true);

  useEffect(() => {
    if (!enabled) return undefined;
    active.current = true;
    let timer;

    async function tick() {
      if (!window.hardware?.getProcesses) return;
      const d = await window.hardware.getProcesses();
      if (!active.current) return;
      setData(d);
      timer = setTimeout(tick, intervalMs);
    }

    tick();
    return () => {
      active.current = false;
      clearTimeout(timer);
    };
  }, [enabled, intervalMs]);

  return data;
}
