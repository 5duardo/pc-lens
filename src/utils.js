export function bytesToGB(bytes) {
  if (bytes == null || isNaN(bytes)) return '--';
  return (bytes / 1024 ** 3).toFixed(1);
}

export function formatSpeed(bytesPerSec) {
  if (bytesPerSec == null || isNaN(bytesPerSec)) return '-- KB/s';
  const kb = bytesPerSec / 1024;
  if (kb < 1024) return kb.toFixed(0) + ' KB/s';
  return (kb / 1024).toFixed(2) + ' MB/s';
}

export function formatUptime(seconds) {
  if (!seconds || isNaN(seconds)) return '--:--:--';
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const pad = (num) => num.toString().padStart(2, '0');

  if (d > 0) return `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// Color plano según el nivel de carga (0-100)
export function loadColor(pct) {
  if (pct >= 85) return '#f85149';
  if (pct >= 60) return '#d29922';
  return '#4f8cff';
}

// Clase de color para badge de temperatura
export function tempInfo(temp) {
  if (temp == null || temp <= 0) return { text: 'N/D', tone: 'base' };
  const t = Math.round(temp);
  if (temp >= 80) return { text: t + ' °C', tone: 'hot' };
  if (temp >= 65) return { text: t + ' °C', tone: 'warm' };
  return { text: t + ' °C', tone: 'base' };
}

export function isIntegratedGpu(gpu) {
  return (
    gpu.vramDynamic === true ||
    /intel|integrated|uhd|iris|radeon graphics|vega/i.test(gpu.model || '')
  );
}
