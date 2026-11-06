/** Title layer: "carbyne / Explorations" along two curves. */
const MIN_BASELINE = 64;

/** `d` of a straight baseline, extended equally at both ends to at least MIN_BASELINE. */
function baseline(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const extra = Math.max(0, (MIN_BASELINE - len) / 2);
  const ux = dx / len, uy = dy / len;
  return `M${x1 - ux * extra} ${y1 - uy * extra} \n          L ${x2 + ux * extra} ${y2 + uy * extra} \n          `;
}

export default function AppTitle(w, h, accent) {
  const width = String(w);
  const height = String(h);
  return `<svg class="AppTitle SVG" version="1.1" height="${height}" width="${width}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path id="curve1" d="${baseline(width * 0.4943253467843632, height * 0.2247371273712737, width * 0.6355611601513241, height * 0.21441192411924118)}" fill="transparent"></path><text class="AppTitle__textOne" width="500" fill="#000"><textPath alignment-baseline="bottom" xlink:href="#curve1" fill="#aaa">carbyne</textPath></text><path id="curve2" d="M${width * 0.4005422446406053} ${height * 0.1942818428184282} 
          L ${width * 0.8612862547288777} ${height * 0.149521138211382114} 
          " fill="transparent"></path><text class="AppTitle__textTwo"><textPath alignment-baseline="top" xlink:href="#curve2" fill="#414141">Explorations</textPath></text></svg>`;
}
