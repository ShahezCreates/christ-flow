const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = __dirname;
const PORT = 5173;
const DATA_FILE = path.join(ROOT, 'data', 'campus.json');
const PUBLIC = path.join(ROOT, 'public');
const C_DIR = path.join(ROOT, 'c-engine');
const IS_WIN = process.platform === 'win32';
const ENGINE = path.join(C_DIR, IS_WIN ? 'pulse_engine.exe' : 'pulse_engine');
const C_SOURCE = path.join(C_DIR, 'pulse_engine.c');

function loadData() { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function saveData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }

function ensureEngine() {
  if (fs.existsSync(ENGINE)) return true;
  const compiler = process.env.CC || 'gcc';
  const args = IS_WIN
    ? [C_SOURCE, '-O2', '-o', ENGINE]
    : [C_SOURCE, '-O2', '-o', ENGINE];
  const result = spawnSync(compiler, args, { encoding: 'utf8' });
  return result.status === 0 && fs.existsSync(ENGINE);
}

function runC(args) {
  if (!ensureEngine()) throw new Error('C engine is not compiled. Install GCC and restart the server.');
  const raw = execFileSync(ENGINE, args, { encoding: 'utf8' }).trim();
  return JSON.parse(raw);
}

function enrichLocation(item) {
  try {
    return { ...item, ...runC(['analyze', String(item.users), String(item.capacity), item.category, String(item.reports), String(item.confirmations), String(item.urgency), item.name]) };
  } catch (e) {
    return { ...item, engineError: e.message };
  }
}

function send(res, status, body, type='application/json') {
  res.writeHead(status, {'Content-Type': type, 'Cache-Control': 'no-store'});
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.normalize(path.join(PUBLIC, urlPath));
  if (!filePath.startsWith(PUBLIC)) return send(res, 403, {error:'Forbidden'});
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return send(res, 404, {error:'Not found'});
  const ext = path.extname(filePath).toLowerCase();
  const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
  res.writeHead(200, {'Content-Type': types[ext] || 'application/octet-stream'});
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/locations') && req.method === 'GET') {
    const data = loadData();
    return send(res, 200, { locations: data.locations.map(enrichLocation), engine: fs.existsSync(ENGINE) });
  }

  if (req.url === '/api/engine' && req.method === 'GET') {
    return send(res, 200, { available: ensureEngine(), platform: process.platform });
  }

  if (req.url === '/api/analyze' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const item = JSON.parse(body);
        const result = runC(['analyze', String(item.users), String(item.capacity), item.category || 'food', String(item.reports || 0), String(item.confirmations || 0), String(item.urgency || 1), item.location || 'Custom Location']);
        send(res, 200, result);
      } catch (e) { send(res, 400, {error:e.message}); }
    });
    return;
  }

  if (req.url.startsWith('/api/confirm/') && req.method === 'POST') {
    const id = req.url.split('/').pop();
    const data = loadData();
    const location = data.locations.find(x => x.id === id);
    if (!location) return send(res, 404, {error:'Location not found'});
    location.confirmations += 1;
    location.users = Math.max(0, location.users);
    saveData(data);
    return send(res, 200, enrichLocation(location));
  }

  if (req.url === '/api/reset' && req.method === 'POST') {
    // Reset is intentionally disabled in production; prototype reloads source JSON by restarting server.
    return send(res, 200, {ok:true, message:'Restart the prototype server to reload demo data.'});
  }

  serveStatic(req, res);
});

server.listen(PORT, () => console.log(`Christ Flow running at http://localhost:${PORT}`));
