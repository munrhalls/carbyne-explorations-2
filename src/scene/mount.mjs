/** Mounts the scene: draws it into #scene and redraws on resize. */
import { renderScene } from "./index.mjs";

const app = document.querySelector(".App");
const scene = document.getElementById("scene");

function draw() {
  const w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  app.style.width = `${w}px`;
  app.style.height = `${h}px`;
  scene.innerHTML = renderScene(w, h, scene.dataset.accent ?? "", scene.dataset.stars);
}

draw();
window.addEventListener("resize", draw);
