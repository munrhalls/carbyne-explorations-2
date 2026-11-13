---
name: design-loop
description: Direct edit loop for how Carbyne Explorations looks. Use when the user invokes /design-loop, pastes an annotated screenshot of the site, or asks for a visual change.
triggers:
  - user
  - model
---

# design-loop

Annotated screenshot or one line of direction in → site edited → one short reply. Nothing else.

## How it runs

- Edit in place. No new file, no changelog, no status labels, no "ok" gates. Just do it.
- Reply = a couple of terse lines naming what changed. That is all the user sees.
- Before replying, quietly render with `shot.mjs`, look at the PNG, and fix what you broke. Never post it, never mention it.
- Questions: max 2, only if truly blocked; decide everything else yourself.
- One image per round = the whole spec. Older images are never the target. Trust the annotation over the prose.
- Visual only. Content (page text, labels) and correctness are out of scope unless they change how it looks.

## Where a look lives

- Text, panel, nav, links: `public/css/site.css`.
- Art: `src/scene/` — pure functions `(w, h, accent) -> SVG markup`. Only the layers in `REFINED` in `proofs/d1-art.mjs` may change. Any other layer is frozen by D1: STOP and ask the owner to add it to `REFINED`; never edit the fixture or the proof to get green.
- Page markup: `src/build.mjs`. Accents: the `accent` column in `content/blog.db`, edited through the admin, never by hand.
- Hard rules in `AGENTS.md` win: no dependency, no new folder, no `viewBox` scaling, fonts woff2 only.

## The eyes

```bash
node .claude/skills/design-loop/shot.mjs [path=/] [width=390] [height=844] [out.png]
```

Builds the site into `dist/`, serves it on a throwaway local port, renders the page in headless Chrome and prints the PNG path (default in the system temp dir, never in the repo). Use `/music/` for a river page, `/404.html` for the not-found page. Check phone (390) and desktop (1280 x 800) when the change is layout.

## Gate (silent)

After each round run the proofs that cover what you touched, and fix red before replying:

- always: `node proofs/d13-clean.mjs` (no unused selector, no empty rule)
- CSS or layout: `node proofs/d9-look.mjs`
- `src/scene/`: `node proofs/d1-art.mjs`, plus `d10-stars`, `d11-cave` or `d12-accents` for what you touched
- `src/build.mjs`: `node proofs/d2-site.mjs`

A new class or proof file must be used and named as `AGENTS.md` (D13) requires.

## Self-check (silent)

- Text inside its container? Labels fully inside the screen when opaque, at least 12px; body at least 16px.
- Eye lands where intended: the scene is the hero, the text panel is calm.
- Collisions masked, gapped, or owned — never just overlapped (title clear of the moon, moon over the labels).
- Reads as default or templated? Find the one distinctive move.

## Look

Navy cave and stars, Josefin Sans (woff2), black river labels with white stroke, per-page accent colors from the DB (hex, 4.5:1 on black, 40° apart). Do not invent new tokens; reuse what `site.css` and the scene already use.
