/** Starfield layer: scrolling star images. */
const STARS = "stars.png";
export default function BGanimStarDots(w, h, accent) {
  const width = String(w);
  const height = String(h);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="SVG" height="${height}" width="${width}"><svg x="${width * 0}" y="${height * 0.6}" width="${width * 0.21}" height="${height * 0.4}"><rect width="${width * 2}" height="${height * 0.4}" fill="url(#IMG__STARS)"><animateTransform attributeName="transform" attributeType="XML" type="translate" from="0" to="${-width * 0.3}" dur="15s" repeatCount="indefinite"></animateTransform></rect><pattern id="IMG__STARS" width="100%" height="100%"><image class="BGanimStarDots__path" href="${STARS}" x="0"></image><image class="BGanimStarDots__path" href="${STARS}" x="${width * 0.1}"></image><image class="BGanimStarDots__path" href="${STARS}" x="${width * 0.2}"></image><image class="BGanimStarDots__path" href="${STARS}" x="${width * 0.3}"></image><image class="BGanimStarDots__path" href="${STARS}" x="${width * 0.4}"></image></pattern></svg></svg>`;
}
