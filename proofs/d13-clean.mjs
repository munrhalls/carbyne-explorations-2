// D13 proof: code and rules file agree - every class/id in site.css is used
// by the markup, no empty rule blocks, every REFINED layer and every proof
// file is named in AGENTS.md, and AGENTS.md no longer says "verbatim".
// Run: node proofs/d13-clean.mjs

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const css = readFileSync(join(root, "public/css/site.css"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");
const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
const d1 = readFileSync(join(root, "proofs/d1-art.mjs"), "utf8");

/** Every .mjs source under dir, recursively, skipping vendor and admin. */
function* sources(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "vendor" || e.name === "admin") continue;
      yield* sources(p);
    } else if (e.name.endsWith(".mjs")) {
      yield p;
    }
  }
}

const markup = [...sources(join(root, "src"))]
  .map((p) => readFileSync(p, "utf8"))
  .join("\n");

// --- css-dead: every .class / #id selector used as a plain string in src ---
const names = new Set();
{
  // Only the text before each "{" is a selector: hex colours like #fff in
  // declarations, url(...) contents and @font-face bodies never reach it.
  for (const m of css.matchAll(/(^|[{}])([^{}]*)\{/gm)) {
    for (const s of m[2].matchAll(/(?<![\w-])([.#])([A-Za-z_][\w-]*)/g)) {
      names.add(s[1] + s[2]);
    }
  }
}
const dead = [...names].filter((n) => !markup.includes(n.slice(1)));

// --- css-empty: rule blocks holding only whitespace ---
const empty = [];
for (const m of css.matchAll(/([^{}]+)\{\s*\}/g)) {
  const sel = m[1].trim().split("\n").pop().trim();
  if (sel) empty.push(sel);
}

// --- doc: REFINED names, proof file names, and "verbatim" in AGENTS.md ---
const docBad = [];
const refined = d1.match(/REFINED\s*=\s*new Set\(\[([^\]]*)\]/);
for (const m of (refined ? refined[1] : "").matchAll(/"([^"]+)"/g)) {
  if (!agents.includes(m[1])) docBad.push(`refined layer ${m[1]} not in AGENTS.md`);
}
for (const f of readdirSync(join(root, "proofs"))) {
  if (/^d.*\.mjs$/.test(f) && !agents.includes(f)) {
    docBad.push(`${f} not in AGENTS.md`);
  }
}
if (/\bverbatim\b/.test(agents)) docBad.push('AGENTS.md says "verbatim"');

let bad = 0;
const report = (label, problems) => {
  if (problems.length) {
    bad++;
    console.log(`NO  ${label}: ${problems.join(", ")}`);
  } else {
    console.log(`ok  ${label}`);
  }
};
report("css-dead", dead);
report("css-empty", empty);
report("doc", docBad);

console.log(bad ? "D13: no" : "D13: yes");
process.exit(bad ? 1 : 0);
