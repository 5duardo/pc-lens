import React, { useState, useEffect } from 'react';
import { Card, Badge } from '../components/ui.jsx';
import { Icon } from '../icons.jsx';
import { HistoryChart } from '../components/Chart.jsx';
import { formatSpeed } from '../utils.js';

// DNS presets populares
const DNS_PRESETS = [
  { name: 'Google', primary: '8.8.8.8', secondary: '8.8.4.4' },
  { name: 'Cloudflare', primary: '1.1.1.1', secondary: '1.0.0.1' },
  { name: 'OpenDNS', primary: '208.67.222.222', secondary: '208.67.220.220' },
  { name: 'Quad9', primary: '9.9.9.9', secondary: '149.112.112.112' },
  { name: 'AdGuard', primary: '94.140.14.14', secondary: '94.140.15.15' }
];

export default function NetPanel({ data, history }) {
  const nets = data?.networkStats || [];
  let best = nets[0] || {};
  for (const n of nets) {
    if ((n.rx_sec || 0) + (n.tx_sec || 0) > (best.rx_sec || 0) + (best.tx_sec || 0)) best = n;
  }

  // --- Speed test state ---
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testPhase, setTestPhase] = useState(''); // 'ping' | 'download' | 'upload'
  const [testProgress, setTestProgress] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);

  useEffect(() => {
    if (!window.hardware?.onSpeedTestProgress) return;
    const cleanup = window.hardware.onSpeedTestProgress((data) => {
      if (data.phase === 'ping') setTestPhase('Midiendo ping...');
      else if (data.phase === 'download') setTestPhase('Descargando...');
      else if (data.phase === 'upload') setTestPhase('Subiendo...');
      setTestProgress(data.progress || 0);
      setCurrentSpeed(data.speed || 0);
    });
    return cleanup;
  }, []);

  async function runSpeedTest() {
    if (!window.hardware?.speedTest) return;
    setTesting(true);
    setTestResult(null);
    setTestProgress(0);
    setCurrentSpeed(0);

    try {
      const result = await window.hardware.speedTest();
      setTestResult(result);
    } catch {
      setTestResult({ error: 'Error al ejecutar la prueba' });
    }

    setTesting(false);
    setTestPhase('');
  }

  // --- DNS state ---
  const [dnsData, setDnsData] = useState([]);
  const [dnsLoading, setDnsLoading] = useState(false);
  const [selectedIface, setSelectedIface] = useState('');
  const [dnsPrimary, setDnsPrimary] = useState('');
  const [dnsSecondary, setDnsSecondary] = useState('');
  const [dnsMsg, setDnsMsg] = useState('');

  async function loadDns() {
    if (!window.hardware?.getDns) return;
    setDnsLoading(true);
    try {
      const d = await window.hardware.getDns();
      setDnsData(d || []);
      // Seleccionar la primera interfaz si no hay ninguna seleccionada
      if (d && d.length > 0 && !selectedIface) {
        setSelectedIface(d[0].iface);
        setDnsPrimary(d[0].dns?.[0] || '');
        setDnsSecondary(d[0].dns?.[1] || '');
      }
    } catch { /* nada */ }
    setDnsLoading(false);
  }

  useEffect(() => { loadDns(); }, []);

  function onIfaceChange(iface) {
    setSelectedIface(iface);
    const entry = dnsData.find((d) => d.iface === iface);
    setDnsPrimary(entry?.dns?.[0] || '');
    setDnsSecondary(entry?.dns?.[1] || '');
    setDnsMsg('');
  }

  function applyPreset(preset) {
    setDnsPrimary(preset.primary);
    setDnsSecondary(preset.secondary);
    setDnsMsg('');
  }

  async function applyDns() {
    if (!selectedIface || !dnsPrimary) return;
    setDnsMsg('Aplicando...');
    try {
      const res = await window.hardware.setDns({
        iface: selectedIface,
        primary: dnsPrimary,
        secondary: dnsSecondary || undefined
      });
      setDnsMsg(res.ok ? '✓ DNS aplicado correctamente' : `✗ ${res.error || 'Error'}`);
      if (res.ok) setTimeout(loadDns, 1500);
    } catch {
      setDnsMsg('✗ Error al aplicar DNS');
    }
  }

  async function resetDns() {
    if (!selectedIface) return;
    setDnsMsg('Restaurando...');
    try {
      const res = await window.hardware.resetDns({ iface: selectedIface });
      setDnsMsg(res.ok ? '✓ DNS restaurado a automático (DHCP)' : `✗ ${res.error || 'Error'}`);
      if (res.ok) setTimeout(loadDns, 1500);
    } catch {
      setDnsMsg('✗ Error al restaurar DNS');
    }
  }

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Tráfico actual */}
      <Card icon="net" title="Red">
        <div className="flex gap-[14px]">
          <div className="flex-1 bg-track border border-edge rounded-[10px] p-[14px] text-center">
            <span className="text-[12px] text-muted inline-flex items-center gap-[5px] mb-[6px]">
              <Icon name="down" className="w-[14px] h-[14px]" /> Descarga
            </span>
            <span className="block text-[18px] font-extrabold text-accent2">
              {formatSpeed(best.rx_sec)}
            </span>
          </div>
          <div className="flex-1 bg-track border border-edge rounded-[10px] p-[14px] text-center">
            <span className="text-[12px] text-muted inline-flex items-center gap-[5px] mb-[6px]">
              <Icon name="up" className="w-[14px] h-[14px]" /> Subida
            </span>
            <span className="block text-[18px] font-extrabold text-accent2">
              {formatSpeed(best.tx_sec)}
            </span>
          </div>
        </div>
        <div className="text-[12.5px] text-muted mt-3 text-center">
          {best.iface ? `Interfaz: ${best.iface}` : '--'}
        </div>
      </Card>

      {/* Prueba de velocidad */}
      <Card icon="gauge" title="Prueba de velocidad">
        <div className="flex flex-col items-center gap-4">
          {!testing && !testResult && (
            <button onClick={runSpeedTest} className="speed-test-btn">
              <Icon name="activity" className="w-5 h-5" />
              Iniciar prueba
            </button>
          )}

          {testing && (
            <div className="w-full max-w-[400px] flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="speed-spinner" />
                <span className="font-bold text-[15px]">{testPhase}</span>
              </div>
              <div className="text-[32px] font-extrabold text-accent2 tracking-tight">
                {currentSpeed > 0 ? currentSpeed.toFixed(1) : '---'} <span className="text-[14px] text-muted">MB/s</span>
              </div>
              <div className="w-full h-2.5 bg-track rounded-full overflow-hidden border border-edge">
                <div 
                  className="h-full bg-gradient-to-r from-accent2 to-freq transition-all duration-200" 
                  style={{ width: `${testProgress}%` }}
                />
              </div>
            </div>
          )}

          {!testing && testResult && !testResult.error && (
            <div className="w-full flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3 w-full">
                <div className="bg-track border border-edge rounded-[10px] p-3 text-center">
                  <span className="text-[11px] text-muted block mb-1">Ping</span>
                  <span className="text-[20px] font-extrabold text-accent">{testResult.ping}</span>
                  <span className="text-[11px] text-muted ml-1">ms</span>
                </div>
                <div className="bg-track border border-edge rounded-[10px] p-3 text-center">
                  <span className="text-[11px] text-muted block mb-1">Descarga</span>
                  <span className="text-[20px] font-extrabold text-accent2">{testResult.download}</span>
                  <span className="text-[11px] text-muted ml-1">MB/s</span>
                </div>
                <div className="bg-track border border-edge rounded-[10px] p-3 text-center">
                  <span className="text-[11px] text-muted block mb-1">Subida</span>
                  <span className="text-[20px] font-extrabold text-freq">{testResult.upload}</span>
                  <span className="text-[11px] text-muted ml-1">MB/s</span>
                </div>
              </div>
              <button onClick={runSpeedTest} className="mx-auto text-[13px] text-muted hover:text-txt transition-colors flex items-center gap-2">
                <Icon name="refresh" className="w-4 h-4" /> Repetir prueba
              </button>
            </div>
          )}

          {testResult?.error && (
            <div className="text-danger text-[13px]">✗ {testResult.error}</div>
          )}
        </div>
      </Card>

      {/* Configuración DNS */}
      <Card icon="shield" title="Configuración DNS">
        <div className="flex flex-col gap-4">
          {/* Selector de interfaz */}
          <div>
            <label className="text-[12px] text-muted block mb-[6px]">Interfaz de red</label>
            <select
              value={selectedIface}
              onChange={(e) => onIfaceChange(e.target.value)}
              className="dns-select"
            >
              {dnsData.map((d) => (
                <option key={d.iface} value={d.iface}>{d.iface}</option>
              ))}
            </select>
          </div>

          {/* DNS actual */}
          {selectedIface && (
            <div className="text-[12.5px] text-muted">
              DNS actual:{' '}
              <span className="text-txt font-medium">
                {dnsData.find((d) => d.iface === selectedIface)?.dns?.join(', ') || 'Automático (DHCP)'}
              </span>
            </div>
          )}

          {/* Presets */}
          <div>
            <label className="text-[12px] text-muted block mb-[6px]">Presets populares</label>
            <div className="flex flex-wrap gap-[6px]">
              {DNS_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className={`dns-preset-btn ${dnsPrimary === p.primary ? 'dns-preset-active' : ''}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Campos de entrada */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] text-muted block mb-[6px]">DNS Primario</label>
              <input
                type="text"
                value={dnsPrimary}
                onChange={(e) => { setDnsPrimary(e.target.value); setDnsMsg(''); }}
                placeholder="8.8.8.8"
                className="dns-input"
              />
            </div>
            <div>
              <label className="text-[12px] text-muted block mb-[6px]">DNS Secundario</label>
              <input
                type="text"
                value={dnsSecondary}
                onChange={(e) => { setDnsSecondary(e.target.value); setDnsMsg(''); }}
                placeholder="8.8.4.4"
                className="dns-input"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button onClick={applyDns} disabled={!dnsPrimary} className="dns-apply-btn">
              <Icon name="shield" className="w-4 h-4" />
              Aplicar DNS
            </button>
            <button onClick={resetDns} className="dns-reset-btn">
              <Icon name="resetDns" className="w-4 h-4" />
              Restaurar automático
            </button>
          </div>

          {/* Mensaje de estado */}
          {dnsMsg && (
            <div className={`text-[13px] ${dnsMsg.startsWith('✓') ? 'text-accent' : dnsMsg.startsWith('✗') ? 'text-danger' : 'text-muted'}`}>
              {dnsMsg}
            </div>
          )}
        </div>
      </Card>

      {/* Historial de tráfico */}
      <Card icon="net" title="Tráfico de red (KB/s)" collapsible>
        <HistoryChart
          data={history}
          unit=" KB/s"
          domain={[0, 'auto']}
          series={[
            { key: 'down', name: 'Descarga', color: '#4f8cff' },
            { key: 'up', name: 'Subida', color: '#3fb950' }
          ]}
        />
      </Card>
    </div>
  );
}
