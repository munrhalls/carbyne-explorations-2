/** Builds the static site: dist/index.html plus one page per river item. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { marked } from './vendor/marked.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');
const base = process.env.BASE_PATH ?? "";
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.cpSync(path.join(root, 'public'), dist, { recursive: true });
fs.cpSync(path.join(root, 'src/scene'), path.join(dist, 'scene'), { recursive: true });

const db = new DatabaseSync(path.join(root, 'content/blog.db'), { readOnly: true });
const rows = db.prepare('SELECT slug, label, title, body, accent, position FROM pages').all();
db.close();

const welcome = rows.find((row) => row.slug === 'welcome');
if (!welcome) throw new Error('no welcome page in the database');
if (welcome.position !== null) throw new Error('the welcome page must have no position');
for (const row of rows) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(row.slug)) {
    throw new Error(`bad slug: ${row.slug}`);
  }
}
const river = rows.filter((row) => row.position !== null).sort((a, b) => a.position - b.position);

/** Escapes HTML special characters in a database value. */
function esc(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Renders a Markdown body to HTML, prefixing root-relative URLs with the base. */
function renderBody(markdown) {
  return marked.parse(markdown).replace(/(href|src)="\/(?!\/)/g, `$1="${base}/`);
}

/** Returns the full HTML document for a page, with the river nav. */
function pageHtml(page, riverItems) {
  const title = page.slug === 'welcome'
    ? 'Carbyne Explorations'
    : `${esc(page.title)} - Carbyne Explorations`;
  const links = riverItems
    .map((item) => `    <a href="${base}/${item.slug}/">${esc(item.label)}</a>`)
    .join('\n');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet" href="${base}/css/site.css">
</head>
<body>
  <div class="App">
    <div id="scene" data-stars="${base}/stars.png" data-accent="${esc(page.accent)}"></div>
    <main class="ContentManager">
      <div class="Category">
        <article class="Category__item">
          <h1>${esc(page.title)}</h1>
          ${renderBody(page.body)}
        </article>
      </div>
    </main>
  </div>
  <nav class="river" aria-label="Pages">
${links}
  </nav>
  <script type="module" src="${base}/scene/mount.mjs"></script>
</body>
</html>
`;
}

fs.writeFileSync(path.join(dist, 'index.html'), pageHtml(welcome, river));
for (const page of river) {
  const dir = path.join(dist, page.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), pageHtml(page, river));
}
