const si = require('systeminformation');
si.graphics().then(data => console.log(JSON.stringify(data.displays, null, 2))).catch(console.error);
