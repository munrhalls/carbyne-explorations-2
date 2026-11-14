/** Renders a built page of the site to a PNG: node shot.mjs [path=/] [width=280] [height=380] [out.png] [scale=1] */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const dist = path.join(root, 'dist');
const [pagePath = '/', width = '280', height = '380', outArg, scale = '1'] = process.argv.slice(2);
const out = path.resolve(outArg ?? path.join(os.tmpdir(), 'carbyne-shot.png'));
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.mjs': 'text/javascript', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2',
};

const built = spawnSync(process.execPath, ['src/build.mjs'], { cwd: root, env: { ...process.env, BASE_PATH: '' }, stdio: 'ignore' });
if (built.status !== 0) throw new Error('build failed: run node src/build.mjs');

const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(dist, rel);
  if (!file.startsWith(dist + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' }).end(fs.readFileSync(file));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}${pagePath}`;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'carbyne-shot-'));

let chrome;
try {
  // Headless Chrome will not make a window narrower than ~500px, so size the page by emulation (what DevTools does).
  chrome = spawn('google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const debugPort = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error('chrome did not start in 10s')), 10000);
    chrome.stderr.on('data', (c) => {
      buf += c;
      const m = buf.match(/ws:\/\/127\.0\.0\.1:(\d+)\//);
      if (m) { clearTimeout(timer); resolve(Number(m[1])); }
    });
    chrome.once('exit', () => reject(new Error('chrome exited early')));
  });
  const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    const p = pending.get(m.id);
    if (!p) return;
    pending.delete(m.id);
    if (m.error) p.rej(new Error(m.error.message)); else p.res(m.result);
  });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++nextId;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await send('Emulation.setDeviceMetricsOverride', { width: Number(width), height: Number(height), deviceScaleFactor: Number(scale), mobile: true });
  await send('Page.navigate', { url });
  for (let i = 0; i < 100; i++) {
    await sleep(50);
    const r = await send('Runtime.evaluate', { expression: "document.fonts.ready.then(() => document.readyState === 'complete')", awaitPromise: true, returnByValue: true }).catch(() => null);
    if (r?.result?.value) break;
  }
  await sleep(800);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
  ws.close();
  console.log(out);
} finally {
  if (chrome && chrome.exitCode === null) {
    chrome.kill('SIGKILL');
    await new Promise((r) => chrome.once('exit', r));
  }
  server.close();
  fs.rmSync(profile, { recursive: true, force: true });
}
