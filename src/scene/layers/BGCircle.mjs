/** BGCircle layer: (w, h, accent, home?) -> SVG markup string; `home` wraps the moon circle in a link. */
import { esc } from "../esc.mjs";

export default function BGCircle(w, h, accent, home) {
  const width = String(w);
  const height = String(h);
  const circle = `<circle cx="${width * 0.31}" cy="${height * 0.135}" r="${height * 0.075}" stroke="black" stroke-opacity="0.875" stroke-width="7.5" fill-opacity="${accent ? 0.5 : 1}" fill="${accent ? accent : "#fff"}"></circle>`;
  return `<svg class="BGCircle SVG" version="1.1" height="${height}" width="${width}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${typeof home === "string" && home !== "" ? `<a href="${esc(home)}">${circle}</a>` : circle}</svg>`;
}
