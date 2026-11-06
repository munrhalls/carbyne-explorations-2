// D10 proof: is the star layer a deterministic, image-free, three-depth
// seamlessly looping starfield on a navy gradient, inside the old footprint?
// Run: node proofs/d10-stars.mjs

import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const layerPath = join(root, "src/scene/layers/BGanimStarDots.mjs");

const SIZES = [
  [320, 640],
  [768, 1024],
  [1280, 800],
  [1920, 1080],
];
const DEPTHS = ["far", "mid", "near"];
const MIN_STARS = { far: 30, mid: 14, near: 5 };

const num = (v) => Number(v);
const near = (a, b, eps = 0.01) => Math.abs(a - b) <= eps;

/** Attributes of a tag string as a map. */
function attrs(tag) {
  const m = {};
  for (const am of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) m[am[1]] = am[2];
  return m;
}

/** All checks for one rendered string at one size. Returns problem tags. */
function check(out, out2, w, h) {
  const problems = [];
  const TILE = w * 0.21;
  const H = h * 0.4;

  // [det] deterministic
  if (out !== out2) problems.push("[det]");

  // [image] no raster, no hrefs
  if (/<image|stars\.png|href=/.test(out)) problems.push("[image]");

  // [foot] first nested <svg keeps the old footprint
  const firstSvg = out.indexOf("<svg");
  const nestedIdx = out.indexOf("<svg", firstSvg + 4);
  let nestedAttrs = null;
  if (nestedIdx === -1) {
    problems.push("[foot]");
  } else {
    const tagEnd = out.indexOf(">", nestedIdx);
    nestedAttrs = attrs(out.slice(nestedIdx, tagEnd + 1));
    const ok =
      near(num(nestedAttrs.x), 0) &&
      near(num(nestedAttrs.y), h * 0.6) &&
      near(num(nestedAttrs.width), TILE) &&
      near(num(nestedAttrs.height), H);
    if (!ok) problems.push("[foot]");
  }

  // [sky] navy-ish linearGradient + full-bleed rect using it
  let skyOk = false;
  const grad = out.match(/<linearGradient\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/linearGradient>/);
  if (grad && (grad[2].match(/<stop\b/g) || []).length >= 2) {
    for (const rm of out.matchAll(/<rect\b[^>]*>/g)) {
      const a = attrs(rm[0]);
      if (a.width === "100%" && a.height === "100%" && a.fill === `url(#${grad[1]})`) {
        skyOk = true;
        break;
      }
    }
  }
  if (!skyOk) problems.push("[sky]");

  // [depth] exactly three groups far/mid/near in order
  const groups = {};
  const groupRe = /<g\b[^>]*data-depth="(far|mid|near)"[^>]*>/g;
  const hits = [...out.matchAll(groupRe)];
  const allG = [...out.matchAll(/<g\b[^>]*>/g)];
  let depthOk = hits.length === 3 && allG.length === 3 &&
    hits.every((m, i) => m[1] === DEPTHS[i]);
  if (!depthOk) {
    problems.push("[depth]");
  } else {
    // slice each group's inner markup up to its closing </g>
    for (let i = 0; i < 3; i++) {
      const name = hits[i][1];
      const end = out.indexOf("</g>", hits[i].index + hits[i][0].length);
      groups[name] = out.slice(hits[i].index + hits[i][0].length, end === -1 ? out.length : end);
    }
    const perGroup = {};
    let allStars = [];
    for (const name of DEPTHS) {
      const stars = [];
      for (const cm of groups[name].matchAll(/<circle\b[^>]*>/g)) {
        const a = attrs(cm[0]);
        if (a["data-halo"] === "1") continue;
        stars.push({ cx: num(a.cx), cy: num(a.cy), r: num(a.r) });
      }
      const anims = [...groups[name].matchAll(/<animateTransform\b[^>]*>/g)].map((m) => attrs(m[0]));
      perGroup[name] = { stars, anims };
      allStars = allStars.concat(stars);
    }
    const counts = DEPTHS.map((n) => perGroup[n].stars.length);
    if (counts.some((c) => c % 2 !== 0)) {
      depthOk = false;
    } else {
      const n = Object.fromEntries(DEPTHS.map((d, i) => [d, counts[i] / 2]));
      const countOk =
        n.far > n.mid && n.mid > n.near &&
        n.far >= MIN_STARS.far && n.mid >= MIN_STARS.mid && n.near >= MIN_STARS.near;
      const meanR = (s) => s.reduce((t, c) => t + c.r, 0) / (s.length || 1);
      const rOk =
        meanR(perGroup.far.stars) < meanR(perGroup.mid.stars) &&
        meanR(perGroup.mid.stars) < meanR(perGroup.near.stars);
      const durs = DEPTHS.map((d) => {
        const a = perGroup[d].anims;
        return a.length === 1 ? parseFloat(a[0].dur) : NaN;
      });
      const durOk = durs.every((d) => !Number.isNaN(d)) && durs[0] > durs[1] && durs[1] > durs[2];
      if (!(countOk && rOk && durOk)) depthOk = false;

      // [loop] each group translates by exactly one tile, second copy mirrors first
      let loopOk = true;
      for (const d of DEPTHS) {
        const a = perGroup[d].anims[0];
        if (
          !a ||
          a.attributeName !== "transform" ||
          a.type !== "translate" ||
          a.from !== "0 0" ||
          a.repeatCount !== "indefinite" ||
          !near(num((a.to || "").trim().split(/\s+/)[0]), -TILE)
        ) {
          loopOk = false;
        }
      }
      const key = (s) => s.map((c) => `${c.cx.toFixed(2)},${c.cy.toFixed(2)},${c.r.toFixed(2)}`).sort();
      const first = key(allStars.filter((c) => c.cx < TILE));
      const second = key(
        allStars.filter((c) => c.cx >= TILE).map((c) => ({ ...c, cx: c.cx - TILE }))
      );
      if (first.length !== second.length || first.some((s, i) => s !== second[i])) loopOk = false;
      if (!loopOk) problems.push("[loop]");

      // [inside] every star within 0 <= cx < 2*TILE, 0 <= cy <= H
      if (!allStars.every((c) => c.cx >= 0 && c.cx < 2 * TILE && c.cy >= 0 && c.cy <= H)) {
        problems.push("[inside]");
      }
    }
    if (!depthOk && !problems.includes("[depth]")) problems.push("[depth]");
  }

  return problems;
}

async function main() {
  if (!existsSync(layerPath)) {
    console.log("D10: no - src/scene/layers/BGanimStarDots.mjs is missing");
    process.exit(1);
  }
  let fn;
  try {
    ({ default: fn } = await import(pathToFileURL(layerPath).href));
  } catch (e) {
    console.log(`D10: no - ${e.message}`);
    process.exit(1);
  }
  let bad = 0;
  for (const [w, h] of SIZES) {
    let problems;
    try {
      const out = fn(w, h, "");
      const out2 = fn(w, h, "");
      problems = typeof out === "string" ? check(out, out2, w, h) : ["[det]"];
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
  console.log(bad ? "D10: no" : "D10: yes");
  process.exit(bad ? 1 : 0);
}

main();
