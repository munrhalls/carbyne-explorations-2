/** River menu labels: one link per item, each drifting along the river and pausing on hover or focus. `active` bolds the current page's label; `phase` (seconds) keeps the drift continuous across redraws. */
import { esc } from "../esc.mjs";

const PERIOD = 140; // seconds for one lap of the river

const DEFAULT_ITEMS = [
  { label: "Effectiveness", color: "#2e38ff" },
  { label: "Meditation", color: "orchid" },
  { label: "Music", color: "gold" },
  { label: "Poems", color: "darkblue" },
];

/** The river the labels follow, as one SVG path in px. */
function riverPath(w, h) {
  const p = (x, y) => `${+(w * x).toFixed(1)} ${+(h * y).toFixed(1)}`;
  return (
    `M${p(1, 0)} L${p(0.9890859481582538, 0.05176151761517614)}` +
    ` Q${p(0.77207366984993179, 0.082113821138211)} ${p(0.6207366984993179, 0.052113821138211)}` +
    ` L${p(0.39154160982264663, 0.03517615176151762)} L${p(0.296043656207367, 0.04533062330623306)}` +
    ` L${p(0.19781718963165076, 0.04502168021680217)}` +
    ` Q${p(0.1206139154160982, 0.04959349593495936)} ${p(0.1406139154160982, 0.064959349593495936)}` +
    ` Q${p(0.05594815825375171, 0.25799457994579946)} ${p(0.04594815825375171, 0.5799457994579946)}` +
    ` L${p(0.03957708049113233, 0.7967479674796748)} L${p(0.014106412005457026, 0.9227642276422764)}`
  );
}

export default function BGNavigationalRiverButtons(
  w,
  h,
  accent,
  items = DEFAULT_ITEMS,
  active = "",
  phase = 0
) {
  const path = riverPath(w, h);
  const n = items.length;
  return items
    .map((item, i) => {
      const delay = (-(i * PERIOD) / n - phase).toFixed(2);
      const style = `--c:${esc(item.color || "#fff")};offset-path:path('${path}');animation-duration:${PERIOD}s;animation-delay:${delay}s`;
      const cls = item.label === active ? "RiverLabel RiverLabel--active" : "RiverLabel";
      const label = `<g class="${cls}" style="${style}"><circle r="3.5"></circle><text x="12" y="5">${esc(item.label)}</text></g>`;
      return typeof item.href === "string" && item.href !== ""
        ? `<a href="${esc(item.href)}">${label}</a>`
        : label;
    })
    .join("");
}
