/** River menu labels: ten animated buttons riding the river path. */
const LABELS = [
  "Effectiveness",
  "Music",
  "Practical meditation",
  "SWFER",
  "Learning skills",
  "Workflow skills",
  "Book choices",
  "Exploring code",
  "My programming works",
  "My poems",
];
const COLORS = [
  "#2e38ff",
  "gold",
  "orchid",
  "green",
  "darkkhaki",
  "teal",
  "brown",
  "lightblue",
  "lightgreen",
  "darkblue",
];

function riverButton(width, height, { color, text, timeDistance }) {
  const content = ""; // the selected river item; wired when pages exist
  const offset = `${10 * timeDistance + Math.ceil(text.length) / 3}`;
  const tspans = text?.split(" ");
  const fontSize =
    text?.toUpperCase()?.trim() === content ? "1.75rem" : "1.25rem";
  return `<svg class="BGNavigationalRiverButton" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><text class="BGNavigationalRiverButton__text" style="filter:drop-shadow(-0 0 4px ${color});text-shadow:1px 3px 7px ${color};font-size:${fontSize}" fill="#fff" textLength="2.5rem" lengthAdjust="spacingAndGlyphs" dx="0" dy="-20">${tspans
    .map(
      (textPart) =>
        `<tspan dy="${tspans.length * 6}" x="-5" class="BGNavigationalRiverButton__text__tspan">${textPart}</tspan>`
    )
    .join("")}<animateMotion dur="360s" begin="${-offset * 3}" repeatCount="indefinite" path="M${width} ${height * 0.0}
            L ${width * 0.9890859481582538} ${height * 0.05176151761517614}
            Q ${width * 0.77207366984993179} ${height * 0.082113821138211}
            ${width * 0.6207366984993179} ${height * 0.052113821138211}
            L ${width * 0.39154160982264663} ${height * 0.03517615176151762}

            L ${width * 0.296043656207367} ${height * 0.04533062330623306}
            L ${width * 0.19781718963165076} ${height * 0.04502168021680217}
            Q ${width * 0.1206139154160982} ${height * 0.04959349593495936}
            ${width * 0.1406139154160982} ${height * 0.064959349593495936}

            Q ${width * 0.05594815825375171} ${height * 0.25799457994579946}
            ${width * 0.04594815825375171} ${height * 0.5799457994579946}
            L ${width * 0.03957708049113233} ${height * 0.7967479674796748}
            L ${width * 0.014106412005457026} ${height * 0.9227642276422764}
        "></animateMotion></text></svg>`;
}

export default function BGNavigationalRiverButtons(w, h, accent) {
  const width = String(w);
  const height = String(h);
  return LABELS.map((el, index) => {
    let timeDistance = index;
    if (index === 0) {
      timeDistance = 0;
    }
    return riverButton(width, height, {
      text: el,
      color: COLORS[index] || 0,
      timeDistance,
    });
  }).join("");
}
