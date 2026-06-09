const os = require('os');
const { execFile } = require('child_process');
const fs = require('fs');
function snap() { return os.cpus().map(c => ({ ...c.times })); }
function sleep(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }

let prev = snap();
sleep(1500);
const curr = snap();
let u = 0, n = 0, s = 0, idle = 0, irq = 0;
for (let i = 0; i < curr.length; i++) {
  u += curr[i].user - prev[i].user;
  n += curr[i].nice - prev[i].nice;
  s += curr[i].sys - prev[i].sys;
  idle += curr[i].idle - prev[i].idle;
  irq += curr[i].irq - prev[i].irq;
}
const total = u + n + s + idle + irq;
let log = '';
log += 'user=' + u + ' sys=' + s + ' idle=' + idle + ' irq=' + irq + ' total=' + total + '\n';
log += 'os.cpus busy% = ' + ((total - idle) / total * 100).toFixed(1) + '%\n';
log += 'user-only% = ' + (u / total * 100).toFixed(1) + '%\n';

// Compare with powershell PercentProcessorTime
const psCmd = 'Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor | Where-Object { $_.Name -eq \'_Total\' } | Select-Object -ExpandProperty PercentProcessorTime';
execFile('powershell', ['-NoProfile', '-Command', psCmd], { timeout: 6000 }, (err, stdout) => {
  log += 'powershell PercentProcessorTime = ' + (stdout || '').trim() + '%\n';
  fs.writeFileSync('os-result.txt', log);
});
