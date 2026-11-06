/** Starfield layer: generated three-depth star field drifting left on a navy sky. */
export default function BGanimStarDots(w, h, accent) {
  const TILE = w * 0.21;
  const H = h * 0.4;
  const r2 = (n) => Math.round(n * 100) / 100;

  /** mulberry32 seeded PRNG. */
  const rng = (seed) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /** n stars on a jittered grid inside [0,TILE) x [0,H]; returns circle markup for one tile. */
  const stars = (seed, n, rMin, rMax, fill, opacity, halo) => {
    const rand = rng(seed);
    const cols = Math.ceil(Math.sqrt((n * TILE) / H));
    const rows = Math.ceil(n / cols);
    const cw = TILE / cols;
    const ch = H / rows;
    let s = "";
    for (let i = 0; i < n; i++) {
      const cx = r2((i % cols + rand()) * cw);
      const cy = r2((Math.floor(i / cols) + rand()) * ch);
      const r = r2(rMin + rand() * (rMax - rMin));
      const f = Array.isArray(fill) ? fill[i % fill.length] : fill;
      const o = r2(opacity[0] + rand() * (opacity[1] - opacity[0]));
      if (halo) s += `<circle data-halo="1" cx="${cx}" cy="${cy}" r="${r2(r * 2.6)}" fill="#bcd0ff" fill-opacity="0.12"></circle>`;
      s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" fill-opacity="${o}"></circle>`;
    }
    return s;
  };

  /** One depth group: a tile of stars plus its copy shifted by TILE, looping left. */
  const group = (name, dur, tile) =>
    `<g data-depth="${name}"><animateTransform attributeName="transform" attributeType="XML" type="translate" from="0 0" to="${r2(-TILE)} 0" dur="${dur}s" repeatCount="indefinite"></animateTransform>${tile}${tile.replace(/cx="([\d.]+)"/g, (m, v) => `cx="${r2(Number(v) + TILE)}"`)}</g>`;

  const far = group("far", 90, stars(11, 64, 0.6, 1.0, "#fff", [0.5, 0.7]));
  const mid = group("mid", 50, stars(22, 28, 1.1, 1.6, "#dfe8ff", [0.7, 0.9]));
  const near = group("near", 28, stars(33, 7, 1.8, 2.4, ["#fff", "#ffe9c4"], [0.95, 1], true));

  return `<svg xmlns="http://www.w3.org/2000/svg" class="BGanimStarDots SVG" height="${h}" width="${w}"><svg x="0" y="${h * 0.6}" width="${TILE}" height="${H}"><defs><linearGradient id="CaveSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00001a"></stop><stop offset="1" stop-color="#000036"></stop></linearGradient></defs><rect width="100%" height="100%" fill="url(#CaveSky)"></rect>${far}${mid}${near}</svg></svg>`;
}
