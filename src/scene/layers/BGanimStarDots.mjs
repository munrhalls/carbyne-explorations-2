/** Starfield layer: scrolling star images. */
export default function BGanimStarDots(w, h, accent, starsUrl = "stars.png") {
  const width = String(w);
  const height = String(h);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="SVG" height="${height}" width="${width}"><svg x="${width * 0}" y="${height * 0.6}" width="${width * 0.21}" height="${height * 0.4}"><rect width="${width * 2}" height="${height * 0.4}" fill="url(#IMG__STARS)"><animateTransform attributeName="transform" attributeType="XML" type="translate" from="0" to="${-width * 0.3}" dur="15s" repeatCount="indefinite"></animateTransform></rect><pattern id="IMG__STARS" width="100%" height="100%"><image class="BGanimStarDots__path" href="${starsUrl}" x="0"></image><image class="BGanimStarDots__path" href="${starsUrl}" x="${width * 0.1}"></image><image class="BGanimStarDots__path" href="${starsUrl}" x="${width * 0.2}"></image><image class="BGanimStarDots__path" href="${starsUrl}" x="${width * 0.3}"></image><image class="BGanimStarDots__path" href="${starsUrl}" x="${width * 0.4}"></image></pattern></svg></svg>`;
}
