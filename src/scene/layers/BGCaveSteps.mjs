/** BGCaveSteps layer. */
export default function BGCaveSteps(w, h, accent) {
  const width = String(w);
  const height = String(h);
  return `<svg class="BGCaveSteps SVG" version="1.1" height="${height}" width="${width}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect class="BGCaveSteps__rectangle" x="${width * 0.05}" y="${height * 0.98}" width="${width * 0.05}" height="${width * 0.0125}" fill="#fff"></rect><rect class="BGCaveSteps__rectangle" x="${width * 0.05875}" y="${height * 0.9625}" width="${width * 0.035}" height="${width * 0.0085}" fill="#fff"></rect><rect class="BGCaveSteps__rectangle" x="${width * 0.0675}" y="${height * 0.947975}" width="${width * 0.0175}" height="${width * 0.006}" fill="#fff"></rect><rect class="BGCaveSteps__rectangle" x="${width * 0.0715}" y="${height * 0.9375}" width="${width * 0.01}" height="${width * 0.003}" fill="#fff"></rect></svg>`;
}
