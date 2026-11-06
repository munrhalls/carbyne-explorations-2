/** Antenna line layer. */
export default function BGNavigationalAntennae(w, h, accent) {
  const width = String(w);
  const height = String(h);
  return `<svg class="AppTitle SVG" version="1.1" height="${height}" width="${width}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M${width * 0.08594815825375171} ${height * 0.8509485094850948}
          L ${width * 0.0791268758526603} ${height * 0.7994579945799458}
          
          L ${width * 0.2155525238744884} ${height * 0.23718157181571815}
        " stroke="${accent ? accent : "#fff"}" stroke-width="1"></path></svg>`;
}
