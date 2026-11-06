/** Mounts the scene: draws it into #scene and redraws on resize. */
import { renderScene } from "./index.mjs";

const app = document.querySelector(".App");
const scene = document.getElementById("scene");

const nav = document.querySelector("nav.river");
const items = [...nav.querySelectorAll("a")].map((a) => ({ label: a.textContent.trim(), color: a.dataset.color, href: a.getAttribute("href") }));
const current = nav.querySelector('a[aria-current="page"]');
const active = current ? current.textContent.trim() : "";

function draw() {
  const w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  app.style.width = `${w}px`;
  app.style.height = `${h}px`;
  const phase = (Date.now() / 1000) % 360;
  scene.innerHTML = renderScene(w, h, scene.dataset.accent ?? "", { starsUrl: scene.dataset.stars, items, active, home: scene.dataset.home, phase });
}

draw();
document.documentElement.classList.add("has-scene");
window.addEventListener("resize", draw);
