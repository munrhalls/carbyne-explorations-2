/** BGCaveLine layer. */
export default function BGCaveLine(w, h, accent) {
  const width = String(w);
  const height = String(h);
  return `<svg class="BGCaveLine SVG" version="1.1" height="${height}" width="${width}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M 0, 0 Q${width * 0.09} ${height * 0.45} ${width * 0.245} ${height * 0.75} L${width * 0.245} ${height * 0.8} L${width * 0.23715} ${height * 0.85} L${width * 0.237175} ${height * 0.975} L${width * 0.2375} ${height} " fill="none" stroke="#000" stroke-linejoin="round" stroke-width="${width / 12.5}"></path></svg>`;
}
