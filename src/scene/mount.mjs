/** Mounts the scene: draws it into #scene and redraws on resize. */
import { renderScene } from "./index.mjs";

const root = document.getElementById("scene");

function draw() {
  const w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  root.style.width = `${w}px`;
  root.style.height = `${h}px`;
  root.innerHTML = renderScene(w, h, root.dataset.accent ?? "", root.dataset.stars);
}

draw();
window.addEventListener("resize", draw);
