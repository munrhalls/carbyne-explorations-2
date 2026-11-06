/** BGTitleLayerLine layer. */
export default function BGTitleLayerLine(w, h, accent) {
  const width = String(w);
  const height = String(h);
  return `<svg class="BGTitleLayerLine SVG" version="1.1" height="${height}" width="${width}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M ${width * 0.35} ${height * 0.22} Q${width * 0.6} ${height * 0.24} ${width * 0.6} ${height * 0.23} Q${width * 0.6} ${height * 0.185} ${width} ${height * 0.15447154471544716} " stroke="#333" stroke-width="3" stroke-linejoin="round"></path></svg>`;
}
