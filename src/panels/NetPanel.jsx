import React, { useState, useEffect } from 'react';
import { Badge, Card } from '../components/ui.jsx';
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
    <div className="flex flex-col gap-[32px]">
      {/* Red y Tráfico Actual */}
      <section>
        <div className="flex items-center gap-3 mb-[18px]">
          <div className="p-2 bg-accent2/10 rounded-lg text-accent2">
            <Icon name="net" className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[18px] font-black tracking-tight text-txt">Red y Tráfico Actual</h2>
          {best.iface && <Badge tone="blue">{best.iface}</Badge>}
        </div>

        <div className="flex flex-col md:flex-row gap-[18px]">
          <div className="flex-1 flex flex-col p-[24px] bg-card2 border border-edge rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-accent2 rounded-full blur-3xl opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-300"></div>
            
            <div className="flex gap-[18px] relative z-10 h-full">
              <div className="flex-1 bg-card border border-edge rounded-[14px] p-[20px] flex flex-col items-center justify-center shadow-sm">
                <div className="w-[40px] h-[40px] rounded-full bg-accent2/10 text-accent2 flex items-center justify-center mb-3">
                  <Icon name="down" className="w-[20px] h-[20px]" strokeWidth={2.5} />
                </div>
                <span className="text-[13px] text-muted font-bold uppercase tracking-wider mb-1">Descarga</span>
                <span className="block text-[24px] font-black text-txt tracking-tight">
                  {formatSpeed(best.rx_sec)}
                </span>
              </div>
              <div className="flex-1 bg-card border border-edge rounded-[14px] p-[20px] flex flex-col items-center justify-center shadow-sm">
                <div className="w-[40px] h-[40px] rounded-full bg-gpu/10 text-gpu flex items-center justify-center mb-3">
                  <Icon name="up" className="w-[20px] h-[20px]" strokeWidth={2.5} />
                </div>
                <span className="text-[13px] text-muted font-bold uppercase tracking-wider mb-1">Subida</span>
                <span className="block text-[24px] font-black text-txt tracking-tight">
                  {formatSpeed(best.tx_sec)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Herramientas (Speed Test + DNS) */}
      <section>
        <div className="flex items-center gap-3 mb-[18px]">
          <div className="p-2 bg-gpu/10 rounded-lg text-gpu">
            <Icon name="shield" className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[18px] font-black tracking-tight text-txt">Herramientas de Red</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[18px]">
          {/* Prueba de Velocidad */}
          <div className="flex flex-col p-[24px] bg-card2 border border-edge rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-accent rounded-full blur-3xl opacity-0 group-hover:opacity-[0.12] transition-opacity duration-300"></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <Icon name="gauge" className="w-[20px] h-[20px] text-accent" />
              <h3 className="text-[16px] font-bold text-txt">Prueba de Velocidad</h3>
            </div>

            <div className="flex flex-col items-center justify-center flex-1 relative z-10">
              {!testing && !testResult && (
                <button onClick={runSpeedTest} className="speed-test-btn shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
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
                      className="h-full bg-accent2 transition-all duration-200" 
                      style={{ width: `${testProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {!testing && testResult && !testResult.error && (
                <div className="w-full flex flex-col gap-5">
                  <div className="grid grid-cols-3 gap-3 w-full">
                    <div className="bg-card border border-edge rounded-xl p-3 text-center shadow-sm hover:border-accent transition-colors">
                      <span className="text-[11px] text-muted font-bold uppercase tracking-wider block mb-1">Ping</span>
                      <span className="text-[22px] font-black text-txt tracking-tight">{testResult.ping}</span>
                      <span className="text-[11px] text-muted ml-1">ms</span>
                    </div>
                    <div className="bg-card border border-edge rounded-xl p-3 text-center shadow-sm hover:border-accent2 transition-colors">
                      <span className="text-[11px] text-muted font-bold uppercase tracking-wider block mb-1">Descarga</span>
                      <span className="text-[22px] font-black text-accent2 tracking-tight">{testResult.download}</span>
                      <span className="text-[11px] text-muted ml-1">MB/s</span>
                    </div>
                    <div className="bg-card border border-edge rounded-xl p-3 text-center shadow-sm hover:border-freq transition-colors">
                      <span className="text-[11px] text-muted font-bold uppercase tracking-wider block mb-1">Subida</span>
                      <span className="text-[22px] font-black text-freq tracking-tight">{testResult.upload}</span>
                      <span className="text-[11px] text-muted ml-1">MB/s</span>
                    </div>
                  </div>
                  <button onClick={runSpeedTest} className="mx-auto text-[13px] font-bold text-muted hover:text-txt transition-colors flex items-center gap-2 bg-track px-4 py-2 rounded-full border border-edge hover:border-muted">
                    <Icon name="refresh" className="w-4 h-4" /> Repetir prueba
                  </button>
                </div>
              )}

              {testResult?.error && (
                <div className="text-danger text-[13px] font-bold bg-danger/10 px-4 py-2 rounded-lg border border-danger/20">✗ {testResult.error}</div>
              )}
            </div>
          </div>

          {/* Configuración DNS */}
          <div className="flex flex-col p-[24px] bg-card2 border border-edge rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-gpu rounded-full blur-3xl opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300"></div>
            
            <div className="flex items-center gap-3 mb-5 relative z-10">
              <Icon name="shield" className="w-[20px] h-[20px] text-gpu" />
              <h3 className="text-[16px] font-bold text-txt">Configuración DNS</h3>
            </div>

            <div className="flex flex-col gap-4 relative z-10 flex-1">
              <div>
                <label className="text-[12px] font-bold text-muted uppercase tracking-wider block mb-[6px]">Interfaz de red</label>
                <select
                  value={selectedIface}
                  onChange={(e) => onIfaceChange(e.target.value)}
                  className="dns-select shadow-sm"
                >
                  {dnsData.map((d) => (
                    <option key={d.iface} value={d.iface}>{d.iface}</option>
                  ))}
                </select>
              </div>

              {selectedIface && (
                <div className="text-[13px] text-muted bg-card border border-edge p-3 rounded-xl shadow-sm">
                  DNS actual:{' '}
                  <span className="text-txt font-bold">
                    {dnsData.find((d) => d.iface === selectedIface)?.dns?.join(', ') || 'Automático (DHCP)'}
                  </span>
                </div>
              )}

              <div>
                <label className="text-[12px] font-bold text-muted uppercase tracking-wider block mb-[6px]">Presets rápidos</label>
                <div className="flex flex-wrap gap-[6px]">
                  {DNS_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => applyPreset(p)}
                      className={`dns-preset-btn shadow-sm ${dnsPrimary === p.primary ? 'dns-preset-active' : ''}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-[4px]">Primario</label>
                  <input
                    type="text"
                    value={dnsPrimary}
                    onChange={(e) => { setDnsPrimary(e.target.value); setDnsMsg(''); }}
                    placeholder="8.8.8.8"
                    className="dns-input shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-[4px]">Secundario</label>
                  <input
                    type="text"
                    value={dnsSecondary}
                    onChange={(e) => { setDnsSecondary(e.target.value); setDnsMsg(''); }}
                    placeholder="8.8.4.4"
                    className="dns-input shadow-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-auto pt-2">
                <button onClick={applyDns} disabled={!dnsPrimary} className="dns-apply-btn flex-1 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <Icon name="shield" className="w-4 h-4" />
                  Aplicar
                </button>
                <button onClick={resetDns} className="dns-reset-btn flex-1 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <Icon name="resetDns" className="w-4 h-4" />
                  Automático
                </button>
              </div>

              {dnsMsg && (
                <div className={`text-[13px] font-bold mt-2 p-2 rounded-lg border text-center ${dnsMsg.startsWith('✓') ? 'text-accent bg-accent/10 border-accent/20' : dnsMsg.startsWith('✗') ? 'text-danger bg-danger/10 border-danger/20' : 'text-muted bg-track border-edge'}`}>
                  {dnsMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Historial de tráfico */}
      <section>
        <Card icon="activity" title="Tráfico de red (histórico)" collapsible>
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
      </section>
    </div>
  );
}
