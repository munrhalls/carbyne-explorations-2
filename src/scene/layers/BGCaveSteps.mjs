/** BGCaveSteps layer: four equal-rise steps centred at 0.075w, sized from w only. */
export default function BGCaveSteps(w, h, accent) {
  const f = (n) => Math.round(n * 100) / 100;
  const r = w * 0.0095;
  const B = w * 0.05;
  const cx = w * 0.075;
  const widths = [B, B * 0.7, B * 0.35, B * 0.2];
  let rects = "";
  for (let i = 0; i < 4; i++) {
    const yTop = h - (i + 1) * r;
    const yBottom = h - i * r;
    const x = cx - widths[i] / 2;
    rects += `<rect class="BGCaveSteps__rectangle" x="${f(x)}" y="${f(yBottom - 0.65 * r)}" width="${f(widths[i])}" height="${f(0.65 * r)}" fill="#8d8db4"></rect>`;
    rects += `<rect class="BGCaveSteps__rectangle" x="${f(x)}" y="${f(yTop)}" width="${f(widths[i])}" height="${f(0.35 * r)}" fill="#fff"></rect>`;
  }
  return `<svg class="BGCaveSteps SVG" version="1.1" height="${h}" width="${w}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${rects}</svg>`;
}
