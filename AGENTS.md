# Carbyne Explorations 2.0 - agent rules

Scope: a public static blog. The original SVG art scene with a river menu of owner-defined pages. Pages are rows in a SQLite file in this repo. The owner edits on their own PC with a local admin and publishes with `git push`. Ongoing cost is zero.

## Done (all must be yes)

Scripts in `proofs/`, dependency-free, run as `node proofs/<file>.mjs`, exit 0 = yes:

- D1 art (`d1-art.mjs`): every old layer's markup at 320x640, 768x1024 and 1280x800 (`proofs/fixtures/old-art.json`) equals the new scene function's output.
- D2 site (`d2-site.mjs`): `dist/` has `/` and one page per row; the river has as many links as rows; the moon links to `/`; every link and image path resolves; an unknown path is not built.
- D3 admin (`d3-admin.mjs`): on a temp copy of the DB, create, update, delete of a page and an image upload show up, change and disappear in the built site; the row is visible by `SELECT`.
- D4 origin (`d4-origin.mjs`): the admin refuses a write whose Origin is foreign.

Owner checks: D5 adds a page with an image through the admin, pushes, sees it live. D6 art looks the same as the old site on desktop and phone. D7 on the phone, reach and read a page through the river. D8 hosting dashboards show Free, no card, $0.

## Binding decisions

- Art = pure functions `(w, h, accent) -> SVG markup string`, ported verbatim from the old repo's `SVG.js` layers. One resize listener for the whole scene. No `viewBox` scaling: a non-uniform one would stretch circles and text.
- Page text is static HTML and readable without JS. Every river item is a real `<a href>` in the HTML.
- One table `pages` (slug, label, title, body, accent, position). Body is Markdown. `/` is the Welcome page, reached from the moon, not part of the river.
- A page is in the river iff `position` is not NULL (unique, shown in ascending order). The Welcome page has slug `welcome`, no position, and is built to `/`; every river page is built to `/<slug>/`. Markdown bodies use root-relative URLs (`/img/x.png`, `/music/`); the build prefixes `BASE_PATH`.
- SQLite file `content/blog.db`, read with `node:sqlite`. No npm dependencies. The one third-party file is `marked` (Markdown), vendored as `src/vendor/marked.mjs`; upgrade by replacing that file.
- Admin is local only (127.0.0.1), no login, no secrets: `node src/admin/server.mjs` (port 4321, or `PORT`). It rejects any request whose Host is not itself and any non-GET request whose Origin is not itself. It writes `content/blog.db` and saves images to `public/img/` (used in bodies as `/img/<name>`).
- Plain ESM JavaScript with JSDoc. No TypeScript, no framework. Fonts are woff2 only.
- Hosting: GitHub Pages, deployed by a GitHub Actions workflow that runs `node src/build.mjs`.
- Every link and asset URL in `dist/` is prefixed with the env var `BASE_PATH` (empty by default). The Pages URL lives under `/carbyne-explorations-2`, so the workflow sets `BASE_PATH=/carbyne-explorations-2`; a custom domain later sets it empty.

## Hard limits

- The only commands you may run: `node src/build.mjs` and `node proofs/<file>.mjs`. Never install, lint, type-check, run test frameworks, dev servers or browsers, and never contact external sites. The proofs D3 and D4 start the admin themselves, on a temporary copy of the repo, and stop it; you never start it by hand.
- Never add a dependency, folder or root file that is not listed under Homes. If a task needs one, STOP and say so.
- Executors never commit, push, branch, open or merge PRs. The runner does; the owner merges.
- Delete files with `git rm`, never `rm`.
- If a task is wrong or ambiguous, or a precondition fails, STOP and say why. Do not guess.

## Homes (one home per file)

`README.md`, `AGENTS.md`, `CLAUDE.md`, `package.json`, `.gitignore`, `.github/workflows/pages.yml`, `src/build.mjs`, `src/scene/`, `src/vendor/`, `src/admin/`, `content/blog.db`, `public/` (fonts, images, css; copied as is into `dist/`), `proofs/`, `dist/` (ignored), `_project/working-memory/` (ignored task files).

## Check per PR

Runner check: `node proofs/d1-art.mjs --selftest`. The proof a PR turns green is run by the orchestrator after the runner has landed the tasks.
