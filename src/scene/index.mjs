/** Scene layer registry: old layer name -> layer function, in old drawing order. */
import BGanimStarDots from "./layers/BGanimStarDots.mjs";
import BGblanket from "./layers/BGblanket.mjs";
import BGCaveLine from "./layers/BGCaveLine.mjs";
import BGClepsidreBridgeway from "./layers/BGClepsidreBridgeway.mjs";
import BGCaveLineFill from "./layers/BGCaveLineFill.mjs";
import BGCaveSteps from "./layers/BGCaveSteps.mjs";
import BGCaveDots from "./layers/BGCaveDots.mjs";
import BGTitleLayerLine from "./layers/BGTitleLayerLine.mjs";
import BGblanketOutline from "./layers/BGblanketOutline.mjs";
import AppTitle from "./layers/AppTitle.mjs";
import BGUpholderConnectorXer from "./layers/BGUpholderConnectorXer.mjs";
import BGNavigationalAntennae from "./layers/BGNavigationalAntennae.mjs";
import BGNavigationalRiver from "./layers/BGNavigationalRiver.mjs";
import BGCircle from "./layers/BGCircle.mjs";
import BGNavigationalRiverButtons from "./layers/BGNavigationalRiverButtons.mjs";

export const layers = {
  BGanimStarDots,
  BGblanket,
  BGCaveLine,
  BGClepsidreBridgeway,
  BGCaveLineFill,
  BGCaveSteps,
  BGCaveDots,
  BGTitleLayerLine,
  BGblanketOutline,
  AppTitle,
  BGUpholderConnectorXer,
  BGNavigationalAntennae,
  BGNavigationalRiver,
  BGCircle,
  BGNavigationalRiverButtons,
};

/** Whole scene in old drawing order and nesting, as one markup string; `opts` = { starsUrl, items, active, home, phase }. */
export function renderScene(w, h, accent, opts = {}) {
  return (
    BGanimStarDots(w, h, accent, opts.starsUrl) +
    BGblanket(w, h, accent) +
    BGCaveLine(w, h, accent) +
    BGClepsidreBridgeway(w, h, accent) +
    BGCaveLineFill(w, h, accent) +
    BGCaveSteps(w, h, accent) +
    BGCaveDots(w, h, accent) +
    BGTitleLayerLine(w, h, accent) +
    BGblanketOutline(w, h, accent) +
    '<div class="BGcontentContainer"></div>' +
    AppTitle(w, h, accent) +
    BGUpholderConnectorXer(w, h, accent) +
    BGNavigationalAntennae(w, h, accent) +
    BGNavigationalRiver(
      w,
      h,
      accent,
      BGCircle(w, h, accent, opts.home) +
        BGNavigationalRiverButtons(
          w,
          h,
          accent,
          opts.items,
          opts.active,
          opts.phase,
        ),
    )
  );
}
