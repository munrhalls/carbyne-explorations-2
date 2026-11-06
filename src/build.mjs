/** Builds the static site: writes one empty page to dist/index.html. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');
const base = process.env.BASE_PATH ?? "";
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.cpSync(path.join(root, 'public'), dist, { recursive: true });
fs.cpSync(path.join(root, 'src/scene'), path.join(dist, 'scene'), { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Carbyne Explorations</title>
  <link rel="stylesheet" href="${base}/css/site.css">
</head>
<body>
  <div class="App" id="scene" data-stars="${base}/stars.png"></div>
  <script type="module" src="${base}/scene/mount.mjs"></script>
</body>
</html>
`);
