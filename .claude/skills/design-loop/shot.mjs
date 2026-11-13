/** Renders a built page of the site to a PNG: node shot.mjs [path=/] [width=390] [height=844] [out.png] */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const dist = path.join(root, 'dist');
const [pagePath = '/', width = '390', height = '844', outArg] = process.argv.slice(2);
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

try {
  const chrome = spawn('google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${width},${height}`, '--virtual-time-budget=4000', `--user-data-dir=${profile}`,
    `--screenshot=${out}`, url,
  ], { stdio: 'ignore' });
  const timer = setTimeout(() => chrome.kill('SIGKILL'), 30000);
  await new Promise((resolve) => chrome.once('exit', resolve));
  clearTimeout(timer);
  if (!fs.existsSync(out)) throw new Error('chrome produced no screenshot');
  console.log(out);
} finally {
  server.close();
  fs.rmSync(profile, { recursive: true, force: true });
}
