// D1 proof: does every old art layer equal the new scene's output at all sizes?
// Run: node proofs/d1-art.mjs [--selftest]

import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(readFileSync(join(root, "proofs/fixtures/old-art.json"), "utf8"));

/** Layers refined on purpose (owner decision 2026-11-06): no longer compared to the old site. */
const REFINED = new Set(["BGNavigationalRiverButtons"]);

const NUM = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
const clip = (s) => (s.length > 100 ? s.slice(0, 100) : s);

/** Parse an attribute value into skeleton (numbers -> '#', ws/commas stripped) + number list. */
function valueParts(v) {
  const nums = [];
  const skeleton = v.replace(NUM, (m) => (nums.push(Number(m)), "#")).replace(/[\s,]+/g, "");
  return { skeleton, nums };
}

/** Compare two attribute values: skeletons equal, numbers equal within tolerance. */
function sameValue(a, b) {
  const pa = valueParts(a), pb = valueParts(b);
  if (pa.skeleton !== pb.skeleton || pa.nums.length !== pb.nums.length) return false;
  return pa.nums.every((n, i) => Math.abs(n - pb.nums[i]) <= 1e-9 * Math.max(1, Math.abs(n), Math.abs(pb.nums[i])));
}

/** Canonical token stream for an SVG markup string. */
function tokens(markup) {
  const out = [];
  for (const m of markup.match(/<[^>]+>|[^<]+/g) || []) {
    if (m[0] === "<") {
      const close = /^<\//.test(m);
      const selfClose = /\/>$/.test(m);
      const body = m.replace(/^<\/?/, "").replace(/\/?>$/, "");
      const nameMatch = body.match(/^[\w:-]+/);
      const name = nameMatch ? nameMatch[0] : "";
      const attrs = [];
      for (const am of body.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs.push([am[1], am[2]]);
      const tag = { type: close ? "close" : "open", name, attrs: attrs.sort((x, y) => x[0].localeCompare(y[0])) };
      out.push(tag);
      if (selfClose) out.push({ type: "close", name, attrs: [] });
    } else {
      const t = m.trim().replace(/\s+/g, " ");
      if (t) out.push({ type: "text", text: t });
    }
  }
  return out;
}

/** Describe one token, clipped to 100 chars. */
function show(tok) {
  if (tok.type === "text") return clip(`text "${tok.text}"`);
  const attrs = tok.attrs.map(([k, v]) => `${k}="${v}"`).join(" ");
  return clip(tok.type === "close" ? `</${tok.name}>` : `<${tok.name} ${attrs}>`);
}

/** Compare two markups canonically. Returns null if equal, else a short diff description. */
function same(a, b) {
  const ta = tokens(a), tb = tokens(b);
  if (ta.length !== tb.length)
    return `token count ${ta.length} vs ${tb.length}`;
  for (let i = 0; i < ta.length; i++) {
    const x = ta[i], y = tb[i];
    if (x.type !== y.type) return `token ${i}: ${show(x)} vs ${show(y)}`;
    if (x.type === "text") {
      if (x.text !== y.text) return `token ${i}: ${show(x)} vs ${show(y)}`;
      continue;
    }
    if (x.name !== y.name || x.attrs.length !== y.attrs.length)
      return `token ${i}: ${show(x)} vs ${show(y)}`;
    for (let j = 0; j < x.attrs.length; j++) {
      const [ka, va] = x.attrs[j], [kb, vb] = y.attrs[j];
      if (ka !== kb || !sameValue(va, vb))
        return `token ${i} attr ${ka}: ${clip(va)} vs ${clip(vb)}`;
    }
  }
  return null;
}

/** Selftest: prove `same` can say yes and no. */
function selftest() {
  const layer = fixture.layers.find((l) => / d="/.test(l.markup["320x640"])) || fixture.layers[0];
  const m = layer.markup["320x640"];
  const checks = [
    ["identical", same(m, m) === null],
    ["self-closing", same(m, m.replace(/<(\w+)([^>]*)><\/\1>/g, "<$1$2/>")) === null],
    ["d value ws/commas", same(m, m.replace(/ d="([^"]*)"/g, (_, v) => ' d="' + v.replace(/,/g, " ").replace(/ +/g, " ") + '"')) === null],
    ["d number +1 differs", same(m, m.replace(/ d="([^"]*)"/, (_, v) => ' d="' + v.replace(NUM, (n) => String(Number(n) + 1)) + '"')) !== null],
    ["extra attr differs", same(m, m.replace("<svg", '<svg data-x="1"')) !== null],
  ];
  let bad = 0;
  for (const [label, ok] of checks) {
    console.log(`${ok ? "ok" : "NO"}  ${label}`);
    if (!ok) bad++;
  }
  console.log(bad ? "selftest: no" : "selftest: yes");
  process.exit(bad ? 1 : 0);
}

/** Compare fixture markup against src/scene/index.mjs `layers`. */
async function main() {
  const scenePath = join(root, "src/scene/index.mjs");
  if (!existsSync(scenePath)) {
    console.log("D1: no - src/scene/index.mjs is missing");
    process.exit(1);
  }
  let layers, renderScene;
  try {
    ({ layers, renderScene } = await import(pathToFileURL(scenePath).href));
  } catch (e) {
    console.log(`D1: no - ${e.message}`);
    process.exit(1);
  }
  let bad = 0, total = 0;
  for (const layer of fixture.layers) {
    if (REFINED.has(layer.name)) {
      console.log(`--  ${layer.name} refined on purpose, not compared`);
      continue;
    }
    let firstDiff = null;
    for (const { w, h } of fixture.sizes) {
      total++;
      const fn = layers && layers[layer.name];
      const key = `${w}x${h}`;
      if (typeof fn !== "function") {
        bad++;
        firstDiff ||= `${key}: layer missing`;
        continue;
      }
      const out = fn(w, h, fixture.accent);
      if (typeof out !== "string") {
        bad++;
        firstDiff ||= `${key}: result not a string`;
        continue;
      }
      const diff = same(layer.markup[key], out);
      if (diff !== null) {
        bad++;
        firstDiff ||= `${key}: ${diff}`;
      }
    }
    console.log(firstDiff ? `NO  ${layer.name} ${firstDiff}` : `ok  ${layer.name}`);
  }
  if (REFINED.size > 0) {
    console.log("--  scene not compared: refined layers change it");
  } else if (typeof renderScene !== "function") {
    bad += fixture.sizes.length;
    total += fixture.sizes.length;
    console.log("NO  scene: renderScene is not exported");
  } else {
    let sceneBad = 0;
    for (const { w, h } of fixture.sizes) {
      total++;
      const key = `${w}x${h}`;
      const out = renderScene(w, h, fixture.accent);
      const diff = typeof out === "string" ? same(fixture.scene[key], out) : "result not a string";
      if (diff !== null) {
        bad++;
        sceneBad++;
        console.log(`NO  scene ${key}: ${diff}`);
      }
    }
    if (!sceneBad) console.log("ok  scene");
  }
  console.log(bad ? `D1: no - ${bad} of ${total} layer-sizes differ` : "D1: yes");
  process.exit(bad ? 1 : 0);
}

/** Compare one named fixture layer against src/scene/layers/<Name>.mjs default export. */
async function layerMode(name) {
  const layer = fixture.layers.find((l) => l.name === name);
  if (!layer) {
    console.log(`D1 ${name}: no - not an old layer`);
    process.exit(1);
  }
  const layerPath = join(root, "src/scene/layers", `${name}.mjs`);
  if (!existsSync(layerPath)) {
    console.log(`D1 ${name}: no - src/scene/layers/${name}.mjs is missing`);
    process.exit(1);
  }
  let fn;
  try {
    ({ default: fn } = await import(pathToFileURL(layerPath).href));
  } catch (e) {
    console.log(`D1 ${name}: no - ${e.message}`);
    process.exit(1);
  }
  let bad = 0;
  for (const { w, h } of fixture.sizes) {
    const key = `${w}x${h}`;
    const out = typeof fn === "function" ? fn(w, h, fixture.accent) : null;
    const diff = typeof out === "string" ? same(layer.markup[key], out) : "result not a string";
    console.log(diff === null ? `ok  ${name} ${key}` : `NO  ${name} ${key}: ${diff}`);
    if (diff !== null) bad++;
  }
  console.log(bad ? `D1 ${name}: no - ${bad} of ${fixture.sizes.length} sizes differ` : `D1 ${name}: yes`);
  process.exit(bad ? 1 : 0);
}

const layerIdx = process.argv.indexOf("--layer");
if (process.argv.includes("--selftest")) selftest();
else if (layerIdx !== -1) layerMode(process.argv[layerIdx + 1]);
else main();
