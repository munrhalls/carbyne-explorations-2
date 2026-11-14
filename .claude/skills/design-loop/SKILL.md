---
name: design-loop
description: Direct edit loop for how Carbyne Explorations looks. Use when the user invokes /design-loop, says "Done" after annotating the canvas, pastes an annotated screenshot of the site, or asks for a visual change.
triggers:
  - user
  - model
---

# design-loop

The user's annotation in → site edited → one short reply ending with the canvas link. Nothing else.

## The loop (same in every repo)

1. **Spec.** On "Done", the whole spec for the round is `~/work/global/annotate/data/annotated.png` (their drawing over the render) plus `data/notes.txt` (exact text of every note, with x,y in page px). Read both. Prefer `notes.txt` for wording and the PNG for what each mark points at. If `annotated.png` is missing or stale, say "not saved" and re-print the link; never act on an older image. A pasted screenshot or one line of direction is also a full spec.
2. **Edit** in place. No new file, no changelog, no status labels, no "ok" gates. Trust the annotation over the prose. Visual only; content and correctness are out of scope unless they change how it looks.
3. **Look** (silent): render with the eyes command, view the PNG, fix what you broke. Never post it or mention it.
4. **Gate** (silent): run the proofs that cover what you touched; fix red before replying.
5. **Canvas:** render the floor (280 x 380, the smallest screen the site supports; solve it and every larger size gets easier) at 2x and load it: `<eyes command> <page> 280 380 <out.png> 2`, then `~/work/global/annotate/annotate.sh <out.png>`. It prints `http://localhost:4400`.
6. **Reply:** a couple of terse lines naming what changed, then the link as the last line and the only link. Questions: max 2, only if truly blocked.

The user opens the link, finds the render on the canvas, draws and dictates, presses Ctrl+S and says "Done". The canvas holds the 280 x 380 floor only, at 100% zoom (one image px per screen px, exactly what a dev-server tab at that size shows), pinned top-left like a sidebar with the rest of the canvas empty for drawing; check desktop with the eyes command at 1280 x 800. If the tool is broken, say so and expect a pasted screenshot.

## Project binding (rewrite this block when copying to another repo)

**Eyes.** `node .claude/skills/design-loop/shot.mjs [path=/] [width=280] [height=380] [out.png] [scale=1]` builds the site into `dist/`, serves it on a throwaway local port, renders the page in headless Chrome with device-metrics emulation (the window itself cannot go under ~500px, so the viewport is emulated like DevTools does: width x height, mobile, scale as DPR) and prints the PNG path (default in the system temp dir, never in the repo). Use `/music/` for a river page, `/404.html` for the not-found page. The canvas needs `scale` 2 (it divides the image by 2 to get page px). Run the eyes command before `annotate.sh`; each run rebuilds `dist/`.

**Where a look lives.**
- Text, panel, nav, links: `public/css/site.css`.
- Art: `src/scene/`, pure functions `(w, h, accent) -> SVG markup`. Only the layers in `REFINED` in `proofs/d1-art.mjs` may change. Any other layer is frozen by D1: STOP and ask the owner to add it to `REFINED`; never edit the fixture or the proof to get green.
- Page markup: `src/build.mjs`. Accents: the `accent` column in `content/blog.db`, edited through the admin, never by hand.
- Hard rules in `AGENTS.md` win: no dependency, no new folder, no `viewBox` scaling, fonts woff2 only.

**Gate.**
- always: `node proofs/d13-clean.mjs` (no unused selector, no empty rule)
- CSS or layout: `node proofs/d9-look.mjs`
- `src/scene/`: `node proofs/d1-art.mjs`, plus `d10-stars`, `d11-cave` or `d12-accents` for what you touched
- `src/build.mjs`: `node proofs/d2-site.mjs`

A new class or proof file must be used and named as `AGENTS.md` (D13) requires.

**Self-check.**
- Text inside its container? Labels fully inside the screen when opaque, at least 12px; body at least 16px.
- Eye lands where intended: the scene is the hero, the text panel is calm.
- Collisions masked, gapped, or owned, never just overlapped (title clear of the moon, moon over the labels).
- Reads as default or templated? Find the one distinctive move.

**Look.** Navy cave and stars, Josefin Sans (woff2), black river labels with white stroke, per-page accent colors from the DB (hex, 4.5:1 on black, 40° apart). Do not invent new tokens; reuse what `site.css` and the scene already use.

## Copy to another repo (exact reproduction)

Two parts must both match: the files in the repo, and the canvas tool outside it.

**A. Files in the repo.** Copy `SKILL.md` and `shot.mjs` to `.claude/skills/design-loop/`.
1. `SKILL.md`: keep "The loop" word for word. Rewrite only "Project binding" and the `description:` line in the frontmatter (where a look lives, gate, self-check, look tokens).
2. `shot.mjs`: dependency-free (needs Node 22+ for global `fetch` and `WebSocket`, and `google-chrome` on PATH). Its only repo-specific part is the build step (`src/build.mjs`, folder `dist/`, `BASE_PATH`): swap it for the target repo's build that produces static files, or point `dist` at its output. Do not change these three facts:
   - The viewport is set by CDP `Emulation.setDeviceMetricsOverride { width, height, deviceScaleFactor: scale, mobile: true }`, never by `--window-size`. Headless Chrome will not make a window narrower than about 500px, so a window-sized shot is silently laid out wider than 280 and differs from DevTools.
   - Default size is the floor, 280 x 380.
   - The canvas call is `shot.mjs <page> 280 380 <out.png> 2`, which writes a 560 x 760 PNG.

**B. Canvas tool outside the repo** (`~/work/global/annotate/`, once per machine, port 4400, localhost only). `annotate.sh <png>` loads the PNG and prints the link; the owner presses Ctrl+S and says "Done"; the spec is then `data/annotated.png` plus `data/notes.txt` (note coordinates are page CSS px). It must behave like this in `src/main.jsx`, function `loadBackdrop`:
   - The image is shown at `naturalWidth / 2` x `naturalHeight / 2`, so one canvas unit is one page CSS px.
   - After the locked backdrop shape is created at (0, 0): `editor.setCamera({ x: 16, y: 56, z: 1 }, { immediate: true })`. That is 100% zoom, pinned top-left like a sidebar, the rest of the canvas empty for drawing. Never `zoomToFit`: it scales the render about 2x and no longer matches DevTools.
   - Check: `grep -n "setCamera" ~/work/global/annotate/src/main.jsx` finds it and `grep -c zoomToFit` prints 0. If not, apply it and ask the owner to run `cd ~/work/global/annotate && npx vite build` (`annotate.sh` builds only when `dist/` is missing). If the tool does not exist on the machine, STOP and tell the owner.

**C. Permissions.** If the repo restricts commands, allow `~/work/global/annotate/annotate.sh <png>` and `node .claude/skills/design-loop/shot.mjs` for this skill only. Nothing else to install.

**D. Verify the copy.** Run `node .claude/skills/design-loop/shot.mjs / 280 380 <out.png> 2`; the PNG must be 560 x 760. Run `annotate.sh <out.png>` and open the link: the render must sit top-left at 280 x 380 screen px, the same as DevTools responsive mode at 280 x 380 with DPR 2.
