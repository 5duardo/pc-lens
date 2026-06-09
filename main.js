const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const si = require('systeminformation');

// electron-updater puede no estar disponible en dev; lo cargamos con guarda.
let autoUpdater = null;
try {
  autoUpdater = require('electron-updater').autoUpdater;
  autoUpdater.autoDownload = false; // descargamos solo cuando el usuario acepta
  autoUpdater.autoInstallOnAppQuit = true;
} catch {
  autoUpdater = null;
}

let mainWindow;
let splashWindow;

// =====================================================================
// RECOLECCIÓN DE DATOS EN TIEMPO REAL — ARQUITECTURA DE CACHE
// =====================================================================
// PROBLEMA: llamar si.currentLoad() + si.graphics() + si.networkStats()
// + si.mem() + si.cpuTemperature() + si.fsSize() + PowerShell TODO JUNTO
// cada 1.5s consume ~40% de CPU del sistema. El muestreo de CPU captura
// ese consumo propio y reporta valores falsos (47-93% en reposo).
//
// SOLUCIÓN: TODAS las lecturas corren en timers independientes con cache.
// get-realtime-info SOLO devuelve datos ya cacheados (cero cómputo).
// Las lecturas pesadas (GPU, PowerShell) se espacian más (3-5s).
// Las ligeras (mem, temp, net) se refrescan cada 2s.
// El CPU load se muestrea solo, aislado, sin queries pesadas encima.
// =====================================================================

// --- Timers de recolección (se limpian al cerrar) ---
const samplerTimers = [];

function startSampler(fn, intervalMs, initialDelayMs = 0) {
  setTimeout(() => {
    fn(); // primera ejecución
    const id = setInterval(fn, intervalMs);
    samplerTimers.push(id);
  }, initialDelayMs);
}

function stopAllSamplers() {
  for (const id of samplerTimers) clearInterval(id);
  samplerTimers.length = 0;
}

// ---- 1. CPU LOAD (ligero, cada 2s) ----
let cpuLoadCache = { currentLoad: 0, cpus: [] };

async function sampleCpuLoad() {
  try {
    const d = await si.currentLoad();
    cpuLoadCache = {
      currentLoad: d.currentLoad,
      cpus: d.cpus.map((c) => ({ load: c.load }))
    };
  } catch { /* mantener cache */ }
}

// ---- 2. MEMORIA (ligero, cada 2s) ----
let memCache = null;

async function sampleMem() {
  try { memCache = await si.mem(); } catch { /* mantener cache */ }
}

// ---- 3. TEMPERATURA CPU (ligero, cada 2s) ----
let cpuTempCache = null;

async function sampleCpuTemp() {
  try { cpuTempCache = await si.cpuTemperature(); } catch { /* mantener cache */ }
}

// ---- 4. RED (moderado, cada 2s) ----
let netCache = [];

async function sampleNet() {
  try { netCache = await si.networkStats(); } catch { /* mantener cache */ }
}

// ---- 5. DISCO (filesystem sizes, ligero, cada 5s) ----
let fsSizeCache = [];

async function sampleFsSize() {
  try { fsSizeCache = await si.fsSize(); } catch { /* mantener cache */ }
}

// ---- 6. GPU (pesado, cada 3s) ----
let gpuCache = [];

async function sampleGpu() {
  try {
    const g = await si.graphics();
    gpuCache = g.controllers || [];
  } catch { /* mantener cache */ }
}

// ---- 7. FRECUENCIA con boost vía PowerShell (cada 5s) ----
let freqCache = null; // MHz reales con boost
let freqRunning = false;

function sampleFrequency() {
  if (freqRunning) return;
  freqRunning = true;

  const psCmd =
    'Get-CimInstance Win32_PerfFormattedData_Counters_ProcessorInformation ' +
    "| Where-Object { $_.Name -eq '_Total' } " +
    '| Select-Object PercentProcessorPerformance, ProcessorFrequency ' +
    '| ConvertTo-Json';

  execFile('powershell', ['-NoProfile', '-Command', psCmd], { timeout: 4000 }, (err, stdout) => {
    freqRunning = false;
    if (err || !stdout) return;
    try {
      const data = JSON.parse(stdout);
      const baseFreq = data.ProcessorFrequency || 0;
      const perfPct = data.PercentProcessorPerformance || 100;
      if (baseFreq > 0) {
        freqCache = baseFreq * perfPct / 100; // MHz con boost
      }
    } catch { /* mantener cache */ }
  });
}

// ---- 8. ACTIVIDAD DE DISCO vía PowerShell (cada 5s) ----
let diskCache = [];
let diskRunning = false;

function sampleDiskActivity() {
  if (diskRunning) return;
  diskRunning = true;

  const psCmd =
    'Get-CimInstance Win32_PerfFormattedData_PerfDisk_LogicalDisk ' +
    '| Select-Object Name, PercentDiskTime, DiskReadBytesPerSec, DiskWriteBytesPerSec ' +
    '| ConvertTo-Json -Depth 2';

  execFile('powershell', ['-NoProfile', '-Command', psCmd], { timeout: 4000 }, (err, stdout) => {
    diskRunning = false;
    if (err || !stdout) return;
    try {
      const data = JSON.parse(stdout);
      const diskArr = Array.isArray(data) ? data : (data ? [data] : []);
      diskCache = diskArr
        .filter((d) => d.Name && d.Name !== '_Total' && d.Name.includes(':'))
        .map((d) => ({
          name: d.Name,
          activity: Math.min(100, d.PercentDiskTime || 0),
          readSpeed: d.DiskReadBytesPerSec || 0,
          writeSpeed: d.DiskWriteBytesPerSec || 0
        }));
    } catch { /* mantener cache */ }
  });
}

// ---- Iniciar todos los samplers con delays escalonados ----
function startAllSamplers() {
  // CPU load: "cebar" con primera llamada, luego muestrear cada 2s
  si.currentLoad().then(() => {
    startSampler(sampleCpuLoad, 2000, 300);
  }).catch(() => {});

  // Datos ligeros: escalonados para no coincidir
  startSampler(sampleMem,       2000, 100);
  startSampler(sampleCpuTemp,   2000, 200);
  startSampler(sampleNet,       2000, 400);

  // Datos pesados: más espaciados
  startSampler(sampleFsSize,    5000, 500);
  startSampler(sampleGpu,       3000, 600);

  // PowerShell: aún más espaciados
  startSampler(sampleFrequency,    5000, 1000);
  startSampler(sampleDiskActivity, 5000, 2000);
}

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 440,
    height: 320,
    frame: false,
    transparent: false,
    resizable: false,
    alwaysOnTop: true,
    backgroundColor: '#000000',
    center: true,
    webPreferences: { contextIsolation: true }
  });
  splashWindow.loadFile('splash.html');
  splashWindow.on('closed', () => { splashWindow = null; });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 600,
    backgroundColor: '#000000',
    title: 'PC Lens',
    icon: path.join(__dirname, 'src', 'assets', 'logo.ico'),
    show: false, // se muestra cuando el renderer avisa que terminó de cargar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.setMenuBarVisibility(false);

  // En desarrollo carga el dev server de Vite; en producción el build de dist/
  if (process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Failsafe: si el renderer no avisa, mostramos igualmente
  setTimeout(() => revealMainWindow(), 8000);
}

function revealMainWindow() {
  if (mainWindow && !mainWindow.isVisible()) {
    mainWindow.show();
    mainWindow.focus();
  }
  if (splashWindow) splashWindow.close();
}

// El renderer envía esto cuando ya cargó los datos del hardware
ipcMain.on('app-ready', () => revealMainWindow());

// ---------- Auto-update (GitHub Releases) ----------
function sendUpdateStatus(status, payload = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', { status, ...payload });
  }
}

function setupAutoUpdater() {
  if (!autoUpdater) return;

  autoUpdater.on('checking-for-update', () => sendUpdateStatus('checking'));
  autoUpdater.on('update-available', (info) =>
    sendUpdateStatus('available', { version: info.version, notes: info.releaseNotes })
  );
  autoUpdater.on('update-not-available', (info) =>
    sendUpdateStatus('not-available', { version: info.version })
  );
  autoUpdater.on('download-progress', (p) =>
    sendUpdateStatus('downloading', { percent: Math.round(p.percent) })
  );
  autoUpdater.on('update-downloaded', (info) =>
    sendUpdateStatus('downloaded', { version: info.version })
  );
  autoUpdater.on('error', (err) =>
    sendUpdateStatus('error', { message: err == null ? 'desconocido' : (err.message || String(err)) })
  );
}

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('check-for-updates', async () => {
  if (!autoUpdater) return { ok: false, reason: 'updater-no-disponible' };
  try {
    await autoUpdater.checkForUpdates();
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
});

ipcMain.handle('download-update', async () => {
  if (!autoUpdater) return { ok: false };
  try {
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
});

ipcMain.handle('install-update', () => {
  if (autoUpdater) autoUpdater.quitAndInstall();
});

app.whenReady().then(() => {
  createSplash();
  createWindow();
  setupAutoUpdater();
  startAllSamplers();  // inicia recolección de TODOS los datos

  // Comprobación automática al inicio (silenciosa) tras unos segundos
  if (autoUpdater && !process.argv.includes('--dev')) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => {});
    }, 6000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopAllSamplers();
  if (process.platform !== 'darwin') app.quit();
});

// ---------- Información estática del hardware (se consulta una vez) ----------
ipcMain.handle('get-static-info', async () => {
  try {
    const [cpu, mem, system, baseboard, bios, graphics, osInfo, diskLayout, blockDevices, memLayout, usb, audio, bluetoothDevices] =
      await Promise.all([
        si.cpu(),
        si.mem(),
        si.system(),
        si.baseboard(),
        si.bios(),
        si.graphics(),
        si.osInfo(),
        si.diskLayout(),
        si.blockDevices(),
        si.memLayout(),
        si.usb(),
        si.audio(),
        si.bluetoothDevices()
      ]);

    const electronDisplays = require('electron').screen.getAllDisplays();
    const mergedDisplays = (graphics.displays || []).map((d, i) => {
      // Intentar encontrar coincidencia por posición, si no, usar índice
      let ed = electronDisplays.find(e => e.bounds.x === d.positionX && e.bounds.y === d.positionY);
      if (!ed) ed = electronDisplays[i] || {};
      
      return {
        ...d,
        model: ed.label || d.model, // Sobrescribir model con el real
        currentRefreshRate: ed.displayFrequency || d.currentRefreshRate // Sobrescribir hz con el real
      };
    });

    return {
      cpu, mem, system, baseboard, bios, graphics, osInfo,
      diskLayout, blockDevices, memLayout,
      displays: mergedDisplays,
      usb, audio, bluetoothDevices
    };
  } catch (err) {
    return { error: err.message };
  }
});

// ---------- Datos en tiempo real ----------
// CERO cómputo: solo devuelve datos ya cacheados por los samplers.
ipcMain.handle('get-realtime-info', () => {
  // Frecuencia: usar la del contador de Windows (con boost) si está disponible,
  // si no, caer al valor de os.cpus() como fallback.
  const cpuCores = os.cpus();
  const freqMHz = freqCache || (cpuCores[0]?.speed || 0);
  const freqGHz = +(freqMHz / 1000).toFixed(2);

  return {
    currentLoad: cpuLoadCache,
    memData: memCache,
    cpuTemp: cpuTempCache,
    gpu: gpuCache,
    fsSize: fsSizeCache,
    networkStats: netCache,
    cpuSpeed: {
      avg: freqGHz,
      min: freqGHz,
      max: freqGHz,
      cores: cpuCores.map(() => freqGHz)
    },
    diskActivity: diskCache,
    uptime: os.uptime()
  };
});

// ---------- Procesos en ejecución (qué programas consumen recursos) ----------
ipcMain.handle('get-processes', async () => {
  try {
    const proc = await si.processes();
    // Nos quedamos solo con los campos útiles para reducir el tamaño del payload.
    const list = (proc.list || []).map((p) => ({
      pid: p.pid,
      name: p.name,
      cpu: p.cpu || 0, // % de CPU
      mem: p.mem || 0, // % de RAM total
      memRss: p.memRss || 0 // KB residentes
    }));

    return {
      all: proc.all,
      running: proc.running,
      sleeping: proc.sleeping,
      list
    };
  } catch (err) {
    return { error: err.message };
  }
});

// ---------- Prueba de velocidad de Internet ----------
ipcMain.handle('speed-test', async (event) => {
  const http = require('http');
  const https = require('https');
  const { URL } = require('url');

  const result = { ping: null, download: null, upload: null, error: null };

  const sendProgress = (phase, progress, speed) => {
    event.sender.send('speed-test-progress', { phase, progress, speed });
  };

  try {
    // 1) PING
    sendProgress('ping', 0, 0);
    const pingStart = Date.now();
    await new Promise((resolve, reject) => {
      const req = https.get('https://www.cloudflare.com/cdn-cgi/trace', { timeout: 3000 }, (res) => {
        res.resume();
        res.on('end', resolve);
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
    result.ping = Date.now() - pingStart;
    sendProgress('ping', 100, result.ping);

    // 2) DOWNLOAD (15 segundos)
    const dlStart = Date.now();
    let dlBytes = 0;
    let lastDlBytes = 0;
    let lastDlTime = dlStart;
    let currentDlSpeed = 0;

    const dlInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastDlTime) / 1000;
      if (elapsed >= 0.2) { // update speed every ~200ms
        const bytesPerSec = (dlBytes - lastDlBytes) / elapsed;
        currentDlSpeed = bytesPerSec / (1024 * 1024); // MB/s
        lastDlTime = now;
        lastDlBytes = dlBytes;
      }
      const pct = Math.min(100, ((now - dlStart) / 15000) * 100);
      sendProgress('download', pct, currentDlSpeed);
    }, 200);

    await new Promise((resolve, reject) => {
      let req;
      const finish = () => {
        clearInterval(dlInterval);
        if (req && !req.destroyed) req.destroy();
        resolve();
      };
      
      const timeoutTimer = setTimeout(finish, 15000); // 15s límite

      // Archivo de prueba de 1GB público de OVH (nunca bloquea por tamaño)
      const url = 'https://proof.ovh.net/files/1Gb.dat';
      req = https.get(url, (res) => {
        // Seguir redirects simples
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const parsed = new URL(res.headers.location);
          const mod = parsed.protocol === 'http:' ? http : https;
          req = mod.get(res.headers.location, (res2) => {
            res2.on('data', (chunk) => { dlBytes += chunk.length; });
            res2.on('end', () => { clearTimeout(timeoutTimer); finish(); });
            res2.on('error', () => { clearTimeout(timeoutTimer); finish(); });
          }).on('error', () => { clearTimeout(timeoutTimer); finish(); });
          return;
        }
        res.on('data', (chunk) => { dlBytes += chunk.length; });
        res.on('end', () => { clearTimeout(timeoutTimer); finish(); });
        res.on('error', () => { clearTimeout(timeoutTimer); finish(); });
      });
      req.on('error', () => { clearTimeout(timeoutTimer); finish(); });
    });

    const totalDlTime = (Date.now() - dlStart) / 1000;
    result.download = totalDlTime > 0 ? +(dlBytes / totalDlTime / (1024 * 1024)).toFixed(2) : 0;
    sendProgress('download', 100, result.download);

    // 3) UPLOAD (15 segundos)
    const ulStart = Date.now();
    let ulBytes = 0;
    let ulActive = true;
    let lastUlBytes = 0;
    let lastUlTime = ulStart;
    let currentUlSpeed = 0;

    const ulInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastUlTime) / 1000;
      if (elapsed >= 0.2) {
        const bytesPerSec = (ulBytes - lastUlBytes) / elapsed;
        currentUlSpeed = bytesPerSec / (1024 * 1024); // MB/s
        lastUlTime = now;
        lastUlBytes = ulBytes;
      }
      const pct = Math.min(100, ((now - ulStart) / 15000) * 100);
      sendProgress('upload', pct, currentUlSpeed);
    }, 200);

    await new Promise((resolve) => {
      let req;
      const finish = () => {
        ulActive = false;
        clearInterval(ulInterval);
        if (req && !req.destroyed) req.destroy();
        resolve();
      };
      const timeoutTimer = setTimeout(finish, 15000); // 15s límite

      const uploadUrl = new URL('https://speed.cloudflare.com/__up');
      req = https.request({
        hostname: uploadUrl.hostname,
        path: uploadUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': 200_000_000 // fingimos enviar 200MB
        }
      }, (res) => {
        res.on('data', () => {});
        res.on('end', () => { clearTimeout(timeoutTimer); finish(); });
        res.on('error', () => { clearTimeout(timeoutTimer); finish(); });
      });

      req.on('error', () => { clearTimeout(timeoutTimer); finish(); });

      const chunk = Buffer.alloc(1_000_000, 'x'); // chunks de 1MB
      function writeData() {
        if (!ulActive) return;
        let ok = true;
        while (ok && ulActive) {
          ok = req.write(chunk);
          if (ok) ulBytes += chunk.length;
        }
        if (ulActive) {
          req.once('drain', () => {
            ulBytes += chunk.length; // contarlo cuando se drena también
            writeData();
          });
        }
      }
      writeData();
    });

    const totalUlTime = (Date.now() - ulStart) / 1000;
    result.upload = totalUlTime > 0 ? +((ulBytes * 8) / totalUlTime / 1_000_000).toFixed(2) : 0;
    sendProgress('upload', 100, result.upload);

  } catch (err) {
    result.error = err.message || 'Error desconocido';
  }

  return result;
});

// ---------- Obtener DNS actual ----------
ipcMain.handle('get-dns', async () => {
  return new Promise((resolve) => {
    const psCmd =
      'Get-DnsClientServerAddress -AddressFamily IPv4 ' +
      '| Where-Object { $_.ServerAddresses.Count -gt 0 } ' +
      '| Select-Object InterfaceAlias, ServerAddresses ' +
      '| ConvertTo-Json -Depth 2';

    execFile('powershell', ['-NoProfile', '-Command', psCmd], { timeout: 5000 }, (err, stdout) => {
      if (err || !stdout) return resolve([]);
      try {
        const data = JSON.parse(stdout);
        const arr = Array.isArray(data) ? data : [data];
        resolve(arr.map((d) => ({
          iface: d.InterfaceAlias || '',
          dns: d.ServerAddresses || []
        })));
      } catch {
        resolve([]);
      }
    });
  });
});

// ---------- Cambiar DNS ----------
ipcMain.handle('set-dns', async (_e, { iface, primary, secondary }) => {
  return new Promise((resolve) => {
    // Necesita elevación (admin). Usamos PowerShell Start-Process con -Verb RunAs.
    const dnsCmd = secondary
      ? `Set-DnsClientServerAddress -InterfaceAlias '${iface}' -ServerAddresses ('${primary}','${secondary}')`
      : `Set-DnsClientServerAddress -InterfaceAlias '${iface}' -ServerAddresses ('${primary}')`;

    const psCmd = `Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile','-Command','${dnsCmd.replace(/'/g, "''")}'`;

    execFile('powershell', ['-NoProfile', '-Command', psCmd], { timeout: 30000 }, (err) => {
      if (err) return resolve({ ok: false, error: err.message });
      resolve({ ok: true });
    });
  });
});

// ---------- Restaurar DNS automático (DHCP) ----------
ipcMain.handle('reset-dns', async (_e, { iface }) => {
  return new Promise((resolve) => {
    const dnsCmd = `Set-DnsClientServerAddress -InterfaceAlias '${iface}' -ResetServerAddresses`;
    const psCmd = `Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile','-Command','${dnsCmd.replace(/'/g, "''")}'`;

    execFile('powershell', ['-NoProfile', '-Command', psCmd], { timeout: 30000 }, (err) => {
      if (err) return resolve({ ok: false, error: err.message });
      resolve({ ok: true });
    });
  });
});
