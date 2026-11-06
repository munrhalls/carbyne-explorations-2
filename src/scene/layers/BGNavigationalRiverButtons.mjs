/** River menu labels: animated buttons riding the river path, one per item; `active` enlarges the matching label, `phase` shifts the flow. */
import { esc } from "../esc.mjs";

const DEFAULT_ITEMS = [
  { label: "Effectiveness", color: "#2e38ff" },
  { label: "Music", color: "gold" },
  { label: "Practical meditation", color: "orchid" },
  { label: "SWFER", color: "green" },
  { label: "Learning skills", color: "darkkhaki" },
  { label: "Workflow skills", color: "teal" },
  { label: "Book choices", color: "brown" },
  { label: "Exploring code", color: "lightblue" },
  { label: "My programming works", color: "lightgreen" },
  { label: "My poems", color: "darkblue" },
];

function riverButton(width, height, { color, text, href, timeDistance, active, phase }) {
  const content = active.toUpperCase().trim();
  const offset = `${10 * timeDistance + Math.ceil(text.length) / 3}`;
  const tspans = text?.split(" ");
  const fontSize =
    text?.toUpperCase()?.trim() === content ? "1.75rem" : "1.25rem";
  const textEl = `<text class="BGNavigationalRiverButton__text" style="filter:drop-shadow(-0 0 4px ${esc(color)});text-shadow:1px 3px 7px ${esc(color)};font-size:${fontSize}" fill="#fff" textLength="2.5rem" lengthAdjust="spacingAndGlyphs" dx="0" dy="-20">${tspans
    .map(
      (textPart) =>
        `<tspan dy="${tspans.length * 6}" x="-5" class="BGNavigationalRiverButton__text__tspan">${esc(textPart)}</tspan>`
    )
    .join("")}<animateMotion dur="360s" begin="${-offset * 3 - phase}" repeatCount="indefinite" path="M${width} ${height * 0.0}
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
        "></animateMotion></text>`;
  return `<svg class="BGNavigationalRiverButton" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${typeof href === "string" && href !== "" ? `<a href="${esc(href)}">${textEl}</a>` : textEl}</svg>`;
}

export default function BGNavigationalRiverButtons(
  w,
  h,
  accent,
  items = DEFAULT_ITEMS,
  active = "",
  phase = 0
) {
  const width = String(w);
  const height = String(h);
  return items.map((item, index) => {
    let timeDistance = index;
    if (index === 0) {
      timeDistance = 0;
    }
    return riverButton(width, height, {
      text: item.label,
      color: item.color || 0,
      href: item.href,
      timeDistance,
      active,
      phase,
    });
  }).join("");
}
