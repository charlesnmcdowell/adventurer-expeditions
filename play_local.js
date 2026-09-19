'use strict';
// Local play server. Double-click "Play Adventurer.bat" or run: node play_local.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const HOST = '127.0.0.1';
const PREFERRED = Number(process.env.ADV_PORT) || 8734;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

function fileFromUrl(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent((urlPath || '/').split('?')[0].split('#')[0]); }
  catch (e) { return null; }
  const rel = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const full = path.normalize(path.join(ROOT, rel));
  const root = path.normalize(ROOT + path.sep);
  if (full !== path.normalize(ROOT) && !full.startsWith(root)) return null;
  return full;
}

function handler(req, res) {
  const file = fileFromUrl(req.url);
  if (!file) { res.writeHead(403); res.end(); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  });
}

function listen(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.once('error', err => {
      if (err.code === 'EADDRINUSE') resolve(null);
      else reject(err);
    });
    server.listen(port, HOST, () => resolve(server));
  });
}

async function adventurerAt(port) {
  try {
    const r = await fetch('http://' + HOST + ':' + port + '/index.html');
    if (!r.ok) return false;
    return (await r.text()).includes('<title>Adventurer</title>');
  } catch (e) { return false; }
}

function openBrowser(url) {
  spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
}

(async () => {
  let port = PREFERRED;
  let server = await listen(port);
  if (!server) {
    if (await adventurerAt(port)) {
      const url = 'http://' + HOST + ':' + port + '/index.html';
      console.log('Adventurer is already running at ' + url);
      if (process.env.ADV_NO_BROWSER !== '1') openBrowser(url);
      return;
    }
    for (let next = PREFERRED + 1; next < PREFERRED + 20 && !server; next++) {
      server = await listen(next);
      if (server) port = next;
    }
  }
  if (!server) throw new Error('No free local port near ' + PREFERRED);
  const url = 'http://' + HOST + ':' + port + '/index.html';
  console.log('Adventurer is at ' + url);
  console.log('Leave this window open while you play. Close it to stop.');
  if (process.env.ADV_NO_BROWSER !== '1') openBrowser(url);
})().catch(err => {
  console.error(err.message || err);
  process.exitCode = 1;
});
