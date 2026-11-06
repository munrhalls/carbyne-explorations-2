/** BGblanket layer. */
export default function BGblanket(w, h, accent) {
  const width = String(w);
  const height = String(h);
  return `<svg class="BGblanket SVG" version="1.1" height="${height}" width="${width}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M 0 0 M 0, ${height} L 0, 0 L ${width}, 0 L ${width}, ${height / 6.5} Q ${width * 0.75}, ${height / 10} ${width * 0.6}, ${height / 8.6} Q ${width * 0.5}, ${height / 7.5} ${width * 0.325}, ${height / 9} Q ${width * 0.1}, ${height / 4.5} ${width * 0.15}, ${height / 2.25} L ${width * 0.15}, ${height / 2.25} L ${width * 0.1}, ${height / 1.25} L ${width * 0.35}, ${height / 0.5} " fill="#000" stroke="${accent ? accent : "#000"}" stroke-opacity="0.8275" stroke-linejoin="round" stroke-width="8"></path></svg>`;
}
