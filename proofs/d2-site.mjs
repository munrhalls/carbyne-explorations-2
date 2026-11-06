/** Proof D2: the built site matches the database (pages, river, urls, titles). */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');
const BASE = '/x';

const build = spawnSync(process.execPath, ['src/build.mjs'], {
  cwd: root,
  env: { ...process.env, BASE_PATH: BASE },
  encoding: 'utf8',
});
if (build.status !== 0) {
  const line = (build.stderr || '').split('\n').filter((l) => l.trim() && !/warn/i.test(l)).pop() ?? '';
  console.log(`D2: no - build failed: ${line}`);
  process.exit(1);
}

const db = new DatabaseSync(path.join(root, 'content/blog.db'), { readOnly: true });
const rows = db.prepare('SELECT slug, title, position FROM pages').all();
db.close();
const river = rows.filter((r) => r.position !== null).sort((a, b) => a.position - b.position);

/** Escapes a database value the same way the build does. */
function esc(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Returns the URL of every built index.html, relative to dist. */
function builtUrls(dir, prefix) {
  const urls = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) urls.push(...builtUrls(full, `${prefix}${entry.name}/`));
    else if (entry.name === 'index.html') urls.push(prefix);
  }
  return urls;
}

const expectedPages = new Set(['/', ...river.map((r) => `/${r.slug}/`)]);
const built = builtUrls(dist, '/');
const checks = [];

{
  const problems = [];
  const missing = [...expectedPages].filter((u) => !built.includes(u));
  const unexpected = built.filter((u) => !expectedPages.has(u));
  if (missing.length) problems.push(`missing: ${missing.join(', ')}`);
  if (unexpected.length) problems.push(`unexpected: ${unexpected.join(', ')}`);
  checks.push(['pages', problems]);
}

const pages = new Map(built.map((u) => [u, fs.readFileSync(path.join(dist, u === '/' ? 'index.html' : `${u}index.html`), 'utf8')]));
const expectedRiver = river.map((r) => `${BASE}/${r.slug}/`);

{
  const problems = [];
  for (const [url, html] of pages) {
    const nav = html.split('<nav class="river"')[1]?.split('</nav>')[0] ?? '';
    const hrefs = [...nav.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
    if (hrefs.join('') !== expectedRiver.join('')) problems.push(`${url}: got ${hrefs.join(', ')}`);
  }
  checks.push(['river links', problems]);
}

{
  const problems = [];
  for (const [url, html] of pages) {
    for (const m of html.matchAll(/(?:href|src)="([^"]*)"/g)) {
      const v = m[1];
      if (/^(https?:|\/\/|mailto:|data:|#)/.test(v)) continue;
      if (!v.startsWith(`${BASE}/`)) { problems.push(`${url} not prefixed: ${v}`); continue; }
      let p = v.slice(BASE.length).split(/[?#]/)[0];
      if (p.endsWith('/')) p += 'index.html';
      if (!fs.existsSync(path.join(dist, p))) problems.push(`${url} dead: ${v}`);
    }
  }
  checks.push(['urls', problems]);
}

{
  const problems = [];
  for (const row of river) {
    const html = pages.get(`/${row.slug}/`) ?? '';
    if (!html.includes(`<h1>${esc(row.title)}</h1>`)) problems.push(`/${row.slug}/`);
  }
  const welcome = rows.find((r) => r.position === null);
  if (welcome && !(pages.get('/') ?? '').includes(`<h1>${esc(welcome.title)}</h1>`)) problems.push('/');
  checks.push(['titles', problems]);
}

let failed = 0;
for (const [name, problems] of checks) {
  if (problems.length) { failed++; console.log(`NO  ${name}: ${problems.slice(0, 3).join('; ')}`); }
  else console.log(`ok  ${name}`);
}
if (failed) { console.log(`D2: no - ${failed} checks failed`); process.exit(1); }
console.log('D2: yes');
