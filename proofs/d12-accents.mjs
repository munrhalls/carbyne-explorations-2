// D12 proof: every river accent is a #rrggbb hex, readable on black
// (contrast >= 4.5) and at least 40 hue degrees from every other river accent.
// Run: node proofs/d12-accents.mjs

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const db = new DatabaseSync(join(root, "content/blog.db"), { readOnly: true });
const river = db
  .prepare("SELECT slug, label, accent FROM pages WHERE position IS NOT NULL ORDER BY position")
  .all();
db.close();

/** Linearised sRGB channel. */
function lin(c) {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG contrast ratio of #rrggbb against black. */
function contrast(hex) {
  const r = lin(parseInt(hex.slice(1, 3), 16) / 255);
  const g = lin(parseInt(hex.slice(3, 5), 16) / 255);
  const b = lin(parseInt(hex.slice(5, 7), 16) / 255);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05) / 0.05;
}

// CSS named colours -> #rrggbb, so a non-hex accent can still be judged for
// contrast (it renders in the browser even though it is not a hex string).
const NAMED = {
  aliceblue:"#f0f8ff",antiquewhite:"#faebd7",aqua:"#00ffff",aquamarine:"#7fffd4",
  azure:"#f0ffff",beige:"#f5f5dc",bisque:"#ffe4c4",black:"#000000",
  blanchedalmond:"#ffebcd",blue:"#0000ff",blueviolet:"#8a2be2",brown:"#a52a2a",
  burlywood:"#deb887",cadetblue:"#5f9ea0",chartreuse:"#7fff00",chocolate:"#d2691e",
  coral:"#ff7f50",cornflowerblue:"#6495ed",cornsilk:"#fff8dc",crimson:"#dc143c",
  cyan:"#00ffff",darkblue:"#00008b",darkcyan:"#008b8b",darkgoldenrod:"#b8860b",
  darkgray:"#a9a9a9",darkgrey:"#a9a9a9",darkgreen:"#006400",darkkhaki:"#bdb76b",
  darkmagenta:"#8b008b",darkolivegreen:"#556b2f",darkorange:"#ff8c00",
  darkorchid:"#9932cc",darkred:"#8b0000",darksalmon:"#e9967a",
  darkseagreen:"#8fbc8f",darkslateblue:"#483d8b",darkslategray:"#2f4f4f",
  darkslategrey:"#2f4f4f",darkturquoise:"#00ced1",darkviolet:"#9400d3",
  deeppink:"#ff1493",deepskyblue:"#00bfff",dimgray:"#696969",dimgrey:"#696969",
  dodgerblue:"#1e90ff",firebrick:"#b22222",floralwhite:"#fffaf0",
  forestgreen:"#228b22",fuchsia:"#ff00ff",gainsboro:"#dcdcdc",
  ghostwhite:"#f8f8ff",gold:"#ffd700",goldenrod:"#daa520",gray:"#808080",
  grey:"#808080",green:"#008000",greenyellow:"#adff2f",honeydew:"#f0fff0",
  hotpink:"#ff69b4",indianred:"#cd5c5c",indigo:"#4b0082",ivory:"#fffff0",
  khaki:"#f0e68c",lavender:"#e6e6fa",lavenderblush:"#fff0f5",
  lawngreen:"#7cfc00",lemonchiffon:"#fffacd",lightblue:"#add8e6",
  lightcoral:"#f08080",lightcyan:"#e0ffff",lightgoldenrodyellow:"#fafad2",
  lightgray:"#d3d3d3",lightgrey:"#d3d3d3",lightgreen:"#90ee90",
  lightpink:"#ffb6c1",lightsalmon:"#ffa07a",lightseagreen:"#20b2aa",
  lightskyblue:"#87cefa",lightslategray:"#778899",lightslategrey:"#778899",
  lightsteelblue:"#b0c4de",lightyellow:"#ffffe0",lime:"#00ff00",
  limegreen:"#32cd32",linen:"#faf0e6",magenta:"#ff00ff",maroon:"#800000",
  mediumaquamarine:"#66cdaa",mediumblue:"#0000cd",mediumorchid:"#ba55d3",
  mediumpurple:"#9370db",mediumseagreen:"#3cb371",mediumslateblue:"#7b68ee",
  mediumspringgreen:"#00fa9a",mediumturquoise:"#48d1cc",
  mediumvioletred:"#c71585",midnightblue:"#191970",mintcream:"#f5fffa",
  mistyrose:"#ffe4e1",moccasin:"#ffe4b5",navajowhite:"#ffdead",navy:"#000080",
  oldlace:"#fdf5e6",olive:"#808000",olivedrab:"#6b8e23",orange:"#ffa500",
  orangered:"#ff4500",orchid:"#da70d6",palegoldenrod:"#eee8aa",
  palegreen:"#98fb98",paleturquoise:"#afeeee",palevioletred:"#db7093",
  papayawhip:"#ffefd5",peachpuff:"#ffdab9",peru:"#cd853f",pink:"#ffc0cb",
  plum:"#dda0dd",powderblue:"#b0e0e6",purple:"#800080",rebeccapurple:"#663399",
  red:"#ff0000",rosybrown:"#bc8f8f",royalblue:"#4169e1",saddlebrown:"#8b4513",
  salmon:"#fa8072",sandybrown:"#f4a460",seagreen:"#2e8b57",seashell:"#fff5ee",
  sienna:"#a0522d",silver:"#c0c0c0",skyblue:"#87ceeb",slateblue:"#6a5acd",
  slategray:"#708090",slategrey:"#708090",snow:"#fffafa",springgreen:"#00ff7f",
  steelblue:"#4682b4",tan:"#d2b48c",teal:"#008080",thistle:"#d8bfd8",
  tomato:"#ff6347",turquoise:"#40e0d0",violet:"#ee82ee",wheat:"#f5deb3",
  white:"#ffffff",whitesmoke:"#f5f5f5",yellow:"#ffff00",yellowgreen:"#9acd32",
};

/** HSL hue in degrees (0..360) from #rrggbb. */
function hue(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return ((h * 60) + 360) % 360;
}

let bad = 0;
const rows = river.map((row) => {
  const accent = String(row.accent ?? "");
  const hex = /^#[0-9a-fA-F]{6}$/.test(accent);
  return { ...row, accent, hex, h: hex ? hue(accent) : null, c: hex ? contrast(accent) : null };
});

for (const row of rows) {
  if (!row.hex) {
    const problems = ["[hex] not a #rrggbb hex"];
    const named = NAMED[row.accent.toLowerCase()];
    if (named) {
      const c = contrast(named);
      if (c < 4.5) problems.push(`[contrast] ${c.toFixed(1)} < 4.5`);
    }
    bad++;
    console.log(`NO  ${row.label} ${row.accent}: ${problems.join(" ")}`);
    continue;
  }
  const problems = [];
  if (row.c < 4.5) problems.push(`[contrast] ${row.c.toFixed(1)} < 4.5`);
  let nearest = null;
  for (const other of rows) {
    if (other === row || !other.hex) continue;
    const d = Math.min(Math.abs(row.h - other.h), 360 - Math.abs(row.h - other.h));
    if (!nearest || d < nearest.d) nearest = { label: other.label, d };
  }
  if (nearest && nearest.d < 40) {
    problems.push(`[hue] ${Math.round(nearest.d)} degrees from ${nearest.label}, want >= 40`);
  }
  if (problems.length) {
    bad++;
    console.log(`NO  ${row.label} ${row.accent}: ${problems.join(" ")}`);
  } else {
    console.log(`ok  ${row.label} ${row.accent}: contrast ${row.c.toFixed(1)}, hue ${Math.round(row.h)}`);
  }
}

console.log(bad ? "D12: no" : "D12: yes");
process.exit(bad ? 1 : 0);
