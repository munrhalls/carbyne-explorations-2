/** BGCircle layer: (w, h, accent) -> SVG markup string. */
export default function BGCircle(w, h, accent) {
  const width = String(w);
  const height = String(h);
  return `<svg class="BGCircle SVG" version="1.1" height="${height}" width="${width}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><circle cx="${width * 0.31}" cy="${height * 0.135}" r="${height * 0.075}" stroke="black" stroke-opacity="0.875" stroke-width="7.5" fill-opacity="${accent ? 0.5 : 1}" fill="${accent ? accent : "#fff"}"></circle></svg>`;
}
