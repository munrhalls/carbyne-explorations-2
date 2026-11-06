// D11 proof: the cave steps are eight rects in a solid four-step stack centred
// at x = 0.075w on the bottom edge with a stable aspect ratio, and the cave
// mouth is lit by a radial gradient centred on the lamp while both path
// outlines stay exactly the old ones.
// Run: node proofs/d11-cave.mjs

import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { existsSync, readFileSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stepsPath = join(root, "src/scene/layers/BGCaveSteps.mjs");
const mouthPath = join(root, "src/scene/layers/BGCaveLineFill.mjs");
const fixturePath = join(root, "proofs/fixtures/old-art.json");

const SIZES = [
  [320, 640],
  [768, 1024],
  [1280, 800],
  [1920, 1080],
];

const num = (v) => Number(v);
const near = (a, b, eps = 0.01) => Math.abs(a - b) <= eps;

/** Attributes of a tag string as a map. */
function attrs(tag) {
  const m = {};
  for (const am of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) m[am[1]] = am[2];
  return m;
}

/** Tokenise a path `d` into letters and numbers. */
function dTokens(d) {
  return d.match(/[A-Za-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) || [];
}

/** Same token list: identical letters, numbers within 1e-6. */
function dEqual(a, b) {
  const ta = dTokens(a);
  const tb = dTokens(b);
  if (ta.length !== tb.length) return false;
  return ta.every((t, i) => {
    const u = tb[i];
    const na = Number(t);
    const nb = Number(u);
    if (Number.isNaN(na) || Number.isNaN(nb)) return t === u;
    return Math.abs(na - nb) <= 1e-6;
  });
}

/** Step-stack checks for one size. Returns { problems, ratio }. */
function checkSteps(out, w, h) {
  const problems = [];
  const rects = [...out.matchAll(/<rect\b[^>]*>/g)].map((m) => attrs(m[0]));
  let ratio = null;

  // [count] exactly 8 rects
  if (rects.length !== 8) problems.push("[count]");

  if (rects.length) {
    const rs = rects.map((a) => ({
      x: num(a.x),
      y: num(a.y),
      right: num(a.x) + num(a.width),
      bottom: num(a.y) + num(a.height),
      fill: a.fill,
    }));

    // [fills] at least two fills, one #fff
    const fills = new Set(rs.map((r) => r.fill));
    if (!(fills.size >= 2 && fills.has("#fff"))) problems.push("[fills]");

    // [inside] every rect inside the screen
    const inside = rs.every(
      (r) => r.x >= 0 && r.right <= w && r.y >= 0 && r.bottom <= h + 0.01
    );
    if (!inside) problems.push("[inside]");

    // [ground] lowest bottom equals h
    const maxBottom = Math.max(...rs.map((r) => r.bottom));
    if (!near(maxBottom, h)) problems.push("[ground]");

    // [contig] sorted by y, bands overlap or touch with no gap > 0.01
    const byY = [...rs].sort((a, b) => a.y - b.y);
    let contig = true;
    let covered = byY[0].bottom;
    for (let i = 1; i < byY.length; i++) {
      if (byY[i].y - covered > 0.01) {
        contig = false;
        break;
      }
      covered = Math.max(covered, byY[i].bottom);
    }
    if (!contig) problems.push("[contig]");

    // [centre] stack centre at x = 0.075w
    const minX = Math.min(...rs.map((r) => r.x));
    const maxRight = Math.max(...rs.map((r) => r.right));
    const cx = (minX + maxRight) / 2;
    if (!near(cx, w * 0.075, w * 0.002)) problems.push("[centre]");

    // [shape] stack width / height
    const minY = Math.min(...rs.map((r) => r.y));
    const stackW = maxRight - minX;
    const stackH = h - minY;
    if (stackW > 0 && stackH > 0) ratio = stackW / stackH;
  }

  return { problems, ratio };
}

/** Mouth checks for one size. `oldDs` = old path d attributes or null. */
function checkMouth(out, w, h, oldDs) {
  const problems = [];

  // [mouth] radial gradient centred on the lamp, first path uses it
  const grad = out.match(/<radialGradient\b[^>]*>([\s\S]*?)<\/radialGradient>/);
  let mouthOk = false;
  if (grad) {
    const ga = attrs(grad[0].slice(0, grad[0].indexOf(">") + 1));
    const stops = (grad[1].match(/<stop\b/g) || []).length;
    const firstPath = out.match(/<path\b[^>]*>/);
    const pa = firstPath ? attrs(firstPath[0]) : {};
    mouthOk =
      ga.gradientUnits === "userSpaceOnUse" &&
      near(num(ga.cx), w * 0.075) &&
      near(num(ga.cy), h * 0.91) &&
      num(ga.r) > 0 &&
      stops >= 3 &&
      pa.fill === `url(#${ga.id})`;
  }
  if (!mouthOk) problems.push("[mouth]");

  // [outline] both path d attributes equal the old ones
  if (oldDs) {
    const ds = [...out.matchAll(/<path\b[^>]*>/g)].map((m) => attrs(m[0]).d);
    if (ds.length !== oldDs.length || !oldDs.every((d, i) => dEqual(ds[i] || "", d))) {
      problems.push("[outline]");
    }
  }

  return problems;
}

async function main() {
  for (const p of [stepsPath, mouthPath]) {
    if (!existsSync(p)) {
      console.log(`D11: no - ${p} is missing`);
      process.exit(1);
    }
  }
  let stepsFn, mouthFn;
  try {
    ({ default: stepsFn } = await import(pathToFileURL(stepsPath).href));
    ({ default: mouthFn } = await import(pathToFileURL(mouthPath).href));
  } catch (e) {
    console.log(`D11: no - ${e.message}`);
    process.exit(1);
  }

  const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
  const oldLayer = fixture.layers.find((l) => l.name === "BGCaveLineFill");
  const oldDsAt = {};
  if (oldLayer) {
    for (const key of Object.keys(oldLayer.markup)) {
      oldDsAt[key] = [...oldLayer.markup[key].matchAll(/<path\b[^>]*>/g)].map(
        (m) => attrs(m[0]).d
      );
    }
  }

  let bad = 0;
  const ratios = [];
  for (const [w, h] of SIZES) {
    let problems;
    try {
      const sOut = stepsFn(w, h, "");
      const mOut = mouthFn(w, h, "");
      if (typeof sOut !== "string" || typeof mOut !== "string") {
        problems = ["[crash] not a string"];
      } else {
        const s = checkSteps(sOut, w, h);
        ratios.push(s.ratio);
        const oldDs = oldDsAt[`${w}x${h}`] || null;
        problems = checkMouth(mOut, w, h, oldDs).concat(s.problems);
      }
    } catch (e) {
      problems = [`[crash] ${e.message}`];
    }
    if (problems.length) {
      bad++;
      console.log(`NO  ${w}x${h}: ${problems.slice(0, 3).join(" ")}`);
    } else {
      console.log(`ok  ${w}x${h}`);
    }
  }

  // [shape] same aspect ratio at every size (only when nothing else failed)
  if (!bad) {
    const base = ratios[0];
    const shapeOk =
      base !== null &&
      ratios.every((r) => r !== null && Math.abs(r - base) / base <= 0.01);
    if (!shapeOk) {
      bad++;
      console.log("NO  shape: [shape]");
    }
  }

  console.log(bad ? "D11: no" : "D11: yes");
  process.exit(bad ? 1 : 0);
}

main();
